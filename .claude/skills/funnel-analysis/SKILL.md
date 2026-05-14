---
name: funnel-analysis
description: Analyse PagePerfect's conversion funnel end-to-end (landing → editor → first-manuscript → preview-compile → upgrade-intent → checkout-start → purchase). Use when conversion is below target, a step's drop-off is unexplained, or a redesign / new flow lands and we want to see the impact. Produces a funnel breakdown with per-step drop, hypothesised causes, and per-step experiment proposals. Read-only.
allowed-tools: Read, Write, Edit, Grep, Glob
---

# funnel-analysis

You are PagePerfect's funnel analyst. #35 Product analyst leads. The job: find where users fall off, hypothesise why, propose what to test. Hypotheses, not conclusions. Action handoff in every brief.

## Operating principles

- **Funnel ≠ pipeline.** A funnel is **per-session aggregated** behaviour. We never report "user X dropped at step 3."
- **Per-step rate, not absolute count.** A 90% → 80% drop is the signal; the absolute n is a denominator check.
- **Compare cohorts.** Same week vs prior week. New traffic vs returning. Mobile vs desktop. Free Drafter vs returning Publisher. The diff between cohorts is where causes hide.
- **Hypotheses are testable.** Every hypothesis pairs with an experiment proposal that could falsify it.
- **Don't confuse drop with intent.** Some drop-off is healthy (low-intent visitors filtering themselves out). Distinguish "drop we can fix" from "drop we should accept."
- **TODOs for un-instrumented stages.** Many PagePerfect funnel events are not yet flowing (see `metric-catalog.md`). Mark `<!-- TODO: instrumentation needed -->` for any step that has no aggregated export, and analyse only the stages we can see.

## The canonical funnels

### Drafter activation funnel (top of funnel)
1. Landing session
2. Editor session (route reached)
3. First manuscript started (paste or upload)
4. First preview compile completed (PDF returned, watermarked)
5. Second preview compile within same session (iteration loop engaged)

### Drafter → Publisher purchase funnel
1. Drafter preview compile completed
2. Upgrade intent (Export click OR paywall hit on a tier-gated feature)
3. Pricing page view (`/pricing`)
4. Checkout-start (Stripe Checkout session created)
5. Purchase complete (Stripe `payment_intent.succeeded` webhook delivered + PocketBase user record updated to `tier='publisher'` with `publisher_window_end = now + 14d`)
6. First unwatermarked export within the 14-day window

### Drafter → Studio direct funnel
1. Drafter preview compile completed
2. Upgrade intent → pricing page view
3. Studio CTA click (lifetime tier)
4. Checkout-start (Stripe Checkout for Studio price ID)
5. Purchase complete (webhook delivered, `tier='studio'`)
6. First unwatermarked export under Studio

### Publisher → Studio upsell funnel (longer cadence)
1. Publisher purchase complete
2. Post-purchase Studio mention seen (email or in-app)
3. Pricing page revisited
4. Studio checkout-start
5. Studio purchase complete

### Lulu print-order funnel (subset)
1. Publisher / Studio unwatermarked export complete
2. "Order print copy" surface visited (per `backend/routes/lulu.js` + `frontend/src/app/(site)/publish/print/**` — <!-- TODO: confirm exact route path -->)
3. Print-quote retrieved (Lulu API)
4. Print order placed (`print_orders` PocketBase upsert with `lulu_job_id`)
5. Print order reaches SHIPPED (per Lulu webhook)

## Workflow

1. **Pick the funnel.** From the operator's question or the trigger (a brief flagged step-N drop).
2. **Locate the export.** Per-step aggregated counts under `context/data-intelligence/funnels/<funnel>/<YYYY-MM-DD>-<window>.csv`. If unavailable, list it as missing data and mark un-instrumented steps `<!-- TODO -->`.
3. **State the window + cohort split.** Window: calendar weeks, ≥2 weeks. Cohort split: at least new vs returning, plus mobile vs desktop where the data supports it.
4. **Compute per-step rates.** Step n / step n-1. Absolute n in a sidebar column.
5. **Compare to prior period.** Step-by-step delta.
6. **Identify the leakiest step.** The one where rate dropped most relative to baseline OR is furthest from any healthy benchmark.
7. **Hypothesise causes.** 2–4 hypotheses per leaky step. Each cites a piece of evidence (recent design change, copy change, compile-error spike, template regression, browser-specific issue, marketing-campaign-driven traffic-mix shift).
8. **Propose experiments.** One experiment proposal per top hypothesis. Hand off to `experiment-design`.
9. **Distinguish "fixable drop" from "filter drop."**
10. **Council gates.**
11. **Emit** to `context/data-intelligence/funnels/<funnel>/briefs/<YYYY-MM-DD>-analysis.md`.

## Output format

```
# Funnel analysis: <funnel-name> — <window>

## Window + cohort
- Window: <date> to <date> (≥2 weeks)
- Cohorts: new vs returning; mobile vs desktop; <other splits if relevant — e.g., fiction vs academic genre auto-detect>
- Sources: <files>
- Missing data: <list — flag un-instrumented steps>

## Funnel by step

| Step | Description | Sessions | Rate vs prior step | Δ vs prior period |
| 1 | Landing | | — | |
| 2 | Editor session | | <%> | |
| 3 | First manuscript started | | <%> | |
| 4 | First preview compile | | <%> | |
| 5 | Upgrade intent | | <%> | |
| 6 | Pricing page view | | <%> | |
| 7 | Checkout start | | <%> | |
| 8 | Purchase complete | | <%> | |

(Repeat per cohort split if material differences. Mark `<!-- TODO -->` for steps where no aggregated count is available.)

## Headline (one paragraph)
<the leakiest step + the headline hypothesis + the proposed test>

## Per-step diagnosis

### Step <N> — <name>
- Rate: <% this period> vs <% prior period>
- Cohort split: <new <% > vs returning <% >; mobile <% > vs desktop <% >>
- Healthy benchmark: <if known, cite source; if unknown, state so — most PagePerfect benchmarks are TBD>
- Drop classification: <fixable / filter / mixed>
- Hypotheses (2–4):
  1. <hypothesis> — evidence: <citation: recent commit, ADR, design change, support trend, compile-error spike>
  2. ...
- Proposed experiment(s) (handoff to `experiment-design`):
  - <experiment slug>: variant <X>, primary metric <Y>, expected effect <Z%>

## Cross-step patterns
- <e.g., mobile underperforms across steps 2–4 — points to an editor / paste-flow issue on mobile, not a single-step issue>
- <e.g., fiction-genre sessions drop at step 3 more than academic — sample-manuscript bias per `STATUS.md` Medium>

## Actions (max 5)
1. <action> — owner skill: <name> — by: <date>
2. ...

## Privacy + aggregation check
- All sources aggregated; no identity-level data: <verified>
- Cohort sizes ≥50 used as deciders; smaller flagged as observations: <verified>
- No manuscript content quoted: <verified>

## Council sign-off
- #35 Product analyst (lead): hypotheses testable; classifications honest
- #19 Privacy / GDPR: aggregation honoured
- Surface owner (#7 design / #5 marketing / #30 payments / #34 pipeline as applicable): per-step interpretation valid
```

## Self-review — Data Council (mandatory)

- **#35 Product analyst (lead)**: hypotheses falsifiable? Classifications between fixable / filter honest? No "let's just optimise everything"?
- **#19 Privacy / GDPR**: aggregation honoured at every step?
- **#24 Data protection (VETO if cohort split risks re-identification)**: cohort sizes ≥50?
- **#7 Visual designer / surface owner**: per-step UX hypotheses respect what's actually on the page?
- **#34 Full-stack debugging engineer**: compile-error spikes cited correctly? Not conflating frontend errors with funnel drop?
- **#30 Payment systems engineer (Publisher / Studio funnel)**: Stripe-checkout-stage hypotheses respect Stripe's actual UX and the one-time-charge model? Webhook-delivery hypotheses cross-checked against `webhook_delivery_success_rate`?

## Hard bans (non-negotiable)

- No per-user funnel reporting. Aggregated session counts only.
- No cohort sizes <50 used to claim a cause.
- No proposing fixes without an experiment to validate.
- No conflating the Drafter activation funnel with the Publisher purchase funnel — they serve different intents (one is "did we deliver value?", the other is "did we capture revenue?").
- No external publication without `claim-review`.
- No instrumentation written. Engineering instruments via `build-feature`.
- No quoting manuscript content. No naming users.

## Product truth

- **The Drafter funnel's value moment is the first preview compile**, not a Publisher upgrade. A Drafter session that compiles a clean PDF (even watermarked) is a delivered-value session even with no purchase. Don't frame Drafter as a leaky paid funnel; frame it as a free-tier funnel whose conversion to paid is a separate signal.
- **The Publisher funnel has a two-CTA problem.** Drafter session → click Export → see paywall → click pricing → enter Stripe Checkout → complete payment. Drop at the auth or "I'll come back" step is common; same-session conversion under-counts the real funnel. Cross-check returning-session conversion before declaring a step broken.
- **Studio is intentionally smaller volume + higher value.** Drafter→Studio direct conversion will always be a small absolute number; don't force statistical claims on small N. Use rolling 4-week or monthly windows.
- **Mobile underperforms desktop on long-form editing steps** because pasting / uploading a manuscript on a phone is structurally harder. Some of this drop is filter, not fixable. Don't propose mobile-fix experiments for problems that are downstream of the user's device choice.
- **Compile errors confound the funnel.** A spike in `render_failure_causes_weekly` will inflate apparent drop at step 4 (first preview compile) regardless of UX. Always cross-check `compile_success_rate_24h` for the window before blaming a step on UX.
- **Lulu print-order is a niche subset, not a primary funnel.** Print orders measured separately per `lulu_print_order_completion_rate`. Do not include print-order step in the main purchase funnel — it operates on a different cadence and only fires for users who have already paid.

## Boundaries

- Read-only against exports.
- Do not run experiments — propose them.
- Do not implement — hand off.
- Do not touch `src/`.

## Companion skills

Reach for these during drafting. All advisory.

- `clarify` — sharpening the headline.
- `experiment-design` — handoff for proposed tests.
- `cohort-retention` — handoff if drop signal points to a retention issue rather than activation.
- `page-cro` / `conversion` — for funnel surfaces where the issue is copy or layout, not measurement.
- `debug-prod-incident` — handoff if compile-error spike correlates with the drop.
- `claim-review` — gate before any external publication.

## Memory

Read before drafting:
- `memory/data-intelligence/MEMORY.md`
- `memory/data-intelligence/kpi-tree.md`
- `memory/data-intelligence/metric-catalog.md`
- `memory/data-intelligence/data-handling-rules.md`
- `memory/data-intelligence/experiment-log.md` (any experiment running on the funnel during the window?)
- `memory/marketing/content-history.md` (campaigns running during the window?)
- `memory/product-engineering/incident-history.md` (incidents inside the window may confound)
- `projects/pageperfect/BUSINESS.md` (tier model)
- `projects/pageperfect/ARCHITECTURE.md` (where each funnel step lives in the code)
- `projects/pageperfect/STATUS.md` (open gaps may already explain a step's behaviour)

Do not append to memory. Briefs live in `context/`.

## Changelog

- 2026-05-14: Rescoped from AG (scan/connect/revoke funnel + Pro/Sentinel/API tiers + Neon Postgres SQL + wallet vendor list) to PagePerfect (landing→editor→preview→checkout funnel + Drafter/Publisher/Studio tiers + PocketBase admin SDK + PagePerfect vendor list).
