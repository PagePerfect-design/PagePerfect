---
name: stale-detector
description: Scan PagePerfect's memory/, projects/, and root markdown docs for staleness — dates that have passed, file paths that no longer exist, function/flag/env-var references that no longer match the code, TODO markers older than 90 days. Use quarterly, before a major release, or when CORRECTIONS.md fills up with "we said X but Y was actually true." Read-only; produces a P0–P3 findings report.
---

# stale-detector

The kit's `memory/` system has a rule: *replace over accumulate*. This skill enforces that rule by hunting drift between what the memory/docs say and what the code actually does.

## When to invoke

- Quarterly (per `memory/admin-ops/ops-calendar.md` cadence)
- Before a major release or fundraise (avoid shipping with stale claims)
- When `CORRECTIONS.md` shows a pattern of "memory said X, reality was Y" entries
- After a large refactor that renames files, functions, or env vars
- When a new teammate joins and we want the onboarding surface to be honest

## What to scan

### 1. Expired dates
Scan `memory/**/*.md`, `projects/pageperfect/**/*.md`, root `*.md` for date patterns:
- ISO dates: `2026-\d{2}-\d{2}`
- Natural dates: `(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+\d{1,2},?\s+\d{4}`

For each date found, check if it's:
- A deadline already past today's date (P0)
- A freeze date already past (P0)
- A "by Q3 2026" type ETA already past (P1)
- A historical date (changelog, ADR, postmortem) — fine, ignore

### 2. Dead file path references
Grep for path-shaped strings in markdown:
- `src/[a-zA-Z0-9_/.-]+\.(tsx?|jsx?|css|md|sql|js)`
- `backend/[a-zA-Z0-9_/.-]+\.(js|json|latex|lua|ps|md)`
- `frontend/src/[a-zA-Z0-9_/.-]+\.(tsx?|jsx?|css|md)`

For each match, check if the file exists in the repo. If not → P0 (the documentation lies about the codebase).

### 3. Dead identifier references
Grep for backtick-quoted function/class/const names in markdown that look like code: ``` `[A-Z][a-zA-Z]+|[a-z][a-zA-Z]+\(\)` ```. Then grep the codebase for each. If zero hits → P1 (memory references something that's been renamed or removed).

### 4. Dead env var references
Grep for `[A-Z_]{4,}` patterns in env-var-shaped contexts. Cross-check against `.env.example`, Dockerfile, and the code. Drift here is P1 — silent prod failures if memory says `STRIPE_PRICE_PUBLISHER` but env actually wants `STRIPE_PRICE_PUBLISHER_ID`.

### 5. Stale TODO markers
Grep `TODO\|FIXME\|XXX\|HACK\b` in `memory/`, `projects/`, and source. For each, if the surrounding file's last commit is older than 90 days → P2.

### 6. AG-residual content
Grep for known AG-isms that should have been scrubbed when the kit was scoped to PagePerfect:
- `allowanceguard`, `Allowance Guard`, `AllowanceGuard`
- `drizzle`, `viem`, `wagmi`
- `ERC-20`, `ERC20`, `ERC-721`, `EIP-712`, `Permit2`
- `wallet-security`, `non-custodial`, `27 chains`

Each occurrence → P1 (each `MEMORY.md` flagged "Residual AG-flavored content" in the relevant dept — this skill drives the cleanup).

## Output format

Write to `context/audits/<YYYY-MM-DD>-stale-report.md` AND emit a summary inline:

```
# Stale audit — <YYYY-MM-DD>

## P0 (broken — fix this turn)
- `<file>:<line>` — <issue> (<one-line evidence>)
  - Recommended action: <specific fix>

## P1 (drift — fix this sprint)
- ...

## P2 (decay — fix this quarter)
- ...

## P3 (informational)
- ...

## Summary
- Files scanned: <N>
- Total findings: <N>  (P0: <n>, P1: <n>, P2: <n>, P3: <n>)
- Top drift area: <e.g., "memory/marketing/ — 14 AG-residuals">
- Recommended skill handoffs:
  - <skill>: <count> items
  - <skill>: <count> items
```

## Severity rubric

- **P0** — Document actively lies. Examples: a path that doesn't exist, a date that's passed and the linked action wasn't taken, an env var name that's wrong.
- **P1** — Document is misleading or drifted. Examples: AG-residual content, a renamed function, an ETA that's slipped without being updated.
- **P2** — Document is decaying. Examples: TODOs older than 90 days, "we plan to" statements written 6+ months ago.
- **P3** — Cosmetic / informational. Examples: a date typo that doesn't change meaning, an outdated link to an external resource that 301s correctly.

## Hard bans

- No file edits. The skill *reports*; fixes are routed to `writer` (for memory text), engineering (for code-shaped fixes), or the relevant dept skill.
- No deletion of memory entries. Even if stale, deletion needs human review.
- No grep of files outside the repo.
- No remote checks (link-checker, etc.) — that's a different skill.

## Operating principles

- **Evidence per finding.** Every finding cites a file + line + match. No "I think this might be stale" entries.
- **Group by file, not by category.** Easier to triage when a single file's drift surfaces together.
- **Surface, don't fix.** This skill makes the drift visible. The user (or a routed skill) decides what to do.
- **Don't grep the whole repo every time.** Time-box: `memory/` and `projects/` are mandatory. `src/` is opt-in via a flag in the invocation prompt ("include src" / "skip src").

## Self-review

Before emitting:
- Did I check `context/audits/` for the previous stale report? If yes, compare — what's NEW since last run? Repeated entries are CORRECTIONS.md material.
- Did I capture the date-of-scan in the report header? Future runs need this to compute delta.
- Did I surface "top drift area" in the summary so the user knows where to send the biggest fix?
- Are recommended skill handoffs concrete (named skill + count)?

## Council seats invoked

- **#36 Operations manager** — owns this audit cadence; primary consumer.
- **#15 Staff engineer** — for dead-identifier findings (renaming side-effects).
- **#21 Technical copywriter** — for memory text accuracy.
- **#1 Editor-in-chief** — for markdown structure / readability of memory files.

## Companion skills

- `session-orient` — reads the latest stale report if recent (< 14 days).
- `gap-audit` — runs in parallel; together they cover doc drift + code gaps.
- `writer` — receives handoff for memory text fixes.
- `docs-coherence-audit` — adjacent skill for *public* docs; this skill is for *internal* memory/projects.

## Memory

- Read on every invocation: `memory/**/*.md`, `projects/pageperfect/**/*.md`, root `*.md`.
- Conditionally: `src/**/*.{ts,tsx,js}` if "include src" mode requested.
- Append to: `memory/CORRECTIONS.md` ONLY for findings that have appeared in 3+ consecutive stale audits (chronic drift). Otherwise the report file is the artifact.
