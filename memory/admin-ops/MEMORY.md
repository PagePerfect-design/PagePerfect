# memory/admin-ops/MEMORY.md — Admin & Operations Index

Loaded when an admin-ops skill is active.

## Standing rules

1. **Autonomy level 2** — briefs, audits, snapshots, reviews, post-mortems. User executes any vendor/finance actions.
2. **Postmortems are blameless and append-only** — see `incident-history.md` under `product-engineering/`.
3. **Vendor reviews require receipts** — don't recommend or terminate without invoice + usage data.
4. **No customer data in any document leaving this directory** (anonymize or aggregate).

## Skills owned

| Skill | Purpose |
|---|---|
| `support-triage` | Categorize incoming support, route to dept, surface trending issues |
| `docs-coherence-audit` | Audit `/docs` and `journal` for drift from product reality |
| `finance-snapshot` | Quarterly finance snapshot (revenue by tier, vendor spend, runway) |
| `vendor-review` | Vendor performance + cost review |
| `incident-postmortem` | Postmortem template + facilitation |
| `internal-coordination-brief` | Brief for internal stakeholders on cross-cutting work |
| `pp-handover` | End-of-session handover (PagePerfect-scoped, builds on global `handover`) |
| `session-orient` | Start-of-session orientation — reads handovers, CORRECTIONS, STATUS, git, plans. Emits a 30-second brief. |
| `stale-detector` | Quarterly scan of `memory/`, `projects/`, root `.md` for expired dates, dead paths, AG-residuals, stale TODOs. Produces P0–P3 report. |
| `gap-audit` | Quarterly scan of `src/` for test coverage, error handling, security, design-system, compile-pipeline, and process gaps. Produces P0–P3 report routed to fixing skills. |

## Memory files

| File | Purpose |
|---|---|
| `billing-sops.md` | Standard ops for refunds, disputes, subscription edge cases |
| `docs-map.md` | What docs exist, who owns each, when they were last touched |
| `finance-baseline.md` | Baseline cost structure, vendor list, revenue model |
| `ops-calendar.md` | Recurring ops cadence (monthly close, quarterly review) |
| `support-categories.md` | Support taxonomy with routing rules |
| `vendor-register.md` | Every vendor with contract terms, renewal date, owner |

## Residual AG-flavored content

`support-categories.md` references chain/scan/RPC support categories. Rewrite for PagePerfect categories: compile failures, watermark complaints, KDP rejection, Stripe billing, font upload, tier upgrade.
