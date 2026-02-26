# PagePerfect PDF Compilation Strategy: Migrate from LuaLaTeX to Typst

## Executive Summary

**Problem:** The LuaLaTeX compilation pipeline has been chronically fragile — locale crashes, font discovery failures, infinite error-translation loops, debug data loss, titlesec bugs, and 45-second compile times. Despite 7+ hardening commits, the fundamental issue remains: LuaLaTeX is a 40-year-old system with enormous surface area for failure in containerized environments.

**Solution:** Replace LuaLaTeX with **Typst** — a modern, Rust-based typesetting engine that uses the same Knuth-Plass line-breaking algorithm as TeX but compiles **27x faster**, has **zero locale dependencies**, produces **equivalent typographic quality**, and is already supported as a Pandoc PDF engine.

**Impact:**
- Compile times: **45 seconds → under 1 second**
- Docker image: **~2GB (TeX Live) → ~200MB (Typst binary)**
- No more locale crashes (Typst has zero locale dependencies)
- No more font discovery failures (Typst handles fonts natively)
- Better error messages (Typst errors are human-readable by default)
- Real-time live preview becomes truly real-time

---

## Why Typst Over Other Alternatives

| Engine | Quality | Speed | Complexity | Cost | Verdict |
|--------|---------|-------|------------|------|---------|
| **LuaLaTeX** (current) | Excellent | Slow (10-45s) | Very High | Free | Fragile in Docker, too slow for live preview |
| **Typst** | Excellent (Knuth-Plass) | Very Fast (<1s) | Low | Free/OSS | **Best replacement — same quality, 27x faster** |
| WeasyPrint | Good | Slow at scale | Medium | Free | Simpler line-breaking, not book-quality |
| Prince XML | Excellent | Moderate | Medium | $3,800/server | Commercial license, CSS-based |
| Puppeteer/Chrome | Moderate | Slow (browser spin-up) | High | Free | Not designed for book typesetting |
| react-pdf | Basic | Fast | Medium | Free | No Knuth-Plass, no advanced typography |
| Paged.js | Good | Slow | High | Free | Browser-dependent, not production-ready |

### Why Typst Wins

1. **Same algorithm as TeX:** Typst implements Knuth-Plass paragraph optimization — the same algorithm that makes LaTeX output beautiful. Justified text looks virtually identical.

2. **27x faster compilation:** Benchmarked at 356ms vs 9.6s for XeLaTeX. This transforms the user experience — every keystroke can trigger a recompile.

3. **Pandoc already supports it:** `pandoc --pdf-engine=typst` works today. The migration path is already built into your stack.

4. **Zero locale issues:** Typst is a single static binary. No `C.UTF-8`, no `locale-gen`, no `LC_ALL` — the entire category of locale crashes disappears.

5. **OpenType native:** Full kerning, ligatures (standard, discretionary, historical), stylistic sets (ss01-ss20), raw OpenType feature tags. No `luaotfload` hacks needed.

6. **Human-readable errors:** Instead of cryptic TeX error messages that need a 438-line error translator, Typst gives clear, line-numbered errors.

7. **RTL + CJK support:** Built-in bidirectional text, Arabic shaping, CJK support (still maturing but already functional).

8. **Tiny footprint:** Single ~30MB binary vs 500MB+ TeX Live installation. Docker image shrinks dramatically.

9. **PDF/UA accessibility:** Typst can target PDF/UA-1 for accessibility compliance — a feature LuaLaTeX doesn't have natively.

---

## Migration Architecture

### Current Pipeline (LuaLaTeX)
```
Markdown → Pandoc → LaTeX (.tex) → LuaLaTeX → PDF
                     ↑
              15 .latex templates
              4 Lua filters
              9-layer preamble injection
              Font resolution hacks
              Locale workarounds
              Error translation (438 lines)
```

### New Pipeline (Typst)
```
Markdown → Pandoc → Typst (.typ) → Typst Engine → PDF
                     ↑
              15 .typ templates
              (filters handled natively in Typst)
              Clean preamble (Typst show/set rules)
              Native font handling
              No locale dependency
              Native readable errors
```

### What Changes

| Component | Before (LuaLaTeX) | After (Typst) |
|-----------|-------------------|---------------|
| `compile-worker.js` | Spawns `pandoc --pdf-engine=lualatex` | Spawns `pandoc --pdf-engine=typst` |
| Templates | 15 `.latex` files (LaTeX macros) | 15 `.typ` files (Typst show/set rules) |
| Lua filters | 4 custom `.lua` files | Typst native show rules (or Pandoc Lua filters) |
| Font handling | `luaotfload` + `fontconfig` + `fc-cache` | Typst native `#set text(font: "...")` |
| Emoji fallback | `\directlua{luaotfload.add_fallback(...)}` | Typst native fallback fonts |
| Locale setup | `LANG=C.UTF-8` + runtime assertions | Not needed (Typst has no locale deps) |
| Error translator | 438-line regex monster | Thin wrapper — Typst errors are already readable |
| Preamble assembly | 9 injection layers via `-H header.tex` | Single template with show/set rules |
| Docker image | Ubuntu 22.04 + TeX Live 2021 (~2GB) | Alpine/Debian slim + Typst binary (~200MB) |
| Compile time | 10-45 seconds | 200ms-2 seconds |

### What Stays The Same

| Component | Notes |
|-----------|-------|
| `routes/compile.js` | API routes unchanged |
| BullMQ queue | Job processing unchanged |
| `grid-system.js` | Margin/typography calculations still apply (output Typst geometry instead of LaTeX `\geometry{}`) |
| `text-normalizer.js` | Markdown preprocessing unchanged (Pandoc input is still Markdown) |
| `latex-sanitizer.js` | Rename to `input-sanitizer.js` — still validate user input, but no more LaTeX-specific injection patterns |
| `book-engineering.js` | Quality analysis still works (parse Typst warnings instead of LaTeX log) |
| Tier system / Auth | Completely unchanged |
| Watermark system | Rewrite from TikZ to Typst `place()` function |
| PDF/X-1a conversion | Ghostscript pipeline unchanged (input is still a PDF) |
| Frontend | Zero changes needed (receives PDF blob regardless of engine) |
| PocketBase / Stripe | Zero changes |

---

## Phased Implementation Plan

### Phase 1: Proof of Concept (1-2 days)
**Goal:** Prove Typst works end-to-end with one template through Pandoc.

1. **Install Typst in Docker** — Add single binary to Dockerfile
2. **Create one Typst template** — Convert `minimal.latex` → `minimal.typ` (simplest template)
3. **Modify compile-worker.js** — Add `typst` engine option alongside `lualatex`
4. **Test end-to-end** — Compile a real manuscript with the new pipeline
5. **Compare output** — Side-by-side PDF comparison (LuaLaTeX vs Typst)

**Deliverable:** Working compilation with one template, benchmarked speed comparison.

### Phase 2: Template Conversion (3-5 days)
**Goal:** Convert all 15 templates from LaTeX to Typst.

Convert templates in priority order:
1. `minimal.typ` (zero-dependency fallback) ← Phase 1
2. `paperback.typ` (highest-usage fiction template)
3. `chicago.typ` (highest-usage academic template)
4. `symphony.typ` (default template)
5. `memoir.typ`, `verse.typ` (literary)
6. `chronicle.typ`, `exhibit.typ` (editorial)
7. `operator.typ`, `matrix.typ` (technical)
8. `thesis.typ`, `international.typ` (academic)
9. `cinema.typ` (screenplay — needs Fountain filter port)
10. `avantgarde.typ`, `heirloom.typ` (niche)

Each template conversion involves:
- Document class → Typst page/text set rules
- Font declarations → `#set text(font: "...")`
- Chapter/heading formatting → Typst show rules for headings
- Headers/footers → `#set page(header: ..., footer: ...)`
- Spacing/indentation → `#set par(first-line-indent: ..., spacing: ...)`
- Special macros (scene breaks, drop caps) → Typst functions

### Phase 3: Pipeline Hardening (2-3 days)
**Goal:** Harden the new pipeline and clean up legacy code.

1. **Simplify compile-worker.js:**
   - Remove locale setup code (not needed)
   - Remove `luaotfload` emoji fallback injection (not needed)
   - Remove LaTeX preamble assembly (replaced by Typst template logic)
   - Simplify font resolution (Typst handles this natively)

2. **Simplify error handling:**
   - Replace 438-line `error-translator.js` with thin Typst error parser
   - Typst errors already include file, line, column, and human-readable messages

3. **Simplify Dockerfile:**
   - Remove TeX Live installation (~500MB saved)
   - Remove fontconfig setup
   - Remove `luaotfload-tool --update`
   - Add single Typst binary (~30MB)
   - Keep Pandoc (still used for Markdown → Typst conversion)
   - Keep Ghostscript (still used for PDF/X-1a)
   - Keep fonts (Typst uses them directly)

4. **Update grid-system.js:**
   - Output Typst page geometry instead of LaTeX `\geometry{}` commands
   - Same calculations, different output format

5. **Port watermark system:**
   - Replace TikZ watermark with Typst `place()` + `rotate()` + `text()`

6. **Port Lua filters to Typst:**
   - `heading-vmode.lua` → Not needed (Typst doesn't have this bug)
   - `drop-cap.lua` → Typst show rule for first paragraph
   - `fountain.lua` → Typst show rules or Pandoc Lua filter (still works with Typst output)
   - `table-safety.lua` → Not needed (Typst tables don't overflow the same way)

### Phase 4: Dual Engine Mode (1 day)
**Goal:** Allow A/B testing and graceful rollback.

1. **Add engine selection to compile request:**
   ```javascript
   // In compile-worker.js
   const engine = job.data.engine || 'typst'; // default to Typst
   // Falls back to 'lualatex' if Typst not available
   ```

2. **Keep LuaLaTeX as fallback** (temporary, during transition)
3. **Add engine field to compile response** (for debugging)
4. **Log engine choice** (for monitoring adoption)

### Phase 5: Cut Over & Cleanup (1 day)
**Goal:** Make Typst the sole engine and remove LuaLaTeX.

1. Remove LuaLaTeX from Dockerfile
2. Remove TeX Live packages
3. Remove all LaTeX-specific code paths
4. Remove old `.latex` template files
5. Remove `error-translator.js` (replace with simple Typst error parser)
6. Remove locale workaround code
7. Update CLAUDE.md documentation
8. Update CI/CD pipeline

---

## Template Conversion Guide

### Example: `paperback.latex` → `paperback.typ`

**LaTeX (before):**
```latex
\documentclass[11pt]{book}
\usepackage{fontspec}
\setmainfont{Alegreya Sans}
\usepackage{microtype}
\usepackage{setspace}
\setstretch{1.15}
\usepackage{geometry}
\usepackage{titlesec}
\titleformat{\chapter}[display]
  {\normalfont\huge\bfseries}
  {\chaptertitlename\ \thechapter}{60pt}{\Huge}
\usepackage{fancyhdr}
\pagestyle{fancy}
\fancyhead[LE]{\thepage}
\fancyhead[RO]{\thepage}
```

**Typst (after):**
```typst
#set page(
  margin: (/* from grid-system */),
  header: context {
    let page-num = counter(page).display()
    if calc.odd(here().page()) {
      align(right, page-num)
    } else {
      align(left, page-num)
    }
  },
)

#set text(
  font: "Alegreya Sans",
  size: 11pt,
  ligatures: true,
  kerning: true,
)

#set par(
  first-line-indent: 1.5em,
  spacing: 1.15em,
  justify: true,
)

#show heading.where(level: 1): it => {
  pagebreak(weak: true, to: "odd")
  v(4em)
  text(size: 2.5em, weight: "bold")[Chapter #counter(heading).display()]
  v(1em)
  text(size: 2em)[#it.body]
  v(2em)
}
```

### Key Mapping Reference

| LaTeX Concept | Typst Equivalent |
|---------------|-----------------|
| `\documentclass{book}` | Not needed (Typst is classless) |
| `\usepackage{fontspec}` | Built-in (`#set text(font: ...)`) |
| `\usepackage{microtype}` | Knuth-Plass built-in; no separate microtypography package yet |
| `\usepackage{geometry}` | `#set page(width: ..., height: ..., margin: ...)` |
| `\setmainfont{...}` | `#set text(font: "...")` |
| `\titleformat{\chapter}` | `#show heading.where(level: 1): ...` |
| `\fancyhead` / `\fancyfoot` | `#set page(header: ..., footer: ...)` |
| `\setstretch{1.15}` | `#set par(leading: 0.65em * 1.15)` |
| `\parindent` | `#set par(first-line-indent: ...)` |
| `\hyphenpenalty` | `#set text(hyphenate: true/false)` |
| `\widowpenalty` / `\clubpenalty` | `#set par(orphan-penalty: ..., widow-penalty: ...)` (Typst 0.13+) |
| `\begin{center}` | `#align(center)[...]` |
| `\pagebreak` | `#pagebreak()` |
| `\input{file}` | `#include "file.typ"` |
| `$for(header-includes)$` | Pandoc template variables work the same way |

---

## Risk Assessment

### Low Risk
- **Pandoc compatibility:** Pandoc has had native Typst support since v3.1.2 (2023). It's mature.
- **Font support:** Typst handles OTF/TTF natively. All bundled fonts will work.
- **Speed:** Every benchmark confirms dramatic speedup.
- **Frontend impact:** Zero — the frontend receives a PDF blob regardless of engine.

### Medium Risk
- **Template fidelity:** Some LaTeX templates use advanced features (lettrine, TikZ decorations) that need creative Typst equivalents. Not all will be pixel-identical.
- **Microtype:** Typst doesn't have a `microtype` equivalent for character protrusion and font expansion. Justified text is still excellent (Knuth-Plass) but won't have the marginal kerning that microtype provides. This is a minor visual difference.
- **RTL maturity:** Typst's RTL support is functional but still marked as "get in touch if you see bugs." The `international` template may need extra testing.
- **PDF/X-1a:** Ghostscript pipeline is unchanged, but should verify Typst PDFs pass the same Ghostscript conversion.

### Mitigations
- **Dual engine mode (Phase 4)** allows instant rollback to LuaLaTeX
- **Side-by-side comparison** during Phase 1 catches quality differences early
- **Template-by-template conversion** (Phase 2) limits blast radius
- **Keep LuaLaTeX in Docker** during transition (remove only in Phase 5)

---

## Expected Outcomes

### Performance
| Metric | Before (LuaLaTeX) | After (Typst) | Improvement |
|--------|-------------------|---------------|-------------|
| Compile time (short doc) | 8-15 seconds | 200-500ms | **30x faster** |
| Compile time (300-page book) | 30-45 seconds | 1-3 seconds | **15x faster** |
| Docker image size | ~2.1GB | ~400MB | **5x smaller** |
| Memory per compile | ~512MB limit | ~100MB typical | **5x less** |
| Concurrent compiles | 3 (BullMQ) | 10+ feasible | **3x more capacity** |

### Reliability
| Issue | Before | After |
|-------|--------|-------|
| Locale crashes | Frequent (7 fix commits) | **Impossible** (no locale deps) |
| Font discovery failures | Occasional | **Impossible** (native handling) |
| Titlesec horizontal mode | Fixed by Lua filter | **Impossible** (no titlesec) |
| Error message quality | 438-line translator needed | **Native readable errors** |
| Debug artifact capture | Complex 12-path system | **Simpler** (fewer failure modes) |

### Developer Experience
| Aspect | Before | After |
|--------|--------|-------|
| Template syntax | LaTeX (steep learning curve) | Typst (much simpler) |
| Error debugging | Parse cryptic TeX logs | Read clear Typst errors |
| Adding new templates | Complex LaTeX + preamble layers | Clean Typst show/set rules |
| Docker build time | ~10 min (TeX Live download) | ~2 min (single binary) |
| CI/CD pipeline | Slow (heavy image) | Fast (light image) |

### User Experience
| Aspect | Before | After |
|--------|--------|-------|
| Live preview latency | 8-45 seconds | **Under 1 second** |
| Compilation failures | Occasional cryptic errors | Rare, clear errors |
| Template quality | Excellent | Excellent (same algorithm) |
| New feature: PDF/UA | Not available | **Built-in accessibility** |

---

## Open Questions to Resolve in Phase 1

1. **Microtype gap:** Does the absence of character protrusion noticeably affect output quality for PagePerfect's use cases? (Test with real manuscripts)
2. **Pandoc Typst template variables:** Do all current Pandoc `-V` and `-M` flags map correctly to Typst template variables?
3. **Bibliography/citations:** Does `--citeproc` work correctly with Typst output? (Should be fine — citeproc runs before engine)
4. **Screenplay format (cinema template):** Can the Fountain Lua filter output Typst-compatible markup?
5. **PDF/X-1a compatibility:** Do Typst-generated PDFs pass Ghostscript PDF/X-1a conversion?
6. **Emoji rendering:** How does Typst handle emoji fallback fonts vs the current `luaotfload` approach?

---

## Summary

This migration replaces the most fragile, slowest component of PagePerfect (LuaLaTeX) with a modern alternative (Typst) that is:

- **27x faster** at compilation
- **Zero locale dependencies** (eliminates the #1 crash category)
- **Same typographic quality** (Knuth-Plass algorithm)
- **Already supported by Pandoc** (minimal code changes)
- **5x smaller Docker image**
- **Dramatically simpler** to maintain

The phased approach (5 phases over ~8-12 days) allows continuous validation, dual-engine rollback safety, and template-by-template conversion to minimize risk.

**The pivot is not a compromise — it's an upgrade.**

---
---

# PART 2: Beyond the Engine Swap — Strategic Suggestions

The Typst migration isn't just a bug fix. It unlocks an entirely new product architecture. Here are the additional pivots worth considering:

---

## Suggestion 1: Client-Side Preview via Typst WASM (Game-Changer)

### The Problem Today
```
User types → 3s debounce → POST /api/compile → BullMQ queue → LuaLaTeX (10-45s)
→ poll /status (500ms, 1s, 2s, 3s, 5s...) → fetch PDF blob → display in iframe
```
**Total latency: 15-60 seconds from keystroke to preview.**

### The Opportunity
Typst compiles to WebAssembly. The `typst.ts` project (by Myriad-Dreamin) provides a full WASM compilation environment that runs **entirely in the browser**. The `@brief-jetzt/wasm-typst` npm package wraps this for easy integration.

### The New Architecture
```
User types → 200ms debounce → Typst WASM compiles in-browser → SVG render → instant preview
                                    (no network, no server, no queue)

User clicks "Export PDF" → POST /api/compile → server-side Typst → full PDF
                                    (with watermarks, PDF/X-1a, metadata, fonts)
```

### What This Means
| Aspect | Before | After |
|--------|--------|-------|
| Preview latency | 15-60 seconds | **< 500ms** (no network) |
| Server load for preview | Every keystroke hits backend | **Zero** (client-side) |
| Offline preview | Impossible | **Works offline** |
| BullMQ needed for preview | Yes (3 concurrent workers) | **No** (server only for export) |
| Network dependency | Every preview needs internet | **Only export needs internet** |

### How It Works
1. Bundle Typst WASM (~5MB gzipped) with the Next.js frontend
2. Load fonts into the WASM environment (subset or full — user's template fonts)
3. On every keystroke (with 200ms debounce): Convert Markdown → Typst markup (lightweight client-side conversion) → Typst WASM → SVG output
4. Render SVG in a `<div>` instead of PDF in an `<iframe>` (faster, lighter, scrollable)
5. Server compilation only for final PDF export (with full fonts, watermarks, metadata, PDF/X-1a)

### Impact on Infrastructure
- **BullMQ** becomes export-only (90% fewer jobs)
- **Coolify backend** handles dramatically less load
- **DigitalOcean costs** drop significantly
- **User experience** transforms from "wait for compile" to "instant preview like Google Docs"

---

## Suggestion 2: SVG Preview Instead of PDF-in-iFrame

### The Problem
Currently, the preview renders a PDF blob inside an `<iframe>` with `#toolbar=0&navpanes=0`. This is:
- Heavy (full PDF rendering engine in browser)
- Not scrollable like native content
- Can't be annotated or interacted with
- Loses quality at different zoom levels (rasterized)

### The Opportunity
Typst natively renders to SVG. SVG is:
- Vector (crisp at any zoom)
- Lightweight
- Embeddable directly in the DOM
- Scrollable, selectable, interactive
- Can be styled with CSS (dark mode preview!)

### Architecture
```
Typst WASM → SVG pages → <div> with virtual scroll → crisp preview at any zoom
```

Benefits:
- **Dark mode preview** — invert SVG colors with CSS for a dark reading experience
- **Text selection** — users can select text in the preview (impossible with PDF iframe)
- **Annotations** — overlay comments/highlights on the SVG
- **Zoom** — native browser zoom, no quality loss
- **Page navigation** — virtual scroll through SVG pages, no PDF viewer overhead

---

## Suggestion 3: Incremental Compilation (Only Recompile What Changed)

### The Research
Typst's thesis, *"Fast Typesetting with Incremental Compilation"*, demonstrates that incremental compilation provides **4.5x to 91x speedup** over full recompilation, and in the best case, **up to 9,895x faster than LaTeX** for single-edit recompiles.

### How It Works
Typst's `comemo` system tracks which functions depend on which inputs. When the user changes paragraph 47 of chapter 3, only the layout of that page (and subsequent pages if it causes reflow) needs to be recomputed. Headers, title pages, and other chapters are cached.

### For PagePerfect
- First compile: ~200ms (fast)
- Subsequent edits: **< 50ms** (incremental)
- This enables true **keystroke-by-keystroke preview** — not debounced, not queued, just instant

### Implementation
The `typst.ts` WASM module supports incremental compilation natively. The renderer also supports **incremental updates** — only changed SVG pages are re-rendered, not the entire document.

---

## Suggestion 4: Eliminate the Polling Architecture Entirely

### Current Flow (7 steps, 3 network requests)
```
1. Frontend: POST /api/compile (send manuscript)
2. Backend: Enqueue to BullMQ, return jobId
3. Frontend: Poll GET /api/compile/status/{jobId} (exponential backoff, up to 60 polls)
4. Backend: Check Redis for job status
5. Frontend: When "completed", GET /api/compile/result/{jobId}
6. Backend: Stream PDF blob
7. Frontend: Create blob URL, display in iframe
```

### New Flow with Client-Side Preview (1 step, 0 network requests)
```
1. Frontend: Typst WASM compiles → SVG → display
```

### For Final Export (2 steps, 1 network request)
```
1. Frontend: POST /api/export (send manuscript + options)
2. Backend: Typst compile → PDF → apply watermark/PDF-X/metadata → stream back
```

**No more BullMQ for preview. No more polling. No more status endpoints. No more abort controllers. No more race conditions between compiles.**

The entire `useCompileQueue.ts` hook (380+ lines of polling, debouncing, abort logic, generation tracking, error retry) gets replaced with a simple `useTypstPreview.ts` hook that calls the WASM compiler.

---

## Suggestion 5: Template Marketplace (Business Opportunity)

### Why This Becomes Possible
LaTeX templates are notoriously difficult to write. They require deep knowledge of `\makeatletter`, `\renewcommand`, package interactions, and TeX internals. Only LaTeX experts can create them.

Typst templates are **dramatically simpler**. A complete book template is 30-50 lines of readable code (vs 200+ lines of LaTeX). This opens the door to:

### Template Marketplace
- **Designer-friendly:** Graphic designers who know CSS can learn Typst in hours
- **Community templates:** Users submit and share templates
- **Premium templates:** Sell designer templates as part of Studio tier
- **Template preview:** Since Typst compiles in < 1 second, users can browse templates with live preview of their own manuscript

### Revenue Impact
- New pricing lever: Premium templates only available on Publisher/Studio
- Template packs: "Romance Novel Collection" (5 templates, $9.99)
- Custom template commissions: High-end service for publishers

---

## Suggestion 6: PDF/UA Accessibility as a Feature

### The Opportunity
Typst supports **PDF/UA-1** (Universal Accessibility) output. LuaLaTeX does not have native PDF/UA support.

PDF/UA is increasingly required by:
- Government publications (Section 508, EU accessibility directive)
- Academic publishers (open access mandates)
- Large publishers (Penguin Random House, HarperCollins accessibility policies)

### For PagePerfect
- **Free differentiator:** No competitor in the manuscript-to-PDF space offers one-click PDF/UA
- **Enterprise customers:** Publishers and institutions pay premium for accessibility compliance
- **SEO/marketing:** "The only manuscript tool with built-in accessibility" — strong positioning

### Implementation
Add a checkbox in the export dialog: "Generate accessible PDF (PDF/UA)" → Typst flag → tagged PDF output with proper heading structure, alt text, reading order.

---

## Suggestion 7: Multi-Output from Single Source

### Currently
PagePerfect generates PDF only (plus EPUB mentioned in LaunchOverlay).

### With Typst
Since Typst renders to an intermediate vector format, and the `typst.ts` renderer supports multiple output modes, you can offer:

- **PDF** — print-ready (current offering)
- **PDF/UA** — accessible version
- **PDF/X-1a** — offset printing (current Ghostscript pipeline, unchanged)
- **SVG** — web-embeddable version of each page
- **PNG** — social media / marketing images (cover page, sample spreads)
- **HTML** — web-readable version (via SVG embedding or Pandoc HTML output)

All from the same manuscript, same template, same compilation.

### UX: Export Panel
```
┌─ Export Format ──────────────────┐
│  ☑ PDF (print-ready)            │
│  ☐ PDF/UA (accessible)         │
│  ☐ PDF/X-1a (offset printing)  │
│  ☐ EPUB (e-reader)             │
│  ☐ PNG spreads (marketing)     │
│  ☐ Web preview (shareable link)│
└──────────────────────────────────┘
```

---

## Suggestion 8: Shareable Preview Links (Growth Feature)

### The Idea
Since Typst WASM runs client-side, you can generate a **shareable preview URL** that renders the manuscript in the recipient's browser without any server-side compilation.

### How It Works
1. User clicks "Share Preview"
2. Frontend encodes manuscript + template choice into a compressed URL parameter (or short-lived storage)
3. Recipient opens link → Typst WASM loads → renders SVG → beautiful preview
4. No server involved, no compilation queue, instant load

### Use Cases
- Authors sharing drafts with beta readers
- Publishers reviewing submissions
- Designers showing template options to clients
- Social media previews (Open Graph image generated from first page)

---

## Suggestion 9: Real-Time Collaborative Editing (Future)

### Why Typst Enables This
With server-side LuaLaTeX, every edit triggers a 45-second compile. Collaboration is impossible because:
- Edits conflict in the queue
- Preview is always stale
- No operational transform (OT) or CRDT for the compilation

With Typst WASM:
- Each collaborator compiles locally (no server bottleneck)
- Operational transform on the Markdown source (TipTap already supports Yjs collaboration)
- Each user sees their own instant preview
- Only final export hits the server

This puts PagePerfect in the same category as Google Docs / Overleaf — but with better typography.

---

## Priority Ranking

| # | Suggestion | Impact | Effort | Priority |
|---|-----------|--------|--------|----------|
| 1 | Client-side WASM preview | Transformative UX | Medium | **P0 — do with migration** |
| 2 | SVG preview (not PDF iframe) | Better UX | Low | **P0 — do with WASM** |
| 3 | Incremental compilation | Instant edits | Low (built-in) | **P0 — free with Typst** |
| 4 | Eliminate polling architecture | Simpler codebase | Medium | **P1 — after WASM works** |
| 5 | Template marketplace | Revenue growth | Medium | **P1 — after templates stable** |
| 6 | PDF/UA accessibility | Differentiator | Low | **P1 — Typst flag** |
| 7 | Multi-output formats | Feature richness | Medium | **P2 — after core stable** |
| 8 | Shareable preview links | Growth/viral | Medium | **P2 — after WASM stable** |
| 9 | Real-time collaboration | Category change | High | **P3 — future vision** |

---

## Revised Architecture Vision

```
┌─────────────────────────────────────────────────────────────────┐
│                         BROWSER                                  │
│                                                                  │
│  ┌─────────────┐    ┌──────────────┐    ┌────────────────────┐  │
│  │  TipTap     │───▸│ Typst WASM   │───▸│  SVG Preview       │  │
│  │  Editor     │    │ (incremental)│    │  (instant, crisp)  │  │
│  │  (Markdown) │    │  < 50ms      │    │  (scrollable)      │  │
│  └─────────────┘    └──────────────┘    └────────────────────┘  │
│         │                                                        │
│         │  "Export PDF"                                           │
│         ▼                                                        │
│  ┌─────────────┐                                                 │
│  │ POST /export│─── single request, no polling ──────────┐      │
│  └─────────────┘                                         │      │
└──────────────────────────────────────────────────────────│──────┘
                                                           │
┌──────────────────────────────────────────────────────────│──────┐
│                     SERVER (Coolify/Docker)               │      │
│                                                           ▼      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Typst CLI compile (server-side, with full fonts)         │   │
│  │  + Watermark injection (Typst place())                    │   │
│  │  + PDF metadata (buildId, provenance)                     │   │
│  │  + PDF/X-1a conversion (Ghostscript, if needed)           │   │
│  │  + PDF/UA tagging (if requested)                          │   │
│  │  → Stream PDF back to client                              │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  No BullMQ for preview. No polling. No status endpoints.         │
│  Queue only needed if export volume is high.                     │
└──────────────────────────────────────────────────────────────────┘
```

### What Gets Deleted
- `useCompileQueue.ts` (380 lines of polling/abort logic) → replaced by `useTypstPreview.ts` (~50 lines)
- `error-translator.js` (438 lines) → replaced by thin Typst error parser (~30 lines)
- `compile-worker.js` locale code (~100 lines) → deleted entirely
- `luaotfload` emoji fallback injection (~60 lines) → deleted entirely
- 9-layer LaTeX preamble assembly (~200 lines) → replaced by Typst template include
- `heading-vmode.lua` filter → deleted (bug doesn't exist in Typst)
- `table-safety.lua` filter → deleted (Typst tables handle multi-column natively)
- BullMQ preview jobs → eliminated
- Status polling endpoints → eliminated for preview

**Estimated code reduction: ~1,200 lines deleted, ~200 lines added.**

---

## Final Thought

The LuaLaTeX compilation problems aren't a bug — they're a signal. The right response isn't another locale fix or another error translator patch. It's recognizing that the entire compilation paradigm has shifted.

Typst + WASM doesn't just fix the compilation pipeline. It transforms PagePerfect from a **server-dependent document processor** into a **client-first typesetting application** with server-side export. That's a fundamentally different — and better — product.
