# claims-register.md

Append-only log of PagePerfect's public claims + their source of truth. Every claim that appears in marketing, UI, docs, legal pages, outreach, or API responses should be traceable here.

If a claim isn't in this register, it either needs adding or it shouldn't be shipping.

## Entry format

```
## <short claim name>

- **Claim text (verbatim):** "<the sentence as it appears in public>"
- **Surfaces:** <where the claim lives — file paths, URLs, marketing copy>
- **Source of truth:** <BUSINESS.md:NN / ARCHITECTURE.md:NN / ADR path / external citation>
- **Classification:** factual | typography | regulatory | commercial | performance
- **Last verified:** YYYY-MM-DD by <skill or person>
- **Risk if wrong:** <one line — what happens if the claim is inaccurate>
- **Status:** active | retired (replaced by <> on YYYY-MM-DD)
```

## Rules

- Append-only. Never edit a past entry to change a claim's history; add a follow-up entry marking the old one retired.
- Every claim shipped via any skill (`writer`, `conversion`, `legal-page-draft`, etc.) gets a register entry before or at ship time.
- `claim-review` and `security-claim-audit` operate against this register — any public claim not here is a P0 finding.
- Re-verify quarterly. `compliance-risk` runs a claim sweep; stale "last verified" dates flag for re-check.

## Claim classifications

- **factual** — product facts (template count, tier prices, page sizes, feature availability). Source: BUSINESS.md / ARCHITECTURE.md.
- **typography** — what PagePerfect does / does not produce typographically. Highest scrutiny — Typography Council (#3 + #31 + #32) VETO.
- **regulatory** — GDPR, PECR, UK / EU regulatory posture, KDP / IngramSpark / Lulu acceptance. Source: legal page + retrieval-dated citation. Data-protection lawyer (#24) VETO.
- **commercial** — tier, pricing, watermark status, open-source status, funding model. #11 gatekeeper.
- **performance** — compile time, uptime. Source: metrics + BUSINESS.md.

## Banned claim patterns (enforce across every entry)

- "Perfect book" / "perfect typography" → reject. Use "production typography" or "print-ready PDF".
- "Guaranteed KDP acceptance" → reject. Use "designed for KDP / IngramSpark / Lulu — platforms hold final acceptance".
- "AI-formatted" / "AI typesetting" / "smart layout" → reject. Compile pipeline is deterministic Pandoc + Typst.
- "GDPR compliant" → reject. Use "designed to comply with UK GDPR; see our Privacy Policy".
- "Industry standard" → reject as filler. Cite the specific standard (KDP cover specs, IngramSpark trim sizes, etc.).
- "Bank-level security" → reject. Meaningless marketing phrase with regulatory exposure.
- "Guaranteed" (anything) → reject.
- "Free Forever" (as a blanket) → reject. Use "Drafter tier: free, watermarked PDFs."
- "100% safe" / "100% secure" / "100% anything" → reject.
- Any claim that could be read as a securities or investment offering → reject + #23 review.

## Known claims (current)

<!-- Backfill as the register is built out. Initial entries to land via the first `compliance-audit` sweep. The skeleton below seeds the pattern. -->

### Template count — 15

- **Claim text:** "15 templates" (and variants — "fifteen book templates", "15 design templates").
- **Surfaces:** `BUSINESS.md`, homepage, pricing copy, blog posts, API reference, `/api/templates`.
- **Source of truth:** `backend/typst-templates/` — verified 15 `.typ` files: avantgarde, chicago, chronicle, cinema, exhibit, heirloom, international, matrix, memoir, minimal, operator, paperback, symphony, thesis, verse. `projects/pageperfect/ARCHITECTURE.md` Templates section must match.
- **Classification:** factual
- **Last verified:** 2026-05-14 by R1 rescope sweep (directory listing).
- **Council gate:** #21 Technical clarity.
- **Risk if wrong:** every marketing surface + SEO out of sync; customer trust erosion. **Low** — the count is mechanically verifiable.
- **Status:** active

### Compile engine — Pandoc + Typst

- **Claim text:** "Pandoc converts your manuscript to Typst; Typst compiles the print-ready PDF." (And variants.)
- **Surfaces:** homepage, FAQ, docs, pricing page if engine is mentioned, blog "How it works" content.
- **Source of truth:** `projects/pageperfect/decisions/0001-typst-migration.md`, `projects/pageperfect/ARCHITECTURE.md` (Compile Flow section), `backend/typst-templates/` (15 `.typ` files).
- **Classification:** factual + typography
- **Last verified:** 2026-05-14
- **Council gate:** #21 Technical clarity + Typography Council (#3 + #31 + #32) VETO on engine claims; #4 Security on sandboxing posture.
- **Risk if wrong:** **medium** — marketing-engineering desync, security claims invalidated (LuaLaTeX vs Typst differ on shell-escape posture). Note: `.claude/skills/claim-review/SKILL.md` Product-truth section still says "Pandoc + LuaLaTeX" — that's stale; this register is the canonical source per ADR-0001.
- **Status:** active

### Watermark on free tier

- **Claim text:** "Drafter exports include the Compositor's Mark watermark." / "Download Preview PDF (Watermarked)"
- **Surfaces:** `frontend/src/app/(site)/pricing/page.tsx`, free-tier download button label, `LaunchOverlay` pre-download notice.
- **Source of truth:** `projects/pageperfect/BUSINESS.md` tier table + `backend/watermark-typst.js`. Watermark is server-side and cannot be bypassed client-side (per `BUSINESS.md` "Watermark behavior").
- **Classification:** commercial
- **Last verified:** 2026-05-14 (file existence)
- **Council gate:** #11 Investor voice (banned phrases — never "free of watermark" without tier binding); #22 Conversion (CTA copy honesty).
- **Risk if wrong:** **medium** — misleading-practices exposure (ASA / CAP Code) if the watermark is described as "preview" without "watermarked", or if marketing implies free PDFs are watermark-free.
- **Status:** active

### Pricing — Publisher $19.99 / Studio $199

- **Claim text:** "Publisher tier, $19.99 — watermark-free for one manuscript, 14 days." / "Studio tier, $199 lifetime — unlimited manuscripts."
- **Surfaces:** `frontend/src/app/(site)/pricing/page.tsx`, homepage CTA, upgrade flows, Stripe product configuration.
- **Source of truth:** `BUSINESS.md` tier table + Stripe Dashboard price IDs + `backend/entitlements.js` (verified 2026-05-14: `WINDOW_SECONDS = 14 * 24 * 60 * 60`).
- **Classification:** commercial
- **Last verified:** 2026-05-14 (entitlements.js 14-day window verified by inspection)
- **Council gate:** #9 Lawyer (Consumer Rights Act 2015 — distance-selling); #23 Regulatory (ASA / CAP — accurate pricing); #11 Investor voice (no "Free Forever" / "100% free" framing).
- **Risk if wrong:** **medium** — mismatched copy between marketing and checkout = customer distrust; ASA advertising-standards exposure. "Watermark-free for one manuscript" is non-obvious; the 14-day re-export window is non-obvious — both must appear in checkout copy.
- **Status:** active

### Session-scoped manuscript storage

- **Claim text:** "Manuscripts are session-scoped — purged on sign-out and after 24 hours of inactivity."
- **Surfaces:** `/privacy` Clause 01, FAQ, marketing copy on data handling.
- **Source of truth:** `projects/pageperfect/ARCHITECTURE.md` (Manuscript Persistence section) + `backend/index.js` asset directory sweeper (verified 2026-05-14: `ASSET_MAX_AGE_MS = 24 * 60 * 60 * 1000`).
- **Classification:** regulatory + commercial
- **Last verified:** 2026-05-14 (24h sweeper constant verified by inspection)
- **Council gate:** **#24 Data protection VETO** — every wording change requires #24 sign-off. #19 Privacy / GDPR specialist on retention math. #21 Technical clarity on "session-scoped" vs "purged on sign-out" wording (the two clauses are distinct events).
- **Risk if wrong:** **high** — UK GDPR / EU GDPR data-protection exposure under Article 5(1)(e) storage-limitation principle. Catastrophic trust loss. The client-side IndexedDB cache survives sign-out on the user's own device — that distinction must be in the policy, never absent.
- **Status:** active

### Golden-ratio scale / Müller-Brockmann grid — **DO NOT CLAIM (P0)**

- **Claim text (any variant — all banned until resolved):** "Golden-ratio typography", "golden-ratio scale", "phi-based heading scale", "Müller-Brockmann grid", "Müller-Brockmann-grade typography", any phrasing implying the heading-scale math uses phi (≈1.618).
- **Surfaces (where it has historically appeared and must now be removed or rewritten):** `projects/pageperfect/BUSINESS.md` (Positioning paragraph — flagged), homepage hero (verify), pricing page (verify), journal articles on typography (verify), `CLAUDE.md.pre-kit-backup` (historical — do not republish).
- **Source of truth:** `backend/grid-system.js` lines 32–37 — verified 2026-05-14: heading scale is `h1: 2.25, h2: 1.75, h3: 1.375`, producing a `~1.28×` step progression. Phi (1.618) is **not** the multiplier. `projects/pageperfect/STATUS.md` (Open / Medium) and `projects/pageperfect/BUSINESS.md` (Banned-claim audit, open item) flag this as an unresolved claim-accuracy gap.
- **Classification:** typography — **Typography Council (#3 + #31 + #32) VETO**
- **Last verified:** 2026-05-14 (R1 rescope sweep — math inspected in `grid-system.js`)
- **Council gate:** **Typography Council #3 + #31 + #32 VETO** on every appearance. **#23 Regulatory** on ASA / CAP "objective claims must be substantiated" exposure. **#9 Lawyer** on misleading-practices exposure.
- **Severity:** **P0** — every public surface using a golden-ratio / Müller-Brockmann claim is a live claim-accuracy defect.
- **Risk if shipped:** **high** — ASA / CAP Code complaint risk; competitor or journalist could trivially verify the math and surface the discrepancy; reputational damage compounds because the claim sits at the centre of PagePerfect's typography positioning.
- **Status:** **active P0 — DO NOT CLAIM in any new marketing surface until either (a) `grid-system.js` heading-scale is rewritten to phi-derived multipliers (≈1.618, 1, 1/1.618 etc.) and verified by `claim-review`, or (b) the claim is permanently retracted across all surfaces and replaced with substantiable alternatives.**
- **Substantiable alternatives (use these instead):** "proportional typographic scale tuned for print readability" (matches the comment in `grid-system.js:32`), "baseline-grid layout", "Swiss-typography-inspired hierarchy" (NB: "inspired by" not "implementing"), "print-ready typography".
- **Resolution owner:** Typography Council (#3 lead) + #15 Staff architect. Tracked in `projects/pageperfect/STATUS.md` Open / Medium and `projects/pageperfect/BUSINESS.md` Banned-claim audit.

### KDP / IngramSpark / Lulu compliance — tier-bound

- **Claim text (canonical):** "Designed for KDP, IngramSpark, and Lulu — platforms hold final acceptance." / "KDP-ready PDF output" / "IngramSpark-spec geometry" / "Lulu xPress integration".
- **Banned variants (P0 — never ship):** "Guaranteed KDP acceptance", "Passes KDP review on first upload", "100% KDP-compliant", "IngramSpark-guaranteed", "Lulu-guaranteed".
- **Surfaces:** homepage hero, pricing page, journal articles, docs, marketing emails, outreach.
- **Source of truth:** `backend/publishing.js` (preflight + cover dimension math), `backend/platform-compliance.js` (KDP / IngramSpark / Lulu / offset specs), `backend/lulu.js` (xPress API client with HMAC-SHA256 webhook verification), `backend/routes/publishing.js` (preflight routes). **Verified 2026-05-14:** `backend/platform-compliance.js` does **not** carry explicit dated spec-version strings for any platform. Per-platform constants captured: KDP (`backend/platform-compliance.js:15-33`) — pages 24-828, gutters by page-count (150/300/500/828), RGB+CMYK, `pdfVersion: '1.4+'`. IngramSpark (`:34-53`) — pages 18-1200, `gutterMin: 0.625`, CMYK only, `pdfFormat: 'PDF/X-1a:2001'`, `pdfVersion: '1.3'`. Lulu (`:54-72`) — pages 2-800, `gutterMin: 0.375`, RGB+CMYK, `pdfVersion: '1.4+'`. <!-- TODO (sharpened 2026-05-14): platform specs evolve quarterly. Operator/compliance-risk to confirm these constants still match each platform's currently-published spec sheets (KDP/IngramSpark/Lulu have no scrape-friendly spec API) and consider adding a `specSource: { url, fetchedAt }` field to each entry in `platform-compliance.js` so this audit is mechanically verifiable next cycle. -->
- **Classification:** typography + regulatory
- **Last verified:** 2026-05-14 (file existence + constant values verified; external spec-sheet round-trip pending — see sharpened TODO).
- **Council gate:** **Typography Council #3 + #31 + #32 VETO** on the typographic side; **#23 Regulatory** on the "guaranteed acceptance" trap; **#9 Lawyer** on warranty / misleading-practices exposure under Consumer Rights Act 2015 + ASA.
- **Risk if wrong:** **high** — a "guaranteed KDP acceptance" claim is a warranty-shaped statement that the platforms (Amazon / Ingram / Lulu) hold the final call on. Misleading-practices and consumer-protection exposure.
- **Tier binding rule:** any "KDP-ready" / "IngramSpark-spec" / "Lulu-ready" claim **must** be bound to Publisher / Studio tiers. Drafter output is watermarked and the watermark itself disqualifies the output for KDP / IngramSpark / Lulu acceptance, so the claim must never appear on a Drafter-tier surface without the watermark caveat.
- **Status:** active.

### Page sizes — 19

- **Claim text:** "19 page sizes" / "all 19 page sizes" (Publisher / Studio tier feature).
- **Surfaces:** pricing page, marketing copy, docs, `BUSINESS.md`.
- **Source of truth:** `backend/grid-system.js` (page-size definitions, `:108-115` + `:121-141`) and `backend/tests/grid-system.test.js` which exercises all 19 page sizes × 7 margin presets per `STATUS.md`. **Verified 2026-05-14:** the 19 page-size keys are `a4`, `letter`, `sixByNine`, `fiveFiveByEightFive`, `sevenByTen`, `a5`, `royal`, `bFormat`, `aFormat`, `demy`, `crownQuarto`, `b5`, `massMarket`, `fiveTwentyFiveByEight`, `amazonFiveByEight`, `amazonSixByNine`, `amazonSevenByTen`, `amazonEightByTen`, `amazonEightFiveByEleven`. Count: 19 — claim is accurate.
- **Classification:** factual
- **Last verified:** 2026-05-14 (full key enumeration confirmed against `backend/grid-system.js:108-141`).
- **Council gate:** #21 Technical clarity.
- **Risk if wrong:** **low** — mechanically verifiable.
- **Status:** active.

### Margin presets — 7

- **Claim text:** "7 margin presets" / "margin presets for tight, balanced, generous, etc." <!-- TODO: confirm the user-facing preset names. -->
- **Surfaces:** pricing page, editor UI, docs.
- **Source of truth:** `backend/grid-system.js` margin-preset table + `backend/tests/grid-system.test.js` 19 × 7 coverage.
- **Classification:** factual
- **Last verified:** 2026-05-14 (test coverage referenced; user-facing names TODO).
- **Council gate:** #21 Technical clarity; #13 UX writer for the preset names.
- **Risk if wrong:** **low**.
- **Status:** active.

### Heading variants — 3 (Classic / Modern / Bold)

- **Claim text:** "3 heading variants — Classic, Modern, Bold." (And per-variant descriptions.)
- **Surfaces:** editor UI, docs, marketing copy.
- **Source of truth:** `backend/heading-variants.js` and `backend/heading-variants-typst.js`.
- **Classification:** factual + typography
- **Last verified:** 2026-05-14 (files exist; variant enum TODO to enumerate in `ARCHITECTURE.md`).
- **Council gate:** #21 Technical clarity; Typography Council on any claim about the typographic quality of each variant.
- **Risk if wrong:** **low** factual; **medium** if the per-variant descriptions overstate typographic refinement.
- **Status:** active.

### HMAC-verified webhooks

- **Claim text:** "Lulu and Stripe webhooks are HMAC-verified" / "webhook signatures are verified before any side effect runs."
- **Surfaces:** security page (if shipped), `SECURITY.md`, docs, partner / integration outreach.
- **Source of truth:** `backend/lulu.js:286` `verifyWebhook` (HMAC-SHA256 against `LULU_WEBHOOK_SECRET` per `Lulu-HMAC-SHA256` header) and `backend/routes/stripe.js:21` `stripe.webhooks.constructEvent`. Both verified 2026-05-14.
- **Classification:** security + factual
- **Last verified:** 2026-05-14 (code path inspected).
- **Council gate:** **#4 Security** — VETO if the claim ever runs ahead of test coverage. `STATUS.md` Open / High flags `routes/stripe.js` and `routes/lulu.js` as having **zero test coverage for valid / invalid / duplicate / malformed signatures** (P0-2, P0-3 in the gap report). Until those tests land, the claim must include an "in production; tests in progress" caveat on any developer-facing surface.
- **Risk if wrong:** **high** — security claim with regulatory and trust exposure. Webhook replay or signature bypass would be a P0 incident.
- **Status:** active **with caveat** until webhook tests land.

### Sandboxed compile pipeline

- **Claim text:** "Sandboxed compile pipeline — `cap-drop=ALL`, `no-new-privileges`, read-only filesystem, memory and pid limits." / "LaTeX-injection-hardened input sanitizer."
- **Surfaces:** security page, `SECURITY.md`, docs, partner outreach.
- **Source of truth:** `backend/Dockerfile` (verified 2026-05-14: file exists). Per `STATUS.md` Resolved: `--cap-drop=ALL`, `--security-opt=no-new-privileges`, `--read-only`, `--tmpfs`, `--memory=1g`, `--pids-limit=100`. **Still missing:** seccomp profile, `--network none` per `STATUS.md` (Resolved-with-caveats).
- **Classification:** security
- **Last verified:** 2026-05-14 (Dockerfile presence verified; flag enumeration trusts STATUS.md).
- **Council gate:** **#4 Security** + **#10 DevOps / SRE**. Any claim about seccomp or `--network none` is currently false and must not ship until `STATUS.md` flags those as Resolved.
- **Risk if wrong:** **high** — security overstatement is the highest-risk claim category. Pandoc's `-raw_tex` flag remains the input-injection boundary; `backend/latex-sanitizer.js` (14 attack patterns) covers the residual LaTeX-flavoured surface (per seat #16 / #31 description).
- **Status:** active **with explicit "current scope" wording**. Never claim "fully sandboxed" — claim "hardened Docker compile sandbox" + list the specific flags.

### No third-party advertising trackers

- **Claim text:** "No third-party advertising trackers." / "No advertising cookies."
- **Surfaces:** Privacy Policy, cookie consent copy, marketing copy on data handling.
- **Source of truth:** Cookie consent implementation + actual `frontend/` dependency review. **Verified 2026-05-14:** `frontend/src/app/layout.tsx` loads **zero** third-party scripts — no `<script>` tags, no `next/script` import (grep across `frontend/src/` returns no `Script from 'next/script'` matches). Only first-party imports: Google Fonts via `next/font/google` (`Inter_Tight`, `Source_Serif_4`, `IBM_Plex_Mono` self-hosted at build time), `next-view-transitions`, internal `Providers`. No analytics SDK present (no PostHog, Plausible, Umami, Amplitude, Mixpanel, GA / `gtag`, Meta / `fbq`). Privacy-policy claim at `frontend/src/app/(site)/privacy/page.tsx:247` ("No advertising trackers. No third-party analytics.") and cookies page at `frontend/src/app/(site)/cookies/page.tsx:154` ("Zero advertising trackers. Zero third-party analytics scripts.") match the runtime.
- **Classification:** regulatory + commercial
- **Last verified:** 2026-05-14 (full `frontend/src/` runtime grep — no ad-tech or analytics SDK present).
- **Council gate:** **#24 Data protection VETO** — every wording change requires #24 sign-off. PECR (UK) + ePrivacy (EU) apply. #19 Privacy specialist on technical accuracy.
- **Risk if wrong:** **high** — PECR violation + UK GDPR fairness-and-transparency violation. ICO fines are the worst case.
- **Status:** active **pending #24 sign-off** after the third-party-script enumeration completes.

### Direct Lulu xPress integration

- **Claim text:** "Direct Lulu xPress API integration — orders flow from PagePerfect to Lulu without a manual handoff."
- **Surfaces:** Studio tier feature copy, docs, marketing.
- **Source of truth:** `backend/lulu.js` (xPress API client) + `backend/routes/lulu.js` (HTTP routes) + `print_orders` PocketBase collection per `STATUS.md` Resolved.
- **Classification:** factual + commercial
- **Last verified:** 2026-05-14 (files inspected; route + HMAC verification verified).
- **Council gate:** #23 Regulatory (Lulu xPress API ToS — what we may submit on the author's behalf); #21 Technical clarity.
- **Risk if wrong:** **medium** — partner-relationship exposure if our copy implies more than the integration delivers.
- **Status:** active.

### Watermarked free preview (Drafter tier capability)

- **Claim text:** "Drafter tier: free, watermarked PDFs — try every template before you pay."
- **Surfaces:** pricing page, homepage hero, marketing copy, onboarding.
- **Source of truth:** `BUSINESS.md` tier table + `backend/watermark-typst.js` + the LaunchOverlay pre-download amber notice per `STATUS.md` Resolved.
- **Classification:** commercial
- **Last verified:** 2026-05-14
- **Council gate:** **#11 Investor voice** — never "Free Forever" / "100% free" / "free without limitations". #22 Conversion on tier-anchor copy.
- **Risk if wrong:** **medium** — banned-phrase exposure if framing drifts toward "free forever" framing.
- **Status:** active.

## When a claim changes

1. `claim-review` (or the originating skill) flags the proposed change.
2. Legal Council convenes. #24 VETO applies if the change touches privacy / consent language. Typography Council (#3 + #31 + #32) VETO applies if the change touches a typographic-quality claim.
3. Every surface in the "Surfaces" line updates in lockstep (hand off to `writer` / `web-implementation` / `legal-page-draft` / engineering).
4. The old entry is marked `retired (replaced by <new entry> on YYYY-MM-DD)`.
5. A new entry is appended for the updated claim.

No orphan claims. No partial updates.

## Changelog

- 2026-05-14: Rescoped from AG (wallet-security categories / wallet-security claims) to PagePerfect (compile/export/billing/Lulu categories / KDP-IngramSpark-Lulu claim provenance). Golden-ratio claim flagged P0 per STATUS.md.
