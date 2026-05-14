# motion.md

Motion spec + `prefers-reduced-motion` contract for PagePerfect. There is no formal "motion seat" on the Standing Council today <!-- TODO: confirm whether to add a motion-craft seat or fold motion authority into #7 Visual designer + #8 Accessibility -->. #8 Accessibility holds the **VETO** on anything that violates motion safety.

## Principles

- Motion is punctuation, not content. If the user can't understand the surface without the motion, the motion is hiding something.
- Sharp easing. No bouncy. No rubber-band.
- Choreographed entrances. Elements arrive in an order that reads top-to-bottom, left-to-right, primary-then-secondary.
- Scroll as revelation. Content earns the scroll; the scroll doesn't earn the content.
- One signature motion per surface. Not three.
- Restraint is confidence (globals.css PRINCIPLE 2). Motion that has to announce itself is too much.

## The reduced-motion contract (mandatory)

Every animation, transition, entrance, scroll reveal, and hover must have a `@media (prefers-reduced-motion: reduce)` branch that:

- Disables or drastically shortens the animation.
- Keeps the end state visible. The reduced-motion user sees the final frame, not a blank.
- Does not remove functionality. A carousel still advances; the transition is instant instead of animated.

Non-negotiable. #8 rejects any PR that animates without this branch.

<!-- TODO: STATUS.md flags `frontend/src/app/globals.css` has 6 motion locations and only 1 `prefers-reduced-motion` branch. Every `@keyframes` and `.animate-*` utility needs an explicit reduced-motion branch — open gap. -->

## Easing tokens (canonical, from `globals.css`)

| CSS variable | Value | Usage |
|--------------|-------|-------|
| `--ease-pp` | `cubic-bezier(0.25, 0.4, 0.25, 1)` | Default for entrances, transitions, hovers |
| `--ease-pp-dramatic` | `cubic-bezier(0.22, 0.61, 0.36, 1)` | Signature reveals (hero entrance, scroll reveal blur-to-mask) |

Tailwind shorthand exists too: `ease-pp` and `ease-pp-dramatic` (declared in `tailwind.config.ts` → `transitionTimingFunction`).

Never `ease-in-out` with long duration. That's the bouncy-trampoline feel we don't use.

## Duration tokens (canonical, from `globals.css`)

| CSS variable | Value | Usage |
|--------------|-------|-------|
| `--t-instant` | `100ms` | Hover, focus, micro-interaction |
| `--t-fast` | `200ms` | Single-element entrance |
| `--t-medium` | `350ms` | Choreographed sequence (stagger) |
| `--t-slow` | `600ms` | Signature reveal (rare) |
| `--t-card-hover` | `250ms` | Card hover transition (paper hover, template card) |

Tailwind helper: `duration-350` exists in `tailwind.config.ts`.

Reduced-motion variant halves the duration at most; often sets it to 0.

## Canonical animations (from `globals.css` + `tailwind.config.ts`)

| Animation | Spec | Where used |
|-----------|------|------------|
| `animate-fade-in` | `0.6s` opacity, `--ease-pp` | Generic mount fade |
| `animate-fade-in-up` | `0.8s` opacity + translateY(20px → 0), forwards | Section entries, headline reveals |
| `animate-reveal-up` | `0.8s` opacity + blur(8px → 0) + translateY(30px → 0), forwards | Signature reveal — landing hero, journal article header |
| `animate-skeleton` | `1.5s` opacity pulse, infinite | Loading skeletons (editor, preview) |

`animate-reveal-up` is the signature move — the blur-to-mask reveal. Use sparingly. One per major section, not every paragraph.

## Choreography patterns

### Homepage hero entrance

- Hero headline reveals (`animate-reveal-up`, `--t-slow`, `--ease-pp-dramatic`).
- Subhead + kicker fade in 200ms later (`animate-fade-in-up`, `--t-fast`).
- Technical bar at bottom (VERSION / OUTPUT / ENGINE) mounts last, no entrance — it's instrument chrome.
- Reduced motion: headline + subhead appear instantly, no blur, no slide.

### Scroll reveals (feature rows, journal cards, template grid)

- The `Reveal` + `RevealGroup` components (`frontend/src/components/Reveal.tsx`) wrap entries.
- Each item fades + rises ~8–20px when intersecting at threshold ~0.4.
- `RevealGroup` stagger: 60ms between siblings — see `landing/Steps.tsx` (`staggerDelay={0.06}`).
- IntersectionObserver-driven; once revealed, the element stays revealed.
- Reduced motion: items visible immediately on mount, no IntersectionObserver gating needed.

### Card hover (template grid, journal card, pricing card)

- Transform on `--t-card-hover` (250ms), `--ease-pp`.
- Translate up 2–4px + shadow elevate from `shadow-card` → `shadow-card-hover` (editor) or `shadow-editorial` → `shadow-editorial-hover` (`(site)`).
- No scale, no rotation, no glow.
- Reduced motion: shadow change only; no translate.

### CTA / button hover

- Background color transition on `--t-fast`.
- Red CTA: `#FF3333` → `#E52222` (`bg-[#FF3333] hover:bg-[#E52222]`).
- Black CTA: inverts (text on hover).
- Outlined CTA: border becomes solid ink, text stays.
- Reduced motion: instant transition (`--t-instant`).

### Comparison slider (`landing/Comparison.tsx`)

- The drag-to-compare handle uses pointer events, not animation; the divider position transitions on `--t-fast` when the user releases.
- Keyboard alternative: arrow-key step in 5% increments.
- Reduced motion: still functional — the slider tracks user input directly.

### CookieConsent banner

- Banner slides up from the viewport bottom on `--t-medium`, `--ease-pp`.
- Reduced motion: appears in place, opacity 0 → 1 on `--t-instant`.

## Bans (non-negotiable)

- No animation that moves more than 40px without a reduced-motion alternative.
- No horizontal scroll-jacking (pinning a section while scroll scrubs content).
- No infinite animations without a reduced-motion off-switch.
- No animating `width`, `height`, `top`, `left`. Use `transform` + `opacity`.
- No spring physics that exceed one oscillation on entrance.
- No autoplay video.
- No parallax on mobile (noise-to-signal ratio too low on small viewports).
- No WebGL / canvas-driven backgrounds (Vanta-style). Banned at the perf-budget layer too.

## Specifying motion

Every new motion ships with a `design-motion` spec that names:

- What animates (element, property)
- Timing (duration token, delay, easing token)
- Trigger (mount, scroll-into-view, hover, focus, keyboard activation)
- Reduced-motion variant (explicit — not "same but faster")
- Accessibility note (what the animation signals, whether a screen reader needs an alternative)

Spec output → `context/design/motion/<slug>.md`. Engineering implements; this skill does not write CSS.

## How motion fails the council

- #7 Visual designer rejects: wrong easing family, motion without purpose, too-long duration on a frequent interaction.
- #8 Accessibility **VETOES**: missing `prefers-reduced-motion` branch, focus ring hidden during animation, animation that hides content for >1s.
- #17 Performance engineer rejects: motion that costs >2ms per frame on marketing pages, triggering layout thrash, running offscreen without `content-visibility` or IntersectionObserver gating.
- #13 UX writer rejects: motion that confuses task flow, adds latency to a primary action, or makes the surface feel "demo-y" rather than purposeful.

## Canonical sources

- `frontend/src/app/globals.css` — authoritative motion tokens (`--ease-pp`, `--ease-pp-dramatic`, `--t-instant`, `--t-fast`, `--t-medium`, `--t-slow`, `--t-card-hover`), `@keyframes`, and `@media (prefers-reduced-motion: reduce)` branches.
- `frontend/tailwind.config.ts` — `transitionTimingFunction`, `transitionDuration`, `animation`, `keyframes` extensions.
- `frontend/src/components/Reveal.tsx` — `Reveal` + `RevealGroup` IntersectionObserver wrappers; reduced-motion-aware.
- `projects/pageperfect/DESIGN.md` — animation section, page-specific motion rules.

## Engineering craft (concrete recipes)

For implementation-layer craft — specific cubic-bezier values, scale-on-press patterns, origin-aware popovers, tooltip skip-delay, `@starting-style`, `clip-path` patterns, the Before/After/Why review format — invoke `.claude/skills/emil-design-eng/`. That skill is the engineering counterpart to this policy file: policy here, recipes there.

## Changelog

- 2026-05-14: Rescoped from upstream master-build-kit "Ledger" canon (compass watermark, oxblood CTABand, ChainLogoCarousel, `ease-editorial`/`ease-ledger`, ledger-rule amber glow) to PagePerfect's actual motion system. Replaced AG seat names (Idris, Noor, Thane, Sable) with Standing Council seats (#7, #8 veto, #17, #13). Wired easing/duration tokens to PagePerfect's real CSS variables in `globals.css`. Tied scroll reveal to `Reveal.tsx` / `RevealGroup`. Flagged the open gap from STATUS.md on `prefers-reduced-motion` coverage.
