# memory/data-intelligence/MEMORY.md — Data & Intelligence Index

Loaded when a data skill is active.

## Standing rules

1. **Aggregated only.** Individual manuscripts, individual users, individual sessions never appear in briefs or dashboards.
2. **Privacy ladder.** Anything that touches user data goes through #24 Data Protection lawyer (**veto**).
3. **Evidence-first metrics.** Every claim about a metric movement is backed by the query that produced it and the date range.
4. **Autonomy level 2** — read-only against exports; briefs, specs, and analysis only. No write-backs to production.

## Skills owned

| Skill | Purpose |
|---|---|
| `define-metric` | Define a new metric with formula, source, owner, refresh cadence |
| `weekly-metrics-brief` | Weekly KPI digest |
| `experiment-design` | Design an A/B experiment with hypothesis, MDE, duration |
| `experiment-readout` | Post-experiment analysis with confidence intervals |
| `funnel-analysis` | Funnel decomposition (landing → signup → first-compile → upgrade) |
| `cohort-retention` | Retention by signup cohort, by tier |

## Memory files

| File | Purpose |
|---|---|
| `data-handling-rules.md` | What data we collect, retention rules, anonymization standard |
| `data-sources.md` | PocketBase, Vercel Analytics, Stripe events, BullMQ metrics — where each lives |
| `experiment-log.md` | Active and archived experiments with status |
| `kpi-tree.md` | KPI hierarchy: top-level → leaf metrics |
| `metric-catalog.md` | Every metric with definition, formula, owner |

## PagePerfect-specific signal map

Funnels to watch:
- Landing visit → Editor first-load → First compile → Sign up → First export → Upgrade
- KDP preflight pass rate by template
- Watermark-banner click-through to pricing
- Compile p95 by template / page-size combination
- Drafter → Publisher conversion rate by tenure
