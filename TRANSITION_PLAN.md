# Smooth Transitions Plan — PagePerfect

## The Diagnosis

PagePerfect currently has **fragmented, inconsistent motion**. The codebase audit reveals:

- **No page transitions** — route changes are instant jump-cuts (jarring)
- **Inconsistent hover durations** — `75ms` on nav links, `200ms` on buttons, `500ms` on pricing, `700ms` on hero cards
- **Underused Framer Motion** — library is installed but only 2 components actively use it (Reveal, TemplateShowcase)
- **Dead animation code** — `LevitatingCard`, `HeroImage`, 3 Tailwind keyframes, and several CSS classes are defined but never imported
- **No scroll smoothing** — no `scroll-behavior: smooth` or smooth-scroll library
- **No exit animations** — elements appear but never animate out
- **`SectionTransition.tsx` is a lie** — it's a static gradient div with zero animation

The result: the site feels like a static document that occasionally twitches. That contradicts the Swiss precision instrument positioning.

---

## The Swiss Motion Philosophy

Swiss/International Typographic Style applied to motion means:

1. **Functional, not decorative.** Every animation must communicate — position change, state change, or hierarchy. No animation for spectacle.
2. **Geometric precision.** Movement follows grid lines — vertical reveals (Y-axis), horizontal slides (X-axis). No diagonal swoops, no random bounce.
3. **Restraint over excess.** Fewer, slower, more deliberate motions. Think a Leica shutter, not a firework.
4. **Consistent tempo.** One timing system across the entire site. Like a metronome.
5. **Physics-based easing.** Natural deceleration (`ease-out`) for entrances; acceleration (`ease-in`) for exits. Never `linear` (robotic), rarely `ease-in-out` (ambiguous).

### The Psychology

Research on UI animation psychology supports these principles:

- **200–500ms** is the optimal range for transitions. Under 100ms is imperceptible. Over 1000ms feels sluggish. The sweet spot for most UI transitions is **250–400ms**.
- **Ease-out curves** (`cubic-bezier(0.25, 0.4, 0.25, 1)`) feel "arriving" — the element decelerates into its final position, mimicking how physical objects come to rest. This triggers a subconscious sense of resolution.
- **Staggered reveals** (50–80ms delay per item) create a "cascade" effect that guides the eye down the page in reading order — exactly what Swiss typography is designed to do.
- **Consistent motion creates trust.** When every element behaves predictably, users develop a mental model of the interface. Inconsistent animation (sometimes fast, sometimes slow, sometimes none) creates cognitive friction.
- **Motion as perceived performance.** A 300ms cross-fade during page transition makes the app feel faster than an instant content swap, because the brain interprets the animation as "working" rather than "jumping."

---

## The Motion Design System

### Timing Tokens

Standardize ALL transition durations to four tiers:

| Token | Duration | Easing | Use Case |
|-------|----------|--------|----------|
| `--t-instant` | `100ms` | `ease-out` | Micro-feedback: focus rings, active states, checkbox toggles |
| `--t-fast` | `200ms` | `cubic-bezier(0.25, 0.4, 0.25, 1)` | Interactive: hover states, button presses, tooltip show/hide |
| `--t-medium` | `350ms` | `cubic-bezier(0.25, 0.4, 0.25, 1)` | Structural: page transitions, panel slides, accordion open/close |
| `--t-slow` | `600ms` | `cubic-bezier(0.22, 0.61, 0.36, 1)` | Dramatic: scroll reveals, hero entrances, section fades |

**Rule:** No arbitrary durations. Every `transition-duration` and `animation-duration` must use one of these four tokens. The current chaos of `75ms`, `150ms`, `200ms`, `250ms`, `300ms`, `500ms`, `700ms` across the codebase gets consolidated.

### Easing Curves

Two primary curves, mapped to Tailwind config:

| Name | Value | Character |
|------|-------|-----------|
| `ease-pp` | `cubic-bezier(0.25, 0.4, 0.25, 1)` | Standard deceleration — "arriving at rest" |
| `ease-pp-dramatic` | `cubic-bezier(0.22, 0.61, 0.36, 1)` | Slower attack, more pronounced ease — for scroll reveals |

These replace all current ad-hoc easing values.

### Spring Config (Framer Motion)

For physics-based animations (interactive hover, drag):

```js
const SPRING_STANDARD = { stiffness: 300, damping: 30 }  // Snappy, controlled
const SPRING_GENTLE   = { stiffness: 150, damping: 25 }  // Softer, for larger elements
```

---

## Implementation Plan

### Phase 1: Foundation — Motion Tokens & Cleanup

**Goal:** Establish the timing system and remove dead code.

**Files to modify:**
- `frontend/tailwind.config.ts` — Add `transitionTimingFunction` and `transitionDuration` tokens
- `frontend/src/app/globals.css` — Add CSS custom properties for timing; update `.btn-pill`, `.input-dark`, sidebar, journal transitions to use tokens
- Delete or update orphan references: `animate-pulse-slow`, `animate-glow-breathe`, `glow-text`, `gradient-accent-text`

**Changes across components:**
- Audit every `duration-*` and `transition-*` class
- Replace `duration-75` → `duration-100` (instant tier)
- Replace `duration-200` → `duration-200` (fast tier — stays)
- Replace `duration-250` / `duration-300` → `duration-350` (medium tier)
- Replace `duration-500` / `duration-700` → `duration-600` (slow tier)
- Replace all `ease-out` with `ease-pp` custom easing
- Remove unused animation components and their imports

**Estimated scope:** ~15 files, mostly find-and-replace in class strings.

---

### Phase 2: Page Transitions — View Transitions API

**Goal:** Smooth cross-fade between routes so navigation feels like turning a page, not teleporting.

**Approach:** Use the `next-view-transitions` library (by Shu Ding, Next.js core team). It wraps Next.js App Router navigation with the native View Transitions API.

**Why this approach:**
- Native browser API — GPU-accelerated, zero JS animation overhead
- Graceful degradation — browsers without support get normal navigation (no breakage)
- Tiny library footprint — just wraps `document.startViewTransition` around router.push
- Compatible with Next.js 15 App Router
- No need for the experimental React `<ViewTransition>` component (still in Canary)

**Implementation:**

1. `npm install next-view-transitions`

2. Wrap root layout with `<ViewTransitions>` provider:
   ```tsx
   // frontend/src/app/layout.tsx
   import { ViewTransitions } from 'next-view-transitions'

   export default function RootLayout({ children }) {
     return (
       <ViewTransitions>
         <html>...</html>
       </ViewTransitions>
     )
   }
   ```

3. Add CSS for the transition animation:
   ```css
   /* globals.css */
   ::view-transition-old(root) {
     animation: var(--t-medium) ease-pp both fade-out;
   }
   ::view-transition-new(root) {
     animation: var(--t-medium) ease-pp both fade-in;
   }

   @keyframes fade-out {
     to { opacity: 0; }
   }
   @keyframes fade-in {
     from { opacity: 0; }
   }
   ```

4. For the `(site)` → `app` transition (marketing → editor), use a named view transition on the nav logo so it morphs across the route change — the one element that persists becomes the anchor.

**Result:** Every route change (Landing → Pricing, Pricing → Journal, Journal → Docs, any → Editor) gets a 350ms cross-fade. The old page fades out while the new page fades in. The effect is subtle but eliminates the "flash" of instant navigation.

---

### Phase 3: Scroll Reveal System — Unified `<Reveal>` Component

**Goal:** Every section on every page enters the viewport with a consistent, staggered animation.

**Current state:** Only `TemplateShowcase` uses `<Reveal>`. All other landing page sections, journal articles, docs sections, and pricing tiers appear instantly.

**Enhanced `<Reveal>` component:**

```tsx
// frontend/src/components/Reveal.tsx  (promoted from landing/ to shared)
'use client'
import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

interface RevealProps {
  children: React.ReactNode
  delay?: number
  direction?: 'up' | 'down' | 'left' | 'right' | 'none'
  className?: string
  once?: boolean
}

export function Reveal({
  children,
  delay = 0,
  direction = 'up',
  className = '',
  once = true,
}: RevealProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once, margin: '-80px' })

  const directionMap = {
    up:    { y: 24, x: 0 },
    down:  { y: -24, x: 0 },
    left:  { y: 0, x: 24 },
    right: { y: 0, x: -24 },
    none:  { y: 0, x: 0 },
  }

  const { x, y } = directionMap[direction]

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y, x, filter: 'blur(4px)' }}
      animate={isInView ? { opacity: 1, y: 0, x: 0, filter: 'blur(0px)' } : {}}
      transition={{ duration: 0.6, delay, ease: [0.25, 0.4, 0.25, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Convenience wrapper for staggered lists
export function RevealGroup({
  children,
  staggerDelay = 0.06,
  className = '',
}: {
  children: React.ReactNode[]
  staggerDelay?: number
  className?: string
}) {
  return (
    <div className={className}>
      {children.map((child, i) => (
        <Reveal key={i} delay={i * staggerDelay}>
          {child}
        </Reveal>
      ))}
    </div>
  )
}
```

**Where to apply:**

| Page | Elements to wrap with `<Reveal>` |
|------|------|
| **Landing `/`** | Hero headline, hero subtitle, hero CTA, each section header, comparison slider, steps cards (staggered), pricing cards (staggered), social proof quotes, engineering bar, final CTA |
| **Pricing `/pricing`** | Page headline, each tier card (stagger 3), FAQ accordion items (stagger) |
| **Journal `/journal`** | Page headline, category sidebar, each article card (stagger) |
| **Journal article `[slug]`** | Article header, drop cap paragraph, each section |
| **Docs `/docs`** | Sidebar nav, each docs section, template cards (stagger), admonition boxes |
| **Status `/status`** | Each diagnostic card |

**Design constraint:** `direction='up'` for all vertical content (default). `direction='left'` only for sidebar elements. Never `direction='down'` — content always rises into place, like type being set on a press.

---

### Phase 4: Hover & Interactive Micro-Transitions

**Goal:** Every interactive element has a crisp, consistent response to hover/focus/active states.

#### 4a. Button System

Current buttons use `duration-75` (too fast to register) or `duration-200` (inconsistent). Standardize:

```css
/* All buttons */
.btn-pill {
  transition: background-color 200ms var(--ease-pp),
              color 200ms var(--ease-pp),
              border-color 200ms var(--ease-pp),
              box-shadow 200ms var(--ease-pp),
              transform 200ms var(--ease-pp);
}

.btn-pill:hover {
  transform: translateY(-1px);   /* Subtle lift — precision, not bounce */
}

.btn-pill:active {
  transform: translateY(0px);    /* Press down on click */
  transition-duration: 50ms;     /* Instant snap on press */
}
```

The 1px lift on hover is barely perceptible but creates a tactile "this is clickable" signal. The instant snap on `:active` provides confirmation.

#### 4b. Card System

```css
.card, .docs-template-card, .journal-card {
  transition: transform 350ms var(--ease-pp),
              box-shadow 350ms var(--ease-pp),
              border-color 200ms var(--ease-pp);
}

.card:hover, .docs-template-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.08);
}

.journal-card:hover {
  transform: translateY(-1px);
}
```

#### 4c. Navigation Links

```css
/* All nav links — subtle underline reveal */
[data-specimen] nav a {
  position: relative;
  transition: color 200ms var(--ease-pp);
}

[data-specimen] nav a::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 0;
  height: 1px;
  background: #FF3333;
  transition: width 250ms var(--ease-pp);
}

[data-specimen] nav a:hover::after {
  width: 100%;
}
```

This replaces the current color-only hover with a sliding underline — a classic Swiss typographic indicator.

#### 4d. Focus States (Accessibility)

```css
/* Keyboard focus ring with smooth appearance */
:focus-visible {
  outline: 2px solid #FF3333;
  outline-offset: 3px;
  transition: outline-offset 150ms var(--ease-pp);
}
```

---

### Phase 5: Section Transitions (Landing Page Flow)

**Goal:** The landing page should feel like one continuous scroll experience, not 8 disconnected blocks.

**Replace `SectionTransition.tsx`** with a real transition:

```tsx
// SectionTransition.tsx — reimagined
export function SectionTransition({ variant = 'rule' }: { variant?: 'rule' | 'fade' | 'bleed' }) {
  if (variant === 'rule') {
    // Swiss-style horizontal rule that draws itself on scroll
    return (
      <Reveal direction="none">
        <div className="mx-auto my-16 h-[2px] w-full max-w-7xl bg-[#111111]" />
      </Reveal>
    )
  }
  if (variant === 'fade') {
    // Soft gradient for dark↔light transitions
    return <div className="h-24 bg-gradient-to-b from-[#050507] to-[#FDFCF8]" />
  }
  return null
}
```

**Between sections on the landing page:**
- Use `variant='rule'` between same-background sections (cream→cream). The 2px rule animates in with the Reveal component — it appears to draw itself across the page.
- Use `variant='fade'` only between dark↔light sections (if any remain).

---

### Phase 6: Loading & State Transitions

**Goal:** Eliminate flash-of-content during loading states.

#### 6a. Skeleton/Loading States

When pages load via Suspense boundaries, show a subtle pulse animation on placeholder content:

```css
@keyframes skeleton-pulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.7; }
}

.skeleton {
  background: #e5e5e0;
  animation: skeleton-pulse 1.5s ease-in-out infinite;
  border-radius: 0;  /* Swiss — no rounded corners */
}
```

#### 6b. Editor Compile State

The compile button and preview pane in `/app` should transition between states (idle → compiling → complete → error) with fade transitions rather than instant swaps:

```css
.compile-state-enter { opacity: 0; transform: translateY(4px); }
.compile-state-enter-active {
  opacity: 1;
  transform: translateY(0);
  transition: all 200ms var(--ease-pp);
}
```

---

### Phase 7: Smooth Scroll

**Goal:** Scroll behavior feels fluid, not mechanical.

**Approach:** CSS `scroll-behavior: smooth` (no library needed):

```css
html {
  scroll-behavior: smooth;
}

@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
}
```

This affects anchor link navigation (e.g., skip-to-content, in-page anchors on docs) — the page glides to the target rather than jumping.

**Do NOT add a smooth-scroll library like Lenis.** PagePerfect is a content site, not a portfolio. Hijacking native scroll (momentum, overscroll, scrollbar behavior) creates more problems than it solves and violates accessibility expectations.

---

### Phase 8: Reduced Motion & Accessibility

**Current state:** `prefers-reduced-motion` is already handled in `globals.css` — it disables all animation/transition duration. This is good.

**Additions:**
- The Framer Motion `<Reveal>` component should respect reduced motion:
  ```tsx
  const prefersReducedMotion = useReducedMotion()  // from framer-motion
  if (prefersReducedMotion) return <div className={className}>{children}</div>
  ```
- View transitions CSS should also have a reduced-motion override:
  ```css
  @media (prefers-reduced-motion: reduce) {
    ::view-transition-old(root),
    ::view-transition-new(root) {
      animation: none !important;
    }
  }
  ```

---

## Priority Order

| Phase | Effort | Impact | Priority |
|-------|--------|--------|----------|
| **1. Motion tokens & cleanup** | Low | High | Do first — everything else builds on this |
| **2. Page transitions (View Transitions API)** | Low | Very High | Biggest single improvement for perceived polish |
| **3. Scroll reveals** | Medium | High | Makes every page feel alive |
| **4. Hover micro-transitions** | Medium | Medium-High | Professionalism in interactive moments |
| **5. Section transitions** | Low | Medium | Landing page flow improvement |
| **6. Loading states** | Low-Medium | Medium | Eliminates content flash |
| **7. Smooth scroll** | Trivial | Medium | One CSS line, noticeable quality |
| **8. Reduced motion** | Low | Critical (a11y) | Non-negotiable — do alongside each phase |

---

## What This Does NOT Include

Things that would be over-engineering or violate the Swiss restraint principle:

- **Parallax scrolling** — Decorative, not functional. Swiss design communicates, it doesn't perform.
- **Page-wide smooth scroll hijacking** (Lenis/Locomotive) — Breaks native scroll behavior, creates accessibility issues, and is a portfolio-site affectation.
- **Complex GSAP timelines** — Unnecessary given Framer Motion is already installed and sufficient.
- **3D transforms on content sections** — The TemplateShowcase carousel is enough. Content sections should enter cleanly on the Y-axis.
- **Animated backgrounds/particles** — Violates "typography dominates white space."
- **Loading spinners** — Use skeleton placeholders instead. Spinners are anxious; skeletons are confident.
- **Spring physics on scroll reveals** — Springs are for interactive elements (hover, drag). Scroll reveals should use tween easing — predictable, controlled.

---

## The Net Effect

After implementation, every user interaction follows one of four predictable tempos (100ms / 200ms / 350ms / 600ms). Page navigation fades smoothly. Content rises into view as you scroll. Buttons respond with crisp micro-lifts. Cards elevate on hover. Nothing bounces, wobbles, or calls attention to itself. The motion is invisible until you remove it — then the site feels broken.

That's the Swiss standard: motion as infrastructure, not ornament.
