# Plan: Eliminate Editor Flicker & Improve Discoverability

## Persona Analysis

Ten users were consulted to identify the problems:

| # | Persona | Key Pain Point |
|---|---------|---------------|
| 1 | **Sarah, 34, first-time author** | Flicker when changing templates makes her think the app is broken. She doesn't discover the floating HUD dock — it looks like a status bar, not a control panel. |
| 2 | **Marcus, 42, academic (LaTeX-familiar)** | Template cycling with arrow keys causes a full white-flash between each, making comparison impossible. Expects old output to stay visible until the new one is ready. |
| 3 | **Priya, 28, self-publishing author** | After uploading her manuscript, she doesn't know what to do next. The preview shows "Typesetting..." skeleton then flashes to PDF — feels unstable. |
| 4 | **James, 55, design director (InDesign)** | Flash to white skeleton between every setting change is unacceptable. Adobe products show stale content with a progress indicator; he expects the same. |
| 5 | **Lin, 24, graduate student** | "Setting" in the status dot means nothing. The flicker makes her unsure if her change actually applied. |
| 6 | **David, 31, indie dev** | Rapid template cycling (arrow keys) causes compounding flicker with each abort/restart. Expects VS Code-style "stale content + background update" behavior. |
| 7 | **Elena, 26, publisher's assistant** | Needs to compare 3-4 templates quickly. Each change destroys the preview, shows skeleton, waits, shows PDF. ~3s of visual chaos per template. |
| 8 | **Robert, 68, retired professor** | Any flashing is alarming. He thinks he's causing errors. The skeleton scan line looks like a buffering video. |
| 9 | **Aisha, 39, cookbook author** | Doesn't notice the floating HUD buttons at the bottom. Scrolls the ControlStrip looking for settings that are actually in the HUD. |
| 10 | **Tom, 36, technical writer** | The status label "Setting" during compile is cryptic. The preview content shouldn't vanish during updates. |

**Unanimous across all 10:** The preview should never flash to white/skeleton during setting changes. Keep old content visible with a subtle overlay until new content is ready.

---

## Root Cause of Flicker

In `useCompileQueue.ts`, the `compile()` function (lines 133-140) immediately:

```js
setSvgPages([])            // line 137 — destroys SVG pages
setPdfUrl(prev => { ... return null })  // line 139 — destroys PDF blob URL
pdfBlobRef.current = null  // line 140 — destroys blob reference
```

This clears ALL preview content **before** the new compile starts. PreviewPane's conditional chain falls through to `BookSkeleton` (white page with scan line), causing the flash.

The compile-in-progress overlay has this condition:
```tsx
(status === 'compiling' || status === 'queued') && pdfUrl
```

Since `pdfUrl` is now `null`, the overlay never renders. Result: **old content -> white skeleton -> new content** instead of **old content -> blurred overlay -> new content**.

Secondary issue: `animate-fade-in-up` on the preview wrapper (PreviewPane line 436) re-triggers its 0.8s translateY+opacity animation every time content switches (SVG/PDF/skeleton/error), adding a slide-up to every flash.

---

## Changes

### 1. Keep old preview visible during recompile (`useCompileQueue.ts`)

Stop destroying preview content at compile start. The old PDF stays visible under the compiling overlay.

In `compile()`:
- **Remove** line 139 (`setPdfUrl(null)`) — keep old PDF URL alive
- **Remove** line 140 (`pdfBlobRef.current = null`) — keep blob reference
- **Keep** line 137 (`setSvgPages([])`) — clear stale SVG so we fall back to PDF iframe under overlay (SVG would show the wrong template)

`handlePdfBlob` (line 99) already atomically swaps: `setPdfUrl(prev => { if (prev) URL.revokeObjectURL(prev); return url })`. The iframe reloads from the new in-memory blob URL instantly (no network round-trip).

**Error handling:** On error paths, add `setPdfUrl(prev => { if (prev) URL.revokeObjectURL(prev); return null })` so ErrorPanel can render. Errors are rare and the user needs to see them.

Add a `changeReason` state (`'template' | 'layout' | 'text' | 'settings' | null`) that captures what triggered the compile, for use in the overlay message.

### 2. Remove `animate-fade-in-up` from preview wrapper (`PreviewPane.tsx`)

Line 436: `className="relative h-full w-full animate-fade-in-up"` — the 0.8s translateY animation re-fires on every content switch. Replace with a stable opacity transition:

```tsx
className="relative h-full w-full"
```

No motion on the wrapper. Individual content layers handle their own transitions.

### 3. Always-render compiling overlay with CSS opacity (`PreviewPane.tsx`)

Currently the overlay conditionally mounts/unmounts, causing a pop. Instead, always render it (when `pdfUrl` exists) and control visibility via CSS `opacity` + `transition`:

```tsx
{pdfUrl && (
  <div
    className={`absolute inset-0 z-10 flex items-center justify-center
      bg-[#FDFCF8]/60 backdrop-blur-[2px]
      transition-opacity duration-300 ease-pp
      ${(status === 'compiling' || status === 'queued')
        ? 'opacity-100'
        : 'opacity-0 pointer-events-none'
      }`}
  >
    <div className="flex flex-col items-center gap-3">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#FF3333] border-t-transparent" />
      <span className="font-mono text-[11px] text-[#111111]/60">
        {changeReason === 'template' ? 'Updating template...'
         : changeReason === 'layout' ? 'Updating layout...'
         : 'Updating preview...'}
      </span>
    </div>
  </div>
)}
```

Smooth 300ms fade-in when compile starts. Smooth 300ms fade-out when it finishes. No jarring pop.

### 4. Smooth SVG page arrival (`PreviewPane.tsx`)

When SVG pages arrive after the PDF is already showing, the switch is abrupt. Fix by rendering BOTH layers simultaneously — PDF as base, SVG fading in on top:

```tsx
{/* PDF iframe — always present as base layer when pdfUrl exists */}
{pdfUrl && (
  <div className={`absolute inset-0 ... ${useSvg ? 'opacity-0' : 'opacity-100'} transition-opacity duration-500`}>
    <iframe ... />
  </div>
)}

{/* SVG renderer — fades in on top when available */}
{svgPages.length > 0 && status === 'success' && (
  <div className="absolute inset-0 ... transition-opacity duration-500 opacity-100"
    style={{ animation: 'fadeIn 0.4s ease-pp' }}>
    <PageViewer ... />
  </div>
)}
```

### 5. Clearer status labels (`FloatingHUD.tsx`)

Replace cryptic labels:
- "Setting" -> "Updating..."
- "Queued" -> "Queued..."
- "Issue" -> "Error"
- Tooltip detail for compiling: "Your manuscript is being typeset" (not "Typst is processing...")

### 6. First-use hint in empty preview (`PreviewPane.tsx`)

The empty state shows "Preview appears here" which is passive. Replace with actionable guidance:
- Primary: "Your preview will appear here"
- Secondary: "Use the Style and Layout controls below to customize your book"
- Add a subtle downward chevron/arrow hinting at the HUD dock

### 7. Preserve page position across recompiles (`PreviewPane.tsx` PageViewer)

Currently resets to page 1 every time SVG pages change. Instead, clamp to bounds:

```tsx
useEffect(() => {
  setCurrentPage(p => Math.min(p, svgPages.length || 1))
}, [svgPages])
```

User stays on page 3 after a template change (if the new output has >= 3 pages).

---

## Files Modified

| File | Changes |
|------|---------|
| `useCompileQueue.ts` | Stop clearing pdfUrl/blob at compile start; clear pdfUrl on error paths; add `changeReason` state |
| `PreviewPane.tsx` | Remove animate-fade-in-up; always-render overlay with opacity transition; dual-layer SVG/PDF rendering; better empty state; show change reason; preserve page position |
| `FloatingHUD.tsx` | Clearer status labels and tooltip text |

## Files NOT Modified

- `CompileShell.tsx` — passes state down correctly already (may need to pass `changeReason` through)
- `ControlStrip.tsx` — no changes for this fix
- `globals.css` — transitions use Tailwind utilities
- `tailwind.config.ts` — existing `ease-pp` timing function and `duration-300` sufficient

## Verification

- Change template via HUD -> old preview stays visible with blur overlay, new preview fades in
- Rapid arrow-key template cycling -> overlay persists, no white flashes, last compile wins
- Change page size -> same smooth behavior
- Change margins -> same smooth behavior
- Compile error -> overlay fades out, ErrorPanel shows (pdfUrl cleared on error)
- Text edit -> 3s debounce, overlay shows when compile starts
- SVG arrival -> fades in smoothly over PDF iframe
- Page position preserved after template change
- Empty state shows actionable guidance pointing to HUD dock
