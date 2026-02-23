# CLAUDE.md — PagePerfect

## Project Overview

PagePerfect is a PDF generation system that converts Markdown manuscripts to professionally typeset PDFs using LuaLaTeX. It implements Josef Müller-Brockmann's grid system principles (baseline grids, golden-ratio typography, proportional spacing). The app is a loosely-coupled monorepo with a React/Next.js frontend and a Node.js/Express backend.

The product targets authors, academics, and publishers who need professional typesetting without the complexity of InDesign or the limitations of consumer tools like Vellum (Mac-only, $500) or Atticus ($147, limited typography). PagePerfect undercuts all competitors with a free tier and a $199 lifetime option.

## Repository Structure

```
PagePerfect/
├── frontend/                  # Next.js 15 React app (TypeScript)
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx           # Root layout — fonts, metadata, Providers, noise overlay
│   │   │   ├── globals.css          # Swiss-Ogilvy design system — tokens, utilities, docs/journal themes
│   │   │   ├── favicon.ico
│   │   │   ├── page.module.css      # Legacy (unused) — left over from create-next-app
│   │   │   │
│   │   │   ├── (site)/              # Route group — marketing pages with Nav + Footer
│   │   │   │   ├── layout.tsx       # Site layout (Nav, Footer, skip-link)
│   │   │   │   ├── page.tsx         # Landing page (/) — hero, comparison, templates, CTA
│   │   │   │   ├── page.module.css  # Legacy (unused)
│   │   │   │   ├── auth/
│   │   │   │   │   ├── login/page.tsx           # Sign in / sign up (email + OAuth)
│   │   │   │   │   ├── forgot-password/page.tsx # Request password reset
│   │   │   │   │   ├── reset-password/page.tsx  # Set new password
│   │   │   │   │   └── callback/route.ts        # OAuth fallback redirect
│   │   │   │   ├── docs/
│   │   │   │   │   ├── page.tsx             # Documentation hub
│   │   │   │   │   ├── DocsNav.tsx          # Sidebar navigation for docs
│   │   │   │   │   └── RequirementsCheck.tsx # Automated health/compile diagnostics
│   │   │   │   ├── journal/
│   │   │   │   │   ├── page.tsx             # Journal index — "Typography & Conversion"
│   │   │   │   │   ├── articles.ts          # Re-export barrel
│   │   │   │   │   ├── articles-1.ts        # Article content (10+ essays)
│   │   │   │   │   └── [slug]/page.tsx      # Individual article pages (SSG)
│   │   │   │   ├── pricing/
│   │   │   │   │   ├── layout.tsx           # Pricing-specific layout wrapper
│   │   │   │   │   └── page.tsx             # 3-tier pricing with FAQ
│   │   │   │   └── status/
│   │   │   │       ├── page.tsx             # Server-rendered status shell
│   │   │   │       └── StatusClient.tsx     # Client-side connectivity diagnostics
│   │   │   │
│   │   │   └── app/                 # Editor (/app) — full-screen, no Nav/Footer
│   │   │       ├── layout.tsx             # Editor layout (full-screen, no footer)
│   │   │       ├── page.tsx               # Editor page wrapper
│   │   │       ├── CompileShell.tsx       # Main editor component
│   │   │       ├── TemplateHelp.tsx       # Template help tooltip
│   │   │       ├── TemplateNotes.tsx      # Template-specific usage notes
│   │   │       ├── PublishingSystems.tsx   # Publishing system comparison
│   │   │       ├── authorGuide.ts         # Author guide content
│   │   │       └── sample.ts              # Sample manuscript
│   │   │
│   │   ├── lib/
│   │   │   ├── supabase.ts          # PocketBase client factory (legacy filename)
│   │   │   ├── auth-context.tsx      # AuthProvider context (PocketBase auth)
│   │   │   ├── database.types.ts     # PocketBase collection types
│   │   │   └── stripe.ts            # Stripe.js loader + createPayment helper
│   │   │
│   │   └── components/
│   │       ├── Button.tsx            # primary/secondary/ghost × sm/md/lg
│   │       ├── Container.tsx         # container-grid centered wrapper
│   │       ├── Section.tsx           # default/raised/light/dark page sections
│   │       ├── Providers.tsx         # Client provider wrapper (AuthProvider)
│   │       ├── CompositorMark.tsx    # PagePerfect logo mark
│   │       ├── NavAuth.tsx           # Auth state in nav (sign in / user menu + tier badge)
│   │       ├── AuthorGuideTools.tsx  # Copy/download author guide (secondary buttons)
│   │       ├── CopyCitation.tsx      # Copy citation (secondary) + Go to Editor (primary red CTA)
│   │       └── landing/             # Landing page components
│   │           ├── Hero.tsx          # Hero section — pure typography, no background image
│   │           ├── HeroImage.tsx     # Legacy animated hero image (unused — typography dominates)
│   │           ├── Comparison.tsx    # Before/after interactive slider
│   │           ├── TemplateShowcase.tsx  # Animated template cards
│   │           ├── TemplateGallery.tsx   # Template gallery view
│   │           ├── TemplateGrid.tsx      # Template grid layout
│   │           ├── Steps.tsx         # How-it-works walkthrough
│   │           ├── WhyDifferent.tsx  # Feature callouts
│   │           ├── SocialProof.tsx   # Testimonials
│   │           ├── Engineering.tsx   # Technical details section
│   │           ├── PricingPreview.tsx # Pricing cards for landing
│   │           ├── FinalCTA.tsx      # Final call-to-action
│   │           ├── Reveal.tsx        # Scroll-reveal animation wrapper
│   │           ├── SectionTransition.tsx # Visual section transitions
│   │           └── LevitatingCard.tsx   # Hover levitation effect
│   │
│   ├── public/                # Static assets, PWA manifest, icons
│   ├── .env.example           # Environment variable template
│   ├── tailwind.config.ts     # Swiss-Ogilvy design tokens (colors, shadows, animations)
│   ├── next.config.ts         # API rewrites to backend via API_BASE_URL
│   ├── eslint.config.mjs      # ESLint flat config (next/core-web-vitals)
│   └── tsconfig.json          # Strict mode, @/* path alias
│
├── backend/                   # Express 5 API (JavaScript, CommonJS)
│   ├── index.js               # Server, 30+ routes, BullMQ queue setup, Stripe webhooks
│   ├── compile-worker.js      # BullMQ job processor — Pandoc spawn, sandboxing, watermark
│   ├── compile-utils.js       # Stderr sanitization, path stripping, compile helpers
│   ├── grid-system.js         # GridSystem class (margins, typography, LaTeX)
│   ├── publishing.js          # Pre-flight validation, cover dimensions, PDF/X-1a
│   ├── lulu.js                # Lulu xPress API client (print-on-demand)
│   ├── platform-compliance.js # KDP, IngramSpark, Lulu, offset print specs
│   ├── book-engineering.js    # Widows/orphans, hyphenation, float placement, compile log analysis
│   ├── manuscript-structure.js # Front/body/back matter standardization
│   ├── references-system.js   # Citation validation, BibTeX parsing
│   ├── figures-system.js      # Image pipeline, DPI validation, asset checks
│   ├── typography-assurance.js # Baseline grid conformance, typographic scoring (0–100)
│   ├── multilingual.js        # RTL, Arabic shaping, CJK, Devanagari support
│   ├── print-qa.js            # Ink coverage, contrast, DPI, reverse type checks (0–100)
│   ├── provenance.js          # Build metadata, versioning, reproducible builds
│   ├── template-extensions.js # Governed extension tokens for template customization
│   ├── latex-sanitizer.js     # LaTeX injection detection (14 patterns), input escaping
│   ├── text-normalizer.js     # Remote image stripping, template-aware text normalization
│   ├── watermark.js           # TikZ-based watermark overlay (Müller-Brockmann design)
│   ├── heading-variants.js    # Classic/Modern/Bold heading variant preambles
│   ├── font-availability.js   # Font registry and fallback resolution
│   ├── logger.js              # Structured logging utility
│   ├── pdfx-def.ps            # PostScript preamble for Ghostscript PDF/X-1a conversion
│   ├── routes/                # Express route modules (extracted from index.js)
│   │   ├── health.js          # Health, templates, font status, root
│   │   ├── stripe.js          # Webhook + payment creation
│   │   ├── compile.js         # Compile, status, result, convert, batch, font upload
│   │   ├── analysis.js        # 13 manuscript analysis endpoints
│   │   ├── publishing.js      # KDP spine/gutter, preflight, cover dimensions
│   │   ├── lulu.js            # Lulu print-on-demand API
│   │   └── contact.js         # Contact form (Resend email)
│   ├── filters/               # Pandoc Lua filters
│   │   ├── drop-cap.lua       # Drop-cap formatting for fiction/literary templates
│   │   ├── fountain.lua       # Screenplay formatting (Fountain syntax)
│   │   └── table-safety.lua   # Table rendering safety for multi-column templates
│   ├── tests/                 # Jest test suite
│   │   ├── grid-system.test.js    # GridSystem: all 19 page sizes × 7 margin presets
│   │   ├── latex-sanitizer.test.js # Injection detection, escaping, font/color validation
│   │   ├── compile-utils.test.js   # Compile utility functions
│   │   └── logger.test.js          # Logger tests
│   ├── templates/             # 15 LaTeX templates
│   │   ├── chicago.latex      # Academic (12pt baseline)
│   │   ├── symphony.latex     # Classic academic
│   │   ├── thesis.latex       # Dissertation format
│   │   ├── minimal.latex      # BasicTeX-compatible
│   │   ├── paperback.latex    # Trade fiction/nonfiction (11pt baseline)
│   │   ├── memoir.latex       # Personal narrative
│   │   ├── exhibit.latex      # Modern trade design
│   │   ├── heirloom.latex     # Cookbook/recipe format
│   │   ├── verse.latex        # Poetry collection
│   │   ├── chronicle.latex    # Editorial multi-column
│   │   ├── international.latex # Editorial international
│   │   ├── operator.latex     # Technical documentation
│   │   ├── matrix.latex       # Corporate structured
│   │   ├── avantgarde.latex   # Experimental creative
│   │   └── cinema.latex       # Screenplay format
│   ├── references/            # Sample .bib for citations
│   ├── .env.example           # Environment variable template
│   ├── Dockerfile             # Ubuntu 22.04, Node 18, Pandoc, texlive-luatex, Ghostscript
│   └── package.json
│
├── CLAUDE.md                  # This file
├── VIABILITY_ASSESSMENT.md    # Evidence-based viability counter-analysis
├── README.md
├── GRID_SYSTEM.md             # Grid system design documentation
├── GIT_WORKFLOW.md            # Branching & commit conventions
└── QUICK_GIT.md               # Daily git command reference
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend framework | Next.js 15 (React 19, App Router) |
| Frontend language | TypeScript 5 (strict mode) |
| Styling | Tailwind CSS 3.4 with Swiss-Ogilvy design tokens |
| Build tool | Turbopack (via Next.js) |
| Linting | ESLint 9 (next/core-web-vitals, next/typescript) |
| Backend framework | Express 5.1 |
| Backend language | JavaScript (CommonJS) |
| PDF engine | Pandoc + LuaLaTeX |
| PDF/X conversion | Ghostscript (for IngramSpark/offset compliance) |
| Containerization | Docker (Ubuntu 22.04) |
| Auth & database | PocketBase (self-hosted via Coolify) |
| Payments | Stripe (Payment Element flow) |
| Print-on-demand | Lulu xPress API |
| Email | Resend |
| Frontend hosting | Vercel |
| Backend hosting | Coolify (Docker on Digital Ocean) |

## Common Commands

### Frontend (`frontend/`)

```bash
npm run dev       # Dev server with Turbopack (port 3000)
npm run build     # Production build
npm start         # Start production server
npm run lint      # Run ESLint
```

### Backend (`backend/`)

```bash
npm run dev            # Nodemon watch mode (port 4000)
npm start              # Production server
npm run docker:build   # Build Docker image
npm run docker:run     # Run Docker container on port 4000
```

### Development Setup

Run both in separate terminals:

```bash
# Terminal 1
cd backend && npm install && npm run dev

# Terminal 2
cd frontend && npm install && npm run dev
```

The frontend proxies `/api/*` to the backend via Next.js rewrites (configured in `next.config.ts`). In local dev this defaults to `http://localhost:4000`. In production, set `API_BASE_URL` on Vercel to point to the Coolify-hosted backend.

## Architecture & Data Flow

### Infrastructure

```
Digital Ocean Droplet
└── Coolify (self-hosted PaaS)
    ├── PocketBase (self-hosted)
    │   ├── REST API + Admin UI  → https://pb.pageperfect.studio
    │   ├── Auth                 — email/password + GitHub/Google OAuth
    │   └── SQLite               — users, manuscripts, compile_history
    └── Backend (Express/Docker)
        └── PDF compile API      → proxied via Vercel rewrites

Vercel
└── Frontend (Next.js)           → https://pageperfect.studio
```

### Compile Flow

```
User edits Markdown in browser
    → 3s debounce (text) / 1.5s debounce (settings)
    → POST /api/compile (proxied via Next.js rewrites → Coolify backend)
    → Backend: validate size limits, sanitize inputs, write manuscript to temp dir
    → Enqueue to BullMQ (priority 1 for Publisher/Studio, 5 for Drafter)
       └── Preview jobs get deterministic ID (overwrites earlier previews in queue)
       └── If Redis down: sync fallback (max 2 concurrent)
    → Compile Worker picks up job:
       1. Re-verify user tier via PocketBase admin token (not trusting enqueue snapshot)
       2. LaTeX injection detection (14 patterns via latex-sanitizer.js)
       3. Strip remote images (SSRF prevention via text-normalizer.js)
       4. Create isolated temp dir (pp-worker-*)
       5. Resolve fonts from hardcoded registry, inject emoji fallback chain
       6. Assemble preamble: grid geometry + engineering policies + extensions + watermark
       7. Spawn Pandoc with LuaLaTeX + selected template
          └── -raw_tex disabled (blocks raw LaTeX in user markdown)
          └── --resource-path constrained to temp dir
          └── (Optional) --citeproc for bibliography processing
       8. 45s timeout (COMPILE_TIMEOUT_MS) → SIGKILL
       9. (Optional) PDF/X-1a conversion via Ghostscript
      10. Clean up temp dir
    → Frontend polls /api/compile/status/{jobId}
    → Frontend creates object URL, renders in iframe
```

### API Endpoints

**Health & Info:**
- `GET /api/health` — Basic health check (ok, service, timestamp, version)
- `GET /api/health/details` — Server capabilities (templates, sizes, presets, auth/payment status)
- `GET /api/templates` — Design template registry

**Core Compilation:**
- `POST /api/compile` — Compile Markdown to PDF
- `POST /api/convert` — Convert .docx to Markdown via Pandoc

**Publishing Utilities:**
- `GET /api/kdp/spine` — KDP spine width calculator
- `GET /api/kdp/gutter` — KDP dynamic gutter calculator
- `POST /api/preflight` — Pre-flight validation (page count, platform compliance)
- `GET /api/cover-dimensions` — Cover dimensions calculator (trim + spine + bleed)

**Lulu Print-on-Demand:**
- `GET /api/lulu/status` — Lulu API configuration status
- `POST /api/lulu/cost-estimate` — Print cost estimate
- `POST /api/lulu/print-job` — Create print job
- `GET /api/lulu/print-job/:id` — Print job status
- `POST /api/lulu/webhook` — Lulu webhook handler (HMAC-verified)

**Platform Compliance:**
- `GET /api/platforms` — All platform specs (KDP, IngramSpark, Lulu, offset)
- `GET /api/platforms/:key/pipeline` — Export pipeline for a platform
- `POST /api/analyze/platform` — Validate manuscript against platform requirements

**Manuscript Analysis:**
- `POST /api/analyze/structure` — Front/body/back matter analysis
- `POST /api/analyze/references` — Citation extraction and bibliography validation
- `POST /api/validate/bibliography` — BibTeX content validation
- `POST /api/analyze/assets` — Figure, table, image validation
- `POST /api/analyze/lint` — Book engineering lint
- `POST /api/analyze/typography` — Typography conformance analysis
- `POST /api/analyze/multilingual` — Script detection (RTL, CJK)
- `POST /api/analyze/print-qa` — Print quality assurance
- `POST /api/analyze/full` — All analysis systems combined

**Template Extensions:**
- `GET /api/template-tokens/:template` — Extension token schema for a template
- `POST /api/validate/extensions` — Validate template extension overrides

**Payments (Stripe):**
- `POST /api/stripe/webhook` — Stripe webhook handler (payment intents, invoices, subscriptions)
- `POST /api/stripe/create-payment` — Create payment intent or subscription

### Frontend Routes

| Route | File | Description |
|-------|------|-------------|
| `/` | `(site)/page.tsx` | Landing page — hero (pure typography), social proof, comparison, templates, engineering, pricing, CTA |
| `/app` | `app/page.tsx` | Full-screen Markdown editor with live PDF preview (no Nav/Footer) |
| `/journal` | `(site)/journal/page.tsx` | "Typography & Conversion" — essay index with sidebar categories |
| `/journal/[slug]` | `(site)/journal/[slug]/page.tsx` | Individual article with drop-cap, sections, prev/next nav |
| `/docs` | `(site)/docs/page.tsx` | "Operating the Engine" — template reference, KDP guide, troubleshooting |
| `/pricing` | `(site)/pricing/page.tsx` | 3-tier pricing (Drafter / Publisher / Studio) with FAQ |
| `/status` | `(site)/status/page.tsx` | API connectivity diagnostics and server capabilities |
| `/auth/login` | `(site)/auth/login/page.tsx` | Sign in / sign up (email + GitHub/Google OAuth) |
| `/auth/forgot-password` | `(site)/auth/forgot-password/page.tsx` | Request password reset email |
| `/auth/reset-password` | `(site)/auth/reset-password/page.tsx` | Set new password (via reset link) |
| `/auth/callback` | `(site)/auth/callback/route.ts` | OAuth fallback redirect (PocketBase uses popup flow) |

**Route groups:**
- `(site)/` — Marketing/docs pages wrapped with `Nav` + `Footer` via `(site)/layout.tsx`
- `app/` — Editor route with its own `layout.tsx` (full-screen, no chrome)

## Design System — The Ogilvy-Swiss Hybrid

The frontend implements a **Swiss-Ogilvy hybrid** design philosophy. The visual language is Müller-Brockmann's International Typographic Style (stark geometry, grid precision, objective communication) fused with David Ogilvy's direct-response pragmatism (benefit-driven headlines, CTA hierarchy, conversion-optimized contrast).

**Core principles — every design decision must satisfy these:**

1. **Typography dominates white space.** No decorative imagery. No vague illustrations. If you cannot justify an image with empirical data or objective function, remove it and let the type breathe.
2. **Sharp geometry only.** `border-radius: 0` on all buttons, cards, inputs, and containers in the marketing/docs context. Rounded corners are "friendly SaaS" — we are a precision instrument. The only exception is the editor app which uses the dark design system.
3. **Contrast triggers action.** The highest-contrast element on any page must be the most valuable CTA. Red (`#FF3333`) is reserved for the primary action (e.g., "Go to Editor", "Start Formatting"). Secondary actions use black or outlined buttons. Never assign red to a utility action (copy, download).
4. **No dead labels.** Headlines must do work. "Documentation" → "Operating the Engine". "The Journal" → "Typography & Conversion". Every heading is either a benefit, a command, or an active description.
5. **Low-contrast gray is the enemy of utility.** Navigation links, section labels, and metadata must be readable. Minimum text color is `#555555` for labels and `#333333` for body copy. Never use `#999` or lighter for functional text — it fails WCAG and Swiss clarity standards.

### The Specimen Palette

The `(site)` route group uses a **cream-on-ink** specimen palette — light background, dark text. This is NOT a dark theme.

| Token | Value | Usage |
|-------|-------|-------|
| Background | `#FDFCF8` (warm cream) | Page background for all `(site)` pages |
| Ink | `#111111` | Headlines, borders, primary text, nav links |
| Body text | `#333333` – `#3a3a3a` | Paragraph copy |
| Secondary text | `#444444` – `#555555` | Descriptions, metadata, captions |
| Labels | `#555555` or `rgba(17,17,17,0.5)` | Section numbers, kickers, mono labels |
| Accent | `#FF3333` | Primary CTA buttons, active states, hover accents |
| Accent hover | `#E52222` | Button hover state |
| Border | `#111111` | Section separators, card borders, table rules |
| Border subtle | `#e5e5e0` | Hairlines, inner dividers |
| Surface | `#f5f5f0` | Sidebar backgrounds, subtle fills |

**The root `<body>` is `bg-[#050505]` (dark void) for the editor app.** The `(site)` layout overrides this with `bg-[#FDFCF8] text-[#111111]` via the `data-specimen` wrapper. The `[data-docs]` scope overrides CSS variables for the paper-light documentation context.

### Typography

Three Google Fonts loaded via `next/font/google` in `layout.tsx`:
- **Inter Tight** (`--font-display`) — headings, nav, UI labels, all uppercase tracking (weights 400–800)
- **Source Serif 4** (`--font-body`) — body text, paragraphs, journal articles
- **IBM Plex Mono** (`--font-mono`) — code, status labels, section numbers, metadata (weights 400, 600)

Responsive type scale (Tailwind `fontSize` + `globals.css`):
- `hero` — `clamp(3.5rem, 9vw, 7.5rem)` — landing page hero only
- `h1` — `clamp(2rem, 3.5vw, 3.5rem)` — page headlines
- `h2` — `clamp(1.5rem, 2.5vw, 2.5rem)` — section headlines
- `h3` — `clamp(1.25rem, 1.8vw, 1.5rem)` — subsections
- `editorial-body` — `1.125rem` — journal article body
- `editorial-caption` — `0.6875rem` — figure captions

**Typographic conventions:**
- Section labels: `font-mono text-[0.625rem] uppercase tracking-[0.15em]` (e.g., "01 GETTING STARTED", "VOL. I")
- Nav links: `font-mono text-[10px] uppercase tracking-[0.12em]`
- Buttons: `font-mono text-[10px] or text-[11px] uppercase tracking-[0.1em]`
- All uppercase text uses letter-spacing ≥ 0.1em

### Button Hierarchy

Buttons follow Ogilvy's contrast-triggers-action rule:

| Style | Visual | Usage |
|-------|--------|-------|
| **Primary (Red)** | `bg-[#FF3333]` solid, white text | The ONE action you want the user to take: "Start Formatting", "Go to Editor", "Open Editor" |
| **Black** | `bg-[#111111]` solid, white text, inverts on hover | Strong secondary: "Open Editor" in nav, CTAs in journal/docs |
| **Outlined** | `border-[#111111]/20`, transparent bg | Tertiary: "Read Docs", navigation alternatives |
| **Secondary** | `.btn-secondary` (surface bg, visible border) | Utility: "Copy citation", "Download .md", "Copy guide" |

**In `[data-docs]` context:** All `.btn-pill` elements have `border-radius: 0` (sharp rectangles).

### Card & Container Geometry

**In `[data-docs]` and `(site)` contexts:**
- Cards: `background: #ffffff; border: 1px solid #1a1a1a;` — white with strict black border
- Template cards (`.docs-template-card`): Same — white + 1px solid black
- Admonitions (`.docs-admonition`): White background, 4px left border (colored by type: info=#003366, warn=#800020, tip=#FF3333)
- Code blocks: `border-radius: 0` — no rounded corners anywhere
- No grey background fills for content containers — use white + border instead

### Shadows

- `shadow-card` / `shadow-card-hover` — card elevation (editor context)
- `shadow-elevated` — modals, overlays
- `shadow-paper` / `shadow-paper-hover` — skeuomorphic PDF preview
- `shadow-editorial` / `shadow-editorial-hover` — clean drop shadows
- `shadow-inner-subtle` — inset shadow

### Animations

- `animate-fade-in` — 0.6s opacity
- `animate-fade-in-up` — 0.8s opacity + translateY
- `animate-reveal-up` — 0.8s blur + translateY reveal

### CSS Utility Classes (globals.css)

| Class | Purpose |
|-------|---------|
| `.btn-pill` | Base button (sharp rectangles in `[data-docs]`, rounded elsewhere) |
| `.btn-primary` | Red accent CTA — reserved for the highest-value action |
| `.btn-secondary` | Black outlined utility button |
| `.btn-ghost` | Transparent text-only button |
| `.card` | Surface container (white + black border in docs, dark in editor) |
| `.container-grid` | Centered max-w-7xl wrapper with padding |
| `.input-dark` | Dark form input/select styling (editor) |
| `.paper-surface` | Dark surface for PDF preview (editor) |
| `.bg-noise` | Fixed SVG noise overlay (0.03 opacity) |
| `.divider` | Horizontal hairline separator |
| `.colophon` | Top/bottom border strip |
| `.crop-mark` / `.crop-mark-tl` | Print registration crop marks |
| `.h1` / `.h2` / `.h3` / `.p` | Responsive typography helpers |
| `.label-mono` | Uppercase monospace label (11px) |
| `.caption` | Monospace figure caption |
| `.skip-link` | Accessibility skip-to-content link |
| `.docs-sidebar` | Sticky sidebar navigation (docs) |
| `.docs-table` | Swiss-style annual report tables (2px top/bottom rules) |
| `.docs-admonition` | Left-border callout boxes (white bg, colored left border) |
| `.docs-template-card` | Template cards (white bg, 1px solid black border) |
| `.docs-badge` | Category badges (mono, uppercase, sharp) |
| `.journal-card` | Article cards on journal index |
| `.journal-article` | Article body typography (Source Serif 4, 1.125rem, 1.8 leading) |
| `.journal-drop-cap` | 4rem drop cap on article first paragraph |
| `.journal-subhead` | Article section headings |
| `.journal-header` | Article header with 2px bottom border |

### Page-Specific Style Rules

**Homepage (`/`):**
- Hero: Pure typography + white space. No background images, no illustrations. Let the headline sell.
- Technical bar at bottom: VERSION / OUTPUT / ENGINE in monospace — positions the product as a precision instrument.
- All section transitions use stark black borders, not gradients.

**Journal (`/journal`):**
- Headline: "Typography & Conversion" (not "The Journal" — dead labels do no work)
- VOL. kicker uses `rgba(17,17,17,0.5)` — visible but subordinate
- Article cards: `.journal-card` with `border-bottom: 1px solid #e5e5e0`, hover red on title
- Article body: Source Serif 4 at 1.125rem/1.8 line-height — optimal reading measure

**Docs (`/docs`):**
- Headline: "Operating the Engine" (not "Documentation" — active, authoritative)
- All cards and buttons have `border-radius: 0` via `[data-docs]` scope
- "Go to Editor" is the Red CTA; "Copy citation" / "Copy guide" are black secondary
- Section numbering: `01`, `01.1`, `02` etc. in monospace — engineering schematic precision

**Nav:**
- Header: PagePerfect logo + Pricing + Journal + Auth + "Open Editor" (black button)
- Docs link is in the footer only (not in the header nav) — declutters the top
- All nav text: `text-[#111111]/50` default, `text-[#111111]` on hover

## Templates

15 LaTeX templates organized by category:

| Template | Category | Baseline | Description |
|----------|----------|----------|-------------|
| `chicago` | Academic | 11pt | Chicago Manual / University Press |
| `symphony` | Academic | 12pt | Van de Graaf Canon monograph |
| `thesis` | Academic | 12pt | Double-spaced dissertation |
| `minimal` | Basic | 12pt | BasicTeX-compatible, zero dependencies |
| `paperback` | Fiction | 11pt | Cinematic page-turner |
| `memoir` | Fiction | 11pt | Personal narrative (Libre Baskerville) |
| `exhibit` | Trade | 10pt | White-cube gallery catalog |
| `heirloom` | Cookbook | 11pt | Recipe format with ingredient blocks |
| `verse` | Poetry | 11pt | Preserved line breaks, EB Garamond |
| `chronicle` | Editorial | 11pt | Swiss journalism, multi-column |
| `international` | Design | 9pt | Müller-Brockmann modular grid |
| `operator` | Technical | 10pt | Developer docs, admonition boxes |
| `matrix` | Business | 10pt | Annual report, tabular figures |
| `avantgarde` | Creative | 11pt | Brutalist manifesto |
| `cinema` | Screenplay | 12pt | Hollywood standard (Courier) |

## Page Sizes

19 page sizes in 3 tiers:

**Default (always visible in editor):**
5.5×8.5", 6×9", A5, Royal, US Letter, A4

**More Book Sizes (collapsible):**
Mass Market (4.25×6.87"), A-format (111×178mm), B-format (129×198mm), 5.25×8", Demy (138×216mm), 7×10", B5, Crown Quarto

**Amazon KDP (collapsible):**
5×8", 6×9", 7×10", 8×10", 8.5×11"

## Margin Presets

7 presets expressed as grid-unit multiples:

| Preset | Grid Units |
|--------|-----------|
| `minimal` | 2 |
| `compact` | 3 |
| `narrow` | 4 |
| `normal` | 5 (default) |
| `wide` | 6 |
| `academic` | 7 |
| `generous` | 8 |

## Key Conventions

### File Naming

- **React components**: PascalCase (`CompileShell.tsx`, `TemplateHelp.tsx`)
- **Data/constants files**: camelCase (`authorGuide.ts`, `sample.ts`)
- **LaTeX templates**: lowercase (`chronicle.latex`)
- **Backend modules**: lowercase kebab-case (`grid-system.js`, `book-engineering.js`)

### Frontend Patterns

- **Route groups**: `(site)/` for marketing pages with Nav/Footer; `app/` for full-screen editor
- **Client components** use `'use client'` directive; server components are the default
- **State**: React `useState`/`useContext` with `localStorage` persistence (key: `pp-prefs-v1`)
- **Auto-compile**: 1-second debounce with `AbortController` for in-flight cancellation
- **Tooltips**: Rendered via `createPortal` to `document.body`
- **Path alias**: `@/*` maps to `./src/*`
- **Types**: Defined locally at the top of files (`TemplateKey`, `PageSize`, `MarginPreset`, `CompileMode`)
- **CSS**: Utility-first Tailwind with Swiss-Ogilvy design tokens. Do NOT use legacy `ens-*` tokens in new code. On `(site)` pages, use the specimen palette (cream bg, ink text, red accent). On `[data-docs]` pages, all buttons/cards have `border-radius: 0`. Never use `#999` or lighter for functional text.
- **Layout**: `(site)/layout.tsx` provides sticky `Nav` and `Footer`; `app/layout.tsx` provides full-screen editor chrome. Root `layout.tsx` provides fonts, Providers, and noise overlay.
- **Fonts**: Inter Tight for display, Source Serif 4 for body, IBM Plex Mono for mono — loaded via `next/font/google` in root `layout.tsx`.

### Component APIs

**`Button`** (`@/components/Button`):
- `variant`: `'primary'` | `'secondary'` | `'ghost'` (default: `'primary'`)
- `size`: `'sm'` | `'md'` | `'lg'` (default: `'md'`)
- `href`: optional — renders as `<Link>` instead of `<button>`
- Extends `ButtonHTMLAttributes<HTMLButtonElement>`

**`Section`** (`@/components/Section`):
- `variant`: `'default'` | `'raised'` | `'light'` | `'dark'` (default: `'default'`)
- `id`: optional — for anchor links
- Sets `data-theme="light"` when variant is `'light'`

**`Container`** (`@/components/Container`):
- Renders children inside `.container-grid` (centered max-w-7xl with padding)

### Backend Patterns

- **CommonJS** module system (`require`/`module.exports`)
- **Job queue**: BullMQ + Redis (`index.js:132-176`). 3 concurrent workers (configurable via `COMPILE_CONCURRENCY`). Priority lanes: Publisher/Studio=1, Drafter=5. Preview jobs use deterministic IDs for deduplication. Sync fallback (max 2 concurrent) when Redis is unavailable.
- **Compile worker**: `compile-worker.js` processes BullMQ jobs. Re-verifies user tier at execution time via PocketBase admin token. Assembles preamble from grid system, engineering policies, template extensions, heading variants, watermark, and multilingual support.
- **Temp files**: `fsp.mkdtemp` for isolated compilation per job (`pp-worker-*` prefix). Cleaned after each job. Orphan sweeper runs at boot + hourly for crash recovery (`index.js:95-130`). In-memory job results have 10-minute TTL.
- **PDF streaming**: `fs.createReadStream().pipe(res)` with Content-Disposition header
- **Process spawning**: `child_process.spawn` for Pandoc with CWD restricted to temp dir, SIGKILL after 45s timeout
- **Input sanitization**: `latex-sanitizer.js` detects 14 LaTeX injection patterns (`\input`, `\write18`, `\directlua`, `\ShellEscape`, etc.) and escapes special characters. `text-normalizer.js` strips remote image URLs to prevent SSRF. Titles sanitized to 200 chars with LaTeX escaping.
- **Stderr sanitization**: `compile-utils.js` strips container paths (`/tmp/pp-*`, `/home/*`, `/app/templates/`) before returning errors to clients.
- **Error translation**: Frontend maps 24+ TeX/Pandoc error patterns to plain English (`CompileShell.tsx:179-207`)
- **Error parsing**: Regex extraction of missing citations/packages from stderr
- **Safe mode**: Strips citation syntax for compilation without bibliography processing
- **Rate limiting**: `express-rate-limit` — 20 compiles/min/IP, 120 general requests/min/IP. Redis-backed when available.
- **Security**: `helmet` middleware for HTTP headers, CORS locked to known origins + Vercel preview domains
- **Logging**: `morgan` for HTTP request logging, `logger.js` for structured backend logging
- **Watermark**: TikZ-based overlay (`watermark.js`) applied at compile time for Drafter tier. Müller-Brockmann-inspired registration marks at 8% opacity.

### Grid System

The `GridSystem` class in `backend/grid-system.js` implements:

- **Baseline grids**: 12pt (academic/basic) or 11pt (trade/editorial/corporate/creative)
- **Golden-ratio typographic scale** (multiplier 1.618): heading sizes derived from baseline
- **Margin presets**: 7 presets (minimal→generous) as grid-unit multiples
- **LaTeX generation**: `\geometry{}` commands and typography preamble

### Security Architecture

The compile pipeline treats user input as hostile. Defense is layered:

**Input sanitization (before compilation):**
- `latex-sanitizer.js` detects 14 LaTeX/Lua injection patterns: `\input`, `\include`, `\write18`, `\immediate\write`, `\openout`, `\read`, `\catcode`, `\csname`, `\newwrite`, `\directlua`, `\luaexec`, `\luadirect`, `\ShellEscape`, `\openin`
- `text-normalizer.js` strips all remote image URLs (`http://`, `https://`) to prevent SSRF
- Title sanitized to 200 chars with 14 LaTeX special character escapes
- Font names validated against hardcoded registry (not user input) — regex whitelist `[A-Za-z0-9 \-.]+`
- Custom font IDs validated as UUID only (prevents path traversal)
- Colors validated as strict hex `#RRGGBB`

**Pandoc configuration (compile-time defense):**
- `-raw_tex` flag disabled — strips all raw LaTeX from user markdown (primary RCE prevention)
- `-raw_attribute` flag disabled — blocks raw attribute fences
- `--resource-path` constrained to temp directory only
- `--pdf-engine=lualatex` — explicit engine selection

**Process isolation:**
- Docker container runs as non-root `ppuser` (`Dockerfile:77-81`)
- Each compile job gets isolated temp dir (`pp-worker-*` in `/tmp`)
- Pandoc spawned with CWD restricted to temp dir
- 45-second SIGKILL timeout prevents resource exhaustion
- Orphan temp dirs swept at boot + hourly

**Network & API security:**
- `helmet` middleware for HTTP security headers
- CORS locked to known origins + Vercel preview domains
- Rate limiting: 20 compiles/min/IP, 120 general/min/IP (Redis-backed)
- Body size limits: 2 MB markdown, 10 MB .docx, 5 MB JSON
- Stderr sanitization strips container paths before client response
- Compile job results require secret token for anonymous users (prevents enumeration)

**Auth verification:**
- User tier re-verified at compile time via PocketBase admin token (not trusting enqueue snapshot)
- Feature gates checked twice: at enqueue and at execution
- Admin credentials never exposed to client

**Known hardening gaps:**
- No per-process resource limits (ulimit/cgroup) on Pandoc spawn
- No seccomp profile on Docker container
- No `--network none` flag on container (default Docker network namespace)
- No read-only root filesystem
- Injection detection logs warnings but does not block (relies on `-raw_tex` flag)

### Auth (PocketBase)

- **Client**: `frontend/src/lib/supabase.ts` (legacy filename) exports `createClient()` returning a PocketBase singleton
- **Context**: `frontend/src/lib/auth-context.tsx` provides `AuthProvider` with:
  - `signIn(email, password)` / `signUp(email, password)`
  - `signInWithOAuth('google' | 'github')` — popup flow
  - `resetPassword(email)` / `updatePassword(newPassword)`
  - `signOut()`
  - State: `user`, `session`, `profile`, `tier`, `loading`
- **Collections** (in `database.types.ts`):
  - `users` — built-in auth + `display_name`, `tier`, `stripe_customer_id`, `stripe_subscription_id`
  - `manuscripts` — `user`, `title`, `content`, `template`, `page_size`, `margin_preset`, `safe_mode`
  - `compile_history` — `user`, `template`, `page_size`, `status`, `compile_time_ms`, `error_message`
- **Tiers**: `'drafter'` (default) | `'publisher'` | `'studio'`
- **NavAuth**: Shows tier badge ("Pro" for publisher, "Studio" for studio) + avatar dropdown

### Manuscript Persistence (Session-Scoped)

Manuscripts are stored with a **session-scoped lifecycle** — they exist for crash recovery, not long-term storage.

- **Authenticated users**: `use-manuscript.ts` saves to PocketBase `manuscripts` collection (5s debounce). On sign-out, `purgeUserManuscripts()` deletes all server-side manuscripts for that user.
- **All users**: `manuscript-store.ts` saves to browser IndexedDB (3s debounce, localStorage fallback). This is client-side only and survives sign-out.
- **Backend safety net**: `index.js` runs a manuscript expiry sweeper every 6 hours that deletes manuscripts not updated in 24 hours. Catches sessions that ended without clean sign-out.
- **Privacy policy**: `/privacy` (Clause 01) accurately describes session-scoped storage. Manuscripts are never treated as permanent account data.

### Payments (Stripe)

- **Frontend**: `lib/stripe.ts` loads Stripe.js via `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` and exports `createPayment(tier, userId, email?)`
- **Backend**: `POST /api/stripe/create-payment` creates payment intents/subscriptions; `POST /api/stripe/webhook` handles events
- **Env vars**: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_PUBLISHER` on backend; `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` on frontend

### Git Conventions

- **Branches**: `main` (production), `develop` (integration), `feature/*`, `bugfix/*`, `hotfix/*`
- **Commits**: Conventional Commits format (`feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `perf:`, `test:`, `chore:`)
- **Commit template**: `.gitmessage` at repo root

## Pricing Model

Defined in `frontend/src/app/(site)/pricing/page.tsx`. Stripe integration exists but paywall is not yet fully enforced.

| Tier | Price | Key differentiators |
|------|-------|-------------------|
| **Drafter** | Free | All 15 templates, 6 default page sizes, real-time preview, watermarked output |
| **Publisher** | $19.99/manuscript | No watermark, all 19 page sizes, citations, priority queue (14 days unlimited re-exports) |
| **Studio** | $199 one-time | Lifetime Publisher access, EPUB export, custom font upload, batch export, direct support |

**Watermark behavior:** Drafter-tier exports include a TikZ-based watermark overlay injected at compile time (`watermark.js`). The `x-pp-watermarked` response header signals watermark status to the frontend. Users see a post-download banner with upgrade CTA. Watermark is server-side and cannot be bypassed by the client.

**Tier enforcement:** Feature gates checked at both enqueue time (`index.js`) and compile time (`compile-worker.js`). Tier re-verified via PocketBase admin token at job execution to prevent privilege escalation if tier changes while job is queued. Tier levels: `anonymous: 0, drafter: 1, publisher: 2, studio: 3`.

## Environment Variables

### Frontend (Vercel)

These are the env vars used in the frontend code. Configure them in the Vercel dashboard.

| Variable | Used In | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_POCKETBASE_URL` | `lib/supabase.ts` | PocketBase URL (`https://pb.pageperfect.studio`) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `lib/stripe.ts` | Stripe publishable key (`pk_live_...` or `pk_test_...`) |
| `NEXT_PUBLIC_STRIPE_PRICE_PUBLISHER` | `pricing/page.tsx` | Stripe price ID for Publisher tier |
| `NEXT_PUBLIC_STRIPE_PRICE_STUDIO` | `pricing/page.tsx` | Stripe price ID for Studio tier |
| `API_BASE_URL` | `next.config.ts` | Backend URL for API proxy rewrites (e.g. Coolify backend URL). **Server-side only.** Defaults to `http://localhost:4000`. |
| `RESEND_API` | — | Resend API key for transactional email |

**Critical**: `API_BASE_URL` must be set on Vercel for the `/api/*` proxy to reach the Coolify backend. Without it, all compile and health-check requests fall back to `localhost:4000` and return 404.

### Backend (Coolify)

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `4000` | Server port |
| `NODE_ENV` | `development` | Environment |
| `FRONTEND_URL` | — | Frontend URL for CORS (e.g. `https://pageperfect.studio`) |
| `POCKETBASE_URL` | — | PocketBase URL (`https://pb.pageperfect.studio`) |
| `POCKETBASE_ADMIN_EMAIL` | — | PocketBase admin email (never expose to client) |
| `POCKETBASE_ADMIN_PASSWORD` | — | PocketBase admin password (never expose to client) |
| `STRIPE_SECRET_KEY` | — | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | — | Stripe webhook signing secret |
| `STRIPE_PRICE_PUBLISHER` | — | Stripe price ID for Publisher tier |
| `LULU_CLIENT_KEY` | — | Lulu xPress API key |
| `LULU_CLIENT_SECRET` | — | Lulu xPress API secret |
| `LULU_SANDBOX` | — | Set `'true'` for sandbox mode |
| `MAX_MD_BYTES` | `2097152` (2 MB) | Max Markdown payload size |
| `MAX_DOCX_BYTES` | `10000000` (10 MB) | Max .docx upload size |
| `COMPILE_TIMEOUT_MS` | `45000` (45s) | Pandoc compilation timeout |

## Testing

### Backend (Jest)

```bash
cd backend && npm test          # Run all tests (verbose)
cd backend && npm run test:ci   # CI mode with coverage
```

Test files in `backend/tests/`:
- **`latex-sanitizer.test.js`** (207 lines) — LaTeX injection detection (14 attack patterns including `\directlua`, `\write18`, `\ShellEscape`), character escaping, font name validation (rejects shell injection, path traversal), color validation, extension value validation
- **`grid-system.test.js`** (144 lines) — GridSystem class: all 19 page sizes × 7 margin presets, margin capping at 40% for small pages, LaTeX `\geometry{}` output verification
- **`compile-utils.test.js`** — Compile utility functions
- **`logger.test.js`** — Logging utility

### Frontend (Manual)

- `/status` page runs connectivity diagnostics
- `/docs` page includes `RequirementsCheck` component (health check + compile test)
- `GET /api/health` and `GET /api/health/details` for backend status

### Missing (Known Gaps)

- No golden-file PDF regression tests (template changes could silently break layouts)
- No end-to-end compile tests (manuscript → PDF → preflight validation)
- No frontend component tests

`.gitignore` excludes `test*.pdf` and `*-test.pdf` but preserves `sample*.pdf`.

## Deployment

- **Frontend**: Deploys to Vercel from `frontend/`. Auto-deploys on push to `main`. Env vars in Vercel dashboard.
- **Backend**: Deploys via Coolify on a Digital Ocean droplet from `backend/` via Docker. Env vars in Coolify dashboard.
- **PocketBase**: Self-hosted on the same Digital Ocean droplet via Coolify. Admin UI at `https://pb.pageperfect.studio/_/`. OAuth providers configured in PocketBase Admin → Settings → Auth providers.

## Important Files for Common Tasks

| Task | Key Files |
|------|----------|
| Editor UI changes | `frontend/src/app/app/CompileShell.tsx` |
| Add/modify templates | `backend/templates/*.latex`, template registry in `backend/index.js` |
| Grid/typography changes | `backend/grid-system.js` |
| API route changes | `backend/index.js` |
| Landing page | `frontend/src/app/(site)/page.tsx`, `frontend/src/components/landing/` |
| Journal index & articles | `frontend/src/app/(site)/journal/page.tsx`, `articles-1.ts`, `[slug]/page.tsx` |
| Pricing page | `frontend/src/app/(site)/pricing/page.tsx` |
| Design system tokens | `frontend/tailwind.config.ts` |
| CSS utilities & global styles | `frontend/src/app/globals.css` (Swiss-Ogilvy system, docs/journal scopes) |
| Site Nav & Footer | `frontend/src/app/(site)/layout.tsx` |
| Root layout (fonts, metadata) | `frontend/src/app/layout.tsx` |
| API proxy config | `frontend/next.config.ts` |
| Reusable UI components | `frontend/src/components/` |
| Auth context & PocketBase client | `frontend/src/lib/auth-context.tsx`, `frontend/src/lib/supabase.ts` |
| Auth pages (login, reset) | `frontend/src/app/(site)/auth/` |
| PocketBase collection types | `frontend/src/lib/database.types.ts` |
| Stripe integration | `frontend/src/lib/stripe.ts`, `backend/index.js` (webhook + create-payment routes) |
| Lulu print-on-demand | `backend/lulu.js` |
| Publishing/pre-flight | `backend/publishing.js`, `backend/platform-compliance.js` |
| Compile worker & sandboxing | `backend/compile-worker.js`, `backend/latex-sanitizer.js`, `backend/text-normalizer.js` |
| Quality analysis systems | `backend/typography-assurance.js`, `backend/print-qa.js`, `backend/book-engineering.js` |
| Watermark system | `backend/watermark.js` |
| PDF/X-1a conversion | `backend/publishing.js` (Ghostscript pipeline), `backend/pdfx-def.ps` |
| Status/health diagnostics | `frontend/src/app/(site)/status/StatusClient.tsx`, `frontend/src/app/(site)/docs/RequirementsCheck.tsx` |

## Quality Analysis Systems

Six backend modules provide manuscript and output quality analysis. All return scored results via API endpoints.

| System | Module | Score | API Endpoint | Integration Status |
|--------|--------|-------|--------------|-------------------|
| **Preflight** | `publishing.js` | pass/fail + checks array | `POST /api/preflight` | Active — runs on every export via LaunchOverlay |
| **Typography** | `typography-assurance.js` | 0–100 + grade (A–D) | `POST /api/analyze/typography` | Advisory — scores config but doesn't enforce |
| **Print QA** | `print-qa.js` | 0–100 + grade (A–D) | `POST /api/analyze/print-qa` | Advisory — checks thresholds but doesn't block |
| **Book Engineering** | `book-engineering.js` | issue array + severity | `POST /api/analyze/lint` | Partial — linting active, compile log analysis orphaned |
| **Platform Compliance** | `platform-compliance.js` | checks + pipeline steps | `POST /api/analyze/platform` | Documentation — pipelines are read-only, not automated |
| **Grid System** | `grid-system.js` | pt/mm precision | (integrated into compile) | Active — core to every compilation |

**Key gap:** `book-engineering.js` defines `analyzeCompileLog()` (overfull/underfull hbox detection) and `typography-assurance.js` defines `generateTypographicReport()` — neither is called from the compile worker. These are orphaned code paths that should be wired in.

## Known Gaps & Tech Debt

### Critical (blocks credibility)

- ~~**Marketing/delivery honesty:**~~ **RESOLVED** — Free-tier download button now reads "Download Preview PDF (Watermarked)" and a pre-download amber notice warns users before they click. No more post-download surprise.
- ~~**Preflight doesn't block export:**~~ **RESOLVED** — `LaunchOverlay.tsx` sets `canDownload = !checking && !hasFailure && !fetchError && pdfUrl`. Failing preflight checks disable the download button and show "Export blocked" message.
- ~~**Compile log analysis orphaned:**~~ **RESOLVED** — `analyzeCompileLog()` and `generateTypographicReport()` are called in `compile-worker.js:465-476`. Results flow through compile status endpoint as `compileLog` and `typographyReport`.
- ~~**Privacy policy contradiction:**~~ **RESOLVED** — Manuscripts are now session-scoped (purged on sign-out + 24h backend sweeper). Privacy policy Clause 01 updated to accurately describe session storage.

### High (limits growth)

- ~~**No PDF regression test suite:**~~ **RESOLVED** — `template-regression.test.js` covers all 15 templates with academic and fiction samples, page size variations, heading variants (classic/modern/bold), specialist content (screenplay, cookbook, poetry, multi-column), grid system integration, and template file integrity checks. 54 tests total; compilation tests require pandoc/lualatex (skipped locally, run in CI Docker).
- ~~**No build manifest:**~~ **RESOLVED** — `provenance.js` fully integrated: `generateBuildMetadata()` embeds PDF metadata, `createExportSnapshot()` called in compile-worker, `buildId` + `exportSnapshot` returned via status endpoint and displayed in PreviewPane + LaunchOverlay. Pandoc 3.6.2 pinned; TeX Live pinned to Ubuntu 22.04 repo version.
- ~~**Container hardening:**~~ **PARTIALLY RESOLVED** — Dockerfile now includes read-only templates/filters, resource limits (`limits.d/ppuser.conf`), `docker:run` uses `--cap-drop=ALL`, `--security-opt=no-new-privileges`, `--read-only`, `--tmpfs`, `--memory=1g`, `--pids-limit=100`. Still missing: seccomp profile, `--network none`.
- ~~**In-memory job results:**~~ **RESOLVED** — Compiled PDFs are copied from ephemeral compile temp dirs to `/tmp/ppresults/` after compilation. Redis TTL extended to 30 minutes. Results survive temp dir cleanup, orphan sweeping, and restarts (if the file persists). Multiple downloads of the same PDF are now supported (no longer deleted on first stream close).

### Medium (improvement opportunities)

- ~~**Quality systems advisory only:**~~ **RESOLVED** — Quality gate is now wired end-to-end across the entire editor. (1) **FloatingHUD dock** shows typography grade (A/B/C/D) with color coding + overfull count for C/D grades — always visible during design. (2) **PreviewPane** shows a warning banner at the bottom of the PDF preview for C (amber: "Review typography before export") and D (red: "Low quality — adjust margins or template"). (3) **LaunchOverlay** shows a prominent quality warning block for C/D grades with specific remediation guidance. Grade D **requires explicit acknowledgment** (checkbox: "I understand the typography quality is below recommended thresholds") before the download button enables. Grade C warns but doesn't block. (4) **TopBar** uses amber for soft/expired errors vs red for real compile failures. Quality data flows from compile worker → status endpoint → useCompileQueue → all UI surfaces.
- ~~**No guided first-run wizard:**~~ **RESOLVED** — Genre auto-detection runs on manuscript upload. PortalStage now shows a visual template picker after analysis: templates from the detected genre appear first with "Rec" badge, type specimen previews (serif vs sans), and a detail bar showing the active template's description and font. "+ Show all 15 templates" expands to browse other genres. Users make an informed template choice before entering the design stage.
- ~~**Pricing page inaccuracies:**~~ **RESOLVED** — "Compile quality: Full quality" changed to "Typesetting engine: LuaLaTeX". FAQ corrected.
- ~~**"Safe Mode" naming:**~~ **RESOLVED** — Renamed to "Standard mode" with contextual help text in FloatingHUD.
- **No image persistence:** User-uploaded images for manuscripts are ephemeral. No long-term asset storage strategy.
- ~~**Lulu webhook incomplete:**~~ **RESOLVED** — Webhook handler now persists status to PocketBase `print_orders` collection (upsert by `lulu_job_id`). Tracks all Lulu status transitions (CREATED → SHIPPED), extracts tracking info from SHIPPED events. Requires `print_orders` collection in PocketBase Admin.
