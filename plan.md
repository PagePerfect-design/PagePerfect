# Plan: Fix Missing Ingestion Stage

## Problem

When a user clicks "Open Editor," they land directly in the workspace (ControlStrip + PreviewPane) with no ingestion stage. Three root causes:

1. **IngestZone is embedded in the right panel**, not a full-screen gate. It only occupies the preview area — the left sidebar is simply hidden.
2. **IndexedDB auto-loads** the previous manuscript on mount (`CompileShell.tsx:125-128`), setting `hasManuscript = true` before the user ever sees IngestZone. Returning users never see it.
3. **No way back**: unauthenticated users have no "New Manuscript" button to clear state and return to ingestion.

## Solution: Full-Screen Ingestion Gate

Make IngestZone fill the **entire workspace area** (not just the right panel) when `hasManuscript` is false. Add a "New" action in the TopBar so users can return to it.

## Changes

### 1. `CompileShell.tsx` — Promote IngestZone to full-screen gate

**Current** (lines 417-480): IngestZone renders inside the `flex-1` right panel div, alongside the conditionally-hidden ControlStrip.

**Change**: Move IngestZone out of the workspace split. When `!hasManuscript`, render IngestZone as the sole child of the `flex-1` area, filling the entire space below the TopBar.

```
Before:
  TopBar
  ├── ControlStrip (hidden when !hasManuscript)
  └── Preview area (flex-1)
      ├── PreviewPane (when hasManuscript)
      └── IngestZone (when !hasManuscript)  <- buried in right panel
  StatusBar (hidden when !hasManuscript)

After:
  TopBar  (always visible)
  ├── IngestZone (full-width, full-height, when !hasManuscript)  <- full-screen gate
  └── Workspace (when hasManuscript)
      ├── ControlStrip
      └── PreviewPane
  StatusBar (when hasManuscript)
```

Concretely: wrap the main workspace div in a `hasManuscript` conditional. When false, render `<IngestZone />` directly as the sole child filling the flex-1 area.

### 2. `CompileShell.tsx` — Add "New" button in TopBar for all users

**Current** (lines 378-413): The right side of the TopBar has "Manuscripts" (auth-only), "Compile", and "Download PDF". No way for unauthenticated users to clear state.

**Change**: Add a "New" button visible when `hasManuscript` is true, for all users. Calls `handleNewManuscript()` (already exists at line 275-280). Place it before the "Manuscripts" button.

### 3. `IngestZone.tsx` — No changes needed

Already uses `h-full w-full` and centers content. Will naturally fill whatever parent it's given.

## Files Modified

| File | Change |
|------|--------|
| `frontend/src/app/app/CompileShell.tsx` | Move IngestZone out of workspace split into full-screen gate; add "New" button in TopBar |

## What This Does NOT Change

- No new components, files, or routes
- No changes to IndexedDB persistence logic
- No changes to IngestZone's visual design
- No changes to ControlStrip, PreviewPane, or StatusBar
- No changes to the compile flow
