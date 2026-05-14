# imagery.md — Specimen canon + photoreal canon + prompt library

PagePerfect's marketing imagery has two modes. **Specimen / book-craft photography** is the default for hero surfaces, feature blocks, and editorial motifs. **Line-art diagrams** are used for explainers, technical bars, and process illustrations. Photoreal blog headers are a third, narrower mode.

Read `memory/design/bold-design-principles.md` before drafting any image — it names the tone vocabulary, the anti-AI-generic patterns, and the colour discipline this file builds on.

Council gates live at `memory/PROCESS.md` — #25 AI image director, #26 Visual brand photographer, #27 photorealism, #28 brand systems, #29 Art Director (effective veto on set cohesion), #8 Accessibility (VETO), Design Council (Visual / Systems / Accessibility).

Typographic-quality claims in alt text or captions additionally pass the Typography Council (#3 + #31 + #32).

## Standing rules

1. **Editorial / Swiss-Ogilvy specimen, not stock.** Bold cropping. Generous whitespace. No filler. No shutterstock generics.
2. **Book-craft subjects only.** Paper grain, ink, typography specimens, baseline rules, printer's marks, book stacks, signature folds, trim edges. NOT screens. NOT laptops. NOT abstract data visualisations.
3. **Palette is closed.** Cream + ink + a single deliberate accent (oxblood / red / amber). No introducing new hues. See palette block below.
4. **Hairline strokes only for line-art.** 1.5px primary, 2px protected accents, `strokeLinecap="round"`, `strokeLinejoin="round"`, `fill="none"` unless filling a paper surface.
5. **Every asset has alt text.** No meaning conveyed by colour alone. #8 Accessibility veto.
6. **Set cohesion beats per-image cleverness.** #29 Art Director rejects any asset that breaks the set's background, materiality, lighting direction, or colour grade.
7. **No AI-generic patterns.** No glassmorphism, no purple gradients, no rounded blobs, no 3D illustration. See `memory/design/bold-design-principles.md` Anti-AI-Generic Framing.

## Subject library (specimen / book-craft photography)

Approved subjects, in roughly the order they map to PagePerfect's surfaces:

- Open book, two-page spread, baseline grid visible, raking light.
- Stack of trim-cut paperbacks, spines or fore-edges to camera.
- Single book on cream paper surface, dust jacket removed.
- Sheet of cold-press or laid paper, close-crop showing fibre.
- Letterpress proof, ink still wet, registration marks visible.
- Type specimen sheet (numeric scale, baseline rules, hairline rules).
- Pencil + galley proof, margin marks visible.
- Printer's signature, folded but uncut.
- Linen-bound hardcover, blind-debossed cover detail.
- Loose-leaf manuscript pages, lightly fanned.

**Subjects to refuse:**

- Laptops, phones, screens of any kind.
- People (hands, faces, silhouettes).
- Office desks, post-it notes, sticky-tab dashboards.
- Stock-style "creative entrepreneur at coffee shop" framings.
- Anything blockchain / crypto / wallet / chain-adjacent (off-brand and off-product).

## Palette (all hex values AA on paper `#F7F5F0`)

- Paper surface — `#F7F5F0`
- Paper sub — `#EFECE3`
- Paper deep — `#E6E2D5`
- Ink body — `#141210`
- Oxblood (single inverse beat only) — `#2D0A0A`
- Amber accent — `#F59E0B`
- Amber deep (AA on paper) — `#854F08`
- Red accent — `#DC2626`
- Crimson paper (AA, protected headline word) — `#B3151F`
- Ink blue — `#0B2545`
- Hairline rule — `rgba(15, 17, 21, 0.14)`

## Line-art canon

### Stroke convention

- `stroke="currentColor"` — the icon inherits ink colour from its container.
- `strokeWidth="1.5"` for primary strokes; `strokeWidth="2"` for protected accents (baseline rule, bracket, warning bar).
- `strokeLinecap="round"` and `strokeLinejoin="round"` everywhere.
- `fill="none"` unless filling a paper-surface interior.

### Size grid

| Use | viewBox | Rendered size |
|---|---|---|
| Compact icon | 72×72 | 56×56 |
| Featured icon | 72×72 | 72×72 |
| Featured diagram | 200×200 | 120×120 |
| Hero watermark | 400×400 | 400×400 at opacity 0.14 |

### Diagram subjects (approved)

- Compile pipeline (Markdown → LaTeX → PDF) as a three-stage flow.
- Page anatomy (trim, bleed, gutter, margin, baseline) — accuracy gated by Typography Council.
- Template comparison (novel / non-fiction / academic / workbook silhouettes).
- KDP / IngramSpark / Lulu output destinations, abstracted as parcels or page bundles — not logos unless explicitly licensed.

### Bundle budget (enforced at code review)

- Icon SVG < 6KB gzipped.
- Hero illustration SVG < 20KB gzipped.
- Inline the SVG in JSX — do not add separate `.svg` asset files unless reused across three or more components.

### Motion

- Respect `prefers-reduced-motion`. No autoplaying animation on imagery.
- See `memory/design/motion.md` for the canonical motion policy.

## Photoreal canon

Used for blog header images only. Pipeline already exists.

- **Tooling**: `scripts/generate-blog-images.py`.
- **Model**: Runware API. <!-- TODO: verify current model handle — was `google:2@1` (Nano Banana 2) at last reference; confirm before next render. -->
- **Dimensions**: 1408×768, `.webp`.
- **Prompt rules** (enforced by #27 + #28):
  - Concrete subject from the approved subject library above.
  - Warm amber + cream tones. Cream or ivory surface.
  - Max 30 words.
  - Editorial product photography, not stock.
  - Shallow depth of field, soft studio light unless the subject calls for directional (e.g. letterpress raking light).
- **Negative prompts** (append to every call): `no hands, no faces, no text, no logos, no reflections of cameras, no neon, no cyberpunk, no meme, no screens, no laptops, no phones`.

Skills do not call Runware directly. They append entries to the prompt library below; the user runs the script to render.

## Prompt library

Columns: `Date | Asset | Mode | Subject | Prompt | Negative | Rendered path | Alt text`.

| Date | Asset | Mode | Subject | Prompt | Negative | Rendered path | Alt text |
|------|-------|------|---------|--------|----------|---------------|----------|
| <!-- seeded empty; image-direction skill appends --> | | | | | | | |

## Changelog

- 2026-05-14: Rescoped from AG segments / crypto regs / EF-style ecosystems to PagePerfect publishing market (KDP / IngramSpark / Lulu / indie author segments). Crypto regs and chain ecosystems removed entirely.
