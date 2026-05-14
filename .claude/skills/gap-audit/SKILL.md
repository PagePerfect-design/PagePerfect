---
name: gap-audit
description: Scan PagePerfect's `src/` for structural gaps that compound silently — Express routes without tests, components without tests, animations without prefers-reduced-motion, console.error without structured logger, webhook handlers without HMAC verification, API routes without rate limiting, async handlers without error boundaries, TODOs older than 90 days, and any policy from PROCESS / CONSTRAINTS / TOOLS that has zero enforcement coverage. Use quarterly, before a major release, or when CORRECTIONS.md fills up. Read-only; produces P0–P3 findings.
---

# gap-audit

Detects categorical gaps in the codebase — the kind of thing that's fine individually but compounds into reliability/security/quality debt at scale.

## When to invoke

- Quarterly cadence (per `memory/admin-ops/ops-calendar.md`)
- Before a major release / fundraise
- When CORRECTIONS.md surfaces "we forgot to X in Y" patterns
- Before opening the codebase to contractors / contributors
- When a hire is starting and we want the lay of the land's gaps

## What to scan (PagePerfect-specific)

### Category 1 — Test coverage gaps (P0–P1)

- **Express routes without tests.** Glob `backend/routes/*.js` and `backend/index.js`. For each `router.(get|post|put|delete|patch)` handler, check if there's a corresponding test in `backend/tests/`. Missing → P0 for `/api/stripe/*`, `/api/compile`, `/api/preflight`, `/api/lulu/webhook`. P1 for others.
- **React components without tests.** Glob `frontend/src/components/**/*.tsx` and `frontend/src/app/**/*.tsx`. Cross-reference against any test files. PagePerfect's STATUS.md flags "No frontend component tests" — this is a known gap, surface concrete count.
- **Backend modules without tests.** Glob `backend/*.js` excluding `index.js`. Cross-reference against `backend/tests/`. P1 unless module is `latex-sanitizer`, `compile-worker`, `text-normalizer`, or `watermark` (P0 — security-critical).

### Category 2 — Error handling gaps (P0–P1)

- **Express routes without try/catch around async handlers.** Look for `app.(get|post|put|delete)\(.*async` patterns where the handler body doesn't wrap in try/catch or use a wrapper. P0 — PagePerfect's `TRANSFORMATION_COUNCIL.md` flagged this exact gap.
- **Process-level handlers.** Verify `process.on('uncaughtException')` and `process.on('unhandledRejection')` exist in `backend/index.js`. Missing → P0.
- **`console.error` outside the structured logger.** Grep `backend/**/*.js` for `console\.(error|warn|log)`. Each occurrence outside `logger.js` → P2 (drift from structured logging).

### Category 3 — Security gaps (P0)

- **Stripe webhook HMAC verification.** Read `backend/routes/stripe.js`. Confirm `stripe.webhooks.constructEvent(rawBody, signature, secret)` is called BEFORE any state mutation. Missing → P0.
- **Lulu webhook HMAC verification.** Read `backend/routes/lulu.js`. Confirm HMAC check exists. Missing → P0.
- **Rate limiting on compile endpoints.** Confirm `express-rate-limit` is applied to `/api/compile` and `/api/convert`. Missing → P0.
- **LaTeX injection allowed.** Confirm `-raw_tex` flag is `false` in Pandoc spawn args in `backend/compile-worker.js`. If `true` or missing the flag → P0 (RCE risk).
- **Body size limits.** Confirm `MAX_MD_BYTES`, `MAX_DOCX_BYTES` are honored in body parsers. Missing → P0.
- **Admin token exposure.** Grep `frontend/**/*.{ts,tsx,js,jsx}` for `POCKETBASE_ADMIN`. Any hit → P0 (must never leak to client).

### Category 4 — Design system gaps (P1–P2)

- **Animations without `prefers-reduced-motion` branch.** Grep `frontend/src/app/globals.css` and component files for `@keyframes` + `animation:` / `transition:`. For each, check whether a `@media (prefers-reduced-motion: reduce)` branch overrides it. Missing → P1 (Noor will veto).
- **Hover animations without `(hover: hover) and (pointer: fine)` gate.** Grep `:hover` + transform. Missing the media-query gate → P2 (touch-device false positives).
- **`transition: all` usage.** Grep CSS for `transition:\s*all`. P2 — explicit properties only (per emil-design-eng).
- **Decorative imagery on `(site)` pages.** Grep `frontend/src/app/(site)/**/*.tsx` for `<img`, `Image from "next/image"`, `background-image:`. PagePerfect's DESIGN principle #1 forbids decorative imagery — any hit needs justification → P2.
- **`border-radius: ` non-zero in `[data-docs]` or `(site)` scopes.** Hint of canon drift → P2.

### Category 5 — Compile pipeline gaps (P0–P1)

- **Tier re-verification at compile time.** Confirm `compile-worker.js` calls PocketBase admin to re-verify tier BEFORE assembling the preamble. Per `projects/pageperfect/ARCHITECTURE.md`. Missing → P0.
- **Orphan temp-dir sweeper.** Confirm `index.js` runs an orphan sweep at boot and hourly. Missing → P1.
- **Compile timeout enforcement.** Confirm 45s SIGKILL is wired in `compile-worker.js`. Missing → P0.

### Category 6 — Documentation gaps (P2–P3)

- **Quality systems orphaned.** From `projects/pageperfect/ARCHITECTURE.md` quality systems table, verify each module's `Integration` claim. Anything still "Advisory — not wired" → P2.
- **TODO/FIXME older than 90 days.** Same as `stale-detector` category 5 but for `src/` only.
- **ADRs missing for major decisions.** Check `projects/pageperfect/decisions/`. The README lists "Open decisions worth recording" — anything still unwritten → P3.

### Category 7 — Process gaps (P1)

- **Files > 600 lines.** Per PROCESS.md rule. Glob `.{ts,tsx,js,jsx,latex,md}` files; report any over 600. `CompileShell.tsx` is the known one from STATUS.md.

## Output format

Write to `context/audits/<YYYY-MM-DD>-gap-report.md` AND emit summary inline:

```
# Gap audit — <YYYY-MM-DD>

## P0 — blockers (security / data integrity / known-flagged)
- [<category>] <finding>
  - Evidence: `<file>:<line>` — <quote>
  - Recommended: <specific fix and which skill owns the fix>

## P1 — risks (drift from policy / accumulating debt)
- ...

## P2 — quality (best-practice gaps / consistency)
- ...

## P3 — informational
- ...

## Summary
- Files scanned: <N>
- Routes audited: <N>
- Components audited: <N>
- Total findings: <P0: n, P1: n, P2: n, P3: n>
- Top category: <e.g., "Category 2 Error handling — 11 findings">
- Recommended next skill: <fix-bug | refactor-component | build-feature | design-system-audit | docs-coherence-audit>
```

## Severity rubric

- **P0** — Active risk (security, RCE, data integrity, regulatory). Fix this turn.
- **P1** — Compounding risk or policy drift. Fix this sprint.
- **P2** — Quality / consistency. Fix this quarter or next surface change.
- **P3** — Informational. Track but no action needed.

## Hard bans

- No file edits. Read-only; routes findings to fix-bug / refactor-component / design-system-audit / build-feature.
- No deletion of TODOs. Surface and route, don't suppress.
- No live request testing. That's `audit-website` / `webapp-testing`.
- No security-payload generation. This skill detects missing defenses, doesn't probe them.
- No bypass of skills/CONSTRAINTS — if a category check itself violates CONSTRAINTS, drop the check.

## Operating principles

- **Categorical, not anecdotal.** Each finding maps to a category with a defined rubric. No "this just looks fishy" entries.
- **Evidence per finding.** File + line + quoted excerpt. Reviewers can confirm in 5 seconds.
- **Group by category in the report.** Even though severity orders the headers, list findings in category clusters under each severity so the user sees patterns.
- **Compare to last audit.** If `context/audits/*gap*.md` exists, diff: what's NEW since last run? Recurring P0s after fix = CORRECTIONS.md entry.
- **Honor false-positives.** If a finding is genuinely a false-positive (e.g., a TODO that's a deliberate "decided to defer" marker), the user can mark it in `memory/admin-ops/audit-exemptions.md` (create if needed). Subsequent runs respect exemptions.

## Self-review

Before emitting:
- Did every P0 cite a specific file:line?
- Did I check `context/audits/` for the previous gap report? If yes, list NEW findings vs RECURRING findings vs RESOLVED findings.
- Did I include "Recommended next skill" so the user can chain immediately?
- Did the summary include actual counts (not "many" / "several")?
- Did I respect `memory/admin-ops/audit-exemptions.md` if it exists?

## Council seats invoked

- **#4 Security engineer** — primary for Category 3 (security gaps).
- **#16 QA / test engineer** — primary for Category 1 (test coverage).
- **#8 Accessibility specialist (veto)** — primary for the prefers-reduced-motion gap in Category 4.
- **#15 Staff engineer** — primary for Category 7 (600-line rule).
- **#33 Backend engineer** — primary for Category 5 (compile pipeline).
- **#31 LaTeX/PDF engineer** — co-reviewer for Category 5.
- **#36 Operations manager** — owns the cadence.

## Companion skills

- `stale-detector` — runs in parallel; together they cover *doc drift* + *code gaps*.
- `session-orient` — reads the latest gap report if recent.
- `fix-bug` — receives P0 handoffs.
- `refactor-component` — receives P1 handoffs (especially Category 7).
- `design-system-audit` — receives Category 4 handoffs.
- `security-claim-audit` — adjacent; this skill detects missing defenses, that skill audits claims about defenses.
- `webhook-review` — handles handoffs for webhook gaps in Category 3.

## Memory

- Read: code under `backend/`, `frontend/src/`. `projects/pageperfect/ARCHITECTURE.md` for spec to audit against. `TRANSFORMATION_COUNCIL.md` for the known-flagged baseline.
- Read conditionally: `memory/admin-ops/audit-exemptions.md` if exists.
- Append to: nothing. The report file is the artifact. Patterns get promoted to `memory/CORRECTIONS.md` only via the user's review.
