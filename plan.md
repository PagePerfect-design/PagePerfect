# Mobile Optimisation Plan — PagePerfect

## Audit Summary

The site is desktop-first with limited mobile handling. Three areas are **critical** (nav, pricing table, editor), two are **high** (touch targets, sidebar navigation), and the rest are **medium** fixes.

---

## Phase 1 — Navigation (Critical)

**Problem:** No hamburger menu. All nav items (Pricing, Journal, NavAuth, Open Editor) overflow horizontally on phones. 10px text is untappable.

**Fix in `frontend/src/app/(site)/layout.tsx`:**
- Add a `MobileNav` client component with hamburger icon (3 horizontal lines)
- Desktop: current horizontal bar unchanged (`hidden md:flex` on the link group)
- Mobile: hamburger button (`md:hidden`) opens a full-screen overlay or slide-down panel
  - Stack links vertically: Pricing, Journal, Docs, Sign in / User menu
  - "Open Editor" as full-width red CTA at bottom
  - Each link = 48px min height for touch targets
  - Close on link click or X button
- Keep sticky `top-0 z-40` behavior on both

**Files:** `(site)/layout.tsx`, new `components/MobileNav.tsx` (client component)

---

## Phase 2 — Pricing Comparison Table (Critical)

**Problem:** `min-w-[640px]` forces horizontal scroll. Four tier columns are unreadable on 375px screens.

**Fix in `frontend/src/app/(site)/pricing/page.tsx`:**
- Replace horizontal scroll table with **stacked cards on mobile** (`md:hidden` / `hidden md:block` pattern):
  - Desktop (md+): current Swiss-style table grid — unchanged
  - Mobile: each feature becomes a card row showing feature name + value for each tier stacked vertically, or a single-tier-at-a-time tabbed view
- Simplest approach: on mobile, show a vertical list where each row displays the feature name and all 4 values in a 2x2 grid beneath it
- Tier number sizing: reduce `text-[4rem]` to `text-[2.5rem]` on mobile via responsive class (`text-[2.5rem] md:text-[4rem] md:text-[5rem]`)

**Files:** `(site)/pricing/page.tsx`

---

## Phase 3 — Editor Mobile Gate (Critical)

**Problem:** The editor is entirely desktop-dependent — fixed-dimension PDF preview (520x680px), dock toolbar, split-pane layout. Redesigning it for mobile is a large project.

**Fix in `frontend/src/app/app/CompileShell.tsx`:**
- Add a **mobile gate** at the top of the main editor component:
  - Detect viewport width < 768px
  - Show a full-screen message: "PagePerfect's editor requires a desktop browser. Open this page on a laptop or tablet for the best experience."
  - Include a "Continue anyway" link that dismisses the gate (for adventurous users)
- This is a pragmatic short-term solution — a full mobile editor would be a separate project

**Files:** `app/CompileShell.tsx`

---

## Phase 4 — Touch Targets & Small Interactions (High)

**Problem:** Many buttons are `h-8` (32px), nav/footer links have no padding, all below the 44px iOS minimum.

**Fixes across multiple files:**
- Footer links: add `py-1` minimum padding to create 44px tap zones
- Nav links (desktop): already adequate with hamburger replacing them on mobile
- Journal article cards: already 32px padding — OK
- Pricing CTA buttons: `h-10` (40px) -> add `sm:h-12` or increase base to `h-11` (44px)
- Editor dock buttons: increase from `h-8` to `h-10` on mobile, but editor has mobile gate so lower priority

**Files:** `(site)/layout.tsx` (footer), `(site)/pricing/page.tsx`

---

## Phase 5 — Journal & Docs Mobile Sidebar (High)

**Problem:** Both pages hide sidebar navigation on mobile. Users have no way to filter journal categories or navigate docs sections on phones.

**Journal fix in `frontend/src/app/(site)/journal/page.tsx`:**
- Add a horizontal scrollable category filter bar above the article list on mobile (`md:hidden`)
- Pills/chips for each category: All, Typography, Layout, Conversion, etc.
- Active state: solid black fill. Tapping filters the article list

**Docs fix in `frontend/src/app/(site)/docs/page.tsx`:**
- Add a collapsible "Sections" button at the top of docs content on mobile (`lg:hidden`)
- Tapping reveals a full-width vertical list of section anchors
- Closes after selection

**Files:** `(site)/journal/page.tsx`, `(site)/docs/page.tsx`, possibly `DocsNav.tsx`

---

## Phase 6 — Typography & Spacing Polish (Medium)

**Problem:** Many inline `text-[Xpx]` values don't scale. Padding is sometimes aggressive on small screens.

**Fixes:**
- Pricing tier numbers: `text-[4rem] md:text-[5rem]` -> `text-[2.5rem] md:text-[4rem] lg:text-[5rem]`
- Pricing tier prices: `text-[2rem] md:text-[2.5rem]` — already responsive, OK
- Docs content padding: `px-8 md:px-16` -> `px-4 sm:px-8 md:px-16` (more breathing room on small phones)
- Hero section: already uses clamp() — OK
- Section headings: already use responsive Tailwind text scale — OK

**Files:** `(site)/pricing/page.tsx`, `(site)/docs/page.tsx`

---

## Phase 7 — Global Mobile Utilities (Medium)

**Fixes in `frontend/src/app/globals.css`:**
- Add `:active` states for touch feedback on buttons (background shift on press)
- Add scrollbar hide utility for horizontal scroll containers on mobile
- Ensure `.skip-link` is accessible on mobile screen readers

**Files:** `globals.css`

---

## Execution Order

| Phase | Severity | Scope | Files |
|-------|----------|-------|-------|
| 1. Nav hamburger | Critical | ~80 lines new component | layout.tsx, MobileNav.tsx |
| 2. Pricing table | Critical | ~60 lines refactor | pricing/page.tsx |
| 3. Editor gate | Critical | ~30 lines | CompileShell.tsx |
| 4. Touch targets | High | ~15 lines tweaks | layout.tsx, pricing |
| 5. Sidebar mobile | High | ~50 lines each | journal, docs |
| 6. Typography | Medium | ~10 lines tweaks | pricing, docs |
| 7. Global CSS | Medium | ~15 lines | globals.css |

All changes maintain the Swiss-Ogilvy design system: sharp geometry, solid ink, red accent CTA, no rounded corners on marketing pages.
