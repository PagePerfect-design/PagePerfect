# support-categories.md — Taxonomy + routing

The categorical scheme used by `support-triage` to bucket PagePerfect support contacts. Categories are stable; new categories require an ADR. Routing tells the triage skill which downstream skill / department picks up a recurring trend.

## Schema

Every ticket maps to **exactly one** primary category + zero or more secondary tags. Aggregation is by primary category × week. Time-sensitive items (DSAR, security report, payment-blocking) escalate immediately on receipt and are also counted here for trend tracking.

## Severity tiers

Assigned on intake, used by `support-triage` to gate escalation.

- **P0** — production down, payments broken, data loss (manuscript permanently lost), DSAR / security report. Escalate to operator immediately.
- **P1** — feature broken for one or more users; workaround exists or is in flight.
- **P2** — degraded UX, cosmetic defect, documentation gap.
- **P3** — feature request, "nice to have". Aggregate trend only — never a per-ticket commitment.

## Primary categories

### compile-failure
- **What it covers**: Typst compile error surfaced to the user, Pandoc input rejected, `backend/layout-sanity-checker.js` stderr signal, oversized image rejected by the asset pipeline, font fallback chain exhausted, unsupported Pandoc construct (raw HTML, exotic table, unsupported math).
- **Default severity**: P1 (a manuscript will not export) — P0 only if the queue is rejecting *all* compiles.
- **Triage rule**: cross-check `backend/compile-worker.js`, `backend/typst-templates/<template>.typ`, and recent commits to `backend/typst-error-translator.js` (if present) or compile-utils.
- **Routing if trending up**: `debug-prod-incident` (if reliability KPI breach), `fix-bug` (if single reproducible defect), `writer` (if the error message itself is unclear — #13 UX writer + #21 Technical clarity).
- **Cross-check**: against `compile_success_rate_24h` and `render_failure_causes_weekly` (per `weekly-metrics-brief`).

### export-failure
- **What it covers**: watermark stripping did not happen after Publisher purchase (PocketBase tier flip lag), Ghostscript PDF/X-1a conformance step crashed during IngramSpark-route export, exported PDF exceeds the download size limit, BullMQ job stuck in `active` past TTL, "Download Preview PDF (Watermarked)" was clicked but no file produced.
- **Default severity**: P1 — P0 if the watermark-removal path is broken (paying user receives watermarked PDF).
- **Triage rule**: confirm tier flip in PocketBase before assuming the worker is broken. Check `backend/watermark-typst.js`, `backend/entitlements.js`, the 14-day Publisher window logic, and the Ghostscript PDF/X-1a step in the compile-worker.
- **Routing if trending up**: `fix-bug`, `debug-prod-incident` (if cross-cutting), `claim-review` (if the spike correlates with watermark-confusion copy regressions).
- **Compliance touch**: #11 Investor voice on any "free of watermark" copy; #24 Data protection on any user-data export claim.

### editor-ux
- **What it covers**: TipTap editor state corruption, manuscript "lost" (session timeout — actually purged per Privacy Policy Clause 01, see Product truth in `support-triage`), template switch broke layout, margin preset not applying, paste rendering wrong (smart-quote / em-dash conversion drift), preview pane lag.
- **Default severity**: P2 — P1 if the user reports lost work that was not recoverable from client-side IndexedDB.
- **Triage rule**: separate "manuscript-lost" (expectation issue — copy/UX problem, never a data bug if the 24h sweeper ran on schedule) from "TipTap state corruption" (genuine defect). Cross-check `frontend/src/app/app/CompileShell.tsx` and recent TipTap version changes.
- **Routing if trending up**: `fix-bug` (state corruption), `web-implementation` (microcopy regression), `design-component` (preview pane / template picker), `docs-coherence-audit` (if users repeatedly miss the session-scoped warning).

### billing-dispute
- **What it covers**: Stripe charge not reflected in PocketBase tier flip, refund request, double-charge concern, subscription confusion ("when does it renew?" — PagePerfect is one-time only; this surfaces a copy gap — Technical clarity #21), Publisher 14-day window expiry questions, Studio upgrade-path questions.
- **Default severity**: P1 — P0 if a charge succeeded and entitlement never landed.
- **Triage rule**: never quote charge amounts or email addresses in the brief; counts only. Cross-check `backend/routes/stripe.js` webhook delivery against the timestamp the user reports, and `backend/entitlements.js` for the 14-day window math.
- **Routing if trending up**: `implement-checkout-flow` (if a flow defect), `webhook-review` (if signature / replay / idempotency issue), `conversion` (if pricing-page confusion is the root), `claim-review` (if copy describes a "subscription").
- **Compliance touch**: refund handling per Stripe ToS + Consumer Rights Act 2015 (#9); SCA / PSD2 issues (#30).

### lulu-print-order
- **What it covers**: Lulu xPress order failed to create, cost calculation wrong, sandbox vs production environment confusion, webhook did not update order status, ship address invalid / rejected, author received a printed copy with defects.
- **Default severity**: P1 — P2 if the order eventually succeeded with a delay.
- **Triage rule**: confirm Lulu sandbox vs prod env (`LULU_ENV`); confirm HMAC-SHA256 verification passed via `backend/lulu.js:verifyWebhook`; check `print_orders` PocketBase collection for the `lulu_job_id`. Defective printed copies are Lulu's quality issue — capture proof and route to Lulu support, not to engineering.
- **Routing if trending up**: `fix-bug` (integration defect), `webhook-review` (if delivery failure / signature issue), `outreach` (if Lulu side — operator handles the partner relationship), `claim-review` (if "Lulu-ready" or "Lulu-integrated" copy implies more than the integration delivers).
- **Compliance touch**: Lulu xPress API ToS (#23 Regulatory) — what we may submit on the author's behalf.

### login-auth
- **What it covers**: PocketBase JWT expired mid-session, password reset email did not arrive (verify the configured email provider — Resend per `vendor-register.md`), magic-link broken, OAuth provider error, account locked.
- **Default severity**: P1 — P0 if reset-email delivery is broken org-wide.
- **Triage rule**: cross-check Resend delivery logs before assuming PocketBase is at fault. Any spike correlates with potential credential-stuffing — escalate to #4 Security.
- **Routing if trending up**: `fix-bug` (defect), `debug-prod-incident` (if outage signal), `design-component` (onboarding UX), `vendor-review` (if Resend reliability is the trend).

### platform-rejection
- **What it covers**: author reports the exported PDF was rejected by KDP / IngramSpark on first upload. Triage's job is to verify which spec the exporter aimed for vs what was rejected (KDP bleed math, IngramSpark gutter, ICC profile, font embedding).
- **Default severity**: P1 — P0 if a recently-shipped template change correlates with a wave of rejections (typography regression).
- **Triage rule**: capture the platform error verbatim, the template + page size + margin preset used, and the preflight result from `backend/publishing.js`. Cross-check `backend/platform-compliance.js` for the spec version targeted vs the platform's current published spec.
- **Routing if trending up**: `fix-bug` (single template regression), Typography Council (#3 + #31 + #32 VETO on typographic-quality claims) for any "KDP-ready" / "IngramSpark-spec" claim review, `claim-review` (always — a rejection trend implicates a marketing claim), `legal-page-draft` (if our compliance copy needs caveat).
- **Cross-check**: against `preflight_pass_rate_by_template_weekly`.

### feature-request
- **What it covers**: "can you add X?", "would love Y", new template requests, new page-size requests, EPUB export polish, batch export edge cases, integration requests (new POD service, Draft2Digital, PublishDrive).
- **Default severity**: P3 (categorical).
- **Triage rule**: aggregate trend only. Most feature-request tickets receive a personal reply from the operator. Counts inform; the roadmap is owned by the operator + #35 Product analyst + the relevant Council.
- **Routing if trending up**: `content-strategy` (blog / changelog acknowledgement), `build-feature` (if approved), `integration-proposal` (if partner-shaped), `design-component` (if a clear primitive is missing).
- **Note**: out of scope categorically — do not route to engineering by default.

### documentation-gap
- **What it covers**: "the docs say X but the product does Y", broken links in `/docs` or `/journal`, missing examples, unclear quickstart, author could not find how to do X.
- **Default severity**: P2 — P1 if a documentation-gap actively blocks paying users.
- **Triage rule**: separate "docs are wrong" (product drift — route to `docs-coherence-audit`) from "docs are missing" (route to `writer`). Both are valid; the routing differs.
- **Routing if trending up**: `docs-coherence-audit` (if systemic), `writer` (if a single doc / page), `web-implementation` (if microcopy in-product).

## Auxiliary categories (counted, not always routed)

### legal
- **What it covers**: privacy questions, UK GDPR / EU GDPR / CCPA data-subject requests (DSARs), terms-of-service questions, deletion requests, copyright-on-manuscript questions, jurisdiction questions.
- **Default severity**: P0 by default — DSARs have a 1-month UK GDPR response window (Article 12).
- **Routing**: operator + #9 + #24 immediately. Never auto-routed. `support-triage` flags as time-sensitive with deadline date.
- **Note**: never publicly quote a DSAR's content; counts only.

### security-report
- **What it covers**: "I found a vulnerability", "this looks phishable", any responsible-disclosure-shaped contact. Includes LaTeX-injection PoC reports (Pandoc `-raw_tex` boundary still applies even under Typst).
- **Default severity**: P0.
- **Routing**: operator + #4 immediately. **Verified 2026-05-14:** `SECURITY.md` does **not** exist at repo root. Until it ships, route disclosure intake to operator inbox + `info@eazyaccess.org` privately. <!-- TODO (sharpened 2026-05-14): `legal-page-draft` to draft a root-level `SECURITY.md` covering disclosure email, PGP key (if any), in-scope assets, out-of-scope assets, response SLA, and safe-harbour language. -->.
- **Privacy**: do not publicise. Acknowledged via private channel.

### partner-press
- **What it covers**: B2B inquiries, partnership inbound (POD partners, publishing platforms, author tooling integrations), press requests, podcast invitations.
- **Default severity**: P2 (no SLA, operator-paced).
- **Routing**: operator + relevant Growth skill — `partnership-brief` for partnerships, `outreach` for press follow-up, `integration-proposal` for technical integrations.
- **Note**: not a support ticket per se but lands in the same inbox; categorised so it does not pollute support trends.

### spam-unrelated
- **What it covers**: phishing, sales pitches, off-topic.
- **Routing**: deleted; counted only for inbox health.

## Secondary tags (multi-select)

Used to add granularity within a primary category:

- `template:<id>` — for compile-failure, export-failure, platform-rejection (e.g. `template:thesis`, `template:cinema`).
- `page-size:<id>` — for export-failure and platform-rejection (e.g. `page-size:six-by-nine`, `page-size:us-trade`).
- `tier:<drafter|publisher|studio>` — derived from PocketBase, not from user claim.
- `platform:<kdp|ingramspark|lulu|other>` — for platform-rejection and any preflight-rejection trend.
- `provider:<stripe|lulu|resend|pocketbase>` — for billing-dispute, lulu-print-order, login-auth issues.
- `mobile|desktop` — for editor-ux.
- `repeat-contact` — same user contacted before (operator-tagged; never inferred from PII).
- `time-sensitive` — DSAR window, security report, payment-blocking.

## Volume thresholds (when to escalate)

A category that exceeds **15% of weekly volume** OR **3× its 4-week baseline** is escalated in the triage brief. Smaller spikes are flagged; not escalated. Time-sensitive items (legal / security-report / payment-blocking under billing-dispute) escalate immediately on receipt regardless of volume.

## Anti-patterns

- Reporting individual tickets in a weekly brief.
- Quoting user message text.
- Quoting manuscript content (this is the strictest rule — manuscripts are session-scoped and never appear in any document leaving the support tool).
- Naming users.
- Categorising a security report as `security-report` without immediate operator + #4 notification.
- Treating a feature-request count as a feature-request mandate. Counts inform; the roadmap is owned by the operator + product council.
- Routing a `documentation-gap` directly to engineering — it goes to `docs-coherence-audit` or `writer` first.
- Conflating "manuscript-lost" reports with a data-loss bug. The 24h asset sweeper (`backend/index.js` ASSET_MAX_AGE_MS = 24 hours) is intentional and Privacy-Policy-canonical; this is a copy / expectation gap, not a defect.

## Maintenance

- Quarterly review by #36 Operations manager + #19 Privacy / GDPR specialist + #4 Security engineer.
- New category requires an ADR + #36 sign-off.
- Removing a category requires re-tagging the historical entries; never silently drop.

## Changelog

- 2026-05-14: Rescoped from AG (wallet-security categories / wallet-security claims) to PagePerfect (compile/export/billing/Lulu categories / KDP-IngramSpark-Lulu claim provenance). Golden-ratio claim flagged P0 per STATUS.md.
