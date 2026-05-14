# metrics.md — What success looks like

One primary metric per surface. Everything else is a secondary observation.

## Primary metrics per surface

| Surface | Primary metric | Why |
|---|---|---|
| Landing (`/`) | Landing → editor click-through rate | The landing has one job: get visitors into the editor. |
| Editor (`/editor`) | First successful compile per new session | Activation. A user who never compiles never converts. |
| Pricing page (`/pricing`) | Visit → checkout-start rate (Publisher + Studio combined) | Conversion is the whole point of the page. |
| Checkout (Stripe Checkout) | Checkout-start → purchase completion rate | Catches drop-off between intent and payment. |
| Templates page (`/templates`) | Template-detail click → editor-open rate | Templates are a primary discovery path. |
| Blog / docs | Organic search sessions to `/blog/*` and `/docs/*` | Content has one job: get new authors in. |
| Social (X, LinkedIn, indie-author Discords) | Clicks to `/` or `/blog/*` | Vanity metrics (likes, impressions) are observations. Traffic is the outcome. |
| Outreach (book coaches, Reedsy editors, ALLi partners) | Replies + meetings booked | Not opens. Not sends. |

## Full funnel (compile-to-purchase)

The canonical funnel for PagePerfect:

1. Landing visit
2. Editor visit (from landing or direct)
3. First compile (free Drafter tier; output is watermarked)
4. Upgrade-intent click (pricing page, paywall modal, or download-page upsell)
5. Checkout start (Stripe Checkout opens)
6. Purchase complete (Publisher $19.99 or Studio $199)

<!-- TODO: instrumentation needed — per-step conversion rates are not currently exported to `context/analytics/`. funnel-analysis skill requires this. -->

## Secondary observations (not decisions)

- Impressions, likes, reposts, shares.
- Time on page, scroll depth.
- Template-mix in compiled output (which of the 15 templates dominate).
- Page-size mix (6x9 trade vs 5x8 mass-market vs 8.5x11 workbook, etc.).
- Segment split (KDP-bound author / IngramSpark-bound / Lulu-bound / editor-for-clients) where identifiable from template choice or referrer.

## Data hygiene (gated by #24 Data protection veto)

- Analytics skill works from **aggregated data only**. No PII.
- Manuscripts are session-scoped and deleted on request; never tie manuscript content to behavioural data.
- No cross-site tracking pixels in marketing pages.
- Current cookie consent language governs what can be collected. If an experiment would violate it, rewrite the experiment, not the consent.

## Reporting cadence

- Weekly brief by the analytics skill, pulled from whatever export file the user provides in `context/analytics/`.
- Monthly review by the campaign-manager skill — ties metrics back to `experiments.md` and `content-history.md`.

## Anti-patterns

- Treating likes as a goal.
- A/B testing without a pre-declared minimum observation window.
- Measuring surface health with the wrong metric (e.g. measuring the blog by checkout-start rate).
- Pulling individual-user data without a documented purpose.
- Reporting compile counts as a success metric without segmenting watermarked (Drafter) vs clean (Publisher / Studio) — they measure different things.

## Changelog

- 2026-05-14: Rescoped from AG segments / crypto regs / EF-style ecosystems to PagePerfect publishing market (KDP / IngramSpark / Lulu / indie author segments). Crypto regs and chain ecosystems removed entirely.
