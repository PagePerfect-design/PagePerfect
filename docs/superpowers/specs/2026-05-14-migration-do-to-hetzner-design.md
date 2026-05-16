# Migration: DigitalOcean → Hetzner (backend stack only)

> Spec for migrating PagePerfect's **backend + PocketBase + Redis** from the current DigitalOcean Coolify host to a fresh Hetzner Cloud VPS running Coolify. The Vercel-hosted Next.js frontend stays on Vercel — out of scope.
> Status: draft pending user review.

## 1 · Brief

**Why we're doing this.** The current DigitalOcean host (8 GB RAM, 154 GB disk) runs 25 containers including a full Supabase stack, n8n, and the PagePerfect apps. Memory pressure (5.1 / 7.8 GB used, swap 100 % exhausted) means the backend Docker image (5.6 GB — texlive + ghostscript + typst + node) cannot complete the BuildKit export step — every backend deploy attempt OOM-kills during layer export. Moving the PagePerfect backend stack to a dedicated, properly-sized Hetzner box eliminates the resource contention.

**Goal.** End-state: PagePerfect's **backend + PocketBase + Redis** running on a fresh Hetzner Cloud VPS under a fresh Coolify install. The Vercel-hosted Next.js frontend automatically starts hitting the new backend because `api.pageperfect.studio` (DNS-mediated) flips from DO IP to Hetzner IP — no frontend redeploy required, no `NEXT_PUBLIC_*` env var change required. DigitalOcean PP backend / PocketBase / Redis decommissioned after a 7-day monitoring window. Supabase, n8n, and any other Coolify apps on DO remain on DO — out of scope.

**Non-goals.**
- **Moving the Next.js frontend off Vercel.** It stays on Vercel. The repo's `.vercel/` config, the `www` CNAME → `*.vercel-dns-016.com.`, and the user's explicit decision (2026-05-14) confirm Vercel hosting is intentional and stays.
- Migrating Supabase, n8n, or anything else on DO unrelated to PagePerfect.
- Changing PagePerfect's domain. `pageperfect.studio` stays the same — only the **A records for `api`, `pb`, and `studio`** flip from DO IP to Hetzner IP.
- Changing email (MX, SPF, DKIM, DMARC) or Microsoft 365 / Outlook records.
- Dockerfile slim-down (separate follow-up; tracked as PR #213).

**Constraints.**
- Backend stack only.
- Coolify on Hetzner.
- DNS managed via Microsoft 365 admin console (nameservers `ns{1..4}.bdm.microsoftonline.com`).
- Downtime is not a problem — staging test on temp subdomain → DNS flip → validate. No maintenance window required.
- Hetzner account already exists; project named `pageperfect` already exists; just need to provision the server inside it.

## 2 · Target architecture

**Hetzner Cloud VPS** — recommended: **CX42** (4 vCPU dedicated, 16 GB RAM, 160 GB NVMe SSD, ~€11.99/mo). Backend Docker image is 5.6 GB and BuildKit's export step needs RAM headroom. CX42 leaves comfortable margin even if PR #213 slim-down is delayed.

**Data center.** Falkenstein (FSN1) or Nuremberg (NBG1) for EU; Hillsboro (HIL1) or Ashburn (ASH1) for US. EU likely.

**OS.** Ubuntu 24.04 LTS.

**Stack on Hetzner Coolify** — three apps:

| App | Image source | Internal port | Coolify name |
|---|---|---|---|
| Backend | `backend/Dockerfile` from GitHub `main` | 4000 | `pp-backend` |
| PocketBase | `ghcr.io/muchobien/pocketbase:latest` (same image used today) | 8090 | `pp-pocketbase` |
| Redis | `redis:7.2` | 6379 | `pp-redis` |

The Next.js frontend stays on Vercel and is unaffected. It calls the backend via `https://api.pageperfect.studio` and the database via `https://pb.pageperfect.studio` — both DNS-mediated so the cutover is transparent.

**Networking.** Coolify-managed Traefik handles TLS via Let's Encrypt. Each app gets a public route.

**Domains in play** — ground-truthed against the downloaded zone file + the earlier admin-center screenshot:

| Hostname | Current target | Action |
|---|---|---|
| `pageperfect.studio` (apex) | Redirects to `www.pageperfect.studio` (Vercel) | **No change** — frontend stays on Vercel |
| `www.pageperfect.studio` | CNAME → `fcc859d017a50d6f.vercel-dns-016.com.` (Vercel) | **No change** — frontend stays on Vercel |
| `api.pageperfect.studio` | A → `134.122.102.159` (DO) | Flip to Hetzner IP at Phase 9 |
| `pb.pageperfect.studio` | A → `134.122.102.159` (DO) | Flip to Hetzner IP at Phase 9 |
| `studio.pageperfect.studio` | A → `134.122.102.159` (DO) | Confirm purpose in Phase 1.5; if still used, flip to Hetzner IP; if obsolete, optionally delete |
| `new-api.pageperfect.studio` *(temporary)* | (does not yet exist) | A → Hetzner IP at Phase 4; remove post-cutover |
| `coolify.pageperfect.studio` | (does not yet exist) | A → Hetzner IP at Phase 3 |
| Everything else (`@` MX, `@` TXT, `send` MX/TXT, `_dmarc`, `resend._domainkey`, `selector1/2._domainkey`, `autodiscover`, `enterpriseenrollment`, `enterpriseregistration`, `MS=` TXT, `google-site-verification` TXT) | Microsoft 365 / AWS SES / Resend / Intune / ownership | **DO NOT TOUCH** — none of these are web-tier records |

## 3 · Phases

The runbook expands each phase into 3–6 baby steps with exact commands. Total ~30 baby steps for the whole migration.

### Phase 1 — Hetzner VPS provisioned (account already done)
Account exists. Project `pageperfect` exists. Generate an SSH key pair locally if you don't have one. Provision a CX42 VPS with Ubuntu 24.04 LTS in your chosen data center, attached to the `pageperfect` project. Note the public IP. Confirm SSH login as root.

### Phase 1.5 — Complete DNS inventory + Stripe/Lulu webhook URL check
Two read-only inventories before any change:

1. **DNS**: from the zone file we already have, list every record that points at `134.122.102.159` (DO IP). Confirmed list so far: `api`, `pb`, `studio`. Re-screenshot the admin center if there's any chance more A records exist.
2. **Stripe webhook URL**: log into Stripe → Developers → Webhooks. Note the production endpoint URL. Confirm it's a domain-based URL (e.g. `https://api.pageperfect.studio/api/stripe/webhook`), not an IP. If domain-based, no Stripe change needed at cutover — DNS does the work.
3. **Lulu webhook URL**: same check in Lulu's developer console.
4. **GitHub webhook**: the Coolify-on-DO GitHub webhook for the PagePerfect repo. Note the URL. We will REPLACE this with the Hetzner Coolify webhook in Phase 5.

Phase 1.5 is read-only — no edits, just data gathering. Output: the cutover checklist.

### Phase 2 — Server hardening
Create a non-root user (`pp` or your name). Add your SSH key to that user. Disable root SSH login. Disable password SSH. Install + enable UFW firewall (allow 22, 80, 443). Install fail2ban. Enable unattended-security-upgrades. ~20 minutes.

### Phase 3 — Install Coolify on Hetzner
Run the official one-line installer from the Coolify docs. Pick a Coolify dashboard subdomain (default: `coolify.pageperfect.studio`). Add an A record at Microsoft 365 DNS pointing that subdomain at the Hetzner IP. Visit the URL, complete first-run setup (admin email + password, 2FA). Confirm dashboard is reachable + TLS valid.

### Phase 4 — Set up the temporary backend-staging subdomain
Pick a name (default: `new-api.pageperfect.studio`). Add an A record at Microsoft 365 DNS pointing it at the Hetzner IP. We'll route the Hetzner-side backend through this hostname for testing before the final cutover.

### Phase 5 — Recreate the three apps in Hetzner Coolify
For each of `pp-backend`, `pp-pocketbase`, `pp-redis`:
- Connect Coolify to the PagePerfect GitHub repo (install / authorize the Coolify GitHub App if not already).
- Create a new application of the appropriate type (Dockerfile for backend, Docker image for PocketBase + Redis).
- Set the domain — backend at `new-api.pageperfect.studio`, PocketBase at `new-pb.pageperfect.studio` (also add this A record now), Redis is internal-only (no public domain).
- Leave env vars empty (Phase 6).
- Do NOT deploy yet.

### Phase 6 — Copy environment variables / secrets
The most error-prone phase. We will produce a **complete env-var checklist** by reading from DO Coolify and re-entering in Hetzner Coolify. Variables to copy include (non-exhaustive; the runbook will surface the full list during inventory):
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_PUBLISHER`, `STRIPE_PRICE_STUDIO`
- `RESEND_API_KEY`
- `RUNWARE_API_KEY` (the one already in DO Coolify env per user note 2026-05-14)
- `LULU_CLIENT_KEY`, `LULU_CLIENT_SECRET`, `LULU_WEBHOOK_SECRET`
- `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`
- `POCKETBASE_ADMIN_EMAIL`, `POCKETBASE_ADMIN_PASSWORD`
- `INTERNAL_BACKEND_TOKEN` (if backend issues internal tokens consumed by the frontend or elsewhere)
- `NODE_ENV=production`
- `ALLOWED_ORIGINS` — must include `https://pageperfect.studio` and `https://www.pageperfect.studio` (Vercel frontend) AND `https://new-api.pageperfect.studio` (staging)
- `REDIS_URL` — internal Coolify service DNS: `redis://pp-redis:6379`
- `POCKETBASE_URL` — internal: `http://pp-pocketbase:8090` (Coolify-side) OR `https://new-pb.pageperfect.studio` for the public side
- Any others surfaced during inventory

Deploy each app after its vars are populated. Verify each is healthy in Coolify.

### Phase 7 — Migrate PocketBase data
On DO, exec into the PocketBase container and trigger a backup (PocketBase admin UI → Settings → Backups → Create). Copy the resulting `.zip` snapshot to Hetzner via `scp`. On Hetzner PocketBase, restore the snapshot via the admin UI. Verify users, manuscripts, print_orders, and `_superusers` collections all appear and counts match within ±5 (small drift acceptable if rows were created during transfer).

### Phase 8 — Validate at the staging URL
Walk a complete backend smoke test using **DO frontend** pointed at **Hetzner staging backend** by temporarily overriding the frontend's local config / using curl directly. The runbook will provide concrete cURL commands for:
- `GET https://new-api.pageperfect.studio/api/health` → 200
- `POST https://new-api.pageperfect.studio/api/compile` with a tiny sample manuscript → returns a PDF or job ID
- PocketBase admin reachable at `https://new-pb.pageperfect.studio/_/`
- Stripe test webhook delivered to `https://new-api.pageperfect.studio/api/stripe/webhook` → 200
- A test compile end-to-end (manuscript paste → PDF download)

### Phase 9 — Cutover
**24 hours before cutover:** reduce TTL on the three production A records (`api`, `pb`, `studio`) to 300s at Microsoft 365 admin. This lets the lower TTL propagate so the actual flip is fast.

**At cutover:** edit each A record from `134.122.102.159` (DO) to the Hetzner IP:
- `api` — A record
- `pb` — A record
- `studio` — A record (unless Phase 1.5 confirmed it's safe to delete)

**Then check external services:**
- **Stripe** dashboard → Developers → Webhooks → if the endpoint URL is domain-based (Phase 1.5 confirmed), **no change needed**. If it's IP-based, edit it to the domain-based form (one-time cleanup).
- **Lulu xPress** developer console → same.
- **GitHub** → Settings → Webhooks for `PagePerfect-design/PagePerfect` repo → **remove the DO Coolify webhook**, ensure the Hetzner Coolify webhook (added in Phase 5) is present and enabled.
- **Cloudflare Turnstile** dashboard → confirm `pageperfect.studio` is in the allowed-hostnames list. No change expected.
- **Resend** dashboard → no change; domain unchanged.
- **Vercel** dashboard → **no change**. The frontend doesn't know or care that the backend moved. The DNS does the work.

After A records propagate (~5 min with the lowered TTL), validate once more on the production hostnames (`api.pageperfect.studio`, `pb.pageperfect.studio`).

### Phase 10 — Post-cutover monitoring (7 days)
Watch Hetzner Coolify deploys (does GitHub push trigger them correctly), watch error rates, watch Stripe + Lulu webhook deliveries in their dashboards, watch user complaints / support inbox. **Rollback plan during this window**: if anything is wrong, re-edit the 3 A records back to `134.122.102.159` (DO). Traffic returns to DO within ~5 minutes (300s TTL). DO apps must remain running and warm throughout this window.

### Phase 11 — Decommission DO (backend, PocketBase, Redis only)
After 7 quiet days: in the DO Coolify, stop and remove the `y48k0...` (backend), `pocketbase`, and PP's `redis:7.2` (`ds08oc...`) containers. **Do NOT touch** Supabase, n8n, `bbjhn...` (it's the OLD frontend container — actually re-check, this might be a now-orphaned frontend; if it's serving anything via DO IP at all, leave it; if it isn't reachable, remove it). Confirm DO disk + RAM freed. Optionally downsize DO droplet at next billing cycle.

## 4 · Rollback plan

Every phase before Phase 9 is safe to abandon — production stays on DO, no changes. We can take days on Hetzner without affecting users.

At Phase 9 (DNS cutover) the rollback is: re-edit the 3 A records back to `134.122.102.159`. Within ~5 minutes traffic returns to DO. DO apps must stay running until Phase 11 explicitly stops them.

Hard rule: **do NOT touch DO apps until Phase 11.** They are the safety net.

## 5 · Inventory checklists

### 5.1 — Secrets to copy (Phase 6)
Produced live in Phase 6 by reading DO Coolify env vars. Each item ticked when verified copied.

### 5.2 — External services to flip (Phase 9)
- Stripe webhook URL — check, edit only if IP-based
- Lulu webhook URL — check, edit only if IP-based
- GitHub webhook — replace DO with Hetzner
- Turnstile, Resend, Vercel — no change expected; verify

### 5.3 — Data to migrate (Phase 7)
- PocketBase data (`pb_data.zip` snapshot) — primary
- PocketBase uploaded files (if any persisted) — manuscript TTL is 24h so most are ephemeral; confirm in Phase 7 inventory
- No Redis state to migrate (BullMQ jobs are ephemeral)
- No backend filesystem state (compile outputs in `/tmp/ppresults/` or S3 per `STATUS.md`)

## 6 · Risks + mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| A secret is forgotten in Phase 6 | High | Exhaustive checklist produced before Phase 6; tick each item. Compare env-var counts DO vs Hetzner before deploy. |
| PocketBase restore fails | Low | Test restore on Hetzner BEFORE flipping DNS. If it fails, troubleshoot offline; DO is still live. |
| Stripe webhook fires during cutover | Medium | Stripe retries failed deliveries for 3 days. After cutover, check Stripe dashboard for failed events and replay any. |
| TTL didn't propagate | Medium | Lower TTL 24 h before cutover (Phase 9). |
| User mistakes an MX record for an A record and breaks email | **High** | Every DNS step in the runbook explicitly says "only the A records named `api`, `pb`, `studio` — nothing else." Show the existing record before editing. |
| `studio.pageperfect.studio` is in production use but we removed it | Medium | Phase 1.5 confirms purpose; if in doubt, flip it to Hetzner alongside the others rather than delete. |
| Backend texlive image fails to build on Hetzner (same OOM) | Low | CX42 has 16 GB RAM; image is 5.6 GB; comfortable margin. |
| PR #213 (Dockerfile slim-down) lands during migration | Low | Hold PR #213 until after Phase 11. Migrate the working Dockerfile first. |
| Frontend on Vercel breaks because backend URL changed *internally* | Low | DNS is transparent — the URL `api.pageperfect.studio` doesn't change. Only what IP it points at. Vercel doesn't see the change. |
| `ALLOWED_ORIGINS` on Hetzner backend forgets to include `https://pageperfect.studio` | Medium | Explicit check in Phase 6: list both `https://pageperfect.studio` AND `https://www.pageperfect.studio` AND staging. |

## 7 · Out of scope (followups)

- **Moving the Next.js frontend off Vercel** — stays on Vercel. Can be a separate, deliberate project later if you want full vendor independence. The frontend is already Dockerized (`frontend/Dockerfile`) so the option is preserved.
- **Dockerfile slim-down (PR #213)** — defer until post-migration. Image stays 5.6 GB through this work.
- **Supabase / n8n migration** — defer indefinitely or separate project.
- **DNS off Microsoft 365 onto Cloudflare** — would speed future cutovers but not required now.
- **Monitoring / alerting** — Coolify alerts suffice initially; deeper observability is separate.
- **Backup automation** — set up Hetzner Cloud snapshots (built-in, paid extra) after cutover.
- **`bbjhn...` (the old frontend container on DO)** — its current purpose is unclear given Vercel is the primary frontend host. Investigate during Phase 11 decommission; remove if unused.

## 8 · Definition of done

- [ ] Hetzner Coolify reachable at `coolify.pageperfect.studio`.
- [ ] PagePerfect backend reachable at `https://api.pageperfect.studio` (post-cutover), serving production traffic.
- [ ] PocketBase admin reachable at `https://pb.pageperfect.studio`.
- [ ] PocketBase data matches DO (users, manuscripts, print_orders count within ±5).
- [ ] Stripe webhook deliveries to Hetzner endpoint succeed (test event triggered manually).
- [ ] Lulu webhook to Hetzner endpoint succeeds.
- [ ] GitHub push to `main` triggers Hetzner Coolify deploy.
- [ ] Vercel frontend operating unchanged (no redeploy required).
- [ ] 7 days post-cutover with no incidents.
- [ ] DO `y48k0...` (backend) + `pocketbase` + PP's `redis:7.2` (`ds08oc...`) stopped and removed.
- [ ] Spec + runbook archived at `docs/superpowers/specs/` + `plans/`.

## 9 · Self-review

- All 11 phases (1, 1.5, 2–11) have an explicit "what done looks like."
- No `TBD` / `TODO` markers.
- The MX-record warning is reinforced in §2 table, §6 risks, and the runbook will repeat it inline at every DNS step.
- Rollback at every phase is explicit; production stays on DO until DNS flips at Phase 9.
- Decommission is gated on 7 quiet days, not "day 1 looks fine."
- The Vercel-stays-on-Vercel decision is explicitly recorded in §1 non-goals and §7 out of scope.
- Three DNS records (`api`, `pb`, `studio`) flip — none of the email or Microsoft 365 / Outlook / Intune records are touched.
- `studio.pageperfect.studio` is flagged for purpose-check in Phase 1.5.
