# Rigor Program — Design Spec

> Date: 2026-05-16 · Status: **Approved 2026-05-17** (canonical plan for the redesign program) · Branch: `docs/rigor-program`
>
> Phase 0 — Functional Verification — was added 2026-05-17 by the conductor before Phase 1. The compile-pipeline and editor flow must be verified functional before Phase 3 (Editor redesign) begins; if any P0 functional defect is found, it is fixed via `fix-bug` before redesign starts. The original 7-phase sequence (§5) is otherwise unchanged.

## Mission

Restore Brockmann-grade precision across every PagePerfect surface (marketing pages + product UI) and the compile engine (PDF output). The brand promise — "fine typesetting as a service" — currently holds only on the landing page. Everywhere else the execution drops to default SaaS conventions, which silently undermines the promise to every visitor who clicks past the homepage.

This spec defines: (1) what "precision" means operationally (math, not vibes), (2) per-surface audit + treatment briefs, (3) engine overhaul targeting the gaps that show up in PDF output, (4) sequencing.

---

## 1. Diagnosis

### 1.1 What the brand claims
PagePerfect is a precision instrument: Markdown in, professionally-typeset PDF out. The manifesto landing (commit c5339d9, PR #212) sets the brand vocabulary: cream/ink palette, 2px rules, Inter Tight + Source Serif 4 + IBM Plex Mono, square corners, mono captions, asymmetric editorial layouts. Müller-Brockmann (grid systems) fused with David Ogilvy (direct response). DESIGN.md codifies it.

### 1.2 Where the brand fails
- **Auth flows** (`/auth/*`) — five pages of default form styling. The first impression after a signup CTA. Generic.
- **Editor** (`/app`) — pre-manifesto monolith. Dark theme, floating HUD, overlay semantics. Doesn't visually inherit the marketing brand.
- **Docs** (`/docs`) — functional table layout. Pre-manifesto vocabulary. Inconsistent with `/philosophy` rigor.
- **Journal** (`/journal` + article) — CMS-typical layout. Articles don't demonstrate the typography we sell.
- **Landing** — manifesto in form, but the underlying math is loose: clamp() typography fluid-interpolates and breaks vertical rhythm; spacing is on Tailwind's arbitrary scale (4px increments) rather than a ratio; no enforced baseline grid; modular grid (12-col) is implicit not explicit.

### 1.3 Engine gaps (PDF output)
- **Baseline grid encoded but not enforced cross-page** — typography-assurance.js scores conformance, doesn't prevent violations.
- **Microtype partial** — protrusion enabled, hung punctuation NOT possible in Typst (limitation), optical kerning via OpenType only.
- **Widows/orphans detected post-compile, not prevented** — engine warns, doesn't re-flow.
- **Hyphenation control minimal** — no per-word exceptions, no language-pair tuning.
- **Multi-column / complex tables fragile** — Pandoc→Typst conversion overflows silently for wide tables.
- **No automated visual regression** — output quality depends on developer eyeballing PDFs.
- **No XMP/Info dict beyond basic** — fails archival standards.

### 1.4 The honest indictment
The brand is a Swiss-precision instrument promise wrapped around a partially-Swiss codebase. The mismatch will be felt by every user who:
- signs in (generic auth)
- opens the editor (different visual language entirely)
- reads the docs (not designed to the same standard as the marketing for those docs)
- downloads a PDF and finds widows on page 7

---

## 2. Principles (Brockmann operationalized)

These are enforceable rules. Not aspirations.

### 2.1 The grid

**Web (frontend):**
- **Modular grid:** 12 columns, 24px gutter, 96px max margin (desktop). On tablet: 8 columns. On mobile: 4 columns.
- **Baseline grid:** 8px base unit. Every text block sits on a multiple of 8px. Line-height computed to land on the grid (e.g., 16px text × 1.5 lh = 24px = 3 units).
- **All spacing on the 8-grid:** 8, 16, 24, 32, 48, 64, 96, 128. No `padding: 18px` or `margin-top: 22px`. Banned.
- **Container widths on the grid:** content max-width 1200px (50 units × 24px), text max-width 720px (90 units × 8px, ~65ch).

**PDF (engine output):**
- **Baseline grid per category** (already encoded in typography-assurance.js: 12pt academic, 11pt others). **Enforce, don't just measure.** Lines that fail to land trigger compile error with line-number diagnostic.
- **Type scale anchored to baseline:** body 11pt / 13.2pt leading (1.2 × base, lands every line). H1 22pt / 26.4pt (2× body). H2 16.5pt / 19.8pt (1.5×). H3 13.2pt / 13.2pt. No fractional baselines.
- **Margins on the baseline grid:** all page margins are multiples of the baseline unit so the text frame is a clean grid.

### 2.2 Typography

**Scale (modular, ratio 1.25 = major third, mathematically consistent):**

| Token | Web (px) | PDF (pt) | Use |
|---|---|---|---|
| `text-xs` | 12 | 9 | Mono captions, footnotes, metadata |
| `text-sm` | 14 | 10 | Secondary body, UI labels |
| `text-base` | 16 | 11 | Body |
| `text-lg` | 18 | 13 | Lead paragraphs |
| `text-xl` | 22 | 14 | h4 |
| `text-2xl` | 26 | 16.5 | h3 |
| `text-3xl` | 32 | 22 | h2 |
| `text-4xl` | 40 | 28 | h1 |
| `text-hero` | 64 | — | Hero only, web only |

**Replace clamp() with discrete breakpoints.** Fluid type breaks baseline grid. Define sizes per viewport tier: mobile / tablet / desktop. CSS `@container` queries OK; `clamp()` for body text banned.

**Stack discipline:**
- Inter Tight: display, UI, mono-style labels (with tracking)
- Source Serif 4: long-form body (journal, docs prose, marketing body)
- IBM Plex Mono: metadata, code, section numbers, captions
- **Three faces. Not four. Not two.** Locked.

**Tracking:** Uppercase labels get `letter-spacing: 0.1em` minimum (per DESIGN.md, already canonical). Body never gets tracking. Display headlines: `letter-spacing: -0.02em` (optical tightening) only.

### 2.3 Color

Already correctly restrained. Keep:
- Ink `#111111`
- Body `#333333`
- Secondary `#555555`
- Cream `#FDFCF8`
- Accent (one): `#FF3333`
- Hairline `#E5E5E0`

**Forbid:** any grey lighter than `#777` for text. Any color outside the palette without a written justification in a per-page brief.

### 2.4 Composition rules

- **Asymmetry > centering.** Center alignment is reserved for short labels and the hero of the brand mark only. Body, headlines, and content blocks left-align.
- **Hairlines, not boxes.** Borders are 1px or 2px. No drop shadows in `(site)` context. Shadows are an editor-only affordance.
- **Numbered sections.** Every major section gets a mono section number (`01`, `02`...) per DESIGN.md.
- **Captions earn their place.** Every figure has a mono caption. Every quote has attribution. No floating content.
- **Empty space is structural.** White space at 64px+ is a deliberate compositional choice — never collapse it to 32px because a section "feels too sparse."

### 2.5 Motion

- Durations: 75ms (instant), 200ms (snappy), 350ms (deliberate). Nothing slower in `(site)` context.
- Easing: `cubic-bezier(0.25, 0.4, 0.25, 1)` (already canonical as `--ease-pp`).
- **Prefers-reduced-motion: hard kill.** No fade-up, no reveal — instant render.
- No spring physics, no parallax, no scroll-tied animation on text. Reveals on first scroll only.

### 2.6 Acceptance test for any new screen

A screen ships only if all answers are yes:
1. Every text element sits on the baseline grid.
2. Every spacing value is a multiple of 8 (web) or the chosen baseline (PDF).
3. Every font size is from the scale above.
4. No color outside palette without written justification.
5. Heaviest visual element on the page = primary action (Ogilvy contrast rule).
6. Prefers-reduced-motion respected.
7. WCAG AA pass (contrast checked, semantic HTML, focus visible).
8. Mobile (375px) renders without horizontal scroll and without orphaned widow on any heading.

---

## 3. The Page Program

12 surfaces to bring to standard. Order = priority.

### 3.1 Editor `/app` (priority: highest)

**Current:** Pre-manifesto monolithic component. Dark theme, floating HUD, control strip, preview pane. Different visual language from marketing.

**Diagnosis:**
- Doesn't inherit the marketing brand → product feels like a different company than the landing.
- Dark theme contradicts the cream-on-ink specimen treatment of the brand.
- Floating HUD is mid-2020s SaaS — clashes with editorial monograph vocabulary.
- Monolithic file — hard to evolve component by component.

**Treatment:**
- **Adopt the specimen palette** for the editor: cream `#FDFCF8` page background, ink `#111111` text. Dark mode becomes opt-in toggle, not default.
- **Replace floating HUD** with a fixed top toolbar + persistent right-rail control panel — anchored, gridded, predictable.
- **Three-column layout:** [thin left rail: file/sections nav, 240px] [center: markdown editor, fluid] [right rail: controls + preview tabs, 320px].
- **Preview area** uses paper-stock skeuomorphism (already exists as `.paper-surface`) but on cream-paper bg, not dark.
- **Components extracted** from monolith: `EditorShell`, `EditorTopBar`, `EditorSectionNav`, `EditorTextarea`, `EditorRightRail`, `EditorPreviewPane`, `EditorControlGroup`. One file each, max 250 lines each.
- **Typography** in editor: IBM Plex Mono for the textarea (already standard), Inter Tight for UI, Source Serif 4 for preview rendering of body prose.

**Files (current monolith):** `frontend/src/app/app/page.tsx`, `frontend/src/app/app/layout.tsx`, plus components in `frontend/src/components/CompileShell.tsx`, `ControlStrip.tsx`, `FloatingHUD.tsx`, `PreviewPane.tsx`, `PublishingSystems.tsx`, `TopBar.tsx`.

**Acceptance:**
- Editor renders in cream-paper mode by default; dark mode toggleable.
- Each editor component file ≤ 250 lines.
- All editor controls (buttons, inputs, selects) use the same component primitives as `(site)` — no editor-only Tailwind shortcuts.
- Mobile editor works (currently unclear if it does).

**Estimate:** 8-12 hours of focused work. Highest-value redesign in the program.

---

### 3.2 Auth flows `/auth/*` (priority: high)

Five pages: `/auth/login`, `/auth/signup` (currently `/auth/login` may handle both), `/auth/forgot-password`, `/auth/reset-password`, `/auth/verify`.

**Current:** Standard form layouts. Turnstile CAPTCHA on submit. Email/password + OAuth. Generic.

**Diagnosis:**
- First visual touch after a signup CTA — and it looks like a Tailwind starter.
- Forms not on the brand's typographic grid.
- No editorial framing — these are just functional forms.

**Treatment:**
- **Editorial framing:** every auth page is a two-column composition. Left column (5 of 12): the form. Right column (6 of 12, 1 gutter): an editorial vignette — a relevant manifesto excerpt, a typography specimen, a quote, OR (on /verify) the user's email displayed in specimen-card form.
- **Form fields:** square corners (already canonical), 1px ink border, 48px height, IBM Plex Mono for placeholder, Inter Tight for input value.
- **Primary CTA:** red `#FF3333`, full width of left column.
- **Error states:** inline, 14px Source Serif 4, red text, no shake animations.
- **Page headlines:** Inter Tight 32px on a 8px grid; mono section label above (e.g., "01 SIGN IN").
- **Pages have unique editorial right-column content** so they don't feel like five copies of the same page.

**Files to create/modify:**
- Shared: `frontend/src/components/auth/AuthFrame.tsx`, `AuthForm.tsx`, `AuthVignette.tsx`, `AuthField.tsx`.
- Per-page: refactor `auth/login/page.tsx`, `auth/signup/page.tsx`, `auth/forgot-password/page.tsx`, `auth/reset-password/page.tsx`, `auth/verify/page.tsx`.

**Acceptance:**
- All 5 pages use `AuthFrame` (no duplicate page chrome).
- All fields use `AuthField` primitive.
- Right column content is unique per page and bonded to the page's purpose.
- Forms validate inline; no toast/alert popups.

**Estimate:** 4-6 hours.

---

### 3.3 Docs `/docs` (priority: medium-high)

**Current:** Data-driven table layout. DocsNav sidebar. RequirementsCheck component. Functional but pre-manifesto.

**Diagnosis:**
- DocsNav sidebar (left): visually competes with content rather than supporting it.
- Template reference tables: utilitarian, not editorial.
- KDP publishing guide: text-heavy, lacking structure markers.
- Sidebar nav lacks the section-numbering rigor of the manifesto.

**Treatment:**
- **Sidebar:** numbered sections (`01`, `01.1`, `02`...). Mono labels. Active state = red text, not red background. Sidebar width fixed 240px.
- **Template reference:** convert table to a specimen-card grid. Each template card shows: specimen line of body type, mono caption with template metadata (size, leading, font family), template name. Cards are white with 1px ink border (already canonical via `.docs-template-card`).
- **KDP guide:** restructure into numbered chapters (I–N) like the manifesto. Each chapter has a 2px bottom rule, mono kicker, Inter Tight headline, Source Serif 4 body. Lists become numbered enumerations on the baseline grid.
- **RequirementsCheck:** keep functional, restyle to match `.docs-admonition` canonical style (4px left border, white bg, mono icon).

**Files:** `frontend/src/app/(site)/docs/page.tsx`, `frontend/src/components/DocsNav.tsx`, `frontend/src/components/DocsMobileNav.tsx`, `frontend/src/components/RequirementsCheck.tsx`. Possibly extract `frontend/src/components/docs/TemplateSpecimenCard.tsx` and `frontend/src/components/docs/KdpChapter.tsx`.

**Acceptance:**
- Sidebar uses numbered sections, no nested folder icons.
- Template reference is specimen-card grid, not table.
- KDP guide reads as a numbered editorial document.
- All headings on baseline grid.

**Estimate:** 3-5 hours.

---

### 3.4 Journal `/journal` + `/journal/[slug]` (priority: medium)

**Current:** CMS-style index + article. Article uses `.journal-article` class with Source Serif 4 at 1.125rem / 1.8 lh, drop cap.

**Diagnosis:**
- Article typography is on the right track but isn't perfectly on a baseline grid.
- Article header lacks editorial chrome — needs VOL./ISSUE marker, kicker, byline, dateline like a real journal.
- Index page is card-grid; cards lack typographic specimen quality.
- No table of contents on long articles.

**Treatment:**
- **Index:** drop the card grid. Use a single-column editorial list: each article is a row with `VOL. N · NN AUG 2026` mono kicker, large Inter Tight headline, Source Serif 4 dek/lede, 1px bottom hairline. Hover state: red headline.
- **Article header:** kicker (`VOL. 02 · NN AUG 2026 · ESSAY`), Inter Tight headline (40-64px), byline (`BY ANGELA WRIGHT · 8 MIN READ`), 2px bottom rule.
- **Article body:** Source Serif 4 18px / 28px (lands on 8-grid). Drop cap 64px on first paragraph. Section breaks: numbered (`§ 1`, `§ 2`) with mono labels, 2px top rule.
- **Side rail:** thin 1px left rule, mono ToC, current section highlighted in red.
- **Marginalia + Footnote** primitives (already exist in landing manifesto): adopt for journal too.

**Files:** `frontend/src/app/(site)/journal/page.tsx`, `frontend/src/app/(site)/journal/[slug]/page.tsx`. Likely extract: `frontend/src/components/journal/ArticleHeader.tsx`, `ArticleToc.tsx`, `JournalIndexRow.tsx`.

**Acceptance:**
- Journal index is a single column; no cards.
- Article header has full editorial chrome.
- Body type lands on 8-grid.
- ToC sticks on long articles.

**Estimate:** 4 hours.

---

### 3.5 Pricing `/pricing` (priority: medium — partial work done)

**Current:** Already has manifesto treatment (per investigation). 3 tiers, editorial prose tier descriptions, FAQ.

**Diagnosis (audit):**
- Verify tier cards use the canonical `.card` style (white, 1px ink border, square corners).
- Verify the pricing comparison feature row uses consistent type scale.
- Verify the FAQ is not a chevron-accordion (boring) but a numbered editorial Q&A.

**Treatment:**
- **Tier cards:** confirm white + 1px black border, no rounded corners, no shadows. Tier name in Inter Tight, price in Inter Tight 64px display, body in Source Serif 4, "what's included" as a numbered list with mono numbers.
- **One CTA per tier, red, full-width within card.**
- **Comparison table:** if exists, redesign to specimen-card grid like docs templates, or a clean ruled table (1px hairlines, mono headers).
- **FAQ:** restructure as numbered chapter (`§ Q.1`, `§ Q.2`...), no accordion behavior; render expanded by default. Use Source Serif 4 for answers.

**Files:** `frontend/src/app/(site)/pricing/page.tsx`. Possibly: `frontend/src/components/pricing/TierCard.tsx`, `PricingFaq.tsx`.

**Acceptance:**
- Pricing page reads as part of the same monograph as `/`.
- No chevron accordions.
- One red CTA per tier.

**Estimate:** 2-3 hours.

---

### 3.6 Landing `/` (priority: medium — math audit on existing work)

**Current:** Manifesto redesign just shipped (PR #212). Editorial monograph, six chapters, sticky folio, inline colophon.

**Diagnosis:**
- The form is right; the math may not be.
- clamp() type sizes break baseline grid.
- Spacing values likely on Tailwind's 4px scale, not strict 8-grid.
- Folio sticky nav may have rhythm gaps.

**Treatment:**
- **Audit all spacing:** replace non-8-multiples with the nearest 8-multiple.
- **Replace clamp() in body type** with discrete breakpoint sizes (mobile / desktop). Headlines can keep fluid sizing IF they don't sit in a body-text block.
- **Verify baseline grid** on Chapter II–VI bodies. Tooling: add a dev-only grid overlay (`?grid=1` query param) that shows baseline lines so we can verify visually.
- **Folio** — confirm active-chapter detection feels precise (IntersectionObserver threshold tuned).

**Files:** `frontend/src/components/landing/manifesto/*` (audit pass). Possibly add: `frontend/src/components/dev/BaselineGridOverlay.tsx` (dev-only).

**Acceptance:**
- Body type on 8-grid at all breakpoints.
- Spacing audit: zero non-8-multiples in landing components.
- Dev grid overlay tool exists.

**Estimate:** 2-3 hours.

---

### 3.7 Philosophy `/philosophy` (priority: low — already canonical)

**Current:** Manifesto-styled, Müller-Brockmann quote-led.

**Treatment:** Audit only. Verify baseline grid, spacing on 8-grid, type scale conforms. Likely already good.

**Estimate:** 1 hour audit pass.

---

### 3.8 Legal pages `/privacy` `/terms` `/cookies` (priority: low)

**Current:** Two-column Plain English + legal clause layout. Already manifesto-styled per investigation.

**Treatment:** Audit + minor refinements. Likely no major work.

**Estimate:** 1 hour total.

---

### 3.9 Status `/status` (priority: low)

**Current:** Header matches manifesto.

**Treatment:** Audit + ensure component statuses (PocketBase, backend, Redis) render with mono status indicators (`OK`, `DEGRADED`, `DOWN` in mono, color-coded sparingly).

**Estimate:** 1 hour.

---

### 3.10 Site directory `/site-directory` (priority: lowest)

**Current:** Site map / navigation index.

**Treatment:** Confirm it's a clean editorial list of routes with mono section numbers. Likely fine.

**Estimate:** 30 min.

---

### 3.11 Nav + Footer (shared chrome, priority: medium)

**Current:** Header has PagePerfect logo + Pricing + Journal + Auth + "Open Editor" (black button). Footer has accordion (per `FooterAccordion.tsx`).

**Treatment:**
- **Nav:** verify alignment on the modular grid. Mono section indicator on left ("HOME · PRICING · JOURNAL"). Confirm mobile menu is editorial, not hamburger-overlay.
- **Footer:** replace accordion (collapses content = anti-Brockmann) with a 4-column editorial footer: brand block, product links, company links, legal links. Hairlines, mono labels, no toggles.
- **CompositorMark:** verify it renders sharp at all sizes; it's a typographic mark and must be precise.

**Files:** `frontend/src/components/Nav*`, `Footer*`, `MobileNav.tsx`, `FooterAccordion.tsx` (replace), `CompositorMark.tsx`.

**Estimate:** 2-3 hours.

---

### 3.12 Page totals

| Surface | Priority | Estimate |
|---|---|---|
| Editor | highest | 8–12h |
| Auth flows (5 pages) | high | 4–6h |
| Docs | medium-high | 3–5h |
| Journal (index + article) | medium | 4h |
| Pricing | medium | 2–3h |
| Landing (math audit) | medium | 2–3h |
| Nav + Footer | medium | 2–3h |
| Philosophy | low | 1h |
| Legal | low | 1h |
| Status | low | 1h |
| Site directory | lowest | 0.5h |

**Total: 28–42 hours of focused redesign work across the surface area.**

---

## 4. The Engine Overhaul

Targets the PDF output gap. Detailed work per typst template + orchestration.

### 4.1 Diagnosis (per audit)

- **Baseline grid measured, not enforced.** `typography-assurance.js` produces a score; engine doesn't fail compile when score < threshold.
- **Microtype partial.** Protrusion enabled; hung punctuation not natively supported by Typst; we can fake it for selected punctuation with negative margins.
- **Widows/orphans warn-only.** Engine emits warnings; doesn't re-flow.
- **Hyphenation control minimal.** No per-word exceptions, no language pair tuning.
- **Multi-column / wide tables overflow silently.** Pandoc→Typst conversion is basic for these.
- **No automated visual regression.** PDF quality depends on human review.
- **Limited template diversity** — 15 templates, but they share a single layout architecture (single-column body). No editorial multi-column option.

### 4.2 Target state

PDFs that hold up next to Lulu / IngramSpark / KDP professionally-typeset benchmarks. Specifically:
- Every line of body text lands on the declared baseline grid (verifiable post-compile).
- No widows. No orphans. (Allow 1 widow per chapter max; flag the rest.)
- Hung punctuation on quote marks and hyphens, at margin (faked via Typst protrusion).
- Hyphenation: language-aware, per-word exception list for common typesetting offenders.
- Multi-column option (2-col editorial template) for selected types (manuscript collections, design monographs).
- Wide tables: auto-rotate to landscape page, or auto-shrink column widths to fit.
- Output passes an automated visual regression run before being served to user (compare against golden PDF for canonical test manuscripts).

### 4.3 Work plan (phased)

**Phase E1 — Baseline grid enforcement (8 hours)**
- Add a post-compile baseline-conformance check. Parse PDF text positions, verify each line's y-coordinate is on the grid.
- On non-conformance: emit detailed report (which lines, on which pages, off by how much).
- Threshold: 99% conformance required; below that = compile fail.
- File: extend `backend/src/typography-assurance.js`. New: `backend/src/baseline-conformance-pdf.js`.

**Phase E2 — Widow/orphan prevention (12 hours)**
- Implement re-flow logic: when a widow is detected, push the last line of the previous paragraph to the orphan column, or pull an extra line from the previous page.
- In Typst, this means generating a `#set par(orphan: ..., widow: ...)` directive AND running a second compile pass if the first produces violations.
- Acceptance: zero widows in a 200-page test manuscript.

**Phase E3 — Microtype refinement (6 hours)**
- Define a protrusion table per face: which characters hang into the margin, by how much. Standard practice: hyphens 50%, em-dashes 30%, quotes 100%.
- Apply via Typst's `#set text(features: ...)` per template.
- Test on the 15 existing templates.

**Phase E4 — Hyphenation control (8 hours)**
- Build a per-word exception list (`backend/typst-templates/hyphenation-exceptions.txt`) — common English compounds that hyphenate badly.
- Inject as Typst hyphenation hints at compile time.
- Add `<lang>` metadata to Pandoc invocation for language-aware breaks.

**Phase E5 — Wide-table handling (4 hours)**
- Detect tables wider than text frame post-compile (parse Pandoc output AST).
- Two strategies: auto-rotate the page to landscape for that table; or auto-shrink font to fit. User picks via template option.

**Phase E6 — Visual regression harness (16 hours)**
- Build a test corpus: 10 canonical manuscripts spanning template categories (academic thesis, novel, editorial journal, technical report, verse, exhibition catalog, KDP paperback, hardback novel, scientific monograph, design book).
- Compile each → canonical PDF stored in `backend/tests/golden-pdfs/`.
- On every engine change: re-compile corpus, compare each page as image diff against golden. Pixel diff threshold: 0.1%.
- File: `backend/tests/visual-regression.spec.js`. CI: run on every PR.

**Phase E7 — New template: 2-col editorial (12 hours)**
- New typst template: `editorial-2col.typ`. Mirrors `chronicle.typ` but with `#columns(2)` body.
- Specimen test: render a 40-page sample.

**Phase E8 — XMP metadata + archival info (4 hours)**
- Add full XMP block via Typst's metadata API: title, author, subject, keywords, copyright, creation date, modification date.
- Embed via PDF Info dict + XMP packet.

**Engine total: ~70 hours of focused engineering.**

### 4.4 Engine acceptance

The engine ships its overhaul when:
1. The 10-manuscript test corpus passes visual regression (≤0.1% pixel diff across all pages).
2. Baseline conformance ≥ 99% on every manuscript in the corpus.
3. Zero widows on the corpus (manual count if needed).
4. Hung punctuation visible in hand-reviewed sample.
5. The 2-col editorial template renders cleanly on its sample manuscript.
6. CI visual regression suite runs in < 10 min.

---

## 5. Sequencing

The work is too big to interleave. Phases:

### Phase 1 — Foundation (week 1)
- Tighten design tokens (`frontend/src/styles/tokens.css` or `tailwind.config.ts`).
- Add baseline-grid overlay dev tool.
- Sweep landing for math conformance (Section 3.6).
- **Output:** spacing/type tokens are canonical; landing is mathematically tight; rest of work has a known foundation.

### Phase 2 — Auth + Nav/Footer (week 1)
- Cheapest high-impact wins. Auth is what users see right after the marketing CTA; nav/footer are everywhere.
- Run in parallel with Phase 1 since they don't conflict.

### Phase 3 — Editor (weeks 2-3)
- The biggest and most valuable redesign.
- Sequenced after foundation so the editor inherits canonical tokens.

### Phase 4 — Docs + Journal (week 4)
- After editor; these are content surfaces that benefit from being designed alongside the editor's own preview area (consistency).

### Phase 5 — Pricing + Philosophy + Legal + Status (week 5)
- Audit/refinement passes. Likely a single week.

### Phase 6 — Engine overhaul (weeks 6-10)
- 70 hours of engine work. Distinct track. Can start in parallel with Phase 3 if a second person is available; otherwise sequential.
- Internal sub-phases: E1 (baseline grid) → E2 (widow/orphan) → E3 (microtype) → E4 (hyphenation) → E5 (wide tables) → E6 (visual regression) → E7 (new template) → E8 (XMP).

### Phase 7 — Polish + ship (week 11)
- Cross-browser, perf, a11y final passes.
- Final visual review with the Standing Council (`#3` Typography, `#11` Investor voice, `#8` Accessibility veto).

**Calendar: 11 weeks if done seriously by one person at ~10 useful hours/week. Compressible to 5-6 weeks if two people split engine + frontend.**

---

## 6. Acceptance for the program

The Rigor Program is complete when:
1. Every page in `frontend/src/app/(site)/*` and `frontend/src/app/app/*` passes the Section 2.6 checklist.
2. Engine PDF output passes Section 4.4 acceptance.
3. DESIGN.md is updated to reflect the canonical tokens (baseline-8, type scale, etc.).
4. A page-level grid overlay dev tool exists and is documented.
5. Standing Council #3 (Typography), #8 (Accessibility), #11 (Investor voice) sign off on the brand surfaces.
6. A representative cross-section of pages renders identically (within 0.1% pixel diff) before and after the Rigor Program for the audit-only surfaces (landing, philosophy, legal) — proving we didn't break the work we already shipped.

---

## 7. What this spec does NOT include

- **Marketing/copy work.** The voice/copy stays as-is unless a page rewrite demands it (some auth pages will need short editorial vignettes — those are content not code).
- **New features.** No new tiers, no new templates beyond E7 (2-col editorial), no new payment flows.
- **Backend non-engine work.** Compile orchestration changes only where engine targets demand it.
- **Migration to a new stack.** Staying on Next.js + Tailwind + Typst + Pandoc.

---

## 8. Risks

- **Scope creep.** "While we're in the editor, let's also add X." Mitigation: every change passes through this spec's acceptance criteria; new requests get their own spec.
- **Engine work blocking frontend work.** Mitigation: Phase 6 runs in parallel with Phase 3-5 if resources allow; otherwise frontend ships first.
- **Visual regression false positives.** Pixel diff is sensitive to font rendering and PDF metadata. Mitigation: 0.1% threshold is forgiving; manual review of failures.
- **Editor regression.** Redesigning the editor risks breaking compile flow. Mitigation: keep compile-pipeline logic untouched; pure presentational layer rewrite. Acceptance: 100% of existing editor functionality preserved.

---

## 9. Next steps

1. **User reviews this spec.** Spec must be approved before any implementation.
2. On approval: split into implementation plans (one per phase). Use `superpowers:writing-plans` for each.
3. Begin Phase 1 (foundation tokens + grid overlay tool).
4. Iterate.

End of spec.
