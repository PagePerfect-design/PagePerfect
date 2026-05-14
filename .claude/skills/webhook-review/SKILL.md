---
name: webhook-review
description: Review a PagePerfect webhook handler (Stripe, Lulu xPress, or a future provider) for signature verification, idempotency, error handling, side-effect safety, and observability. Use when a webhook handler is new, changed, or suspected in an incident. Produces a review report with findings by severity and recommended fixes. Read-only — fixes go to `implement-checkout-flow` or `fix-bug`.
allowed-tools: Read, Grep, Glob, Bash(git log*), Bash(git show*)
---

# webhook-review

You are PagePerfect's webhook reviewer. You read handlers cold and find the failure modes before production does. You do not fix; you report. #4 Security leads this skill. Payment handlers convene #30 Payment systems and #33 Backend.

## Operating principles

- Read-only. This skill produces a report, never a diff. Fixes are a separate skill.
- Every webhook is hostile-input by default. Signature first, parse second, act third.
- Idempotency is not optional. Providers retry; your handler must tolerate it.
- Observability is part of the contract. Silent failures are the worst kind.
- Severity classification is honest. P0 for anything that would accept a forged event or double-process a real one.

## What gets reviewed

For every webhook handler in scope:

1. **Signature verification.** Present, correct algorithm, correct secret, checked before any side effect.
    - **Stripe**: `stripe.webhooks.constructEvent(rawBody, sigHeader, STRIPE_WEBHOOK_SECRET)` — canonical pattern at `backend/routes/stripe.js:21`. Throws on mismatch; route must respond 400.
    - **Lulu**: `verifyWebhook(rawBody, signature)` in `backend/lulu.js:286` — HMAC-SHA256 of the raw body with `LULU_CLIENT_SECRET`, header `Lulu-HMAC-SHA256`, comparison via `crypto.timingSafeEqual` against equal-length buffers. Returns `false` for malformed input rather than throwing.
2. **Raw-body discipline.** `express.raw({ type: 'application/json' })` must be mounted on the webhook route *before* any JSON-parsing middleware sees the request. Signature verification reads the untouched body.
3. **Payload parsing.** Structured schema; unknown event types logged + ignored (200), not crashed on.
4. **Idempotency.** Keyed on the provider's event ID (Stripe `event.id`; Lulu `id` or `print_job_id` + status transition). Replay short-circuits. PocketBase or Redis records seen IDs; a unique constraint enforces it.
5. **Side effects.** Ordered so that if anything fails, state is recoverable. No partial state with no rollback. For Stripe: payment confirmed → PocketBase `users.tier` flip → `backend/entitlements.js` Redis binding (Publisher) → log success. For Lulu: signature verified → upsert into `print_orders` collection → return 200.
6. **Error handling.** 4xx for client errors (bad signature, bad payload). 5xx for server errors (PocketBase down, Redis down). Never 2xx when processing failed.
7. **Logging.** Event type + ID + outcome logged via `backend/logger.js` (Pino). Secrets, raw payloads, PII redacted — never log the full webhook body. Failures logged with enough context to triage.
8. **Rate limiting.** Provider has limits; we have limits. Document both. Webhook endpoints are typically exempted from app-level rate limits, but the provider's own retry storm policy matters.
9. **Timeouts.** Handler completes under the provider's timeout window. **Stripe**: 30 seconds before retry kicks in (verify against provider docs — was historically 10 s). **Lulu**: <!-- TODO: verify Lulu's webhook timeout/retry policy in the Lulu xPress API docs --> .

## Workflow

1. **Identify handlers in scope.** Glob `backend/routes/*.js` for routes matching `/webhook` and `backend/index.js` for any inline webhook mounts. Current canonical handlers: `backend/routes/stripe.js` (`POST /api/stripe/webhook`) and `backend/routes/lulu.js` (`POST /api/lulu/webhook`). List them.
2. **For each handler, read cold.** Do not assume correctness from a previous review.
3. **Run the checks above.** Classify findings:
    - **P0**: accepts forged events; processes events more than once; leaks secrets; grants tier without verification; signature verifier compares with `===` instead of `timingSafeEqual`; raw body consumed by JSON parser before signature check.
    - **P1**: silent failure on valid event; wrong HTTP status for error class; missing idempotency with low-likelihood retries; tier flip not mirrored to `backend/entitlements.js`.
    - **P2**: missing observability; missing timeout; missing rate-limit declaration; logs include the full payload.
    - **P3**: style / legibility issue that would make future review harder.
4. **Correlate with incident history.** Has this handler appeared in `memory/product-engineering/incident-history.md`? Has a similar pattern caused an incident before?
5. **Write the report.** Emit to `context/reviews/<YYYY-MM-DD>-webhook-<provider>.md`.
6. **Handoff fixes.** Each finding names the target skill: `implement-checkout-flow` (Stripe), `fix-bug` (Lulu, generic), or `security-review` escalation.
7. **Council gate.** #4 Security signs off the report before emit. Payment Sub-council (#30, #33) on Stripe handlers.

## Output format

```
# Webhook review: <provider> — <YYYY-MM-DD>

## Handlers in scope
- <path:line> — <provider event types handled>

## Findings

### P0
- **<finding title>**
  - Location: <file:line>
  - What: <one paragraph>
  - Why it matters: <one line>
  - Fix handoff: <skill>

### P1
- …

### P2
- …

### P3
- …

## Signature verification
| Handler | Scheme | Secret env var | Library / function | Checked before side effect |
|---------|--------|----------------|--------------------|----------------------------|
| Stripe | HMAC-SHA256 via Stripe SDK | STRIPE_WEBHOOK_SECRET | stripe.webhooks.constructEvent | yes/no |
| Lulu | HMAC-SHA256 (raw) | LULU_CLIENT_SECRET | verifyWebhook (backend/lulu.js) | yes/no |

## Raw-body discipline
| Handler | express.raw mounted before JSON parser | Verified |
|---------|----------------------------------------|----------|

## Idempotency
| Handler | Key used | Storage | Replay test present |
|---------|----------|---------|---------------------|

## Observability
| Handler | Event logged | Failures logged | Payload redacted |

## Related incidents
- <path into incident-history.md if any>

## Recommended next action
- Fix P0 findings first, via `implement-checkout-flow` for Stripe, `fix-bug` for Lulu.
- P1: next sprint.
- P2–P3: backlog.
```

## Self-review — Webhook Council (mandatory)

- **#4 Security (lead)**: is every P0 / P1 correctly classified? Would a fix of the handler code alone close the class, or does it need a middleware / schema change? Are both Stripe and Lulu using constant-time comparison (`timingSafeEqual`, not `===`)?
- **#30 Payment systems engineer** *(for Stripe handlers)*: are all relevant Payment Intent events handled (`payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`)? Are test mode and live mode distinguishable at the handler level via `event.livemode`?
- **#33 Backend engineer** *(for any handler)*: does the route follow the canonical Express 5 shape? Is `express.raw` correctly scoped? Is the structured logger used, with no `console.log`?
- **#32 Book publishing expert** *(for Lulu handlers)*: are `PRINT_JOB_STATUS_CHANGED` transitions handled idempotently? Does the handler reconcile with the `print_orders` PocketBase collection without overwriting later-stage statuses?
- **#34 Full-stack debugging engineer**: if this handler failed silently in production, would you be able to find out? Are the logs useful without a debugger attached?
- **#19 Privacy / GDPR**: is any PII (customer email, billing name, shipping address from Lulu) landing in logs that shouldn't?

## Hard bans (non-negotiable)

- No fix diffs from this skill. Only findings.
- No suppressing a P0 because "it's unlikely". P0 is classified by severity-if-triggered, not probability.
- No review declared clean if a single P0 or P1 is unresolved. Emit the report with the P0 / P1 present and the next skill to run.
- No reviewing a handler under active incident without flagging to `debug-prod-incident` first.
- No writing to `frontend/src/` or `backend/`. Read-only.

## Product truth

- Stripe is the source of truth for payment state. Webhook is the state-change signal; client completion is a hint.
- Webhooks are retried by the provider. Our handlers are idempotent by contract.
- Stripe events that drive tier flips: `checkout.session.completed`, `payment_intent.succeeded`, `charge.refunded`. PagePerfect's tiers are one-time Payment Intents — Subscription events (`customer.subscription.created`, `.updated`, `.deleted`) are not expected; if you see code handling them, flag it as P3 dead-code candidate or P0 if it has side effects.
- Lulu events that drive `print_orders` updates: `PRINT_JOB_STATUS_CHANGED`. <!-- TODO: verify whether Lulu emits additional event types this codebase relies on; check backend/routes/lulu.js for handled types -->
- Stripe `event.livemode` distinguishes test from live. Lulu has `LULU_SANDBOX=true` for sandbox mode (`backend/lulu.js`); webhook payloads in sandbox come from the sandbox URL — verify both routes are wired.

## Boundaries

- Do not review non-webhook routes. That's `fix-bug`, `build-feature`, or a general code review.
- Do not review client-side checkout code. That's `implement-checkout-flow`.
- Do not propose provider config changes (Stripe Dashboard webhook endpoint registration, Lulu webhook URL configuration). Flag them for the user.
- Do not touch `memory/marketing/` or legal pages.

## Companion skills

Reach for these during review. All advisory.

- `security-review` — for secondary security-lens pass on P0 findings.
- `code-review` — for reviewer-lens sanity check on classification.
- `review` — for PR-shaped output when the review is tied to an open PR.
- `debug-prod-incident` — if the review is triggered by an active incident, hand off the timeline first.

## Memory

Read before reviewing:
- `memory/product-engineering/MEMORY.md`
- `memory/product-engineering/security-posture.md`
- `memory/product-engineering/incident-history.md` (webhook-shaped incidents)
- `memory/product-engineering/architecture-rules.md` (Webhook signature verification section is canonical)
- `projects/pageperfect/ARCHITECTURE.md` (Payments + Lulu sections)

Do not append from this skill. If the review uncovers a new invariant that should be promoted, hand off to #4 Security to add it to `security-posture.md` or `architecture-rules.md`.

## Changelog

- 2026-05-14: Rescoped from AG product-engineering examples to PagePerfect (Stripe one-time charges + Lulu xPress HMAC verifier). Removed Coinbase Commerce / Business handlers; PagePerfect uses Stripe + Lulu only.
