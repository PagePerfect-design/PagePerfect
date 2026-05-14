# open-source-program.md

PagePerfect's open-source posture — current state, candidate OSS surfaces, and the playbook for when (and only when) a surface ships open. Owned by #2 Open source maintainer.

## Active state (2026-05-14)

**PagePerfect is closed-source. No OSS posture is planned.** No public repos. No CONTRIBUTING.md, CLA, or CODE_OF_CONDUCT.md. No external contributors. No public bug tracker. The operator decision on 2026-05-14 was explicit: PagePerfect remains fully closed-source for the foreseeable future.

This file is **archived as reference**: the OSS playbook scaffolding below is preserved for the case of a future reversal, but no surface is intended for open-source release. The `open-source-program-run` skill is dormant — it should not be invoked unless the operator reverses this decision via the procedure below.

**To reverse this decision:** operator updates this section, then convenes #2 (Open source maintainer), #9 (Lawyer/compliance), and #15 (Staff engineer) for a fresh review of (a) which surface, (b) which licence, (c) commercial-moat impact. Until that review completes and a surface is committed, no public OSS claim may be made (Typography Council + #9 + #11 vetoes apply to any "open source" language in marketing).

## Candidate OSS surfaces (none committed)

Surfaces where open-sourcing would create plausible community value without surrendering the commercial moat:

- **Typst templates** under `backend/templates/` — the actual `.typ` files used by Drafter / Publisher / Studio tiers. Highest-impact candidate: template authoring is community-friendly; quality control is gateable.
- **Pandoc Lua filters** under `backend/filters/` — the Markdown-to-Typst transformation logic. Useful to the wider Pandoc community.
- **Grid-system computations** (`backend/grid-system.js`) — trim / bleed / margin / gutter math. Useful to anyone building a print-PDF pipeline.
- **Platform-compliance preflight checks** — the rules that verify PDFs meet KDP / IngramSpark / Lulu specs. Useful to other self-publishing tools; also a marketing surface ("we ship the compliance checks we use ourselves").

**Decision (2026-05-14):** None of these surfaces will be released as open source. The candidate list is preserved for historical reference only. The skill remains dormant. To reverse, see "Active state" section above.

## If an OSS surface is committed: required policy artefacts

Each of these is currently absent. The `open-source-program-run` skill produces drafts on demand.

- `LICENSE` per package — licence choice TBD (MIT / Apache-2.0 / BSL most likely; #9 Lawyer sign-off required).
- `CONTRIBUTING.md` — contribution workflow, CLA signing, SLA expectations.
- `CODE_OF_CONDUCT.md` — Contributor Covenant base; enforcement path documented.
- `SECURITY.md` — private disclosure path; coordinated disclosure SLA.
- `CLA` text + signing mechanism — CLA-assistant or DCO alternative; #9 + #24 review.
- `MAINTAINERS.md` — who has merge rights, who has final-veto on strategic direction.
- `CONTRIBUTORS.md` — named entry for significant contributors.

## Principles (apply once any surface is open)

- **Open surfaces stay open.** If we publish a surface as open source, we don't quietly re-close it. Licence transitions (e.g., MIT → BSL) require contributor notice and operator + Legal Council sign-off.
- **Contributions welcome, not exploited.** Every contributor gets credit. No contribution is commercially appropriated in ways contributors didn't consent to.
- **CLA is not a weapon.** A Contributor License Agreement exists so PagePerfect can (a) ship contributions in commercial tiers and (b) defend the project if needed. It is never used as a gate against inconvenient contributors.
- **Responsive maintenance is the culture.** Published SLAs are commitments, not aspirations. A project that ignores contributions dies.
- **Security disclosure first.** Public vulnerability reports go dark until patched; see `SECURITY.md` + `memory/compliance-risk/incident-disclosure.md` (verify both exist before any OSS launch).

## Contribution process (template — activates on OSS launch)

### For new contributors

1. Read `CONTRIBUTING.md`.
2. Open an issue describing the change (for non-trivial work).
3. Wait for label / triage (see SLA below).
4. Fork, branch, code.
5. Sign CLA if prompted.
6. Open PR. Link to issue.
7. Respond to review within 14 days, or PR may be closed (with re-open option).

### For issue reporters

1. Use the issue template.
2. For bug reports: reproduction steps are mandatory. See `memory/product-engineering/test-strategy.md`.
3. For security reports: do NOT open a public issue. Follow `SECURITY.md`.
4. For feature requests: explain the user problem, not just the proposed feature.

### Labels (GitHub)

- `bug`, `feature`, `docs`, `security`, `performance`, `a11y` — topic.
- `good-first-issue`, `help-wanted`, `needs-repro`, `needs-review`, `blocked` — workflow.
- `tier:templates`, `tier:filters`, `tier:grid-system`, `tier:preflight`, `tier:docs` — area (tracking candidate OSS surfaces).
- `priority:p0`, `p1`, `p2`, `p3` — severity.

## PR triage SLAs (template — activates on OSS launch)

These are commitments. Measured openly; missed SLAs discussed in retrospectives.

| Event | SLA |
|-------|-----|
| First response on a new PR | 5 business days |
| First response on a new issue | 5 business days |
| Review round on a responded PR | 5 business days |
| Security report acknowledgement | 2 business days |
| Security report triage | 5 business days |
| Merge or final decline on a ready-to-merge PR | 10 business days |

A "first response" is a human labelling + initial review / question, not a bot auto-comment.

## Governance (template — activates on OSS launch)

- **Maintainers:** list in `MAINTAINERS.md`.
- **Decision-making:** maintainers by consensus; PagePerfect operator holds final veto on strategic direction. Consensus failures escalate to a documented tie-breaker.
- **Adding maintainers:** nomination from an existing maintainer after sustained contribution (typically 6+ months, 20+ merged PRs, trusted review history).
- **Removing maintainers:** documented cause; rare.
- **Code of conduct:** `CODE_OF_CONDUCT.md` based on Contributor Covenant. Enforcement process documented.

## Roadmap transparency

- Public issues + labelled milestones tell contributors what's planned for the open surface.
- Private roadmap items (commercial tier features — Publisher, Studio, Lulu integration) are not disclosed in any open repo.
- Major architectural decisions affecting the open surface land as ADRs under `projects/pageperfect/decisions/`.

## Recognition

- Every merged PR gets the contributor's GitHub handle on the release notes.
- Significant contributors get a named entry in `CONTRIBUTORS.md`.
- "Significant" is judged qualitatively by maintainers; not a formula.

## Community spaces (template)

- GitHub Issues + Discussions.
- Optional: Discord or a focused channel for live conversation (not a decision venue; decisions still happen in GitHub).
- PagePerfect team members identify themselves as such when participating.

## Code of Conduct enforcement (template)

- Reports to a documented private email (`conduct@` or similar — TBD on launch).
- Escalation path: maintainer → operator → #9 Lawyer if legal involvement required.
- Sanctions: warning → ban from repo → ban from community spaces. Proportionate.
- Every enforcement action recorded privately with date + reason. Retained for 3 years.

## Security disclosure (cross-reference)

See `SECURITY.md` (TBD) and `memory/compliance-risk/incident-disclosure.md`. Short version when activated:

- Reports to the documented disclosure address.
- Acknowledgement within 48 hours.
- Triage within 5 business days.
- Public disclosure coordinated after patch + user notification.

## What this program deliberately does not do

- No "open source as marketing" — we don't open source work we can't actually maintain.
- No soliciting contributions only to ignore them.
- No rug-pulling licence changes to proprietary without contributor notice + transition plan.
- No "core team only" guarded areas with no explanation.

## Commercial boundaries

- Contributions to an open surface may be used in commercial tiers under the CLA licence grant.
- PagePerfect does not sell contributor identities or attributions.
- PagePerfect does not take credit for contributors' work in marketing without naming them (with consent).

## Metrics we would track (once any surface is open)

- PR first-response latency (p50 + p95).
- Issue triage latency.
- Release cadence.
- CLA signatures.
- Recognition count.
- Community health signals (active contributors, retention of contributors, civil discourse level).

## How this file is maintained

- Update when the OSS posture changes (a surface ships open, a licence is chosen, a maintainer is added / removed, a CoC enforcement happens, SLAs adjust).
- Every material change reviewed by #2 + #9.
- Never update to walk back a commitment quietly. Document the reason for any relaxed standard.

---

## Reference: how the upstream kit framed open-core (historical, pre-rescope)

The master-build-kit this file was imported from targeted a different product (Allowance Guard, an open-core wallet-security tool). That product's open-core stance — "core tool: free and open source; commercial tiers run on closed layers" — does not apply to PagePerfect today. Preserved here as reference for the framing pattern, not as a PagePerfect commitment:

- The upstream product treated open-source-core as a public commitment central to its voice.
- Core packages + API client + React package were all open source under stated licences; CLA assigned via CLA-assistant bot.
- Commercial tier infrastructure (monitoring, alerts, API quotas) ran on closed layers.

PagePerfect has not adopted this posture. If and when it does, the framing pattern above is reusable; the specific commitments must be re-derived from PagePerfect's commercial model (see `projects/pageperfect/BUSINESS.md`).

## Changelog

- 2026-05-14: Rescoped from AG (EF/Optimism/Gitcoin grants, MetaMask/Rabby/Phantom integrations, crypto-ecosystem targets, Coinbase partnership history, AG open-core scope) to PagePerfect (publishing-ecosystem reality — Lulu live partner, all else prospective). The AG "open-core is the product" framing replaced with PagePerfect's "currently closed-source; candidate OSS surfaces flagged, none committed" stance. Upstream framing preserved as a reference footer (option 2 per the rescope brief).
- 2026-05-14 (operator decision): PagePerfect is fully closed-source, no OSS posture planned. File archived as reference; `open-source-program-run` skill is dormant.
