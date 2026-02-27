# PLAN: Split Pipeline — Pandoc Body-Only + Direct Typst Compile

## Problem

Pandoc is a middleman between our templates and Typst. It forces:
- Templates written in Pandoc's `$variable$` syntax instead of native Typst
- `#let horizontalrule` needed because Pandoc's Typst writer emits it (not a Typst concept)
- Debugging across TWO systems (Pandoc template expansion + Typst compilation)
- Header-include scoping issues, variable conflicts, version-dependent bugs

## Solution: Split the Pipeline

**Current (broken):**
```
Markdown → Pandoc [parse + template + call typst] → PDF
```

**New (clean):**
```
Markdown → Pandoc [parse only] → body.typ → JS assembles main.typ → Typst compile → PDF
```

Keep Pandoc for what it's great at (Markdown parsing, citations, Lua filters).
Remove Pandoc from what it's bad at (template system, engine management).

---

## Architecture

### New Pandoc Command (body conversion only)
```
pandoc input.md \
  --from=markdown[+citations][-raw_tex][-raw_attribute] \
  -t typst \
  --top-level-division=chapter|section \
  --resource-path=<tmpBase> \
  [--citeproc --bibliography=refs.bib] \
  [--lua-filter fountain.lua] \
  -o body.typ
```

No `--pdf-engine`. No `--template`. No `-H`. No `-V`. No `-M`.

### New Typst Command (direct compilation)
```
typst compile [--font-path <dir>] main.typ output.pdf
```

### main.typ Assembly (JavaScript string concatenation)

Order matters — Typst #set rules are cumulative, later overrides earlier:

```typst
// ── 1. PREAMBLE (compile-worker.js) ──
#let horizontalrule = line(start: (25%,0%), end: (75%,0%))
#let pp-title = "Book Title"
#let pp-author = "Author Name"        // or: none
#let pp-date = none
#let pp-mainfont = "Alegreya Sans"

// ── 2. TEMPLATE STYLE (from template file, before %% CONTENT %% marker) ──
// #set page(...), #set text(...), #show heading..., #show quote..., etc.

// ── 3. GRID OVERRIDE (grid-system.js — overrides template's default margins) ──
#set page(width: 6in, height: 9in, margin: 0.694in)

// ── 4. ENGINEERING (book-engineering.js) ──
#set par(justify: true)
#set text(hyphenate: true)

// ── 5. HEADING VARIANT (heading-variants-typst.js — if not 'classic') ──
#show heading.where(level: 1): it => { ... }

// ── 6. WATERMARK (watermark-typst.js — if free tier) ──
#set page(background: { ... })

// ── 7. BUILD PROVENANCE ──
// Build: abc123 | 2026-02-27T12:00:00Z

// ── 8. TEMPLATE CONTENT (from template file, after %% CONTENT %% marker) ──
// Title page using pp-title, pp-author

// ── 9. BODY (from Pandoc's body.typ output) ──
// All converted Markdown content, citations already resolved by citeproc
```

---

## Template Conversion (15 files)

Each template: Pandoc-Typst hybrid → pure Typst.

### Syntax changes per template:
| Before (Pandoc syntax) | After (pure Typst) |
|---|---|
| `$title$` | `pp-title` |
| `$author$` | `pp-author` |
| `$date$` | `pp-date` |
| `$if(title)$...$endif$` | `#if pp-title != none [...]` |
| `$if(author)$...$endif$` | `#if pp-author != none [...]` |
| `$if(mainfont)$$mainfont$$else$Default$endif$` | `pp-mainfont` |
| `$for(header-includes)$...$endfor$` | **DELETE** (JS assembly handles this) |
| `$body$` | **DELETE** (JS assembly appends body) |
| `$if(bibliography)$...$endif$` | **DELETE** (citeproc inlines it in body) |
| `#let horizontalrule = ...` | **DELETE** (preamble defines it once) |

### Structural change:
Add `// %% CONTENT %%` marker between style rules and title page.
compile-worker.js splits on this to insert overrides between style and content.

### Example: paperback.typ

**Before:**
```typst
#set text(font: "$if(mainfont)$$mainfont$$else$Alegreya Sans$endif$", ...)
align(left, smallcaps[$if(title)$$title$$endif$])
#let horizontalrule = line(start: (25%,0%), end: (75%,0%))
$for(header-includes)$
$header-includes$
$endfor$
$if(title)$
#page(...)[#text(...)[$title$] $if(author)$#text(...)[$author$]$endif$]
$endif$
$body$
$if(bibliography)$...$endif$
```

**After:**
```typst
#set text(font: pp-mainfont, ...)
align(left, smallcaps[#pp-title])
// %% CONTENT %%
#if pp-title != none [
  #page(...)[#text(...)[#pp-title] #if pp-author != none [#text(...)[#pp-author]]]
]
```

---

## Files Changed

### Phase 1: Convert 15 templates (independent, can be done in parallel)
```
backend/typst-templates/chicago.typ
backend/typst-templates/symphony.typ
backend/typst-templates/thesis.typ
backend/typst-templates/minimal.typ
backend/typst-templates/paperback.typ
backend/typst-templates/memoir.typ
backend/typst-templates/exhibit.typ
backend/typst-templates/heirloom.typ
backend/typst-templates/verse.typ
backend/typst-templates/chronicle.typ
backend/typst-templates/international.typ
backend/typst-templates/operator.typ
backend/typst-templates/matrix.typ
backend/typst-templates/avantgarde.typ
backend/typst-templates/cinema.typ
```

### Phase 2: Rewrite compile-worker.js (core change)
Lines ~295-570: Replace monolithic Pandoc call with 2-step pipeline.
Keep: PocketBase auth, EPUB, error handling, provenance, pre-flight, PDF/X.

### Phase 3: Update batch compile in routes/compile.js
Lines ~620-700: Same structural change as compile-worker.js.

### Phase 4: Update tests
`backend/tests/template-regression.test.js` — adapt for new template format.

### Unchanged:
- `compileEpub()` — Pandoc for EPUB (no templates involved)
- `POST /api/convert` — Pandoc for .docx→markdown (no templates involved)
- All frontend files
- grid-system.js, book-engineering.js, heading-variants-typst.js, watermark-typst.js
- typography-assurance.js, layout-sanity-checker.js, typst-error-translator.js

---

## compile-worker.js: New Pipeline (pseudocode)

```javascript
// ── STEP A: Pandoc converts Markdown → Typst body ──
const bodyPath = path.join(tmpBase, 'body.typ');
const pandocArgs = [
  mdPath, fromFmt, '-t', 'typst',
  `--top-level-division=${topLevelDiv}`,
  `--resource-path=${tmpBase}`,
  ...luaFilters,          // fountain.lua for cinema
  ...(safeMode ? [] : citeprocArgs(BIB_PATH)),
  '-o', bodyPath,
];
// spawn('pandoc', pandocArgs, { cwd: tmpBase })

// ── STEP B: Read template, split at marker ──
const tplContent = await fsp.readFile(typstTemplatePath, 'utf8');
const markerIdx = tplContent.indexOf('// %% CONTENT %%');
const tplStyle = markerIdx >= 0 ? tplContent.slice(0, markerIdx) : tplContent;
const tplContent = markerIdx >= 0 ? tplContent.slice(markerIdx + '// %% CONTENT %%'.length) : '';

// ── STEP C: Assemble main.typ ──
const bodyContent = await fsp.readFile(bodyPath, 'utf8');
const mainTyp = [
  // 1. Preamble
  `#let horizontalrule = line(start: (25%,0%), end: (75%,0%))`,
  `#let pp-title = ${typstString(safeTitle)}`,
  `#let pp-author = ${author ? typstString(author) : 'none'}`,
  `#let pp-date = ${date ? typstString(date) : 'none'}`,
  `#let pp-mainfont = ${typstString(mainFont)}`,
  // 2. Template style
  tplStyle.trim(),
  // 3. Grid override
  geo,
  // 4. Engineering
  engineering,
  // 5. Heading variant
  headingVariant || '',
  // 6. Watermark
  needsWatermark ? watermarkPreamble : '',
  // 7. Provenance
  `// Build: ${buildMeta.buildId} | ${buildMeta.timestamp}`,
  // 8. Template content (title page)
  tplContentSection.trim(),
  // 9. Body
  bodyContent,
].filter(Boolean).join('\n\n');

await fsp.writeFile(path.join(tmpBase, 'main.typ'), mainTyp, 'utf8');

// ── STEP D: Typst compile ──
const typstArgs = ['compile'];
if (customFontDir) typstArgs.push('--font-path', customFontDir);
typstArgs.push('main.typ', 'output.pdf');
// spawn('typst', typstArgs, { cwd: tmpBase })
```

### Helper: typstString()
```javascript
function typstString(s) {
  // Escape for Typst string literal: backslash, double-quote
  return '"' + String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
}
```

---

## Risk Assessment

| Risk | Mitigation |
|---|---|
| Typst #set scope | We concatenate into one file — all in same scope |
| Pandoc body output changes | Pandoc 3.6.2 pinned in Dockerfile |
| Template split marker fragile | Validated at compile time — error if missing |
| Citations break | citeproc runs in Pandoc step, inlines bibliography |
| Custom fonts | `typst compile --font-path` replaces Pandoc font handling |
| EPUB path breaks | Unchanged — still uses Pandoc directly |
| Two spawns instead of one | Pandoc body-only is fast (~200ms); Typst compile is the slow part |
