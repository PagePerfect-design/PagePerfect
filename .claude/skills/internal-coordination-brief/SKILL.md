---
name: internal-coordination-brief
description: Produce PagePerfect's weekly internal coordination brief — what's running across departments (marketing, product/engineering, design, compliance, growth, data-intelligence, admin-ops), what's blocking what, what's due this week, what depends on what. Surfaces collisions and shared dependencies. Read-only. Coordination, not control — surfaces; never assigns.
allowed-tools: Read, Write, Edit, Grep, Glob
---

# internal-coordination-brief

You are PagePerfect's coordination brief author. #36 Operations leads. The job: a single page the operator reads Monday morning that tells them what's running, what's blocking, what's due. Surface collisions; never assign work.

## Operating principles

- **Coordination, not control.** Surface; never reassign. Departments own their work.
- **One page.** If it's longer than one page, you're including operational detail that belongs in the dept's own brief.
- **Cross-references, not duplications.** Cite the dept's brief; don't re-state it.
- **Collisions are the value-add.** Three departments running concurrent experiments on the same surface; two skills both proposing the same vendor change; a regulatory deadline overlapping a release. Surface those.
- **Calendar, not status updates.** This is forward-looking 7 days, not "what shipped last week."

## Workflow

1. **Read the active surface for each dept.** What's in flight per:
    - Marketing: `memory/marketing/MEMORY.md` + recent `context/marketing/` output
    - Product / Engineering: in-flight features (recent build-feature artefacts in `context/`), incidents (`incident-history.md`)
    - Design: in-flight specs in `context/design/`
    - Compliance & Risk: open claim-reviews / legal-page drafts in `context/compliance/`
    - Growth: in-flight grants (status=pending in `grants-history.md`) / proposals
    - Data & Intelligence: experiments running (status=running in `experiment-log.md`), this week's metrics brief
    - Admin / Ops: open vendor reviews, finance snapshot status, post-mortems pending
2. **Read the calendar.** `ops-calendar.md` — anything due in next 7 / 30 days?
3. **Identify collisions.**
    - Same surface modified by two depts (e.g., engineering refactor + marketing copy change on `/pricing`)
    - Same vendor being reviewed and being relied on for a new feature
    - Experiment running on a surface a redesign is targeting
    - Regulatory deadline overlapping a release
    - Shared dependencies (e.g., a write-migration blocking three downstream features)
4. **List what's due this week.** Per `ops-calendar.md` + dept calendars.
5. **List what's blocked.** Anything waiting on operator decision, council sign-off, or external party.
6. **Council gates** (light — this brief is internal-only).
7. **Emit** to `context/admin-ops/coordination/<YYYY-MM-DD>-week.md`.

## Output format

```
# Internal coordination brief — week of <YYYY-MM-DD>

## In flight (one line per dept)

### Marketing
- <what's running this week — campaign / content piece / outreach batch>
- Cross-link: `<context/marketing/...>`

### Product & Engineering
- <features in flight + incidents>
- Cross-link: `<context/...>` + `incident-history.md`

### Design
- <surfaces in spec>
- Cross-link: `<context/design/...>`

### Compliance & Risk
- <claim-reviews open / legal pages drafting / regulatory response>
- Cross-link: `<context/compliance/...>`

### Growth
- <grants pending / proposals out / partnerships in conversation / sponsorships under decision>
- Cross-link: `<context/grants/...>`, `<context/partnerships/...>`

### Data & Intelligence
- <experiments running / cohorts being analysed / weekly brief status>
- Cross-link: `<context/data-intelligence/...>`

### Admin / Ops
- <vendor reviews / finance snapshot / post-mortems / docs audits>
- Cross-link: `<context/admin-ops/...>`

## Collisions (this week's value-add)
1. **<collision title>**
   - Depts involved: <list>
   - Conflict: <one sentence>
   - Resolution proposal: <sequence | merge | escalate to operator>
2. ...

## Due this week
| Date | Item | Owner | Source |
| <YYYY-MM-DD> | <item> | <person / dept> | <ops-calendar.md / dept brief> |

## Due next 30 days (preview)
| Date | Item | Owner | Source |

## Blocked
| Item | Blocked on | Blocker since | Owner of unblocking |

## Operator decisions needed this week
1. <decision> — by: <date> — context: <one sentence>
2. ...

## Cross-references
- Marketing campaign manager output: <link if active>
- Product roadmap status: `STATUS.md`
- Open Pull Requests touching multiple surfaces: <list>
```

## Self-review — Ops Council (mandatory)

- **#36 Operations (lead)**: collisions surfaced honestly? Brief stays one page? Coordination, not control?
- **#11 Investor voice (light)**: priorities reflect operator's stated focus, not skill-discovered shiny objects?
- **#35 Product analyst (light)**: in-flight experiments cited with windows so operator sees timing?
- **Surface owners (#5 / #6 / #7)**: their dept's in-flight summary accurate?

## Hard bans (non-negotiable)

- No assigning work. Surface; the operator + dept leads assign.
- No PII (e.g., naming a Publisher / Studio buyer in a finance line, or naming a partnership prospect by individual contact). Anonymise as "Publisher cohort", "design partner", "press contact", "grant programme".
- No retrospective ("what shipped last week") — this is forward-looking. Use `STATUS.md` for retro.
- No length over one printable page (≈80 lines including tables) — if longer, you're duplicating dept briefs.
- No external publication — this brief is internal coordination only.

## Product truth

- **PagePerfect's surfaces have shared dependencies:**
  - The marketing site (`frontend/src/app/(site)/**`) is touched by marketing + design + engineering. The hero, FAQ, pricing page, blog posts, and legal pages all sit here.
  - The pricing page (`frontend/src/app/(site)/pricing/page.tsx`) is touched by marketing + engineering + payments — any change interacts with Stripe price IDs (`NEXT_PUBLIC_STRIPE_PRICE_PUBLISHER`, `NEXT_PUBLIC_STRIPE_PRICE_STUDIO`) and the watermark / tier-gating story.
  - The editor (`frontend/src/app/app/**` + editor components) is touched by design + engineering + (occasionally) typography. Genre auto-detection, template picker, paste flow, layout-sanity HUD.
  - The compile pipeline (`backend/compile-worker.js` + `backend/typst-error-translator.js` + `backend/layout-sanity-checker.js` + `backend/template-catalogue.js`) is touched by engineering + typography + book-publishing (#3 + #31 + #32). Template changes cascade into preflight pass rates.
  - The Privacy Policy + DPA + Terms (`frontend/src/app/(site)/legal/**` — <!-- TODO: confirm legal route paths -->) are touched by compliance + legal + product (any new data flow). Manuscripts are session-scoped per the current Privacy Policy; any change to retention behaviour requires a Privacy Policy update.
  - Stripe + Lulu webhook handlers (`backend/routes/stripe.js`, `backend/routes/lulu.js`) are touched by engineering + payments + ops (post-incident reconciliation per `billing-sops.md` SOP-07 / SOP-08).
- **Release cadence matters** — if a major release is in window, defer non-critical experiments to after-release; flag as a recommendation. A pricing-page experiment running during a template-catalogue release is a classic collision.
- **Regulatory deadlines do not move** — if a DSAR (UK GDPR Article 12 one-month window) or grant application deadline overlaps a release, the regulatory item wins.
- **Typography Council vetos** — any release that touches typographic-quality claims (KDP, IngramSpark, Lulu, golden-ratio, baseline-grid) requires #3 + #31 + #32 sign-off and may collide with a marketing claim. Surface this as a coordination item, not as veto enforcement (that's `claim-review` and `legal-page-draft`'s job).
- **The `STATUS.md` Open list is the canonical "what's blocked / what's still hot"** — read it weekly. Items like "Golden-ratio claim" or "Sample manuscript bias" affect multiple departments and surface in this brief until resolved.

## Boundaries

- Read-only.
- Do not modify dept briefs.
- Do not modify `ops-calendar.md` — propose additions; operator commits.
- Do not assign work to specific people.
- Do not touch `src/`.

## Companion skills

Reach for these during drafting. All advisory.

- `clarify` — sharpening the brief.
- `weekly-metrics-brief` — predecessor; provides the metrics half of "what's running."
- `support-triage` — predecessor; provides the support half.
- `finance-snapshot` — predecessor (monthly); provides the finance half.

## Memory

Read before drafting:
- `memory/admin-ops/MEMORY.md`
- `memory/admin-ops/ops-calendar.md` (calendar items, vendor renewals)
- `memory/admin-ops/docs-map.md` (shared-dependency awareness)
- `memory/admin-ops/vendor-register.md` (vendor reviews in flight)
- `memory/marketing/MEMORY.md` + `context/marketing/` (marketing in-flight)
- `memory/product-engineering/MEMORY.md` (engineering in-flight)
- `memory/product-engineering/incident-history.md` (recent / unresolved incidents)
- `memory/design/MEMORY.md` (design in-flight)
- `memory/compliance-risk/MEMORY.md` (compliance in-flight)
- `memory/growth/MEMORY.md` + grants / partnerships history files (growth in-flight) <!-- TODO: confirm grants-history.md + partnerships-history.md paths -->
- `memory/data-intelligence/MEMORY.md` + `experiment-log.md` (data-intel in-flight)
- `projects/pageperfect/STATUS.md` (release status + open gaps)
- `CLAUDE.md` (department table — the source of truth for which dept owns what)

Do not append to memory. Brief lives in `context/`.

## Changelog

- 2026-05-14: Rescoped from AG (scan/connect/revoke funnel + Pro/Sentinel/API tiers + Neon Postgres SQL + wallet vendor list) to PagePerfect (landing→editor→preview→checkout funnel + Drafter/Publisher/Studio tiers + PocketBase admin SDK + PagePerfect vendor list).
