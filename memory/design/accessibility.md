# accessibility.md

Accessibility gates for every PagePerfect design surface. #8 Accessibility specialist holds a **VETO** — nothing that violates AA ships, and nothing that degrades keyboard / screen-reader / motion safety ships.

WCAG AA is a floor. It is not the goal. The goal is usable for every reader.

## Contrast floors (Swiss-Ogilvy specimen)

See `tokens.md` for the full token ladder. The canonical PagePerfect color floor lives in `projects/pageperfect/DESIGN.md` **principle #5**: "Low-contrast gray is the enemy of utility."

- Body copy on cream `#FDFCF8`: `#333333` minimum (≥ 12.6:1 — AAA).
- Secondary text / descriptions: `#444444` – `#555555` (≥ 7.5:1 — AAA).
- Labels / metadata / kickers: `#555555` minimum (7.5:1). **Correction 2026-07-06:** `rgba(17,17,17,0.5)` blends to ~`#878786` on cream — ~3.5:1, which FAILS AA for normal-size text. It is no longer sanctioned for functional text; permitted only on decorative/aria-hidden content or ≥18px/bold display furniture.
- Never `#999` or lighter for functional text. Period.
- Interactive text (links, buttons): AA minimum; AAA preferred on the red primary CTA.
- Error / destructive: red `#FF3333` must hold AA on its container surface — verify against the actual background.
- Editor (`/app`) inverse surfaces: warm white `#f2f2f0` body on `#050505` / `#0a0a0a` / `#111111` — AAA.

## Keyboard

- Every interactive element reachable by Tab in a logical order.
- Every interactive element has a visible focus ring.
- Focus ring not removed in animation or transition states.
- Modal opens → focus moves to first focusable element inside; Esc closes and returns focus to trigger.
- Skip-to-content link on long pages — `.skip-link` utility in `globals.css`, present in `(site)/layout.tsx`.

## Screen readers

- Semantic HTML first. `<nav>`, `<main>`, `<article>`, `<aside>`, `<footer>` — used correctly, not as div substitutes.
- Heading hierarchy: one `<h1>` per page, no skipping levels.
- Landmarks labelled when multiple exist (`aria-label="Primary navigation"`, etc.).
- Live regions (`aria-live`) used when content changes dynamically (compile status, toast, error, queue position).
- Decorative SVG: `aria-hidden="true"`. Meaningful SVG: `aria-label` or `<title>`.
- Alt text on every image — literal for content images, empty (`alt=""`) for decorative.
- Icon-only buttons: `aria-label` mandatory.

## Motion safety

- `prefers-reduced-motion` honoured everywhere. See `motion.md` for the contract.
- No flashing content (>3Hz) — ever.
- Auto-advancing content (carousels, ticker rows) pauses on hover + focus.
- Infinite animations have an off-switch under reduced motion.
- The `Reveal` / `RevealGroup` wrappers in `frontend/src/components/Reveal.tsx` must short-circuit to the end state under `prefers-reduced-motion`.

<!-- TODO: verify all `.animate-*` keyframes in globals.css have a matching `@media (prefers-reduced-motion: reduce)` branch — STATUS.md flags this as an open gap (6 motion locations, only 1 reduced-motion branch). -->

## Forms

- Every input has a label. Placeholder is not a label.
- Errors: announced via `aria-live="polite"` when they appear.
- Required fields marked with both `aria-required` and a visual indicator (asterisk; color alone is not enough).
- Error messages tied to the input with `aria-describedby`.
- Submit button text is a verb (Sign in, Save, Reset password) — never "Click here", never "Submit" alone.

## Color + meaning

- No color-only signalling. Every color-coded signal pairs with a second cue (icon, label, pattern).
- Compile status (queued / running / done / failed) pairs color with a text label.
- Typography quality grades (A/B/C/D) pair color with the letter grade glyph — used in FloatingHUD, PreviewPane, LaunchOverlay.
- Watermark notice uses both color (amber) and explicit copy ("Download Preview PDF (Watermarked)").

## Links + buttons

- Descriptive text. "Read the docs" over "click here". "Cancel subscription" over "continue".
- Destination clear from the link text alone, no context required.
- Buttons are `<button>`. Links are `<a>`. No `role="button"` on a `<div>`.
- The single red `#FF3333` primary CTA per surface is reserved for the highest-value action — never a utility.

## Zoom + reflow

- Supports 200% zoom without horizontal scroll on primary content.
- Supports text-only zoom (browser text-size) without breaking layout.
- Mobile reflow: 320px wide as the floor.

## Specific PagePerfect surfaces

- **Hero (`landing/Hero.tsx`)**: pure typography surface — no decorative imagery. The `<h1>` carries the headline; any kicker is mono with explicit text content.
- **Comparison (`landing/Comparison.tsx`)**: the interactive before/after slider needs a keyboard path (drag is not the only affordance) and ARIA labels for both panels.
- **TemplateGrid / TemplateShowcase**: template thumbnails are decorative; the template name + category carry the semantic. Cards are focusable; hover state mirrored on focus.
- **Steps / HowItWorks (`landing/Steps.tsx`)**: step numbers in mono should not be the only ordering cue — the `<ol>` structure carries it semantically.
- **CookieConsent (`components/CookieConsent.tsx`)**: live region for the banner; explicit Accept / Reject buttons; focus enters the banner when shown.
- **Editor (`/app`) — TopBar, FloatingHUD, PreviewPane, LaunchOverlay**: compile status, quality grade, queue position all announced via `aria-live="polite"`. Grade-D download lock uses both checkbox state and ARIA label.
- **Auth forms (login, forgot-password, reset-password)**: explicit labels, password visibility toggle keyboard-reachable, error messages tied to inputs.
- **Docs (`/docs`) + Journal (`/journal/[slug]`)**: long-form pages need a working skip-link and a proper heading outline (no h2 → h4 skipping).
- **Tooltips (`components/editor/Tooltip.tsx`)**: rendered via `createPortal`; ensure `aria-describedby` ties them to the trigger and they appear on focus, not only on hover.

## How accessibility fails the council

- #8 Accessibility **VETOES**: any AA contrast failure, any missing focus ring, any animation without a reduced-motion branch, any meaningful SVG without an accessible name, any color-only signal.
- #7 Visual designer rejects: text-over-image without scrim, overlapping content at 200% zoom, broken focus rings under motion.
- #15 Staff engineer rejects: keyboard path that requires memorising non-standard order, focus trap not tested on a new modal.

## How to check before ship

1. **Keyboard-only pass.** Tab through the surface. Every action reachable? Focus visible at every step?
2. **Screen-reader pass.** VoiceOver / NVDA. Does the page read in order? Are interactive elements announced?
3. **Contrast pass.** Verify tokens against the ladder in `tokens.md`. Any custom colors? Reject them or route through `design-token`.
4. **Reduced-motion pass.** Enable `prefers-reduced-motion` in devtools. Surface still functional? End state visible?
5. **Zoom pass.** 200% browser zoom. No horizontal scroll on primary content?

If any check fails, #8 blocks emit.

## Canonical sources

- `projects/pageperfect/DESIGN.md` — design principles, color floor (principle #5), button hierarchy.
- `tokens.md` — contrast floors, color tokens.
- `motion.md` — the `prefers-reduced-motion` contract.
- `frontend/src/app/globals.css` — `.skip-link`, focus utilities, motion tokens.
- `frontend/src/components/CookieConsent.tsx` — accessible consent pattern.

## Changelog

- 2026-05-14: Rescoped from upstream master-build-kit "Ledger / Glass" canon to PagePerfect's Swiss-Ogilvy specimen. Replaced AG-specific surfaces (Hero/CTABand/ChainLogoCarousel/Modal/RiskBadge/TurnstileWidget) with PagePerfect's actual surfaces (Hero, Comparison, TemplateGrid, Steps, CookieConsent, editor surfaces, auth forms). Replaced council names (Noor/Sable/Maren) with Standing Council seat numbers (#8 Accessibility veto, #7 Visual, #15 Staff engineer). Tied color floor to `DESIGN.md` principle #5. Flagged STATUS.md gap on `prefers-reduced-motion` coverage.
