# billing-sops.md — Operator playbooks for the PagePerfect billing surface

Standard operating procedures for billing actions that aren't (and shouldn't be) automated. Each SOP describes the trigger, the action, and the verification step. The operator runs these against the Stripe Dashboard and the PocketBase Admin UI / Admin API; no skill executes them.

## What this surface looks like

PagePerfect bills one-time charges, not subscriptions:

- **Publisher** — $19.99 per manuscript. Buys watermark-free export for one manuscript and 14 days of unlimited re-exports for that manuscript. Tracked on the user record via `publisher_window_end`.
- **Studio** — $199 lifetime. Lifts the Publisher constraint forever; user gets watermark-free exports on every manuscript they own.

Source of truth for transactions: **Stripe**. Source of truth for entitlements at request time: **PocketBase `users` collection** (`tier`, `stripe_customer_id`, `stripe_subscription_id`, `publisher_window_end`). The webhook handler at `backend/routes/stripe.js` reconciles the two on `payment_intent.succeeded`, `checkout.session.completed`, `customer.subscription.deleted`, and `invoice.payment_failed`.

PocketBase is queried two ways:

- **Admin UI** at `https://pb.pageperfect.studio/_/` — for one-off operator actions.
- **Admin REST API** at `https://pb.pageperfect.studio/api/collections/users/records/<id>` with the admin token from `POCKETBASE_ADMIN_EMAIL` / `POCKETBASE_ADMIN_PASSWORD` — for scripted reconciliation. The backend already wraps this in `ctx.pbFetch`; an operator script can reuse the same auth.

Never write raw SQL against PocketBase from an SOP. PocketBase's SQLite file is internal; mutate through the Admin API so its hooks, validations, and audit trail run.

---

## SOP-01 — Process a refund

**Refund policy (confirmed 2026-05-14):** Publisher and Studio refunds eligible within **14 days** of purchase, **full refund only if no unwatermarked PDF has been exported** (i.e. the buyer never used the entitlement). If an export occurred, the refund is discretionary — see the "After any time-bounded refund policy expires" section below. Rationale: a one-time-charge digital good where the value has already been delivered (an unwatermarked PDF in hand) is non-returnable without operator discretion. **Pricing claim**: <!-- TODO: ship FAQ copy update via `legal-page-draft` to make this 14-day full-refund-if-no-export policy public-facing on `/pricing`. -->

**When**: a customer requests a refund on a Publisher ($19.99) or Studio ($199) charge.

**Action (operator, in Stripe Dashboard)**:

1. Stripe → Payments → search by email or `payment_intent` ID → open the charge.
2. Click **Refund payment** → refund the **full amount**. Partial refunds are at operator discretion; record the rationale in the Stripe note field on the customer.
3. The webhook does not currently downgrade tier on `charge.refunded`. After the refund clears, manually revoke the entitlement using SOP-04 (Publisher) or SOP-05 (Studio).

**Verification**:

1. Stripe webhook fires `charge.refunded` → check Coolify logs for the `module: 'stripe'` entry corresponding to the event ID.
2. Open the user record in PocketBase Admin (`users` collection, filter by `stripe_customer_id`). Confirm `tier` and `publisher_window_end` reflect the revoked state.
3. Email the customer from `support@pageperfect.studio` <!-- TODO: confirm support email address --> with a one-line confirmation. No template.

**After any time-bounded refund policy expires**: refunds are discretionary; document the rationale in the customer's Stripe note. Default position is "no refund after the policy window, but offer credit on a future purchase if the customer is reasonable."

**Council**:

- #9 Lawyer: refund policy must match whatever the `/pricing` FAQ states; if the FAQ is silent, the operator's default policy still has to be documented here for consistency.
- #11 Investor voice: refund-process generosity is part of brand trust; over-deliver when borderline.

---

## SOP-02 — Dispute / chargeback response

**When**: Stripe notifies the operator of a dispute (`charge.dispute.created`).

**Action (operator, in Stripe Dashboard)**:

1. Open the dispute in Stripe → read the reason code.
2. Collect evidence:
   - Customer email and Stripe customer ID.
   - Date and time of the original charge.
   - PocketBase user record showing `tier`, `publisher_window_end`, and the matching `manuscripts` records the user exported during the window.
   - Coolify backend logs showing the compile + export events for that user during the window.
3. Submit evidence in the Stripe dispute UI before the deadline (Stripe shows the cutoff; treat it as hard).
4. Regardless of outcome, immediately revoke entitlements per SOP-04 or SOP-05 — if the dispute resolves in the customer's favour the money is already gone and the entitlement should not remain.

**Verification**:

- Track the dispute through `charge.dispute.updated` and `charge.dispute.closed` events in Stripe.
- Log the outcome in <!-- TODO: confirm where disputes are tracked operationally — `incident-history.md` is for outages; disputes may want their own append-only log. -->

**Council**:

- #9 Lawyer: do not concede a dispute that contradicts the documented refund policy without recording why.
- #11 Investor voice: a dispute lost cleanly is cheaper than a dispute won loudly; respond with evidence, not argument.

---

## SOP-03 — Extend a Publisher 14-day re-export window (retroactive)

**When**: support request from a Publisher buyer who needs more than 14 days because of a compile failure, font issue, or anything else attributable to PagePerfect rather than the user's pacing.

**Action (operator, PocketBase Admin)**:

1. Open PocketBase Admin → `users` collection → find the user by email.
2. Inspect `publisher_window_end`. If it has already expired, decide on an extension length (default: 7 days from "now").
3. Edit the record and set `publisher_window_end` to the new ISO timestamp.
4. Save. The backend's per-request entitlement check reads this field directly (see `backend/entitlements.js`); the new window takes effect immediately.

**Alternative: scripted (for multiple users)**:

```bash
# Reuses the same admin auth the backend uses.
# Replace USER_ID with the PocketBase record ID.
curl -X PATCH "https://pb.pageperfect.studio/api/collections/users/records/USER_ID" \
  -H "Authorization: $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"publisher_window_end": "2026-06-01T00:00:00.000Z"}'
```

Obtain `ADMIN_TOKEN` by `POST /api/admins/auth-with-password` against PocketBase using the admin credentials from Coolify env. Never paste the admin password into a shell history.

**Verification**:

- Re-open the user record; `publisher_window_end` shows the new date.
- Ask the customer to re-export. The backend should produce a watermark-free PDF and the `x-pp-watermarked` response header should be absent or `false`.

**Council**:

- #11 Investor voice: when PagePerfect failed the customer, extend without negotiation.
- #15 Staff engineer: never mutate `tier`; the window is the right field for one-manuscript extensions. Mutating tier promotes the user to permanent Studio.

---

## SOP-04 — Revoke a Publisher entitlement after refund

**When**: SOP-01 completed for a Publisher charge.

**Action (operator, PocketBase Admin)**:

1. Open `users` collection → find the user by `stripe_customer_id` or email.
2. Set `publisher_window_end` to a timestamp in the past (the current ISO timestamp works).
3. Leave `tier` alone if the user has never been Studio; the Publisher per-manuscript model treats `tier='publisher'` as a hint, not a permanent state — the window field is what gates exports.

**Confirmed 2026-05-14:** Yes — after a Publisher refund within the 14-day window (and only when no unwatermarked PDF was exported), reset `tier='drafter'` on the user record AND clear `publisher_window_end` AND drop the Redis entitlement key per SOP-04 below. The Stripe webhook does NOT currently downgrade tier on `charge.refunded` automatically — the tier flip must be done manually as part of SOP-01 until the webhook handler is extended. **Engineering follow-up:** extend `backend/routes/stripe.js` webhook to handle `charge.refunded` with the same 14-day + no-export guard.

**Verification**:

- Customer re-exports → the watermark is back, `x-pp-watermarked: true`.

---

## SOP-05 — Revoke a Studio entitlement after refund

**When**: SOP-01 completed for a Studio charge.

**Action (operator, PocketBase Admin)**:

1. Open `users` collection → find the user.
2. Set `tier` to `drafter`.
3. Clear `stripe_subscription_id` (set to empty string).
4. Set `publisher_window_end` to a past timestamp.

**Verification**:

- Customer re-exports → watermark is back, `x-pp-watermarked: true`.
- Tier-gated features in the editor (EPUB export, custom font upload, batch export) become unavailable.

---

## SOP-06 — Upgrade a Publisher user to Studio

**When**: a Publisher customer wants to pay the difference (or full $199, depending on policy) to convert to Studio.

<!-- TODO: confirm with operator whether the difference is credited or whether Studio is charged at full $199. The pricing page does not currently advertise a discounted upgrade path. -->

**Action**:

1. Charge the customer in Stripe — either a new $199 Studio charge or an off-session credit-then-charge per the agreed policy.
2. After payment clears, open the user record in PocketBase Admin.
3. Set `tier` to `studio`.
4. Leave `publisher_window_end` alone — Studio doesn't read it; downgrades fall back to it.
5. Save.

**Verification**:

- Customer exports a manuscript that was not previously in their Publisher window → no watermark, `x-pp-watermarked` absent or `false`.

**Council**:

- #30 Payment systems: do not stack subscription-style logic onto a one-time-charge product; if upgrades become common, define a real Stripe price for "Publisher → Studio upgrade" instead of doing manual credits.

---

## SOP-07 — Reconcile a payment that succeeded in Stripe but didn't update PocketBase

**When**: a customer reports they paid but `/app` still shows watermark on export. Usually a webhook delivery failure or PocketBase being unreachable when the webhook fired.

**Action**:

1. Stripe Dashboard → Developers → Webhooks → the `/api/stripe/webhook` endpoint → find the event and look at the response status.
2. If the event response is non-2xx, click **Resend** to redeliver. The webhook handler is idempotent (PocketBase upsert by user ID + dedupe by event ID per `backend/routes/stripe.js`).
3. If resending still fails, mutate the user record directly per SOP-03 (Publisher) or set `tier='studio'` (Studio) per the values the webhook would have written:
   - `tier` ← `publisher` or `studio`
   - `stripe_customer_id` ← the Stripe customer ID from the event
   - `publisher_window_end` ← `now + 14 days` for Publisher; leave for Studio
4. Capture the failure mode in the next `incident-postmortem` if it's a pattern.

**Verification**:

- User re-exports without watermark.
- Webhook logs show the event ID; if you redelivered, the second attempt should now be 2xx.

---

## SOP-08 — Post-incident reconciliation sweep

**When**: after any incident touching the Stripe webhook, PocketBase, or the entitlements module.

**Action**:

1. Pull the list of Stripe events from the incident window (Stripe Dashboard → Events, filter by time range).
2. For each `payment_intent.succeeded` and `checkout.session.completed`, look up the user in PocketBase Admin and confirm `tier` and `publisher_window_end` match what the webhook would have written.
3. For any mismatch, apply SOP-07.
4. Sample-check: pick five `customer.subscription.deleted` events and confirm the affected users are on `tier='drafter'`. **Verified 2026-05-14:** the handler is live code at `backend/routes/stripe.js:123-157`. On `customer.subscription.deleted` it (a) sanitises `sub.customer` to alphanumeric, (b) filters PocketBase `users` where `stripe_customer_id=` matches, (c) PATCHes the first match with `{ tier: 'drafter', stripe_subscription_id: '' }`. Idempotency is enforced by `ctx.isStripeEventProcessed(event.id)` at `:32-35`. PagePerfect is a one-time-charge product (no Subscription objects are created), so in practice this event should fire zero times in production — but the handler is real and safe to leave in place. <!-- TODO (sharpened 2026-05-14): operator + #30 Payment systems engineer to decide whether to (a) retire the handler entirely (PagePerfect ships no Subscription primitives, so dead code), (b) keep it as forward-stub for a future subscription tier, or (c) hard-fail and `log.warn` on receipt so any accidental subscription is loudly flagged rather than silently downgrading the user. Until then, this sample-check step will normally find zero events. -->
5. Log the sweep result in <!-- TODO: confirm — likely append a line to `incident-history.md` referencing this SOP. -->

---

## Maintenance

- Quarterly review by operator + #30 + #11.
- New SOP added when a recurring billing-side action proves to be a manual workflow worth documenting (3+ occurrences).
- Each SOP rewritten when the underlying code path changes (`backend/routes/stripe.js`, `backend/entitlements.js`, or the PocketBase `users` schema).

## Changelog

- 2026-05-14: Rescoped from AG vendors (Neon Postgres / wallet-monitoring SQL) to PagePerfect vendors (PocketBase / Stripe / Lulu / Coolify / DigitalOcean) and PocketBase-admin-SDK-based SOPs. TODOs flag items needing operator confirmation.
