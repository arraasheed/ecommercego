#!/usr/bin/env node
/**
 * checkpoint.js  —  Antigravity PostToolUse / Stop hook
 *
 * PURPOSE
 * -------
 * Antigravity keeps its conversation history in a SQLite database. If the PC
 * loses power mid-write, that history can disappear from the dashboard even
 * though work was done on disk. resume-context.js can rebuild a picture from
 * .ai/PROGRESS.md and git — but only if something recorded what happened
 * BETWEEN commits. That is this hook's job.
 *
 * After every tool call it appends one line to a plain append-only journal:
 *
 *   .ai/state/journal.jsonl     one JSON object per line, newest last
 *   .ai/state/last-session.json small summary, overwritten atomically
 *
 * Append-only JSONL is chosen deliberately: if power is cut mid-append, only
 * the final line is torn, and the reader skips unparseable lines. Nothing
 * earlier is ever corrupted. A database would risk losing the whole file.
 *
 * CONTRACT (see agy-customizations/docs/hooks.md)
 *   PostToolUse  stdin : { stepIdx, error?, conversationId, workspacePaths, ... }
 *                stdout: {}
 *   Stop         stdin : { executionNum, terminationReason, fullyIdle, ... }
 *                stdout: {}   (never blocks the stop)
 *
 * SAFETY
 * ------
 * This runs after EVERY tool call, so it must be fast, silent, and incapable
 * of failing the agent. On any error it prints `{}` and exits 0. It writes
 * only inside .ai/state/ and never reads or modifies project source.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const STATE_DIR = path.join(ROOT, '.ai', 'state');
const JOURNAL = path.join(STATE_DIR, 'journal.jsonl');
const LAST = path.join(STATE_DIR, 'last-session.json');

const MAX_JOURNAL_BYTES = 2 * 1024 * 1024; // rotate past 2 MB
let finished = false;

function emit() {
  if (finished) return;
  finished = true;
  try {
    process.stdout.write('{}');
  } catch {
    /* ignore */
  }
  process.exit(0);
}

process.on('uncaughtException', emit);
process.on('unhandledRejection', emit);
const watchdog = setTimeout(emit, 6000);
watchdog.unref?.();

function stripBom(s) {
  return s && s.charCodeAt(0) === 0xfeff ? s.slice(1) : s;
}

function git(args) {
  try {
    return execFileSync('git', args, {
      cwd: ROOT,
      encoding: 'utf8',
      timeout: 2500,
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return null;
  }
}

/** Keep the journal bounded without ever losing the recent tail. */
function rotateIfLarge() {
  try {
    const st = fs.statSync(JOURNAL);
    if (st.size <= MAX_JOURNAL_BYTES) return;
    const txt = fs.readFileSync(JOURNAL, 'utf8');
    const lines = txt.split(/\r?\n/).filter(Boolean);
    const keep = lines.slice(-800).join('\n') + '\n';
    const tmp = JOURNAL + '.tmp';
    fs.writeFileSync(tmp, keep, 'utf8');
    fs.renameSync(tmp, JOURNAL);
  } catch {
    /* rotation is best-effort */
  }
}

/** Write JSON so a crash can never leave a half-written file in place. */
function writeJsonAtomic(absPath, obj) {
  try {
    const tmp = absPath + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(obj, null, 2), 'utf8');
    fs.renameSync(tmp, absPath);
  } catch {
    /* ignore */
  }
}

/**
 * Read the declared current task from PROGRESS.md, so the journal records
 * intent as well as mechanics. Cheap, loose parse: first 🟨 row wins.
 */
function declaredTask() {
  try {
    const md = stripBom(fs.readFileSync(path.join(ROOT, '.ai', 'PROGRESS.md'), 'utf8'));
    for (const raw of md.split(/\r?\n/)) {
      const line = raw.trim();
      if (!line.startsWith('|') || !line.includes('🟨')) continue;
      const m = line.match(/\b(CLAUDE|GEMINI|BULK|DEEPSEEK)-(\d{1,3})\b/i);
      if (m) return `${m[1].toUpperCase()}-${m[2]}`;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function handle(rawStdin) {
  let p = {};
  try {
    if (rawStdin && rawStdin.trim()) p = JSON.parse(stripBom(rawStdin.trim())) || {};
  } catch {
    p = {};
  }

  // Only operate inside this project.
  try {
    if (!fs.existsSync(path.join(ROOT, '.ai'))) return emit();
    fs.mkdirSync(STATE_DIR, { recursive: true });
  } catch {
    return emit();
  }

  const now = new Date().toISOString();
  const isStop = p.terminationReason !== undefined || p.executionNum !== undefined;

  // Tool name is not in the PostToolUse payload, so record what identifies the
  // step. Keep the shape stable for the reader.
  const entry = {
    at: now,
    kind: isStop ? 'stop' : 'tool',
    conversationId: p.conversationId ? String(p.conversationId) : null,
    stepIdx: Number.isFinite(Number(p.stepIdx)) ? Number(p.stepIdx) : null,
    tool: isStop ? `stop:${p.terminationReason || 'unknown'}` : `step#${p.stepIdx ?? '?'}`,
    error: p.error ? String(p.error).slice(0, 300) : null,
    model: p.modelName ? String(p.modelName) : null,
  };

  try {
    rotateIfLarge();
    fs.appendFileSync(JOURNAL, JSON.stringify(entry) + '\n', 'utf8');
  } catch {
    /* ignore */
  }

  // Refresh the compact summary. On Stop, add the richer git snapshot — that is
  // the moment worth paying a few milliseconds for.
  const summary = {
    at: now,
    conversationId: entry.conversationId,
    lastKind: entry.kind,
    lastStepIdx: entry.stepIdx,
    lastError: entry.error,
    task: declaredTask(),
    note: isStop ? `stopped: ${p.terminationReason || 'unknown'}` : null,
  };

  if (isStop) {
    summary.git = {
      branch: git(['rev-parse', '--abbrev-ref', 'HEAD']),
      head: git(['rev-parse', '--short', 'HEAD']),
      dirtyFiles: (() => {
        const s = git(['status', '--porcelain']);
        return s === null ? null : s.split(/\r?\n/).filter(Boolean).length;
      })(),
      lastCommit: git(['log', '-1', '--pretty=%h %s']),
    };
  }

  writeJsonAtomic(LAST, summary);
  emit();
}

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
      if (data.length < 128 * 1024) data += c;
    });
    process.stdin.on('end', done);
    process.stdin.on('error', done);
    process.stdin.on('close', done);
    const t = setTimeout(done, 2000);
    t.unref?.();
  } catch {
    done();
  }
})();
