# tokens.md

Token summary for PagePerfect's **Swiss-Ogilvy specimen** system. Canonical values live in `frontend/tailwind.config.ts` + `frontend/src/app/globals.css`. This file is the reminder + Council floors, not the source of truth.

## The specimen canon (every PagePerfect surface)

**Use where:** every `(site)` surface — landing, journal, docs, pricing, status, auth pages — **and the editor (`/app`)** as of 2026-05-17. The editor adopted the specimen palette so the brand is one continuous monograph from landing through editor. The dark `--void` / `--surface` tokens (see Editor dark mode below) remain as opt-in tokens for an upcoming dark-mode toggle. There is no third "marketing-only" or "Glass" canon.

### Surface tokens — `(site)` cream-on-ink specimen

| Token | Hex | Usage |
|-------|-----|-------|
| Background (cream) | `#FDFCF8` | Default page surface for all `(site)` pages — the warm cream specimen base |
| Ink | `#111111` | Headlines, borders, primary text, nav links |
| Body | `#333333` – `#3a3a3a` | Paragraph copy |
| Secondary | `#444444` – `#555555` | Descriptions, metadata, captions |
| Labels | `#555555` | Section numbers, kickers, mono labels. (`rgba(17,17,17,0.5)` retired for functional text 2026-07-06 — it blends to ~3.5:1 on cream, sub-AA; decorative/aria-hidden or ≥18px display furniture only) |
| Border | `#111111` | Section separators, card borders, table rules |
| Border subtle | `#e5e5e0` | Hairlines, inner dividers |
| Surface | `#f5f5f0` | Sidebar backgrounds, subtle fills |

### Surface tokens — Editor dark mode (opt-in, future)

The editor's **default** canon is the same cream-on-ink specimen as `(site)` (decided 2026-05-17 per Rigor Program §3.1: the brand is one monograph). The tokens below remain available as a future opt-in dark mode, but are NOT applied by default. Don't add new `bg-[--void]` / `bg-[--surface]` usages to the editor without a flag-gated context.

| Token (`globals.css`) | Hex | Usage |
|-----------------------|-----|-------|
| `--void` | `#050505` | Opt-in dark-mode `<body>` background |
| `--surface` | `#0a0a0a` | Opt-in dark-mode editor surfaces |
| `--surface-raised` | `#111111` | Opt-in dark-mode raised panels, cards |
| `--surface-overlay` | `#1a1a1a` | Opt-in dark-mode modals, tooltips, overlays |
| `--surface-subtle` | `#222222` | Opt-in dark-mode subtle inset blocks |
| `--text-primary` | `#f2f2f0` | Opt-in dark-mode primary text (warm white) |
| `--text-secondary` | `#a8a8a0` | Opt-in dark-mode secondary |
| `--text-tertiary` | `#6a6a64` | Opt-in dark-mode tertiary |

### Accent — Printer's Red (single accent across canons)

| Token | Hex | Usage |
|-------|-----|-------|
| Primary CTA | `#FF3333` | The ONE high-value action per surface ("Start Formatting", "Go to Editor") |
| Accent hover | `#E52222` | Hover state |
| Accent muted | `#3a1010` | Muted accent (editor) |

Red is reserved. It never decorates. It never marks a utility action. It is the contrast trigger from Ogilvy's playbook — see `projects/pageperfect/DESIGN.md` principle #3.

### Type families

| Token | Family | Usage |
|-------|--------|-------|
| `--font-display` / `font-display` | **Inter Tight** (400–800) | Headings, nav, UI labels, uppercase tracking |
| `--font-body` / `font-body` | **Source Serif 4** | Body text, paragraphs, journal articles |
| `--font-mono` / `font-mono` | **IBM Plex Mono** (400, 600) | Code, status labels, section numbers, metadata |

Loaded via `next/font/google` in `frontend/src/app/layout.tsx`. Three families — no expansion without a Typography Council pass (#3 + #31 + #32).

### Responsive type scale (`tailwind.config.ts` → `fontSize`)

- `hero` — `clamp(3.5rem, 9vw, 7.5rem)` — landing hero only
- `display-lg` — `clamp(2.5rem, 6vw, 5.5rem)` — large editorial display
- `h1` — `clamp(2rem, 3.5vw, 3.5rem)` — page headlines
- `h2` — `clamp(1.5rem, 2.5vw, 2.5rem)` — section headlines
- `h3` — `clamp(1.25rem, 1.8vw, 1.5rem)` — subsections
- `editorial-body` — `1.125rem` — journal article body
- `editorial-caption` — `0.6875rem` — figure captions
- `hero-sub` — `clamp(1.125rem, 1.8vw, 1.5rem)` — hero subhead

### Typographic conventions (every uppercase string)

- Section labels: `font-mono text-[0.625rem] uppercase tracking-[0.15em]` (e.g., "01 GETTING STARTED", "VOL. I")
- Nav links: `font-mono text-[10px] uppercase tracking-[0.12em]`
- Buttons: `font-mono text-[10px]` or `text-[11px] uppercase tracking-[0.1em]`
- All uppercase ≥ 0.1em letter-spacing — non-negotiable

### Geometry

- `border-radius: 0` for buttons, cards, inputs, containers in `(site)` and `[data-docs]` scopes — sharp rectangles only.
- The editor app may use rounded corners on transient chrome (toasts, popovers) but not on primary surfaces. See `components.md`.
- The legacy Tailwind `borderRadius` extensions (`xl`, `2xl`, `3xl`, `pill`) exist in `tailwind.config.ts` for editor-only chrome. Do not apply them on `(site)` surfaces.

### Shadows

| Token | Purpose |
|-------|---------|
| `shadow-card` / `shadow-card-hover` | Editor card elevation |
| `shadow-elevated` | Modals, overlays |
| `shadow-paper` / `shadow-paper-hover` | Skeuomorphic PDF preview — the paper artifact |
| `shadow-editorial` / `shadow-editorial-hover` | Clean drop shadows on editorial cards |
| `shadow-inner-subtle` | Inset shadow |

Shadows are functional only. No glow, no neon, no colored bleed. The `shadow-paper` is intentional skeuomorphism — it's a paper artifact representing a real PDF.

### Motion tokens (`globals.css`)

| Token | Value | Usage |
|-------|-------|-------|
| `--t-instant` | `100ms` | Hover, focus, micro-interaction |
| `--t-fast` | `200ms` | Single-element entrance |
| `--t-medium` | `350ms` | Choreographed sequences |
| `--t-slow` | `600ms` | Signature moments (rare) |
| `--t-card-hover` | `250ms` | Card hover transition |
| `--ease-pp` | `cubic-bezier(0.25, 0.4, 0.25, 1)` | Default easing |
| `--ease-pp-dramatic` | `cubic-bezier(0.22, 0.61, 0.36, 1)` | Signature reveals |

See `motion.md` for the choreography contract.

## Protected moments (never change without Council + operator approval)

- **Red `#FF3333` as the single accent.** It is the primary CTA color, period. Never a hover decoration. Never a status color. Never a utility action.
- **Cream `#FDFCF8` as the only `(site)` background.** No grey panels, no white blocks. Use `#ffffff` only inside cards with a strict `#111111` border, per `components.md`.
- **The typography trinity** — Inter Tight + Source Serif 4 + IBM Plex Mono. No expansion without Typography Council sign-off.
- **`border-radius: 0` on `(site)` and `[data-docs]`** — sharp geometry is the canon.

## Retired / banned

- Generic SaaS palettes — slate-, gray-, neutral-, primary-, secondary-* scales as ad-hoc utilities.
- "Glass morphism" / liquid glass / blob backgrounds — off-brand entirely.
- Decorative blue or purple — we have one accent: red.
- Vanta / WebGL / Three.js backgrounds — perf cost not justified.
- Soft drop shadows on every card — see Material Honesty in `bold-design-principles.md`.
- `bg-white` as a section background — use `#FDFCF8` cream or `#ffffff` only inside a black-bordered card.

If you encounter `ens-*`, glass utilities, or AG-canon residue (oxblood, paper-deep, Fraunces, JetBrains Mono, Ledger rule, deckle-top), that code predates the PagePerfect rescope and needs migrating.

## Contrast + accessibility floors (#8 Accessibility — veto)

- Body copy on cream `#FDFCF8`: `#333333` minimum (≥ 12.6:1 — AAA).
- Labels / metadata: `#555555` minimum (≥ 7.5:1 — AAA).
- Never `#999` or lighter for functional text — fails WCAG and Swiss clarity standards. See `projects/pageperfect/DESIGN.md` principle #5 (the color floor).
- Interactive elements: AA minimum on focus ring + text; AAA preferred on primary CTAs.
- Error text: ensure red `#FF3333` holds AA on its container surface.
- No color-only meaning. Every color-coded signal has a second cue (icon, label, pattern).

See `accessibility.md` for the full contract.

## Performance floors (#17 Performance engineer)

Full budget in `performance-budget.md`. Token-level notes:

- Icons inline as JSX SVG. Import from a library only if reused in ≥3 components.
- Fonts: three families only (Inter Tight, Source Serif 4, IBM Plex Mono). Subset where possible.
- `.bg-noise` is an inline SVG noise overlay at 0.03 opacity — do not swap for a PNG.
- No WebGL, no canvas-heavy effects on any `(site)` surface.

## Proposing a new token

Every new token goes through the `design-token` skill. The proposal carries:

- Name + proposed value (in `tailwind.config.ts` and/or `globals.css`)
- Surface(s) + use case
- Contrast check at all sizes (against cream and against ink)
- Canon fit (Swiss-Ogilvy specimen — there is no other canon)
- Replaces what (if anything)
- Migration plan for existing usage

Council review: #7 Visual designer, #15 Staff engineer, #8 Accessibility (**veto**). If approved, the token ships in `tailwind.config.ts` / `globals.css` and this file is updated. Ad-hoc hex values do not ship.

## Canonical sources

- `frontend/tailwind.config.ts` — authoritative type, color, shadow, animation tokens.
- `frontend/src/app/globals.css` — authoritative CSS variables, utilities, motion tokens.
- `projects/pageperfect/DESIGN.md` — design philosophy, 5 core principles, page-specific rules.
- `memory/design/bold-design-principles.md` — tone vocabulary, 6 design principles, anti-AI-generic framing.

## Changelog

- 2026-05-14: Rescoped from upstream master-build-kit "Ledger" canon to PagePerfect's actual Swiss-Ogilvy specimen system (cream `#FDFCF8` / ink `#111111` / red `#FF3333`, Inter Tight / Source Serif 4 / IBM Plex Mono). Removed Glass canon references, oxblood/paper-deep tokens, Fraunces, Maren/Kael/Noor seat names. Adopted PagePerfect Standing Council seat numbers (#7, #8, #15, #17).
