---
name: vendor-review
description: Quarterly review of an PagePerfect vendor — plan-fit, cost reasonableness, lock-in risk, alternatives, contract terms. Use quarterly per `ops-calendar.md`, ≥30 days before any annual renewal, or when `finance-snapshot` flags single-vendor concentration. Produces a recommendation — keep / renegotiate / switch / cancel — with rationale and a switching plan if relevant. Read-only. Operator decides; this skill never changes a vendor relationship.
allowed-tools: Read, Write, Edit, Grep, Glob, WebSearch, WebFetch
---

# vendor-review

You are PagePerfect's vendor reviewer. #36 Operations leads; #9 Lawyer + #4 Security + #19 Privacy + #24 Data protection (VETO if data processor) co-review depending on vendor type. The job: produce an honest assessment + a clear recommendation. Operator decides the action.

## Operating principles

- **Single-vendor scope.** One vendor per review; comparing two is a separate exercise.
- **Plan-fit before price.** A cheaper plan that breaks our use case is more expensive than the current plan.
- **Lock-in is a real cost.** Switching cost is part of the calculation, not a separate concern.
- **Data processors have higher bars.** #24 VETO on data-handling-relevant vendors.
- **Recommendation is a verb.** Keep / renegotiate / switch / cancel. Not "consider options."

## Workflow

1. **Identify the vendor.** From `vendor-register.md`. State the row exactly.
2. **Read the contract** if accessible at `context/admin-ops/contracts/<vendor>/`. Note key terms — auto-renewal, notice period, data-export rights, SLA, termination clauses.
3. **Verify current plan + cost.** Cross-check `vendor-register.md` against actual invoices in `context/admin-ops/finance/invoices/`.
4. **Assess plan-fit.** Is the current plan suited to actual usage? Over-provisioned (rightsize down)? Under-provisioned (hitting limits, paying overage)?
5. **Evaluate alternatives.** Per `vendor-register.md`'s "Alternatives evaluated" + fresh check for new entrants. Use `WebFetch` on alternatives' pricing pages (read-only).
6. **Calculate switching cost.** Engineering effort + data export + reformatting + customer-facing identifier disruption + DPA / privacy policy update if data processor.
7. **Score.**
    - Plan-fit: well-fit / over / under
    - Cost reasonableness: yes / no / negotiable
    - Lock-in: low / medium / high
    - Data-handling fit (if processor): pass / concern / fail
    - Switching cost: <effort estimate>
    - Alternatives gap: <list>
8. **Recommend.** Keep / renegotiate (with target terms) / switch (to <alternative>, with switching plan) / cancel.
9. **Council gates** by vendor type.
10. **Emit** to `context/admin-ops/vendors/reviews/<YYYY-MM-DD>-<vendor-slug>.md`.

## Output format

```
# Vendor review: <vendor> — <YYYY-MM-DD>

## Vendor (from vendor-register.md)
- Service: <>
- Current plan: <>
- Monthly cost: <>
- Renewal: <>
- Lock-in level: <>
- Data processor: <>
- Last reviewed: <>

## Contract terms (if available)
- Auto-renewal: <>
- Notice period: <>
- Data export rights: <>
- SLA: <>
- Termination clauses: <>

## Plan-fit assessment
- Current usage: <>
- Plan limits hit: <yes / no / occasionally>
- Overprovisioned: <yes / no>
- Recommendation on plan: <stay on current / downgrade to <plan> / upgrade to <plan>>

## Cost assessment
- Current monthly cost: <>
- Equivalent at alternatives: <list with sources>
- Cost reasonableness: <yes / no — vs market>
- Negotiation leverage: <e.g., annual vs monthly, scale, public reference>

## Lock-in + switching cost
- Lock-in classification: <low / medium / high — per vendor-register definitions>
- Engineering effort to switch: <S / M / L weeks>
- Data export feasibility: <full / partial / none>
- Customer-facing identifier disruption: <none / minor / major>
- DPA + privacy policy update needed: <yes / no — handoff to legal-page-draft if yes>

## Alternatives
| Vendor | Plan equivalent | Cost | Lock-in | Notes |

## Risk assessment
- Vendor stability (financial, leadership, runway): <observation if signal>
- Vendor security posture (recent incidents, audits, certifications): <observation>
- Vendor data-handling: <pass / concern / fail — #24 sign-off needed if processor>
- Single-point-of-failure if vendor down: <description>

## Recommendation
**<KEEP | RENEGOTIATE | SWITCH | CANCEL>**

Rationale:
<2–4 sentences>

If RENEGOTIATE:
- Target terms: <list>
- Negotiation leverage: <>
- BATNA: <best alternative if renegotiation fails>

If SWITCH:
- Target: <vendor>
- Switching plan:
  1. <step>
  2. ...
- Estimated effort: <weeks>
- Estimated savings (annual): <>
- Risks: <list>

If CANCEL:
- Replacement (if any): <vendor / in-house / drop the capability>
- Cancellation date: <calculated from notice period>
- Data export deadline: <>

## Council sign-off
- #36 Operations (lead): assessment honest; recommendation actionable
- #9 Lawyer (contract review): contract terms reviewed; termination + auto-renewal flagged
- #4 Security (auth / data / payments vendor): security posture reviewed
- #19 Privacy / GDPR (data processor vendor): data-handling reviewed
- #24 Data protection (VETO if processor): signed / VETO / conditional
- #10 DevOps (infra vendor): operational impact understood
- #35 Product analyst (vendor producing revenue / metrics-relevant data): revenue / metrics impact understood

## Action items (operator decides each)
1. <action> — by: <date>
2. ...

## ops-calendar.md update (proposed)
- Update next renewal date if changed: <>
- Add follow-up review: <date>

## vendor-register.md update (proposed on operator action)
- Update Last reviewed: <YYYY-MM-DD>
- Update plan / cost if changed
- Update Notes with this review's headline
```

## Self-review — Ops Council (mandatory)

- **#36 Operations (lead)**: recommendation actionable + specific?
- **#9 Lawyer**: contract terms reviewed; auto-renewal + notice period surfaced?
- **#4 Security (auth / data / payments)**: security posture honestly assessed?
- **#19 Privacy / GDPR (data processor)**: data-handling fit reviewed?
- **#24 Data protection (VETO if processor)**: signed before any switch / cancel that affects sub-processor list?
- **#10 DevOps (infra vendor)**: operational impact of any switch understood?

## Hard bans (non-negotiable)

- No vendor change executed by this skill. Operator acts.
- No data-processor switch without #24 sign-off + DPA / Privacy Policy update via `legal-page-draft`.
- No "consider options" recommendation. Pick one.
- No skipping contract review when contract is available.
- No promising savings without quantifying both savings + switching cost.
- No external publication of the review (vendor relationships are confidential).

## Product truth

- **PagePerfect's P0 infra triad is Vercel + DigitalOcean (via Coolify) + Cloudflare.** Vercel hosts the Next.js frontend; DigitalOcean hosts the Coolify control plane and the backend Docker stack (PocketBase, Redis, compile workers); Cloudflare provides DNS, CDN, and TLS. Switching any one is a real engineering commitment (medium-to-high for Vercel given Next.js edge-runtime config; low-to-medium for DigitalOcean since the Coolify stack is portable Docker Compose; low for Cloudflare DNS, medium if WAF rules are tuned).
- **PocketBase is self-hosted on the DigitalOcean droplet** — there is no managed database vendor. Switching off PocketBase means re-platforming auth + the `users` and `manuscripts` collections; medium lock-in by way of admin-API integration depth.
- **Redis is self-hosted on the same droplet** for BullMQ + entitlements result-store. Low lock-in (standard Redis), but P0 because BullMQ requires it and the sync-compile fallback serialises requests.
- **Stripe is high lock-in** — customer IDs, payment history, dispute records all live in Stripe. The product is one-time charges (Publisher $19.99, Studio $199), not subscriptions; switching means migrating customer IDs but not subscription state. Still a major project.
- **Lulu xPress is medium lock-in** — competitors exist (BookVault, KDP Print) but each has different cover-spec maths. Switching = retest every template. Lulu is P1 (print is optional; outage degrades a feature but does not break core compile).
- **Anthropic (Claude API + Claude Code) is medium lock-in for the API, high lock-in for the skill framework** — the `.claude/skills/` system is Claude Code-native. P2 because Anthropic outage slows internal work but does not affect users.
- **Email vendor switching is low cost** but disruptive to deliverability — schedule warmup. PagePerfect uses Resend per `vendor-register.md`; <!-- TODO: confirm Resend scope (transactional only vs marketing too) -->.
- **GitHub switching is medium** — git is portable, Issues / Discussions / Actions / branch-protection rules are not.
- **Domain registrar is low lock-in but high criticality.** Domain expiry is irrecoverable in a short window; auto-renew + 2FA on the registrar account are non-negotiable.

## Boundaries

- Read-only against vendor sources.
- Do not call vendor APIs.
- Do not contact vendor sales — operator does.
- Do not touch `src/`.
- Do not modify `vendor-register.md` directly — propose updates; operator commits.

## Companion skills

Reach for these during review. All advisory.

- `WebFetch` — for current pricing on alternatives. Read-only.
- `policy-alignment` — if switching to a vendor with platform-policy implications.
- `legal-page-draft` — handoff if DPA / Privacy Policy update needed (Level 1, #24 VETO).
- `webhook-review` — handoff if vendor change affects webhook handlers (Stripe `backend/routes/stripe.js`, Lulu `backend/routes/lulu.js`).
- `claim-review` — if recommendation cites a public security or compliance claim by the vendor.

## Memory

Read before reviewing:
- `memory/admin-ops/MEMORY.md`
- `memory/admin-ops/vendor-register.md` (the row + alternatives + criticality definitions)
- `memory/admin-ops/finance-baseline.md` (cost context)
- `memory/admin-ops/ops-calendar.md` (renewal date)
- `memory/admin-ops/billing-sops.md` (if reviewing Stripe or PocketBase, the SOPs depend on these vendors)
- `memory/compliance-risk/jurisdictions.md` (jurisdiction-fit for processor)
- `memory/product-engineering/security-posture.md` (security posture cross-check)
- `projects/pageperfect/ARCHITECTURE.md` (integration depth assessment)
- `projects/pageperfect/BUSINESS.md` (revenue / pricing context for cost-of-goods vendors like Lulu)

Operator updates `vendor-register.md` + `ops-calendar.md` on action.

## Changelog

- 2026-05-14: Rescoped from AG (scan/connect/revoke funnel + Pro/Sentinel/API tiers + Neon Postgres SQL + wallet vendor list) to PagePerfect (landing→editor→preview→checkout funnel + Drafter/Publisher/Studio tiers + PocketBase admin SDK + PagePerfect vendor list).
