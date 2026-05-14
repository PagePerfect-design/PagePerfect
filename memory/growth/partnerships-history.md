# partnerships-history.md

Append-only log of partnership + integration conversations. Every meaningful outbound / inbound leaves a trace here. See `.claude/skills/partnership-brief/SKILL.md` for the drafting playbook.

**Status as of 2026-05-14:** one active commercial partnership (Lulu xPress — technical integration partner). No others signed. All other targets are prospective.

## Entry format

```
## YYYY-MM-DD — <partner name> — <stage>

- **Partner:** <name + role in ecosystem>
- **Category:** print-on-demand | aggregator | self-publishing platform | author community | writing-tool upstream | service marketplace | press
- **Stage:** cold | pitched | negotiating | signed | live | dormant
- **Shape:** outbound proposal | inbound request | continuation of prior
- **Owner (our side):** <>
- **Owner (their side):** <>
- **Last touch:** YYYY-MM-DD
- **Brief:** <one paragraph — what the conversation is about>
- **Brief file:** `context/partnerships/<YYYY-MM-DD>-<slug>.md`
- **Council sign-offs:** <#12 Ecosystem, #6 B2B, #9 Lawyer, #11 Investor voice — as applicable>
- **Outcome to date:** <>
- **Next action + date:** <>
- **Risks flagged:** <>
```

## Rules

- **Append-only.** Do not rewrite past entries; add follow-up entries.
- **Every outbound partnership conversation gets an entry,** even if it goes nowhere. Pattern data matters.
- **Inbound requests** (someone reaches out to us) also get entries. Inbound that isn't recorded is inbound that gets forgotten.
- **Do not record personal details that aren't relevant to the partnership** (no DOBs, political views, etc.). Public professional signal only.
- **No double-outreach to the same target** inside the same 90-day window without explicit reason.

## Log

### Active partnerships

#### Lulu xPress — live

- **Partner:** Lulu xPress (print-on-demand; Studio tier print pipeline).
- **Category:** print-on-demand.
- **Stage:** **live**.
- **Shape:** technical integration partner.
- **Owner (our side):** operator. <!-- TODO: confirm canonical owner on our side. -->
- **Owner (their side):** Lulu xPress partner / developer relations. <!-- TODO: confirm Lulu-side contact and channel. -->
- **Last touch:** <!-- TODO: verify date of last touch and integration go-live date. -->
- **Brief:** Lulu xPress API integration powers the Studio-tier print pipeline. PagePerfect's compile output is submitted via OAuth 2.0 client_credentials; print-job status is delivered via HMAC-verified webhook. See `integrations.md` for technical detail.
- **Brief file:** *(no formal brief on file; the relationship predates the `partnership-brief` skill.)*
- **Outcome to date:** integration live and shipping; `pod_package_id` schema in production.
- **Commercial shape:** per-unit print + shipping pricing; **no revenue share** — PagePerfect does not resell printed copies. Authors order direct via the API.
- **Risks flagged:** Lulu API revisions; `pod_package_id` schema changes; Lulu ToS revisions. Tracked in `ecosystems.md`.
- **Next action + date:** ongoing; co-marketing / case-study opportunities flagged in `ecosystems.md`.

### Prospective partnerships (no formal engagement yet)

Each listed below is a candidate per the rescoped `partnership-brief` skill. Status: prospective; not pitched. Add full entries here when a conversation lands.

- **IngramSpark** — partner directory + trade-distribution audience.
- **Reedsy Marketplace** — service-marketplace referral source (editors → PagePerfect for typesetting).
- **ALLi (Alliance of Independent Authors)** — approved-partner programme; member-benefit discount.
- **Authors Guild** — member-benefit discount; hybrid-author posture.
- **NaNoWriMo** — annual sponsorship cycle; partner-discount for post-event manuscripts.
- **IBPA (Independent Book Publishers Association)** — member directory; partner discounts.

<!-- Append newest first below this comment as conversations begin. -->

## Patterns

As entries accumulate, watch for:

- **Partners who ask then disappear** — record the disappearance; do not keep nudging.
- **Partners who only engage when we're in press** — calibrate our ask accordingly.
- **Partners who introduce us to other partners** — they are force multipliers. Invest in the relationship.
- **Integration shapes that fail repeatedly** — if three writing-tool partners in a row reject the export-adapter shape for the same reason, the adapter is not the right surface for PagePerfect right now.

Record patterns in `targets.md` or `integrations.md` once the second data point arrives.

## Lifecycle

### Outbound proposal (initiated by us)

1. `partnership-brief` or `integration-proposal` produces the draft + internal brief.
2. `claim-review` passes the draft.
3. User sends.
4. Entry created here with stage `pitched`.
5. Stage updates as conversation progresses (`negotiating`, `signed`, `live`).
6. Final state: `live`, `dormant`, or removed-from-pipeline with reason.

### Inbound request (initiated by partner)

1. Someone reaches out (email, conference conversation, GitHub issue, indie-author community).
2. Entry created with stage `cold` (or `pitched` if they led with a proposal).
3. If pursued: proceed as outbound from step 1.
4. If declined: record declination with reason.

### Partnerships that turn into integrations

An integration is a technical partnership. Once a proposal becomes an engineering workstream:
- `partnerships-history.md` entry stays as the relationship log.
- `integrations.md` becomes the technical source of truth.
- `integration-proposal` hands off to engineering's `build-feature` for implementation.

### Partnerships that end

- **Amicable wind-down:** one party's priorities shifted. Record the rationale; invest in maintaining the relationship.
- **Contested termination:** #9 Lawyer involved. Record facts only; never speculation.
- **Silent death:** partner stops responding for 90+ days. Mark `dormant`; if another 90 days pass, mark `dormant — unresponsive`. Do not chase further.

## Cross-references

- Targets (who we pursue) — `targets.md`.
- Integration technical detail — `integrations.md`.
- Grants (different kind of partnership with funders) — `grants-history.md`.
- Outreach emails (tactical, press + indie-author media) — `memory/marketing/outreach.md`.
- Claims made in partnership materials — registered in `memory/compliance-risk/claims-register.md` upon ship.

## A note on relationship quality

Growth work compounds. A partner that becomes a distribution channel in year 2 often started as a cold email in year 1. Every entry here is a seed. Tend the garden.

## Changelog

- 2026-05-14: Rescoped from AG (EF/Optimism/Gitcoin grants, MetaMask/Rabby/Phantom integrations, crypto-ecosystem targets, Coinbase partnership history, AG open-core scope) to PagePerfect (publishing-ecosystem reality — Lulu live partner, all else prospective). Category list updated from wallet / protocol / security-tool to print-on-demand / aggregator / self-publishing platform / author community / writing-tool upstream / service marketplace / press. Lulu xPress recorded as the one active partnership (status: live); IngramSpark / Reedsy / ALLi / Authors Guild / NaNoWriMo / IBPA added as prospective.
