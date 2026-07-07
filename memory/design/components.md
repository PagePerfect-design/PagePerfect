# components.md

Component inventory and canonical patterns. This file tells you what already exists; `frontend/src/components/` is the source of truth for implementation.

## Shared primitives — `frontend/src/components/`

Used across `(site)` marketing pages and (where relevant) the editor.

| Component | File | Role |
|-----------|------|------|
| `Button` | `Button.tsx` | `variant: primary | secondary | ghost`, `size: sm | md | lg`, optional `href` to render as `<Link>` |
| `Container` | `Container.tsx` | Centered `.container-grid` wrapper (`max-w-7xl` + horizontal padding) |
| `Section` | `Section.tsx` | `variant: default | raised | light | dark`; sets `data-theme="light"` when light |
| `Providers` | `Providers.tsx` | Client provider wrapper (AuthProvider) |
| `CompositorMark` | `CompositorMark.tsx` | PagePerfect logo mark |
| `NavAuth` | `NavAuth.tsx` | Auth state in nav (sign in / user menu + tier badge) |
| `AuthorGuideTools` | `AuthorGuideTools.tsx` | Copy / download author guide buttons |
| `CopyCitation` | `CopyCitation.tsx` | "Copy citation" (secondary) + "Go to Editor" (primary red CTA) |
| `CookieConsent` | `CookieConsent.tsx` | Cookie consent banner |
| `Reveal` / `RevealGroup` | `Reveal.tsx` | Scroll-reveal wrappers; IntersectionObserver-driven; `prefers-reduced-motion`-aware |

### Rules for primitives

- Use the Swiss-Ogilvy specimen tokens only — see `tokens.md`. No ad-hoc hex, no ad-hoc spacing. If the token doesn't exist, propose it via `design-token`.
- Geometry: `border-radius: 0` on `(site)` and `[data-docs]` surfaces. The Tailwind `borderRadius.xl/2xl/3xl/pill` extensions exist for editor-only chrome.
- Focus rings visible — tested at AA contrast against cream `#FDFCF8` and against editor void `#050505`.
- Every interactive element has a keyboard path; modal focus traps tested.
- The single red `#FF3333` accent is reserved for the primary CTA on each surface. See `tokens.md` "Protected moments".

## Landing components — `frontend/src/components/landing/`

The `(site)/page.tsx` landing page composes these in order. Pure typography hero, no decorative imagery.

| Component | File | Role | Canon notes |
|-----------|------|------|-------------|
| `Hero` | `Hero.tsx` | Pure-typography hero — `clamp(3.5rem, 9vw, 7.5rem)` headline, mono kicker, technical bar (VERSION / OUTPUT / ENGINE) at bottom | No background image. No illustration. Let the type breathe. |
| `SocialProof` | `SocialProof.tsx` | Testimonials / social proof strip | Cream surface, mono labels, ink quote glyphs |
| `Comparison` | `Comparison.tsx` | Before/after interactive slider | Keyboard alternative required; ARIA labels on both panels |
| `TemplateGrid` | `TemplateGrid.tsx` | 15-template grid layout | White card + 1px solid `#111111` border; sharp geometry |
| `TemplateShowcase` | `TemplateShowcase.tsx` | Animated template cards | Hover lifts on `--t-card-hover` |
| `TemplateGallery` | `TemplateGallery.tsx` | Gallery view of templates | Same card canon |
| `Steps` (exports `HowItWorks`) | `Steps.tsx` | Three-step how-it-works walkthrough | Uses `Reveal` + `RevealGroup` with `staggerDelay={0.06}` |
| `WhyDifferent` | `WhyDifferent.tsx` | Feature callouts / differentiators | Editorial rows, mono section numbers |
| `Engineering` | `Engineering.tsx` | Technical details section — grid system, font registry, sandboxing | Instrument-precision tone; mono labels |
| `PricingPreview` | `PricingPreview.tsx` | Pricing cards for landing (Drafter / Publisher / Studio) | White card + black border; red CTA on the recommended tier |
| `FinalCTA` | `FinalCTA.tsx` | Closing call-to-action | Red `#FF3333` button — the contrast trigger |
| `Reveal` (re-export) | `Reveal.tsx` | Re-exports `Reveal` / `RevealGroup` from `@/components/Reveal` | Convenience import |
| `SectionTransition` | `SectionTransition.tsx` | Stark black border transitions between sections | No gradients |
| `LevitatingCard` | `LevitatingCard.tsx` | Subtle hover-levitation effect | Reduced-motion: no levitate |
| `HeroImage` | `HeroImage.tsx` | Legacy animated hero image — **unused**; typography dominates |  |
| `RequestFormatCard` | `RequestFormatCard.tsx` | Template-request submission card | Card canon |

### Rules for landing components

- Never introduce decorative imagery without empirical justification. Type breathes; imagery earns its place. See `projects/pageperfect/DESIGN.md` principle #1.
- Cards: `background: #ffffff; border: 1px solid #111111;` — white with strict black border. No grey background fills. No rounded corners.
- Section labels in mono uppercase ≥ 0.1em letter-spacing (e.g., "01 GETTING STARTED").
- The technical bar on the homepage (VERSION / OUTPUT / ENGINE) is part of the canon — positions the product as a precision instrument.
- All section transitions use stark black borders (`#111111`), not gradients.

## Editor components — `frontend/src/components/editor/`

Full-screen editor at `/app`. Same cream-on-ink specimen as `(site)` (Rigor §3.1, 2026-05-17) — one continuous monograph from landing through editor. Uses additional primitives (Tooltip via `createPortal`).

Live components (2026-07-06 — seven dead components deleted: TopBar, FloatingHUD, LaunchOverlay, IngestZone, PublishingSystems, TemplateNotes, TemplateHelp; CompileShell renders its own inline top bar; export flow lives in ControlStrip):

| Component | File | Role |
|-----------|------|------|
| `CompileShell` | `CompileShell.tsx` | Main editor container — inline top bar, composes everything else |
| `ControlStrip` | `ControlStrip.tsx` | Template / page-size / margin-preset controls + export flow (preflight, grade-D acknowledgment) |
| `PreviewPane` | `PreviewPane.tsx` | Live PDF/SVG preview with `shadow-paper`; quality warning banner for C (amber) / D (red) |
| `PortalStage` | `PortalStage.tsx` | First-run ingest + template-picker stage |
| `ImageUpload` | `ImageUpload.tsx` | Image asset upload |
| `ManuscriptBrowser` | `ManuscriptBrowser.tsx` | Saved-manuscript list (modal dialog) |
| `RichTextEditor` | `RichTextEditor.tsx` | Tiptap rich-text editor surface (`immediatelyRender: false` — SSR guard) |
| `TemplateCard` | `TemplateCard.tsx` | Template card for the picker — type specimen preview |
| `StatusBar` | `StatusBar.tsx` | Bottom status bar |
| `Tooltip` | `Tooltip.tsx` | Portal-rendered tooltip primitive |
| `useCompileQueue` | `useCompileQueue.ts` | Compile queue hook (submit → poll → PDF blob → SVG pages) |
| `SetEditorBodyAttr` | `SetEditorBodyAttr.tsx` | Sets `data-editor` body attribute for editor scope |

### Rules for editor components

- Cream specimen — `bg-[#FDFCF8]` body; white cards with `#e5e5e0` hairlines; sharp geometry.
- Three-tier ink (Design Council 2026-07-06): primary text/controls `#111111`; labels/help/metadata/functional icons `#555555` (NOT 50% ink — sub-AA on cream); hairlines-only `#e5e5e0`.
- One red per screen: red `#FF3333` marks the Export/Download CTA and errors only. Selected/active states use the ink pattern (`border-[#111111] bg-[#111111]/[0.03]`). Small red text uses `#E52222` (AA).
- Status trio: pass `emerald-700` / warn `amber-700` / fail `#E52222` — always paired with a text or glyph cue.
- Quality grades (A/B/C/D) pair color with the letter glyph — not color alone. Grade D requires explicit checkbox acknowledgment (in ControlStrip's export section) before download enables.
- Compile status / queue position / error states use `aria-live="polite"`.
- Reduced motion: universal cap lives in `globals-motion.css` — no per-instance `motion-reduce:` classes needed.

## CSS utility surfaces (from `globals.css`)

These are not components but pattern utilities used by components. Full list in `projects/pageperfect/DESIGN.md` → CSS Utility Classes.

- `.btn-pill` / `.btn-primary` / `.btn-secondary` / `.btn-ghost` — button base + variants
- `.card` — surface container (white + black border in `(site)` / `[data-docs]`, dark in editor)
- `.container-grid` — centered max-width wrapper
- `.bg-noise` — fixed SVG noise overlay (0.03 opacity)
- `.divider` / `.colophon` — hairlines and border strips
- `.h1` / `.h2` / `.h3` / `.p` — responsive type helpers
- `.label-mono` / `.caption` — mono uppercase label, mono caption
- `.skip-link` — accessibility skip-to-content link
- `.docs-sidebar` / `.docs-table` / `.docs-admonition` / `.docs-template-card` / `.docs-badge` — docs-scope utilities
- `.journal-card` / `.journal-article` / `.journal-drop-cap` / `.journal-subhead` / `.journal-header` — journal-scope utilities

## Adding a new component

Design skill handoff flow:

1. `design-component` emits a spec (TSX sketch, props API, states, tokens used, test strategy).
2. Council review — #7 Visual designer, #15 Staff engineer, #8 Accessibility (**veto**). If the component carries a typographic-quality claim or affects template rendering, the Typography Council (#3 + #31 + #32) reviews too.
3. User approves the spec.
4. Engineering picks it up via `build-feature` — lands it in `frontend/src/components/` (shared) or `frontend/src/components/landing/` / `frontend/src/components/editor/` (scoped).
5. Tests ship with the component <!-- TODO: STATUS.md flags zero `.test.tsx` files across 73 frontend components; framework decision (Vitest? Playwright component testing? RTL?) pending. -->.

## Deprecations / banned

- **Glass morphism / liquid glass / blob backgrounds** — off-brand entirely. See `tokens.md` retired list.
- **Vanta / Three.js / WebGL backgrounds** on any surface — perf cost not justified.
- **Generic SaaS palette** (`bg-slate-*`, `bg-gray-*`, `bg-neutral-*`) as default — use the specimen tokens.
- **Rounded corners as default** on `(site)` / `[data-docs]` — geometry is sharp.
- **Decorative blue or purple** — we have one accent: red `#FF3333`.
- **Soft drop shadows on every card** — shadows are functional (see `tokens.md` Shadows table); decorative shadows don't ship.

If you encounter `Ledger`, `Glass`, `paper-card-raised`, `oxblood`, `deckle-top`, `font-fraunces`, `ChainLogoCarousel`, `RiskBadge`, or any other AG-canon residue in this repo, it's pre-rescope debt and needs migrating.

## Where to look first

- Canon question? `projects/pageperfect/DESIGN.md`.
- Token question? `tokens.md` in this folder, then `frontend/tailwind.config.ts` / `frontend/src/app/globals.css`.
- Motion / animation? `motion.md`.
- Accessibility? `accessibility.md`.
- Perf budget? `performance-budget.md`.
- Tone / bold-design framing? `bold-design-principles.md`.

## Changelog

- 2026-05-14: Rescoped from upstream master-build-kit "Ledger / Glass" component canon (Hero with compass watermark, CTABand, ChainLogoCarousel, StatisticsSection, FeaturesPreview, Testimonials, RiskBadge, ChainBadge, Card glass variants) to PagePerfect's actual components. Inventoried shared primitives, landing components (16), and editor components (24). Replaced AG seat names (Maren, Kael, Noor) with Standing Council seats (#7, #8 veto, #15, Typography Council). Flagged STATUS.md gap on frontend tests.
