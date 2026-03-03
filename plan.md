# Plan: Pinpoint Perfect Formatting

Three agents audited the full Typst pipeline — all 15 templates, the assembly order, grid system, engineering preamble, Pandoc body conversion, and Lua filters. Here are all issues ranked by impact.

---

## CRITICAL 1: Engineering preamble overwrites template typography (5 of 15 templates)

Assembly order: template → grid override → **engineering preamble** → heading variant.

The engineering preamble emits `#set par(justify: ...)` and `#set text(hyphenate: ...)` based on the template's *category*. These come AFTER the template, so they always win. But every template already explicitly sets both — the preamble only conflicts.

| Template | gridType | Template wants | Engineering emits | Broken |
|----------|----------|---------------|-------------------|--------|
| **exhibit** | trade | justify:false, hyphenate:false | justify:true, hyphenate:true | Both wrong |
| **cinema** | basic | justify:false, hyphenate:false | justify:true, hyphenate:true | Both wrong |
| **operator** | editorial | justify:true | justify:false | Justify wrong |
| **avantgarde** | creative | hyphenate:false | hyphenate:true | Hyphenate wrong |
| **verse** | creative | hyphenate:false | hyphenate:true | Hyphenate wrong |

**Fix:** Remove justify/hyphenation from `generateTypstEngineeringPreamble()`. Templates are the authority.
**File:** `backend/book-engineering.js`

---

## CRITICAL 2: Cinema screenplay body is EMPTY (`fountain.lua` emits LaTeX into Typst)

`fountain.lua` emits `pandoc.RawBlock('latex', ...)` for every screenplay element (scene headings, character cues, dialogue, transitions). When Pandoc's output is `-t typst`, **LaTeX raw blocks are silently discarded**. The entire screenplay body vanishes.

The chain: Fountain text → `normalizeFountain()` → fenced divs → `fountain.lua` → `RawBlock('latex', ...)` → Pandoc `-t typst` → dropped.

**Fix:** Rewrite `fountain.lua` to emit native Pandoc AST nodes (headers, divs with classes) instead of LaTeX raw blocks. The `cinema.typ` template's `#show heading` rules already handle scene headings as uppercase H1s — the filter just needs to produce standard AST elements that Pandoc's Typst writer can serialize.
**File:** `backend/filters/fountain.lua`

---

## CRITICAL 3: Cinema asymmetric margins destroyed by grid system

`cinema.typ` sets `margin: (left: 1.5in, right: 1in)` — the screenplay industry standard. The grid system classifies cinema as `basic` (gutterOffset: 0) and replaces this with uniform margins.

**Fix:** Pass `tplKey` to `calculateTypstMargins()` and skip margin override when `tplKey === 'cinema'` (cinema manages its own margins entirely, including hardcoded US Letter page size).
**Files:** `backend/grid-system.js`, `backend/compile-worker.js`

---

## MEDIUM 1: Tables wrapped in `#figure` with no show rules

Pandoc wraps tables in `#figure(... , kind: table)`. Templates have no `#show figure` rules, so tables get:
- Unwanted figure numbering
- Extra vertical spacing from the figure wrapper
- Empty caption area

**Fix:** Add to the compile preamble:
```typst
#show figure.where(kind: table): it => it.body
```
This strips the figure wrapper, letting template `#show table` rules work directly.
**File:** `backend/compile-worker.js` (preamble assembly)

---

## MEDIUM 2: Drop cap system is dead code

`drop-cap-typst.js` is imported but `getDropCapPreamble()` is never called. Drop caps for paperback, memoir, and symphony are designed but unwired.

**Fix:** Wire into assembly after heading variant step.
**File:** `backend/compile-worker.js`

---

## MEDIUM 3: Inconsistent `#let horizontalrule` across compile paths

Main compile path: centered `* * *` asterisks (scene break ornament).
Batch compile path: simple 50% horizontal line.
Tests: same as batch (wrong).

**Fix:** Extract the `horizontalrule` definition to a shared constant and use it in all three locations.
**Files:** `backend/compile-worker.js`, `backend/routes/compile.js`

---

## Implementation Steps

### Step 1: Fix engineering preamble overrides
**File:** `backend/book-engineering.js`
- In `generateTypstEngineeringPreamble()`, remove the `#set par(justify: ...)` and `#set text(hyphenate: ...)` emissions. The function should only emit the comment header.

### Step 2: Fix cinema screenplay filter
**File:** `backend/filters/fountain.lua`
- Replace all `pandoc.RawBlock('latex', ...)` with native AST nodes:
  - Scene headings → `pandoc.Header(1, text)` (template shows H1 as uppercase sluglines)
  - Character cues → `pandoc.Div(pandoc.Para(pandoc.Strong(text)), {class="character"})`
  - Dialogue → `pandoc.BlockQuote(pandoc.Para(text))` (template shows blockquotes as dialogue blocks)
  - Parentheticals → `pandoc.Div(pandoc.Para(pandoc.Emph(text)), {class="parenthetical"})`
  - Transitions → `pandoc.Para(pandoc.Strong(text))`

### Step 3: Fix cinema margin/page override
**Files:** `backend/grid-system.js`, `backend/compile-worker.js`
- Add `tplKey` parameter to `calculateTypstMargins()`
- Return empty string when `tplKey === 'cinema'` (cinema controls its own page geometry)

### Step 4: Fix table figure wrapping
**File:** `backend/compile-worker.js`
- Add to preamble (mainParts step 1): `#show figure.where(kind: table): it => it.body`

### Step 5: Wire drop caps
**File:** `backend/compile-worker.js`
- After step 5 (heading variant), add: `const dc = dropCapTypst.getDropCapPreamble(tplKey); if (dc) mainParts.push(dc);`

### Step 6: Unify horizontalrule definition
**Files:** `backend/compile-worker.js`, `backend/routes/compile.js`
- Extract to a shared constant in `compile-utils.js`

### Step 7: Verify and push
- Run backend tests
- TypeScript check frontend
- Commit and push
