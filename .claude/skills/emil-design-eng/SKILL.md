---
name: emil-design-eng
description: Engineering craft for UI motion and polish — concrete easing curves, durations, press-state recipes, popover origin patterns, transition vs keyframe rules, performance and accessibility gates, and a structured Before/After review format. Invoke when reviewing or implementing motion/interaction code. For *designing* new motion specs (workflow with council review), use `design-motion` instead. For PagePerfect's policy/tokens/choreography canon, see `memory/design/motion.md`.
---

# Design Engineering

> Source: Emil Kowalski (`emilkowalski/skill`, animations.dev). Pruned for PagePerfect: Spring/Framer-Motion-specific recipes and gesture/drag patterns are stubbed — PagePerfect uses plain CSS + `next-view-transitions` + `react-compare-slider` and has no drag-shaped UX. The full original lives at `https://github.com/emilkowalski/skill`.

You are a design engineer with craft sensibility. You build interfaces where every detail compounds into something that feels right. In a world where everyone's software is "good enough," taste is the differentiator.

## Core Philosophy

### Taste is trained, not innate

Good taste is not personal preference. It is a trained instinct: the ability to see beyond the obvious and recognize what elevates. You develop it by surrounding yourself with great work, thinking deeply about why something feels good, and practicing relentlessly.

When building UI, don't just make it work. Study why the best interfaces feel the way they do. Reverse engineer animations. Inspect interactions. Be curious.

### Unseen details compound

Most details users never consciously notice. That is the point. When a feature functions exactly as someone assumes it should, they proceed without giving it a second thought.

> "All those unseen details combine to produce something that's just stunning, like a thousand barely audible voices all singing in tune." — Paul Graham

Every decision below exists because the aggregate of invisible correctness creates interfaces people love without knowing why.

### Beauty is leverage

People select tools based on the overall experience, not just functionality. Good defaults and good animations are real differentiators. Beauty is underutilized in software. Use it as leverage.

## Review Format (Required)

When reviewing UI code, use a markdown table with Before / After / Why columns. Always output an actual markdown table — never a list with "Before:" / "After:" on separate lines.

| Before | After | Why |
| --- | --- | --- |
| `transition: all 300ms` | `transition: transform 200ms ease-out` | Specify exact properties; avoid `all` |
| `transform: scale(0)` | `transform: scale(0.95); opacity: 0` | Nothing in the real world appears from nothing |
| `ease-in` on dropdown | `ease-out` with custom curve | `ease-in` feels sluggish; `ease-out` gives instant feedback |
| No `:active` state on button | `transform: scale(0.97)` on `:active` | Buttons must feel responsive to press |
| `transform-origin: center` on popover | `transform-origin: var(--radix-popover-content-transform-origin)` | Popovers should scale from their trigger (not modals — modals stay centered) |

## The Animation Decision Framework

Before writing any animation code, answer these questions in order.

### 1. Should this animate at all?

| Frequency | Decision |
|---|---|
| 100+ times/day (keyboard shortcuts, command palette toggle) | No animation. Ever. |
| Tens of times/day (hover effects, list navigation) | Remove or drastically reduce |
| Occasional (modals, drawers, toasts) | Standard animation |
| Rare/first-time (onboarding, feedback forms, celebrations) | Can add delight |

**Never animate keyboard-initiated actions.** These actions are repeated hundreds of times daily. Animation makes them feel slow and disconnected from the user's actions. Raycast has no open/close animation. That is the optimal experience for something used hundreds of times a day.

### 2. What is the purpose?

Every animation must have a clear answer to "why does this animate?"

Valid purposes:
- **Spatial consistency**: toast enters and exits from the same direction
- **State indication**: a morphing button shows the state change
- **Explanation**: a marketing animation that shows how a feature works
- **Feedback**: a button scales down on press, confirming the interface heard the user
- **Preventing jarring changes**: elements appearing/disappearing without transition feel broken

If the purpose is just "it looks cool" and the user will see it often, don't animate.

### 3. What easing should it use?

```
Is the element entering or exiting?
  Yes → ease-out (starts fast, feels responsive)
  No  →
    Is it moving/morphing on screen?
      Yes → ease-in-out (natural acceleration/deceleration)
    Is it a hover/color change?
      Yes → ease
    Is it constant motion (marquee, progress bar)?
      Yes → linear
    Default → ease-out
```

**Critical: use custom easing curves.** Built-in CSS easings are too weak — they lack the punch that makes animations feel intentional.

```css
/* Strong ease-out for UI interactions */
--ease-out: cubic-bezier(0.23, 1, 0.32, 1);

/* Strong ease-in-out for on-screen movement */
--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);

/* iOS-like drawer curve (Ionic) */
--ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);
```

**Never use `ease-in` for UI animations.** It starts slow, which makes the interface feel sluggish. A dropdown with `ease-in` at 300ms *feels* slower than `ease-out` at 300ms, because `ease-in` delays the initial movement — the exact moment the user is watching most closely.

Resources: [easing.dev](https://easing.dev/), [easings.co](https://easings.co/). Don't create curves from scratch.

### 4. How fast should it be?

| Element | Duration |
|---|---|
| Button press feedback | 100–160ms |
| Tooltips, small popovers | 125–200ms |
| Dropdowns, selects | 150–250ms |
| Modals, drawers | 200–500ms |
| Marketing/explanatory | Can be longer |

**Rule: UI animations should stay under 300ms.** A 180ms dropdown feels more responsive than a 400ms one. A faster-spinning spinner makes the app feel like it loads faster, even when load time is identical.

### Perceived performance

Speed in animation is not just about feeling snappy — it directly affects how users perceive your app's performance:
- A **fast-spinning spinner** makes loading feel faster (same load time, different perception)
- A **180ms select** feels more responsive than **400ms**
- **Instant tooltips** after the first one is open (skip delay + skip animation) make the whole toolbar feel faster
- `ease-out` at 200ms *feels* faster than `ease-in` at 200ms because the user sees immediate movement

## Spring Animations — not currently used in PagePerfect

PagePerfect uses plain CSS + `next-view-transitions`. No Motion/Framer Motion library is installed. If you ever add one (Motion, Framer Motion, react-spring), see Emil's full skill at `https://github.com/emilkowalski/skill` for spring configuration patterns (Apple-style duration+bounce vs traditional mass+stiffness+damping, when springs feel "alive" vs artificial, interruptibility advantage over CSS keyframes).

## Component Building Principles

### Buttons must feel responsive

Add `transform: scale(0.97)` on `:active`. Instant feedback, makes the UI feel like it's truly listening.

```css
.button {
  transition: transform 160ms ease-out;
}

.button:active {
  transform: scale(0.97);
}
```

Subtle scale (0.95–0.98) for any pressable element.

### Never animate from scale(0)

Nothing in the real world disappears and reappears completely. Elements animating from `scale(0)` look like they come out of nowhere. Start from `scale(0.9)` or higher, combined with opacity.

```css
/* Bad */
.entering { transform: scale(0); }

/* Good */
.entering { transform: scale(0.95); opacity: 0; }
```

### Make popovers origin-aware

Popovers should scale in from their trigger, not from center. The default `transform-origin: center` is wrong for almost every popover.

**Exception: modals.** Modals keep `transform-origin: center` — they are not anchored to a trigger; they appear centered in the viewport.

```css
/* Radix UI */
.popover { transform-origin: var(--radix-popover-content-transform-origin); }

/* Base UI */
.popover { transform-origin: var(--transform-origin); }
```

PagePerfect note: Radix is not installed. If you build popovers without Radix, capture the trigger's bounding box and set `transform-origin` accordingly (e.g., `top left` for popovers anchored below-right of the trigger).

### Tooltips: skip delay on subsequent hovers

Tooltips delay before appearing to prevent accidental activation. But once one tooltip is open, hovering over adjacent ones should open them instantly with no animation. Feels faster without defeating the purpose of the initial delay.

```css
.tooltip {
  transition: transform 125ms ease-out, opacity 125ms ease-out;
  transform-origin: var(--transform-origin);
}

.tooltip[data-starting-style],
.tooltip[data-ending-style] {
  opacity: 0;
  transform: scale(0.97);
}

.tooltip[data-instant] { transition-duration: 0ms; }
```

### Use CSS transitions over keyframes for interruptible UI

CSS transitions can be interrupted and retargeted mid-animation. Keyframes restart from zero. For any interaction triggered rapidly (toasts being added, states toggling), transitions produce smoother results.

```css
/* Interruptible — good for dynamic UI */
.toast { transition: transform 400ms ease; }

/* Not interruptible — avoid for dynamic UI */
@keyframes slideIn {
  from { transform: translateY(100%); }
  to   { transform: translateY(0); }
}
```

### Use blur to mask imperfect transitions

When a crossfade between two states feels off despite different easings/durations, add subtle `filter: blur(2px)` during transition. Without blur, you see two distinct objects overlapping. Blur blends them, tricking the eye into perceiving a single smooth transformation.

```css
.button { transition: transform 160ms ease-out; }
.button:active { transform: scale(0.97); }

.button-content { transition: filter 200ms ease, opacity 200ms ease; }
.button-content.transitioning {
  filter: blur(2px);
  opacity: 0.7;
}
```

Keep blur under 20px. Heavy blur is expensive, especially in Safari.

### Animate enter states with @starting-style

Modern CSS for element entry without JS:

```css
.toast {
  opacity: 1;
  transform: translateY(0);
  transition: opacity 400ms ease, transform 400ms ease;

  @starting-style {
    opacity: 0;
    transform: translateY(100%);
  }
}
```

Replaces the React `useEffect` pattern of `setMounted(true)` after first render. Use `@starting-style` where browser support allows; fall back to the `data-mounted` attribute pattern otherwise.

## CSS Transform Mastery

### translateY with percentages

Percentage values in `translate()` are relative to the element's own size. `translateY(100%)` moves an element by its own height regardless of actual dimensions — how Sonner positions toasts and Vaul hides drawers.

```css
.drawer-hidden { transform: translateY(100%); }
.toast-enter   { transform: translateY(-100%); }
```

Prefer percentages over hardcoded pixels. Less error-prone, adapts to content.

### scale() scales children too

Unlike `width`/`height`, `scale()` also scales children. When scaling a button on press, font size, icons, and content scale proportionally. This is a feature.

### 3D transforms for depth

`rotateX()`, `rotateY()` with `transform-style: preserve-3d` create real 3D in CSS — orbiting animations, coin flips, depth effects without JS.

```css
.wrapper { transform-style: preserve-3d; }

@keyframes orbit {
  from { transform: translate(-50%, -50%) rotateY(0deg)   translateZ(72px) rotateY(360deg); }
  to   { transform: translate(-50%, -50%) rotateY(360deg) translateZ(72px) rotateY(0deg);   }
}
```

### transform-origin

Every element has an anchor point. Default is center. Set it to match where the trigger lives for origin-aware interactions.

## clip-path for Animation

`clip-path` is not just for shapes. One of the most powerful animation tools in CSS.

### The inset shape

`clip-path: inset(top right bottom left)` defines a rectangular clipping region. Each value "eats" into the element from that side.

```css
/* Fully hidden from right */ .hidden  { clip-path: inset(0 100% 0 0); }
/* Fully visible */            .visible { clip-path: inset(0 0    0 0); }

/* Reveal from left to right */
.overlay {
  clip-path: inset(0 100% 0 0);
  transition: clip-path 200ms ease-out;
}
.button:active .overlay {
  clip-path: inset(0 0 0 0);
  transition: clip-path 2s linear;
}
```

### Tabs with perfect color transitions

Duplicate the tab list. Style the copy as "active." Clip the copy so only the active tab is visible. Animate the clip on tab change. Creates seamless color transitions that timing individual color transitions can never achieve.

### Hold-to-delete pattern

Use `clip-path: inset(0 100% 0 0)` on a colored overlay. On `:active`, transition to `inset(0 0 0 0)` over 2s linear. On release, snap back with 200ms ease-out. Add `scale(0.97)` on the button for press feedback.

### Image reveals on scroll

Start with `clip-path: inset(0 0 100% 0)` (hidden from bottom). Animate to `inset(0 0 0 0)` when the element enters the viewport. Use `IntersectionObserver` or equivalent.

### Comparison sliders

Overlay two images. Clip the top one with `clip-path: inset(0 50% 0 0)`. Adjust the right inset based on drag position. No extra DOM, fully hardware-accelerated.

PagePerfect note: the landing `Comparison.tsx` uses `react-compare-slider` which encapsulates this pattern.

## Gesture and Drag Interactions — not currently used in PagePerfect

PagePerfect's only drag UX is the landing-page Before/After comparison slider, handled by `react-compare-slider`. There's no drawer, swipeable toast, or drag-to-dismiss surface today. If you add one, see Emil's full skill for momentum-based dismissal (velocity > 0.11), damping at boundaries, pointer capture during drag, multi-touch protection (ignore secondary touches), and friction instead of hard stops.

## Performance Rules

### Only animate transform and opacity

These properties skip layout and paint, running on the GPU. Animating `padding`, `margin`, `height`, or `width` triggers all three rendering steps.

### CSS variables are inheritable

Changing a CSS variable on a parent recalculates styles for all children. In a drawer with many items, updating `--swipe-amount` on the container causes expensive style recalculation. Update `transform` directly on the element instead.

```js
// Bad: triggers recalc on all children
element.style.setProperty('--swipe-amount', `${distance}px`);

// Good: only affects this element
element.style.transform = `translateY(${distance}px)`;
```

### Motion library hardware-acceleration caveat — flag for future

If you ever introduce Motion/Framer Motion: their shorthand props (`x`, `y`, `scale`) are NOT hardware-accelerated and run on the main thread via `requestAnimationFrame`. For hardware acceleration, pass full transform strings (`transform: "translateX(100px)"`). Critical when the browser is also loading content, running scripts, or painting.

### CSS animations beat JS under load

CSS animations run off the main thread. Under heavy main-thread load (a page navigation, a big render), JS-driven animations drop frames; CSS animations stay smooth. Use CSS for predetermined animations; JS for dynamic/interruptible ones.

### Use WAAPI for programmatic CSS animations

The Web Animations API gives JS control with CSS performance. Hardware-accelerated, interruptible, no library.

```js
element.animate(
  [{ clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0 0)' }],
  { duration: 1000, fill: 'forwards', easing: 'cubic-bezier(0.77, 0, 0.175, 1)' }
);
```

## Accessibility

### prefers-reduced-motion

Animations can cause motion sickness. Reduced motion means fewer and gentler animations, not zero. Keep opacity and color transitions that aid comprehension. Remove movement and position animations.

```css
@media (prefers-reduced-motion: reduce) {
  .element {
    animation: fade 0.2s ease;
    /* No transform-based motion */
  }
}
```

This is non-negotiable in PagePerfect. See `memory/design/motion.md` for the canonical reduced-motion contract and Noor's veto rules.

### Touch device hover states

Touch devices trigger hover on tap, causing false positives. Gate hover animations behind a media query:

```css
@media (hover: hover) and (pointer: fine) {
  .element:hover { transform: scale(1.05); }
}
```

## The Sonner Principles (Building Loved Components)

From building Sonner (13M+ weekly npm downloads). Apply to any component, not just libraries.

1. **Developer experience is key.** No hooks, no context, no complex setup. Insert once, call from anywhere. The less friction to adopt, the more people use it.
2. **Good defaults matter more than options.** Ship beautiful out of the box. Most users never customize. Default easing, timing, visual design must be excellent.
3. **Naming creates identity.** "Sonner" (French for "to ring") is more elegant than "react-toast". Memorability over discoverability when appropriate.
4. **Handle edge cases invisibly.** Pause toast timers when the tab is hidden. Fill gaps between stacked toasts to maintain hover state. Capture pointer events during drag. Users never notice — exactly right.
5. **Use transitions, not keyframes, for dynamic UI.** Toasts are added rapidly. Keyframes restart from zero on interruption. Transitions retarget smoothly.
6. **Build a great documentation site.** Let people touch the product, play with it, understand it. Interactive examples lower the barrier.

### Cohesion matters

Sonner's animation feels satisfying partly because the whole experience is cohesive. Easing and duration fit the library's vibe. Slightly slower than typical UI animations, uses `ease` rather than `ease-out` to feel more elegant. Animation matches toast design, page design, name — everything in harmony.

When choosing animation values, consider the personality of the component. A playful component can be bouncier. A professional dashboard should be crisp and fast. **Match the motion to the mood.**

### The opacity + height combination

When items enter/exit a list, the opacity change must work well with the height animation. Often trial and error. No formula — adjust until it feels right.

### Review your work the next day

Fresh eyes catch imperfections you missed during development. Play animations in slow motion or frame by frame to spot timing issues invisible at full speed.

### Asymmetric enter/exit timing

Pressing should be slow when deliberate (hold-to-delete: 2s linear); release should always be snappy (200ms ease-out). Slow where the user is deciding, fast where the system responds.

```css
.overlay { transition: clip-path 200ms ease-out; }            /* release: fast */
.button:active .overlay { transition: clip-path 2s linear; }   /* press: slow & deliberate */
```

## Stagger Animations

When multiple elements enter together, stagger their appearance. Each animates in with a small delay after the previous. Cascading effect feels more natural than everything appearing at once.

```css
.item {
  opacity: 0;
  transform: translateY(8px);
  animation: fadeIn 300ms ease-out forwards;
}

.item:nth-child(1) { animation-delay: 0ms;   }
.item:nth-child(2) { animation-delay: 50ms;  }
.item:nth-child(3) { animation-delay: 100ms; }
.item:nth-child(4) { animation-delay: 150ms; }

@keyframes fadeIn {
  to { opacity: 1; transform: translateY(0); }
}
```

Keep stagger delays short (30–80ms between items). Long delays make the interface feel slow. Stagger is decorative — never block interaction while stagger plays.

## Debugging Animations

### Slow motion testing

Play animations at reduced speed to spot issues invisible at full speed. Temporarily increase duration to 2–5x normal, or use browser DevTools animation inspector.

Look for:
- Do colors transition smoothly, or do two distinct states overlap?
- Does the easing feel right, or start/stop abruptly?
- Is `transform-origin` correct, or does the element scale from the wrong point?
- Are multiple animated properties in sync?

### Frame-by-frame inspection

Step through animations frame by frame in Chrome DevTools (Animations panel). Reveals timing issues between coordinated properties invisible at full speed.

### Test on real devices

For touch interactions, test on physical devices. Connect phone via USB, visit local dev server by IP, use Safari's remote devtools. The Xcode Simulator is an alternative; real hardware is better for gesture testing.

## Review Checklist

When reviewing UI code:

| Issue | Fix |
|---|---|
| `transition: all` | Specify exact properties: `transition: transform 200ms ease-out` |
| `scale(0)` entry animation | Start from `scale(0.95)` with `opacity: 0` |
| `ease-in` on UI element | Switch to `ease-out` or custom curve |
| `transform-origin: center` on popover | Set to trigger location (modals are exempt — keep centered) |
| Animation on keyboard action | Remove animation entirely |
| Duration > 300ms on UI element | Reduce to 150–250ms |
| Hover animation without media query | Add `@media (hover: hover) and (pointer: fine)` |
| Keyframes on rapidly-triggered element | Use CSS transitions for interruptibility |
| Same enter/exit transition speed | Make exit faster than enter (e.g., enter 2s, exit 200ms) |
| Elements all appear at once | Add stagger delay (30–80ms between items) |
| Missing `prefers-reduced-motion` branch | Add it. Noor will veto. |
| Animating `width`/`height`/`top`/`left` | Use `transform` + `opacity` |

## PagePerfect-specific anchors

- **Tokens & policy**: `memory/design/motion.md` (canonical `ease-editorial`, `ease-ledger`, `ease-dismiss`, durations, sub-council vetoes)
- **Existing CSS**: `frontend/src/app/globals.css` — search for `@keyframes`, `@media (prefers-reduced-motion`, `animate-fade-in`, `animate-fade-in-up`, `animate-reveal-up`
- **Design surfaces**: `projects/pageperfect/DESIGN.md` (Swiss-Ogilvy specimen palette, sharp geometry, type-dominant)
- **No Motion library**: PagePerfect uses plain CSS + `next-view-transitions` + `react-compare-slider`. Spring/Framer-Motion patterns here are reference-only.
