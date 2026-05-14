# ecosystems.md

Live tracked publishing ecosystems with their integration paths, partner programmes, contacts, and evaluation criteria. This is the **operational file** for `integration-proposal`, `partnership-brief`, `listing-submission`, and `sponsorship-brief`. Targets in general live in `targets.md`; ecosystem-specific detail lives here.

## Tracking format

```
## <Ecosystem name>

- **Programme(s) / integration paths:** <name each open path>
- **URL:** <link — verify before use>
- **Partnership cost:** <free | revenue share | flat fee | equity>
- **Evaluation cycle:** <rolling | seasonal | ad-hoc>
- **Decision timeline:** <typical days from outreach to outcome>
- **Contact path:** <general description — no fabricated emails>
- **Evaluation criteria:** <>
- **Common disqualifiers:** <>
- **PagePerfect's pitch angle:** <one or two sentences>
- **Evidence of fit:** <existing compatibility, integration depth, output quality>
- **Last updated:** YYYY-MM-DD
```

## KDP (Amazon Kindle Direct Publishing)

- **Programme(s) / integration paths:** No formal third-party partner programme. The relationship is one-directional: authors upload PagePerfect-produced PDFs / EPUBs to their own KDP accounts.
- **URL:** kdp.amazon.com (verify before use).
- **Partnership cost:** none (no formal partnership exists).
- **Evaluation cycle:** n/a.
- **Contact path:** none formal. Indirect reach via KDP Select author conferences, KDP forum threads, and Amazon-author-focused press.
- **Pitch angle:** PagePerfect output passes KDP's print-PDF requirements on first upload — bleed, trim, gutter, embedded fonts, PDF/X-compatible output. The "KDP-ready" claim is the substantive differentiator.
- **Evidence of fit:** compile pipeline targets KDP's published spec; templates are sized to KDP's supported trim sizes.
- **Risks / disqualifiers:** any KDP TOS revision that changes accepted PDF specs requires immediate output-pipeline review. <!-- TODO: confirm date of last KDP spec revision and check our pipeline against it. -->
- **Last updated:** <to set on first use of this file>

## IngramSpark

- **Programme(s) / integration paths:** Formal partner / integration ecosystem exists for tooling vendors. Direct upload by author is the primary path.
- **URL:** ingramspark.com (verify before use).
- **Partnership cost:** typically free for tooling-listings; flat-fee or revenue share for deeper integrations. <!-- TODO: verify current partner-programme terms before pitching. -->
- **Evaluation cycle:** ad-hoc; no published cycle.
- **Contact path:** IngramSpark publishes a partner-enquiry route via their site.
- **Pitch angle:** PagePerfect output meets IngramSpark's File Creation Guide on first upload. Premium / library distribution is a Studio-tier audience.
- **Evidence of fit:** templates and compile pipeline track IngramSpark's spec including hardcover and case-laminate trim sizes.
- **Risks / disqualifiers:** Spec revisions; PagePerfect must re-verify on every published guide update.
- **Last updated:** <>

## Lulu xPress

- **Programme(s) / integration paths:** Direct API integration. **Existing partner relationship.**
- **URL:** lulu.com / developers.lulu.com (verify before use).
- **Partnership cost:** per-unit print + shipping, revenue-share or flat depending on contract. <!-- TODO: confirm current contract terms in `context/` or with operator. -->
- **Evaluation cycle:** ongoing (live integration).
- **Contact path:** existing Lulu partner relationship.
- **Pitch angle:** PagePerfect already integrates with the Lulu API; we use Lulu's `pod_package_id` schema. Co-marketing, joint case studies, and Lulu's author-newsletter slots are credible asks.
- **Evidence of fit:** live API integration, current and shipping.
- **Risks / disqualifiers:** API revisions; `pod_package_id` schema changes; Lulu TOS revisions. Track every change.
- **Last updated:** <>

## Draft2Digital

- **Programme(s) / integration paths:** Aggregator for non-Amazon ebook retailers (Apple Books, Kobo, Barnes & Noble, libraries). Integration relevant when PagePerfect adds reliable EPUB export (Studio tier).
- **URL:** draft2digital.com (verify before use).
- **Partnership cost:** D2D takes a percentage of net sales; tooling vendors typically pay nothing.
- **Evaluation cycle:** rolling.
- **Contact path:** D2D publishes partner enquiry routes.
- **Pitch angle:** PagePerfect Studio-tier EPUB output is D2D-ready and an aggregator-friendly hand-off after typesetting.
- **Evidence of fit:** Studio-tier EPUB export. <!-- TODO: confirm EPUB output meets D2D's current validator before pitching. -->
- **Last updated:** <>

## PublishDrive

- **Programme(s) / integration paths:** International ebook + print aggregator.
- **URL:** publishdrive.com (verify before use).
- **Partnership cost:** subscription model on the author side; partner / integration terms separate.
- **Evaluation cycle:** rolling.
- **Pitch angle:** PagePerfect output bound for international distribution; PD covers regions D2D doesn't.
- **Evidence of fit:** EPUB export (Studio). Print-PDF compatibility per PD's spec.
- **Last updated:** <>

## Reedsy

- **Programme(s) / integration paths:** Marketplace for freelance editors, designers, marketers. Adjacent (not a distribution platform) but a high-trust referral source.
- **URL:** reedsy.com (verify before use).
- **Partnership cost:** marketplace listing is for service providers; PagePerfect's path is partnership / integration rather than listing.
- **Contact path:** Reedsy publishes partner-enquiry routes.
- **Pitch angle:** PagePerfect as the typesetting tool Reedsy editors and book coaches recommend to their author-clients after the edit lands.
- **Evidence of fit:** Drafter free tier means an author can try PagePerfect with an editor in the loop at zero cost.
- **Last updated:** <>

## ALLi (Alliance of Independent Authors)

- **Programme(s) / integration paths:** ALLi-approved partner programme. UK-based, global membership.
- **URL:** allianceindependentauthors.org (verify before use).
- **Partnership cost:** partner fee model. <!-- TODO: verify current ALLi partner-programme fees before pitching. -->
- **Evaluation cycle:** ad-hoc; partner applications reviewed by ALLi staff.
- **Contact path:** ALLi publishes a partner-application route.
- **Pitch angle:** ALLi-approved partner status; member-discount on Publisher / Studio tiers; co-published guides on typesetting for indie authors.
- **Evidence of fit:** PagePerfect is indie-author-shaped (lifetime pricing, free preview tier, no per-book DRM).
- **Last updated:** <>

## Authors Guild

- **Programme(s) / integration paths:** US-based established association. Partner-programme path possible.
- **URL:** authorsguild.org (verify before use).
- **Partnership cost:** partner-fee or member-benefit model. <!-- TODO: verify partner programme terms. -->
- **Pitch angle:** PagePerfect as a hybrid-author-friendly typesetting tool; member-benefit discount.
- **Evidence of fit:** indie + hybrid author posture.
- **Last updated:** <>

## NaNoWriMo

- **Programme(s) / integration paths:** Annual November novel-writing event; large post-event "what next?" cohort. Sponsorship and partner-pricing path.
- **URL:** nanowrimo.org (verify before use).
- **Partnership cost:** sponsorship tiers (cash) or partner-discount model (free).
- **Evaluation cycle:** annual cycle building Q3–Q4; January / February post-event is the upgrade-conversion window.
- **Pitch angle:** PagePerfect Drafter (free) for during-event preview; Publisher / Studio discount for post-event manuscripts going to print.
- **Evidence of fit:** Drafter tier is exactly the "try it during the draft" tool NaNoWriMo participants want.
- **Last updated:** <>

## Adjacent: writing-stack tools (integration referrals)

These aren't ecosystems we list in, but they're upstream tools whose users hand off to a typesetter. Integration here means hand-off, not deep API integration.

- **Scrivener** — long-standing drafting tool; export-to-Markdown path exists.
- **Plottr** — story-structure tool; tangential but author-overlap.
- **Sudowrite, NovelAI** — AI-assisted drafting; hand-off to PagePerfect for typesetting.
- **Atticus, Vellum** — direct competitors, not integration targets. <!-- Listed here only so they don't accidentally end up in the partnership pipeline. -->

## Ecosystems we do not pursue

Write these down to avoid re-asking:

- **Blockchain / crypto / Web3 publishing platforms** — out of scope; off-product.
- **Vanity-press operations** — conflict with PagePerfect's indie-author positioning.
- **Closed-platform-only** integrations where PagePerfect would lose its "author owns the output" posture.
- **Programmes in OFAC-sanctioned jurisdictions** (see `memory/compliance-risk/jurisdictions.md`).

## How this file is maintained

- On every `integration-proposal` or `partnership-brief` run: verify the ecosystem's URL is live and the partner terms haven't shifted.
- When a programme launches / ends / restructures: update here + note in `partnerships-history.md`.
- When we're invited into a programme we didn't apply to: add an entry here noting the relationship origin.
- Every entry cites a source + date on its last-updated line.

## Open questions for the operator

- Is PagePerfect Ltd / which entity signs partner agreements? Jurisdictional fit matters.
- Is there a stated policy on revenue-share vs flat-fee partnership terms?
- Who is authorised to sign partner agreements? (Usually the founder, but must be documented.)
- Is there a partner-marketing budget? Affects sponsorship sizing (NaNoWriMo, ALLi events, indie-author conferences).

Answer these once; they become canonical. Store answers in `BUSINESS.md` or an ADR, not here.

## Changelog

- 2026-05-14: Rescoped from AG segments / crypto regs / EF-style ecosystems to PagePerfect publishing market (KDP / IngramSpark / Lulu / indie author segments). Crypto regs and chain ecosystems removed entirely.
