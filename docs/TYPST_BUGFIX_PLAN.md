# Typst Integration — Bug Fix & Hardening Plan

## Audit Findings: 5 Bugs, 3 Integration Gaps

### BUG 1: Header-includes preamble not passed to Pandoc [CRITICAL]
**File:** `compile-worker.js:441-451`
The Typst path writes a `header-includes.typ` file (line 398) but never passes
it to Pandoc via `-H`. The LaTeX path correctly uses `-H header.tex` (line 819).
All templates have `$for(header-includes)$` blocks, so the fix is simply adding
`-H` to the Typst pandoc args.

**Impact:** Grid geometry (margins, page sizes), heading variants, watermark,
and book engineering policies are all silently ignored.

**Fix:** Add `-H header-includes.typ` to typstArgs array.

---

### BUG 2: Missing author/date Pandoc variables [CRITICAL]
**File:** `compile-worker.js:445`
Only `-M title=` is passed. All 15 templates check `$if(author)$` and
`$if(date)$` but these are never set. The LaTeX path has the same issue
(line 817) — both rely on Pandoc's YAML frontmatter extraction from the
manuscript. However, we should also pass explicit metadata when available.

**Fix:** Extract author/date from job data and pass as `-M` flags.

---

### BUG 3: Watermark opacity uses invalid Typst syntax [HIGH]
**File:** `watermark-typst.js:57`
`white.transparentize(93%)` — Typst's `.transparentize()` takes a ratio (0-1),
not a percentage. Should be `white.transparentize(93%)` is actually valid in
Typst 0.13+ (percentages work). BUT the real issue is the watermark approach:
placing a white rect over content is wrong — it would cover the content.

**Fix:** Rewrite watermark to use proper opacity on the mark itself, not an
overlay. Set fill color directly with opacity: `luma(180).transparentize(93%)`.

---

### BUG 4: Book engineering widow/orphan penalties computed but unused [MEDIUM]
**File:** `book-engineering.js:440-441`
`widowPct` and `clubPct` are calculated but never emitted in the output.
Typst 0.12+ doesn't expose per-paragraph widow-penalty knobs like TeX.

**Fix:** Remove dead calculations. Keep the hyphenation and justify controls
which do work. Add a comment documenting that Typst handles widows/orphans
internally with its own heuristics.

---

### BUG 5: Grid system Typst geometry applies page dimensions redundantly [LOW]
The templates already set `#set page(margin: ...)`. The grid system also
generates `#set page(...)` in header-includes. Once Bug 1 is fixed, the
header-includes will OVERRIDE the template defaults — which is correct
behavior (user's margin preset wins over template default).

**Status:** Not a bug once Bug 1 is fixed. This is working as designed.

---

## Integration Gaps

### GAP 1: No engine field in API compile status response
**File:** `routes/compile.js`
The compile worker returns `engine: 'typst'` but the status endpoint doesn't
include it in the response. Frontend can't display which engine was used.

### GAP 2: No test coverage for Typst modules
7 new files have zero tests. Need unit tests for:
- typst-error-translator.js
- watermark-typst.js
- heading-variants-typst.js
- layout-sanity-checker.js
- grid-system.js (Typst methods)
- book-engineering.js (Typst methods)

### GAP 3: Frontend doesn't surface engine/layoutReport
`useCompileQueue.ts` doesn't extract `engine` or `layoutReport` from status.
`PreviewPane.tsx`, `FloatingHUD.tsx`, `LaunchOverlay.tsx` need engine indicator.

---

## Implementation Order

1. Fix Bug 1 (header-includes) — unlocks ALL preamble injection
2. Fix Bug 3 (watermark) — prevents compile errors for free tier
3. Fix Bug 2 (author/date) — proper title page rendering
4. Fix Bug 4 (dead code) — cleanup
5. Gap 2: Write tests for all new modules
6. Gap 1+3: Frontend engine indicator + layoutReport display
