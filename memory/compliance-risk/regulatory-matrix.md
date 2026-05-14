# regulatory-matrix.md

Regulations and platform rules that apply to PagePerfect, organised by jurisdiction × surface × status. This is the map #23 Regulatory counsel + #9 Lawyer use for every compliance review.

Not every column below applies to every surface. The matrix is a prompt for the question "have we considered this?" — not a compliance certification.

## Jurisdictions (scope)

See `jurisdictions.md` for the authoritative scope. Summary:

- **Primary:** England & Wales (UK).
- **Material:** EU (via GDPR + PECR-equivalent national laws), US (via CCPA/CPRA and state-level privacy laws; FTC for advertising claims).
- **Monitored:** Switzerland, Canada, Australia (future expansion markets).
- **Excluded:** OFAC / HM Treasury sanctioned jurisdictions.

## Regulations by category

### Data protection & privacy

| Regulation | Jurisdiction | Applies because | Status | Surface(s) |
|-----------|--------------|-----------------|--------|-----------|
| UK GDPR + DPA 2018 | UK | Primary operating jurisdiction; we process user email, manuscript content (session-scoped), IP logs, analytics | **Active compliance** | Privacy policy, DPA, cookie consent, account settings, analytics |
| EU GDPR | EU | We have EU users | **Active compliance** | Same surfaces; cross-border transfer mechanism required (Standard Contractual Clauses / adequacy) |
| PECR (UK) | UK | Cookies + direct marketing | **Active compliance** | Cookie banner, email consent, B2B outreach |
| ePrivacy Directive (EU) | EU | Same as PECR | **Active compliance** | Same surfaces |
| CCPA / CPRA | California | We have California users | **Monitor** — action if we cross user thresholds | Privacy policy mentions CCPA rights; opt-out mechanism |
| Other US state laws (VCDPA, CPA, CTDPA, UCPA, and the growing set) | US states | State-by-state privacy laws as passed | **Monitor** | Privacy policy updates per jurisdiction |
| Swiss FADP | CH | If Swiss users exceed threshold | **Monitor** | — |

#### Manuscript-specific privacy notes

PagePerfect's most sensitive data is **user manuscript content** uploaded for compile. The product posture is:

- Manuscripts are session-scoped.
- Manuscripts are not used for training, evaluation, or analytics.
- Deletion is on request (and automatic per session policy). **Verified 2026-05-14:** the backend ships a hard 24-hour TTL for stored manuscripts. `backend/index.js:332` sets `MANUSCRIPT_MAX_AGE_MS = 24 * 60 * 60 * 1000`; `sweepExpiredManuscripts()` at `:334-377` runs every 6h (interval at `:380`) and DELETEs every PocketBase `manuscripts` record where `updated < (now - 24h)`. Compile results have a separate 30-minute TTL (`RESULT_TTL_MS` at `index.js:139`); uploaded image assets a 24-hour TTL (`ASSET_MAX_AGE_MS` at `:201`). Privacy policy at `frontend/src/app/(site)/privacy/page.tsx:79` says "Your manuscript is stored only for your active session" — strictly true (session-scoped on the client) but the canonical retention window in `backend/` is **24 hours from last `updated` timestamp**. <!-- TODO (sharpened 2026-05-14): privacy-page copy says "active session" which is vaguer than the actual 24h sweeper window. Operator + `legal-page-draft` to decide whether to (a) tighten the sweeper to <1h to match "session-scoped" or (b) clarify the privacy page to state "up to 24 hours after last edit, then automatic deletion". -->
- The cookie-consent copy and privacy page must reflect this posture verbatim; drift between code and copy is a Legal Council escalation.

### Consumer protection & advertising claims

| Regulation | Jurisdiction | Applies because | Status | Surface(s) |
|-----------|--------------|-----------------|--------|-----------|
| Consumer Rights Act 2015 | UK | Digital content + per-manuscript / lifetime purchases | **Active compliance** | Terms of service, cancellation flow, refund policy |
| Consumer Contracts Regulations (UK) | UK | 14-day cancellation right unless digital-content waiver applies | **Active compliance** | Checkout copy, refund policy |
| CRD / Distance Selling (EU) | EU | Same | **Active compliance** | Same + 14-day cooling-off period copy |
| Advertising Standards (ASA, UK) | UK | Marketing claims must be accurate and substantiated | **Active compliance** | Every marketing surface — all claims trace to source |
| CAP Code (UK) | UK | Non-broadcast advertising code | **Active compliance** | Same |
| FTC Section 5 + advertising guides (US) | US | Deceptive trade practices, endorsement disclosures | **Active compliance** | Marketing + any creator partnerships |
| ICO guidance on online advertising | UK | Overlaps with ASA + PECR | **Active compliance** | Marketing + ads |

#### Substantiation rule (Typography Council + Copy Council)

Every claim PagePerfect makes about output quality must be defensible before it ships:

- **"KDP-ready" / "KDP-compliant"** — substantiated only when output is clean (Publisher / Studio tiers). Drafter output is watermarked and the surfaces it appears on must say "preview" or "watermarked preview". Typography Council (#3 + #31 + #32) holds the veto.
- **"IngramSpark spec"** — bleed, trim, gutter, spine math must round-trip through IngramSpark's published specs. Cite the spec version.
- **"Lulu-ready"** — must match Lulu's current `pod_package_id` formats. Cite the integration version.
- **"Golden-ratio", "Müller-Brockmann grid", "baseline-conforming"** — math must match the claim. The `TRANSFORMATION_COUNCIL.md` open item on golden-ratio scale is the standing example (see `BUSINESS.md`).
- **Competitor comparisons** (Vellum, Atticus, InDesign, Kindle Create, Reedsy Book Editor) — must cite the competitor's own published price / feature page, with a captured-on date.

### Platform terms of service (publishing distribution)

These aren't regulations, but they bind PagePerfect's claims and integration behaviour. Treated as part of the matrix because violations carry the same kind of risk (claim defensibility, integration cut-off).

| Platform rule | Applies because | Status | Surface(s) |
|---------------|-----------------|--------|-----------|
| **KDP Terms of Service** (Amazon) | Authors who use PagePerfect output upload to KDP under their own KDP account; we describe our output as "KDP-ready" | **Active monitoring** — re-read on every KDP TOS revision | Marketing claims, output specs, support docs |
| **KDP Content Guidelines** | Authors must comply with KDP content rules; PagePerfect does not screen content, but our docs should remind users of metadata-accuracy and content-policy obligations | **Active compliance** | Docs, onboarding copy |
| **IngramSpark File Creation Guide** | "IngramSpark spec" claim requires the output to match the current guide | **Active compliance** | Output specs, marketing claims |
| **Lulu xPress API ToS** | We have a direct integration; Lulu's API terms govern what we can submit on the author's behalf | **Active compliance** | Integration code, terms of service |
| **Draft2Digital Author Terms** | Future integration target; relevant when Studio tier adds EPUB export for D2D distribution | **Monitor** | — |
| **PublishDrive Terms** | Same — international ebook aggregator integration | **Monitor** | — |

### Accessibility & equality

| Regulation | Jurisdiction | Applies because | Status | Surface(s) |
|-----------|--------------|-----------------|--------|-----------|
| Equality Act 2010 (UK) | UK | Accessibility of digital services | **Active compliance — Accessibility VETO (#8)** | Every UI surface |
| EAA (EU) | EU | European Accessibility Act, in force from June 2025 | **Active compliance** | Every UI surface served to EU users |
| ADA (US) | US | Public accommodations digital accessibility | **Active compliance** | Same |
| WCAG 2.1 AA | all | De facto technical floor | **Active compliance — Accessibility VETO (#8)** | Every UI surface |

### Payments & financial

| Standard | Jurisdiction | Applies because | Status | Surface(s) |
|----------|--------------|-----------------|--------|-----------|
| PCI DSS | all | We touch payment data indirectly via Stripe Checkout | **Stripe's scope** — we remain out-of-scope by using Stripe-hosted Checkout; any deviation re-introduces PCI scope | Checkout flow, webhook handler |
| SCA / PSD2 (UK + EU) | UK / EU | Strong Customer Authentication for card payments | **Stripe handles** — confirm SCA flows render correctly on EU traffic | Checkout |
| HMRC VAT-MOSS / EU VAT OSS | UK / EU | Digital service VAT on B2C sales | **Active compliance** — Stripe Tax or manual VAT registration; confirm posture before any pricing-page rewrite | Pricing, invoicing |
| US sales tax (state-by-state for digital goods) | US states | State-level digital-goods tax obligations vary | **Monitor** — action when revenue thresholds approach | Pricing, invoicing |

### Intellectual property

| Regime | Jurisdiction | Applies because | Status | Surface(s) |
|--------|--------------|-----------------|--------|-----------|
| Copyright (manuscript content) | all | Authors own their manuscript; PagePerfect must not claim a licence beyond what is needed to render the PDF | **Active compliance** | Terms of service, privacy policy |
| Font licensing | all | We embed fonts in compiled PDFs; commercial-use embedding rights must hold for every font shipped | **Active compliance** | Font roster in `frontend/` + `backend/`; track per font: licence type, embedding permission, source |
| Template originality | all | Marketing claims about template design originality | **Monitor** | Templates page, marketing copy |

### Enterprise / customer-driven (not pursued)

| Standard | Status | Note |
|----------|--------|------|
| SOC 2 | **Not pursued** | Revisit if enterprise / institutional press demand justifies the cost. |
| ISO 27001 | **Not pursued** | Same. |

## How this matrix is used

- `claim-review` consults it when a claim has regulatory or platform-rule exposure.
- `policy-alignment` checks ad copy against ASA / CAP / FTC, and platform-marketing rules.
- `security-claim-audit` checks any data-protection / privacy / security claims against UK GDPR / EU GDPR / PECR.
- `regulatory-change-response` updates this matrix when new law lands.
- `legal-page-draft` cites the right regulation in every page section.

## When regulation changes

1. `regulatory-change-response` is run.
2. The new regulation gets a row here (with effective date).
3. Gap analysis identifies which surfaces need copy / feature / operational changes.
4. Remediation hands off to the owning skill(s).
5. This file updates with status: **Active compliance**, **In progress**, or **Not applicable — see rationale**.

## What this matrix is not

- Not legal advice. #9 + #23 + #24 are the councils; a retained human lawyer is the authority for any material interpretation.
- Not a compliance certificate. Compliance is a state at a point in time; this matrix is the map that helps us get there.
- Not exhaustive. New regulations appear; new product surfaces introduce new regulatory exposure. Re-read this file against every material product change.

## Standing watch list

Things that could change our posture significantly — monitor via legal news + regulator publications:

- **KDP terms revisions** (Amazon) — re-read on every published revision; "KDP-ready" claim must survive.
- **IngramSpark spec revisions** — bleed / trim / gutter / spine math must round-trip after every revision.
- **Lulu API revisions** — direct-integration TOS and `pod_package_id` schema changes.
- **UK financial-promotions and consumer-protection updates** — particularly around digital subscriptions and lifetime-licence products.
- **US state-level privacy laws** — more states passing comprehensive privacy laws each year.
- **EU AI Act** — unlikely to apply (PagePerfect is deterministic typesetting, not an AI system in the Act's sense), but watch for scope creep, particularly if we add any generative features.
- **EAA (EU Accessibility Act)** — secondary guidance and member-state implementations.
- **OFAC / HM Treasury sanctions lists** — user blocklist implications for payments.

## Changelog

- 2026-05-14: Rescoped from AG segments / crypto regs / EF-style ecosystems to PagePerfect publishing market (KDP / IngramSpark / Lulu / indie author segments). Crypto regs and chain ecosystems removed entirely.
