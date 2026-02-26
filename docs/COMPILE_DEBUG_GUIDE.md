# Compile Failure Debug Guide

When "Unable to read environment locale" persists despite locale fixes in the codebase, the failure is usually in **deployment or environment**, not the fix itself. This guide covers tools, documentation, and alternate approaches.

---

## 1. Built-in diagnostic tools

### Status page (`/status`)

Visit **https://yoursite.com/status** (or `/status` on your deployment). It shows:

- **API Connectivity** — Which backend URL `/api/*` proxies to
- **Subsystem Readiness** — Redis, PocketBase, Pandoc, LuaLaTeX, **locale**, Ghostscript, disk
- **Font inventory** — Which templates' fonts are available

If **locale** shows `missing` or `check_skipped`, the running backend does not have a valid locale. If it shows `ok (C.UTF-8)`, the API process thinks the locale is fine—but the **compile worker** may run in a different process with different env.

### Health endpoints (curl)

```bash
# Basic health
curl -s https://YOUR-BACKEND-URL/api/health | jq

# Detailed readiness (locale, pandoc, lualatex, disk)
curl -s https://YOUR-BACKEND-URL/api/health/ready | jq
```

The `checks.locale` value tells you what the API server sees. Compare with what the compile worker (BullMQ) uses when it spawns Pandoc.

### Docs System Check (`/docs`)

The "Operating the Engine" docs page has a **System Check** card that runs:

1. `GET /api/health` — Backend reachable
2. `POST /api/compile` — Minimal compile (chicago template, A4, fast mode)

If (1) passes but (2) fails with the locale error, the backend is up but compiles are failing in the worker.

---

## 2. Where compiles actually run

Compiles run in one of these ways:

| Mode | Process | Where locale is set |
|------|---------|---------------------|
| **Embedded worker** | `index.js` (BullMQ Worker in same process) | `compile-worker.js` → `SAFE_SPAWN_ENV` |
| **Standalone worker** | `worker.js` (separate process) | `compile-worker.js` → `SAFE_SPAWN_ENV` |
| **Cluster mode** | `cluster.js` → forks `index.js` | Same as embedded |

**Critical**: If Coolify runs the API and worker in **different containers**, the worker container may:

- Have a different `Dockerfile` build
- Get different env vars from Coolify
- Use an older image if it isn’t redeployed with the API

Check your Coolify setup: one service vs two (API + worker).

---

## 3. Deployment verification checklist

### Vercel (frontend)

- `API_BASE_URL` must point to the **real** backend (e.g. Coolify URL)
- Env vars are **build-time** for rewrites; changing them requires a new deployment
- Preview deploys use the same `API_BASE_URL` as production unless overridden

### Coolify (backend)

1. **Source** — Which repo/branch does the backend deploy from?
2. **Build** — Docker build or prebuilt image? If build, is the Dockerfile being rebuilt?
3. **Worker** — Same container as API, or a separate worker service?
4. **Redeploy** — After pushing locale fixes, did you:
   - Trigger a rebuild/redeploy in Coolify?
   - Use "Redeploy" in the Coolify UI?
   - Use a webhook from GitHub?

### Quick test: which backend are you hitting?

In the browser Network tab, when you trigger a compile:

- Request URL will be like `https://yoursite.com/api/compile` (proxied)
- To see the **actual** backend, check the response headers or run:

```bash
# From your machine — what does the frontend’s proxy target?
curl -sI https://page-perfect-XXX.vercel.app/api/health
# The request goes to Vercel, which proxies to API_BASE_URL
```

Then hit the backend directly:

```bash
curl -s https://YOUR-COOLIFY-BACKEND-URL/api/health/ready | jq
```

If `checks.locale` is `ok` when you hit the backend directly but compiles still fail, the worker may be in a different environment.

---

## 4. External documentation

### LuaLaTeX / luaotfload locale error

- **TeX.SE**: ["Unable to read environment locale: exit now"](https://tex.stackexchange.com/questions/374303/luatex-error-unable-to-read-environment-localeexit-now)
- **TeX.SE**: [Running lualatex as subprocess with en_US.UTF-8](https://tex.stackexchange.com/questions/550312/running-luatex-in-with-locale-set-to-en-us-utf-8-unable-to-read-environment-l) — notes that the error often appears when LuaLaTeX is **invoked as a subprocess** rather than from a terminal, and that locale format (dash vs underscore) can matter.

### Alternate locale strategies

From community reports:

1. **`C.UTF-8`** — Present in glibc; no `locale-gen`. Current fix.
2. **`en_US.UTF-8`** — Requires `locales` + `locale-gen` in the image.
3. **Empty `LANG`** — `LANG= lualatex file.tex` has worked when other locales fail (worth trying as a fallback).

### Coolify

- [Coolify Auto Deploy](https://coolify.io/docs/applications/ci-cd/github/auto-deploy) — Webhook from GitHub
- [Coolify GitHub Actions](https://coolify.io/docs/applications/ci-cd/github/actions) — Trigger redeploy via API

---

## 5. Try alternate locale via env (no code change)

The codebase already supports `PP_SPAWN_LOCALE`. If `C.UTF-8` still fails, try an empty `LANG`:

In `backend/compile-worker.js`, change:

```javascript
const SPAWN_LOCALE = 'C.UTF-8';
```

to:

```javascript
// Some environments: empty LANG works when C.UTF-8 fails (TeX.SE)
const SPAWN_LOCALE = process.env.PP_SPAWN_LOCALE || 'C.UTF-8';
```

Then in your Docker/Coolify env:

```bash
PP_SPAWN_LOCALE=
```

Or set `PP_SPAWN_LOCALE=` to force an empty value. (Ensure the code uses `''` when it’s empty, not a string `"''"`.)

---

## 6. Verify the running container

If you have shell access to the Coolify container:

```bash
# What locale does the running process see?
locale -a

# Is C.UTF-8 available?
locale -a | grep -i c.utf

# What does Node see?
node -e "console.log('LANG=', process.env.LANG); console.log('LC_ALL=', process.env.LC_ALL);"
```

---

## 7. .docx convert spawn (fixed)

The `/api/convert` route now passes a minimal env with locale (matching the compile path), so convert should no longer hit locale errors. It also respects `PP_SPAWN_LOCALE`.

---

## Summary

| If... | Then... |
|-------|---------|
| Locale fix is in code but compiles still fail | Redeploy backend; confirm worker uses same image and env |
| `/status` shows locale `missing` | Backend container lacks valid locale; fix Dockerfile or try `PP_SPAWN_LOCALE=` |
| `/status` shows locale `ok` but compile fails | Worker may run separately; check Coolify services and worker env |
| You’ve “fixed it many times” | Likely deployment/refresh issue: Coolify not rebuilding, or worker on old image |
