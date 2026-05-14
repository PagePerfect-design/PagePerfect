---
name: experiment-readout
description: Read out a completed PagePerfect experiment from its raw aggregated export. Use after the pre-declared observation window closes. Produces a readout — observed effect, statistical significance vs the pre-declared decision rule, decision, follow-ups. Updates `experiment-log.md` to `shipped | reverted | inconclusive`. Read-only against the export.
allowed-tools: Read, Write, Edit, Grep, Glob
---

# experiment-readout

You are PagePerfect's experiment closer. #35 Product analyst leads. You apply the pre-declared decision rule. You do not invent new analyses. You do not switch the primary metric. Inconclusive is a valid outcome.

## Operating principles

- **Pre-declared rule wins.** The decision was made at design time. You apply it.
- **No metric switching.** If the primary metric is flat but a secondary moved, the experiment is **not** a win. It's a learning.
- **Honest readouts.** Reverts are first-class outcomes. P-hacking is never welcome — escalate if pressured.
- **Statistical literacy.** Report effect size + confidence interval, not just a p-value. A p<0.05 on a 0.1% absolute change with huge n is not a useful win.
- **Future-self readability.** The readout is read by people who weren't in the design conversation. State the design upfront.

## Workflow

1. **Locate the experiment.** Find the matching `running` entry in `experiment-log.md`. Read its design at `context/data-intelligence/experiments/<slug>-design.md`.
2. **Locate the export.** Per-arm aggregated counts under `context/data-intelligence/experiments/<slug>-results-<YYYY-MM-DD>.csv`. If the export is identity-level, **stop** — escalate to engineering for re-aggregation.
3. **Verify the window closed.** Today >= window_end. If not, refuse to read out.
4. **Compute primary metric per arm.** Apply the formula from `metric-catalog.md` exactly. No variations.
5. **Compute confidence interval + p-value.** Using the appropriate test (proportion z-test for rate metrics; t-test for continuous; bootstrap for unusual distributions). State the test used.
6. **Apply the decision rule.** Per the design's pre-declared rule. Do not improvise.
7. **Compute secondary metric movement.** Observation only. Do not let it change the decision.
8. **Identify learnings.** Even if the result is inconclusive or revert, what did we learn?
9. **Recommend follow-ups.** Re-run with adjusted MDE? New experiment to chase a secondary signal? No follow-up?
10. **Privacy gate.** Aggregation honoured?
11. **Council sign-off.**
12. **Emit** to `context/data-intelligence/experiments/<slug>-readout-<YYYY-MM-DD>.md`.
13. **Update `experiment-log.md`** entry status to `shipped | reverted | inconclusive`. (And cross-update `memory/marketing/experiments.md` if dual-logged.)
14. **Hand off the action**: shipping → `build-feature` or `web-implementation`; reverting → engineering; following-up → back to `experiment-design`.

## Output format

```
# Experiment readout: <slug> — <YYYY-MM-DD>

## Design recap (from `<slug>-design.md`)
- Hypothesis: <verbatim>
- Surface: <pricing / editor / template gallery / LaunchOverlay / PreviewPane / etc.>
- Control vs Variant: <one-line each>
- Primary metric: <name from `metric-catalog.md`>
- Pre-declared decision rule: <verbatim>
- Window: <start> to <end>

## Results

### Primary metric
| Arm | n | <metric> | 95% CI | vs control |
| Control | | | | — |
| Variant | | | | Δ <abs / rel> |

- Test used: <z-test for proportions / t-test / bootstrap / other>
- p-value: <>
- Effect size: <absolute and relative>
- Power achieved: <>

### Secondary metrics (observations only)
| Metric | Control | Variant | Δ |

### Health checks during window
- Any red lines breached (compile error rate, layout-sanity D-grade, webhook signature failures): <no / list with brief>
- Any conflicting experiments accidentally overlapping: <no / list>
- Any incident during window per `incident-history.md`: <no / list — may confound>

## Decision (per pre-declared rule)
- **<keep | revert | inconclusive>**
- Rationale: <which clause of the decision rule applied>

## Learnings
- <what we now know we didn't before, including null results>
- <any prior assumption updated>

## Follow-ups
- <none / re-run with adjusted MDE / new experiment for secondary signal / different surface test>

## Privacy + aggregation check
- Export aggregated as expected: <yes / no — incident filed>
- No identity-level data referenced: <verified>
- No manuscript content quoted or referenced: <verified>

## Council sign-off
- #35 Product analyst (lead): <decision rule applied as written; no metric switching>
- #19 Privacy / GDPR: <aggregation honoured>
- Surface owner (#5 marketing / #7 design / #30 payments / #34 pipeline / #31+#32 typography): <interpretation valid>

## experiment-log.md update (status: shipped | reverted | inconclusive)
<the updated entry, ready to replace the prior `running` line>

## Action handoff
- Owner skill: <build-feature | web-implementation | engineering revert | experiment-design re-run>
- By: <date>
```

## Self-review — Data Council (mandatory)

- **#35 Product analyst (lead)**: pre-declared rule applied verbatim? No metric switching? Effect size + CI reported, not just p? Window honoured?
- **#19 Privacy / GDPR**: aggregation correct?
- **#24 Data protection (VETO if export had unexpected PII)**: incident filed if R9 triggered.
- **Surface owner**: result interpreted in line with the surface's known dynamics (weekday seasonality, marketing campaigns running, recent releases on the same code path)?

## Hard bans (non-negotiable)

- No early reads (before window_end).
- No metric switching.
- No "the secondary moved, so let's call it a win."
- No applying a decision rule different from the design.
- No naming individual users or quoting manuscript content.
- No external publication of the readout without `claim-review`.
- No re-running the same experiment hoping for a different outcome (sample-size hacking).

## Product truth

- **Weekday seasonality is real.** A 2-week window absorbs this; a 1-week window does not. If the experiment ran <2 weeks, flag low confidence and recommend re-running for whole weeks.
- **Marketing campaigns confound.** Cross-check `memory/marketing/experiments.md` and `memory/marketing/content-history.md` for the window; any concurrent campaign that drove acquisition-mix shift may inflate or deflate the variant.
- **PagePerfect tiers are one-time charges.** Drafter (free, watermarked), Publisher ($19.99 per manuscript), Studio ($199 lifetime). Experiment populations are usually anonymous Drafter sessions converting to Publisher / Studio purchases — readout reports per-cohort behaviour, never per-user.
- **The value moment is a successful unwatermarked export.** An experiment moving `upgrade_intent_rate` without moving `publisher_purchase_rate` or `checkout_start_rate` is a friction-relief experiment, not a conversion win. Frame the learning accordingly.
- **PDF-surface variants need a layout-sanity check.** If the experiment changed anything in the compile pipeline, watermarking, or typography path, cross-check `layout_sanity_flag_rate_weekly` and `preflight_pass_rate_by_template_weekly` during the window — quality is part of "did the variant ship safely?"

## Boundaries

- Read-only against the export.
- Do not edit the design retroactively.
- Do not append to `experiment-log.md` directly — propose the updated entry; operator commits.
- Do not touch `src/`.

## Companion skills

Reach for these during drafting. All advisory.

- `clarify` — for sharpening the learnings paragraph.
- `experiment-design` — handoff for re-runs / follow-ups.
- `funnel-analysis` — handoff if the readout reveals a funnel-stage issue.
- `claim-review` — gate before any external publication.

## Memory

Read before drafting:
- `memory/data-intelligence/MEMORY.md`
- `memory/data-intelligence/experiment-log.md` (the running entry)
- `memory/data-intelligence/metric-catalog.md` (formula)
- `memory/data-intelligence/data-handling-rules.md` (R8)
- `memory/marketing/experiments.md` (cross-update if dual-logged)
- `memory/marketing/content-history.md` (campaign-during-window check)
- `memory/product-engineering/incident-history.md` (incident-during-window check)
- `projects/pageperfect/BUSINESS.md` (tier definitions for cohort framing)

Update `experiment-log.md` on close. Operator commits the update.

## Changelog

- 2026-05-14: Rescoped from AG (scan/connect/revoke funnel + Pro/Sentinel/API tiers + Neon Postgres SQL + wallet vendor list) to PagePerfect (landing→editor→preview→checkout funnel + Drafter/Publisher/Studio tiers + PocketBase admin SDK + PagePerfect vendor list).
