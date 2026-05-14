# memory/design/MEMORY.md — Design Index

Loaded when a design skill is active.

## Standing rules

1. **Accessibility veto (#8)** — WCAG AA, contrast, motion safety, semantic structure. No exceptions.
2. **Typography dominates** — see `projects/pageperfect/DESIGN.md` principle #1. No decorative imagery without Design Council sign-off.
3. **Sharp geometry** — `border-radius: 0` in `[data-docs]` and `(site)` scopes.
4. **One red CTA per surface** — `#FF3333` reserved for the highest-value action.
5. **Picky tone, not picky look** — see `memory/design/bold-design-principles.md` for the Tone Options vocabulary. Commit to an extreme.
6. **Autonomy level 2** — design skills produce specs, proposals, audits, critiques; they do not directly edit production code.

## Skills owned

| Skill | Purpose |
|---|---|
| `design-surface` | Design a whole surface (page/section) from brief to spec |
| `design-component` | Design a single component (button, modal, card) with states |
| `design-token` | Design or revise design tokens (color, type, spacing) |
| `design-motion` | Propose motion specs (workflow shape — read `motion.md` and council-review) |
| `design-system-audit` | Audit existing surfaces for drift from canon |
| `design-critique` | Critique design work through the Design Council lens |
| `emil-design-eng` | Engineering craft for motion/interaction code — concrete easings, durations, anti-patterns, Before/After review format |
| `bencium-typography` | HTML/CSS typography canon (Matthew Butterick) — curly quotes, em/en dashes, JSX gotchas, line-length |

## Memory files

| File | Purpose |
|---|---|
| `accessibility.md` | WCAG AA contract, motion safety rules |
| `bold-design-principles.md` | Tone Options vocabulary, 6 core principles, anti-AI-generic framing (Bencium-derived) |
| `components.md` | Component design canon (PagePerfect button hierarchy, card geometry, etc.) |
| `motion.md` | PagePerfect's canonical motion policy: tokens, choreography, reduced-motion contract |
| `performance-budget.md` | Perf budgets for design surfaces (LCP, CLS, animation cost) |
| `tokens.md` | Design tokens (colors, type, spacing, shadows) |

## Companion skills

- `emil-design-eng` and `bencium-typography` are *craft* skills — invoke alongside `design-component` or `design-system-audit` for implementation rigor.
- `de-ai-ify` (under marketing) — strip generic AI tells from any design copy.

## Sub-council

The **Design Council (6)** convenes for visual/motion/system work: Visual (#7), Motion (#37), UX (#13), Systems (#15), Accessibility (#8, **veto**), Performance (#17).
