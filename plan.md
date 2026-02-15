# PagePerfect Migration Plan: Railway/Netlify → Coolify/Vercel/Resend

## Current State (what the audit found)

**What's working:**
- Backend Docker image builds and runs (Railway)
- Supabase auth flow (login, signup, OAuth, callback) — fully wired
- Stripe checkout session creation + webhook skeleton — partially wired
- Frontend compiles and proxies `/api/*` to backend via Next.js rewrites
- Database schema + RLS policies exist in `supabase/migrations/001_initial_schema.sql`
- Design system, editor, all pages functional

**What's broken / incomplete:**
- `RAILWAY_API_BASE` env var name hardcoded in 3 files — ties you to Railway naming
- `images: { unoptimized: true }` in next.config.ts — Netlify workaround, unnecessary on Vercel
- Stripe webhooks log events but **never actually update Supabase** (TODO comments at lines 160-172 in backend/index.js)
- No Resend integration anywhere — zero email capability beyond Supabase auth emails
- `compile_history` table exists but backend never writes to it
- `manuscripts` table exists but frontend only uses localStorage
- Documentation (CLAUDE.md, README.md) references Netlify + Railway

**Target stack:**
| Layer | From | To |
|-------|------|----|
| Frontend hosting | Netlify | **Vercel** |
| Backend hosting | Railway | **Coolify** (Docker on DO droplet) |
| Database + Auth | Supabase Cloud (assumed) | **Self-hosted Supabase via Coolify** |
| Transactional email | None | **Resend** (SMTP for Supabase + API for app emails) |
| Payments | Stripe | Stripe (no change) |

---

## Implementation Plan — 8 Tasks

### Task 1: Rename `RAILWAY_API_BASE` → `API_BASE` (code changes)

**Files to change:**

1. **`frontend/next.config.ts`** (line 6)
   - `process.env.RAILWAY_API_BASE` → `process.env.API_BASE`
   - Remove comment "proxies /api/* → Railway/api/*" → "proxies /api/* → backend"
   - Remove `images: { unoptimized: true }` (not needed on Vercel)

2. **`frontend/src/app/status/page.tsx`** (line 10)
   - `process.env.RAILWAY_API_BASE` → `process.env.API_BASE`

3. **`frontend/.env.example`**
   - `RAILWAY_API_BASE=http://localhost:4000` → `API_BASE=http://localhost:4000`

Why `API_BASE` and not `NEXT_PUBLIC_API_BASE`: This variable is used in `next.config.ts` rewrites (server-side build config) and `status/page.tsx` (server component). It never needs to reach the browser, so no `NEXT_PUBLIC_` prefix needed.

---

### Task 2: Clean up Netlify/Railway references in backend

**Files to change:**

1. **`backend/index.js`** (line 20)
   - Comment: `// e.g. https://pageperfect.netlify.app` → `// e.g. https://pageperfect.com`

2. **`backend/.env.example`**
   - Add `FRONTEND_URL=http://localhost:3000` (missing, but used in code)
   - Add `RESEND_API_KEY=re_...` (for Task 5)

---

### Task 3: Implement Stripe webhook → Supabase tier updates

The checkout flow works (creates Stripe sessions), but **nothing happens after payment**. The webhook handler at `backend/index.js:156-186` has three TODO blocks that need real implementations.

**Changes to `backend/index.js`:**

1. Add Supabase admin client at top of file:
```javascript
const { createClient } = require('@supabase/supabase-js');
const supabaseAdmin = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  : null;
```

2. Implement `checkout.session.completed` handler:
   - Read `session.metadata.tier` and `session.metadata.user_id`
   - Update `profiles` table: set `tier`, `stripe_customer_id`, `stripe_subscription_id`

3. Implement `customer.subscription.deleted` handler:
   - Look up user by `stripe_customer_id` in profiles
   - Downgrade `tier` to `'drafter'`

4. Implement `invoice.payment_failed` handler:
   - Log warning, optionally send email via Resend (Task 5)

5. Update checkout session creation to include `user_id` in metadata (requires frontend to pass it)

---

### Task 4: Add compile history logging

The `compile_history` table exists in Supabase but backend never writes to it.

**Changes to `backend/index.js`** in the `pandoc.on('close')` handler (~line 479):

After compilation completes (success or failure), insert a row into `compile_history` via `supabaseAdmin` with: template, page_size, margin_preset, compile_mode, safe_mode, status, compile_time_ms, error_message.

This is non-blocking — fire-and-forget, don't let logging failures break compilation.

---

### Task 5: Add Resend email integration

**Install dependency:**
```bash
cd backend && npm install resend
```

**Create `backend/email.js`:**
- Initialize Resend client with `RESEND_API_KEY`
- Export helper functions:
  - `sendPaymentConfirmation(email, tier)` — after successful checkout
  - `sendSubscriptionCancelled(email)` — after subscription deleted
  - `sendPaymentFailed(email)` — after invoice.payment_failed

**Wire into Stripe webhooks** (Task 3):
- Call `sendPaymentConfirmation()` in `checkout.session.completed`
- Call `sendSubscriptionCancelled()` in `customer.subscription.deleted`
- Call `sendPaymentFailed()` in `invoice.payment_failed`

**Note:** Supabase auth emails (signup confirmation, password reset) are handled by Supabase's own SMTP config — you'll point that at Resend's SMTP endpoint (`smtp.resend.com:465`) in Coolify's Supabase environment. No code needed for that.

---

### Task 6: Update documentation (CLAUDE.md, README.md)

**CLAUDE.md changes:**
- Deployment section: Netlify → Vercel, Railway → Coolify (Docker on Digital Ocean)
- Environment variables table: `RAILWAY_API_BASE` → `API_BASE`, add `RESEND_API_KEY`
- Add Resend to tech stack table
- Update "Important Files" table to include `backend/email.js`

**README.md changes:**
- Deployment references: Netlify → Vercel, Railway → Coolify

---

### Task 7: Update `.env.example` files (both)

**`frontend/.env.example`:**
```env
# Supabase (self-hosted via Coolify)
NEXT_PUBLIC_SUPABASE_URL=https://supabase.yourdomain.com
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Stripe (public price IDs)
NEXT_PUBLIC_STRIPE_PRICE_PUBLISHER=price_...
NEXT_PUBLIC_STRIPE_PRICE_STUDIO=price_...

# Backend API (Coolify backend URL — server-side only, no NEXT_PUBLIC_ needed)
API_BASE=http://localhost:4000
```

**`backend/.env.example`:**
```env
PORT=4000
NODE_ENV=development

# Frontend URL (for CORS + Stripe redirect URLs)
FRONTEND_URL=http://localhost:3000

# Supabase (self-hosted via Coolify — service role for admin operations)
SUPABASE_URL=https://supabase.yourdomain.com
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_PUBLISHER=price_...
STRIPE_PRICE_STUDIO=price_...

# Resend (transactional email)
RESEND_API_KEY=re_...

# Compile limits
MAX_MD_BYTES=2097152
COMPILE_TIMEOUT_MS=45000
```

---

### Task 8: Infrastructure setup (not code — dashboard config)

This is the order of operations for the actual platform setup:

**8a. Resend** (do first — Supabase needs SMTP creds)
- Sign up at resend.com
- Add + verify your sending domain (DNS records)
- Create API key → save as `RESEND_API_KEY`
- SMTP creds: host=`smtp.resend.com`, port=`465`, user=`resend`, pass=your API key

**8b. Supabase on Coolify**
- In Coolify dashboard: New Service → Supabase (one-click template)
- Set SMTP env vars (GOTRUE_SMTP_HOST/PORT/USER/PASS) to Resend values
- Set GOTRUE_SITE_URL to your Vercel domain
- Deploy, then grab: API URL, anon key, service role key
- Run migration SQL from `supabase/migrations/001_initial_schema.sql`
- Configure Google + GitHub OAuth providers with callback URL

**8c. Backend on Coolify**
- New Application → GitHub repo → Dockerfile build
- Base directory: `/backend`
- Port: `4000`
- Set all env vars from backend/.env.example with production values
- Deploy, verify `/api/health` returns OK

**8d. Stripe webhook update**
- Go to Stripe Dashboard → Developers → Webhooks
- Update endpoint URL from Railway URL → Coolify backend URL
- Or create new endpoint pointing to `https://api.yourdomain.com/api/stripe/webhook`

**8e. Vercel**
- Import GitHub repo, root directory: `frontend`
- Set env vars: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_STRIPE_PRICE_*, API_BASE (Coolify backend URL)
- Deploy
- Add custom domain

**8f. Verify end-to-end**
- Health check: `/status` page shows backend connected
- Compile: editor creates a PDF
- Auth: signup → Resend delivers confirmation email → confirm → login works
- OAuth: Google/GitHub login flows complete
- Stripe: test checkout → webhook fires → tier updates in Supabase

---

## Execution Order

Code changes (Tasks 1-7) can be done now, committed, and pushed. They're backwards-compatible — renaming an env var just means you set the new name in your deploy dashboard.

Infrastructure (Task 8) is done in dashboards after code ships.

```
Tasks 1+2  (rename vars, clean refs)     — independent, do in parallel
    ↓
Task 3     (Stripe → Supabase wiring)    — depends on supabaseAdmin client
    ↓
Task 4     (compile history logging)      — uses same supabaseAdmin client
    ↓
Task 5     (Resend email)                 — new file + wire into Task 3
    ↓
Tasks 6+7  (docs + env examples)         — independent, do in parallel
    ↓
Task 8     (infrastructure dashboards)    — after code is pushed
```
