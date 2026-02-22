# TRANSFORMATION COUNCIL — PagePerfect

**Date:** 2026-02-22
**Verdict:** Grade D. Fixable. The engine is real. The wrapper is dishonest.

---

## SECTION 1 — Brutal Diagnosis

Top 20 reasons this app is Grade D, ranked by damage severity.

| # | Issue | Severity | Evidence | Impact |
|---|-------|----------|----------|--------|
| 1 | **Hero says "KDP-compliant" but free tier exports watermarked PDFs unusable for KDP** | FATAL | `Hero.tsx:18`, `watermark.js` | Users download, discover watermark, feel lied to. Destroys trust on first interaction. |
| 2 | **Pricing FAQ says free tier is "fully functional"** — it is not | FATAL | `pricing/page.tsx:72-73` | FTC deceptive advertising exposure. Users who read FAQ believe free = usable for KDP. |
| 3 | **No global error handler** — unhandled async errors hang connections forever | FATAL | `index.js` has no `app.use((err,req,res,next))` | Production will silently hang on random errors. No logging, no recovery, no response. |
| 4 | **In-memory jobResults Map lost on every restart** | FATAL | `index.js:74-92` — plain `new Map()`, no Redis persistence | Every backend deploy loses all in-flight PDFs. Users see "Result not found." |
| 5 | **Preflight checks don't block export** | HIGH | `CompileShell.tsx:1659-1661` | Users export non-KDP-compliant PDFs, blame PagePerfect when KDP rejects them. |
| 6 | **Typography analysis and compile log analysis are orphaned** | HIGH | `typography-assurance.js:301-344`, `book-engineering.js:296-352` — defined, never called | Expensive quality systems built but invisible to users. Zero ROI on development effort. |
| 7 | **3,075-line God Component** — `CompileShell.tsx` | HIGH | 50+ useState hooks, 9 debounced actions, no decomposition | Every state change re-renders entire editor. Performance degrades on slow machines. |
| 8 | **No uncaught exception/rejection handler** | HIGH | Missing `process.on('uncaughtException')` in `index.js` | Silent crashes in production. No logging. Process dies, Docker restarts, users lose work. |
| 9 | **Genre detection built but never surfaces recommendations** | HIGH | `CompileShell.tsx:283-346` — detects 7 genres, result shown only in portal stage | User pastes screenplay, gets default template instead of Cinema. Missed "wow" moment. |
| 10 | **No post-payment CTA** — user completes Stripe checkout, sees banner, no "Go to Editor" | HIGH | `pricing/page.tsx:429-437` | Completed purchases abandoned because user doesn't know next step. |
| 11 | **Pricing table claims "Fast mode" for free tier** — users can select Full quality | MEDIUM | `pricing/page.tsx:58` vs actual editor behavior | Pricing page contradicts actual product behavior. |
| 12 | **Journal articles never link to /app or templates** | MEDIUM | `articles-1.ts` — 10 essays, zero CTAs | SEO traffic reads about typography theory, never converts. |
| 13 | **TeX Live not version-pinned in Dockerfile** | MEDIUM | `Dockerfile:30-37` — `apt-get install texlive-*` | PDF output can silently change between deployments. No reproducibility guarantee. |
| 14 | **Golden ratio claim is false** — heading scale multipliers don't follow phi | MEDIUM | `grid-system.js:32-38` — scale is 2.25/1.75/1.375, not phi-based | Marketing claims "golden-ratio typography" but math doesn't check out. |
| 15 | **Rate limiting falls back to per-process in-memory when Redis unavailable** | MEDIUM | `index.js:410-420` | On multi-process deployment, each process gets independent limits. Actual rate = N * limit. |
| 16 | **Error translation regex broken** — `$1` backrefs produce literal "$1" | MEDIUM | `CompileShell.tsx:180-206` | Error messages show "$1" instead of the actual problematic command. |
| 17 | **No build manifest saved with PDFs** | MEDIUM | `provenance.js:99-106` — hard-codes version, doesn't capture runtime versions | Cannot reproduce a PDF. Cannot debug "my PDF looked different last week." |
| 18 | **Sample manuscript is academic nonfiction** — alienates fiction/memoir users | MEDIUM | `sample.ts` — Bristol maritime trade with `[@Finch2023]` citations | Fiction writers (largest market) see an academic sample and think "this isn't for me." |
| 19 | **Comparison section uses fabricated "bad" formatting** | LOW | `Comparison.tsx:35-56` — hand-styled gray text with fake squiggly underlines | Feels manipulative. Not a real Word export. |
| 20 | **Crop mark CSS classes defined but never used** | LOW | `globals.css:274-292` | Dead code. Minor maintenance debt. |

---

## SECTION 2 — God-Tier Standard Definition

What A+++ looks like across every dimension.

### Product Clarity
- Every page answers "what does this do, who is it for, and why should I pay" in under 5 seconds.
- Free tier limitations are visible BEFORE the user invests effort, not after.
- Template names map to genres ("Fiction Paperback"), not design philosophies ("Symphony").
- The sample manuscript matches the user's genre, not the founder's taste.

### UX
- First compile happens within 60 seconds of landing on `/app`. Zero configuration required.
- Error messages name the problem, the file, and the fix — never "Unknown command $1."
- Watermark status is visible in the preview iframe, not discovered after download.
- Post-payment flow has exactly one next step: "Open Editor."
- Genre detection auto-selects the right template with a visible confidence badge.

### Technical Architecture
- Backend survives restart without losing any user's work. Job results persisted to Redis.
- Global error handler catches every unhandled exception and logs structured JSON.
- `CompileShell.tsx` decomposed into <500-line components with clear data flow.
- Quality analysis systems (typography scoring, compile log analysis, lint) are wired into the compile response.
- TeX Live version pinned. Every PDF includes a build manifest.

### Performance
- Compile latency: p50 < 8s, p95 < 20s, p99 < 35s for a 300-page manuscript.
- Editor re-render on state change: < 16ms (one frame).
- Landing page LCP: < 1.5s. No layout shift. No blocking fonts.

### Security
- LaTeX injection detection already strong (14 patterns). Maintain.
- Add `process.on('uncaughtException')` and `process.on('unhandledRejection')`.
- Pin TeX Live version to prevent supply chain drift.
- Add `--max-old-space-size` to Node entrypoint.

### Quality of Output
- Every export includes compile log analysis (overfull/underfull hbox count).
- Typography score (A-D grade) visible in export overlay.
- Preflight failures block export with clear explanation of what failed.
- Build manifest embedded in PDF metadata.

### Reliability
- Zero data loss on restart. Redis-backed job results with 10-minute TTL.
- Graceful degradation when PocketBase is down (cache last-known tier for 1 hour).
- Orphan temp dir sweeper already exists — verify it runs.

### Monetization
- Watermark visible in preview from first compile. No surprise after download.
- Post-payment redirect to editor with active tier badge.
- 14-day Publisher window starts on first export, documented clearly.
- Kill the "Fast mode" vs "Full quality" fiction — both tiers compile the same way.

### Brand Authority
- Journal articles end with CTAs linking to specific templates.
- Docs include API response examples, not just endpoint paths.
- Engineering section on landing page includes real compile time metrics, not just feature lists.

---

## SECTION 3 — Persona Reports

### PERSONA 1 — Chief Product Visionary

**Top 5 Critical Failures:**
1. Product promises KDP-ready output but delivers watermarked PDFs to 100% of first-time users. This is not a limitation — it's a lie.
2. Template names serve the designer's ego, not the user's intent. "Symphony" means nothing. "Classic Academic" means everything.
3. Free tier is positioned as "fully functional" when it's actually a degraded preview. Users who invest 30 minutes formatting discover the watermark at the END.
4. No post-payment activation moment. User pays $19.99 and lands on a static success banner with no direction.
5. The sample manuscript is academic nonfiction about Bristol maritime trade. The largest self-publishing market is fiction/romance. First impression: "this is for professors."

**Systemic Blind Spots:**
- Founder assumes typography quality is the value proposition. Users want "no KDP rejection." Those are different products.
- 15 templates presented simultaneously = choice paralysis. Auto-detect genre + recommend 1 template = conversion.

**Hidden Risks:**
- Negative reviews from watermark surprise will spread on r/selfpublish, KDP forums, and Twitter. One viral "PagePerfect watermarks your book without warning" post kills the brand.

**Immediate Corrections:**
- Show watermark badge on preview iframe from first compile.
- Change Hero copy: "Design your book for free. Export KDP-ready PDFs from $19.99."
- Add fiction sample manuscript alongside academic sample.
- Rename templates to genre-first names.

**Long-term Architectural Shifts:**
- Position as "compliance engine" not "typesetting tool." Compliance is measurable. Typography is subjective.
- Make preflight the hero feature. "PagePerfect guarantees your PDF passes KDP review on the first upload."

**Non-negotiables:**
- Users must know about the watermark BEFORE they invest effort formatting.
- Post-payment must redirect to editor with active tier.

---

### PERSONA 2 — UX & Interaction Perfectionist

**Top 5 Critical Failures:**
1. 3,075-line `CompileShell.tsx` is a maintainability catastrophe. 50+ state variables, 9 debounced compile triggers, no component decomposition.
2. Genre detection detects 7 genres with reasonable accuracy but the result is shown for 800ms in the portal stage and never referenced again. The Design stage doesn't show which template was recommended or why.
3. Error messages show raw regex artifacts. `$1` literals instead of captured command names. Users see "Unknown command $1" and have no idea what's wrong.
4. 9 independent debounce timers mean changing template + margins + page size within 3 seconds fires 3 separate API requests. Only the last one matters. The first two waste server resources and can return stale results.
5. Export flow: user clicks "Download" → watermarked PDF downloads → amber banner appears AFTER download with "Upgrade" link. The damage (wasted time, broken expectation) is already done.

**Systemic Blind Spots:**
- No loading skeleton for the preview iframe. User sees white rectangle for 3-8 seconds during first compile.
- No "undo" for template changes. User switches from Paperback to Avant-Garde, dislikes it, has to remember what they had before.

**Hidden Risks:**
- On mobile, the editor is barely functional. 3,075-line component with heavy state means slow renders on phones. No responsive adaptation of the split-pane layout.

**Immediate Corrections:**
- Centralize all compile triggers into a single `useCompileQueue` hook with coalesced debounce.
- Show watermark indicator on preview iframe (not after download).
- Fix error translation regex — replace `$1` placeholders with actual regex capture groups.
- Add loading skeleton to preview pane.

**Long-term Architectural Shifts:**
- Decompose `CompileShell.tsx` into: `<Portal>`, `<DesignStudio>`, `<PreviewPane>`, `<ExportOverlay>`, `<SettingsPanel>`.
- Each sub-component owns its own state. Parent passes only manuscript text and compile results.

**Non-negotiables:**
- Error messages must name the problem in plain English with no code artifacts.
- No more than one API request per user action.

---

### PERSONA 3 — Principal Systems Architect

**Top 5 Critical Failures:**
1. `jobResults` is a plain `new Map()` in `index.js:74`. Every backend restart (deploy, crash, OOM) loses ALL pending PDF results. Users see "Result not found or expired." This is a data loss bug, not a feature gap.
2. No global Express error handler. 43 routes, most with try-catch, but any unhandled async throw hangs the connection forever. No timeout, no response, no log entry.
3. No `process.on('uncaughtException')` or `process.on('unhandledRejection')`. Unhandled promise rejection = silent crash. Docker restarts. Users lose in-flight compiles.
4. `index.js` is 2,460 lines containing ALL routing, middleware, Stripe webhooks, Lulu integration, queue management, auth, and compilation. This is a monolith that will resist safe refactoring.
5. BullMQ `removeOnComplete: { count: 200 }` means completed jobs are purged from Redis after 200 completions. If the in-memory Map misses the result (restart), there's no fallback to Redis. The PDF is gone.

**Systemic Blind Spots:**
- Font upload cleanup uses `setTimeout(() => fs.rmSync(...), 3600000)` — if server restarts before timeout fires, uploaded font files leak to disk forever. The orphan sweeper at `index.js:102-123` doesn't cover the custom fonts directory.
- Batch compile archive errors after headers are sent produce no error message to the user. They get an incomplete ZIP with no indication of failure.

**Hidden Risks:**
- Scaling to 2+ backend instances breaks everything. `jobResults` Map is per-process. Job enqueued on Instance A, result delivered from Instance B — result not found.
- Rate limiting falls back to per-process in-memory when Redis is unavailable. Each process independently allows 20 compiles/min. With 3 processes, actual limit is 60/min.

**Immediate Corrections:**
1. Add global error handler before `app.listen()`.
2. Add `process.on('uncaughtException')` and `process.on('unhandledRejection')`.
3. Persist jobResults to Redis: `redis.setex('pp:result:' + jobId, 600, JSON.stringify(result))`.
4. Add `--max-old-space-size=512` to Dockerfile CMD.

**Long-term Architectural Shifts:**
- Extract route groups into separate files: `routes/compile.js`, `routes/stripe.js`, `routes/lulu.js`, `routes/analysis.js`.
- Replace in-memory Map with Redis-backed result store.
- Pin TeX Live version via `tlmgr` in Dockerfile.

**Non-negotiables:**
- Zero data loss on restart.
- Every error logged with structured JSON.
- Every route has explicit error handling.

---

### PERSONA 4 — Security & Trust Engineer

**Top 5 Critical Failures:**
1. No `process.on('uncaughtException')` — crashes are silent. Attacker could trigger crash via malformed input and cause DoS via repeated restarts.
2. TeX Live not version-pinned. Supply chain risk: compromised TeX package could execute code during compilation. LuaLaTeX runs Lua code by design.
3. Dockerfile runs `fc-cache` and `luaotfload-tool` as root before creating non-root user. Font cache is root-owned. If ppuser can write to font cache dir, privilege escalation vector.
4. CORS regex `page-perfect-[a-z0-9]{9}-[a-z0-9-]+\.vercel\.app` allows any team slug with hyphens. Attacker with Vercel account could register matching subdomain.
5. Stripe webhook idempotency uses in-memory Set with no thread safety. Race condition on concurrent events (theoretical, low practical risk).

**Systemic Blind Spots:**
- LaTeX injection detection logs warnings but does NOT block compilation. Relies entirely on Pandoc's `-raw_tex` flag. If Pandoc changes behavior in a future version, injection detection becomes the only defense — and it only warns.
- No Content Security Policy headers. XSS in error messages (if LaTeX output contains HTML-like strings) could execute in browser.

**Hidden Risks:**
- Custom font upload accepts any file with a font extension. No magic byte validation. A malformed font file could crash LuaLaTeX or exploit a fontforge vulnerability.
- `--resource-path` constrains Pandoc to temp dir, but LuaLaTeX's `\input` search path may not be constrained if Pandoc passes it through.

**Immediate Corrections:**
1. Add process crash handlers.
2. Make injection detection block (not just warn) when patterns detected.
3. Add CSP headers via helmet configuration.
4. Validate font file magic bytes on upload.

**Long-term Architectural Shifts:**
- Add seccomp profile to Docker container.
- Add `--network none` to container runtime for compile-only workloads.
- Consider read-only root filesystem with tmpfs for /tmp.

**Non-negotiables:**
- Every security warning must block, not just log.
- Font uploads validated at byte level.
- TeX Live pinned to specific release.

---

### PERSONA 5 — Performance & Infrastructure Engineer

**Top 5 Critical Failures:**
1. `CompileShell.tsx` at 3,075 lines with 50+ useState hooks. Every state change triggers full component re-render including preview iframe. On a 2020 MacBook Air, toggling a dropdown causes visible lag.
2. No `--max-old-space-size` on Node process. Under heavy load, Node heap grows unbounded until OOM killer strikes.
3. Preview iframe reloads entire PDF on every compile. No delta rendering. 300-page PDF = 5MB download on every keystroke (after debounce).
4. Three Google Fonts loaded on every page: Inter Tight (5 weights), Source Serif 4 (variable), IBM Plex Mono (2 weights). Total: ~400KB of font files blocking first render.
5. Landing page loads framer-motion for scroll animations. Bundle includes full animation library for simple fade-in effects achievable with CSS.

**Systemic Blind Spots:**
- No CDN for compiled PDFs. Every PDF is streamed directly from the backend's temp directory. If 100 users download the same PDF, 100 streams from disk.
- Orphan sweeper runs hourly but doesn't track disk usage. A burst of compilations could fill /tmp before the next sweep.

**Hidden Risks:**
- BullMQ with 3 concurrent workers means 3 simultaneous LuaLaTeX processes. Each can use 500MB+ RAM for large documents. 3 * 500MB = 1.5GB just for compilation, plus Node overhead. On a 2GB droplet, OOM is likely.

**Immediate Corrections:**
1. Add `--max-old-space-size=512` to Dockerfile CMD.
2. Memoize sub-components in CompileShell to prevent cascade re-renders.
3. Add `font-display: swap` if not already set (Next.js does this by default — verify).
4. Monitor /tmp disk usage in health endpoint.

**Long-term Architectural Shifts:**
- Replace iframe PDF reload with incremental page rendering (pdf.js with page-level caching).
- Replace framer-motion scroll animations with CSS `@keyframes` + `IntersectionObserver`.
- Add compile result caching — if manuscript + settings hash matches previous compile, return cached PDF.

**Non-negotiables:**
- Node process must have memory limits.
- Preview must not re-download entire PDF on settings change.

---

### PERSONA 6 — Growth & Monetization Strategist

**Top 5 Critical Failures:**
1. Watermark surprise destroys the free-to-paid conversion funnel. User invests 30 minutes formatting, downloads watermarked PDF, feels punished. Conversion happens through VALUE, not through traps.
2. No post-payment activation. User pays $19.99, sees success banner, doesn't know what to do. No redirect to editor. No "your manuscript is unlocked" screen.
3. Pricing table lies about free tier capabilities ("Fast mode" — actually Full quality is available). Creates support tickets and erodes trust.
4. Journal articles are SEO assets that never convert. 10 essays about typography theory with zero CTAs, zero links to `/app`, zero links to specific templates.
5. "14 days of unlimited re-exports" is ambiguous. When does the clock start? Can you change the manuscript? What happens on day 15?

**Systemic Blind Spots:**
- No analytics events. No way to measure: landing → editor → compile → download → upgrade funnel. Flying blind on conversion.
- No email capture. Free users come, compile, leave. No re-engagement channel.

**Hidden Risks:**
- $199 Studio lifetime pricing at scale: if 1,000 Studio users each compile 50 PDFs/month = 50,000 compiles/month. At ~$0.01/compile (CPU cost), that's $500/month in perpetuity for $199K one-time revenue. Breaks even at month 4. Acceptable only if user acquisition cost < $50.

**Immediate Corrections:**
1. Show watermark badge on preview iframe from first compile. "FREE PREVIEW — Upgrade to remove watermark."
2. Add post-payment redirect: `/app?tier=publisher&activated=true`.
3. Fix pricing table: replace "Fast mode" with "Full quality (preview)" for free tier.
4. Add CTA block to every journal article footer.

**Long-term Architectural Shifts:**
- Implement analytics: Vercel Analytics or PostHog. Track full funnel.
- Add email capture on free tier: "Get notified when your compile is ready" (for async compiles).
- Consider Publisher as subscription ($9.99/month unlimited) instead of per-manuscript. Reduces friction, increases LTV.

**Non-negotiables:**
- Users must know what they're getting BEFORE they invest effort.
- Every paid action must have a clear "what happens next" step.

---

### PERSONA 7 — Editorial & Quality Director

**Top 5 Critical Failures:**
1. Golden ratio claim is mathematically false. Heading scale multipliers (2.25/1.75/1.375) produce ratios of 1.29 and 1.27 — nowhere near phi (1.618). Either fix the math or remove the claim.
2. Typography scoring system exists (`typography-assurance.js`) but users never see their score. A-D grade is calculated, never displayed. What's the point?
3. Compile log analysis extracts overfull/underfull hbox warnings (`book-engineering.js:296-352`) but results are stored and never shown. User has no idea their chapter title is 3pt too wide.
4. No PDF regression tests. Template changes could silently break layouts. No golden-file comparisons. A spacing change in `paperback.latex` could ruin every fiction export.
5. `lintManuscript()` checks for double spaces, bad dashes, long paragraphs, heading hierarchy — never called. Users get no writing quality feedback.

**Systemic Blind Spots:**
- Build manifest doesn't capture actual runtime Pandoc/TeX versions. Cannot reproduce a PDF from 3 months ago.
- No quality gate on export. User can export a PDF with 47 overfull hbox warnings and zero indication that the output is degraded.

**Hidden Risks:**
- A TeX Live update could silently change line-breaking algorithms, producing different page counts for the same manuscript. User's "300-page book" becomes 304 pages. Spine width changes. KDP rejects the PDF.

**Immediate Corrections:**
1. Wire `generateTypographicReport()` into compile status response.
2. Wire `analyzeCompileLog()` results into the export overlay — show overfull/underfull count.
3. Call `lintManuscript()` pre-compile and show warnings in editor sidebar.
4. Fix golden ratio claim or correct the multipliers.

**Long-term Architectural Shifts:**
- Build PDF regression test suite with golden files for all 15 templates.
- Record runtime versions in build manifest.
- Implement quality gate: warn (not block) on exports with >10 overfull hbox warnings.

**Non-negotiables:**
- Every quality claim must be mathematically verifiable.
- Users must see their quality score before export.

---

### PERSONA 8 — Operational Execution Commander

**Top 5 Critical Failures:**
1. `index.js` at 2,460 lines is a deployment risk. Any change to Stripe webhooks requires deploying the same file that handles compilation, health checks, and Lulu integration. Blast radius of every deploy is the entire backend.
2. No staging environment documented. Changes go from local to production. No intermediate validation.
3. Test coverage: 514 lines of tests for 9,098 lines of backend code (5.6% coverage). Security-critical paths tested, but zero integration tests, zero E2E tests.
4. No health check beyond basic "am I alive." No readiness probe that verifies Redis, PocketBase, Pandoc, and LuaLaTeX are all functional.
5. In-memory state (jobResults, Stripe idempotency set, PocketBase token cache) means the backend is NOT stateless. Cannot safely scale horizontally or deploy blue-green.

**Systemic Blind Spots:**
- No alerting. Server crash → Docker restart → nobody notified. Could cycle 50 times before anyone notices.
- No backup strategy for PocketBase SQLite database. Single point of failure for all user data.

**Hidden Risks:**
- Coolify deploys by rebuilding Docker image. If npm registry is down, deploy fails. If Ubuntu mirrors are down, deploy fails. No pre-built images cached.

**Immediate Corrections:**
1. Add readiness health check: `GET /api/health/ready` that verifies Redis + PocketBase + Pandoc + LuaLaTeX.
2. Add structured error logging for every crash.
3. Set up PocketBase backup (SQLite → S3/R2 daily).

**Long-term Architectural Shifts:**
- Extract route groups to separate files.
- Move in-memory state to Redis.
- Add staging environment in Coolify.
- Pre-build Docker images in CI, push to registry, deploy from registry.

**Non-negotiables:**
- Backend must be stateless (all state in Redis/PocketBase).
- Every deploy must be reversible in under 60 seconds.

---

## SECTION 4 — Failure Mode Forecast

| # | Failure Mode | Likelihood | Severity | Early Warning | Prevention |
|---|-------------|------------|----------|---------------|------------|
| 1 | Backend restart loses all in-flight PDFs | CERTAIN (every deploy) | HIGH | Users report "Result not found" after deploy | Persist jobResults to Redis |
| 2 | Unhandled async error hangs connection | HIGH (one bad input) | HIGH | Monitoring shows increasing open connections | Add global error handler |
| 3 | OOM on 3 concurrent large compiles | MEDIUM (3 × 300-page books) | HIGH | Process memory exceeds 1.5GB | Add `--max-old-space-size`, limit concurrent workers |
| 4 | TeX Live update changes page breaks | MEDIUM (Ubuntu repo update) | MEDIUM | Same manuscript produces different page count | Pin TeX Live version |
| 5 | Negative reviews from watermark surprise | HIGH (every free user) | CRITICAL | 1-star reviews on Product Hunt/Reddit | Show watermark before download |
| 6 | PocketBase SQLite corruption | LOW (disk failure) | CRITICAL | Auth fails for all users | Daily backup to object storage |
| 7 | Stripe webhook replay attack | LOW (requires Stripe compromise) | MEDIUM | Duplicate payments processed | Already mitigated by idempotency set |
| 8 | Custom font file exploits LuaLaTeX | LOW (targeted attack) | HIGH | Compile hangs or crashes | Validate font magic bytes |
| 9 | Revenue ceiling: $199 Studio users cost more than they paid | MEDIUM (at 1000+ Studio users) | MEDIUM | Compile volume per Studio user exceeds $0.50/month | Monitor per-tier compute costs |
| 10 | Competitor launches free KDP-compliant export | HIGH (Reedsy already close) | CRITICAL | Market share decline | Make compliance engine the moat, not templates |

---

## SECTION 5 — Architecture Rewrite Plan

Not a rewrite. A refactor. The engine works. Fix the wrapper.

### Data Model (no changes needed)
PocketBase schema is correct: users, manuscripts, compile_history. `pdf_credits` field is deprecated (cleaned up this session). Keep schema stable.

### Core Workflows (fix job persistence)
```
CURRENT:  compile → BullMQ → worker → result in Map() → poll → stream
FIXED:    compile → BullMQ → worker → result in Redis (TTL 10min) → poll → stream
```

### Rendering Pipeline (wire quality systems)
```
CURRENT:  preamble → Pandoc → PDF → (optional Ghostscript) → stream
FIXED:    preamble → Pandoc → PDF → analyzeCompileLog() → generateTypographicReport() → (optional Ghostscript) → stream with quality metadata
```

### Queues / Background Jobs (no changes needed)
BullMQ with Redis is correct. Priority lanes work. Deterministic preview IDs for deduplication work. Keep.

### Storage Strategy (add Redis persistence)
- Job results: Redis with 10-minute TTL (replace Map)
- PDFs: temp dir with orphan sweeper (keep, already works)
- Manuscripts: PocketBase + IndexedDB (keep, session-scoped)
- Custom fonts: temp dir with sweeper (fix: include in orphan sweeper)

### Observability Stack (add)
- Structured logging: pino (already exists, keep)
- Health probes: add `/api/health/ready` with dependency checks
- Process handlers: add `uncaughtException` and `unhandledRejection`
- Error tracking: consider Sentry (defer to 60-day milestone)

### Deployment Model (improve)
- Pin TeX Live in Dockerfile
- Add `--max-old-space-size=512` to CMD
- Pre-build Docker images in CI (defer)
- Add PocketBase SQLite backup (daily to S3/R2)

### Environment Isolation
- Current: local → production (no staging)
- Target: local → staging (Coolify preview) → production

### Secrets Management
- Current: env vars in Coolify dashboard (acceptable for now)
- No secrets in code (verified)
- PocketBase admin credentials server-side only (verified)

### Cost Control
- Monitor per-tier compile volume
- Set BullMQ concurrency based on droplet RAM
- Consider auto-scaling compile workers (defer)

---

## SECTION 6 — UX Rebuild Plan

### Onboarding
**Current:** Drop manuscript → 800ms analysis → summary → "Start designing"
**Fixed:** Drop manuscript → analysis → genre detection badge with template recommendation → "Design with [Template Name]" (pre-selected) → one-click compile

### Empty States
**Current:** White preview pane with no content
**Fixed:** Preview pane shows template thumbnail with "Paste or upload your manuscript to see a live preview"

### Error States
**Current:** Raw regex-translated error with "$1" artifacts
**Fixed:** Error card with: template name, error category (font/citation/formatting), plain English explanation, suggested fix

### Success States
**Current:** PDF appears in iframe. Amber watermark banner appears after download.
**Fixed:** PDF appears in iframe with watermark badge overlay (if Drafter). Green "Ready to export" badge (if Publisher/Studio). Post-download: "Exported successfully" with compile stats.

### Navigation Logic
**Current:** Landing → Editor (full screen, no way back without browser back button)
**Fixed:** Editor has breadcrumb: "PagePerfect > [Manuscript Title]" with link to landing

### Microcopy Standards
- Error messages: "[What happened] — [Why] — [What to do]"
- Button labels: verb + noun ("Export PDF", "Change Template", "Upload Manuscript")
- Status labels: present tense ("Compiling...", "Analyzing...", "Ready")

### Cognitive Load Reduction
- Show 3 recommended templates (based on genre detection) instead of 15
- Collapse advanced settings (margin presets, heading variants) under "Advanced"
- Remove "Safe Mode" label — rename to "Standard" vs "With Citations"

---

## SECTION 7 — 30 / 60 / 90 Day Transformation Roadmap

### Days 1-30: Stop the Bleeding

| Priority | Task | Files | Definition of Done |
|----------|------|-------|-------------------|
| P0 | Add global error handler | `index.js` | Every unhandled error returns 500 JSON + logs structured error |
| P0 | Add process crash handlers | `index.js` | `uncaughtException` and `unhandledRejection` logged before exit |
| P0 | Persist jobResults to Redis | `index.js` | Backend restart preserves all pending results for 10 minutes |
| P0 | Fix watermark messaging | `Hero.tsx`, `FinalCTA.tsx`, `CompileShell.tsx` | Users see watermark status BEFORE download, not after |
| P0 | Fix pricing page claims | `pricing/page.tsx` | FAQ and comparison table accurately describe free tier |
| P1 | Wire typography report into compile response | `compile-worker.js`, `typography-assurance.js`, `index.js` | Compile status includes typography grade (A-D) |
| P1 | Wire compile log analysis into status | `compile-worker.js`, `book-engineering.js`, `index.js` | Compile status includes overfull/underfull hbox count |
| P1 | Add post-payment CTA | `pricing/page.tsx` | "Go to Editor" button appears after successful payment |
| P1 | Fix error translation regex | `CompileShell.tsx` | No "$1" literals in user-facing error messages |
| P1 | Block export on hard preflight failures | `CompileShell.tsx` | Download button disabled when preflight has `status: 'fail'` |

**Kill:** Nothing. All existing features are retained.
**Defer:** Component decomposition, PDF regression tests, staging environment.

### Days 31-60: Raise the Standard

| Priority | Task | Files | Definition of Done |
|----------|------|-------|-------------------|
| P1 | Decompose CompileShell.tsx | `CompileShell.tsx` → 5 components | No component exceeds 600 lines |
| P1 | Centralize compile debounce | New `useCompileQueue` hook | One API request per user action, coalesced |
| P1 | Pin TeX Live version | `Dockerfile` | Specific TeX Live release, not `apt-get latest` |
| P1 | Add readiness health probe | `index.js` | `/api/health/ready` checks Redis + PocketBase + Pandoc |
| P1 | Call lintManuscript() pre-compile | `index.js`, `book-engineering.js` | Lint warnings in compile response |
| P2 | Add fiction sample manuscript | `sample.ts` | Sample selector: Academic / Fiction / Screenplay |
| P2 | Add CTAs to journal articles | `articles-1.ts` | Every article ends with link to relevant template |
| P2 | Add build manifest to exports | `compile-worker.js`, `provenance.js` | PDF metadata includes Pandoc + TeX version |
| P2 | Fix golden ratio claim | `grid-system.js`, `GRID_SYSTEM.md` | Either correct multipliers or remove "golden ratio" from docs |
| P2 | Add `--max-old-space-size` to Dockerfile | `Dockerfile` | Node process has memory ceiling |

**Kill:** "Fast mode" vs "Full quality" distinction in pricing table. Both tiers compile the same way.
**Defer:** Analytics integration, email capture, PDF regression tests.

### Days 61-90: Build the Moat

| Priority | Task | Files | Definition of Done |
|----------|------|-------|-------------------|
| P2 | Extract route groups from index.js | `index.js` → `routes/*.js` | index.js < 500 lines |
| P2 | Add PDF regression tests | `tests/` | Golden-file comparison for all 15 templates |
| P2 | Set up PocketBase backup | Coolify config | Daily SQLite backup to S3/R2 |
| P2 | Add staging environment | Coolify config | Preview deployment for every PR |
| P3 | Replace framer-motion with CSS animations | Landing components | Bundle size reduced, same visual effect |
| P3 | Implement compile result caching | `compile-worker.js` | Same manuscript + settings hash returns cached PDF |
| P3 | Font upload magic byte validation | `index.js` | Reject non-font files regardless of extension |
| P3 | Genre detection surfaces in Design stage | `CompileShell.tsx` | Badge shows detected genre + recommended template |
| P3 | Rename templates to genre-first names | Template registry in `index.js` | "Classic Academic" not "Symphony" |
| P3 | Add analytics | Frontend | Full funnel tracking: land → edit → compile → download → upgrade |

**Kill:** Crop mark CSS classes. Dark theme CSS variables if not using dark mode on site pages.
**Defer:** Horizontal scaling, CDN for PDFs, seccomp profiles.

---

## SECTION 8 — Kill Criteria

Shut down or pivot if ANY of these are true after 90 days:

1. **< 100 compiles/week** after 90 days of marketing. The product has no audience.
2. **< 2% free-to-paid conversion** after fixing watermark messaging. The value proposition doesn't justify payment.
3. **> 30% of KDP uploads fail** despite preflight passing. The compliance engine doesn't work.
4. **Support ticket volume > 5/day** for a product with < 500 users. The UX is fundamentally broken.
5. **Reedsy ships free PDF/X-1a export.** The compliance wedge disappears. Pivot to EPUB + print-on-demand integration.
6. **Compile costs exceed $0.05/compile** at scale. The economics don't work. Consider client-side WASM compilation.

---

## SECTION 9 — Hard Truth

PagePerfect has a real engine underneath a dishonest wrapper. The LaTeX compilation pipeline works. The 15 templates are professional. The grid system produces better output than Vellum or Atticus. The security architecture is thoughtful. But none of that matters because the product lies to its users on first contact. The landing page promises "KDP-compliant" output that is actually watermarked. The pricing page calls the free tier "fully functional" when it's not. The editor surprises users with a watermark AFTER they've invested 30 minutes formatting their manuscript. This is not a UX issue — it's a trust violation. And in self-publishing, where authors have been exploited by vanity presses for decades, trust is the only currency that matters. Fix the honesty problem first. Everything else is engineering. The engineering is mostly done. The honesty isn't.
