# vendor-register.md — Every paid vendor

Single source of truth for PagePerfect vendor relationships. `vendor-review` reads this; `finance-snapshot` reads this for spend lines; `legal-page-draft` reads this when listing sub-processors in DPA / Privacy Policy. Operator alone modifies. New vendors require operator + #24 (if data processor) + #9 (if contract) sign-off.

## Schema

```
### <vendor name>
- Service: <what they provide>
- Role: <where it sits in the PagePerfect stack>
- Criticality: <P0 / P1 / P2>
- Plan: <plan name + tier>
- Monthly cost: <approx GBP / USD>
- Renewal: <monthly / annual / per-use>
- Renewal date: <next>
- Lock-in level: <low / medium / high>
- Data processor: <yes / no — if yes, listed in DPA?>
- DPA in place: <yes / no / N-A>
- Sub-processors of vendor: <link to vendor's sub-processor list>
- Credentials (env var or location): <name from PROJECT.md, or "Coolify dashboard">
- Incident runbook: <link or section reference>
- Alternatives evaluated: <list>
- Last reviewed: <YYYY-MM-DD>
- Notes: <known issues, lock-in risks, contract notes>
```

### Criticality definitions

- **P0** — outage breaks the core compile pipeline or payment flow. Sub-15-minute response.
- **P1** — outage degrades a paid feature but core compile still works. Sub-hour response.
- **P2** — outage affects internal tooling or non-critical capability. Same-day response.

### Lock-in level definitions

- **Low**: switching cost = days. Standard format data, multiple equivalents in market.
- **Medium**: switching cost = weeks. Data export possible but reformatting needed; some custom integration.
- **High**: switching cost = months. Proprietary data formats, deep integration, customer-facing identifiers tied to vendor.

---

## Hosting + infra

### Vercel
- Service: Next.js hosting for `frontend/`
- Role: marketing site, editor shell, Stripe Payment Element host
- Criticality: **P0**
- Plan: <!-- TODO: confirm with operator (Hobby / Pro / Team) -->
- Monthly cost: <!-- TODO: confirm with operator -->
- Renewal: monthly
- Lock-in level: **medium** — Next.js is portable; rewrites in `next.config.ts`, build config, and edge-runtime settings need re-wiring on another host
- Data processor: yes (request logs, build logs, frontend env)
- DPA in place: yes (Vercel standard DPA)
- Sub-processors: AWS, Cloudflare (edge), others per Vercel sub-processor page
- Credentials: Vercel dashboard (operator only); frontend env vars set there — `API_BASE_URL`, `NEXT_PUBLIC_POCKETBASE_URL`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_STRIPE_PRICE_PUBLISHER`, `NEXT_PUBLIC_STRIPE_PRICE_STUDIO`, `RESEND_API`
- Incident runbook: <!-- TODO: confirm — likely "Vercel status page + redeploy last green commit" -->
- Alternatives evaluated: Netlify, Cloudflare Pages, self-hosted on Coolify
- Last reviewed: TBD
- Notes: `API_BASE_URL` must point to the Coolify backend in production; without it `/api/*` proxy 404s

### DigitalOcean
- Service: VM hosting the Coolify control plane and the backend Docker stack
- Role: backend compile workers (Pandoc + Typst + Ghostscript), PocketBase, Redis
- Criticality: **P0**
- Plan: <!-- TODO: confirm droplet size and region -->
- Monthly cost: <!-- TODO: confirm -->
- Renewal: monthly
- Lock-in level: **low** — generic Linux VM; Coolify stack moves to any equivalent provider
- Data processor: yes (manuscripts in transit, PocketBase data at rest, Redis queue contents)
- DPA in place: yes (DigitalOcean DPA)
- Sub-processors: DigitalOcean's own infra
- Credentials: DigitalOcean dashboard (operator only)
- Incident runbook: <!-- TODO: confirm — likely "DO status + Coolify dashboard restart" -->
- Alternatives evaluated: Hetzner, AWS EC2, Linode
- Last reviewed: TBD
- Notes: single droplet is a single point of failure for the entire backend; flag for review when paid usage justifies HA

### Coolify (self-hosted)
- Service: container orchestration on the DigitalOcean droplet
- Role: backend deploys, PocketBase + Redis + backend Docker containers, env var management
- Criticality: **P0**
- Plan: self-hosted OSS — no licence cost
- Monthly cost: $0 (cost is the DO droplet line above)
- Renewal: N-A
- Lock-in level: **low** — Coolify is a deploy wrapper around Docker Compose; the underlying Compose stack is portable
- Data processor: no (orchestrator only; data passes through the containers it manages)
- DPA in place: N-A
- Sub-processors: N-A
- Credentials: Coolify dashboard on the droplet (operator only); backend env vars stored here — `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_PUBLISHER`, `POCKETBASE_ADMIN_EMAIL`, `POCKETBASE_ADMIN_PASSWORD`, `LULU_CLIENT_KEY`, `LULU_CLIENT_SECRET`, `LULU_SANDBOX`, `FRONTEND_URL`, `RESULT_STORE_*`
- Incident runbook: <!-- TODO: confirm — likely "SSH into droplet, restart Coolify service, redeploy stack" -->
- Alternatives evaluated: Dokku, plain Docker Compose, Render
- Last reviewed: TBD
- Notes: env-var leakage risk concentrates here; review access list each quarter

### Cloudflare
<!-- TODO: confirm DNS provider — likely Cloudflare based on common stack but not verified in repo. Check DNS records for pageperfect.studio and pb.pageperfect.studio. -->
- Service: DNS, CDN, optional WAF
- Role: domain resolution for `pageperfect.studio` and `pb.pageperfect.studio`; TLS termination
- Criticality: **P0**
- Plan: <!-- TODO: confirm — Free / Pro -->
- Monthly cost: <!-- TODO: confirm -->
- Renewal: monthly
- Lock-in level: **low** for DNS; **medium** if WAF rules are tuned
- Data processor: yes (edge request logs)
- DPA in place: yes (Cloudflare DPA + AUP)
- Sub-processors: Cloudflare's own infra
- Credentials: Cloudflare dashboard (operator only)
- Incident runbook: <!-- TODO: confirm -->
- Alternatives evaluated: Route 53, registrar-native DNS
- Last reviewed: TBD
- Notes: SSL is automatic through Cloudflare's edge if proxy is enabled

---

## Data + queue (self-hosted, behind Coolify)

### PocketBase
- Service: primary database + auth for users, manuscripts, sessions
- Role: source of truth for user records (`tier`, `stripe_customer_id`, `stripe_subscription_id`, `publisher_window_end`) and manuscript records
- Criticality: **P0**
- Plan: self-hosted OSS — no licence cost
- Monthly cost: $0 (rides the DO droplet)
- Renewal: N-A
- Lock-in level: **medium** — SQLite under the hood is portable; the PocketBase admin API and auth flows are not
- Data processor: yes (operator-controlled, on our infra)
- DPA in place: N-A (self-hosted; the operator is the processor)
- Sub-processors: N-A
- Credentials: `POCKETBASE_ADMIN_EMAIL`, `POCKETBASE_ADMIN_PASSWORD` (backend env, never frontend); admin UI at `https://pb.pageperfect.studio/_/`
- Incident runbook: <!-- TODO: confirm backup cadence and restore procedure -->
- Alternatives evaluated: Supabase, plain Postgres + Auth.js
- Last reviewed: TBD
- Notes: **Verified 2026-05-14:** collections in use are `users`, `manuscripts`, `print_orders`, and the built-in `_superusers` auth collection. Backend grep across `backend/` for `/api/collections/<name>` shows: `users` (records + auth-refresh; touched by `routes/stripe.js`, `routes/lulu.js`, `compile-worker.js`, `index.js`), `manuscripts` (records — sweeper at `index.js:356/365`), `print_orders` (records — `routes/lulu.js:91/114/125` for Lulu order tracking), `_superusers` (auth-with-password for admin token, `compile-worker.js:142`, `index.js:341`). No separate `purchases` collection; purchase state (`tier`, `stripe_customer_id`, `stripe_subscription_id`, `publisher_window_end`) lives on the `users` record per `routes/stripe.js:43-44`.

### Redis (self-hosted)
- Service: BullMQ queue + entitlements result-store cache
- Role: compile job queue between Express + workers; per-manuscript Publisher window tracking (`backend/entitlements.js`)
- Criticality: **P0** — without Redis the backend falls back to sync compile, which serialises every request
- Plan: self-hosted OSS — no licence cost
- Monthly cost: $0 (rides the DO droplet)
- Renewal: N-A
- Lock-in level: **low** — standard Redis, queue contents are ephemeral
- Data processor: yes (manuscript IDs and metadata briefly in queue)
- DPA in place: N-A
- Sub-processors: N-A
- Credentials: Coolify env vars (operator only)
- Incident runbook: <!-- TODO: confirm — likely "Coolify restart Redis container; sync fallback should keep core paths alive" -->
- Alternatives evaluated: none (Redis is the BullMQ requirement)
- Last reviewed: TBD
- Notes: persistence configuration <!-- TODO: confirm AOF vs RDB; queue data loss tolerance is acceptable, entitlements cache should be durable -->

---

## Payments

### Stripe
- Service: card payments (Payment Element flow)
- Role: one-time charges for Publisher ($19.99 per manuscript) and Studio ($199 lifetime); webhook drives tier upgrades and Publisher-window activation
- Criticality: **P0**
- Plan: standard
- Monthly cost: per-transaction (~2.9% + $0.30); no monthly base
- Renewal: per-transaction
- Lock-in level: **high** — customer IDs, payment history, dispute records all live in Stripe
- Data processor: yes (payment data)
- DPA in place: yes (Stripe DPA)
- Sub-processors: per Stripe sub-processor list
- Credentials: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_PUBLISHER` on backend (Coolify); `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_STRIPE_PRICE_PUBLISHER`, `NEXT_PUBLIC_STRIPE_PRICE_STUDIO` on frontend (Vercel)
- Incident runbook: see `billing-sops.md` SOPs; webhook handler at `backend/routes/stripe.js`; signature verification via `stripe.webhooks.constructEvent`
- Alternatives evaluated: none (Stripe is incumbent)
- Last reviewed: TBD
- Notes: PCI compliance handled by Stripe (no card data touches our infra); webhook handlers reviewed via `webhook-review`. Tier IDs in webhook payloads use `publisher` and `studio`; backend rejects unknown tiers. <!-- TODO: confirm whether Studio uses a separate price ID env var; only STRIPE_PRICE_PUBLISHER appears in PROJECT.md -->

---

## Print + fulfilment

### Lulu xPress
- Service: print-on-demand fulfilment for users who want physical copies
- Role: optional outbound integration from `backend/lulu.js`; OAuth 2.0 client_credentials against production and sandbox endpoints
- Criticality: **P1** — print is optional; outage degrades a feature but does not break the core compile pipeline
- Plan: API access — pay per print job
- Monthly cost: per-order (no monthly base)
- Renewal: per-use
- Lock-in level: **medium** — Lulu has competitors (BookVault, KDP Print) but each has different cover spec maths; switching = retest every template
- Data processor: yes (recipient shipping address, manuscript PDF)
- DPA in place: <!-- TODO: confirm Lulu DPA on file -->
- Sub-processors: per Lulu sub-processor list
- Credentials: `LULU_CLIENT_KEY`, `LULU_CLIENT_SECRET`, `LULU_SANDBOX` (backend env, Coolify)
- Incident runbook: <!-- TODO: confirm — likely "check Lulu status page; fall back to manual quote workflow" -->
- Alternatives evaluated: <!-- TODO: list -->
- Last reviewed: TBD
- Notes: sandbox vs production toggled by `LULU_SANDBOX`; never bill a user without first confirming the env

---

## Email + comms

### Resend
- Service: transactional email (and any marketing email we send)
- Role: transactional email — auth (password reset, verification), receipts, support replies. **Confirmed 2026-05-14:** Resend is PagePerfect's transactional email provider. <!-- TODO: locate calling code — `RESEND_API` is named in PROJECT.md env vars but the actual send calls were not located in the M4 audit. Likely under `frontend/src/lib/` or a `backend/` helper. -->
- Criticality: **P1**
- Plan: <!-- TODO: confirm -->
- Monthly cost: <!-- TODO: confirm -->
- Renewal: monthly
- Lock-in level: **low** — generic transactional API
- Data processor: yes (recipient address, message content)
- DPA in place: <!-- TODO: confirm Resend DPA on file -->
- Sub-processors: per Resend sub-processor list
- Credentials: `RESEND_API` (frontend env on Vercel per PROJECT.md — <!-- TODO: confirm whether backend also sends via Resend -->)
- Incident runbook: <!-- TODO: confirm -->
- Alternatives evaluated: Postmark, SES, Loops
- Last reviewed: TBD
- Notes: PECR / GDPR rules for any marketing email — only contacts who consented or B2B with proper grounds

---

## Source control + CI

### GitHub
- Service: git hosting + Actions CI + Issues + Discussions
- Role: source of truth for repo, CI on push, Issues for support intake and engineering planning
- Criticality: **P1**
- Plan: <!-- TODO: confirm — Free / Pro / Team -->
- Monthly cost: <!-- TODO: confirm -->
- Renewal: monthly
- Lock-in level: **medium** — git itself is portable; Issues / Actions / Discussions configuration needs migration
- Data processor: yes (contributor data, Issues content)
- DPA in place: yes (GitHub DPA available)
- Sub-processors: Microsoft Azure
- Credentials: per-developer accounts; deploy keys / tokens stored in Vercel and Coolify
- Incident runbook: <!-- TODO: confirm — likely "GitHub status page + hold deploys" -->
- Alternatives evaluated: GitLab, Codeberg
- Last reviewed: TBD
- Notes: branch protection on `main`; conventional commits per `.gitmessage`

---

## Observability

### Pino (in-process)
- Service: structured logging library inside the Node backend (`backend/logger.js`)
- Role: structured JSON logs from compile workers, Express routes, Stripe webhook handler
- Criticality: **P2** — log loss is recoverable; not on the request path
- Plan: OSS — no licence cost
- Monthly cost: $0
- Renewal: N-A
- Lock-in level: **low** — Pino output is portable JSON
- Data processor: no (in-process; ships to stdout / wherever Coolify pipes it)
- DPA in place: N-A
- Sub-processors: N-A
- Credentials: N-A
- Incident runbook: N-A
- Alternatives evaluated: Winston, native console
- Last reviewed: TBD
- Notes: log retention depends on whatever ingests stdout from Coolify — see external observability entry below

### External log / error sink
**Confirmed 2026-05-14:** No external log sink configured. Backend Pino logs emit JSON to stdout; Coolify captures container stdout only. Retention horizon is bounded by Coolify's stdout retention setting (operator to confirm exact retention window). No Sentry / Logtail / Datadog at this time. If error volume or post-incident triage demands change, Sentry is the recommended next add (industry default for Node + Next.js).
- Service: none (Pino → stdout → Coolify container logs)
- Role: log retention beyond Coolify container lifetime; error alerting
- Criticality: **P2**
- Plan: <!-- TODO: confirm -->
- Monthly cost: <!-- TODO: confirm -->
- Renewal: <!-- TODO: confirm -->
- Lock-in level: low
- Data processor: yes (log events, error events)
- DPA in place: yes if used
- Credentials: <!-- TODO: confirm -->
- Notes: error events must be PII-scrubbed before send — manuscript text must never leave the perimeter through error logs

---

## Domain + SSL

### Domain registrar
<!-- TODO: confirm registrar for pageperfect.studio (Namecheap / Porkbun / Cloudflare Registrar / Squarespace) -->
- Service: domain registration
- Role: ownership of `pageperfect.studio`
- Criticality: **P0**
- Plan: annual
- Monthly cost: <!-- TODO: confirm annual cost -->
- Renewal: annual
- Renewal date: <!-- TODO: confirm — high priority; domain expiry is irrecoverable in a short window -->
- Lock-in level: low
- Data processor: no
- DPA in place: N-A
- Credentials: registrar dashboard (operator only); 2FA required
- Incident runbook: registrar dashboard renewal screen
- Last reviewed: TBD
- Notes: auto-renew should be on; verify the credit card on file is current

### SSL
- Service: TLS certificates
- Role: HTTPS for `pageperfect.studio` and `pb.pageperfect.studio`
- Criticality: **P0**
- Plan: likely automatic through Cloudflare edge proxy <!-- TODO: confirm whether origin certs (Coolify / Caddy / Let's Encrypt) are also in play -->
- Monthly cost: $0
- Renewal: automatic
- Lock-in level: low
- Notes: if Cloudflare proxy is disabled for any subdomain, that subdomain needs a separate cert path

---

## AI / dev tools

### Anthropic (Claude Code)
- Service: Claude Code CLI and Claude API for the managed-agent / skill system
- Role: developer tooling for engineering, content, design, ops — not a production runtime dependency for users
- Criticality: **P2** — outage slows internal work, does not affect production
- Plan: <!-- TODO: confirm — usage-based -->
- Monthly cost: usage-based
- Renewal: per-use
- Lock-in level: **medium** — model APIs portable, skill framework is Claude-specific
- Data processor: yes (Claude API processes prompt content)
- DPA in place: yes (Anthropic Commercial Terms + DPA)
- Sub-processors: per Anthropic sub-processor list
- Credentials: per-developer API key
- Last reviewed: 2026-05-14
- Notes: no production user data flows to Claude through this path; skills under `.claude/skills/` are Claude Code-native

---

## Vendors removed in this rescope (audit trail)

- **Neon (Postgres)** — never used by PagePerfect. PocketBase is the database. Removed 2026-05-14.
- **Coinbase Commerce** — never adopted by PagePerfect. Was an AG-specific entry imported from the kit. Removed 2026-05-14.

## Vendors evaluated and rejected

_None recorded for PagePerfect yet. Add as `vendor-review` produces decline rationales._

## Renewal calendar

See `ops-calendar.md` for renewal date list. `vendor-review` runs ≥30 days before any annual renewal to leave time for negotiation or switch.

## Sub-processor disclosure

The DPA page <!-- TODO (sharpened 2026-05-14): no `frontend/src/app/(site)/dpa/` directory exists. Current `(site)` routes are auth, cookies, docs, journal, philosophy, pricing, privacy, site-directory, status, terms. `legal-page-draft` owns drafting a new DPA at `frontend/src/app/(site)/dpa/page.tsx` — sub-processor list below is the source content for it. --> lists sub-processors. Adding a vendor that processes user data requires:

1. Vendor entry here.
2. `legal-page-draft` updates DPA.
3. `legal-page-draft` updates Privacy Policy if a new category of processing.
4. #24 sign-off.
5. User notification per DPA terms (typically 30 days for material changes).

## Maintenance

- Operator updates this register on every vendor change.
- `vendor-review` proposes updates; operator commits.
- Quarterly full sweep by `vendor-review`.
- Annual contract review by #9 + operator.

## Changelog

- 2026-05-14: Rescoped from AG vendors (Neon Postgres / wallet-monitoring SQL) to PagePerfect vendors (PocketBase / Stripe / Lulu / Coolify / DigitalOcean) and PocketBase-admin-SDK-based SOPs. TODOs flag items needing operator confirmation.
