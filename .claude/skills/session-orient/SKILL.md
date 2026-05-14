---
name: session-orient
description: At the start of a focused PagePerfect session — read the right files in the right order to get oriented in 30 seconds. Outputs a brief on what was last worked on, what's pending, what to be careful about, and what to read next. Use at the literal start of a session, after a long break, or after context compaction has stripped prior work. Read-only; never edits.
---

# session-orient

PagePerfect-scoped session orientation. Reads in deterministic order and emits a brief that lets you act in the first 60 seconds without re-deriving project state.

## When to invoke

- Start of a session that's likely to span multiple turns
- After a long break (overnight, weekend, post-vacation)
- After context compaction has summarized prior work
- When picking up a teammate's work-in-progress
- Before any non-trivial change (Plan-First rule benefits from this prelude)

## When to skip

- One-shot trivial tasks ("fix this typo")
- The session just started and the user has given a clear specific instruction with full context
- You're already mid-task and have the context you need

## Read order (deterministic)

Read these in order, stopping when you have enough signal. Don't read all every time.

1. **Most recent handover** — `context/handovers/<YYYY-MM-DD>-*.md`. Take the newest by filename date. If none exists, skip.
2. **Recent git activity** — `git log --oneline -20` and `git status` to see what's in flight.
3. **`memory/CORRECTIONS.md`** — append-only lessons. Skim the last 10 entries.
4. **`projects/pageperfect/STATUS.md`** — known gaps, what's resolved, what's open.
5. **`memory/PROCESS.md`** (TL;DR section only) — the four workflow rules. Refresh.
6. **Active plans** — `context/plans/*.md` if any exist.
7. **`TRANSFORMATION_COUNCIL.md`** and **`ASSUMPTION_EXPERIMENTS.md`** — the one-off audit + assumption tracker. Only if the task touches the auditable surfaces (landing, pricing, watermark, etc.).

## Output format

Emit this brief (and only this brief — no extra commentary):

```
# Session orientation — <YYYY-MM-DD HH:MM>

## Last touched
- <one line — what the previous session was about, from handover or commits>
- Last commit: <hash> — <subject>

## In flight
- <bullet per item from context/plans/ if any>
- <bullet per uncommitted change visible in git status>
- <bullet per manual step still owed from last handover>

## Watch for
- <recent CORRECTIONS.md entries that might apply>
- <open audits or known gaps from STATUS.md that touch this area>
- <active assumptions worth verifying from ASSUMPTION_EXPERIMENTS.md if relevant>

## Recommended next read
- <one or two files most relevant to whatever the user is about to ask, or "wait for user instruction">

## Workflow rules (refresher)
1. Plan first  2. 600-line limit  3. Conserve tokens  4. Convene the Council
```

## Operating principles

- **Read order matters.** Newest signal first (handover), then drift signal (git), then patterns (CORRECTIONS), then status, then process. Don't read CORRECTIONS before the handover — context degrades the older you go.
- **30-second test.** If the brief takes more than 30 seconds for the user to scan, it's too long. Cut to bullets.
- **No editorialising.** State facts. Don't interpret beyond what's in the source files.
- **No assumptions about the next task.** Orient; don't predict. The user tells you the task.
- **Honest gaps.** If there's no handover, say "No prior handover — clean start." If no plans, say "No active plans." Don't invent context.

## Hard bans

- No file edits. Read-only.
- No git commands beyond `log` and `status` (no diff, no blame, no checkout).
- No memory writes (no CORRECTIONS append, no MEMORY.md updates).
- No skill chaining inside this skill — emit the brief, stop, wait for the user.
- No "I'm ready" preamble — just emit the brief.

## Self-review

Before emitting, check:
- Is "Last touched" specific (commit hash + subject)?
- Does "In flight" list at least one of: an active plan, uncommitted changes, or "Nothing in flight"?
- Did I include a CORRECTIONS entry that's actually recent (last 30 days)?
- Is "Recommended next read" specific to the surface the user is likely about to touch?
- Did I keep this under 25 lines total?

## Council seats invoked

- **#36 Operations manager** — owns this skill; it's the session-start equivalent of the support-triage / weekly-metrics-brief loop.
- **#15 Staff engineer** — the "Watch for" section flags engineering risks.
- **#11 Investor/founder voice** — if the orientation surfaces banned-phrase risk in pending work, raise it here.

## Companion skills

- `pp-handover` — the *end-of-session* counterpart. session-orient reads what pp-handover wrote.
- `stale-detector` — run this when "Watch for" flags suggest the read-files themselves may be stale.
- `gap-audit` — run this when "Watch for" flags structural gaps (no tests, no error handling, etc.).

## Memory

- Read on every invocation: `context/handovers/` (most recent), `memory/CORRECTIONS.md` (recent only), `projects/pageperfect/STATUS.md`.
- Read conditionally: `context/plans/*`, `TRANSFORMATION_COUNCIL.md`, `ASSUMPTION_EXPERIMENTS.md`.
- Never write.
