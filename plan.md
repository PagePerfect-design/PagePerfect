# Plan: Fix PDF Preview — Eliminate File-Serving Fragility

## Problem

The SVG page preview is broken. The pipeline has **three compounding fragility
points** that produce persistent 404s:

1. **Filename padding mismatch** — Typst's `{0p}` pads to the width of the
   max page number (3 pages → `page-1.svg`, not `page-01.svg`). The serving
   route used `padStart(2, '0')`. Fixed in git, not deployed.
2. **Race condition** — BullMQ marks "completed" before the `on('completed')`
   handler copies SVGs. The status endpoint's fallback path persists the PDF
   but forgets the SVGs.
3. **Ephemeral filesystem** — SVGs live in `/tmp/ppresults/`. Sweepers,
   restarts, or disk pressure delete them independently of the result metadata.

The iframe fallback works but defeats the purpose — the whole point of Typst
is native SVG output for a sharp, controllable preview with page navigation.

## What Top-Tier Companies Do

| Product | Strategy |
|---------|----------|
| **typst.app** | Compile to vector IR on server → render client-side via WASM (`typst.ts`) |
| **Overleaf** | Compile to PDF on server → render client-side via PDF.js on `<canvas>` |
| **Figma** | Server-side render → stream tiles to client via WebGL |

The common pattern: **never serve raw files from an ephemeral temp directory
via convention-dependent filename lookups.** Either embed the data in the
response, stream through a reliable pipeline, or render client-side.

## Strategy: Embed SVG Pages in the Compile Result

Read SVG content into memory and deliver it through the existing job result
channel. This eliminates filename conventions, file persistence, race
conditions, and the separate per-page HTTP endpoint entirely.

```
CURRENT (fragile):
  Worker → typst SVG → files on disk → copy to /tmp/ppresults/ → HTTP serve per-page → <img src>
  Failure points: filename convention, copy race, file existence, auth per request

PROPOSED (robust):
  Worker → typst SVG → read strings into result → storeJobResult → memory/Redis
  Frontend → GET /api/compile/pages/{id} → JSON array of SVG strings → render inline
  Failure points: none new — same channel as compile status (already works)
```

## Implementation Steps

### Step 1: compile-worker.js — Read SVGs into result object

After the existing SVG generation step (~line 604), read each file into a
string array and return it with the result:

```js
const svgPages = [];
if (svgPageCount > 0) {
  const sorted = files.sort((a, b) =>
    parseInt(a.match(/(\d+)/)[1], 10) - parseInt(b.match(/(\d+)/)[1], 10)
  );
  // Cap at 30 pages to keep memory/Redis reasonable
  for (const f of sorted.slice(0, 30)) {
    svgPages.push(fs.readFileSync(path.join(tmpBase, f), 'utf-8'));
  }
}
// Return: { ..., svgPages, svgPageCount }
```

### Step 2: routes/compile.js — New bulk SVG endpoint

Add `GET /api/compile/pages/:id` that returns all SVG pages in one request.
Same auth as the existing result endpoint:

```js
router.get('/api/compile/pages/:id', async (req, res) => {
  const result = await ctx.getJobResult(req.params.id);
  // ... auth check (same as /api/compile/result/:id) ...
  res.json({ pages: result.svgPages || [], total: result.svgPageCount || 0 });
});
```

### Step 3: useCompileQueue.ts — Fetch SVG pages after compile completes

After status returns `completed` with `svgPageCount > 0`, fetch the bulk
SVG array. Store in new state `svgPages: string[]`:

```ts
if (statusData.svgPageCount > 0) {
  const svgResp = await fetch(`/api/compile/pages/${jobId}`, {
    headers: resultHeaders, signal: controller.signal,
  });
  if (svgResp.ok) {
    const { pages } = await svgResp.json();
    setSvgPages(pages);
  }
}
```

### Step 4: PreviewPane.tsx — Render SVGs inline from memory

Replace `<img src="/api/compile/page/...">` with inline SVG:

```tsx
function SvgPage({ svg, className }: { svg: string; className?: string }) {
  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
```

Benefits:
- **Zero network requests per page** — all SVGs already in memory
- **Instant page navigation** — no loading delay when flipping
- **True vector quality** at any zoom level
- **DOM access** for future text selection / annotations

### Step 5: Clean up old file-serving pipeline

- Remove SVG file copy logic from `on('completed')` handler in index.js
- Remove SVG file copy from the status-endpoint race condition path
- Remove or deprecate `GET /api/compile/page/:id/:page` endpoint
- Remove `svgFailed` iframe fallback state (no longer needed — if
  `svgPages` is empty, fall back to iframe; if populated, render inline)

## Size Budget

| Pages | Raw SVG | Gzipped (auto via Express compression) |
|-------|---------|---------------------------------------|
| 3     | ~240 KB | ~24 KB                                |
| 10    | ~800 KB | ~80 KB                                |
| 30    | ~2.4 MB | ~240 KB                               |

Cap at 30 embedded pages. Documents >30 pages get the first 30 as SVG
(covers all preview needs) and the full PDF blob for download. These
compressed sizes are smaller than the PDF itself.

## Files Modified

| File | Change |
|------|--------|
| `backend/compile-worker.js` | Read SVG files into `svgPages` string array in result |
| `backend/routes/compile.js` | Add `GET /api/compile/pages/:id` endpoint; remove old per-page endpoint |
| `backend/index.js` | Remove SVG file copy from `on('completed')` and cleanup |
| `frontend/src/app/app/useCompileQueue.ts` | Fetch `/api/compile/pages/{id}` after compile; new `svgPages` state |
| `frontend/src/app/app/PreviewPane.tsx` | Render from `svgPages[]` strings instead of `<img src>` |
| `frontend/src/app/app/CompileShell.tsx` | Pass `svgPages` to PreviewPane |
| `frontend/src/app/app/editor-types.ts` | (Possibly) update CompileQuality or add svgPages type |

## What This Does NOT Do

- No new npm dependencies
- No WASM integration (that's the aspirational typst.ts path for later)
- No changes to the PDF compile pipeline or download flow
- No changes to the Typst template system
- No changes to auth, payments, or any other subsystem
