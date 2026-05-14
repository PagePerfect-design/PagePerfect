# CLAUDE.md — PagePerfect Entry Point

Behaviour rules and load map for Claude working in this repo. Full project knowledge lives in `projects/pageperfect/`. Global behaviour rules live in `memory/`. Skills live in `.claude/skills/`.

## Startup routine

At the start of every session or task:

1. **Read this file first.** It's the load map.
2. **Read anything in `context/`** (gitignored, optional). Current-task notes. If empty, skip.
3. **Load on demand.** Pull the `memory/` or `projects/pageperfect/` files relevant to the task — not all of them.

`context/` explains the present. `memory/` holds how Claude behaves. `projects/pageperfect/` holds what we're building.

## Precedence (highest → lowest)

1. User instruction in the current turn.
2. `context/` — active task notes.
3. `projects/pageperfect/` — project-specific rules.
4. `memory/` — global behaviour rules.
5. This file — defaults and load map.

Project-specific always beats global. Current turn always wins.

## Triage

- **How I work** → `memory/`
- **What I'm building** → `projects/pageperfect/`
- **Right now** → `context/` (gitignored)
- **How Claude behaves** → this file

## Load map (read on demand)

### Global behaviour — `memory/`

| When working on... | Read |
|--------------------|------|
| Anything non-trivial | `memory/PROCESS.md` (workflow rules + Standing Council) |
| User-facing copy | `memory/VOICE.md` (banned phrases, tone) |
| Writing/editing code | `memory/OUTPUT.md` (conventions, file naming, scope discipline) |
| Choosing a tool | `memory/TOOLS.md` (tool policy, git safety) |
| Before shipping anything | `memory/CONSTRAINTS.md` (hard "Do Not" rules) |
| Hit a lesson worth keeping | `memory/CORRECTIONS.md` (append-only) |

Index: `memory/README.md`. Maintenance rules (replace-over-accumulate) live there too.

### Project — `projects/pageperfect/`

| When working on... | Read |
|--------------------|------|
| Repo layout, tech stack, env vars, commands | `PROJECT.md` |
| API routes, compile pipeline, templates, sandboxing, grid system | `ARCHITECTURE.md` |
| Marketing pages, editor UI, design tokens, components | `DESIGN.md` |
| Pricing, tiers, claims, watermark | `BUSINESS.md` |
| Known gaps, tech debt, testing | `STATUS.md` |
| "Why is it this way?" | `decisions/` (ADRs) |

### Department managed-agent systems — `memory/<dept>/` + `.claude/skills/`

Skills under `.claude/skills/` invoke memory from their department. Autonomy level 2 unless noted: plan → diff → tests; user commits and deploys.

| Department | Memory | Skills (each dept has its own `MEMORY.md` index) |
|-----------|--------|--------------------|
| Product & engineering | `memory/product-engineering/MEMORY.md` | `build-feature`, `fix-bug`, `refactor-component`, `debug-prod-incident`, `write-migration`, `implement-checkout-flow`, `webhook-review`, `add-integration` |
| Design | `memory/design/MEMORY.md` | `design-surface`, `design-component`, `design-token`, `design-motion`, `design-system-audit`, `design-critique`, `emil-design-eng` (motion craft), `bencium-typography` (HTML/CSS typography canon) |
| Marketing | `memory/marketing/MEMORY.md` | `market-research`, `positioning`, `content-strategy`, `writer`, `seo`, `seo-audit`, `social`, `outreach`, `conversion`, `page-cro`, `paywall-upgrade-cro`, `analytics`, `campaign-manager`, `image-direction`, `web-implementation`, `email-sequence`, `launch-strategy`, `de-ai-ify`, `homepage-audit`, `voice-extractor` |
| Compliance & risk | `memory/compliance-risk/MEMORY.md` | `claim-review`, `legal-page-draft`, `policy-alignment`, `security-claim-audit`, `regulatory-change-response` |
| Growth & distribution | `memory/growth/MEMORY.md` | `grant-application`, `integration-proposal`, `listing-submission`, `partnership-brief`, `sponsorship-brief`, `open-source-program-run` |
| Data & intelligence | `memory/data-intelligence/MEMORY.md` | `define-metric`, `weekly-metrics-brief`, `experiment-design`, `experiment-readout`, `funnel-analysis`, `cohort-retention` |
| Admin & operations | `memory/admin-ops/MEMORY.md` | `support-triage`, `docs-coherence-audit`, `finance-snapshot`, `vendor-review`, `incident-postmortem`, `internal-coordination-brief`, `pp-handover`, `session-orient`, `stale-detector`, `gap-audit` |

**Skill execution depth pattern**: `memory/SKILL-MODE-PATTERN.md` (from BrianRWagner) documents the quick / standard / deep mode pattern — useful when an existing skill needs to run at different depths. Lift the pattern into skills selectively; don't retrofit blindly.

**Authoring new skills**: `.claude/skills/skill-creator/` (Anthropic-official) is the meta-skill for writing new skills. Invoke when a gap surfaces that no existing skill addresses. New skills go in `.claude/skills/<name>/SKILL.md` (flat — no department subdirectories) and get listed in the department table above + the relevant `memory/<dept>/MEMORY.md`. Use sparingly — most "gaps" are existing-skill adaptations, not new skills.

**Level 1 (fresh confirm per write):** `write-migration`, `implement-checkout-flow`, sensitive legal drafting.

## The four workflow rules (full text in `memory/PROCESS.md`)

1. **Plan first.** Outline files, approach, steps before writing code.
2. **600-line limit.** No file over 600 lines. Split if needed.
3. **Conserve tokens.** Terse. No re-reads. Batch independent tool calls. Prefer `Edit` over `Write`.
4. **Convene the Standing Council.** Reason through every non-trivial change through the relevant lenses.

## Vetos (active on every change)

- **Accessibility (#8)** — WCAG AA, contrast, motion safety, semantic structure.
- **Data protection lawyer (#24)** — privacy/consent copy, GDPR-accurate language.
- **Typography Council (#3 + #31 + #32)** — claims about typographic quality, baseline-grid conformance, KDP/IngramSpark/Lulu compliance.
- **Investor / founder voice (#11)** — banned-phrases purge (see `memory/VOICE.md`).

## Suggested `.claude/settings.json`

The harness blocks me from writing this file myself (self-modification guard). To apply the recommended deny-list, create `.claude/settings.json` manually with:

```json
{
  "permissions": {
    "deny": [
      "Bash(git push*origin main*)",
      "Bash(git push*--force*)",
      "Bash(git push*-f*)",
      "Bash(vercel*)",
      "Bash(stripe*)",
      "Bash(rm -rf*)"
    ]
  }
}
```

This blocks force-push, direct push to `main`, Vercel deploys, Stripe CLI ops, and `rm -rf` — all destructive or production-mutating commands you should approve case-by-case.

## Standing Council snapshot (full table in `memory/PROCESS.md`)

The Council has 36 members covering editorial, engineering, design, accessibility, legal, marketing, payments, typography, LaTeX/PDF, book publishing, ops, and analytics. It is consulted in spirit, not literal roleplay. The minimum size is 17; new specialists can be added but members can't be removed.

Sub-councils for specific domains:
- **Design Council (6)** — Visual, Motion, UX, Systems, Accessibility (**veto**), Performance.
- **Copy Council (3)** — Brand, Technical, Conversion.
- **Legal Council (3)** — Compliance, Regulatory, Data Protection (**veto**).
- **Typography Council (3)** — Typography expert, LaTeX/PDF engineer, Book publishing expert (**veto** on typographic-quality claims).

## Changelog

- 2026-04-14: Original PagePerfect CLAUDE.md (rich all-in-one project doc, 826 lines).
- 2026-05-13: Restructured to entry-point + load-map model from master-build-kit upstream. Project content split into `projects/pageperfect/{PROJECT,ARCHITECTURE,DESIGN,BUSINESS,STATUS}.md`. Behavior rules adopted from `memory/`. 47 skills installed under `.claude/skills/`. Standing Council scoped to PagePerfect (Web3 seats #3/#31/#32 replaced with Typography/LaTeX-PDF/Book-publishing). Original CLAUDE.md preserved as `CLAUDE.md.pre-kit-backup`.
