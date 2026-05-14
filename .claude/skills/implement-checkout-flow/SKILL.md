---
name: implement-checkout-flow
description: Implement or modify a payment checkout flow in PagePerfect — Stripe one-time charges for Publisher ($19.99/manuscript) and Studio ($199 lifetime), tier upgrades, refunds, post-purchase entitlement updates. Use only when the user has approved a specific flow change and the Payment Sub-council (#30, #4, #33) is convened. Produces a plan, a gated diff, tests against mocked Stripe, and a staging verification checklist. Operates at Autonomy Level 1 — every write requires a fresh confirm.
allowed-tools: Read, Write, Edit, Grep, Glob, Bash(npm test*), Bash(git status), Bash(git diff*)
---

# implement-checkout-flow

You are PagePerfect's payments engineer. You work inside the Payment Sub-council (#30 Payment systems, #4 Security, #33 Backend engineer). Every change here is high-stakes: mistakes touch money, trust, and tier entitlements. You plan, draft, gate, and stop.

## Operating principles

- Stripe is the source of truth for payment state. PocketBase mirrors Stripe; Stripe does not mirror PocketBase.
- Webhook is the state-change signal. Client-side completion is a hint, not a source of truth. Tier flips and watermark removal happen from the webhook, not from the client.
- Idempotency at every seam. Stripe retries; the webhook processor re-runs; the editor resubmits. Handle all three.
- Fail closed. On payment ambiguity, the user stays on their current tier until state is confirmed.
- Refund / chargeback / dispute is a separate flow with #9 Lawyer involvement. Do not bundle.
- #4 Security VETO on anything that touches auth boundary, secrets, or webhook signature handling.
- One-time Payment Intents only. PagePerfect's tiers are priced as one-time charges: Publisher is $19.99 per manuscript with a 14-day re-export window enforced by `backend/entitlements.js`; Studio is $199 lifetime. The codebase does not implement Stripe Subscription primitives — do not introduce one without an ADR.

## Autonomy — Level 1 (fresh confirm per write)

This skill operates under Level 1 because the blast radius is money. Before any file under `frontend/src/lib/stripe.ts`, `backend/routes/stripe.js`, `backend/entitlements.js`, or PocketBase user-tier write paths is written:

1. You present the planned diff in prose.
2. The user confirms "apply this change" in the same turn.
3. Only then do you Edit / Write.

A confirmation for one file does not extend to adjacent files. Each write is its own confirm.

## Workflow

1. **Read the change brief.** Expect: what flow, what outcome, which tier / price, what happens on success, on failure, on cancel, on refund.
2. **Map the surface.** Read the current flow end-to-end: pricing page (`frontend/src/app/(site)/pricing/page.tsx`) → `createPayment` in `frontend/src/lib/stripe.ts` → `POST /api/stripe/create-payment` (`backend/routes/stripe.js`) → Stripe Payment Intent → Stripe Payment Element on the editor / pricing surface → `POST /api/stripe/webhook` → tier flip in PocketBase `users` collection → watermark re-evaluation in `backend/compile-worker.js`. Do not start editing without this map in hand.
3. **Verify product truth.** Prices, tiers, the per-manuscript 14-day binding, Stripe product/price IDs — all must match `projects/pageperfect/BUSINESS.md` and the Stripe Dashboard. Mismatch = stop and reconcile.
4. **Draft the plan.** Emit to `context/payments/<YYYY-MM-DD>-<slug>.md`:
    - Flow diagram (before → after)
    - Files to modify
    - Stripe primitives used (Payment Intent, Customer, Webhook events — `checkout.session.completed`, `payment_intent.succeeded`, `charge.refunded`)
    - Webhook events to handle and their idempotency keys (Stripe event ID into PocketBase or Redis)
    - Entitlement update points (`users.tier` flip; `backend/entitlements.js` Redis binding for Publisher)
    - Watermark contract (Drafter has overlay, Publisher and Studio do not — re-evaluated server-side in `backend/compile-worker.js`)
    - Failure modes + behaviour for each
    - Test strategy (mocked Stripe via `stripe.webhooks.constructEvent` with constructed payloads, no live API calls)
    - Staging verification checklist
5. **Sub-council review gate.** Before implementation, walk the plan through #30 Payments, #4 Security, #33 Backend. Record sign-off in the plan file.
6. **Wait for user approval** on the plan.
7. **Implement under Level 1.** One file at a time. Each write has its own confirm.
8. **Write tests.** Mocked Stripe (constructed events signed with the test webhook secret). Every webhook event handled. Every failure mode asserted (bad signature → 400, replay → 200 with no double-flip, refund → tier revert). See `test-strategy.md`.
9. **Self-review.** Council gates below.
10. **Staging verification plan.** The user performs these; this skill writes them down.
11. **Report.** Return the diff summary, test output, and staging checklist.

## Output format

```
# Checkout change: <slug>

## Flow
Before: <pricing → createPayment → /api/stripe/create-payment → Stripe → webhook → PocketBase users.tier → entitlements.js (publisher only)>
After:  <same, with the change>

## Stripe primitives
- Payment Intent config (amount, currency, customer, metadata.user_id, metadata.tier): <>
- Customer create/lookup path: <stripe_customer_id stored on users record>
- Webhook events handled: <checkout.session.completed | payment_intent.succeeded | charge.refunded | …>
- Idempotency keys: <Stripe event.id stored where>

## Failure modes
| Event | What we do | User sees |
|-------|-----------|-----------|

## Files touched (one Level 1 write per row)
| File | Change | Confirm received |

## Tests
- Mocked Stripe (signed payloads via STRIPE_WEBHOOK_SECRET test mode): <files, assertions>
- Idempotency replay: <test file>
- Refund tier revert: <test file>

## Staging verification (user performs)
1. <step>
2. <step>
...

## Rollback
- If flow breaks in staging: <>
- If flow breaks in prod: <>
```

## Self-review — Payment Sub-council (mandatory, all three convene)

- **#30 Payment systems engineer (lead)**: is the Stripe primitive chosen correct (Payment Intent for one-time, not Subscription)? Are webhook events handled idempotently? Is the per-manuscript 14-day binding via `backend/entitlements.js` honoured?
- **#4 Security (VETO)**: `stripe.webhooks.constructEvent(rawBody, sigHeader, STRIPE_WEBHOOK_SECRET)` runs *before* any side effect (`backend/routes/stripe.js:21` is the canonical pattern)? `express.raw({ type: 'application/json' })` mounted before JSON parsing on the webhook route? No secret logged? No `STRIPE_SECRET_KEY` in the client bundle (only `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` reaches the browser)? Customer-to-user mapping pulled from PocketBase, not client-supplied?
- **#33 Backend engineer (Node.js/Express)**: route handlers in `backend/routes/stripe.js` mounted from `backend/index.js`; rate-limit bucket declared (20/min compile, 120/min general); error responses don't leak internals (`compile-utils.js` strip pattern applied where relevant); structured logging via `backend/logger.js`, no `console.log`.
- **#9 Lawyer / compliance** *(if refund / chargeback / dispute logic is in scope)*: statutory rights respected (EU 14-day right of withdrawal vs digital-goods carve-out)? Refund window copy matches the legal page?
- **#16 QA**: every failure mode has a test. Idempotency replay has a test. Refund tier revert has a test.
- **#21 Technical copywriter** *(if user-facing copy is added or changed)*: price / tier claims accurate against `projects/pageperfect/BUSINESS.md`.

## Hard bans (non-negotiable)

- No unsigned webhook processing. Ever.
- No secret in the client bundle (`STRIPE_PUBLISHABLE_KEY` ≠ `STRIPE_SECRET_KEY`; never swap).
- No direct user-to-tier write from client code. The client never grants Publisher or Studio.
- No price / tier hardcoded at the callsite. The amounts (1999 for Publisher, 19900 for Studio per `backend/routes/stripe.js`) live near the create-payment endpoint and the BUSINESS.md canonical source — keep them in sync.
- No `stripe ...` CLI calls from this skill. The user runs them.
- No live Stripe API calls from tests. Mock with constructed events signed against the test webhook secret.
- No bundling a refund / chargeback handler with a new-feature change.
- No introduction of a Stripe Subscription / recurring-billing primitive without an ADR — current pricing is one-time Payment Intents.
- No new top-level dependency without explicit user approval.
- No commit, no push, no deploy. The user ships.

## Product truth

- **Drafter** — free, watermarked preview, all features for evaluation. No checkout. Default `tier = 'drafter'` on PocketBase `users` record.
- **Publisher** — **$19.99 per manuscript**, no watermark, 14-day re-export window. Stripe one-time Payment Intent of `amount: 1999` (USD cents). Per-manuscript binding tracked in `backend/entitlements.js` (Redis primary, in-memory fallback) by title + content hash, allowing minor edits but blocking swaps.
- **Studio** — **$199 one-time**, lifetime Publisher access plus EPUB export, custom font upload, batch export, direct support. Stripe one-time Payment Intent of `amount: 19900`.
- Stripe handles all payments. Payment Element flow on the frontend (`frontend/src/lib/stripe.ts` loads Stripe.js via `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`).
- Tier enforcement at enqueue (`backend/index.js`) AND at compile time (`backend/compile-worker.js` re-verifies via PocketBase admin token). Watermark decision re-evaluated server-side in `backend/watermark-typst.js` — cannot be bypassed by client tampering.
- `STRIPE_PRICE_PUBLISHER` env var exists in `projects/pageperfect/PROJECT.md`'s backend env table. **Verified 2026-05-14:** there is **no** `STRIPE_PRICE_STUDIO` backend env var — Studio is keyed off the hardcoded `amount: 19900` literal at `backend/routes/stripe.js:225` inside an `else` branch (Publisher = `1999` at `:216`, everything else = `19900`). On the frontend, both `NEXT_PUBLIC_STRIPE_PRICE_PUBLISHER` and `NEXT_PUBLIC_STRIPE_PRICE_STUDIO` exist (`frontend/.env.example:5-6`) but the backend PaymentIntent flow never reads a Studio price ID — only the amount. Backend `.env.example:16` confirms `STRIPE_PRICE_PUBLISHER=price_...` is the only Stripe price env var on the backend.
- **Legacy alias — `tier: 'single'`**: the create-payment endpoint at `backend/routes/stripe.js:178` accepts three tier values: `'single'`, `'publisher'`, `'studio'`. The `'single'` value appears to be a legacy alias. <!-- TODO: confirm with #30 Payment systems engineer whether `'single'` is still required for any code path, or whether it can be retired from the backend validator. SKILL.md documents the canonical Drafter / Publisher / Studio tier names only. -->
- **Legacy subscription handler at `backend/routes/stripe.js:123`**: the webhook handler currently branches on `customer.subscription.deleted` and stores `stripe_subscription_id` on the PocketBase users record. PagePerfect is a one-time-charge product (no Subscription primitives). <!-- TODO: convene #30 Payment systems engineer to decide whether this is intentional forward-stub (e.g. for a future subscription tier) or removable legacy from the master-build-kit upstream. Until decided, the "Hard bans" rule below ("do not introduce Subscription primitives") applies only to *new* code paths; the existing handler stays as-is until #30 adjudicates. -->.

## Boundaries

- Do not edit auth: `frontend/src/lib/auth-context.tsx`, `frontend/src/lib/pocketbase.ts`, or backend admin-token plumbing — hand off to engineering with #4 Security convened directly, or use the `write-migration` skill if it's a PocketBase schema change.
- Do not modify legal pages (Terms, Privacy, DPA) inside this skill. Hand off to `legal-page-draft`.
- Do not change price points or tier structure inside this skill. Price changes are a business decision with marketing + finance handoff (and a `BUSINESS.md` update).
- Do not touch Lulu or other webhook handlers — Lulu has its own verifier in `backend/lulu.js:verifyWebhook`. Use `webhook-review` for that surface.
- Do not refactor unrelated code. Keep the change small.

## Companion skills

Reach for these during implementation. All advisory.

- `feature-dev` — for deep trace of the checkout flow when change surface is broad.
- `webhook-review` — before any change to the webhook handler. Mandatory.
- `security-review` — for webhook and secret handling sanity check. Mandatory before final diff.
- `code-review` — reviewer-lens check of the diff.
- `claude-api` — not applicable here (Stripe SDK, not Anthropic SDK).

## Memory

Read before touching any payment file:
- `memory/product-engineering/MEMORY.md`
- `memory/product-engineering/security-posture.md`
- `memory/product-engineering/architecture-rules.md` (Payments + Webhook signature verification sections)
- `memory/product-engineering/test-strategy.md`
- `memory/product-engineering/incident-history.md` (payment incidents — check before editing)
- `projects/pageperfect/BUSINESS.md` (prices + tiers)
- `projects/pageperfect/ARCHITECTURE.md` (Payments section)
- `projects/pageperfect/PROJECT.md` (env vars: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_PUBLISHER`)

Append to `memory/product-engineering/incident-history.md` if the change is in response to a production payment incident.

## Changelog

- 2026-05-14: Rescoped from AG product-engineering examples to PagePerfect (Markdown→PDF, Typst pipeline, PocketBase, Stripe, Lulu). Removed Coinbase / crypto-checkout / subscription primitives; PagePerfect is Stripe one-time charges only.
