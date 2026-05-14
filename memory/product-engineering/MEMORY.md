# memory/product-engineering/MEMORY.md — Product & Engineering Index

Loaded when a product-engineering skill is active.

## Standing rules

1. **Plan first.** No `src/` edits without an approved plan (Plan → Diff → Tests).
2. **600-line file limit** (see `memory/PROCESS.md`).
3. **Re-verify tier at compile time** — never trust the enqueue snapshot. PocketBase admin token re-checks tier in `compile-worker.js`.
4. **Re-verify input at every layer** — `latex-sanitizer.js` is one of many defenses, not the only one. Title sanitization, remote-image stripping, font-registry validation all stack.
5. **`-raw_tex` disabled in Pandoc** is the primary RCE prevention. Don't enable it. Ever.
6. **Autonomy level 2 for most skills; level 1 for `write-migration` and `implement-checkout-flow`** — those require a fresh confirm per write.

## Skills owned

| Skill | Purpose |
|---|---|
| `build-feature` | New feature end-to-end (plan, diff, tests). Adapted for PagePerfect stack. |
| `fix-bug` | Reproduce, root-cause, fix, regression-test. Adapted for PagePerfect stack. |
| `refactor-component` | Component refactor with behavior-preservation tests |
| `debug-prod-incident` | Incident reproduction, root-cause, mitigation, postmortem hand-off |
| `write-migration` | PocketBase schema migrations (level 1 — fresh confirm) |
| `implement-checkout-flow` | Stripe Payment Element flow (level 1 — fresh confirm) |
| `webhook-review` | Stripe / Lulu webhook handlers, HMAC verification |
| `add-integration` | New third-party integration with safety gates |

## Memory files

| File | Purpose |
|---|---|
| `architecture-rules.md` | Architectural invariants (frontend/backend split, queue rules, etc.) |
| `incident-history.md` | Postmortems and incident catalog |
| `performance-budget.md` | Compile p95, bundle size, Core Web Vitals budgets |
| `security-posture.md` | Threat model, secrets handling, sandboxing posture |
| `test-strategy.md` | What must have a test, test pyramid |

## Companion skills (cross-department)

- `emil-design-eng` (under design) — for UI motion/interaction craft when feature touches UI
- `pp-handover` (under admin-ops) — at session end
- `simplify` (Anthropic built-in) — after first pass, trim dead code
- `code-review` (Anthropic built-in) — pre-final-diff reviewer pass

## Residual AG-flavored content

`security-posture.md` references AG's auth/wallet posture in places. Needs a PagePerfect-aware rewrite focused on the compile pipeline threat model.
