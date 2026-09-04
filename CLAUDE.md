# eCommerce Go — SPA/PWA Project Rules

**This file is a pointer. The full rules live in `AGENTS.md` (same folder).**
Read `AGENTS.md` first, then the two files it names.

## Before you do anything

1. Read `AGENTS.md` — the workspace rules
2. Read `.ai/PROJECT_CONTEXT.md` — architecture, codebase facts, forbidden folders
3. Read `.ai/PROGRESS.md` — what is done, what is next, open blockers
4. Run `git log --oneline -20` and `git status --short`

Then open your task file and work on **one numbered prompt only**:

| You are | Your task file |
|---|---|
| Gemini | `.ai/GEMINI_TASKS.md` |
| Claude | `.ai/CLAUDE_TASKS.md` |
| DeepSeek / Ling / MiniMax / other bulk model | `.ai/BULK_TASKS.md` |

Ready-to-paste versions of every prompt are in `.ai/prompts/` (one file per
task, in execution order). The user pastes those.

## The four rules that matter most

1. **Never touch** `app/` `routes/` `database/` `vendor/` `packages/` — this is
   a licensed script (WorkDo) and the user must be able to merge upstream
   updates later. Exceptions are named explicitly inside each task.
2. **Never `git push`.** Commit locally after every task; pushing is the user's
   decision. Also never `git reset --hard`, `git clean`, `git push --force`.
3. **Update `.ai/PROGRESS.md` and commit after every task.** A task without a
   commit and a PROGRESS.md update is a task the next session will lose.
4. **Stuck? Three attempts, then stop.** Write the failure into the Blockers
   section of `.ai/PROGRESS.md` and tell the user. Do not improvise a fix on
   shared code.

## When git log and PROGRESS.md disagree

git is correct. Commits cannot lie; a markdown table can be stale.
Fix the table, do not redo the work.
