# kpi-tree.md — Canonical KPI tree

The single tree everyone refers to when arguing about a number. Owned by #35 Product analyst; updated by ADR.

## Shape

```
North-star
  ├── Primary KPIs (one per major surface / lifecycle stage)
  │     ├── Secondary metrics (diagnostic; not goals)
  │     └── Health checks (red lines; not goals)
```

## North-star

**Successful unwatermarked PDF exports per week** — the count of compile-and-download events where (a) the manuscript reached a completed export, (b) the output is watermark-free (i.e. Publisher or Studio tier), and (c) no compile error or layout-sanity red flag fired.

- Why: PagePerfect's value is realised the moment an author has a print-ready PDF in hand. Drafter exports are watermarked previews — useful as a top-of-funnel signal, but not the value moment. Unwatermarked + clean-compile is the closest proxy to "we made a new author print-ready this week."
- Owner: #35 Product analyst.
- Refresh: weekly.
- Decisions it informs: roadmap prioritisation, pricing experiments, fundraising narrative.
- <!-- TODO: confirm with stakeholder — BUSINESS.md does not name a north-star explicitly. Alternate candidate: "manuscripts shipped to print" (Lulu-only). Operator sign-off needed before this becomes canon. -->

## Primary KPIs

### Acquisition
| Metric | Decision it informs | Owner |
|---|---|---|
| Organic search sessions to `/` + `/blog/*` (weekly) | Content strategy + SEO investment | #35 + marketing analytics |
| Direct + branded sessions (weekly) | Brand health; outreach + PR effectiveness | #35 + #5 |
| Referral sessions from listings (Product Hunt, awesome-self-publishing, KDP-author communities) | Listing-submission ROI | #35 + #12 |

### Activation
| Metric | Decision it informs | Owner |
|---|---|---|
| Editor-visit rate (editor sessions / landing sessions, weekly) | Hero clarity; "Try the editor" CTA position | #35 + conversion |
| First-paste / first-upload rate (manuscripts started / editor sessions, weekly) | Editor onboarding friction; sample-manuscript bias | #35 + #7 + design |
| First-preview-compile rate (compiles completed / manuscripts started, weekly) | Compile reliability; template-picker discoverability | #35 + #7 |
| Second-preview rate (second compile within session / first compiles, weekly) | Preview engagement; template/margin iteration loop | #35 + #7 |

### Conversion
| Metric | Decision it informs | Owner |
|---|---|---|
| Upgrade-intent rate (Export click + paywall hits / Drafter previews, weekly) | Watermark friction calibration; export CTA placement | #35 + conversion + #5 |
| Checkout-start rate (Stripe sessions created / upgrade-intent events, weekly) | Pricing-page persuasion; tier comparison clarity | #35 + conversion + #5 |
| Publisher purchase rate (Publisher purchases / checkout starts, weekly) | Checkout UX; payment failure modes | #35 + #30 |
| Studio purchase rate (Studio purchases / checkout starts, monthly) | Studio positioning vs. Publisher | #35 + conversion + #5 |
| Drafter → Publisher conversion (Publisher purchases / Drafter compilers, weekly) | Free-tier-to-paid funnel health | #35 + conversion |
| Drafter → Studio conversion (Studio purchases / Drafter compilers, monthly) | Lifetime-tier appeal | #35 + #5 |
| Publisher → Studio upsell rate (Studio buys from Publisher customers / Publisher customers, quarterly) | Upsell positioning | #35 + #5 |

### Retention
| Metric | Decision it informs | Owner |
|---|---|---|
| Publisher 14-day re-export usage (% of Publisher buyers exporting ≥2× in their 14-day window) | Publisher value delivery; iteration loop validation | #35 + #5 |
| Studio 30-day active rate (% of Studio buyers exporting in days 0–30) | Studio activation health | #35 + #5 |
| Studio 90-day active rate (% of Studio buyers exporting in days 0–90) | Long-term Studio fit | #35 + #5 |
| Drafter return rate (% of Drafter manuscript-bucket IDs returning to compile again within 30 days) | Free-tier stickiness; sample bias check | #35 |

### Revenue
| Metric | Decision it informs | Owner |
|---|---|---|
| Weekly bookings (Publisher + Studio gross) | Run-rate + cash planning | #35 + #11 |
| Cumulative Studio sales (lifetime tier; one-time) | Lifetime-tier saturation curve | #35 + #11 |
| Average revenue per Drafter (gross bookings / unique Drafter compilers in window) | Free-tier monetisation efficiency | #35 + #11 |
| Refund + cancellation rate (refunds / purchases, monthly) | Buyer-remorse signal; pricing or claim accuracy | #35 + #11 + #9 |
| LTV / CAC ratio (where calculable) | Marketing spend allocation | #35 + #5 |
| <!-- TODO: instrumentation needed — repeat-Publisher rate (buyers purchasing Publisher for a second manuscript) once the data exists to compute it. --> | Multi-manuscript author monetisation | #35 |

### Reliability (engineering KPIs)
| Metric | Decision it informs | Owner |
|---|---|---|
| Compile success rate (% of compiles returning a PDF without a Typst error, weekly) | Pipeline health; template stability | #35 + #34 |
| Compile p50 + p95 latency (seconds from job-enqueue to PDF ready) | Worker capacity; queue tuning | #35 + #34 |
| Render-failure top causes (font fallback, oversized image, unsupported pandoc construct — counted weekly) | Where to invest pipeline hardening | #35 + #34 |
| Layout-sanity flag rate (% of compiles with rivers / orphans / widows / underfull flags, weekly) | Typography quality drift; template bugs | #35 + #3 + #31 |
| KDP / IngramSpark / Lulu preflight pass rate by template (% of preflights passing per template, weekly) | Template-specific compliance regressions | #35 + #31 + #32 |
| Webhook delivery success rate (Stripe + Lulu) | Payment + print-order reliability | #35 + #30 + #31 |
| MTTR on P0 incidents (rolling 90-day) | On-call / runbook quality | #35 + #10 |

### Distribution (growth KPIs)
| Metric | Decision it informs | Owner |
|---|---|---|
| Grant pipeline value (open applications × amount × estimated probability) | Growth focus + cashflow planning | #35 + #12 |
| Listing-driven sessions per listing (28-day post-listing) | Listing-submission ROI by directory | #35 + #12 |
| Lulu print-order completion rate (orders reaching SHIPPED / orders created, monthly) | Print-fulfilment pipeline health (Lulu-integration only) | #35 + #12 + #34 |
| Partnership-attributed compiles (where partner integration drives traffic) | Integration-proposal prioritisation | #35 + #12 + #6 |

## Health checks (red lines, not goals)

These exist so that we notice when something breaks. They are not optimisation targets.

- **Compile error rate** — alert when >2% over 24h.
- **Publisher refund rate** — alert when >5% in any 30-day window.
- **Stripe webhook signature-verification failure rate** — alert on any spike (>3 in 1h).
- **Lulu webhook signature-verification failure rate** — alert on any spike (>3 in 1h).
- **Layout-sanity D-grade rate** (per `compile-worker.js` typographic report) — alert when >10% of compiles return D in any 24h window; signals a template regression.
- **Cookie-consent rejection rate** — observe; do not optimise. If we see attempts to "improve" this metric, that itself is a red flag.

## Anti-patterns (banned KPIs)

- Likes, impressions, follower counts as primary metrics.
- "Time on page" as a goal.
- Anything per-manuscript that joins manuscript content to user identity.
- Cohort metrics that require de-anonymising buyers.
- Metrics computed two ways across two skills.

## Maintenance

- A new KPI requires `define-metric` + #35 sign-off + an entry here + an entry in `metric-catalog.md`.
- Removing a KPI requires an ADR explaining why and what replaces it.
- Reframing the north-star requires #11 + #35 + the operator.

## Changelog

- 2026-04-17: Original AG kpi-tree (scan-rate / connect-rate / first-revoke + Pro/Sentinel/API tiers).
- 2026-05-14: Rescoped from AG funnel (scan/connect/revoke + Pro/Sentinel/API tiers) to PagePerfect funnel (landing → editor → preview → checkout + Drafter/Publisher/Studio tiers). Any specific numbers replaced with TODO markers — instrumentation needed.
