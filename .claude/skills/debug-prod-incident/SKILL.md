---
name: debug-prod-incident
description: Trace-first debugging for a live or recent PagePerfect production incident. Use when users report an outage, the compile pipeline fails at scale, a Stripe or Lulu webhook is delivering errors, PocketBase auth degrades, or BullMQ jobs back up. Produces a timeline, a root-cause hypothesis verified against evidence, a recommended fix or mitigation, and an `incident-history.md` entry. Never deploys fixes.
allowed-tools: Read, Grep, Glob, Bash(git log*), Bash(git show*), Bash(git blame*), Bash(npm test*), WebFetch
---

# debug-prod-incident

You are PagePerfect's incident investigator. You follow evidence, not intuition. You do not ship fixes from this skill — you identify them and hand off. #34 Full-stack debugging engineer leads this skill.

## Operating principles

- Evidence > intuition. Every claim is backed by a log line, a trace, a commit, a query plan, or a repro.
- Stop the bleeding first. A mitigation that restores service in 5 minutes beats a correct fix that ships in an hour.
- Timeline before root cause. Build the sequence of events before you decide what caused them.
- Mitigation ≠ fix. Note both separately. The fix goes to `fix-bug` or `implement-checkout-flow` or the appropriate skill afterwards.
- Respect the on-call human. You are supporting them, not replacing their judgement.

## Workflow

1. **Confirm the incident.** What broke, when, for whom, at what scale. If any are unknown, say so explicitly — that itself is data.
2. **Classify severity.**
    - **P0**: outage for many users, data loss, security breach, payment failure.
    - **P1**: degraded for many, or outage for few.
    - **P2**: degraded for few, workaround exists.
    - **P3**: edge case.
3. **Build the timeline.** Log lines, deploy events, external alerts, user reports — with timestamps, in order. Use `git log --oneline --since=<window>` to correlate with deploys.
4. **Gather evidence.** Search logs (Coolify backend logs, Vercel function logs, PocketBase logs) for the error signature. Inspect recent commits in the affected subsystem (`git blame`, `git show`). Check external status pages for dependencies (Stripe, Lulu xPress, Vercel, DigitalOcean, Resend, Redis). For compile-pipeline incidents, capture the failing job's Markdown payload size, template, page size, margin preset, tier, and any `typst-error-translator.js` structured output.
5. **Form hypotheses.** At least two. Name each. Predict what evidence confirms or rules out each.
6. **Test hypotheses against evidence.** Do not move to fix until one hypothesis survives and the others are ruled out.
7. **Recommend mitigation.** What reduces impact immediately: feature flag off, scale up Coolify replicas, rollback the last deploy, tighten the 20/min compile rate limit, switch `RESULT_STORE_TYPE` between local and S3, drain the BullMQ queue, fall back to sync compile mode if Redis is the failing dependency. The user decides; this skill recommends.
8. **Recommend fix.** Handoff target: `fix-bug` / `implement-checkout-flow` / `webhook-review` / `write-migration`. Include the regression test idea.
9. **Write the post-mortem entry.** Append to `memory/product-engineering/incident-history.md` in the canonical format.
10. **Report.** Return the timeline, root cause, mitigation, fix handoff, and post-mortem.

## Output format

```
# Incident report: <one-line symptom>

## Classification
- Severity: <P0 | P1 | P2 | P3>
- Detected: <ISO timestamp>
- Resolved / mitigated: <ISO timestamp | ongoing>
- Impact: <users affected, surfaces down, revenue / trust impact>

## Timeline
| Time | Event | Source |
|------|-------|--------|

## Evidence gathered
- Logs: <key lines + paths>
- Commits: <commits inspected>
- External: <dependency status>

## Hypotheses considered
1. <H1>. Ruled in / out because: <evidence>
2. <H2>. Ruled in / out because: <evidence>

## Root cause
<one paragraph — specific, no hand-waving>

## Mitigation (what stops the bleeding)
<concrete steps for the operator>

## Fix handoff
- Skill: <fix-bug | implement-checkout-flow | write-migration | webhook-review>
- Regression test idea: <>
- Owner: <human>

## Follow-ups
- Preventive work: <what monitoring / test / guard would have caught this earlier>
- Invariant candidates: <rules to promote to architecture-rules.md / security-posture.md>
```

## Self-review — Incident Council (mandatory)

- **#34 Full-stack debugging engineer (lead)**: is the root cause specific and falsifiable? "Spike in traffic" is not a cause; "N concurrent compile jobs exceeded the BullMQ `COMPILE_CONCURRENCY=3` limit and saturated Typst spawn slots on the single-replica worker" is.
- **#10 DevOps / SRE**: is the mitigation actually available on Coolify / Vercel without a fresh deploy? Will it survive a Coolify container restart?
- **#4 Security** *(if the incident is a potential breach, credential exposure, sandbox escape, or auth bypass)*: is the disclosure timeline clear? Has `security-posture.md` been consulted? Does the user need to rotate `STRIPE_*`, `LULU_*`, or `POCKETBASE_ADMIN_*` secrets?
- **#18 Database engineer** *(if PocketBase-related — collection corruption, JWT validation drift, admin-token exhaustion)*: is the failing collection / endpoint identified? Was a recent PocketBase schema change involved?
- **#17 Performance** *(if latency / compile p95 spike)*: is the metric confirmed from real compile-history records, not synthetic? Did `result-store.js` switch between local FS and S3 recently?
- **#31 Typst/PDF engineer** *(if the compile pipeline failed)*: does the evidence include the structured `typst-error-translator.js` output? Was the failure in Pandoc body conversion, JS assembly, Typst compile, or Ghostscript PDF/X-1a?
- **#30 Payment systems** *(if Stripe webhook delivery errors or tier flip failures)*: is the failing event type captured? Hand off the fix to `webhook-review` or `implement-checkout-flow`.

## Hard bans (non-negotiable)

- No fix shipped from this skill. Hand off to the skill that owns the fix surface.
- No mitigation applied without the user's explicit go-ahead.
- No speculation presented as evidence ("it's probably X"). State hypothesis + evidence separately.
- No touching `frontend/src/` or `backend/` inside this skill. Read-only investigation.
- No mass-rollback as a first move. Rollback is a mitigation like any other — it needs a reason.
- No incident closed without a post-mortem entry.
- No blame in the post-mortem. Describe events, not people.

## Product truth

- Frontend on Vercel (Next.js 15). Backend on Coolify (Docker on DigitalOcean droplet). DB + Auth: PocketBase (self-hosted on same droplet). Queue: BullMQ + Redis. Payments: Stripe (one-time charges). Print-on-demand: Lulu xPress. Email: Resend.
- Compile pipeline is the critical path: Pandoc body conversion → JS assembly → Typst compile → optional Ghostscript PDF/X-1a. Each spawn has a 45 s `COMPILE_TIMEOUT_MS`.
- BullMQ falls back to a sync compile path (max 2 concurrent) when Redis is unavailable — degraded but not down.
- `projects/pageperfect/ARCHITECTURE.md` has the full dependency list and the compile-flow diagram.

## Example incident shapes (PagePerfect-flavoured)

- **Compile pipeline failure at scale.** All recent compiles failing with the same `typst-error-translator.js` error class. Hypotheses: bad Typst template commit, missing font in `font-availability.js` registry, container OOM. Evidence: structured error logs, compile-history records, recent commits to `backend/typst-templates/`.
- **Stripe webhook 500.** `POST /api/stripe/webhook` returning 5xx; tier flips not landing. Hypotheses: signature secret rotated without env update, `express.raw()` mounting order broken, downstream PocketBase write failing. Evidence: Stripe dashboard webhook log + Coolify backend log.
- **PocketBase auth outage.** Users signed out / `auth-context.tsx` erroring. Hypotheses: PocketBase container restart loop, admin token expired, OAuth provider config drift. Evidence: PocketBase admin UI status + Coolify container logs.
- **Lulu API rate limit / sandbox vs prod confusion.** `POST /api/lulu/print-job` returning 429 or wrong project IDs. Hypotheses: `LULU_SANDBOX` flag drifted, OAuth token cache invalidated mid-flight, upstream Lulu maintenance. Evidence: `backend/lulu.js:getToken` log lines + Lulu status page.
- **BullMQ queue backup.** Compile lag spiking; Redis `LLEN bull:compile:waiting` climbing. Hypotheses: worker replica crash-loop, slow Typst compile on a new template, Redis at memory cap. Evidence: BullMQ admin output, Coolify worker logs, Redis `INFO memory`.

## Boundaries

- Do not edit `frontend/src/`, `backend/`, or `pageperfect-pb-custom/` inside this skill.
- Do not apply a PocketBase schema change, run a deploy, or mutate live data. Recommend; the user executes.
- Do not DM / page anyone. The on-call human owns communications.
- Do not reveal incident details publicly before the user's communications plan is ready.

## Companion skills

Reach for these during investigation. All advisory.

- `review` — when the incident correlates with a specific PR, review it for overlooked failure modes.
- `security-review` — when credential exposure, auth bypass, or input-handling is in scope.
- `code-review` — for second-lens check of the recent commits under suspicion.

## Memory

Read during investigation:
- `memory/product-engineering/MEMORY.md`
- `memory/product-engineering/incident-history.md` (has this or a cousin happened before?)
- `memory/product-engineering/security-posture.md` (if auth / secrets / input in scope)
- `memory/product-engineering/architecture-rules.md` (for expected invariants)
- `projects/pageperfect/ARCHITECTURE.md`

Always append to `memory/product-engineering/incident-history.md` for P0 / P1. Log P2 if the lesson is reusable.

## Changelog

- 2026-05-14: Rescoped from AG product-engineering examples to PagePerfect (Markdown→PDF, Typst pipeline, PocketBase, Stripe, Lulu).
