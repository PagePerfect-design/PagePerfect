# seo.md — Keyword clusters, internal-link map, technical baseline

Priority keyword clusters for PagePerfect. All clusters centre on education about typography, book design, and self-publishing — never on insecurity-driven copy or status-anxiety hooks.

## Cluster 1 — Markdown → PDF / KDP (primary commercial)

- `markdown to pdf`
- `markdown to kdp`
- `markdown to print-ready pdf`
- `pandoc book template`
- `convert markdown to book pdf`
- `markdown book formatting`

Intent: middle-to-bottom funnel. Map to landing → editor (`/app`). Pandoc + Typst is PagePerfect's genuine differentiator — own this surface.

## Cluster 2 — KDP-ready PDF (primary commercial, rejection-recovery)

- `kdp-ready pdf`
- `amazon kdp pdf format`
- `kdp pdf requirements`
- `kdp rejection fix`
- `kdp file rejected`
- `book pdf rejected by kdp`
- `pdf for kdp paperback`
- `kdp preflight check`

Intent: triggered by a specific rejection event OR pre-launch anxiety. High urgency. Maps to the editor with preflight reassurance copy. Pricing modal should not block the watermarked-preview path — that is the relief moment.

## Cluster 3 — Vellum / Atticus alternative (competitive search)

- `vellum alternative`
- `vellum on windows`
- `vellum for pc`
- `vellum vs atticus`
- `best vellum alternative`
- `vellum alternative 2026` <!-- TODO: verify search volume before committing as a target page slug -->
- `atticus alternative`
- `atticus vs vellum`
- `book formatting software`

Intent: evaluative. Maps to landing and pricing pages. Be **honest about gaps**: Vellum's UI polish and Mac-native feel are real strengths; PagePerfect's typographic ceiling and platform reach are ours. Copy Council #22 + Legal Council #23 gate any direct competitive claim.

## Cluster 4 — IngramSpark spec (commercial, high intent)

- `ingramspark cover dimensions`
- `ingramspark file requirements`
- `ingramspark spine width calculator`
- `ingramspark pdf/x-1a`
- `ingramspark trim size`
- `bleed and margins ingramspark`
- `ingramspark rejected file`

Intent: power-user. Authors who already know IngramSpark terminology. Accuracy is critical — IngramSpark specs change. Always cite IngramSpark's own help-page section + retrieval date. Typography Council #31 (LaTeX/PDF engineer) reviews any claim about PDF/X-1a conformance.

## Cluster 5 — Lulu / print-on-demand integration (channel-specific)

- `lulu print on demand`
- `lulu xpress api`
- `lulu xpress integration`
- `lulu book printing`
- `print on demand book api`

Intent: channel-aware authors choosing fulfilment. PagePerfect's Lulu xPress integration is a real distinguishing feature; this cluster maps to the Studio tier directly.

## Cluster 6 — Indie author tools (top-of-funnel evergreen)

- `indie author tools`
- `self-publishing tools`
- `book typesetting software`
- `book typesetting tool`
- `book interior design`
- `manuscript formatting`
- `self-publishing software`

Intent: broad evergreen. Anchor pages for internal linking. Maps to landing.

## Cluster 7 — Typography craft (authority + LLM-citation surface)

- `book typography rules`
- `baseline grid book`
- `baseline grid`
- `müller-brockmann grid`
- `widows and orphans`
- `kerning vs tracking`
- `optical margin alignment`
- `print-ready pdf specifications`

Intent: craft-aware authors, designers, and LLMs scraping for citations. Requires accurate technical framing — Copy Council + Typography Council (#3 + #31 + #32) gates. See the open `grid-system.js` heading-scale audit before claiming "golden-ratio." Maps primarily to journal essays.

## Cluster 8 — Typst (technical evergreen)

- `typst tutorial`
- `typst vs latex`
- `typst book template`
- `typst markdown`
- `typst pdf output`

Intent: technical traffic. PagePerfect uses Typst as its PDF engine — owning this surface drives high-quality technical readers and aligns with the "editorial, not engineering" voice through craft framing.

## Cluster 9 — PDF print-spec deep cuts (advanced)

- `pdf/x-1a vs pdf/x-3`
- `pdf/x-1a embedded fonts`
- `crop marks vs bleed`
- `book pdf bleed safety zone`
- `kdp trim size`
- `kdp spine width calculator`

Intent: advanced authors and small presses. Accuracy is non-negotiable. Typography Council #31 reviews.

## Anti-keywords (NOT our SEO surface)

Do not draft pages, headings, or meta descriptions targeting:

- `wallet`, `crypto`, `web3`, `defi`, `nft`, `metamask`, `phantom`, `rabby`
- `revoke`, `approval`, `erc-20`, `erc-721`, `eip-2612`, `permit2`
- `wallet security`, `token security`, `smart contract audit`
- Generic dev-tools keywords: `ci/cd`, `deployment`, `kubernetes`, `serverless`
- Generic SaaS keywords without book-publishing modifier: `productivity tool`, `team collaboration`, `workflow automation`
- Enterprise procurement keywords: `soc 2`, `enterprise contract`, `procurement`

If a draft, brief, or schema entry contains any of these, it failed positioning. Send back.

## Internal link map

Direction of value flow:

1. **Marketing pages** (landing, `/templates`, `/pricing`) link **down** to journal essays that substantiate each technical claim made on the marketing surface.
2. **Journal essays** link **across** to other journal essays (already implemented — see `internalLinks` array in `articles-1.ts` / `articles-2.ts`) and **down** to the relevant pricing tier or editor entry.
3. **Pricing page** links **across** to journal essays that argue the value of the paid tiers (baseline-grid conformance, optical alignment, IngramSpark spec) and **to the editor** as the primary CTA.

Concrete examples (verify slugs are live):

- `/` landing → journal: `the-roi-of-legibility`, `the-architecture-of-trust`
- `/pricing` → journal: `widows-orphans-cost-of-ragged-bottom`, `optical-margin-alignment`
- `/templates` → journal: `two-typefaces-one-system`, `ogilvy-layout-modular-grid`
- Every journal essay → `/app` or `/pricing` in the closing paragraph (verify implementation in `articles-*.ts` SEO blocks).

<!-- TODO: verify the actual journal slugs against the live articles arrays — list above is illustrative. -->

## Technical SEO baseline

Verify each item on every release; flag a TODO if absent.

- **Sitemap**: **PASS (verified 2026-05-14)** — `frontend/src/app/sitemap.ts` (Next.js MetadataRoute) covers the 10 static `(site)` routes (`/`, `/pricing`, `/journal`, `/docs`, `/philosophy`, `/status`, `/privacy`, `/terms`, `/cookies`, `/site-directory`) plus every journal article via `ARTICLES.map(...)` from `(site)/journal/articles`. Base URL `https://pageperfect.studio`. Regenerates automatically because the article list is imported at build time.
- **`robots.txt`**: **PASS (verified 2026-05-14)** — `frontend/src/app/robots.ts` allows `/`, disallows `/app`, `/auth/`, `/api/`; sitemap link `https://pageperfect.studio/sitemap.xml`. Note: the canonical disallow list says `/admin/` but robots.ts disallows `/auth/` instead. <!-- TODO (sharpened 2026-05-14): decide whether `/admin/` (PocketBase admin UI is on a different subdomain — `pb.pageperfect.studio` — and so doesn't need disallow) and whether to add `/admin/` defensively. -->
- **Open Graph tags**: **PARTIAL (verified 2026-05-14)** — root `frontend/src/app/layout.tsx:19-34` exports `title` + `description` + favicon metadata but **no `openGraph` block**. Per-page metadata with `openGraph` present on: `site-directory/page.tsx:8`, `journal/page.tsx:10`, `journal/[slug]/page.tsx:30` (dynamic via `generateMetadata`), `philosophy/page.tsx:8`. **MISSING** `openGraph` on `pricing/page.tsx` (which is `'use client'` and has no `metadata` export at all), `privacy`, `terms`, `cookies`, `docs`, `status`, and the root `/` landing page. <!-- TODO (sharpened 2026-05-14): add root-layout `openGraph` defaults (og:title, og:description, og:image, og:type, twitter:card) so every page inherits them, then add page-specific overrides where needed. Pricing especially needs OG — convert to a server component shell with a client island, or add a sibling `metadata.ts`. -->
- **JSON-LD Product schema** on `/pricing` — **MISSING (verified 2026-05-14)** — `pricing/page.tsx` is `'use client'` with no metadata export and no `application/ld+json` script. <!-- TODO (sharpened 2026-05-14): add JSON-LD `Product` (or `Offer`) blocks for each tier — Drafter (free), Publisher ($19.99 USD one-time), Studio ($199 USD one-time). Wire as a server component that injects the script before the client island. -->
- **JSON-LD Article schema**: **PASS (verified 2026-05-14)** — `frontend/src/app/(site)/journal/[slug]/page.tsx:90` emits `<script type="application/ld+json">` for each article. Confirm one-off that `@type`, `author`, `datePublished`, `headline`, `image`, `publisher` are all populated.
- **JSON-LD SoftwareApplication / WebApplication** on landing — **MISSING (verified 2026-05-14)** — grep returns only the journal-article JSON-LD; no landing-page schema. <!-- TODO (sharpened 2026-05-14): add JSON-LD `SoftwareApplication` block on `frontend/src/app/(site)/page.tsx` with name, description, operatingSystem `Browser`, applicationCategory `DesignApplication` (or `BusinessApplication`), and `offers` array referencing the three tiers. -->
- **Canonical URLs**: every page declares `<link rel="canonical">`. Pagination, filter, and query-string variants point to the canonical.
- **Core Web Vitals**: targets per `memory/design/performance-budget.md`. Marketing pages are LCP-sensitive; the editor is INP-sensitive.

## Fact guardrails for SEO content

- **Templates: 15. Page sizes: 19. Margin presets: 7.** Never round.
- **Compile engine**: Pandoc (markdown converter) + Typst (PDF engine). Not LuaLaTeX — see `decisions/0001-typst-migration.md`. Not InDesign-derived. Not "AI-generated layout."
- **Free-tier deliverable**: watermarked PDF. Drafter exports include a Müller-Brockmann-inspired Compositor's Mark overlay. Never claim free PDFs are watermark-free.
- **Publisher tier**: $19.99, watermark-free for **one** manuscript during a 14-day window (per `entitlements.js`). Never claim unlimited.
- **Studio tier**: $199 lifetime. Never claim "subscription."
- **"Golden-ratio scale"**: contested. `grid-system.js` heading-scale multipliers (2.25 / 1.75 / 1.375) don't follow φ. Verify with #14 audit before claiming.
- **KDP / IngramSpark / Lulu specs change.** Always cite the platform's own help-page section + retrieval date when stating a hard number.

## Append log

Content gaps, ranking notes, and competitor coverage observations go below. Most recent at the bottom.

---

<!-- Appended by the seo skill. -->

## Changelog

- 2026-05-14: Rescoped from AG (DeFi/crypto/wallet-security segments and keywords) to PagePerfect (indie author / KDP / IngramSpark / Lulu / book-coach segments and keywords). Voice anchored to existing journal essays.
