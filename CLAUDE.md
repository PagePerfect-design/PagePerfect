# CLAUDE.md — PagePerfect

## Project Overview

PagePerfect is a PDF generation system that converts Markdown manuscripts to professionally typeset PDFs using XeLaTeX. It implements Josef Müller-Brockmann's grid system principles (baseline grids, golden-ratio typography, proportional spacing). The app is a loosely-coupled monorepo with a React/Next.js frontend and a Node.js/Express backend.

The product targets authors, academics, and publishers who need professional typesetting without the complexity of InDesign or the limitations of consumer tools like Vellum (Mac-only, $500) or Atticus ($147, limited typography). PagePerfect undercuts all competitors with a free tier and a $199 lifetime option.

## Repository Structure

```
PagePerfect/
├── frontend/                  # Next.js 15 React app (TypeScript)
│   ├── src/
│   │   ├── app/               # App Router pages
│   │   │   ├── page.tsx       # Product landing page (/) — hero, features, comparison table
│   │   │   ├── layout.tsx     # Root layout with Nav, Footer, Google Fonts
│   │   │   ├── globals.css    # Dark design system — tokens, utilities, button/card styles
│   │   │   ├── page.module.css # Legacy (unused) — left over from create-next-app
│   │   │   ├── app/           # Editor (/app)
│   │   │   │   ├── CompileShell.tsx   # Main editor component (~670 lines)
│   │   │   │   ├── TemplateHelp.tsx   # Template help tooltip
│   │   │   │   ├── TemplateNotes.tsx  # Template-specific notes
│   │   │   │   ├── authorGuide.ts     # Author guide content
│   │   │   │   └── sample.ts          # Sample manuscript
│   │   │   ├── docs/          # Documentation (/docs)
│   │   │   │   ├── page.tsx           # Docs page with troubleshooting cards
│   │   │   │   └── RequirementsCheck.tsx  # Automated health/compile checks
│   │   │   ├── auth/          # Auth routes
│   │   │   │   ├── login/page.tsx     # Sign in / sign up (email + OAuth)
│   │   │   │   ├── forgot-password/page.tsx  # Request password reset
│   │   │   │   ├── reset-password/page.tsx   # Set new password
│   │   │   │   └── callback/route.ts  # OAuth callback handler
│   │   │   ├── pricing/       # Pricing (/pricing)
│   │   │   │   └── page.tsx           # 3-tier pricing with FAQ
│   │   │   └── status/        # Health check (/status)
│   │   │       ├── page.tsx           # Server-rendered status shell
│   │   │       └── StatusClient.tsx   # Client-side connectivity diagnostics
│   │   ├── lib/               # Shared utilities
│   │   │   ├── supabase.ts            # Browser Supabase client factory + isSupabaseConfigured guard
│   │   │   ├── supabase-server.ts     # Server-side Supabase client (cookie-based)
│   │   │   ├── auth-context.tsx       # AuthProvider context (user, session, profile, tier)
│   │   │   └── database.types.ts      # Supabase DB schema types (profiles, manuscripts, compile_history)
│   │   └── components/        # Reusable UI
│   │       ├── Button.tsx             # primary/secondary/ghost × sm/md/lg
│   │       ├── Container.tsx          # max-w-7xl centered wrapper
│   │       ├── Section.tsx            # default/raised/light/dark page sections
│   │       ├── Providers.tsx          # Client provider wrapper (AuthProvider)
│   │       ├── NavAuth.tsx            # Auth state in nav (sign in / user menu)
│   │       ├── AuthorGuideTools.tsx   # Copy/download author guide
│   │       └── CopyCitation.tsx       # Copy citation example to clipboard
│   ├── public/                # Static assets, PWA manifest, icons
│   ├── tailwind.config.ts     # Dark design system tokens (colors, shadows, animations)
│   ├── next.config.ts         # API rewrites to backend (Coolify via RAILWAY_API_BASE)
│   ├── eslint.config.mjs      # ESLint flat config (next/core-web-vitals)
│   └── tsconfig.json          # Strict mode, @/* path alias
│
├── backend/                   # Express 5 API (JavaScript, CommonJS)
│   ├── index.js               # Server, routes, Pandoc orchestration
│   ├── grid-system.js         # GridSystem class (margins, typography, LaTeX)
│   ├── templates/             # 8 LaTeX templates
│   │   ├── chicago.latex      # Academic (12pt baseline)
│   │   ├── paperback.latex    # Trade (11pt baseline)
│   │   ├── minimal.latex      # BasicTeX-compatible
│   │   ├── symphony.latex     # Classic academic
│   │   ├── chronicle.latex    # Editorial multi-column
│   │   ├── exhibit.latex      # Modern trade design
│   │   ├── matrix.latex       # Corporate structured
│   │   └── avantgarde.latex   # Experimental creative
│   ├── references/            # Sample .bib for citations
│   └── Dockerfile             # Ubuntu 22.04, Node 18, Pandoc, texlive-xetex (deployed via Coolify)
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
| Frontend framework | Next.js 15.5.4 (React 19, App Router) |
| Frontend language | TypeScript 5 (strict mode) |
| Styling | Tailwind CSS 3.4 with dark design system tokens |
| Build tool | Turbopack (via Next.js) |
| Linting | ESLint 9 (next/core-web-vitals, next/typescript) |
| Backend framework | Express 5.1 |
| Backend language | JavaScript (CommonJS) |
| PDF engine | Pandoc + XeLaTeX |
| Containerization | Docker (Ubuntu 22.04) |
| Auth & database | Supabase (self-hosted via Coolify) |
| Infrastructure | Digital Ocean droplet + Coolify |
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
npm run dev       # Nodemon watch mode (port 4000)
npm start         # Production server
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

The frontend proxies `/api/*` to the backend via Next.js rewrites (configured in `next.config.ts`). Set `RAILWAY_API_BASE` env var to override the backend URL (defaults to `http://localhost:4000`). The env var name is a legacy holdover — it now points to the Coolify-hosted backend on Digital Ocean.

## Architecture & Data Flow

```
User edits Markdown in browser
    → 1s debounce
    → POST /api/compile (proxied via Next.js rewrites)
    → Backend: sanitize inputs, write to temp dir
    → GridSystem calculates geometry/typography
    → Spawn Pandoc with XeLaTeX + selected template
    → (Optional) pandoc-citeproc for bibliography
    → 45s timeout (COMPILE_TIMEOUT_MS)
    → Stream PDF back | Return JSON error with diagnostics
    → Frontend creates object URL, renders in iframe
```

### API Endpoints

- `GET /api/health` — Basic health check
- `GET /api/health/details` — Server capabilities (templates, sizes, presets)
- `GET /api/templates` — Design template registry
- `POST /api/compile` — Compile Markdown to PDF (accepts: markdown, template, pageSize, marginPreset, compileMode, safeMode, title)

### Frontend Routes

| Route | File | Description |
|-------|------|-------------|
| `/` | `app/page.tsx` | Product landing page with hero, features, comparison table, CTA |
| `/app` | `app/app/page.tsx` | Markdown editor with live PDF preview |
| `/docs` | `app/docs/page.tsx` | Author guide, citation help, troubleshooting, requirements check |
| `/pricing` | `app/pricing/page.tsx` | 3-tier pricing (Drafter / Publisher / Studio) with FAQ |
| `/status` | `app/status/page.tsx` | API connectivity diagnostics and server capabilities |
| `/auth/login` | `app/auth/login/page.tsx` | Sign in / sign up (email + GitHub/Google OAuth) |
| `/auth/forgot-password` | `app/auth/forgot-password/page.tsx` | Request password reset email |
| `/auth/reset-password` | `app/auth/reset-password/page.tsx` | Set new password (via reset link) |
| `/auth/callback` | `app/auth/callback/route.ts` | OAuth code exchange (server route) |

## Design System

The frontend uses a **dark-first** design language. All color tokens, shadows, and animations are defined in `tailwind.config.ts` with supporting CSS utilities in `globals.css`.

### Color Tokens

Use these token names in Tailwind classes (e.g., `bg-surface-raised`, `text-accent`, `border-border`).

**Surfaces (dark backgrounds):**
- `surface` — `#0a0a0f` (page background)
- `surface-raised` — `#111118` (cards, panels)
- `surface-overlay` — `#1a1a24` (modals, dropdowns)
- `surface-subtle` — `#22222e` (hover states, code blocks)

**Accent (blue spectrum):**
- `accent` — `#4f8fff` (links, primary actions)
- `accent-hover` — `#6ba1ff`
- `accent-muted` — `#2a4a7f`
- `accent-glow` — `rgba(79,143,255,0.15)` (glow effects)
- `accent-soft` — `rgba(79,143,255,0.08)` (tinted backgrounds)

**Text hierarchy:**
- `text-primary` — `#f0f0f5` (headings, important text)
- `text-secondary` — `#a0a0b0` (body copy)
- `text-tertiary` — `#606070` (labels, captions)
- `text-ghost` — `#404050` (placeholders, disabled)

**Status:**
- `success` / `success-muted` — green (`#34d399`)
- `warning` / `warning-muted` — amber (`#fbbf24`)
- `danger` / `danger-muted` — red (`#f87171`)

**Borders:**
- `border` — `rgba(255,255,255,0.06)` (default dividers)
- `border-subtle` — `rgba(255,255,255,0.03)`
- `border-accent` — `rgba(79,143,255,0.2)` (focus rings, active states)

**Legacy ENS tokens** (`ens-blue`, `ens-dark`, `ens-midnight`, etc.) remain in the config for backward compatibility but should not be used in new code.

### Typography

Three Google Fonts loaded in `layout.tsx`:
- **Space Grotesk** (`--font-display`) — headings, nav, UI labels
- **Source Serif 4** (`--font-body`) — body text, paragraphs
- **IBM Plex Mono** (`--font-mono`) — code, status indicators

Responsive type scale in `globals.css`:
- `.h1` — `clamp(2rem, 3.5vw, 3.5rem)`
- `.h2` — `clamp(1.5rem, 2.5vw, 2.5rem)`
- `.h3` — `clamp(1.25rem, 1.8vw, 1.5rem)`
- Hero size — `clamp(3rem, 6vw, 5.5rem)`

### Shadows

- `shadow-card` / `shadow-card-hover` — card elevation
- `shadow-elevated` — modals, overlays
- `shadow-pill` / `shadow-pill-hover` — accent-glowing buttons
- `shadow-paper` — PDF preview skeuomorphic shadow
- `shadow-glow-accent` / `shadow-glow-success` — colored glow halos

### Animations

- `animate-fade-in` — 0.5s opacity
- `animate-fade-in-up` — 0.6s opacity + translateY
- `animate-fade-in-down` — 0.4s opacity + translateY
- `animate-scale-in` — 0.3s scale
- `animate-shimmer` — 2s infinite gradient sweep
- `animate-pulse-soft` — 2s breathing opacity
- `animate-slide-up` — 0.5s translateY

### CSS Utility Classes (globals.css)

| Class | Purpose |
|-------|---------|
| `.btn-pill` | Base pill-shaped button (rounded-full, transitions) |
| `.btn-primary` | Accent blue button with glow shadow |
| `.btn-secondary` | Bordered ghost button |
| `.btn-ghost` | Transparent text-only button |
| `.card` | Dark raised surface with border and shadow |
| `.input-dark` | Dark form input/select styling |
| `.paper-surface` | Radial-gradient dark desk for PDF preview |
| `.gradient-text` | White→gray gradient text |
| `.gradient-accent-text` | Blue→indigo gradient text |
| `.divider` | Horizontal gradient separator line |
| `.skip-link` | Accessibility skip-to-content link |

## Key Conventions

### File Naming

- **React components**: PascalCase (e.g., `CompileShell.tsx`, `TemplateHelp.tsx`)
- **Data/constants files**: camelCase (e.g., `authorGuide.ts`, `sample.ts`)
- **LaTeX templates**: lowercase (e.g., `chronicle.latex`)
- **Backend modules**: lowercase (e.g., `grid-system.js`, `index.js`)

### Frontend Patterns

- **Client components** use `'use client'` directive; server components are the default
- **State**: React `useState`/`useContext` with `localStorage` persistence (key: `pp-prefs-v1`)
- **Auto-compile**: 1-second debounce with `AbortController` for in-flight cancellation
- **Tooltips**: Rendered via `createPortal` to `document.body`
- **Path alias**: `@/*` maps to `./src/*`
- **Types**: Defined locally at the top of files (e.g., `TemplateKey`, `PageSize`, `MarginPreset`, `CompileMode`)
- **CSS**: Utility-first Tailwind with dark design system tokens (`surface-*`, `accent-*`, `text-*`, `border-*`). Do NOT use legacy `ens-*` tokens in new code.
- **Layout**: Root layout provides sticky `Nav` (blur header with logo, Pricing, Docs, Open Editor CTA) and `Footer` (logo, links, tagline). Pages render between them.
- **Fonts**: Space Grotesk for display, Source Serif 4 for body, IBM Plex Mono for mono — loaded via `next/font/google` in `layout.tsx`.

### Component APIs

**`Button`** (`@/components/Button`):
- `variant`: `'primary'` | `'secondary'` | `'ghost'` (default: `'primary'`)
- `size`: `'sm'` | `'md'` | `'lg'` (default: `'md'`)
- `href`: optional — renders as `<Link>` instead of `<button>`
- Extends `ButtonHTMLAttributes<HTMLButtonElement>`

**`Section`** (`@/components/Section`):
- `variant`: `'default'` | `'raised'` | `'light'` | `'dark'` (default: `'default'`)
- `id`: optional — for anchor links
- Default padding: `py-16 md:py-24`

**`Container`** (`@/components/Container`):
- Centered wrapper: `mx-auto max-w-7xl px-6 md:px-8`

### Backend Patterns

- **CommonJS** module system (`require`/`module.exports`)
- **Temp files**: `fs.mkdtempSync` for isolated compilation, cleaned up after each request
- **PDF streaming**: `fs.createReadStream().pipe(res)` with Content-Disposition header
- **Process spawning**: `child_process.spawn` for Pandoc with timeout (`SIGKILL` after 45s)
- **Error parsing**: Regex extraction of missing citations/packages from stderr
- **Safe mode**: Strips citation syntax for compilation without bibliography processing
- **CORS**: Currently permissive (`origin: true`)

### Grid System

The `GridSystem` class in `backend/grid-system.js` implements:

- **Baseline grids**: 12pt (academic/basic) or 11pt (trade/editorial/corporate/creative) depending on template
- **Golden-ratio typographic scale** (multiplier 1.618): heading sizes derived from baseline
- **Margin presets**: 7 presets (minimal→generous) expressed as grid-unit multiples
- **LaTeX generation**: Produces `\geometry{}` commands and typography preamble

### Git Conventions

- **Branches**: `main` (production), `develop` (integration), `feature/*`, `bugfix/*`, `hotfix/*`
- **Commits**: Conventional Commits format (`feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `perf:`, `test:`, `chore:`)
- **Commit template**: `.gitmessage` at repo root

## Pricing Model

Defined in `frontend/src/app/pricing/page.tsx`. Currently informational (no paywall enforced).

| Tier | Price | Key differentiators |
|------|-------|-------------------|
| **Drafter** | Free | All 8 templates, 3 page sizes, real-time preview, watermarked output |
| **Publisher** | $9.99/mo | No watermark, all 11 page sizes, full quality, citations, priority queue |
| **Studio** | $199 one-time | Lifetime Publisher access, future EPUB/custom fonts/batch export, direct support |

## Environment Variables

### Frontend (Vercel)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Kong API gateway URL (`https://supabase.pageperfect.studio`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key (from Studio → Settings → API) |
| `RAILWAY_API_BASE` | Backend compile API URL (legacy name, points to Coolify-hosted backend) |
| `NEXT_PUBLIC_STRIPE_PRICE_PUBLISHER` | Stripe price ID for Publisher tier |
| `NEXT_PUBLIC_STRIPE_PRICE_STUDIO` | Stripe price ID for Studio tier |

### Backend (Coolify)

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `4000` | Backend server port |
| `MAX_MD_BYTES` | `2097152` (2 MB) | Max Markdown payload size |
| `COMPILE_TIMEOUT_MS` | `45000` | Pandoc compilation timeout |
| `SUPABASE_URL` | — | Supabase Kong API gateway URL |
| `SUPABASE_SERVICE_ROLE_KEY` | — | Supabase service role key (backend only, never expose to client) |
| `STRIPE_SECRET_KEY` | — | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | — | Stripe webhook signing secret |

## Testing

No automated test suite is configured. Testing is manual via the frontend UI. Health check endpoints (`/api/health`, `/api/health/details`) and the `/status` page provide connectivity diagnostics. The `/docs` page includes a `RequirementsCheck` component that runs automated proxy, health, and compile checks.

When adding tests in the future, note that `.gitignore` excludes `test*.pdf` and `*-test.pdf` but preserves `sample*.pdf`.

## Infrastructure & Deployment

### Architecture

```
Digital Ocean Droplet
└── Coolify (self-hosted PaaS)
    ├── Supabase (self-hosted)
    │   ├── Kong API Gateway → https://supabase.pageperfect.studio
    │   ├── Auth (GoTrue)    — email/password + GitHub/Google OAuth
    │   ├── PostgreSQL       — profiles, manuscripts, compile_history
    │   └── Studio           — admin dashboard
    └── Backend (Express/Docker)
        └── PDF compile API  → proxied via Vercel rewrites

Vercel
└── Frontend (Next.js)     → https://pageperfect.studio
```

### Supabase (Self-Hosted via Coolify)

- **Kong API gateway URL**: `https://supabase.pageperfect.studio` (port 8000 internally, reverse-proxied via Coolify)
- **Auth providers**: Email/password, GitHub OAuth, Google OAuth
- **OAuth callback URL** (set in GitHub/Google OAuth app settings): `https://supabase.pageperfect.studio/auth/v1/callback`
- **Site URL** (set in Supabase Auth config): `https://pageperfect.studio`
- **Redirect URLs** (set in Supabase Auth config): `https://pageperfect.studio/auth/callback`
- **Database tables**: `profiles`, `manuscripts`, `compile_history` (see `frontend/src/lib/database.types.ts`)

### Deployment

- **Frontend**: Deploys to Vercel from the `frontend/` directory. Auto-deploys on push to `main`.
- **Backend**: Deploys via Coolify on a Digital Ocean droplet from the `backend/` directory via Docker.
- **Supabase**: Self-hosted on the same Digital Ocean droplet via Coolify. Managed through Supabase Studio.
- Environment variables are configured in Vercel dashboard (frontend) and Coolify dashboard (backend + Supabase).

## Important Files for Common Tasks

| Task | Key Files |
|------|----------|
| Editor UI changes | `frontend/src/app/app/CompileShell.tsx` |
| Add/modify templates | `backend/templates/*.latex`, template registry in `backend/index.js` |
| Grid/typography changes | `backend/grid-system.js` |
| API route changes | `backend/index.js` |
| Landing page | `frontend/src/app/page.tsx` |
| Pricing page | `frontend/src/app/pricing/page.tsx` |
| Design system tokens | `frontend/tailwind.config.ts` |
| CSS utilities & global styles | `frontend/src/app/globals.css` |
| Nav & Footer / layout | `frontend/src/app/layout.tsx` |
| API proxy config | `frontend/next.config.ts` |
| Reusable UI components | `frontend/src/components/` |
| Auth & user management | `frontend/src/lib/auth-context.tsx`, `frontend/src/lib/supabase.ts` |
| Auth pages (login, reset) | `frontend/src/app/auth/` |
| Supabase DB schema types | `frontend/src/lib/database.types.ts` |
| Status/health diagnostics | `frontend/src/app/status/StatusClient.tsx`, `frontend/src/app/docs/RequirementsCheck.tsx` |
