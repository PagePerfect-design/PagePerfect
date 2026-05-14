# Gap audit — 2026-05-14

## P0 — blockers (security / data integrity / known-flagged)

### 1. compile-worker.js has no test
- Evidence: `backend/compile-worker.js` exists; `backend/tests/compile-worker.test.js` does NOT.
- Risk: Compile-worker is the most security-critical path (Pandoc spawn, sandboxing, watermark injection, tier re-verification). No regression coverage.
- Action: Author `tests/compile-worker.test.js`. Mock Pandoc spawn; test injection-pattern rejection, tier re-verify, watermark injection for Drafter, 45s SIGKILL, temp-dir cleanup.
- Skill: `fix-bug` (TDD via `superpowers:test-driven-development`) or a dedicated `build-feature` if the test surface is large.

### 2. backend/routes/stripe.js has no test
- Evidence: `backend/routes/stripe.js` exists; no test file.
- Risk: Stripe webhook handler. HMAC verification IS present (`stripe.webhooks.constructEvent` at `stripe.js:21`) but no test confirms it's called BEFORE state mutation and idempotency holds.
- Action: Author webhook test covering valid signature, invalid signature, duplicate event, malformed payload.
- Skill: `webhook-review` (audit) → `fix-bug` (test).

### 3. backend/routes/lulu.js has no test
- Evidence: HMAC verification present (`backend/lulu.js:286 verifyWebhook`, called from `routes/lulu.js:74`) but no test.
- Action: Same shape as Stripe. Test verifyWebhook with valid + invalid signatures.
- Skill: `webhook-review` → `fix-bug`.

### 4. backend/routes/compile.js has no test
- Evidence: Compile route exists; no test.
- Risk: Rate limiter is wired (`compile.js:145`) but body-size limits and tier-gate enforcement at route level have no coverage.
- Skill: `fix-bug`.

### 5. backend/routes/health.js, contact.js, analysis.js have no tests
- Lower risk than compile/stripe/lulu (no payment/security state), but health.js is the canary for prod monitoring. analysis.js exposes 9 endpoints.
- Skill: `fix-bug` (batch).

### 6. backend/index.js has no test
- The mega-router. Hard to test integration-style but worth at least startup + middleware-wiring smoke tests.

### 7. frontend has zero tests
- **73 components across `frontend/src/components/` and `frontend/src/app/`. Zero `.test.tsx` files.**
- Risk: Editor (CompileShell, FloatingHUD, PreviewPane, LaunchOverlay) is the user surface. Regressions ship silently.
- Action: This is a structural choice; framework decision (Vitest? Playwright component testing? React Testing Library?) needed first. STATUS.md flagged "No frontend component tests" — this is the unresolved item.
- Skill: User-authored decision → `build-feature` for the test framework setup.

## P1 — risks (drift from policy)

### 8. `prefers-reduced-motion` coverage is thin
- Evidence: `frontend/src/app/globals.css` defines 2 `@keyframes` (`vtFadeOut`, `vtFadeIn`) + 4 `animation:` rules total = 6 motion locations. Only **1** `prefers-reduced-motion` branch found.
- Risk: Noor (#8 Accessibility, veto) and `memory/design/motion.md` require every animation to have a reduced-motion variant. We're short.
- Action: Add reduced-motion branches for each `@keyframes` and animation utility. Some may inherit a global rule; verify.
- Skill: `design-motion` (spec) → `design-token` (canonical implementation).

### 9. `console.warn` outside structured logger in `font-availability.js`
- Evidence: `font-availability.js:285, 309` use `console.warn` instead of `logger.warn`.
- Severity: P2 actually — fontconfig probing is a startup diagnostic, not a runtime path. But it's drift from the structured-logging contract.
- Skill: `refactor-component` or hand-fix.

### 10. Untested backend modules — `figures-system`, `multilingual`, `platform-compliance`, `print-qa`, `lulu`
- These are core feature modules with no tests. Lower urgency than compile-worker (no spawn risk) but high blast radius.
- Skill: `fix-bug` (batch via `superpowers:dispatching-parallel-agents` — these are independent).

## P2 — quality (best-practice gaps)

### 11. Unknown backend module: `cluster.js`, `worker.js`
- Both exist but aren't in `ARCHITECTURE.md`. Likely related to the Typst migration / multi-process compile worker. Need documentation.
- Cross-references the P0-1 stale-report finding (ARCHITECTURE.md rewrite).

### 12. New backend modules — `entitlements`, `result-store`, `layout-sanity-checker`, `typst-error-translator`
- All have tests (good). But no documentation in ARCHITECTURE.md.

### 13. Routes file `routes/publishing.js` has a test (`tests/publishing.test.js`)
- Good — confirms the publishing pipeline is tested. Use this as the template for the missing route tests above.

## P3 — informational

### 14. node_modules has many files > 600 lines
- Filtered out of the 600-line rule. Not actionable.

### 15. PagePerfect source has NO files > 600 lines in our scope
- Once node_modules is filtered, the only flagged file from STATUS.md (`CompileShell.tsx` at 3,075 lines) appears to have been refactored or excluded. Verify with a direct check.

### 16. `globals.css` has only 6 motion locations
- Lean. PagePerfect's "motion is punctuation" philosophy (`memory/design/motion.md`) is largely upheld.

## Summary

- Routes audited: 7 — **6 missing tests** (P0)
- Backend modules audited: 30 — **6 missing tests for security-critical paths** (P0/P1)
- Frontend components: 73 — **0 tests** (P0, structural)
- Total findings: **P0: 7, P1: 3, P2: 3, P3: 3** = 16
- Top category: **Test coverage** (~13 findings, half the report)
- Recommended next skills (in order):
  1. `webhook-review` on stripe + lulu (validates the audit; outputs go to `fix-bug`)
  2. `fix-bug` parallel-dispatched via `superpowers:dispatching-parallel-agents` for the route tests
  3. `design-motion` for reduced-motion coverage spec → `design-token` for implementation
  4. User-authored decision on frontend test framework

## Resolved baseline (from TRANSFORMATION_COUNCIL.md)

Verified working in current code:
- ✓ `process.on('uncaughtException')` and `process.on('unhandledRejection')` at `index.js:959, 964`
- ✓ Rate limiting at `index.js:786-792`, `routes/compile.js:145`
- ✓ Pandoc `-raw_tex` disabled (location moved — see stale-report P0-2)
- ✓ Stripe HMAC verification at `routes/stripe.js:21`
- ✓ Lulu HMAC verification at `lulu.js:286`, called at `routes/lulu.js:74`

Multiple TRANSFORMATION_COUNCIL.md P0s from 2026-02-22 are CLOSED. STATUS.md is mostly accurate. The big unresolved item is **no frontend tests**.
