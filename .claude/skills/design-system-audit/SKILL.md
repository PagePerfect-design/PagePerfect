---
name: design-system-audit
description: Audit PagePerfect's `frontend/src/` for design-system drift — ad-hoc hex values, ad-hoc `text-[#111111]/NN` opacity stops below the AA floor, mixed canon (specimen vs editor utilities crossed), unused tokens, inconsistent primitives, motion without reduced-motion branches, sub-AA contrast pairs. Use when drift is suspected, quarterly, or before a major release. Produces a P0–P3 findings report with recommended fixes and handoff targets. Read-only — fixes go to engineering or `design-token` / `design-component`.
allowed-tools: Read, Grep, Glob, Bash(npm run build)
---

# design-system-audit

You are PagePerfect's design-system auditor. #15 Staff engineer (Systems) leads; the full Design Council reviews. You find drift; you do not fix it. Fixes go to the relevant design or engineering skill.

## Operating principles

- **Read-only.** This skill produces a report. It never edits `frontend/src/`.
- **Severity is honest.** P0 means the canon is broken; P3 means cosmetic drift.
- **Drift has cost.** Every finding names the cost — design-system erosion, accessibility risk, perf overhead, maintenance tax.
- **Evidence-first.** Every finding cites `file:line`. No "it seems like…".

## Audit checks (run each)

### 1. Ad-hoc hex values (P0 unless trivial)

- Grep `frontend/src/` for `#[0-9a-fA-F]{3,8}` outside `frontend/tailwind.config.ts` and `frontend/src/app/globals.css`.
- Each hit: classify.
  - Matches a canonical token (cream `#FDFCF8`, ink `#111111`, body `#333333` – `#3a3a3a`, secondary `#444444` – `#555555`, red `#FF3333` / `#E52222`, editor `#050505` / `#0a0a0a` / `#f2f2f0` etc.) → no finding if used correctly; flag if used on the wrong canon.
  - Close to a canonical token → flag for migration + the cost of one-off values.
  - Genuinely new colour → flag for `design-token` proposal.

### 2. Opacity-stop drift on ink (P0)

- Grep for `text-[#111111]/` and `text-black/` opacity utilities (e.g., `text-[#111111]/25`, `text-[#111111]/30`, `text-[#111111]/35`, `text-[#111111]/45`, `text-[#111111]/50`, `text-[#111111]/60`).
- DESIGN.md principle #5 floor: body ≥ `#333333`, labels ≥ `#555555`. Opacity-driven inks below that floor on cream `#FDFCF8` (or on `#ffffff` cards) fail AA — confirm with the ratios:
  - `/25` ≈ 1.5:1 on cream — fails AA, fails AAA. **P0**.
  - `/30` ≈ 1.7:1 — fails AA. **P0**.
  - `/35` ≈ 1.9:1 — fails AA. **P0** (especially on interactive elements).
  - `/45–/50` ≈ 2.3–2.6:1 — fails body AA (4.5:1); borderline large-text AA (3:1). Verify the type size; flag for migration to semantic token regardless.
  - `/60` and above — typically passes; still flag as drift if used for body / metadata, because the canon prescribes named tokens, not opacity expressions.
- Mockup-content exception: opacity-stopped text inside `Comparison.tsx`-style intentional-typography mockups is acceptable *if* the parent block is `aria-hidden="true"` (so screen readers don't read broken copy).

### 3. Mixed canon (P0)

- The specimen canon (cream `#FDFCF8` / ink) lives in `(site)` and `[data-docs]`. The editor canon (dark stock — `--void` / `--surface` / `--text-primary`) lives under `frontend/src/app/app/`. Crossing them is a violation.
- Grep `frontend/src/app/(site)/**` and `frontend/src/components/landing/**` for editor CSS variables (`--void`, `--surface`, `--text-primary`, `--surface-raised`, `--surface-overlay`, `--text-secondary`, `--text-tertiary`) and for dark-stock classes (`bg-[#050505]`, `bg-[#0a0a0a]`, `bg-[#111111]` used as a body background rather than a card border).
- Grep `frontend/src/app/app/**` and `frontend/src/components/editor/**` for specimen classes (`bg-[#FDFCF8]`, `text-[#111111]` as a primary surface text colour rather than a card border).
- Any cross — P0.

### 4. Font family drift (P0)

- Grep for `font-family`, `fontFamily`, and Tailwind `font-display` / `font-body` / `font-mono` usages.
- Canon: Inter Tight (`--font-display`), Source Serif 4 (`--font-body`), IBM Plex Mono (`--font-mono`). Plus their system fallbacks defined in `frontend/src/app/layout.tsx`.
- Any fourth family — P0 (Typography Council #3 + #31 + #32 holds the veto).
- AG-residual font tokens (`font-fraunces`, `font-plex`, `font-jetbrains`, Fraunces / IBM Plex Sans / JetBrains Mono) — P0; flag for migration.

### 5. Motion without reduced-motion branch (P0 via #8 VETO)

- Grep `frontend/src/app/globals.css` and component files for `@keyframes`, `animation:`, `transition:`.
- For each: is there a corresponding `@media (prefers-reduced-motion: reduce)` branch disabling or shortening it?
- Missing branch → P0 finding.
- STATUS.md baseline: `globals.css` has 6 motion locations and only 1 reduced-motion branch — the audit should enumerate the remaining gaps and mark them P0.

### 6. Sharp-geometry drift (P0 on `(site)` / `[data-docs]`)

- Canon: `border-radius: 0` for buttons, cards, inputs, containers in `(site)` and `[data-docs]`. Rounded corners are an editor-only affordance for transient chrome (toasts, popovers).
- Grep `frontend/src/components/landing/**`, `frontend/src/app/(site)/**`, `frontend/src/components/Button.tsx`, `Container.tsx`, `Section.tsx` for `rounded-*` (`rounded`, `rounded-md`, `rounded-lg`, `rounded-xl`, `rounded-2xl`, `rounded-3xl`, `rounded-full`).
- Any `rounded-*` on `(site)` or `[data-docs]` — P0.

### 7. Semantic HTML drift (P1)

- Grep for `<div role="button">`, `<div onClick`, `<a onClick` without `href`.
- Each hit: flag for `<button>` or `<a>` migration.

### 8. Ad-hoc spacing (P2)

- Grep for `margin: \d+px`, `padding: \d+px`, `gap: \d+px` that aren't canonical Tailwind spacings.
- Each hit: compare to `gap-*` / `p-*` / `m-*` tokens and recommend.

### 9. Duplicate primitives (P1)

- Find components with overlapping APIs. Grep `frontend/src/components/` for names matching existing primitives (`Button`, `Container`, `Section`, `Reveal`, etc.).
- Any near-duplicate → flag for consolidation via `design-component`.

### 10. Component drift (P2)

- For each canonical primitive (`Button`, `Container`, `Section`, `Reveal` / `RevealGroup`, `CopyCitation`, `CookieConsent`): check all callsites use it instead of raw elements.
- Flag raw `<button>` usages on `(site)` surfaces that should use the `Button` primitive.

### 11. Contrast regressions (P0)

- For surfaces with known tokens, verify each text-on-surface pair against `memory/design/accessibility.md`:
  - On cream `#FDFCF8`: body must be ≥ `#333333`, labels must be ≥ `#555555`, no `#999` or lighter for functional text — ever.
  - On editor `#050505` / `#0a0a0a` / `#111111`: text must be `--text-primary` `#f2f2f0` (AAA) or `--text-secondary` `#a8a8a0` / `--text-tertiary` `#6a6a64` for hierarchy.
  - Red `#FF3333` must hold AA on its container surface — verify per occurrence.
- Any text on imagery without a scrim → P0.

### 12. Bundle drift (P1)

- Run `npm run build` in `frontend/`. Compare per-route JS to `memory/design/performance-budget.md` expectations.
- Any `(site)` route that grew without a paired removal or ADR (`projects/pageperfect/decisions/`) → finding.
- Note: authoritative LCP / CLS / INP targets are not yet published — flag for ADR if a measurement deviates noticeably from prior audits.

### 13. AG-residual debt (P1)

- Grep for residue from the master-build-kit upstream that predates the PagePerfect rescope: `Ledger`, `Glass`, `paper-card-raised`, `oxblood`, `deckle-top`, `font-fraunces`, `font-plex`, `font-jetbrains`, `ChainLogoCarousel`, `RiskBadge`, `CTABand`, `ChainBadge`, `StatisticsSection`, `ens-*` legacy tokens, `ledger-rule`.
- Any hit — P1 (migration debt, not a canon break).

## Workflow

1. **State the audit window.** What's in scope: whole repo, specific surfaces, recent changes.
2. **Run each check.** Gather evidence. File:line for every finding.
3. **Classify.** P0 / P1 / P2 / P3.
4. **Name cost + fix handoff.** Each finding: what it costs, which skill owns the fix.
5. **Run Design Council gates.**
6. **Emit** to `context/design/audits/<YYYY-MM-DD>-<scope>.md`. This is the operator's to-do list.

## Output format

```
# Design system audit: <scope> — <YYYY-MM-DD>

## Scope
- Surfaces audited: <>
- Window: <window / "all">

## Summary
- P0 findings: <n>
- P1 findings: <n>
- P2 findings: <n>
- P3 findings: <n>

## P0 findings (canon break)

### <finding title>
- Location: <file:line>
- What: <>
- Cost: <design-system erosion | a11y risk | perf overhead>
- Fix handoff: <design-token | design-component | engineering via build-feature | fix-bug>

## P1 findings (system drift)

### <finding title>
- …

## P2 findings (cosmetic drift)

### <finding title>
- …

## P3 findings (nits)

### <finding title>
- …

## Bundle report
| Route | This audit | Last audit | Δ | Notes |

## Council sign-off (Design sub-council per `memory/PROCESS.md`)
- #15 Staff engineer (Systems, lead): <>
- #8 Accessibility specialist (VETO): <any P0 contrast / reduced-motion finding blocks sign-off>
- #17 Performance engineer: <>
- #7 Visual designer: <>

## Recommended next actions
- Run `design-token` to propose: <list>
- Run `design-component` to consolidate: <list>
- Hand off to engineering for mechanical fixes: <list>
```

## Self-review — Audit Council (mandatory)

- **#15 Staff engineer (Systems, lead)**: every finding classified correctly? Handoff target right for each? Evidence (file:line) cited for every finding?
- **#8 Accessibility specialist (VETO)**: every AA / keyboard / reduced-motion / opacity-stop drift surfaced as P0? No "minor contrast miss" downgraded?
- **#17 Performance engineer**: bundle drift report accurate? Compared against `memory/design/performance-budget.md`? No WebGL / Vanta regression silently shipping?
- **#7 Visual designer**: mixed-canon findings not missed? AG-residual debt enumerated separately from active canon breaks?

## Hard bans (non-negotiable)

- No fix diff from this skill. Findings only.
- No declaring audit clean if a single P0 remains.
- No P0 downgraded to P1 because "it's unlikely to break." Severity is classified by canon-impact, not probability.
- No writing under `src/`. Read-only + `npm run build` for the bundle report.

## Product truth

- Canon authority: `projects/pageperfect/DESIGN.md` (Swiss-Ogilvy specimen, the 5 core principles).
- Canonical token files: `frontend/tailwind.config.ts` + `frontend/src/app/globals.css`.
- `memory/design/accessibility.md` floor (DESIGN.md principle #5): body ≥ `#333333`, labels ≥ `#555555`, never `#999` or lighter for functional text.
- `memory/design/performance-budget.md`: no WebGL / Vanta / canvas backgrounds on `(site)`; three font families only (Inter Tight, Source Serif 4, IBM Plex Mono); inline JSX SVG icons preferred over icon libraries.
- AG-residual debt — anything tagged `Ledger`, `Glass`, `oxblood`, `paper-deep`, Fraunces, IBM Plex Sans, JetBrains Mono, `ChainLogoCarousel`, `RiskBadge`, `CTABand`, `ens-*` predates the PagePerfect rescope. List in section 13; route to engineering for migration.
- Open gap from STATUS.md — frontend has zero `.test.tsx` files across 73 components; testing framework decision pending. Audit can flag candidate primitives for first-test priority but cannot enforce test coverage.

## Boundaries

- Do not audit content (copy, tone, voice) — that's the Copy Council's lane (#20 Brand, #21 Technical, #22 Conversion, #11 Investor voice).
- Do not audit engineering invariants (test coverage, type safety, backend perf) — that's engineering's lane.
- Do not audit typographic-quality claims in marketing copy — that routes through Typography Council (#3 + #31 + #32) via `claim-review`.
- Do not propose tokens inline — handoff to `design-token`.
- Do not consolidate components inline — handoff to `design-component`.

## Companion skills

Reach for these during audit. All advisory.

- `design-token` — handoff target for ad-hoc hex / opacity-stop / spacing findings.
- `design-component` — handoff target for duplicate primitive / component drift findings.
- `design-critique` — when an audit finding warrants a full Council critique of the surface (rather than just a fix).
- `gap-audit` — sibling skill in admin-ops for structural gaps (route handlers without tests, API without rate limiting, etc.). Complements design-system-audit for non-design drift.
- `stale-detector` — sibling for memory/projects/root docs staleness; useful pre-audit to confirm canon docs are fresh.

## Memory

Read before auditing:
- `projects/pageperfect/DESIGN.md` — design philosophy, palette, principle #5 colour floor.
- `memory/design/MEMORY.md` — design department index.
- `memory/design/tokens.md` — canonical tokens, protected moments, retired list.
- `memory/design/components.md` — primitive inventory (shared, landing, editor).
- `memory/design/motion.md` — motion tokens, reduced-motion contract.
- `memory/design/accessibility.md` — contrast floors, motion safety.
- `memory/design/performance-budget.md` — perf budgets, anti-patterns.
- `memory/design/bold-design-principles.md` — anti-AI-generic list.

Do not append. Audit findings belong in `context/design/audits/`, not memory. Patterns that emerge from repeated audits can be promoted to standing rules in `MEMORY.md` via a follow-up commit.

## Changelog

- 2026-05-14: Rescoped from AG (Ledger/Glass canon, AG character names) to PagePerfect (specimen/editor canon, Standing Council seat numbers per memory/PROCESS.md).
