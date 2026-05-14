# architecture-rules.md

Architectural invariants for PagePerfect's `frontend/src/` and `backend/`. Canonical source for file-level rules; `projects/pageperfect/ARCHITECTURE.md` is the canonical source for system design.

## Invariants

### Frontend routes (Next.js 15, App Router)

- App Router only. API-proxy and OAuth-callback routes live at `frontend/src/app/.../route.ts`.
- Route handlers export named HTTP verbs (`GET`, `POST`, etc.). No default exports for handlers.
- Default exports are reserved for `page.tsx` / `layout.tsx` files as Next.js requires.
- The frontend does not own the API. `/api/*` proxies to the Express backend via `next.config.ts` rewrites (`API_BASE_URL`). Do not add server-side mutation logic to the Next app — it belongs in `backend/`.
- Every server-side fetch validates external input before use (Zod or hand-rolled — pick one per module, do not mix in the same file).

### Backend routes (Express 5, CommonJS)

- Route modules live under `backend/routes/<domain>.js`. They are mounted from `backend/index.js`. Do not inline new domains in `index.js` — extract to `routes/`.
- Every route that mutates state validates input before touching anything (size caps, type checks, allowlist regex for identifiers).
- Every route that performs work has an explicit rate-limit decision: which limiter, which key. The defaults are `20 compiles/min/IP` and `120 general/min/IP`, Redis-backed when available. If a route opts out, comment why.
- `helmet` and the CORS allowlist (known origins + Vercel preview domains) are non-negotiable middleware — do not bypass per-route.
- Webhook routes must register `express.raw({ type: 'application/json' })` *before* JSON parsing so signature verification sees the untouched body (see `backend/routes/stripe.js:13`).

### Components

- Server Components by default. Client Components (`"use client"`) only where hooks, event handlers, or browser APIs are required.
- Co-locate component-specific files under the component directory. Do not spread implementation across unrelated folders.
- Single-export files for components. Named exports for utilities and hooks.

### Data access (PocketBase)

- All persistent data goes through PocketBase. Do not introduce a parallel ORM or a direct SQLite client.
- Frontend reads/writes use the typed client from `frontend/src/lib/pocketbase.ts` (`createClient()`). Collection types live in `frontend/src/lib/database.types.ts` — regenerate, do not edit by hand.
- Backend reads/writes that require elevated permissions go through the PocketBase admin SDK using `POCKETBASE_ADMIN_EMAIL` / `POCKETBASE_ADMIN_PASSWORD`. Admin credentials never reach the client.
- Schema changes ship via the PocketBase Admin UI. **Verified 2026-05-14:** no `pb_migrations/` directory exists at the repo root or inside `backend/pageperfect-pb-custom/` (only `Dockerfile`, `go.mod`, `go.sum`, `main.go`). The custom Go build does not ship checked-in migrations — collection schemas are managed through the PocketBase Admin UI on the running instance. `write-migration` skill currently has no target directory to write into. <!-- TODO (sharpened 2026-05-14): if migrations-as-code becomes a requirement (e.g. for staging/prod parity), operator decides target path (likely `backend/pageperfect-pb-custom/pb_migrations/`) and `write-migration` skill gains a real output location. -->
- When a schema change lands, update `frontend/src/lib/database.types.ts` in the same PR.

### Authentication (PocketBase JWT)

- Auth logic on the frontend lives in `frontend/src/lib/auth-context.tsx` and `frontend/src/lib/pocketbase.ts`. Never reimplement in components or routes.
- The browser stores the PocketBase auth token via the SDK's default `authStore` (localStorage-backed). The token is sent to the backend as `Authorization: Bearer <token>` — not as a cookie.
- There is no cookie-based session and no CSRF middleware. State-changing endpoints rely on bearer-token auth + CORS allowlist. If a new endpoint accepts credentials, prefer the bearer-token path; do not introduce cookies without an ADR.
- The backend re-verifies user tier against the PocketBase admin SDK at compile-time inside the worker (`backend/compile-worker.js`). Do not trust a tier value from the enqueue payload.
- #4 Security VETO on any change under `frontend/src/lib/auth-context.tsx`, `frontend/src/lib/pocketbase.ts`, or backend admin-token plumbing.

### Compile pipeline (Pandoc + Typst)

- The compile pipeline treats user input as hostile. Defense is layered: sanitiser (`backend/latex-sanitizer.js`), normaliser (`backend/text-normalizer.js`), Pandoc with `-raw_tex` and `-raw_attribute` disabled, Typst with no shell-escape primitive.
- Spawns (`child_process.spawn`) must enforce: CWD restricted to the per-job temp dir (`pp-worker-*` under `/tmp`), `SAFE_SPAWN_ENV` minimal environment, and a 45 s SIGKILL timeout (`COMPILE_TIMEOUT_MS`).
- Each compile job runs in its own `fsp.mkdtemp` directory. The orphan sweeper at boot + hourly is the only thing that should be cleaning unowned temp dirs.
- Body-size caps are enforced at the route layer: 2 MB markdown (`MAX_MD_BYTES`), 10 MB .docx (`MAX_DOCX_BYTES`), 5 MB JSON.
- Custom font directory IDs must be validated as UUIDs before being passed to `--font-path`. Font names must match the allowlist regex `[A-Za-z0-9 \-.]+`. Colours must match strict `#RRGGBB`.
- The watermark decision is re-evaluated inside the worker (`backend/watermark-typst.js`), not trusted from the enqueue payload.
- Stderr leaving the backend goes through `backend/compile-utils.js` to strip container paths before client response.
- Docker container runs as non-root `ppuser`; `npm run docker:run` ships `--cap-drop=ALL`, `--security-opt=no-new-privileges`, `--read-only`, `--tmpfs`, `--memory=1g`, `--pids-limit=100`. Do not weaken these flags in PRs.

### Job queue (BullMQ + Redis)

- All compile work flows through BullMQ. Default concurrency is `COMPILE_CONCURRENCY=3`. Priority lanes: Publisher/Studio = 1, Drafter = 5.
- Preview jobs use deterministic IDs (manuscript-scoped) so a newer preview supersedes an older one. Do not assign random IDs to preview jobs.
- When Redis is unavailable the system falls back to a sync compile path capped at 2 concurrent jobs (`backend/index.js`). Treat this as degraded mode — do not add features that *require* the queue without preserving the fallback.
- Result persistence goes through `backend/result-store.js` (local FS for single-node, S3-compatible for multi-replica). Do not write PDFs to arbitrary paths.

### Payments (Stripe)

- Stripe code is confined to `frontend/src/lib/stripe.ts` (Stripe.js loader + `createPayment`) and `backend/routes/stripe.js` (server endpoints).
- Webhook handlers verify the signature *before* any side effect. The canonical pattern is `stripe.webhooks.constructEvent(rawBody, signature, secret)` inside an `express.raw()` route (`backend/routes/stripe.js:21`). No exceptions.
- Tier enforcement happens at enqueue and at compile time. The compile worker re-verifies tier via the PocketBase admin SDK; the enqueue payload is untrusted.
- Publisher-tier per-manuscript binding (14-day window) is enforced in `backend/entitlements.js` against Redis (primary) or an in-memory fallback. Do not bypass.
- #30 Payment systems + #4 Security convened on every payment change.

### Webhook signature verification (Stripe + Lulu)

- Every inbound webhook handler verifies the signature before reading the body for business logic. No exceptions.
- Lulu xPress webhooks use HMAC-SHA256 over the raw body with `LULU_CLIENT_SECRET`. The header is `Lulu-HMAC-SHA256`. The canonical verifier is `verifyWebhook(rawBody, signature)` in `backend/lulu.js` (uses `crypto.timingSafeEqual` against equal-length buffers; returns `false` for malformed input rather than throwing).
- Stripe webhooks use `stripe.webhooks.constructEvent(rawBody, sigHeader, STRIPE_WEBHOOK_SECRET)`. The route must mount `express.raw({ type: 'application/json' })`.
- New webhook handlers reuse the same patterns. Do not roll a hand-written HMAC comparison with `===`.

### Manuscript privacy (session-scoped data)

- Manuscripts are session-scoped, not long-term storage. The product promises this and the privacy page describes it; the code must match.
- Authenticated users' manuscripts are saved to the PocketBase `manuscripts` collection on a 5 s debounce. On sign-out, `purgeUserManuscripts()` deletes them.
- The backend sweeper deletes manuscripts not updated in 24 h (runs every 6 h from `backend/index.js`).
- Manuscript bodies must never be logged in full. Log size, hash, template, tier, jobId — never the prose. The structured logger (`backend/logger.js`) is the only allowed log path; `console.log` for new code is a review-blocker.
- Temp dirs from the compile pipeline are cleaned per-job and swept hourly. Anything that needs the body for longer must justify itself in an ADR.

### Dependencies

- No new top-level dependency without explicit user approval. Justify with: what it replaces, why a vendored copy won't work, bundle / install-size impact.
- Prefer the standard library and existing dependencies.
- Never add a dependency solely to avoid writing 30 lines of code.

### File size

- 600-line limit (`memory/PROCESS.md`). Applies to `frontend/src/`, `backend/`, `memory/`, `projects/`, and `.claude/skills/`.
- Split by responsibility, not by line count. A 580-line file doing one thing beats three 200-line files doing thirds of it.

### Naming

- Frontend: `PascalCase.tsx` for components; `kebab-case.ts` for utilities and modules under `frontend/src/lib/`.
- Backend: `lowercase-kebab-case.js` for all modules (e.g. `grid-system.js`, `latex-sanitizer.js`, `result-store.js`).
- Typst templates: lowercase, single word, `.typ` suffix (`chronicle.typ`).
- Exports: named over default. Default exports only where Next.js or the module system requires them.
- No abbreviations that aren't industry-standard (`auth`, `api`, `pdf` OK; `usr`, `mgr` not OK).

### Logging

- Structured logging only, via `backend/logger.js` (Pino). Use level discipline: `error` for failures the operator must see, `warn` for recoverable anomalies, `info` for lifecycle events, `debug` for diagnostics.
- Never log secrets, raw manuscripts, JWTs, Stripe/Lulu webhook payloads in full, or PocketBase admin tokens. Log identifiers and shapes.
- HTTP request logging goes through `morgan` (already wired in `backend/index.js`); do not duplicate per-route.

## Hard bans

- No `bg-white`, `bg-slate-*`, or glassmorphism utilities on marketing surfaces. See `projects/pageperfect/DESIGN.md` for the Swiss-Ogilvy canon.
- No WebGL / Vanta / heavy-canvas effects on marketing pages — performance veto.
- No `fetch` from untrusted input without validation + rate-limit + error handling.
- No `eval`, no `Function(...)`, no dynamic `require`.
- No `any` as a lazy escape hatch in TypeScript. Use `unknown` and narrow.
- No raw `console.log` in new backend code — use `backend/logger.js`.
- No bypass of `helmet`, CORS allowlist, rate-limiters, or webhook signature verification on a "just for now" basis.
- No weakening of Docker hardening flags (`--cap-drop=ALL`, `--read-only`, memory/pids limits) without an ADR.
- No persistence of manuscript bodies beyond the session-scoped lifecycle (24 h sweeper).

## When this file gets updated

- A new invariant emerges and `#15 Staff engineer` agrees it applies project-wide.
- An ADR lands under `projects/pageperfect/decisions/` that changes a rule.
- A CORRECTIONS.md entry upgrades a lesson to a rule.

## Changelog

- 2026-05-14: Rescoped from AG (Allowance Guard) stack to PagePerfect actual stack (Express 5, BullMQ, PocketBase, Pandoc+Typst, Stripe, Lulu xPress).
