# PagePerfect — Execution Plan

> Branch: `claude/pageperfect-assessment-C7dtI`
> Created: 2026-02-22
> Status: IN PROGRESS

---

## Track A — Critical Bugs (Revenue & Data Integrity)

### A1. Fix manuscript duplication across sessions
- **Problem:** `useManuscript` hook stores `manuscriptId` in React state, which resets to `null` on every page reload. Every new browser session creates a NEW PocketBase record instead of updating the existing one. Logged-in users accumulate orphaned duplicate manuscripts.
- **Root cause:** `manuscriptId` is never persisted to localStorage or restored on mount.
- **Fix:**
  - [x] In `use-manuscript.ts`: persist `manuscriptId` to localStorage on create/update
  - [x] In `use-manuscript.ts`: restore `manuscriptId` from localStorage on mount (when userId matches)
  - [x] In `use-manuscript.ts`: make `loadManuscript` return the full record data so CompileShell can populate editor state
  - [x] Added `newManuscript()` action to clear manuscriptId and start fresh
  - [x] Exported `ManuscriptState`, `ManuscriptListItem`, `LoadedManuscript` types
- **Files:** `frontend/src/lib/use-manuscript.ts`
- **Signed off:** [x] 2026-02-22

### A2. Wire up full manuscript persistence in CompileShell
- **Problem:** CompileShell only destructures `saveManuscript` and `saving` from `useManuscript`. The `loadManuscript`, `listManuscripts`, `deleteManuscript`, `manuscriptId`, and `saveError` returns are completely ignored. Users can save but never retrieve past work.
- **Fix:**
  - [x] Destructure all returns from `useManuscript` in CompileShell
  - [x] Cloud sync indicator in TopBar (Cloud / CloudOff / Loader2 icons)
  - [x] Surface `saveError` via CloudOff icon with title tooltip
  - [x] FolderOpen button in TopBar to open manuscript browser
- **Files:** `frontend/src/app/app/CompileShell.tsx`
- **Signed off:** [x] 2026-02-22

### A3. Build manuscript browse/load/delete UI
- **Problem:** No way for logged-in users to browse, load, or delete saved manuscripts from PocketBase. The hook has full CRUD but zero UI.
- **Fix:**
  - [x] ManuscriptBrowser component — modal panel with list, load, delete
  - [x] List shows title + last-updated date, highlights current manuscript
  - [x] Delete with inline confirmation (Confirm/Cancel)
  - [x] "New" button to clear editor and start fresh
  - [x] Available from both PortalStage ("My manuscripts" link) and design stage (TopBar FolderOpen icon)
  - [x] PortalStage also shows "Resume editing" link when localStorage has content
  - [x] Only visible when user is logged in
- **Files:** `frontend/src/app/app/CompileShell.tsx`
- **Signed off:** [x] 2026-02-22

### A4. Clean up dead `single` tier from frontend types
- **Problem:** `database.types.ts` defines `Tier = 'drafter' | 'single' | 'publisher' | 'studio'` but PocketBase schema only has `drafter | publisher | studio`. The `single` concept is only Stripe payment metadata (increments `pdf_credits`), never a PocketBase tier value.
- **Fix:**
  - [x] Removed `single` from `Tier` type in `database.types.ts`
  - [x] Removed `single` from `TIER_LEVEL` in `CompileShell.tsx`
  - [x] Renumbered to match backend: `{ anonymous: 0, drafter: 1, publisher: 2, studio: 3 }`
- **Files:** `frontend/src/lib/database.types.ts`, `frontend/src/app/app/CompileShell.tsx`
- **Signed off:** [x] 2026-02-22

### A5. Automated Preflight Gate (Acceptance Contract)
- **Problem:** Users could spend credits or $19.99 without formal acceptance of preflight results. No quality guarantee was surfaced before payment consumption.
- **Fix:**
  - [x] Two-step download flow for paid users (publisher/studio/credit holders):
    1. "Review Preflight & Download" button triggers contract display
    2. Acceptance Contract shows: platform compliance statement, all check results, page/trim/spine stats
    3. Checkbox: "I accept this preflight report and authorize the export"
    4. Green "Download — Contract Accepted" button only enabled after acceptance
  - [x] Free/watermarked downloads bypass the contract (no credit consumption)
  - [x] Contract resets when preflight settings change
- **Files:** `frontend/src/app/app/CompileShell.tsx` (LaunchOverlay)
- **Signed off:** [x] 2026-02-22

---

## Track B — Mobile Optimisation (from plan.md)

### B1. Navigation hamburger menu (Critical)
- **Problem:** No mobile nav. All links overflow horizontally on phones.
- **Fix:**
  - [x] Created `MobileNav.tsx` client component with hamburger icon
  - [x] Desktop nav hidden on mobile (`hidden md:flex`)
  - [x] Mobile: full-screen overlay with stacked links, 48px touch targets
  - [x] "Open Editor" as full-width red CTA at bottom
  - [x] Active route highlighting
- **Files:** `frontend/src/app/(site)/layout.tsx`, `frontend/src/components/MobileNav.tsx`
- **Signed off:** [x] 2026-02-22

### B2. Pricing table mobile layout (Critical)
- **Problem:** `min-w-[640px]` forces horizontal scroll on phones.
- **Fix:**
  - [x] Desktop (md+): current Swiss-style table grid unchanged
  - [x] Mobile: stacked card layout, one tier per card
  - [x] Responsive tier number sizing (3rem → 4rem → 5rem)
  - [x] Price column: removed left border on mobile
- **Files:** `frontend/src/app/(site)/pricing/page.tsx`
- **Signed off:** [x] 2026-02-22

### B3. Editor mobile gate (Critical)
- **Problem:** Editor is desktop-only — PDF preview, dock toolbar, split-pane all break on mobile.
- **Fix:**
  - [x] Detect viewport < 768px on mount
  - [x] Show full-screen "Desktop Required" message with PagePerfect mark
  - [x] "Back to Home" link + "Continue anyway" dismiss option
  - [x] Dark theme to match editor aesthetic
- **Files:** `frontend/src/app/app/CompileShell.tsx`
- **Signed off:** [x] 2026-02-22

### B4. Touch targets (High)
- [x] Footer links: 44px min tap zones via `min-h-[44px]` + `inline-flex items-center`
- [x] Pricing CTA buttons: increased to `h-11` (44px)
- [x] Journal CTA buttons: 44px height with `h-11`, stacked on mobile
- **Files:** `(site)/layout.tsx`, `pricing/page.tsx`, `journal/page.tsx`
- **Signed off:** [x] 2026-02-22

### B5. Journal & Docs mobile sidebar (High)
- [x] Journal: horizontal scrollable category chips on mobile with `scrollbar-hide`
- [x] Docs: collapsible "Sections" button on mobile via `DocsMobileNav.tsx`
- [x] Docs mobile nav: 44px link targets, grouped sections, auto-close on navigate
- **Files:** `journal/page.tsx`, `docs/page.tsx`, `docs/DocsNav.tsx`, `docs/DocsMobileNav.tsx`
- **Signed off:** [x] 2026-02-22

### B6. Typography & spacing polish (Medium)
- [x] Responsive font sizing for pricing tier numbers (3rem/4rem/5rem breakpoints)
- [x] Docs content padding: `px-6 py-8` on mobile, increasing at md/lg breakpoints
- [x] Docs template card padding: `1.25rem` mobile → `1.5rem 2rem` desktop
- **Files:** `pricing/page.tsx`, `docs/page.tsx`, `globals.css`
- **Signed off:** [x] 2026-02-22

### B7. Global mobile CSS utilities (Medium)
- [x] `:active` states for touch feedback (opacity 0.7 on `hover: none` devices)
- [x] `.scrollbar-hide` utility for horizontal scroll containers
- [x] Skip-link mobile accessibility (repositioned, larger tap zone)
- **Files:** `globals.css`
- **Signed off:** [x] 2026-02-22

---

## Track C — CI & Infrastructure (from assessment)

### C1. Add `tsc --noEmit` to frontend CI
- **Problem:** Turbopack build skips type-checking. TS errors ship silently.
- [x] Added `npx tsc --noEmit` step before `npm run build` in `.github/workflows/ci.yml`
- **Signed off:** [x] 2026-02-22

### C2. Add `.dockerignore`
- **Problem:** `COPY . .` pulls in node_modules, tests, .env files.
- [x] Created `backend/.dockerignore` excluding node_modules, tests, .env, *.pdf, *.md
- **Signed off:** [x] 2026-02-22

### C3. Switch Dockerfile to `npm ci`
- [x] Changed `npm install --omit=dev` to `npm ci --omit=dev` for reproducible builds
- **Signed off:** [x] 2026-02-22

### C4. Lulu webhook TODO
- **Problem:** `index.js:1033` — Lulu webhook events are acknowledged but status is not persisted.
- [ ] Write order status to PocketBase or log it persistently
- **Signed off:** [ ]

---

## Execution Order

| Priority | Task | Track | Status |
|----------|------|-------|--------|
| 1 | A1 — Manuscript session persistence | Bug | DONE |
| 2 | A4 — Clean up `single` tier | Bug | DONE |
| 3 | A2 — Wire up manuscript hook in CompileShell | Bug | DONE |
| 4 | A3 — Manuscript browse UI | Feature | DONE |
| 5 | A5 — Preflight Acceptance Contract | Feature | DONE |
| 6 | B1 — Mobile nav | Mobile | DONE |
| 7 | B3 — Editor mobile gate | Mobile | DONE |
| 8 | B2 — Pricing mobile | Mobile | DONE |
| 9 | B4–B7 — Touch/sidebar/polish | Mobile | DONE |
| 10 | C1–C3 — CI fixes | Infra | DONE |
| 11 | C4 — Lulu webhook | Infra | TODO |
