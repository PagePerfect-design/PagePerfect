# metric-catalog.md — Every metric, defined once

The canonical definition of every metric PagePerfect measures. One row per metric. New metrics enter via the `define-metric` skill and an ADR-style sign-off from #35.

Format:

```
### <metric name>
- Definition: <plain-English; one sentence>
- Formula: <numerator / denominator / window>
- Source: <data source from `data-sources.md`>
- Refresh cadence: <real-time | hourly | daily | weekly | on-demand>
- Owner: <council member by number>
- Decision informed: <one sentence>
- Target / threshold: <if any>
- Aggregation level: <surface / cohort / global>
- PII risk: <none | low — verify aggregation | high — VETO without #24 sign-off>
- Cross-references: <links to dashboards, related metrics>
- Defined: YYYY-MM-DD
- Last reviewed: YYYY-MM-DD
```

---

## Acquisition

### organic_sessions_weekly
- Definition: Weekly count of unique sessions arriving from organic search.
- Formula: count(distinct session_id where source = 'organic' and timestamp in [week_start, week_end))
- Source: Vercel Analytics export (CSV)
- Refresh cadence: weekly
- Owner: #35
- Decision informed: SEO + content investment allocation
- Target / threshold: <!-- TODO: instrumentation needed — set baseline after 4 weeks of clean exports. -->
- Aggregation level: global
- PII risk: none (no IP, no device fingerprint)
- Defined: 2026-05-14
- Last reviewed: 2026-05-14

### direct_branded_sessions_weekly
- Definition: Weekly sessions arriving direct or via a branded search query (e.g. "pageperfect").
- Formula: count(distinct session_id where source in ('direct', 'branded'))
- Source: Vercel Analytics export
- Refresh cadence: weekly
- Owner: #35
- Decision informed: brand health; PR / outreach effectiveness
- PII risk: none
- Defined: 2026-05-14

## Activation

### editor_visit_rate_weekly
- Definition: Fraction of landing-page sessions that reach the editor route.
- Formula: editor_sessions / landing_sessions per week
- Source: Vercel Analytics
- Refresh cadence: weekly
- Owner: #35 + conversion
- Decision informed: hero copy + "Try the editor" CTA placement
- Target: <!-- TODO: instrumentation needed — baseline TBD. -->
- PII risk: low — route-level only, never per-user
- Defined: 2026-05-14

### first_manuscript_rate_weekly
- Definition: Fraction of editor sessions where the user pastes or uploads a manuscript.
- Formula: sessions_with_manuscript_started / editor_sessions per week
- Source: <!-- TODO: instrumentation needed — frontend event for first-paste / first-upload is not currently aggregated to `context/data-intelligence/`. -->
- Refresh cadence: weekly (once instrumented)
- Owner: #35 + #7
- Decision informed: editor onboarding friction; sample-manuscript bias (STATUS.md medium item)
- PII risk: low — counts only; manuscript content never leaves backend
- Defined: 2026-05-14

### first_preview_compile_rate_weekly
- Definition: Fraction of manuscripts-started that complete at least one preview compile.
- Formula: sessions_with_compile_ok / sessions_with_manuscript_started per week
- Source: aggregated compile logs <!-- TODO: instrumentation — confirm export pipeline emits compile-ok events keyed to session bucket. -->
- Refresh cadence: weekly
- Owner: #35 + #7
- Decision informed: compile reliability; template-picker discoverability
- PII risk: low — session bucket only
- Defined: 2026-05-14

### second_preview_rate_weekly
- Definition: Fraction of first-compile sessions that produce a second compile within the same session (template change, margin tweak, content edit).
- Formula: sessions_with_compile_count_ge_2 / sessions_with_compile_count_ge_1 per week
- Source: aggregated compile logs <!-- TODO: instrumentation -->
- Refresh cadence: weekly
- Owner: #35 + #7
- Decision informed: preview engagement; iteration-loop validation
- PII risk: low
- Defined: 2026-05-14

## Conversion

### upgrade_intent_rate_weekly
- Definition: Fraction of Drafter compile sessions where the user clicks Export or hits a paywall surface.
- Formula: (export_clicks + paywall_hits) / drafter_compile_sessions per week
- Source: frontend event log <!-- TODO: instrumentation — confirm aggregation pipeline exists; event names are not yet canonical. -->
- Refresh cadence: weekly
- Owner: #35 + conversion + #5
- Decision informed: watermark friction calibration; export CTA placement
- PII risk: low — counts only
- Defined: 2026-05-14

### checkout_start_rate_weekly
- Definition: Fraction of upgrade-intent events that create a Stripe Checkout session.
- Formula: stripe_checkout_sessions_created / upgrade_intent_events per week
- Source: Stripe export + frontend event log
- Refresh cadence: weekly
- Owner: #35 + conversion + #5
- Decision informed: pricing-page persuasion; tier comparison clarity
- PII risk: low — counts only
- Defined: 2026-05-14

### publisher_purchase_rate_weekly
- Definition: Fraction of Stripe Checkout sessions for Publisher that complete (webhook-confirmed).
- Formula: publisher_purchases_completed / publisher_checkout_sessions per week
- Source: Stripe export (Stripe `checkout.session.completed` events vs `checkout.session.created`)
- Refresh cadence: weekly
- Owner: #35 + #30
- Decision informed: checkout UX; payment failure modes
- PII risk: low — drop email + customer ID at import (see `data-sources.md`)
- Defined: 2026-05-14

### studio_purchase_rate_monthly
- Definition: Fraction of Stripe Checkout sessions for Studio that complete.
- Formula: studio_purchases_completed / studio_checkout_sessions per month
- Source: Stripe export
- Refresh cadence: monthly (lower volume than Publisher)
- Owner: #35 + conversion + #5
- Decision informed: Studio positioning vs. Publisher
- PII risk: low
- Defined: 2026-05-14

### drafter_to_publisher_conversion_weekly
- Definition: Of unique Drafter compilers in cohort week W, the fraction that purchase Publisher within W+30 days.
- Formula: publisher_buyers_in_W_plus_30 / unique_drafter_compilers_W
- Source: aggregated compile logs (Drafter cohort by hashed bucket) + Stripe export <!-- TODO: instrumentation — confirm Drafter compiler bucketing exists and joins safely to Stripe customer cohort without PII leak. -->
- Refresh cadence: weekly
- Owner: #35 + conversion
- Decision informed: free-tier-to-paid funnel health
- PII risk: **medium** — requires cohort join. Bucket scheme must be verified by #19 + #24 before first run.
- Defined: 2026-05-14

### drafter_to_studio_conversion_monthly
- Definition: Of unique Drafter compilers in cohort month M, the fraction that purchase Studio within M+30 days.
- Formula: studio_buyers_in_M_plus_30 / unique_drafter_compilers_M
- Source: aggregated compile logs + Stripe export <!-- TODO: same bucketing dependency as drafter_to_publisher_conversion_weekly. -->
- Refresh cadence: monthly
- Owner: #35 + #5
- Decision informed: lifetime-tier appeal
- PII risk: medium — see above
- Defined: 2026-05-14

### publisher_to_studio_upsell_quarterly
- Definition: Of Publisher customers in cohort quarter Q, the fraction that later purchase Studio within 90 days.
- Formula: studio_buyers_from_publisher_cohort_Q / publisher_buyers_Q
- Source: Stripe export (customer ID as hashed cohort key only)
- Refresh cadence: quarterly
- Owner: #35 + #5
- Decision informed: upsell positioning
- PII risk: low — hashed cohort key
- Defined: 2026-05-14

## Retention

### publisher_14d_reexport_usage
- Definition: Of Publisher buyers in cohort week W, the fraction exporting the same manuscript ≥2 times within their 14-day re-export window.
- Formula: publisher_cohort_W_with_ge2_exports / publisher_cohort_W
- Source: aggregated compile logs (Publisher-tier exports) <!-- TODO: instrumentation — confirm export-count-per-manuscript is aggregated and joinable to Stripe purchase week. -->
- Refresh cadence: weekly (cohort closes at W+14)
- Owner: #35 + #5
- Decision informed: Publisher value delivery; iteration-loop validation
- Target: <!-- TODO: instrumentation needed — baseline TBD after first 4 cohorts. -->
- PII risk: low — cohort counts only
- Defined: 2026-05-14

### studio_d30_active_rate
- Definition: Of Studio buyers in cohort month M, the fraction with ≥1 export in days 0–30 post-purchase.
- Formula: studio_active_at_d30(M) / studio_buyers(M)
- Source: aggregated compile logs + Stripe export
- Refresh cadence: monthly (cohort closes at month-end + 30 days)
- Owner: #35 + #5
- Decision informed: Studio activation health
- Target: <!-- TODO: instrumentation needed — baseline TBD. -->
- PII risk: low — cohort counts only
- Defined: 2026-05-14

### studio_d90_active_rate
- Definition: Of Studio buyers in cohort month M, the fraction with ≥1 export in days 0–90 post-purchase.
- Formula: studio_active_at_d90(M) / studio_buyers(M)
- Source: aggregated compile logs + Stripe export
- Refresh cadence: monthly
- Owner: #35 + #5
- Decision informed: long-term Studio fit
- PII risk: low
- Defined: 2026-05-14

### drafter_return_30d
- Definition: Fraction of Drafter manuscript buckets (hashed) that return to compile again within 30 days.
- Formula: returning_buckets / new_buckets in cohort
- Source: aggregated compile logs (bucket = hashed session/manuscript identifier mod N — never raw content) <!-- TODO: instrumentation — confirm bucketing scheme with #19. -->
- Refresh cadence: monthly
- Owner: #35
- Decision informed: free-tier stickiness; sample-manuscript bias check (STATUS.md)
- PII risk: **medium** — requires bucketing; verify with #19 before any change to bucket scheme
- Defined: 2026-05-14

## Revenue

### weekly_bookings
- Definition: Gross weekly revenue from Publisher + Studio purchases (one-time, not recurring).
- Formula: sum(purchase.amount) over completed Stripe purchases in week
- Source: Stripe export
- Refresh cadence: weekly snapshot, month-end canonical
- Owner: #35 + #11
- Decision informed: run-rate + cash planning
- PII risk: low — sums and counts only
- Defined: 2026-05-14

### studio_cumulative_sales
- Definition: Lifetime count + revenue of Studio purchases since launch.
- Formula: count(studio_purchases) and sum(studio_purchases.amount) over all-time
- Source: Stripe export
- Refresh cadence: weekly
- Owner: #35 + #11
- Decision informed: lifetime-tier saturation curve; when to consider re-pricing
- PII risk: low
- Defined: 2026-05-14

### arpd_weekly
- Definition: Average revenue per unique Drafter compiler in a given window.
- Formula: weekly_bookings / unique_drafter_compilers (same window)
- Source: derived (Stripe + aggregated compile logs)
- Refresh cadence: weekly
- Owner: #35 + #11
- Decision informed: free-tier monetisation efficiency
- PII risk: low — derived from aggregated inputs
- Defined: 2026-05-14

### refund_cancellation_rate_monthly
- Definition: Refunds + cancellation requests as a fraction of purchases in the same month.
- Formula: (refunds + cancellations) / purchases per month
- Source: Stripe export
- Refresh cadence: monthly
- Owner: #35 + #11 + #9
- Decision informed: buyer-remorse signal; pricing or claim-accuracy red flag
- Threshold: >5% triggers `claim-review` of pricing-page and watermark-flow copy
- PII risk: low — counts only
- Defined: 2026-05-14

## Reliability

### compile_success_rate_24h
- Definition: Fraction of compile attempts in last 24h that returned a PDF without a Typst error.
- Formula: compiles_ok / compiles_attempted (rolling 24h)
- Source: aggregated compile logs
- Refresh cadence: real-time (alerting); reported in weekly brief
- Owner: #35 + #34
- Threshold (red line): >2% error rate triggers alert
- PII risk: none — pipeline metric
- Defined: 2026-05-14

### compile_latency_p50_p95
- Definition: 50th and 95th percentile latency from job-enqueue to PDF-ready, in seconds.
- Formula: percentile(compile_completed_at - compile_enqueued_at, [0.5, 0.95]) over rolling window
- Source: aggregated compile logs / BullMQ metrics <!-- TODO: confirm BullMQ metrics are exported to `context/data-intelligence/`. -->
- Refresh cadence: daily
- Owner: #35 + #34
- Decision informed: worker capacity; queue tuning
- PII risk: none
- Defined: 2026-05-14

### render_failure_causes_weekly
- Definition: Top causes of compile failure, counted weekly.
- Formula: count(failures) group by cause_category (font fallback, oversized image, unsupported pandoc construct, Typst parse error, …)
- Source: aggregated compile logs (Typst error translator output — `backend/typst-error-translator.js`)
- Refresh cadence: weekly
- Owner: #35 + #34
- Decision informed: where to invest pipeline hardening
- PII risk: none — categories only, never manuscript content
- Defined: 2026-05-14

### layout_sanity_flag_rate_weekly
- Definition: Fraction of compiles where layout-sanity checker emits one or more flags (rivers, orphans, widows, underfull/overfull boxes).
- Formula: compiles_with_any_flag / compiles_total per week
- Source: aggregated compile logs (`backend/layout-sanity-checker.js` stderr signal)
- Refresh cadence: weekly
- Owner: #35 + #3 + #31
- Decision informed: typography quality drift; template-bug detection
- Threshold: D-grade rate >10% over 24h triggers alert
- PII risk: none
- Defined: 2026-05-14

### preflight_pass_rate_by_template_weekly
- Definition: Fraction of preflight checks passing per template, by target platform (KDP / IngramSpark / Lulu).
- Formula: preflight_pass / preflight_total per (template × platform) per week
- Source: aggregated preflight logs <!-- TODO: instrumentation — confirm preflight-pass events from frontend `LaunchOverlay.tsx` are aggregated and bucketed. -->
- Refresh cadence: weekly
- Owner: #35 + #31 + #32
- Decision informed: template-specific compliance regressions
- PII risk: none
- Defined: 2026-05-14

### webhook_delivery_success_rate
- Definition: Fraction of incoming Stripe + Lulu webhooks processed successfully.
- Formula: webhooks_processed_ok / webhooks_received
- Source: webhook log (aggregated; backend `routes/stripe.js` + `routes/lulu.js`)
- Refresh cadence: hourly aggregation
- Owner: #35 + #30 + #31
- Threshold: >1% failure triggers investigation
- PII risk: none — counts only
- Defined: 2026-05-14

### mttr_p0_90d
- Definition: Mean time to resolution on P0 incidents over rolling 90 days.
- Formula: mean(resolved_at - opened_at) for P0 incidents in window
- Source: incident log (`memory/product-engineering/incident-history.md`)
- Refresh cadence: monthly
- Owner: #35 + #10
- PII risk: none
- Defined: 2026-05-14

## Distribution

### grant_pipeline_value
- Definition: Sum across open grant applications of (amount requested × estimated probability of award).
- Formula: sum(amount × p_award) over status='open'
- Source: `memory/growth/grants-history.md`
- Refresh cadence: weekly
- Owner: #35 + #12
- PII risk: none
- Defined: 2026-05-14

### listing_referral_sessions_28d
- Definition: Sessions attributed to a listing in the 28 days after submission go-live.
- Formula: count(sessions where source matches listing referrer in [go_live, go_live+28d])
- Source: Vercel Analytics
- Refresh cadence: per-listing on a 28-day window
- Owner: #35 + #12
- PII risk: none
- Defined: 2026-05-14

### lulu_print_order_completion_rate
- Definition: Of Lulu print orders created in cohort month M, the fraction that reach `SHIPPED` status.
- Formula: shipped_orders_in_M / created_orders_in_M
- Source: PocketBase `print_orders` collection (verified real — see `backend/routes/lulu.js`); aggregated weekly export <!-- TODO: confirm aggregated export pipeline exists for `print_orders`. -->
- Refresh cadence: monthly
- Owner: #35 + #12 + #34
- Decision informed: print-fulfilment pipeline health (Lulu-integration only)
- PII risk: low — counts only; never join shipping address to behavioural data
- Defined: 2026-05-14

---

## Removed metrics (kept for audit trail)

- 2026-05-14: All AG-specific metrics removed (`scan_rate_weekly`, `connect_rate_weekly`, `first_revoke_rate_weekly`, `pro_signup_rate_weekly`, `sentinel_signups_weekly`, `api_tier_signups_monthly`, `pro_d30_retention`, `pro_d90_retention`, `sentinel_renewal_rate`, `api_key_active_7d`, `scan_return_30d`, `mrr`, `arr`, `nrr_quarterly`, `scan_success_rate_24h`). Replaced by PagePerfect-funnel equivalents above. AG metrics applied to a wallet-approval product; PagePerfect is a manuscript-compile product with one-time tier pricing, not recurring subscriptions.

## Changelog

- 2026-04-17: Original AG metric catalogue.
- 2026-05-14: Rescoped from AG funnel (scan/connect/revoke + Pro/Sentinel/API tiers) to PagePerfect funnel (landing → editor → preview → checkout + Drafter/Publisher/Studio tiers). Any specific numbers replaced with TODO markers — instrumentation needed.
