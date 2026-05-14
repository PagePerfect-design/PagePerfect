# performance-budget.md

PagePerfect's design-side perf budget. #17 Performance engineer owns this file; it overlaps with engineering's deeper Core Web Vitals targets. This file is about **design decisions that affect perf**.

## The context

PagePerfect's `(site)` surfaces are typography-dominant by canon — no decorative imagery, no WebGL, no canvas. That choice is a perf decision too: it keeps marketing pages lean and the LCP fast on a typographic hero (text + system fonts as fallback).

This budget exists so every new design choice pays for itself or is paid for elsewhere.

## Per-surface bundle expectations

| Surface | JS budget (gzipped) | Image budget | Fonts |
|---------|---------------------|--------------|-------|
| Homepage (`/`) | <!-- TODO: measure current baseline via `next build`; PROJECT.md / STATUS.md do not publish a target --> | No raster above fold; SVG only (logo, Reveal-wrapped vector accents). | Inter Tight + Source Serif 4 + IBM Plex Mono — three families, subset where possible |
| Marketing (`/journal`, `/pricing`, `/docs` landing) | ≤ homepage | Hero WebP / AVIF if any; lazy below fold | Same families |
| Editor (`/app`) | Domain-driven; measured against editor UX | App-driven (user manuscript content) | Same families |
| Docs content (`/docs`) | Lean — content should not ship heavy JS | Inline SVG preferred | Same families |
| Journal article (`/journal/[slug]`) | Lean — long-form reading | One optional header image; rest is type | Same families |

Measure with `npm run build` in `frontend/` and inspect per-route sizes. If a PR grows a route, the PR either pays with a removal or carries an ADR (`projects/pageperfect/decisions/`).

<!-- TODO: establish authoritative LCP / CLS / INP targets for each surface. PROJECT.md notes Vercel Analytics is the production source of truth but does not pin numeric targets. Add to `projects/pageperfect/decisions/` when measured. -->

## Design moves that usually cost bundle

- Heavy animation libraries (Framer Motion, GSAP). Prefer CSS + `Reveal.tsx`'s minimal IntersectionObserver.
- Icon libraries (`lucide`, `heroicons`). Prefer inline JSX SVG for surfaces using ≤ 5 icons.
- Font weight sprawl. Each added weight = one more font file. The canon caps at 5 weights for Inter Tight, 1–2 for Source Serif 4, 2 for IBM Plex Mono.
- Raster imagery where SVG works.
- Scrollytelling / scroll-driven shaders.
- Client-side syntax highlighters loaded eagerly (load on demand in the editor; not on `(site)`).

## Design moves that usually pay for themselves

- Inline JSX SVG icons (no library, no runtime cost).
- `next/font/google` for Inter Tight + Source Serif 4 + IBM Plex Mono with `display: swap` — FOUT acceptable; FOIT is not.
- `.bg-noise` as inline SVG noise (tiny, infinitely reusable, 0.03 opacity).
- Functional shadows via CSS (`shadow-card`, `shadow-paper`, etc. — see `tokens.md`).
- IntersectionObserver-gated reveals via `Reveal` / `RevealGroup` — no animation runs offscreen.

## Anti-patterns (banned unless individually approved)

- WebGL / canvas backgrounds on `(site)` surfaces (Vanta, Three.js, shader walls).
- Auto-advancing carousels on mobile (battery + perf + UX).
- Parallax on mobile (noise-to-signal too low on small viewports).
- Hero video that autoplays.
- Custom scrollbars via JS (use CSS or accept native).
- Large SVG sprite sheets on first paint.
- Loading the editor bundle on `(site)` pages — keep route groups isolated.

## When a design move wants to break the budget

Legitimate reasons exist. Process:

1. `design-*` skill proposes the move in a spec.
2. Spec includes: measured impact (`npm run build` before/after), UX justification, alternative considered.
3. #17 reviews. Either approves with a removal pair, or rejects.
4. If rejected: the spec is revised with a lower-cost alternative.

## Interaction with motion

Motion is a perf cost too. See `motion.md` for the rules. Short version: if an animation costs >2ms per frame on a `(site)` surface, it's too expensive.

- `Reveal` / `RevealGroup` gate work behind IntersectionObserver — entries don't animate until in viewport.
- The `animate-skeleton` infinite pulse is acceptable in the editor only; never on `(site)` first-paint.
- Reduced-motion branches should also be the cheap branch — instant transitions cost zero frame budget.

## Compile pipeline perf (cross-reference)

PagePerfect's value is fast compile feedback. Editor design decisions inherit a perf budget:

- Live preview compile loop runs on a 1s debounce (`CompileShell.tsx`) with `AbortController` for in-flight cancellation.
- Backend p95 compile time <!-- TODO: PROJECT.md sets `COMPILE_TIMEOUT_MS = 45000` (45s SIGKILL); target p95 numbers not published — measure and add. -->.
- Queue UI (`FloatingHUD`, `StatusBar`) polls compile status; polling interval is short enough to feel live, long enough not to thrash.

The compile worker (`backend/compile-worker.js`) and its sandboxing aren't a design concern, but design decisions can hurt this loop — e.g., adding a sync render on every keystroke would. Defer to `useCompileQueue.ts` patterns.

## Canonical measurement

- `npm run build` (in `frontend/`) per-route output = authoritative bundle size.
- Vercel Analytics real-user data = authoritative Core Web Vitals (LCP, CLS, INP).
- Lighthouse local = directional signal, not authoritative.
- `/status` page (`(site)/status/StatusClient.tsx`) and `/docs` `RequirementsCheck` are user-facing health checks, not perf budgets.

## When the budget needs to change

The budget is a forcing function, not a sacred number. Re-argue via ADR:

- `projects/pageperfect/decisions/YYYY-MM-DD-design-budget-<change>.md`
- States the new budget, what buys it, what it buys.
- #17 review required.
- User approval required.

## Canonical sources

- `frontend/tailwind.config.ts` — bundle composition (tokens, shadows, animations).
- `frontend/src/app/globals.css` — motion + utility surface area.
- `frontend/src/components/Reveal.tsx` — IntersectionObserver entrance pattern.
- `projects/pageperfect/PROJECT.md` — env vars, timeouts, deployment topology.
- `projects/pageperfect/STATUS.md` — current gaps (e.g., thin `prefers-reduced-motion` coverage, no frontend tests).

## Changelog

- 2026-05-14: Rescoped from upstream master-build-kit "Ledger" canon (Vanta NET removal anecdote, Fraunces/IBM Plex Sans/JetBrains Mono budget, AG seat names Thane/Maren/Kael/Idris) to PagePerfect's typography-dominant `(site)` canon and dark editor. Anchored to actual font families (Inter Tight, Source Serif 4, IBM Plex Mono), real components (`Reveal`/`RevealGroup`, `CompileShell`, `FloatingHUD`), and PagePerfect Standing Council seat #17. Flagged TODOs where PROJECT.md/STATUS.md do not yet publish authoritative numbers (LCP/CLS targets, bundle-size baseline, p95 compile time).
