# integrations.md

Current integrations + prospective integrations + technical constraints per integration partner. This is the **operational file** for `integration-proposal` (see `.claude/skills/integration-proposal/SKILL.md`).

**Status as of 2026-05-14:** one active third-party integration (Lulu xPress). Stripe / PocketBase / Resend / Vercel / Coolify / GitHub are internal infrastructure, not partnership integrations. All outbound integration targets are prospective — none signed.

## Integration shapes

PagePerfect can be integrated outbound (we provide API / SDK / data; partner consumes) or inbound (we consume partner data). Most outbound opportunities are around print-on-demand pipelines and writing-tool exports — our value to partners is the deterministic Markdown → print-ready PDF pipeline.

### Outbound integration surfaces

- **REST API** — `projects/pageperfect/ARCHITECTURE.md` documents the canonical compile + preflight + cover-dimension endpoints. Future: a B2B API tier.
- **Markdown export adapters** — adapters for Scrivener, Ulysses, Obsidian that produce PagePerfect-ready Markdown.
- **Cover-dimension widgets** — embeddable spine / gutter / trim calculator for partner sites (KDP cover designers, IngramSpark resource pages).
- **Webhook** — for partners wanting async compile-completion notifications.
- **Template licensing** — Typst template files for partners with their own typesetting workflow.

### Inbound integrations (where PagePerfect consumes partner data)

- **Lulu xPress API** — already core infrastructure (`backend/lulu.js`); print-on-demand for Studio tier.
- **Stripe** — payments + entitlements.
- **PocketBase** — auth + DB.
- **Resend** — transactional email.
- **Cloudflare Turnstile** *(potential)* — anti-abuse on signup; not yet active.

## Active third-party integration (1)

### Lulu xPress

- **Shape:** inbound + outbound; PagePerfect calls Lulu to create print jobs, Lulu calls our webhook with status updates.
- **Status:** **live**.
- **Auth shape:** server-side OAuth 2.0 client_credentials. Webhook HMAC-verified.
- **Surface:** `backend/lulu.js`, `backend/routes/lulu.js`, `print_orders` PocketBase collection.
- **Agreement:** Lulu xPress API standard ToS.
- **Commercial shape:** per-unit print + shipping pricing per `pod_package_id`; no revenue share (PagePerfect does not resell printed copies — the author orders direct via the API).
- **Last verified:** <!-- TODO: verify Lulu integration go-live date and current contract terms -->

## Internal infrastructure (not partnership integrations)

These are vendors PagePerfect consumes for operational reasons. They are not partnership integrations and should not be pitched as such (in particular, **Stripe is internal payments infrastructure, not a partner integration**).

### Stripe

- **Shape:** payment integration.
- **Surface:** subscription / one-time / lifetime checkout via Payment Element, webhook-driven entitlement updates (Publisher tier, Studio tier). HMAC-verified webhook at `routes/stripe.js`.
- **Agreement:** Stripe standard ToS.

### PocketBase

- **Shape:** auth + database (self-hosted on Coolify).
- **Surface:** `pb.pageperfect.studio`, `users` / `manuscripts` / `compile_history` / `print_orders` collections.

### Resend

- **Shape:** transactional email (signup confirmation, password reset, receipt, support replies).
- **Surface:** `lib/email.ts` (frontend) + backend transactional sends.

### Vercel

- **Shape:** frontend hosting + edge.

### Coolify / Digital Ocean

- **Shape:** backend hosting; runs Express API + PocketBase + Redis.

### GitHub

- **Shape:** code hosting + CI.

(This list is inbound-infrastructure heavy by design; outbound integration targets are where the growth opportunity lives.)

## Prospective integrations (none signed)

Drafted by `integration-proposal`; status `prospective` until a conversation lands.

### Reedsy hand-off

- **Shape:** outbound — Reedsy editors and book-coaches recommend PagePerfect for typesetting once the edit is complete.
- **Status:** prospective.
- **Integration depth:** referral / listing first; deeper integration (e.g., "Open in PagePerfect" from a Reedsy project) is a stretch goal.

### Scrivener export adapter

- **Shape:** outbound — Markdown export from Scrivener with PagePerfect-compatible frontmatter.
- **Status:** prospective.

### Plottr export adapter

- **Shape:** outbound — structure-tool author hands off to typesetting.
- **Status:** prospective.

### Sudowrite export adapter

- **Shape:** outbound — AI-drafting tool hands off to typesetting.
- **Status:** prospective.

### Draft2Digital aggregator hand-off

- **Shape:** outbound — Studio-tier EPUB export → D2D aggregator for non-Amazon ebook retailers.
- **Status:** prospective. <!-- TODO: confirm PagePerfect EPUB output meets D2D's current validator before any pitch. -->

### PublishDrive aggregator hand-off

- **Shape:** outbound — international ebook + print aggregator complementing D2D's coverage.
- **Status:** prospective.

### IngramSpark partner tooling

- **Shape:** outbound — listed in IngramSpark's tooling-vendor partner programme; trade-distribution audience.
- **Status:** prospective. <!-- TODO: verify current IngramSpark partner-programme terms before pitching. -->

## Prospective integration template

<!-- Use this shape when drafting a new prospective entry. Append as `integration-proposal` runs. -->

```
### <Partner name>

- **Shape:** outbound API | SDK | widget | data | template licensing | other
- **Status:** scoping | proposal drafted | proposal sent | technical conversation | integration build | live | declined | paused
- **Contact:** <person, role, company, channel>
- **Technical constraints:**
    - Required page sizes: <>
    - Required templates: <>
    - Required response time: <>
    - Required SLA: <>
    - Data shape: <>
- **Commercial shape:** <free, paid API tier, revenue share, grant-funded integration>
- **Timeline:** <>
- **PP-side work:** <engineering effort estimate; handoff to build-feature>
- **Partner-side work:** <their effort estimate>
- **Risk flags:** <jurisdiction, compliance, brand concerns>
- **Last activity:** YYYY-MM-DD
```

## Integration shapes by partner type

### Writing tools → PagePerfect export

- **Scrivener / Ulysses / iA Writer / Obsidian:** Markdown export with PagePerfect frontmatter (template, page size, margin preset) — drop into editor.
- **Notion / Google Docs:** export-button extension that converts to PagePerfect-flavoured Markdown.

### Self-publishing platforms → PagePerfect deep link

- KDP / IngramSpark / Reedsy author flows embed "Open in PagePerfect" CTA.
- Cover-dimension widget embeds where authors are sizing covers.

### Print-on-demand → PagePerfect API

- Already live with Lulu (Studio tier). Next candidates: BookBaby, IngramSpark direct API, KDP Print (no public API today).

### Education / course platforms → curriculum partnership

- Self-publishing courses (Self-Publishing School, Joanna Penn's courses) reference PagePerfect as the recommended typesetting workflow; potential affiliate or licensing relationship.

### Template ecosystem → community templates

- Typst-community-contributed `.typ` templates; long-term we may host a community gallery (governed by quality + accessibility gates).

## Technical standards we maintain for integrations

- **OpenAPI spec** — public; canonical path in `projects/pageperfect/ARCHITECTURE.md`. Every integration partner references this.
- **Rate-limit tiers** — per tier; 20 compiles/min/IP today (per `ARCHITECTURE.md`). Partners negotiate higher tiers if justified.
- **Webhook reliability** — signed, idempotent, versioned. See `webhook-review` skill in engineering.
- **SDK compatibility** — semver; breaking changes batched into major releases with 90-day deprecation notice (when SDKs exist).
- **Uptime story** — honest SLA, not marketing SLA. Current posture: best-effort 99.9% on compile endpoints; no SLA on dashboard. Studio tier may move toward paid SLA when B2B partnerships justify it.

## Hard-no integration patterns

We do not integrate with:

- Platforms whose primary business is plagiarism, content scraping, or AI-content laundering.
- Partners who require that PagePerfect disable preflight checks or watermark on free tier (undermines the model + risks platform-policy issues with KDP / IngramSpark).
- Partners who require white-labelling that hides the PagePerfect brand in ways inconsistent with the open-core story (if/when open-core is published).
- Partners who require exclusivity we are not prepared to offer. We are not exclusive to any platform.
- Partners whose ToS would force us to surrender manuscript text (violates the session-scoped privacy promise).

## How this file is maintained

- On every `integration-proposal` run: verify status + technical constraints per partner entry.
- On every integration shipping / pausing / ending: update status + note in `partnerships-history.md`.
- On every change to PagePerfect's own API / SDK / template surface: update the "Technical standards" section above.
- On every integration termination: the reason is recorded in `partnerships-history.md`; no finger-pointing, facts only.

## Changelog

- 2026-05-14: Rescoped from AG (EF/Optimism/Gitcoin grants, MetaMask/Rabby/Phantom integrations, crypto-ecosystem targets, Coinbase partnership history, AG open-core scope) to PagePerfect (publishing-ecosystem reality — Lulu live partner, all else prospective). Split "active third-party" (Lulu only) from "internal infrastructure" (Stripe / PocketBase / Resend / Vercel / Coolify / GitHub). Added prospective rows for Reedsy / Scrivener / Plottr / Sudowrite / D2D / PublishDrive / IngramSpark per the rescoped `integration-proposal` skill.
