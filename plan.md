# Plan: Watermark System + Single-PDF Credit Wiring

## Problem
1. **No watermark** is applied to free-tier PDFs — the "watermarked output" claim is not implemented
2. The £2.99 "Single" tier collects payment but **doesn't deliver** — webhook writes `tier='single'` but there's no credit/token system
3. Compile route has **no paywall enforcement** — anyone gets clean PDFs

## Design Decisions (from user)
- **Watermark visibility**: Middle ground — repeating geometric pattern, refined but clearly marked
- **Preview vs download**: Clean preview (no watermark), watermarked on download only
- **Credit model**: 1 credit = 1 PDF download

---

## Watermark Design: "The Compositor's Mark"

A Müller-Brockmann-inspired geometric watermark built entirely in TikZ. The theme is *printer's registration marks meets Swiss grid design*.

### The Tile (single unit, repeated across page)

```
         ┌─┐                     ┌─┐
         └─┘                     └─┘
              ╶─╶─╶─╶─╶─╶─╶─
           ┌───────────────────┐
           │   P A G E         │
           │     ───+───       │
           │   P E R F E C T   │
           └───────────────────┘
              ╶─╶─╶─╶─╶─╶─╶─
         ┌─┐                     ┌─┐
         └─┘                     └─┘
```

**Elements:**
1. **Registration crosshair** — a ＋ inside a circle (the classic printer's alignment mark)
2. **"PAGE" above, "PERFECT" below** — letterspaced small-caps text flanking the crosshair
3. **Baseline grid fragments** — short dashed horizontal lines suggesting the grid system
4. **Corner crop marks** — small L-brackets at the four corners of the tile
5. **Golden rectangle** — a subtle phi-proportioned rectangle outline behind the crosshair

**Layout:**
- Tiles arranged on a 30° rotated grid, ~2.5 inches apart
- Opacity: 8% (`text opacity=0.08, draw opacity=0.08`)
- `eso-pic` package places the pattern in every page background
- `tikz` renders each tile

---

## Architecture

### Current compile flow
```
User types → 1s debounce → compile() → PDF blob → preview iframe
User clicks Download → compile(downloadAfter=true) → same PDF blob → trigger <a download>
```

Both preview and download use the same compile call. The `downloadAfter` flag just triggers a file save after compilation.

### New flow
```
Auto-compile (preview)
  → compile(download=false) in request body
  → backend: always clean PDF, no watermark
  → preview in iframe

Download button click
  → compile(download=true) in request body + Authorization header
  → backend: check user tier via PocketBase token
     ├─ publisher/studio tier → clean PDF
     ├─ pdf_credits > 0 → decrement credit, clean PDF, X-Credits-Remaining header
     └─ drafter/no auth/no credits → inject watermark preamble → watermarked PDF
  → frontend: save PDF, show credit info or "watermarked" notice
```

---

## Implementation Steps

### Step 1: `backend/watermark.js` (NEW)

TikZ watermark generator module.

Exports:
- `generateWatermarkPreamble()` → returns LaTeX string

The LaTeX code:
- Loads `eso-pic` and `tikz` packages
- Defines a `\AddToShipoutPictureBG*` command
- Draws the compositor's mark tile pattern at 8% opacity
- Tiles rotated 30° across the full page

### Step 2: `backend/index.js` — compile route changes

In the `/api/compile` route handler:

1. Accept `download` boolean from `req.body`
2. Accept optional `Authorization: Bearer <token>` header
3. Add watermark decision logic:
   ```
   needsWatermark = false
   if download:
     tier = 'drafter' (default)
     credits = 0
     if auth token present:
       verify against PocketBase → get tier, pdf_credits
     if tier in ['publisher', 'studio']:
       needsWatermark = false
     elif credits > 0:
       decrement credit via PocketBase PATCH
       needsWatermark = false
       set X-Credits-Remaining header
     else:
       needsWatermark = true
   ```
4. If `needsWatermark`, push watermark preamble into `preambleParts[]`
5. Set `X-Watermarked: true/false` response header

### Step 3: `backend/index.js` — webhook changes

In `payment_intent.succeeded`:
- If `tier === 'single'`: increment `pdf_credits` by 1 (not set tier)
- If `tier === 'studio'`: set tier to 'studio' (existing behavior)

New helper: `incrementCredits(userId, customerId)`:
- Fetch current `pdf_credits` from PocketBase
- PATCH with `pdf_credits + 1`

### Step 4: `frontend/src/lib/database.types.ts`

- Add `pdf_credits: number` to `UserRecord` interface
- Update comment to document the field

### Step 5: `frontend/src/lib/auth-context.tsx`

- Add `pdfCredits: number` to `AuthState`
- Parse `pdf_credits` from user record in `userToProfile()` / `syncUser()`
- Add `refreshUser()` method to re-fetch from PocketBase (called after download or purchase)

### Step 6: `frontend/src/app/app/CompileShell.tsx`

- In `compile()`: when `downloadAfter=true`, add `download: true` to request body
- Pass PocketBase auth token: `Authorization: Bearer ${pb.authStore.token}`
- After response: read `X-Watermarked` and `X-Credits-Remaining` headers
- If watermarked: show small notice "Free tier — PDF includes watermark"
- If credits used: show "N credits remaining" and call `refreshUser()`
- Show credit badge near download button if user has credits

---

## PocketBase Admin Change (manual)

Add field to `users` collection:
- **Field name**: `pdf_credits`
- **Type**: Number
- **Default**: `0`
- **Min value**: `0`

---

## Files Modified

| File | Change |
|------|--------|
| `backend/watermark.js` | **NEW** — TikZ watermark preamble generator |
| `backend/index.js` | Compile route: download flag, auth check, watermark injection. Webhook: credit increment for single tier |
| `frontend/src/lib/database.types.ts` | Add `pdf_credits` field to UserRecord |
| `frontend/src/lib/auth-context.tsx` | Expose `pdfCredits`, add `refreshUser()` |
| `frontend/src/app/app/CompileShell.tsx` | Download flag, auth header, credit display, watermark notice |
