# memory/marketing/MEMORY.md — Marketing Index

Loaded when a marketing skill is active. Standing rules + skill inventory for the marketing department.

## Standing rules (loaded with every marketing skill)

1. **No banned phrases** — see `memory/VOICE.md`. The Investor / founder voice (#11) gatekeeps the banned list.
2. **Claims must survive the Copy Council (3 lenses)** — Brand (#20) for voice, Technical (#21) for accuracy, Conversion (#22) for persuasion. Any sentence that fails any one of three goes back.
3. **Claims that could create liability go through the Legal Council** — Lawyer (#9), Regulatory (#23), Data Protection (#24, **veto on privacy copy**). Examples: "KDP-compliant," "GDPR-compliant," "professional typography."
4. **Typography quality claims go through the Typography Council** — Typography expert (#3), LaTeX/PDF engineer (#31), Book publishing expert (#32, **veto**). Examples: "baseline grid," "golden-ratio scale," "Müller-Brockmann grid."
5. **No decorative imagery** — see `projects/pageperfect/DESIGN.md` principle #1. Photography, illustration, AI-generated imagery on marketing surfaces requires explicit Design Council sign-off.
6. **Autonomy level 2** — user approves every publish, send, and `src/` edit.

## Skills owned

| Skill | Purpose |
|---|---|
| `market-research` | Competitive research, audience interviews, market sizing |
| `positioning` | Value proposition, segment messaging, tier story |
| `content-strategy` | Editorial calendar, pillar topics, content engine |
| `writer` | Long-form drafts (blog, journal, white paper) — outputs first drafts only |
| `seo` | On-page SEO, keyword strategy, internal linking |
| `seo-audit` | Audit existing pages for SEO gaps and fixes (coreyhaines) |
| `social` | Social post drafts, thread architecture |
| `outreach` | Pitch lists, outreach sequences |
| `conversion` | Landing-page conversion optimization (broad) |
| `page-cro` | Page-level CRO with specific test hypotheses (coreyhaines) |
| `paywall-upgrade-cro` | Drafter → Publisher / Studio upgrade flow CRO (coreyhaines) |
| `analytics` | Tracking setup, dashboards, measurement framework |
| `campaign-manager` | Multi-channel campaign orchestration |
| `image-direction` | Prompt-engineering for AI image generation (brand-safe) |
| `web-implementation` | Implements approved marketing copy + design into `src/` (autonomy level 2) |
| `email-sequence` | Lifecycle/nurture/onboarding email sequences (coreyhaines) |
| `launch-strategy` | Pre-launch playbook (Product Hunt, journal teasers, etc.) (coreyhaines) |
| `de-ai-ify` | Strip AI-generated tells from copy (BrianRWagner) |
| `homepage-audit` | Surface-level audit of the landing page (BrianRWagner) |
| `voice-extractor` | Extract brand voice from existing copy → write to `memory/marketing/brand.md` (BrianRWagner) |

## Memory files

| File | Purpose |
|---|---|
| `audiences.md` | Target segments + ICP |
| `brand.md` | Voice, tone, banned phrases |
| `content-history.md` | What we've shipped (so we don't repeat) |
| `experiments.md` | Active and archived marketing experiments |
| `imagery.md` | Image direction rules — when imagery is allowed (rarely), what kind |
| `metrics.md` | KPI definitions specific to marketing (overlaps with `data-intelligence/`) |
| `outreach.md` | Outreach playbook, target lists, templates |
| `positioning-history.md` | Old positioning statements (so we know what we've tried) |
| `seo.md` | SEO canon: target keywords, internal-link map, technical SEO baseline |

## Rescope status

All marketing memory files have been rescoped from the master-build-kit's Allowance Guard (DeFi / wallet-security) framing to PagePerfect's actual market (KDP / IngramSpark / Lulu / book-coach segments). Final pass: 2026-05-14 — `audiences.md`, `brand.md`, `seo.md` (companion to `outreach.md`, `metrics.md`, `imagery.md` rescoped earlier the same day). Voice anchored to existing journal essays under `frontend/src/app/(site)/journal/articles-*.ts`.
