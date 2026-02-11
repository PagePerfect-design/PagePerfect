# CLAUDE.md — PagePerfect

## Project Overview

PagePerfect is a PDF generation system that converts Markdown manuscripts to professionally typeset PDFs using XeLaTeX. It implements Josef Müller-Brockmann's grid system principles (baseline grids, golden-ratio typography, proportional spacing). The app is a loosely-coupled monorepo with a React/Next.js frontend and a Node.js/Express backend.

## Repository Structure

```
PagePerfect/
├── frontend/                  # Next.js 15 React app (TypeScript)
│   ├── src/
│   │   ├── app/               # App Router pages
│   │   │   ├── page.tsx       # Landing page (/)
│   │   │   ├── layout.tsx     # Root layout with Google Fonts
│   │   │   ├── globals.css    # Global styles & CSS tokens
│   │   │   ├── app/           # Editor (/app)
│   │   │   │   ├── CompileShell.tsx   # Main editor component (~1030 lines)
│   │   │   │   ├── TemplateHelp.tsx   # Template help tooltip
│   │   │   │   ├── TemplateNotes.tsx  # Template-specific notes
│   │   │   │   ├── authorGuide.ts     # Author guide content
│   │   │   │   └── sample.ts          # Sample manuscript
│   │   │   ├── docs/          # Documentation (/docs)
│   │   │   └── status/        # Health check (/status)
│   │   └── components/        # Reusable UI (Button, Container, Section, etc.)
│   ├── public/                # Static assets & PWA manifest
│   ├── tailwind.config.ts     # Custom theme (ENS-inspired palette)
│   ├── next.config.ts         # API rewrites to backend
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
│   └── Dockerfile             # Ubuntu 22.04, Node 18, Pandoc, texlive-xetex
│
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
| Styling | Tailwind CSS 3.4 with custom theme tokens |
| Build tool | Turbopack (via Next.js) |
| Linting | ESLint 9 (next/core-web-vitals, next/typescript) |
| Backend framework | Express 5.1 |
| Backend language | JavaScript (CommonJS) |
| PDF engine | Pandoc + XeLaTeX |
| Containerization | Docker (Ubuntu 22.04) |
| Frontend hosting | Netlify |
| Backend hosting | Railway |

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

The frontend proxies `/api/*` to the backend via Next.js rewrites (configured in `next.config.ts`). Set `RAILWAY_API_BASE` env var to override the backend URL (defaults to `http://localhost:4000`).

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
- **CSS**: Utility-first Tailwind with custom tokens (ens-blue, ens-dark, etc.)

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

- **Baseline grids**: 12pt (academic) or 11pt (trade) depending on template
- **Golden-ratio typographic scale** (multiplier 1.618): heading sizes derived from baseline
- **Margin presets**: 7 presets (minimal→generous) expressed as grid-unit multiples
- **LaTeX generation**: Produces `\geometry{}` commands and typography preamble

### Git Conventions

- **Branches**: `main` (production), `develop` (integration), `feature/*`, `bugfix/*`, `hotfix/*`
- **Commits**: Conventional Commits format (`feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `perf:`, `test:`, `chore:`)
- **Commit template**: `.gitmessage` at repo root

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `4000` | Backend server port |
| `MAX_MD_BYTES` | `2097152` (2 MB) | Max Markdown payload size |
| `COMPILE_TIMEOUT_MS` | `45000` | Pandoc compilation timeout |
| `RAILWAY_API_BASE` | `http://localhost:4000` | Backend URL for frontend proxy |

## Testing

No automated test suite is configured. Testing is manual via the frontend UI. Health check endpoints (`/api/health`, `/api/health/details`) and the `/status` page provide connectivity diagnostics.

When adding tests in the future, note that `.gitignore` excludes `test*.pdf` and `*-test.pdf` but preserves `sample*.pdf`.

## Deployment

- **Frontend**: Deploys to Netlify from the `frontend/` directory
- **Backend**: Deploys to Railway from the `backend/` directory via Docker
- No CI/CD pipeline; deployments are triggered via platform dashboards
- Environment variables are configured in each platform's dashboard

## Important Files for Common Tasks

| Task | Key Files |
|------|----------|
| Editor UI changes | `frontend/src/app/app/CompileShell.tsx` |
| Add/modify templates | `backend/templates/*.latex`, template registry in `backend/index.js` |
| Grid/typography changes | `backend/grid-system.js` |
| API route changes | `backend/index.js` |
| Landing page | `frontend/src/app/page.tsx` |
| Tailwind theme | `frontend/tailwind.config.ts` |
| API proxy config | `frontend/next.config.ts` |
| Reusable UI components | `frontend/src/components/` |
| Global styles | `frontend/src/app/globals.css` |
