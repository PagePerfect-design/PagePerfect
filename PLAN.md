# PagePerfect Editor UX/UI Redesign Plan

## Executive Summary

Replace the current 3-stage gauntlet (Portal → Design → Launch) with a **single-screen workspace** where the book is always visible. Inspired by Vellum/Atticus's proven three-panel pattern and Apple's progressive disclosure, but adapted to PagePerfect's compile-based workflow.

---

## Current Problems (from research + code audit)

1. **Three stages force a linear funnel** — users must "complete" Portal before seeing Design, and can't export without switching to Launch. Both Vellum and Atticus have zero stage transitions.
2. **FloatingHUD dock uses novel interaction patterns** — fan menus popping UP from a bottom dock are unfamiliar. Users must discover them.
3. **Six overlay surfaces compete** — EditorOverlay, PublishingSystems, FloatingHUD fans, ShortcutLegend, ManuscriptBrowser, LaunchOverlay all have independent z-index, animations, and dismiss behaviors.
4. **Preview gets crowded out** — with editor (50%) + systems panel (380px), the PDF preview shrinks to unusable widths.
5. **Portal demands analysis before the user cares** — genre detection, template recommendation, platform selection all happen before the user has seen a single formatted page.
6. **Export is a full-screen takeover** — 665-line LaunchOverlay with two-column grid, pre-flight terminal, quality gates, and contract acceptance is intimidating.

---

## Design Principles

1. **The book is always visible.** The PDF preview is the anchor. Nothing covers it completely.
2. **Progressive disclosure.** Start simple: drop your manuscript, see a book. Reveal controls as the user explores.
3. **Familiar patterns only.** Sidebar for tools, toolbar for actions, inline panels. No custom interaction patterns (no fan menus, no floating docks).
4. **One screen, zero stage transitions.** Portal is an empty state. Design is the workspace. Export is a sidebar action — not a new page.
5. **Speed over ceremony.** Auto-compile on every change. Skip the analysis spinner. Show the book within seconds.

---

## New Architecture: Single-Screen Workspace

### Layout

```
┌──────────────────────────────────────────────────────────────────┐
│ TopBar: [← Back]  Title  [word count]  [cloud]   [Compile] [Export] │
├──────────────────────┬───────────────────────────────────────────┤
│                      │                                           │
│   Left Sidebar       │          PDF Preview                      │
│   (collapsible)      │          (always centered)                │
│                      │                                           │
│   ┌──────────────┐   │                                           │
│   │ Ingest Zone  │   │        ┌─────────────────────────┐        │
│   │ (empty state)│   │        │                         │        │
│   └──────────────┘   │        │                         │        │
│                      │        │    Your Book            │        │
│   ┌──────────────┐   │        │                         │        │
│   │ Template     │   │        │                         │        │
│   │ Picker       │   │        │                         │        │
│   └──────────────┘   │        │                         │        │
│                      │        │                         │        │
│   ┌──────────────┐   │        └─────────────────────────┘        │
│   │ Page & Layout│   │                                           │
│   └──────────────┘   │          [Quality Badge]                  │
│                      │          [Status: Ready / Typesetting]    │
│   ┌──────────────┐   │                                           │
│   │ Settings     │   │                                           │
│   └──────────────┘   │                                           │
│                      │                                           │
├──────────────────────┴───────────────────────────────────────────┤
│ Status bar: engine · grade · build-id                            │
└──────────────────────────────────────────────────────────────────┘
```

### Empty State (replaces Portal)

When no manuscript is loaded, the preview area shows a large ingest zone:

```
┌──────────────────────────────────────────────────────────────────┐
│ TopBar: [← Home]                                    [Help]       │
├──────────────────────┬───────────────────────────────────────────┤
│                      │                                           │
│   Sidebar shows:     │     ┌─────────────────────────────┐      │
│   - "Getting Started"│     │                             │      │
│   - Template browser │     │    Drop your manuscript     │      │
│   - Sample docs      │     │    .md · .txt · .docx       │      │
│                      │     │                             │      │
│                      │     │    [Browse Files] [Paste]   │      │
│                      │     │                             │      │
│                      │     │    or try a sample:         │      │
│                      │     │    Fiction · Academic · ...  │      │
│                      │     │                             │      │
│                      │     └─────────────────────────────┘      │
│                      │                                           │
└──────────────────────┴───────────────────────────────────────────┘
```

Once a manuscript is dropped:
1. Preview area immediately shows BookSkeleton (loading state)
2. Auto-compile fires with default template
3. Sidebar populates with template/layout/settings sections
4. Genre detection runs in background — sidebar highlights recommended template
5. User sees their formatted book within 5-10 seconds of dropping the file

**No analysis modal. No "Start designing" button. No platform selection gatekeep.**

### Sidebar Sections (accordion)

The left sidebar replaces FloatingHUD, EditorOverlay, and part of PortalStage:

**Section 1: Manuscript** (expandable)
- Markdown editor (textarea, same as current EditorOverlay but inline in sidebar)
- Image upload area
- "My Manuscripts" list (for logged-in users)
- Word count + chapter count inline

**Section 2: Template** (expandable, default open)
- Template grid (2 columns, scrollable)
- Genre filter tabs (All, Fiction, Nonfiction, Specialist)
- "Rec" badge on auto-detected template
- Heading variant toggle (Classic / Modern / Bold)
- Active template's name + font shown at top of section

**Section 3: Page & Layout** (expandable)
- Page size grid (6 free sizes shown, expandable for more)
- Margin preset row (7 presets)
- Tier lock icons on gated sizes

**Section 4: Settings** (expandable)
- Compile mode toggle (Fast / Full)
- Standard mode checkbox
- Custom font upload (Studio tier)

**Section 5: Export** (expandable)
- Platform selector (KDP / IngramSpark)
- Paper stock (White / Cream)
- Pre-flight results (inline, not a separate terminal)
- Quality warnings (inline)
- Download button (primary red CTA)
- Format toggle (PDF / EPUB)

**Section 6: Analysis** (expandable, replaces PublishingSystems panel)
- "Run Analysis" button
- Compact results: typography grade, QA grade, lint issues
- Expandable details per system

### TopBar (simplified)

```
[← Back]  [Title input]  [word count]  [cloud sync]    [Compile]  [Export ↓]
```

- Remove: Edit toggle, Systems toggle, status dot (moved to status bar)
- Keep: Title, word count, cloud sync, compile button, export button
- Export button opens/scrolls to Export section in sidebar
- Compile button forces manual recompile

### Status Bar (new, replaces HUD dock status)

Thin bar at bottom of screen:
```
LuaTeX · Grade: A · Build: abc123def · Ready
```

Shows engine, quality grade, build ID, and compile status. Always visible, never interactive.

### Export Flow (simplified)

Instead of a full-screen LaunchOverlay:

1. User clicks "Export" in TopBar → sidebar scrolls to Export section
2. Export section shows platform choice + paper stock inline
3. Pre-flight runs automatically when Export section opens
4. Results appear inline (green checks, amber warnings, red failures)
5. Download button at bottom of section
6. Quality warnings appear inline above download button
7. Grade D still requires acknowledgment checkbox (inline, not modal)
8. Free tier: "Download Preview (Watermarked)" with pricing link

**No full-screen takeover. No contract modal. No two-column grid.**

---

## Component Changes

### Files to REWRITE (significant changes):

| File | Lines | Action |
|------|-------|--------|
| `CompileShell.tsx` | 724 → ~400 | Remove stage machine, layer cake rendering. Single layout: sidebar + preview. |
| `FloatingHUD.tsx` | 505 → DELETE | Replace with sidebar sections. All functionality moves to sidebar. |
| `LaunchOverlay.tsx` | 665 → DELETE | Replace with Export section in sidebar. Pre-flight + download inline. |
| `PortalStage.tsx` | 570 → DELETE | Replace with empty state in preview area + sidebar ingest section. |
| `TopBar.tsx` | 173 → ~120 | Simplify: remove edit/systems toggles. Keep title, compile, export. |
| `PreviewPane.tsx` | 326 → ~200 | Simplify: remove side-by-side logic. Always full remaining width. Always visible. |
| `PublishingSystems.tsx` | 643 → ~400 | Convert from sliding panel to sidebar section. Compact results. |

### New files:

| File | Est. Lines | Purpose |
|------|-----------|---------|
| `Sidebar.tsx` | ~500 | Left sidebar shell with collapsible sections |
| `StatusBar.tsx` | ~40 | Bottom status bar (engine, grade, build ID, status) |
| `IngestZone.tsx` | ~150 | Empty-state drop zone for the preview area (replaces PortalStage idle phase) |
| `ExportSection.tsx` | ~300 | Export sidebar section with inline pre-flight, quality gates, download |
| `TemplateSection.tsx` | ~200 | Template picker sidebar section (grid + genre tabs + variant toggle) |
| `LayoutSection.tsx` | ~150 | Page size + margin sidebar section |

### Files UNCHANGED:

| File | Reason |
|------|--------|
| `useCompileQueue.ts` | Hook logic is solid — debounce, polling, quality extraction all stay |
| `editor-types.ts` | Types are correct |
| `editor-utils.ts` | Genre detection, error translation all stay |
| `debug-log.ts` | Logging infrastructure stays |
| `manuscript-store.ts` | Persistence layer stays |
| `ImageUpload.tsx` | Move into Manuscript sidebar section, but component logic stays |
| `ManuscriptBrowser.tsx` | Move trigger into sidebar, but modal stays |
| `RichTextEditor.tsx` | Keep as-is, triggered from sidebar |

---

## Implementation Phases

### Phase 1: Scaffold the new layout
1. Create `Sidebar.tsx` shell with 6 collapsible sections (empty content)
2. Create `StatusBar.tsx`
3. Rewrite `CompileShell.tsx` to use sidebar + preview layout (no stages)
4. Create `IngestZone.tsx` for empty state
5. Wire up existing state management (no logic changes, just layout)

### Phase 2: Migrate sidebar content
1. Move template picker from FloatingHUD to `TemplateSection.tsx`
2. Move page/margin picker from FloatingHUD to `LayoutSection.tsx`
3. Move settings from FloatingHUD to inline sidebar section
4. Move markdown editor from EditorOverlay to Manuscript section
5. Move image upload into Manuscript section

### Phase 3: Inline export flow
1. Create `ExportSection.tsx` with platform/paper/preflight/download
2. Move pre-flight logic from LaunchOverlay inline
3. Move quality gates inline (C/D warnings, D checkbox)
4. Move download logic inline
5. Wire TopBar "Export" button to scroll/open Export section

### Phase 4: Simplify remaining components
1. Simplify `TopBar.tsx` (remove edit/systems toggles)
2. Simplify `PreviewPane.tsx` (remove side-by-side, always full width right of sidebar)
3. Convert `PublishingSystems.tsx` to Analysis sidebar section
4. Clean up: delete FloatingHUD.tsx, LaunchOverlay.tsx, PortalStage.tsx

### Phase 5: Polish
1. Responsive behavior (sidebar collapses on mobile)
2. Keyboard shortcuts (adapt to new layout)
3. Animations (sidebar sections, preview transitions)
4. Test all compile/export/quality flows end-to-end

---

## Key Decisions

1. **Sidebar width**: 320px (collapsible to 0 on mobile, icon-only 48px option on desktop)
2. **Sidebar position**: Left side (matches Vellum/Atticus pattern, reading order left-to-right)
3. **Accordion behavior**: Multiple sections can be open simultaneously (not mutually exclusive)
4. **Auto-compile**: Keep current 1s/1.5s debounce behavior. No change to compile logic.
5. **Mobile**: Sidebar becomes a bottom sheet or full-screen overlay (not a three-panel layout)
6. **Keyboard shortcuts**: Adapt — `1-6` for sidebar sections, `Space` for compile, `E` for export section
7. **Export confirmation**: Inline in sidebar, not a modal. Grade D acknowledgment is a checkbox, not a dialog.
8. **Analysis panel**: Moves from 380px right panel to sidebar section. Compact by default, expandable.

---

## Risk Mitigation

- **No backend changes required** — this is purely frontend UI restructuring
- **No hook changes** — useCompileQueue, useManuscript, manuscript-store all stay
- **No type changes** — editor-types.ts stays
- **Incremental approach** — each phase produces a working editor
- **Git safety** — all work on `claude/complete-migration-audit-AGs9m` branch
