# CLAUDE.md — PagePerfect

## Project Overview

PagePerfect is a PDF generation system that converts Markdown manuscripts to professionally typeset PDFs using XeLaTeX. It implements Josef Müller-Brockmann's grid system principles (baseline grids, golden-ratio typography, proportional spacing). The app is a loosely-coupled monorepo with a React/Next.js frontend and a Node.js/Express backend.

The product targets authors, academics, and publishers who need professional typesetting without the complexity of InDesign or the limitations of consumer tools like Vellum (Mac-only, $500) or Atticus ($147, limited typography). PagePerfect undercuts all competitors with a free tier and a $199 lifetime option.

## Repository Structure

```
PagePerfect/
├── frontend/                  # Next.js 15 React app (TypeScript)
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx           # Root layout — fonts, metadata, Providers, noise overlay
│   │   │   ├── globals.css          # Dark design system — tokens, utilities, docs theme
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
│   │       ├── NavAuth.tsx           # Auth state in nav (sign in / user menu + tier badge)
│   │       ├── AuthorGuideTools.tsx  # Copy/download author guide
│   │       ├── CopyCitation.tsx      # Copy citation to clipboard
│   │       └── landing/             # Landing page components
│   │           ├── Hero.tsx          # Hero section with parallax
│   │           ├── HeroImage.tsx     # Animated hero image
│   │           ├── Comparison.tsx    # Before/after interactive slider
│   │           ├── TemplateShowcase.tsx  # Animated template cards
│   │           ├── TemplateGallery.tsx   # Template gallery view
│   │           ├── TemplateGrid.tsx      # Template grid layout
│   │           ├── Steps.tsx         # How-it-works walkthrough
│   │           ├── WhyDifferent.tsx  # Feature callouts
│   │           ├── SocialProof.tsx   # Testimonials
│   │           ├── PricingPreview.tsx # Pricing cards for landing
│   │           ├── FinalCTA.tsx      # Final call-to-action
│   │           ├── Reveal.tsx        # Scroll-reveal animation wrapper
│   │           ├── SectionTransition.tsx # Visual section transitions
│   │           └── LevitatingCard.tsx   # Hover levitation effect
│   │
│   ├── public/                # Static assets, PWA manifest, icons
│   ├── .env.example           # Environment variable template
│   ├── tailwind.config.ts     # Dark design system tokens (colors, shadows, animations)
│   ├── next.config.ts         # API rewrites to backend via API_BASE_URL
│   ├── eslint.config.mjs      # ESLint flat config (next/core-web-vitals)
│   └── tsconfig.json          # Strict mode, @/* path alias
│
├── backend/                   # Express 5 API (JavaScript, CommonJS)
│   ├── index.js               # Server, 30+ routes, Pandoc orchestration, Stripe webhooks
│   ├── grid-system.js         # GridSystem class (margins, typography, LaTeX)
│   ├── publishing.js          # Pre-flight validation, cover dimensions, PDF/X-1a
│   ├── lulu.js                # Lulu xPress API client (print-on-demand)
│   ├── platform-compliance.js # KDP, IngramSpark, Lulu, offset print specs
│   ├── book-engineering.js    # Widows/orphans, hyphenation, float placement
│   ├── manuscript-structure.js # Front/body/back matter standardization
│   ├── references-system.js   # Citation validation, BibTeX parsing
│   ├── figures-system.js      # Image pipeline, DPI validation, asset checks
│   ├── typography-assurance.js # Baseline grid conformance, typographic scoring
│   ├── multilingual.js        # RTL, Arabic shaping, CJK, Devanagari support
│   ├── print-qa.js            # Ink coverage, contrast, DPI, reverse type checks
│   ├── provenance.js          # Build metadata, versioning, reproducible builds
│   ├── template-extensions.js # Governed extension tokens for template customization
│   ├── templates/             # 12 LaTeX templates
│   │   ├── chicago.latex      # Academic (12pt baseline)
│   │   ├── symphony.latex     # Classic academic
│   │   ├── minimal.latex      # BasicTeX-compatible
│   │   ├── paperback.latex    # Trade fiction/nonfiction (11pt baseline)
│   │   ├── exhibit.latex      # Modern trade design
│   │   ├── heirloom.latex     # Heritage trade
│   │   ├── chronicle.latex    # Editorial multi-column
│   │   ├── international.latex # Editorial international
│   │   ├── operator.latex     # Editorial technical
│   │   ├── matrix.latex       # Corporate structured
│   │   ├── avantgarde.latex   # Experimental creative
│   │   └── cinema.latex       # Screenplay format
│   ├── references/            # Sample .bib for citations
│   ├── .env.example           # Environment variable template
│   ├── Dockerfile             # Ubuntu 22.04, Node 18, Pandoc, texlive-xetex, Ghostscript
│   └── package.json
│
├── CLAUDE.md                  # This file
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
| Styling | Tailwind CSS 3.4 with dark design system tokens |
| Build tool | Turbopack (via Next.js) |
| Linting | ESLint 9 (next/core-web-vitals, next/typescript) |
| Backend framework | Express 5.1 |
| Backend language | JavaScript (CommonJS) |
| PDF engine | Pandoc + XeLaTeX |
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
    → 1s debounce
    → POST /api/compile (proxied via Next.js rewrites → Coolify backend)
    → Backend: sanitize inputs, write to temp dir
    → GridSystem calculates geometry/typography
    → Spawn Pandoc with XeLaTeX + selected template
    → (Optional) --citeproc for bibliography processing
    → 45s timeout (COMPILE_TIMEOUT_MS)
    → Stream PDF back | Return JSON error with diagnostics
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
| `/` | `(site)/page.tsx` | Landing page — hero, comparison slider, template showcase, pricing preview, CTA |
| `/app` | `app/page.tsx` | Full-screen Markdown editor with live PDF preview (no Nav/Footer) |
| `/docs` | `(site)/docs/page.tsx` | Documentation — author guide, citations, troubleshooting, system check |
| `/pricing` | `(site)/pricing/page.tsx` | 3-tier pricing (Drafter / Publisher / Studio) with FAQ |
| `/status` | `(site)/status/page.tsx` | API connectivity diagnostics and server capabilities |
| `/auth/login` | `(site)/auth/login/page.tsx` | Sign in / sign up (email + GitHub/Google OAuth) |
| `/auth/forgot-password` | `(site)/auth/forgot-password/page.tsx` | Request password reset email |
| `/auth/reset-password` | `(site)/auth/reset-password/page.tsx` | Set new password (via reset link) |
| `/auth/callback` | `(site)/auth/callback/route.ts` | OAuth fallback redirect (PocketBase uses popup flow) |

**Route groups:**
- `(site)/` — Marketing/docs pages wrapped with `Nav` + `Footer` via `(site)/layout.tsx`
- `app/` — Editor route with its own `layout.tsx` (full-screen, no chrome)

## Design System

The frontend uses a **dark-first** design language. All color tokens, shadows, and animations are defined in `tailwind.config.ts` with supporting CSS utilities in `globals.css`. The docs pages override to a light theme via `[data-docs]` scoping.

### Color Tokens

Tokens are driven by CSS variables and used in Tailwind classes (e.g., `bg-surface-raised`, `text-accent`, `border-border`).

**Editorial palette (static):**
- `ink` — `#050505` (deep black), `ink-raised`, `ink-overlay`, `ink-subtle`
- `paper` — `#f5f5f0` (off-white), `paper-warm`, `paper-cool`
- `reg` — `#0033ff` (registration blue), `reg-light`

**Semantic tokens (CSS-variable-driven):**
- `void` — page background
- `surface` / `surface-raised` / `surface-overlay` / `surface-subtle` / `surface-glass`
- `accent` / `accent-hover` / `accent-muted` / `accent-glow` / `accent-soft`
- `text-primary` / `text-secondary` / `text-tertiary` / `text-ghost`
- `success` / `success-muted`, `warning` / `warning-muted`, `danger` / `danger-muted`
- `border` / `border-subtle` / `border-visible` / `border-accent`

### Typography

Three Google Fonts loaded via `next/font/google` in `layout.tsx`:
- **Inter Tight** (`--font-display`) — headings, nav, UI labels (weights 400–800)
- **Source Serif 4** (`--font-body`) — body text, paragraphs
- **IBM Plex Mono** (`--font-mono`) — code, status, labels (weights 400, 600)

Responsive type scale (Tailwind `fontSize` + `globals.css`):
- `hero` — `clamp(3.5rem, 9vw, 7.5rem)`
- `h1` — `clamp(2rem, 3.5vw, 3.5rem)`
- `h2` — `clamp(1.5rem, 2.5vw, 2.5rem)`
- `h3` — `clamp(1.25rem, 1.8vw, 1.5rem)`
- `editorial-body` — `1.125rem`
- `editorial-caption` — `0.6875rem`

### Shadows

- `shadow-card` / `shadow-card-hover` — card elevation
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
| `.btn-pill` | Base pill-shaped button (rounded-full, transitions) |
| `.btn-primary` | Accent blue button with glow shadow |
| `.btn-secondary` | Bordered ghost button |
| `.btn-ghost` | Transparent text-only button |
| `.card` | Dark raised surface with border and shadow |
| `.container-grid` | Centered max-w-7xl wrapper with padding |
| `.input-dark` | Dark form input/select styling |
| `.paper-surface` | Dark surface for PDF preview |
| `.bg-noise` | Fixed SVG noise overlay (0.03 opacity) |
| `.divider` | Horizontal hairline separator |
| `.colophon` | Top/bottom border strip |
| `.crop-mark` / `.crop-mark-tl` | Print registration crop marks |
| `.h1` / `.h2` / `.h3` / `.p` | Responsive typography helpers |
| `.label-mono` | Uppercase monospace label (11px) |
| `.caption` | Monospace figure caption |
| `.skip-link` | Accessibility skip-to-content link |
| `.docs-sidebar` | Sticky sidebar navigation (docs) |
| `.docs-table` | Swiss-style annual report tables (docs) |
| `.docs-admonition` | Left-border callout boxes (docs) |
| `.docs-code` | Code blocks (docs) |
| `.docs-template-card` | Template cards (docs) |
| `.docs-badge` | Category badges (docs) |

## Templates

12 LaTeX templates organized by category:

| Template | Category | Baseline | Description |
|----------|----------|----------|-------------|
| `chicago` | Academic | 12pt | Chicago Manual style |
| `symphony` | Academic | 12pt | Classic academic |
| `minimal` | Basic | 12pt | BasicTeX-compatible, lightweight |
| `paperback` | Trade | 11pt | Fiction/nonfiction trade |
| `exhibit` | Trade | 11pt | Modern trade design |
| `heirloom` | Trade | 11pt | Heritage trade |
| `chronicle` | Editorial | 11pt | Multi-column editorial |
| `international` | Editorial | 11pt | International format |
| `operator` | Editorial | 11pt | Technical editorial |
| `matrix` | Corporate | 11pt | Structured corporate |
| `avantgarde` | Creative | 11pt | Experimental creative |
| `cinema` | Creative | 11pt | Screenplay format |

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
- **CSS**: Utility-first Tailwind with dark design system tokens. Do NOT use legacy `ens-*` tokens in new code.
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
- **Temp files**: `fs.mkdtempSync` for isolated compilation, cleaned up after each request
- **PDF streaming**: `fs.createReadStream().pipe(res)` with Content-Disposition header
- **Process spawning**: `child_process.spawn` for Pandoc with timeout (`SIGKILL` after 45s)
- **Error parsing**: Regex extraction of missing citations/packages from stderr
- **Safe mode**: Strips citation syntax for compilation without bibliography processing
- **Rate limiting**: `express-rate-limit` on API endpoints
- **Security**: `helmet` middleware for HTTP headers
- **Logging**: `morgan` for HTTP request logging

### Grid System

The `GridSystem` class in `backend/grid-system.js` implements:

- **Baseline grids**: 12pt (academic/basic) or 11pt (trade/editorial/corporate/creative)
- **Golden-ratio typographic scale** (multiplier 1.618): heading sizes derived from baseline
- **Margin presets**: 7 presets (minimal→generous) as grid-unit multiples
- **LaTeX generation**: `\geometry{}` commands and typography preamble

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
| **Drafter** | Free | All 12 templates, 6 default page sizes, real-time preview, watermarked output |
| **Publisher** | $9.99/mo | No watermark, all 19 page sizes, full quality, citations, priority queue |
| **Studio** | $199 one-time | Lifetime Publisher access, future EPUB/custom fonts/batch export, direct support |

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

No automated test suite is configured. Testing is manual via the frontend UI:
- `/status` page runs connectivity diagnostics
- `/docs` page includes `RequirementsCheck` component (health check + compile test)
- `GET /api/health` and `GET /api/health/details` for backend status

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
| Pricing page | `frontend/src/app/(site)/pricing/page.tsx` |
| Design system tokens | `frontend/tailwind.config.ts` |
| CSS utilities & global styles | `frontend/src/app/globals.css` |
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
| Status/health diagnostics | `frontend/src/app/(site)/status/StatusClient.tsx`, `frontend/src/app/(site)/docs/RequirementsCheck.tsx` |
