#!/usr/bin/env node
/**
 * resume-context.js  —  Antigravity PreInvocation hook
 *
 * PURPOSE
 * -------
 * When Antigravity relaunches after a crash, power loss, or PC restart, the
 * conversation history is often missing from the dashboard. The model then has
 * no idea what it was doing, and the user has to manually explain every time.
 *
 * This hook fixes that. Before the FIRST model call of every execution, it
 * reads the durable on-disk state (.ai/PROGRESS.md, git log, and the crash
 * journal written by checkpoint.js) and injects a compact resume brief as an
 * ephemeral system message. The model wakes up already knowing:
 *
 *   - which project this is and what the rules are
 *   - which task it was working on and whether it finished
 *   - what git says actually happened (the only source that cannot lie)
 *   - what its very next action should be
 *
 * CONTRACT (see agy-customizations/docs/hooks.md)
 *   stdin : JSON  { conversationId, workspacePaths, modelName, invocationNum, ... }
 *   stdout: JSON  { injectSteps: [ { ephemeralMessage: "..." } ] }
 *
 * SAFETY
 * ------
 * This hook runs inside the agent loop and blocks it. A crash or a non-JSON
 * stdout here would break every Antigravity session in this workspace. So the
 * entire body is wrapped: on ANY failure it prints `{}` and exits 0. A broken
 * resume brief must never be able to stop the user from working.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

// ---------------------------------------------------------------------------
// Hard safety rails
// ---------------------------------------------------------------------------

const EMPTY = '{}';
const MAX_BRIEF_CHARS = 6000; // keep the injected message small
let finished = false;

/** Print exactly one JSON object, exactly once, then exit 0. */
function emit(obj) {
  if (finished) return;
  finished = true;
  let out = EMPTY;
  try {
    out = JSON.stringify(obj);
    if (typeof out !== 'string' || out.length === 0) out = EMPTY;
  } catch {
    out = EMPTY;
  }
  try {
    process.stdout.write(out);
  } catch {
    /* nothing left to do */
  }
  process.exit(0);
}

// Never let an unexpected throw produce non-JSON output.
process.on('uncaughtException', () => emit({}));
process.on('unhandledRejection', () => emit({}));

// Absolute deadline. The hook default timeout is 30s; finish well before that.
const watchdog = setTimeout(() => emit({}), 8000);
watchdog.unref?.();

// ---------------------------------------------------------------------------
// Small helpers, each individually failure-tolerant
// ---------------------------------------------------------------------------

/** Repo root = two levels up from .agents/scripts/ */
const ROOT = path.resolve(__dirname, '..', '..');

function readTextSafe(absPath, maxBytes = 400 * 1024) {
  try {
    const st = fs.statSync(absPath);
    if (!st.isFile()) return null;
    if (st.size > maxBytes) {
      const fd = fs.openSync(absPath, 'r');
      try {
        const buf = Buffer.alloc(maxBytes);
        fs.readSync(fd, buf, 0, maxBytes, 0);
        return buf.toString('utf8');
      } finally {
        fs.closeSync(fd);
      }
    }
    return fs.readFileSync(absPath, 'utf8');
  } catch {
    return null;
  }
}

function git(args) {
  try {
    return execFileSync('git', args, {
      cwd: ROOT,
      encoding: 'utf8',
      timeout: 4000,
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return null;
  }
}

/** Strip a leading UTF-8 BOM so the first line parses correctly. */
function stripBom(s) {
  return s && s.charCodeAt(0) === 0xfeff ? s.slice(1) : s;
}

// ---------------------------------------------------------------------------
// PROGRESS.md parsing
// ---------------------------------------------------------------------------
//
// Task rows look like:
//   | GEMINI-1  Asset inventory | Gemini | ⬜ PENDING | — | notes |
//   | CLAUDE-1  Vite config     | Claude | ✅ DONE    | abc123 | |
//
// We only need the task id and the status marker, so the parser stays
// deliberately loose: it will not break if columns are added or reworded.

const STATUS = [
  { key: 'DONE', re: /✅/ },
  { key: 'IN_PROGRESS', re: /🟨/ },
  { key: 'BLOCKED', re: /❌/ },
  { key: 'SKIPPED', re: /⏭/ },
  { key: 'PENDING', re: /⬜/ },
];

function parseProgress(md) {
  const result = {
    found: false,
    phase: null,
    tasks: [],
    counts: { DONE: 0, IN_PROGRESS: 0, BLOCKED: 0, SKIPPED: 0, PENDING: 0 },
    blockersText: null,
  };
  if (!md) return result;
  result.found = true;

  const lines = md.split(/\r?\n/);

  for (const raw of lines) {
    const line = raw.trim();

    // Current phase line, e.g. "**বর্তমান পর্যায়:** Day 1 ..."
    if (!result.phase && /বর্তমান পর্যায়|Current phase/i.test(line)) {
      const v = line.replace(/\*\*/g, '').split(':').slice(1).join(':').trim();
      if (v) result.phase = v.slice(0, 200);
    }

    if (!line.startsWith('|')) continue;

    // Task id: CLAUDE-3 / GEMINI-12 / BULK-7
    // BULK is the model-neutral slot (Ling / MiniMax / Nemotron / any).
    // DEEPSEEK kept for backward compatibility with older PROGRESS.md tables.
    const idMatch = line.match(/\b(CLAUDE|GEMINI|BULK|DEEPSEEK)-(\d{1,3})\b/i);
    if (!idMatch) continue;

    let status = null;
    for (const s of STATUS) {
      if (s.re.test(line)) {
        status = s.key;
        break;
      }
    }
    if (!status) continue;

    const cells = line.split('|').map((c) => c.trim());
    const title = (cells[1] || '').replace(/\s+/g, ' ').slice(0, 110);
    const commit = (cells[4] || '').replace(/[—–-]/g, '').trim();

    result.counts[status] = (result.counts[status] || 0) + 1;
    result.tasks.push({
      id: `${idMatch[1].toUpperCase()}-${idMatch[2]}`,
      model: idMatch[1].toUpperCase(),
      num: parseInt(idMatch[2], 10),
      status,
      title,
      commit: commit && /^[0-9a-f]{6,40}$/i.test(commit) ? commit : null,
    });
  }

  // Blockers section content (if any real text beyond the placeholder).
  // Note: individual blocker entries are written as `### [date] TASK — BLOCKED`,
  // so level-3 headings must NOT terminate the section. Only a new level-1/2
  // heading or a horizontal rule ends it.
  const bIdx = lines.findIndex((l) => /^#{1,3}\s*(🚧|Blockers)/i.test(l.trim()));
  if (bIdx !== -1) {
    const chunk = [];
    for (let i = bIdx + 1; i < lines.length && chunk.length < 30; i++) {
      const t = lines[i].trim();
      if (/^#{1,2}\s/.test(t) || /^---+\s*$/.test(t)) break;
      // Drop the "how to report a blocker" quoted instructions; they are
      // template noise, not an actual blocker.
      if (t.startsWith('>')) continue;
      chunk.push(lines[i]);
    }
    const text = chunk.join('\n').trim();
    const isPlaceholder =
      !text ||
      /এখনো কিছু নেই|none yet|no blockers/i.test(text) ||
      text.replace(/[>*\s`|_-]/g, '').length < 12;
    if (!isPlaceholder) result.blockersText = text.slice(0, 900);
  }

  return result;
}

/** First task that still needs work, per model, in numeric order. */
function nextActionable(tasks, model) {
  return (
    tasks
      .filter((t) => t.model === model && (t.status === 'PENDING' || t.status === 'IN_PROGRESS' || t.status === 'BLOCKED'))
      .sort((a, b) => {
        const rank = { IN_PROGRESS: 0, BLOCKED: 1, PENDING: 2 };
        return rank[a.status] - rank[b.status] || a.num - b.num;
      })[0] || null
  );
}

// ---------------------------------------------------------------------------
// Crash journal (written by checkpoint.js)
// ---------------------------------------------------------------------------

function readJournalTail(absPath, wanted = 6) {
  const txt = readTextSafe(absPath, 256 * 1024);
  if (!txt) return [];
  const out = [];
  const lines = txt.split(/\r?\n/).filter(Boolean);
  for (let i = lines.length - 1; i >= 0 && out.length < wanted; i--) {
    try {
      const o = JSON.parse(lines[i]);
      if (o && typeof o === 'object') out.push(o);
    } catch {
      /* skip a torn line — expected if power was cut mid-write */
    }
  }
  return out.reverse();
}

function readJson(absPath) {
  const txt = readTextSafe(absPath, 64 * 1024);
  if (!txt) return null;
  try {
    return JSON.parse(stripBom(txt));
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Brief builder
// ---------------------------------------------------------------------------

function buildBrief(payload) {
  const L = [];
  const push = (s) => L.push(s);

  const progressPath = path.join(ROOT, '.ai', 'PROGRESS.md');
  const progress = parseProgress(stripBom(readTextSafe(progressPath)));

  const branch = git(['rev-parse', '--abbrev-ref', 'HEAD']);
  const log = git(['log', '--oneline', '-8']);
  const dirty = git(['status', '--porcelain']);
  const tags = git(['tag', '--list', '--sort=-creatordate']);

  const last = readJson(path.join(ROOT, '.ai', 'state', 'last-session.json'));
  const journal = readJournalTail(path.join(ROOT, '.ai', 'state', 'journal.jsonl'), 6);

  const thisConv = payload && payload.conversationId ? String(payload.conversationId) : null;
  const resumedAfterInterruption =
    !!(last && last.conversationId && thisConv && last.conversationId !== thisConv);

  push('[AUTO-RESUME BRIEF — injected from disk, not from chat history]');
  push('');
  push('Project: eCommerce Go (WorkDo) SPA/PWA optimization — C:\\laragon\\www\\ecommercego');

  if (resumedAfterInterruption) {
    push('');
    push('⚠️ This is a NEW conversation, but unfinished work exists from an earlier');
    push('   session (previous conversation id: ' + String(last.conversationId).slice(0, 8) + '…).');
    push('   The chat history for that session may be missing from the dashboard.');
    push('   Everything you need is on disk — do NOT ask the user to re-explain.');
  }

  // --- state of play -------------------------------------------------------
  push('');
  push('── Where the work stands ──');
  if (progress.found) {
    const c = progress.counts;
    if (progress.phase) push('Phase: ' + progress.phase);
    push(
      `Tasks: ✅${c.DONE} done · 🟨${c.IN_PROGRESS} in progress · ❌${c.BLOCKED} blocked · ⬜${c.PENDING} pending`
    );

    const inProg = progress.tasks.filter((t) => t.status === 'IN_PROGRESS');
    if (inProg.length) {
      push('Left mid-flight: ' + inProg.map((t) => `${t.id} (${t.title})`).join(' · '));
    }

    for (const m of ['GEMINI', 'CLAUDE', 'BULK', 'DEEPSEEK']) {
      const n = nextActionable(progress.tasks, m);
      if (n) push(`Next for ${m}: ${n.id} [${n.status}] ${n.title}`);
    }
  } else {
    push('⚠️ .ai/PROGRESS.md not found or unreadable — read it yourself before acting.');
  }

  // --- git: the source that cannot lie ------------------------------------
  push('');
  push('── git (authoritative) ──');
  if (log) {
    push('branch: ' + (branch || '?'));
    push(log.split('\n').map((l) => '  ' + l).join('\n'));
    const dirtyCount = dirty ? dirty.split(/\r?\n/).filter(Boolean).length : 0;
    push(`uncommitted files: ${dirtyCount}`);
    if (dirtyCount > 0) {
      push('  ⚠️ Uncommitted changes exist. Something stopped before committing.');
      push('     Run `git status` and `git diff` and decide: finish it, or reset.');
    }
    if (tags) push('tags: ' + tags.split('\n').slice(0, 6).join(', '));
  } else {
    push('⚠️ git unavailable here. Do not start work without a restore point.');
  }

  // --- last observed activity ---------------------------------------------
  if (last || journal.length) {
    push('');
    push('── Last recorded activity ──');
    if (last) {
      if (last.at) push('last write: ' + last.at);
      if (last.task) push('declared task: ' + last.task);
      if (last.note) push('note: ' + String(last.note).slice(0, 200));
    }
    if (journal.length) {
      push('recent tool steps:');
      for (const j of journal) {
        const at = j.at ? String(j.at).replace('T', ' ').slice(5, 19) : '?';
        const tool = j.tool || '?';
        const err = j.error ? '  ERROR: ' + String(j.error).slice(0, 80) : '';
        push(`  ${at}  ${tool}${err}`);
      }
    }
  }

  // --- blockers ------------------------------------------------------------
  if (progress.blockersText) {
    push('');
    push('── 🚧 OPEN BLOCKER — read before doing anything ──');
    push(progress.blockersText);
  }

  // --- what to do next -----------------------------------------------------
  push('');
  push('── Your first three actions, in order ──');
  push('1. Read .ai/PROJECT_CONTEXT.md (rules: which folders are off-limits, why).');
  push('2. Read .ai/PROGRESS.md, then open .ai/<YOUR_MODEL>_TASKS.md and find your');
  push('   next numbered prompt. Work only on that number.');
  push('3. If git shows uncommitted changes above, reconcile them BEFORE new work.');
  push('');
  push('Rules that override any instinct to be helpful:');
  push('- Never touch app/ routes/ database/ vendor/ packages/ unless your task says so.');
  push('- If git log and PROGRESS.md disagree, git log is the truth. Fix PROGRESS.md.');
  push('- Update PROGRESS.md and commit after every task, or the next session loses it.');
  push('- Stuck? Write it into the Blockers section of PROGRESS.md, then stop. Do not');
  push('  improvise a fix on shared code.');

  let brief = L.join('\n');
  if (brief.length > MAX_BRIEF_CHARS) brief = brief.slice(0, MAX_BRIEF_CHARS) + '\n…(truncated)';
  return brief;
}

// ---------------------------------------------------------------------------
// stdin → decide → stdout
// ---------------------------------------------------------------------------

function handle(rawStdin) {
  let payload = {};
  try {
    if (rawStdin && rawStdin.trim()) payload = JSON.parse(stripBom(rawStdin.trim())) || {};
  } catch {
    payload = {}; // malformed payload is not a reason to fail
  }

  // Inject only on the first model call of an execution. Re-injecting on every
  // invocation would waste context and add nothing.
  const n = Number(payload.invocationNum);
  if (Number.isFinite(n) && n > 1) return emit({});

  // Only act inside this project.
  try {
    if (!fs.existsSync(path.join(ROOT, '.ai'))) return emit({});
  } catch {
    return emit({});
  }

  const brief = buildBrief(payload);
  if (!brief || brief.length < 40) return emit({});

  emit({ injectSteps: [{ ephemeralMessage: brief }] });
}

// Read stdin defensively: it may be a pipe, already closed, or never written.
(function readStdin() {
  let data = '';
  let settled = false;
  const done = () => {
    if (settled) return;
    settled = true;
    handle(data);
  };

  try {
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (c) => {
      if (data.length < 256 * 1024) data += c;
    });
    process.stdin.on('end', done);
    process.stdin.on('error', done);
    process.stdin.on('close', done);
    // If nothing arrives, proceed anyway rather than hanging the agent loop.
    const t = setTimeout(done, 2500);
    t.unref?.();
  } catch {
    done();
  }
})();
