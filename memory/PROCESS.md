# PROCESS

## TL;DR

1. **Plan first.** Outline files, approach, steps before writing code.
2. **600-line limit.** No single code, markdown, or HTML file over 600 lines. Split if needed.
3. **Conserve tokens.** Terse. No re-reads. No restating. Batch independent tool calls. Prefer `Edit` over `Write`.
4. **Convene the Standing Council.** Reason through every non-trivial change through the relevant members' lenses.

## Workflow Rules (expanded)

### 1. Plan first
Before making any code changes, outline a plan: identify affected files, describe the approach, list the steps. Only start implementation after the plan is clear. For large tasks use `TodoWrite` to track progress.

### 2. 600-line limit
Do not exceed 600 lines in any single code, markdown, or HTML file. If a file would exceed this limit, split it into multiple files or modular parts. This limit also applies to files in `memory/` and `projects/`.

### 3. Conserve tokens
- Don't re-read files you've already read in the session.
- Don't restate what the user said.
- Don't pad responses with explanations the user didn't ask for.
- Batch independent tool calls in a single message.
- Prefer surgical `Edit`s over full-file `Write`s.
- Skip exploratory searches when the path is already known.

### 4. Convene the Standing Council
Any non-trivial change — code, copy, documentation, architecture, naming, APIs, schemas, infrastructure — must be informed by the relevant Standing Council members. You do not need to literally roleplay each member, but you must reason through the change as if each relevant member has reviewed it.

If a domain isn't represented (e.g. regulatory area not covered, or shipping in a language with no expert), **add a new council member** rather than skip the perspective. The minimum council size is 17; new specialists can be added when needed but never removed.

## Standing Council

| # | Role | Domain of authority |
|---|------|---------------------|
| 1 | Editor-in-chief / technical writer | Structure, tone, density, narrative flow |
| 2 | Open source / community maintainer | Contribution pathways, licensing, community health |
| 3 | Typography & typesetting expert | Baseline grids, leading, kerning, hyphenation, optical alignment, Müller-Brockmann grid fidelity, golden-ratio scale claims |
| 4 | Security engineer | Threat model, disclosure policy, secrets, CSP, auth, LaTeX injection surface, sandboxing |
| 5 | Product marketing | Positioning, tier story, value proposition, segment messaging |
| 6 | B2B / API economy expert | Developer onboarding, OpenAPI, SDK ergonomics, key tiers |
| 7 | Visual designer | Hierarchy, Swiss-Ogilvy specimen palette (cream/ink/red accent), sharp geometry, type-dominant layouts |
| 8 | Accessibility specialist (**veto power**) | WCAG AA compliance, semantic structure, contrast, motion safety |
| 9 | Lawyer / compliance counsel | License accuracy, no false promises, GDPR, advertising-claim exposure |
| 10 | DevOps / SRE | Deployment, observability, env vars, rollout safety, Coolify/Vercel split, incident response |
| 11 | Investor / founder voice | Fundability signal, banned-phrases purge, commercial intent |
| 12 | Ecosystem strategist | Competitive positioning vs. Vellum/Atticus/InDesign, partnerships, distribution channels |
| 13 | UX writer | Microcopy, copy-pasteable quickstarts, error messages, compile-failure translation |
| 14 | DX engineer | Working code samples, install ergonomics, package taxonomy |
| 15 | Staff engineer / architect | Code design, scalability, tech-debt management, abstractions |
| 16 | QA / test engineer | Coverage, regressions, edge cases, golden-file PDF regression strategy |
| 17 | Performance engineer | Bundle size, Core Web Vitals, runtime cost, Lighthouse, compile p95 |
| 18 | Database engineer / DBA | PocketBase schema safety, migration safety, query plans, retention rules |
| 19 | Privacy / GDPR specialist | Data handling, manuscript retention (session-scoped), user rights, cross-border transfer |
| 20 | Brand copywriter | Voice, tone, narrative arc, headline craft, emotional resonance |
| 21 | Technical copywriter | Accuracy of claims, precision in feature descriptions, no hand-waving |
| 22 | Conversion copywriter | CTA copy, landing page persuasion, objection handling, urgency without hype |
| 23 | Regulatory / compliance counsel | Advertising standards, jurisdictional risk, accurate "KDP-compliant" claims |
| 24 | Data protection / privacy lawyer (**veto power on privacy copy**) | GDPR Article-level accuracy, cookie consent language, DPA enforceability |
| 25 | AI image director | Prompt engineering for image generation — model selection, style consistency, negative prompts, composition |
| 26 | Visual brand photographer | Image-text coherence, editorial photography direction, colour grading, crop/composition for card layouts |
| 27 | Senior prompt engineer (photorealism) | Concrete subject matter, composition rules, lighting direction, camera angle, depth of field |
| 28 | Senior prompt engineer (brand systems) | Prompt-to-brand consistency, colour palette enforcement through prompt language, series cohesion |
| 29 | Art Director | Series cohesion across generated image sets. Enforces consistent background temperature, materiality, lighting, colour grade |
| 30 | Payment systems engineer | Stripe, PCI compliance, webhook reliability, subscription lifecycle, one-time vs lifetime billing models |
| 31 | Typst / PDF engineer | Pandoc-to-Typst conversion pipeline, Typst show-rule semantics, font fallback chains, Ghostscript PDF/X-1a conformance, layout-sanity stderr parsing (legacy LaTeX/microtype knowledge retained for the residual Pandoc step and the LaTeX-flavoured injection sanitizer) |
| 32 | Book publishing / print-ops expert | KDP, IngramSpark, Lulu xPress, trim/bleed/gutter math, cover dimensions, spine width, ICC profiles, offset vs print-on-demand |
| 33 | Backend engineer (Node.js/Express) | API routes, BullMQ queue management, PocketBase admin flows, caching, sandboxed Pandoc + Typst spawn, cluster.js / worker.js process topology, result-store.js backend selection, error handling |
| 34 | Full-stack debugging engineer | End-to-end request tracing, compile-pipeline failure modes, timeout handling, error propagation, production debugging |
| 35 | Product analyst | Evidence-first metrics, experiment rigor, funnel analysis, hypothesis/result discipline, aggregated-only data handling |
| 36 | Operations manager | Support triage, docs coherence, finance snapshots, vendor review, internal coordination, incident post-mortems |
| 37 | Motion engineer / designer | Easing curve selection, duration policy, reduced-motion contracts, stagger discipline, view-transition orchestration, asymmetric press timing, performance-aware animation |

## Sub-councils

Specialist groups convened **in addition to** the Standing Council for their domain.

- **Design Council (6)** — Visual (#7), Motion (#37), UX (#13), Systems (#15), Accessibility (**veto power**, #8), Performance (#17). Convened for visual / motion / system design work. Maps to the Swiss-Ogilvy specimen system documented in `projects/pageperfect/DESIGN.md`.
- **Copy Council (3)** — #20 Brand, #21 Technical, #22 Conversion. Convened for any user-facing copy: marketing pages, legal pages, emails, microcopy, blog posts. Every sentence must survive all three lenses: does it sound right (#20), is it accurate (#21), does it move the reader (#22)?
- **Legal Council (3)** — #9 Lawyer/compliance, #23 Regulatory, #24 Data protection. Convened for legal pages, privacy policy, terms, consent copy, and any claim (e.g. "KDP-compliant", "professional typography") that could create liability. #24 has **veto power** on privacy/consent language.
- **Typography Council (3)** — #3 Typography expert, #31 Typst/PDF engineer, #32 Book publishing expert. Convened for grid-system changes, template additions/edits, page-size or margin-preset additions, font-registry changes, and any claim about typographic quality.

## Rules of operation

1. The council is consulted in spirit, not in literal roleplay. You reason through the change as the relevant members would.
2. The Accessibility specialist (#8) holds a **veto** on anything that would degrade WCAG AA compliance, semantic structure, contrast, or motion safety.
3. The Investor / founder voice (#11) is the gatekeeper for the banned-phrases list (see `memory/VOICE.md`). Any copy that fails their review must be revised before shipping.
4. The Data protection lawyer (#24) holds a **veto** on privacy policy, consent copy, and data handling language. No privacy-related copy ships without their sign-off.
5. The Typography Council holds a **veto** on any change that would weaken a typographic-quality claim made in marketing (e.g. baseline-grid conformance, golden-ratio scale, KDP-ready output).
6. Adding a new council member is allowed and encouraged when a domain isn't represented. Removing a member is not.
7. The minimum council size is 17. The current size is 37.
8. Sub-councils do not replace the Standing Council. They operate *in addition to* it for their domains.

## Changelog

- 2026-04-14: Split from `CLAUDE.md`. No content change. (Origin: master-build-kit upstream.)
- 2026-04-14: Added council members for Blockchain/Node backend/full-stack debugging. (Upstream commit `31e6556`.)
- 2026-04-16: Added Product analyst (#35) and Operations manager (#36).
- 2026-05-13: Scoped to PagePerfect. Replaced Web3/DeFi (#3), Crypto payments (#31), Blockchain EVM (#32) seats with Typography (#3), LaTeX/PDF (#31), Book publishing (#32). Updated #7 Visual designer, #10 DevOps, #13 UX writer, #16 QA, #18 DB, #19 Privacy, #23 Regulatory, #30 Payments, #33 Backend descriptions to reflect PagePerfect's stack (PocketBase, Coolify/Vercel, BullMQ, Pandoc/LuaLaTeX, session-scoped manuscripts). Added Typography Council sub-council with veto on typographic-quality claims.
- 2026-05-14: Renamed seat #31 from "LaTeX/PDF engineer" to "Typst/PDF engineer" per ADR-0001 (LuaLaTeX → Typst migration). Updated seat #33 description to include cluster.js / worker.js / result-store.js. LaTeX-flavoured injection-sanitizer scope retained at seat #16 (Security) because Pandoc's `-raw_tex` flag is still the input boundary.
- 2026-05-14: Added Motion engineer (#37) seat to retire the AG-residual "Idris" placeholder. Motion now formally represented in both the Standing Council and the Design sub-council.
- 2026-05-14: Retired remaining AG-residual character names ("Sable", "Kael") from Design Council sub-council line in favour of seat numbers (#13 UX, #15 Systems). Standing Council now uses pure seat-number references throughout.
