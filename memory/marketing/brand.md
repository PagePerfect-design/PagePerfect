# brand.md — PagePerfect voice

Canonical voice and banned-phrase list live in **`memory/VOICE.md`** (gatekeeper: Investor / founder voice, #11 VETO). This file is the **operational complement** marketing skills read alongside `VOICE.md` — PagePerfect-specific tone anchors, register choices, and proof standards. Do not duplicate `VOICE.md` here; reference it.

Voice template = the existing journal essays under `frontend/src/app/(site)/journal/articles-1.ts` and `articles-2.ts`. When in doubt, read three of them and match the register.

## Voice anchors

- **Editorial, not engineering.** PagePerfect is a typesetting tool. Voice closer to Vellum / Reedsy / a serious editorial supplement than to GitHub / Linear / dev tools.
- **Authoritative, not academic.** Speaks like an editor with strong opinions — not like a textbook, not like a Medium thought-leader.
- **Confident specificity.** Names exact things: 15 templates, 19 page sizes, 7 margin presets, $19.99 / manuscript, 14-day window, $199 lifetime. Vague abstractions ("rich features," "powerful tools") fail Copy Council #21 on the spot.
- **Print-craft reverence.** References printer's marks, baseline grids, Wheildon's RMIT comprehension data, Müller-Brockmann's grid, Bringhurst's 45-75 character measure — when they substantiate a claim. Never as ornament.
- **Mild dry humour.** Never zany, never hustle, never "we built this in a weekend." Voice template = the existing journal essays.

## Tone Options — committed canon

From `memory/design/bold-design-principles.md`. PagePerfect commits to **one extreme per piece**:

**Canonical PagePerfect tone: "brutally minimal + editorial"** (Müller-Brockmann meets Pentagram).

Adjacent allowed:
- **Brutally minimal + industrial / utilitarian** — `/status` page, build manifest displays, technical bar.
- **Brutally minimal + brutalist** — error states, technical content, section dividers.

Off-brand combinations:
- "Brutally minimal + playful" (incoherent — pick one extreme).
- Maximalist / retro-futuristic / organic / luxury / pastel / art-deco / playful.

If a copy draft drifts into a forbidden tone, send it back.

## Hard bans

Full list in `memory/VOICE.md`. Repeated here only as a quick-reference, **not the canonical source**:

- "Free Forever" / "100% free" / "No premium features, no paywalls, no subscriptions"
- "No VC" / "No token" / "Community-funded" / "Donation-funded"
- Any defensive financial self-disclaimer ("we're not VC-funded but...")

**PagePerfect-specific additions** (apply on top of `VOICE.md`):

*Hustle-influencer register* — banned outright:
- "crushing it," "10x your output," "the secret to...," "level up your...," "unlock your..."
- "writers, this changes everything," "stop wasting time on..."
- "what nobody tells you about..."

*Crypto-adjacent register* — banned outright (we are not in that market):
- "alpha," "wagmi," "gm," "based," "ngmi," "ape in," "diamond hands"
- Any wallet / token / chain framing.

*Generic-AI tells* — banned outright (Copy Council #20 + de-ai-ify skill enforce):
- "seamless," "robust," "cutting-edge," "world-class," "game-changing," "revolutionary"
- "leverage," "synergy," "unleash," "empower," "delve"
- "in today's [fast-paced / digital / X] world"
- "in conclusion," "in summary," "elevate your [X]"
- "industry-leading," "best-in-class," "next-generation"
- Em-dash-pair adverbial inserts that read as ChatGPT cadence (audit with `de-ai-ify` skill).

*Status-anxiety framing* — banned (Copy Council #20):
- "look amateur," "look unprofessional," "get rejected" (as a fear primary)
- "embarrass yourself," "stand out from the crowd"

Educate, clarify, guide. Do not weaponise insecurity. The reader is a competent adult with a manuscript.

## Preferred phrasing

Pulled from `BUSINESS.md` + the journal essays. Use these patterns; vary the surface words.

**Tier framing** (exact text varies, structure does not):
- "Drafter — free. Watermarked PDFs. Forever."
- "Publisher — $19.99 per manuscript. Watermark-free for 14 days."
- "Studio — $199. Lifetime. Unlimited manuscripts."

**Engine framing**:
- "Pandoc converts your markdown. Typst sets the type."
- "Reproducible compile metadata. Same input, same PDF, every time."
- "Built on Pandoc and Typst — not LaTeX, not InDesign-derived, not AI-generated layout."

**Craft framing** (only when substantiated):
- "Baseline-grid alignment across 19 page sizes."
- "Optical margin alignment on every paragraph that needs it."
- "Hanging footnotes. Hyphenation control. Drop caps that don't fight the leading."

## Register table

| Use | Avoid |
|---|---|
| typography, baseline grid, leading, kerning, tracking | "design wizardry," "magic layout," "auto-typography" |
| compile, preflight, print-ready, KDP / IngramSpark / Lulu acceptable | "perfect book," "guaranteed acceptance," "professional results" |
| widows, orphans, drop caps, ligatures, optical margin alignment | "looks great," "pro-grade," "industry standard" (without source) |
| markdown, manuscript, template, page size, margin preset | "AI-formatted," "smart layout," "intelligent design" |
| Pandoc, Typst, PDF/X-1a, embedded fonts | "behind-the-scenes magic," "powerful engine," "next-gen rendering" |

Production-typography register. Not adtech or hype register.

## Proof standards

Numbers are facts. Use the exact ones. No rounding for emphasis.

- **Templates**: 15. Source: `BUSINESS.md`, `ARCHITECTURE.md`. Never "16," never "20+."
- **Page sizes**: 19. Never "20+."
- **Margin presets**: 7.
- **Heading variants per template**: 3 (classic / modern / bold).
- **Compile engine**: Pandoc (markdown converter) + Typst (PDF engine). Source: `decisions/0001-typst-migration.md`. Never "LaTeX-only," never "AI typesetting," never "InDesign-derived."
- **Tiers**:
  - Drafter — free, watermarked PDF. Müller-Brockmann Compositor's Mark overlay at 7% opacity (`backend/watermark.js`).
  - Publisher — $19.99, watermark-free for **one** manuscript during a 14-day window (per `entitlements.js`).
  - Studio — $199 lifetime, unlimited manuscripts.
- **Three capabilities, kept distinct**:
  - Drafting — paste / upload manuscript, pick template, get a watermarked PDF.
  - Publishing — Publisher / Studio export a clean, watermark-free PDF / PDF/X-1a.
  - Print-on-demand — Lulu xPress API integration (Studio tier); user owns the print order.

## Never claim

- Absolute typographic perfection ("perfect book," "perfect typography," "no flaws"). Quality is graded A-D, not asserted.
- Guaranteed KDP / IngramSpark / Lulu acceptance — those platforms own the final yes / no.
- Automatic correctness on free tier — watermark and grade thresholds apply.
- Legal, financial, or tax advice.
- "Golden-ratio scale" without verifying the open `grid-system.js` audit (STATUS.md / TRANSFORMATION_COUNCIL.md #14). The current multipliers (2.25 / 1.75 / 1.375) don't follow φ.
- Author income, sales lift, royalty change, or any number tied to a hypothetical reader response.

## Companion skills

This file is read alongside:

- **`memory/VOICE.md`** — canonical banned phrases (do not duplicate; reference).
- **`.claude/skills/de-ai-ify/SKILL.md`** — strips 47 AI-generated patterns. Run on every draft before emit.
- **`.claude/skills/voice-extractor/SKILL.md`** — extracts voice from existing copy. If a new long-form piece is needed, feed the voice-extractor a sample of the journal articles (`articles-1.ts`, `articles-2.ts`) before drafting.

## Cross-references

- Banned phrases (canonical) — `memory/VOICE.md` (#11 VETO).
- Tier rationale and watermark policy — `projects/pageperfect/BUSINESS.md`.
- Tone Options vocabulary — `memory/design/bold-design-principles.md`.
- Voice workflow rules — `memory/PROCESS.md` (Copy Council: Brand #20, Technical #21, Conversion #22).
- Legal gating — `memory/PROCESS.md` (Legal Council: #9, #23, #24 VETO on privacy copy).
- Typography accuracy — `memory/PROCESS.md` (Typography Council #3 + #31 + #32, VETO on typographic-quality claims).

## Changelog

- 2026-05-14: Rescoped from AG (DeFi/crypto/wallet-security segments and keywords) to PagePerfect (indie author / KDP / IngramSpark / Lulu / book-coach segments and keywords). Voice anchored to existing journal essays.
