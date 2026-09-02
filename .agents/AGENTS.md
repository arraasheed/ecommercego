# Workspace Rules — eCommerce Go SPA/PWA Project

> These rules are loaded automatically by Antigravity for every conversation in
> this workspace. They apply to **all** models working in this repository.

## 0. Before you do anything

Read these two files first, every session, without being asked:

1. `.ai/PROJECT_CONTEXT.md` — the full ruleset, codebase facts, known problems
2. `.ai/PROGRESS.md` — what is done, what is next, any open blockers

Then open your own task file and work on **one numbered prompt only**:

| You are | Your task file |
|---|---|
| Gemini | `.ai/GEMINI_TASKS.md` |
| Claude | `.ai/CLAUDE_TASKS.md` |
| BULK model (Ling / MiniMax / Nemotron) | `.ai/BULK_TASKS.md` |

## 1. Resuming after a crash, restart, or power loss

An automatic hook injects a resume brief at the start of every session
(`.agents/scripts/resume-context.cjs`). It reads `.ai/PROGRESS.md`, `git log`,
and the crash journal at `.ai/state/`.

**If the user says "continue" or "resume the work", do not ask them what you
were doing.** The brief already told you. If for any reason it did not:

```
git log --oneline -15
git status --short
```
then read `.ai/PROGRESS.md`. That is enough to reconstruct the state.

**When `git log` and `PROGRESS.md` disagree, git is correct.** Commits cannot
lie; a markdown table can be stale. Fix the table, do not redo the work.

## 2. Never touch these

```
app/                 (exception: adding new files where a task explicitly says so)
routes/
database/
vendor/
packages/workdo/     (exception: creating a new module, when a task says so)
```

This project is a licensed script (WorkDo / eCommerce Go). The user must be able
to merge upstream updates later. Every change to core code destroys that path.
Roughly 15 files are approved for modification — they are listed in
`.ai/PROJECT_CONTEXT.md`.

## 3. Every change needs an off switch

Anything you add must be disableable via a `.env` flag or a one-line comment.
If you cannot design a kill-switch for a change, that change is too risky —
write it into Blockers and ask.

## 4. Commit after every task

```
git add -A
git commit -m "<type>(<scope>): <what>  [<MODEL>-<TASK#>]"
```

Example: `perf(vite): bundle 28 admin css into one file  [CLAUDE-2]`

Then update the task's row in `.ai/PROGRESS.md` (status + commit hash).
**A task without a commit and a PROGRESS.md update is a task that will be lost.**

## 5. When you are stuck

Three attempts maximum. Then:

1. Enable the relevant kill-switch so the app still works
2. Write the failure into the `## 🚧 Blockers` section of `.ai/PROGRESS.md`:
   what you tried, the exact error, what you need
3. Stop and tell the user

Do not improvise a fix on shared code. Do not silently skip the task.

## 6. Do not give the user technical work

The user is not a developer. They copy prompts and paste reports. They cannot
run test suites, read stack traces, or verify CSS. If verification is needed,
the model with browser tools (Claude) does it.

## 7. Scope discipline

Work on your assigned task number and nothing else. Do not "also fix" things you
notice — write them down in your report instead. Unrequested changes are how a
four-day project becomes a three-week debugging session.
