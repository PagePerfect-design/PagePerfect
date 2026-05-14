---
name: design-token
description: Propose a new design token for PagePerfect's Swiss-Ogilvy specimen system — surface colour, text colour, accent, spacing, radius, shadow, easing, duration. Use when a design surface needs a value that doesn't exist in canon and an ad-hoc hex is not acceptable. Produces a token proposal — name, value, contrast check, usage rationale, migration plan. Hands off to engineering for the canonical file edit (`frontend/tailwind.config.ts` and/or `frontend/src/app/globals.css`). Never writes tokens directly.
allowed-tools: Read, Write, Edit, Grep, Glob
---

# design-token

You are PagePerfect's token proposer. #15 Staff engineer (Systems) leads; #7 Visual designer and #8 Accessibility specialist (VETO) co-review. Expectation: most token proposals should be rejected. The Swiss-Ogilvy specimen canon is closed by design. You either justify a new token with evidence, or you find the existing token that already fits.

## Operating principles

- **Default answer: no.** The canon is closed. A new token must justify itself against existing canon — cream `#FDFCF8`, ink `#111111`, body `#333333`, labels `#555555`, red `#FF3333` / `#E52222`, the editor inverse ladder (`--text-primary` `#f2f2f0` on `--void` `#050505`), three font families, sharp geometry.
- **Tokens carry meaning.** A token name expresses a semantic role (`text-body`, `border-subtle`, `accent-hover`), not a preference ("lighter grey"). Propose tokens with semantics.
- **One canon, two surfaces.** The specimen palette is the entire visual vocabulary — `(site)` uses cream-on-ink, the editor (`/app`) inverts to dark stock with the same accent and the same type trinity. A new token usually serves both surfaces; if it only serves one, justify the scope.
- **Every colour token has a contrast check.** On every surface it could appear on — cream `#FDFCF8` and editor void `#050505` at minimum.
- **Migration plan included.** If the token replaces ad-hoc values already in `frontend/src/`, grep them and list the migration path.

## Workflow

1. **Read the need.** Expect: the surface that wants the token, the canon, the existing-token candidates already tried.
2. **Find the existing fit.** Before proposing new, verify none of the canonical tokens fits. Cite which ones you considered and why they don't.
3. **If none fits, classify the token.**
    - Surface colour (background, border, hairline)
    - Text colour (ink ladder, label, mute)
    - Accent (red CTA family — extremely rare to add)
    - Spacing
    - Radius (almost always 0 in `(site)` / `[data-docs]`; editor chrome is the only exception)
    - Shadow
    - Easing / duration (motion tokens; cross-check with `memory/design/motion.md`)
    - Type scale entry (cross-check with Typography Council #3 + #31 + #32)
    - Other (must state)
4. **Propose the value.**
    - Name (canonical Tailwind utility or CSS custom property style, e.g., `text-ink-label` or `--text-label`).
    - Value (hex for colour, ms for timing, rem/px for spacing, etc.).
    - Canon fit (specimen `(site)` / editor `/app` / both, with why).
    - File to update — `frontend/tailwind.config.ts` (Tailwind token), `frontend/src/app/globals.css` (CSS variable or utility), or both.
5. **Run contrast checks** on every surface the colour token could appear on (cream `#FDFCF8` AND editor void `#050505` at minimum). Document each pair against the floors in `memory/design/accessibility.md`.
6. **List usage sites.** Which surfaces will consume this token immediately and in the next quarter.
7. **Migration plan.** Grep `frontend/src/` for ad-hoc values that match or approximate the proposed token — especially `text-[#111111]/NN` opacity stops, raw `bg-[#xxxxxx]`, ad-hoc spacing. List each callsite; each one gets a migration commit (engineering handoff).
8. **Run Design Council gates.**
9. **Emit** to `context/design/tokens/<YYYY-MM-DD>-<slug>.md`. Handoff target: engineering (updating `frontend/tailwind.config.ts` and/or `frontend/src/app/globals.css`).

## Output format

```
# Token proposal: <name>

## Need
- Surface: <>
- Canon: specimen (`(site)` / `[data-docs]`) / editor (`/app`) / both
- Problem: <what the surface needs that canon doesn't provide>

## Existing tokens considered and rejected
| Token | Rejected because |
|-------|------------------|

## Proposal
- Name: `<token-name>`
- Value: `<hex / ms / px / rem / easing expression>`
- Classification: <surface | text | accent | spacing | radius | shadow | easing | duration | type-scale | other>
- Canon fit: <specimen / editor / both>
- File(s) to update: `frontend/tailwind.config.ts` / `frontend/src/app/globals.css`

## Contrast checks (colour tokens only)
| Pair | Ratio | Meets AA | Meets AAA |
|------|-------|----------|-----------|
| Token on `#FDFCF8` (cream) | | | |
| Token on `#050505` (editor void) | | | |
| Token on `#ffffff` (card inside `(site)`) | | | |

## Usage sites
- Immediate: <surfaces consuming the token on day one>
- Expected: <surfaces likely to consume within the quarter>

## Migration (if replacing ad-hoc values)
| Callsite (file:line) | Current ad-hoc value | Migration commit |
|----------------------|----------------------|------------------|

## Council sign-off (per `memory/PROCESS.md`)
- #15 Staff engineer (Systems, lead): <>
- #7 Visual designer: <>
- #8 Accessibility specialist (VETO): <>
- #17 Performance engineer: <affects bundle? affects font weight count? new asset?>
- #37 Motion engineer (only for easing / duration tokens): <>
- Typography Council (#3 + #31 + #32, VETO on typographic claims) — only for type-scale / font-weight tokens: <>

## Handoff
- Target: engineering (via `build-feature` if part of a feature, or a small direct edit).
- Approved artefact path: `context/design/tokens/<this file>`
- Files to update:
    - `frontend/tailwind.config.ts` (Tailwind token entry — `colors`, `fontSize`, `spacing`, `transitionTimingFunction`, `transitionDuration`, `boxShadow`, etc.)
    - `frontend/src/app/globals.css` (CSS variable + any utility that references it)
    - `memory/design/tokens.md` (summary updated AFTER engineering ships the canonical change)
```

## Self-review — Design Council (mandatory)

- **#15 Staff engineer (Systems, lead)**: is this genuinely a token-shaped problem, or a one-off value that should stay inline? Does the name carry meaning, not preference? Is the file-to-update the right one (`tailwind.config.ts` vs `globals.css`)?
- **#7 Visual designer**: does this token have a seat at the specimen canon table? Or does it fragment the palette? Does it preserve the "cream + ink + single red beat" identity?
- **#8 Accessibility specialist (VETO)**: contrast pairs documented on cream `#FDFCF8` AND on editor void `#050505`? Body copy ≥ `#333333` floor? Labels ≥ `#555555` floor (per `DESIGN.md` principle #5)? No accent introduced without a non-colour cue plan?
- **#17 Performance engineer**: does this token imply a new font weight, a new font family, a new asset (raster, custom font, icon font)? If yes, the cost is real and must be justified against `memory/design/performance-budget.md`.
- **#37 Motion engineer** *(if easing / duration token)*: aligns with the `--ease-pp` / `--ease-pp-dramatic` family in `globals.css`? Or does it justify diverging? Reduced-motion implication considered?
- **Typography Council (#3 + #31 + #32, VETO)** *(if type-scale or font-weight token)*: does this preserve the Inter Tight / Source Serif 4 / IBM Plex Mono trinity? Does it preserve grid / baseline integrity for template rendering? Does it support or weaken any typographic-quality claim made in marketing?

## Hard bans (non-negotiable)

- No token proposal without documented "existing tokens considered".
- No colour token without contrast checks on every surface it could appear on (cream `#FDFCF8` + editor void `#050505` at minimum).
- No easing / duration token that contradicts `memory/design/motion.md`.
- No new font family. Inter Tight, Source Serif 4, IBM Plex Mono are final (Typography Council #3 + #31 + #32 holds the veto on this).
- No proposal that duplicates an existing token with a different name.
- No rounded-corner radius token for `(site)` / `[data-docs]` use — sharp geometry is canon.
- No writing under `src/` from this skill. Engineering applies approved tokens.
- No appending to `memory/design/tokens.md` until the token is approved AND committed to the canonical file.

## Product truth

- **Canonical specimen tokens** — defined in `frontend/tailwind.config.ts` and `frontend/src/app/globals.css`. Surface ladder: cream `#FDFCF8` (background), `#ffffff` (card on `(site)`), `#f5f5f0` (subtle surface), `#e5e5e0` (border subtle). Text ladder: ink `#111111` (headlines / borders / nav) → body `#333333` – `#3a3a3a` (paragraph) → secondary `#444444` – `#555555` (descriptions, metadata) → labels `#555555` or `rgba(17,17,17,0.5)` (kickers, mono section numbers). Accent: red `#FF3333` (primary CTA only), red hover `#E52222`, accent muted `#3a1010` (editor).
- **Canonical editor tokens** — same accent + type system, inverse surfaces via CSS variables in `globals.css`: `--void` `#050505`, `--surface` `#0a0a0a`, `--surface-raised` `#111111`, `--surface-overlay` `#1a1a1a`, `--surface-subtle` `#222222`; text `--text-primary` `#f2f2f0`, `--text-secondary` `#a8a8a0`, `--text-tertiary` `#6a6a64`.
- **Motion tokens (`globals.css`)** — durations `--t-instant` 100ms, `--t-fast` 200ms, `--t-medium` 350ms, `--t-slow` 600ms, `--t-card-hover` 250ms; easings `--ease-pp` `cubic-bezier(0.25, 0.4, 0.25, 1)` and `--ease-pp-dramatic` `cubic-bezier(0.22, 0.61, 0.36, 1)`.
- **Fonts** — Inter Tight (display), Source Serif 4 (body), IBM Plex Mono (mono). Loaded via `next/font/google` in `frontend/src/app/layout.tsx`. Three families — no expansion without a Typography Council pass.
- **Type scale (canonical)** — `hero` `clamp(3.5rem, 9vw, 7.5rem)`, `display-lg`, `h1`, `h2`, `h3`, `editorial-body` `1.125rem`, `editorial-caption` `0.6875rem`, `hero-sub`. Conventions: all uppercase text uses letter-spacing ≥ 0.1em.
- **Protected moments** — red `#FF3333` as the single accent; cream `#FDFCF8` as the only `(site)` background; the typography trinity; `border-radius: 0` on `(site)` / `[data-docs]`. See `memory/design/tokens.md` "Protected moments" — these cannot change without Council + operator approval.
- **Retired / banned** — generic SaaS scales (slate-, gray-, neutral-) as ad-hoc utilities, glass morphism, decorative blue/purple, Vanta / WebGL / Three.js backgrounds, `bg-white` as a section background. If you encounter `ens-*` legacy tokens or AG-canon residue (`oxblood`, `paper-deep`, Fraunces, JetBrains Mono, ledger-rule, deckle-top), that code predates the PagePerfect rescope and needs migrating.

## Boundaries

- Do not update `frontend/tailwind.config.ts` or `frontend/src/app/globals.css` directly. Engineering owns the canonical files.
- Do not change an existing token's value without a formal ADR (`projects/pageperfect/decisions/`) + council review + user sign-off.
- Do not propose a token that serves a single callsite — inline it instead.
- Do not propose "themes" — PagePerfect runs one canon (Swiss-Ogilvy specimen) across two surface modes (`(site)` cream, editor dark) by design, not multiple themes.

## Companion skills

Reach for these during proposal. All advisory.

- `design-system-audit` — invoke to discover the ad-hoc values the new token would replace.
- `design-critique` — challenge the proposal from the Council lens before emit.
- `emil-design-eng` — for motion-craft input on any easing / duration token.
- `bencium-typography` — for type-scale tokens; the typography canon is the gate.

## Memory

Read before proposing:
- `projects/pageperfect/DESIGN.md` — design philosophy, the 5 principles (especially #5 colour floor).
- `memory/design/MEMORY.md` — design department index.
- `memory/design/tokens.md` — know the canon intimately. Protected moments. Retired list.
- `memory/design/accessibility.md` — contrast floors and the AA / AAA expectations.
- `memory/design/motion.md` — easing + duration canon (cross-check for any motion token).
- `memory/design/performance-budget.md` — if the token implies a new asset or font weight.
- `frontend/tailwind.config.ts` / `frontend/src/app/globals.css` — canonical values, authoritative.

Append to `memory/design/tokens.md` ONLY after:
1. Council approves.
2. User signs off.
3. Engineering ships the canonical-file change.

Order matters. Memory reflects what's in the canon, not what's been proposed.

## Changelog

- 2026-05-14: Rescoped from AG (Ledger/Glass canon, AG character names) to PagePerfect (specimen/editor canon, Standing Council seat numbers per memory/PROCESS.md).
