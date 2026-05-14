# Stale audit — 2026-05-14

## P0 — broken (fix this turn)

### 1. ARCHITECTURE.md is out of date — Typst migration undocumented
- Evidence: test files exist for `drop-cap-typst`, `heading-variants-typst`, `watermark-typst`, `typst-error-translator`. Backend modules `entitlements.js`, `result-store.js`, `cluster.js`, `worker.js`, `layout-sanity-checker.js` exist but are not in ARCHITECTURE.md.
- Impact: every doc, skill, and CLAUDE.md instance referencing "Pandoc + LuaLaTeX" is potentially misleading. Affects build-feature, fix-bug, debug-prod-incident, security audits, all of marketing copy.
- Action: Rewrite `projects/pageperfect/ARCHITECTURE.md` and `projects/pageperfect/PROJECT.md` Tech Stack section. Update CLAUDE.md backup notes. Possibly write an ADR (`projects/pageperfect/decisions/0001-typst-migration.md`).
- Routing: User-authored (Typography Council #31 LaTeX/PDF engineer must own this). `writer` skill can draft once you give the Typst-vs-Pandoc rationale.

### 2. `-raw_tex` flag is in `index.js`, not `compile-worker.js`
- Evidence: `backend/index.js:429-432` has the Pandoc invocation. `compile-worker.js` is referenced in docs but the actual flag location differs.
- Impact: Docs lie about where security-critical code lives. Affects audit traceability.
- Action: Trace the actual compile pipeline. Either move the flag back to `compile-worker.js` (per docs) or update docs (`ARCHITECTURE.md`, security-posture.md) to reflect that compilation now goes through `index.js`.

### 3. Dead path references in memory + skills (AG residuals)
- 15 paths in memory/marketing/, memory/compliance-risk/, .claude/skills/ point at `src/components/Container.tsx`, `src/lib/utils.ts`, etc. — AG's flat layout. PagePerfect uses `frontend/src/`.
- Action: `stale-detector` finds these. Fix via `writer` or `skill-creator` editing each file. Or wait for full skill-coherence-audit.

## P1 — drift (fix this sprint)

### 4. AG-residual content in 30 files
Top offenders by count:
| File | Hits |
|---|---|
| `memory/marketing/seo.md` | 5 |
| `.claude/skills/write-migration/SKILL.md` | 5 |
| `memory/marketing/audiences.md` | 4 |
| `.claude/skills/listing-submission/SKILL.md` | 4 |
| `.claude/skills/seo/SKILL.md` | 3 |
| `.claude/skills/security-claim-audit/SKILL.md` | 3 |
| `.claude/skills/market-research/SKILL.md` | 3 |
| `.claude/skills/claim-review/SKILL.md` | 3 |
| `memory/marketing/brand.md` | 2 |
| `memory/compliance-risk/claims-register.md` | 2 |
| ...+18 more files with 1–2 hits each |

Patterns: `viem`, `drizzle`, `wallet-security`, `Permit2`, `27 chains`, `ERC-20`, `EIP-712`, `non-custodial`.

- Action: Use `skill-creator` or batch sed to scope each. Marketing/compliance memory files are the highest-leverage targets — they propagate to skill output.
- Note: `.claude/skills/stale-detector/SKILL.md` shows 4 hits — those are intentional (the skill's "what to scan for" section lists AG-isms as detection targets). False-positive. Add to audit exemptions.

### 5. `write-migration` still references Drizzle ORM
- PagePerfect uses PocketBase, not Drizzle. The migration skill is in the wrong shape.
- Action: Rewrite `write-migration/SKILL.md` for PocketBase schema migrations (the `migrations` collection or admin API).

## P2 — decay (fix this quarter)

### 6. ISO dates referenced — all current/past
- Dates found: 2026-02-22, 2026-02-27, 2026-04-09, 2026-04-12, 2026-04-14, 2026-04-15, 2026-04-16, 2026-04-17, 2026-05-13. All historical references in changelogs / TRANSFORMATION_COUNCIL.md / kit upstream changelog.
- No expired deadlines or freeze dates. Clean.

### 7. TODO/FIXME markers
- Only one: `memory/OUTPUT.md:49` is a rule *about* TODOs, not an actual TODO. Clean.

## P3 — informational

### 8. Many backend modules are undocumented in ARCHITECTURE.md
- New since the docs were written: `entitlements.js`, `result-store.js`, `cluster.js`, `worker.js`, `layout-sanity-checker.js`, plus the `-typst` family.
- Action: Folded into the P0 ARCHITECTURE rewrite.

## Summary

- Files scanned: 14 memory files + 50 skill files + 6 project doc files + 5 root .md = **75 files**
- Total findings: **P0: 3, P1: 2, P2: 2, P3: 1** = **8 categories** spanning 30+ individual file fixes
- Top drift area: **`projects/pageperfect/ARCHITECTURE.md` vs reality** (Typst migration) + **AG residuals in marketing/compliance memory**
- Recommended skill handoffs:
  - `writer`: 6 items (memory text fixes)
  - `skill-creator`: 28 items (skill SKILL.md fixes — could batch as a "scope-to-PagePerfect" pass)
  - User-authored: 2 items (ARCHITECTURE rewrite, `-raw_tex` location ADR)

## What's NOT broken (verified during audit)

- No expired dates
- No real TODO/FIXME backlog
- No decorative imagery on `(site)/` pages (brand discipline holds)
- No `(site)/` files with non-zero `border-radius` in scope (canon holds)
