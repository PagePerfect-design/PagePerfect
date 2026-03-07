# Cloudflare Turnstile Integration Plan

## Why Turnstile

Cloudflare Turnstile is the right fit for PagePerfect:
- **Free** — no usage caps
- **Invisible mode** — zero visual footprint, preserves Swiss/Ogilvy precision aesthetic
- **No puzzles** — never degrades UX with image grids or distorted text
- **Privacy-first** — no tracking cookies, GDPR-friendly
- The existing honeypot + timestamp checks on the contact form are good but insufficient against sophisticated bots

## Architecture

**Invisible widget** on the frontend generates a one-time token in the background. The token is sent as a header (`x-turnstile-token`) with protected API requests. A shared Express middleware on the backend verifies the token against Cloudflare's `/siteverify` endpoint before the request reaches the route handler.

```
Browser                         Backend                      Cloudflare
  │                               │                              │
  │ Turnstile invisible widget    │                              │
  │ generates token (background)  │                              │
  │                               │                              │
  │ POST /api/contact             │                              │
  │ x-turnstile-token: <token>    │                              │
  │ ─────────────────────────────>│                              │
  │                               │ POST /turnstile/v0/siteverify│
  │                               │ secret + token ─────────────>│
  │                               │                              │
  │                               │ { success: true } <──────────│
  │                               │                              │
  │                               │ proceed to route handler     │
  │ <─────────────────────────────│                              │
```

## Protected Endpoints

| Endpoint | Why | Token Source |
|----------|-----|-------------|
| `POST /api/contact` | Spam target, sends real email via Resend | Contact form widget |
| `POST /api/stripe/create-payment` | Payment abuse | Pricing page widget |

Auth forms (login, signup, forgot-password) go directly to PocketBase from the client — they don't route through our Express backend. Rather than proxying auth through Express just for Turnstile, we add the invisible widget to auth forms and verify client-side before calling PocketBase. This is a speed bump — bots can bypass it, but it blocks automated scripts that don't execute JavaScript. PocketBase's own rate limiting provides the server-side layer.

**NOT protected** (by design):
- `POST /api/compile` — auto-fires on debounce (1s). Tokens are single-use and expire in 5 min. Re-generating tokens every keystroke would thrash the widget. Existing rate limiting (20/min/IP) + auth tier checks are sufficient.
- `POST /api/analyze/*` — triggered automatically by the editor. Same debounce concern. Rate limiting (30/min) covers this.
- `POST /api/stripe/webhook` — server-to-server, already HMAC-verified by Stripe.

## Implementation Steps

### Step 1: Install `@marsidev/react-turnstile`

```bash
cd frontend && npm install @marsidev/react-turnstile
```

Most mature React wrapper. TypeScript-first, SSR-safe, supports invisible mode.

### Step 2: Create shared Turnstile hook — `frontend/src/lib/turnstile.tsx`

A reusable `useTurnstile()` hook that:
- Renders an invisible `<Turnstile>` widget
- Exposes `token` state and a `resetToken()` function
- Handles `onExpire` by auto-resetting (tokens expire after 5 min)
- Returns a `<TurnstileWidget>` component to place in forms

This keeps Turnstile logic in one place rather than duplicating across forms.

### Step 3: Create backend verification middleware — `backend/middleware/turnstile.js`

Extracts token from `x-turnstile-token` header or request body field `turnstileToken`. POSTs to `https://challenges.cloudflare.com/turnstile/v0/siteverify`. Returns 403 if verification fails. Skips verification if `TURNSTILE_SECRET_KEY` is not set (dev mode graceful degradation).

### Step 4: Wire into contact form — `RequestFormatCard.tsx`

- Import `useTurnstile()` hook
- Render invisible widget inside the form
- Send token as `turnstileToken` field in the POST body
- Reset token after successful submission (for "Send another" flow)
- Keep existing honeypot + timestamp checks as additional layers

### Step 5: Wire into auth forms

**`login/page.tsx`:**
- Add invisible widget to `LoginForm`
- Check for valid token before calling `signIn()` / `signUp()`
- If no token yet, show brief "Verifying..." state (rare — widget usually resolves in <1s)

**`forgot-password/page.tsx`:**
- Same pattern — check token before calling `resetPassword()`

### Step 6: Wire into Stripe payment creation — `pricing/page.tsx`

- Add invisible widget to the pricing page
- Send token with `createPayment()` call as header
- Backend `/api/stripe/create-payment` applies `verifyTurnstile` middleware

### Step 7: Update CSP — `middleware.ts`

Add Cloudflare Turnstile origins to Content Security Policy:
- `script-src`: add `https://challenges.cloudflare.com`
- `frame-src`: add `https://challenges.cloudflare.com`
- `connect-src`: add `https://challenges.cloudflare.com`

### Step 8: Environment variables

**Frontend (Vercel):**
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` — public site key from Cloudflare dashboard

**Backend (Coolify):**
- `TURNSTILE_SECRET_KEY` — secret key for server-side verification

**Development (Cloudflare test keys — always pass):**
- Site key: `1x00000000000000000000AA`
- Secret key: `1x0000000000000000000000000000000AA`

### Step 9: Update `.env.example` files

Add the new variables with comments to both `frontend/.env.example` and `backend/.env.example`.

## Aesthetic Considerations

- **Invisible mode = zero visual impact.** No widget, no badge, no "protected by" text. The Swiss grid remains pristine.
- If Cloudflare ever escalates to a visible challenge (rare, only for highly suspicious traffic), it renders in a small iframe. We cannot style it, but it's transient and self-dismissing.
- No "I'm not a robot" checkbox anywhere. That's consumer SaaS — we're a precision instrument.
- Error state when verification fails: use the existing error display pattern — `border border-[#dc2626]/20 bg-[#dc2626]/5` with monospace text. Message: "Verification failed. Please refresh and try again."

## Graceful Degradation

- If `TURNSTILE_SECRET_KEY` is not set, the backend middleware passes through without verification. Local dev works without a Cloudflare account.
- If `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is not set, the frontend hook returns a null token and doesn't render the widget. Forms work normally.
- If the Cloudflare `/siteverify` API is unreachable (network error), the middleware logs a warning and passes through — we don't block legitimate users because Cloudflare is down.

## File Changes Summary

| File | Change |
|------|--------|
| `frontend/package.json` | Add `@marsidev/react-turnstile` |
| `frontend/src/lib/turnstile.tsx` | **NEW** — shared hook + widget component |
| `frontend/src/components/landing/RequestFormatCard.tsx` | Add Turnstile to contact form |
| `frontend/src/app/(site)/auth/login/page.tsx` | Add Turnstile to login/signup |
| `frontend/src/app/(site)/auth/forgot-password/page.tsx` | Add Turnstile to password reset |
| `frontend/src/app/(site)/pricing/page.tsx` | Add Turnstile to payment flow |
| `frontend/src/middleware.ts` | Update CSP for Turnstile origins |
| `frontend/.env.example` | Add `NEXT_PUBLIC_TURNSTILE_SITE_KEY` |
| `backend/middleware/turnstile.js` | **NEW** — verification middleware |
| `backend/routes/contact.js` | Apply `verifyTurnstile` middleware |
| `backend/routes/stripe.js` | Apply `verifyTurnstile` to create-payment |
| `backend/.env.example` | Add `TURNSTILE_SECRET_KEY` |
