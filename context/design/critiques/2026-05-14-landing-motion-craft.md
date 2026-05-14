# Motion & interaction craft review — landing — 2026-05-14

Companion to `2026-05-14-landing.md`. The design-critique covered hierarchy, contrast, and palette. This pass is Emil-Kowalski-style craft on motion, easing, durations, press feedback, and reduced-motion designed fallbacks. Read alongside `memory/design/motion.md`.

## Surfaces inspected

- `frontend/src/components/Reveal.tsx` (canonical)
- `frontend/src/components/landing/Hero.tsx`
- `frontend/src/components/CookieConsent.tsx`
- `frontend/src/components/Button.tsx`
- `frontend/src/app/globals.css` — motion tokens, button contracts (`.btn-pill` family), nav underline reveal, view-transition keyframes, `@media (prefers-reduced-motion: reduce)` block

## Findings — Before / After / Why

| Before | After | Why |
| --- | --- | --- |
| `frontend/src/components/Reveal.tsx:85` — `className="transition-all duration-700 ease-[cubic-bezier(0.25,0.4,0.25,1)]"` | `className="duration-700 ease-[cubic-bezier(0.25,0.4,0.25,1)]"` with explicit `transitionProperty: 'opacity, transform, filter'` in the inline style | `transition: all` is Emil's #1 review-flag — picks up unintended properties (color, layout, shadow) when they change and ships paint cost you didn't plan for. Always name the properties. |
| `frontend/src/components/landing/Hero.tsx:33` — primary CTA `className="… transition-all duration-200 ease-pp hover:bg-[#E52222]"` | Same with `transition-[background-color,transform] duration-200 ease-pp hover:bg-[#E52222] active:scale-[0.97]` plus a `@media (hover: hover) and (pointer: fine)` guard on the hover-only state | (1) `transition-all` flag again. (2) No `:active` feedback on a primary CTA — Emil's #1 button rule. The button must feel like it's listening. Currently desktop has nothing on press; mobile relies on the global `opacity: 0.7` fallback in `globals.css:807–813`. Desktop deserves a real press cue. |
| `frontend/src/components/landing/Hero.tsx:21–27` — Reveal wraps the hero `<p>` body with `filter: blur(4px)` entry | Same Reveal wrapper, but pass `useBlur={false}` (new prop) or strip blur for body copy — keep blur only on the h1 | Blur is a tool to **mask imperfect transitions** (crossfades, morphs). A clean translateY-and-fade reveal doesn't need it. On small body copy at 14–16px, 4px blur during the reveal degrades crispness for ~700ms and there's nothing to mask. Reserve blur for the display-scale h1 where the "premium fade-in" reads. |
| `frontend/src/components/Reveal.tsx:85` — 700ms duration on every reveal, including small CTAs and labels | Two scales: `duration-500` for body/CTA reveals, `duration-700` for h1/display | Emil: "UI animations should stay under 300ms." Reveal-on-scroll is editorial-mood adjacent so 500–700ms is defensible, but the same value for a hero h1 and a 12px CTA is undifferentiated. The h1 carries the slow reveal narratively; the CTA wants to be there sooner so the user can act. |
| `frontend/src/components/CookieConsent.tsx:21` — `if (!visible) return null` (no enter animation; banner just appears) | Wrap in `[data-state]` with `@starting-style { transform: translateY(100%); opacity: 0 }` and target state `transform: translateY(0); opacity: 1; transition: transform 300ms var(--ease-pp), opacity 300ms var(--ease-pp)` | Emil: "Nothing in the real world appears from nothing." A sticky-bottom banner has an obvious origin (off-screen below). Translating up from `100%` is the canonical pattern and uses no JS. Today the banner snaps in and snaps out — feels like a popup, not a UI surface. |
| `frontend/src/components/CookieConsent.tsx:43` — Accept button `className="border border-[#111111] bg-[#111111] … transition-all duration-200 ease-pp hover:bg-transparent hover:text-[#111111]"` | Same but `transition-[background-color,color,border-color] duration-200 ease-pp active:scale-[0.97]` plus `@media (hover: hover)` guard | `transition-all` + no press feedback. Accept is a primary CTA — same press-feel deficit as Hero. |
| `frontend/src/app/globals.css:220–226` — `.btn-pill:hover { transform: translateY(-1px) } .btn-pill:active { transform: translateY(0); transition-duration: 50ms }` | `.btn-pill:active { transform: scale(0.97); transition-duration: 80ms }` — or keep the lift-on-hover but add scale-on-press *additively* | Current pattern lifts the button up on hover and **returns to neutral** on press. That's a "release" cue, not a "press" cue. Emil's rule: scale-down on `:active` reads as physical depression, which is what people expect from a press. The 50ms transition is so fast the return-to-zero reads as a static state, not a press response. Audit the rest of the app — anywhere `.btn-pill` is used (it's the universal button class), this affects everything. |
| `frontend/src/app/globals.css:212` — `.btn-pill { @apply … rounded-pill … }` | Keep as-is for app/auth surfaces; **verify zero usage on the landing**. Landing uses inline buttons (not `<Button>`), so the `rounded-pill` shape doesn't leak there. | DESIGN.md and `memory/design/bold-design-principles.md` both call out sharp geometry (`border-radius: 0`) as the Swiss-Ogilvy specimen signature. `.btn-pill`'s `rounded-pill` is the legacy default. This is fine where it lives (app/auth) — flag is to ensure it doesn't drift into the landing. (Confirmed clean today.) |
| `frontend/src/app/globals.css:847` — nav-link underline reveal animates `width` from `0` to `100%` | `transform: scaleX(0)` → `scaleX(1)` with `transform-origin: left` | Animating `width` triggers layout each frame. For a 1px underline the cost is invisible, but the canonical recipe is GPU-accelerated `scaleX`. Also keeps the reveal smooth if the link is ever wrapped to two lines. |
| `frontend/src/app/globals.css:886–894` — universal `*, *::before, *::after { transition-duration: 0.01ms !important; animation-duration: 0.01ms !important }` under `@media (prefers-reduced-motion: reduce)` | Keep the universal cap as a safety net **and** also add explicit designed fallbacks for the cookie banner + reveals: cookie banner = fade-in only, no translate; Reveal = no-op (already handled in JS — confirm) | The comment at line 878 explicitly says "Each animation needs a designed fallback, not just a 0.01ms duration that makes loading states invisible" — and the file then does exactly that for `*`. The skeleton + view-transition handlers below it follow the comment's spirit; the new banner reveal added above should too. Emil: "Reduced motion means fewer and gentler animations, not zero." |
| `frontend/src/components/Reveal.tsx:62–64` — reduced-motion branch returns `<div className={className}>` (no fade) | Same, but keep a 200ms opacity-only transition so the element doesn't pop in on initial mount | Strictly correct per spec, but a brief opacity fade is a "fewer and gentler" fallback that still respects the contract. Optional — current behaviour is acceptable. |
| `frontend/src/components/Reveal.tsx:47–57` — `IntersectionObserver` with `rootMargin: '-80px'` and `once: true` default | Same, but add `threshold: 0.1` explicitly so the trigger doesn't depend solely on `rootMargin` | `rootMargin: '-80px'` shrinks the root, which means the element triggers when 80px into the viewport. Without a threshold, the default is `0` — fires on any pixel intersection. Combined they work, but explicit threshold protects against future rootMargin edits. Polish-level. |
| `frontend/src/app/globals.css:274–276` — `.card { transition: transform 350ms var(--ease-pp), box-shadow 350ms var(--ease-pp), border-color 200ms var(--ease-pp) } .card:hover { translateY(-2px) }` | Reduce to `transition: transform 250ms var(--ease-pp), box-shadow 250ms var(--ease-pp), border-color 150ms var(--ease-pp)` | 350ms on hover is over Emil's <300ms ceiling. The lift is small (2px), so the user perceives the slowness more than the movement. 250ms keeps the editorial mood while feeling responsive. |
| `frontend/src/components/Reveal.tsx:71` — `filter: blur(4px)` applied uniformly to all hidden elements | Cap blur at 4px (which is fine here), but ensure no nested Reveals stack blurs | Emil: heavy blur is expensive especially in Safari. 4px is safe; the risk is composition — if a parent Reveal blurs and a child Reveal blurs simultaneously, the effective blur compounds visually and the paint cost doubles. Audit: today only Hero h1/body/CTA are stacked Reveals at three different delays — they don't overlap in the blur phase because the delays exceed the duration (0.0s / 0.1s / 0.2s vs 0.7s duration → overlap is 0.5s peak). Acceptable. Document the rule for future use. |
| `frontend/src/components/landing/Hero.tsx:38` — micro-label inline directly under the CTA `<Link>`, no Reveal wrapper | (covered by `2026-05-14-landing.md`'s P0 contrast finding — also: when the CTA Reveal at delay 0.2 finishes, the micro-label is already visible because it's inside the same Reveal — confirm this is intentional) | The micro-label inherits the Reveal opacity at line 29 — so it does animate with the CTA. Just not wrapped in its own delay. Fine. Polish-level note: if you wanted the label to settle 100ms after the CTA, nest it in a second Reveal at delay 0.3. Not required. |
| `frontend/src/components/landing/Steps.tsx`, `WhyDifferent.tsx`, `Engineering.tsx` — no stagger on lists | Wrap list items in `RevealGroup` with `staggerDelay={0.06}` (60ms) | `RevealGroup` already exists in `Reveal.tsx:100–115` with a 60ms default — perfect Emil-spec stagger (30–80ms band). Today it's unused on the landing. The 3-step "How It Works" and the spec-rows in `Engineering` would benefit visibly. Worth a follow-up enhancement, not a fix. |

## Strengths — keep doing this

| Detail | Why it's right |
| --- | --- |
| `globals.css:807–813` — `@media (hover: none) { a:active, button:active { opacity: 0.7; transition: opacity 0.05s } }` | Touch-device feedback fallback. Exactly Emil's "handle edge cases invisibly" principle. |
| `Reveal.tsx:13–23` + `62–64` — JS `usePrefersReducedMotion` hook returning plain `<div>` for reduced users | Correct reduced-motion contract. Returns immediately, no animation work scheduled. |
| `globals.css:858–870` — `::view-transition-old/new(root)` animation paired with the `next-view-transitions` route changes | Page-to-page is one of the few places where animation aids spatial consistency. Tasteful crossfade at `--t-medium` (350ms). |
| `globals.css:234–236, 252–254, 264–266` — `:focus-visible` outlines on every button variant | Keyboard focus is explicit, not relying on default browser ring. Accessibility win that Emil's review checklist endorses. |
| `globals.css:20–21` — two easing tokens (`--ease-pp` and `--ease-pp-dramatic`), not a proliferation | Restraint. PagePerfect resists the typical CSS-token explosion. `--ease-pp` is close enough to Emil's recommended `cubic-bezier(0.23, 1, 0.32, 1)` strong-ease-out to count as on-canon. |
| `Reveal.tsx:71` — `filter: blur(4px)` paired with opacity + translate on reveal | Emil-approved technique: blur masks the transition discontinuity, making the fade feel like one motion rather than three independent animations. Used at appropriate magnitude (4px is safe). |
| `globals.css:223–225` — `.btn-pill:active { transition-duration: 50ms }` | Asymmetric timing — fast on press release. Wrong vertical (it lifts on hover and returns on press, not depresses), but the asymmetric duration discipline is the right instinct. |

## Priority order

If you want to act on this critique in a single pass, these are the three highest-leverage edits:

1. **Add `:active` press feedback to all CTAs.** Hero.tsx:33 + CookieConsent.tsx:43 + the global `.btn-pill:active` rule. Either `scale(0.97)` on active (Emil canonical), or change the existing translateY-up-on-hover to translateY-down-on-active. The "lift, don't press" pattern leaves the press half of the affordance unaddressed.
2. **Replace `transition-all` with named property lists.** Repo-wide grep:
   ```sh
   rg "transition-all" frontend/src/
   ```
   Each call site gets its own list. Most are 1–3 properties.
3. **Cookie banner enter/exit animation.** Sticky-bottom surface should slide up via `translateY(100%) → 0` with `@starting-style`. Today it pops. Pair with a designed reduced-motion fallback (fade-only).

## Council seats engaged

- **#7 Visual** — endorses press-feedback addition (responsive UI is a visual signature).
- **#15 Staff engineer** — endorses the `transition-all` purge as a maintainability win.
- **#17 Performance** — endorses the `width` → `scaleX` rewrite for nav underlines.
- **#8 Accessibility (VETO)** — confirms reduced-motion contract is intact today; endorses the cookie-banner reveal **only if paired with a fade-only fallback**.
- **Council gap:** still no motion seat in PROCESS.md. Promoted as P2 in the design-critique.

## Hand-off

These edits route through `design-component` (single-file changes for Hero, CookieConsent) and a small targeted refactor pass for `globals.css`. Per Plan-First rule, the `:active` change is small enough to ship in one PR; the `transition-all` purge is its own PR because it touches multiple files.
