# bold-design-principles.md

Concepts distilled from Bencium's *Innovative UX Designer* skill, scoped to PagePerfect. Read this when designing a new surface, critiquing UI, or pushing back on "AI-generic" output. The Design Council (#7 Visual designer + Sub-council Maren, Sable, Kael) holds these principles.

## Design Thinking Protocol

Before generating UI, answer four questions:

1. **Purpose** — what problem does this surface solve, who uses it
2. **Tone** — pick an aesthetic extreme from the vocabulary below
3. **Constraints** — technical (Next.js, Tailwind, no Motion lib, Vercel-hosted) + brand (Swiss-Ogilvy specimen, sharp geometry)
4. **Differentiation** — what is the single thing someone remembers

Commit fully to the chosen direction. No half measures. Then present 2–3 alternatives with trade-offs before implementing.

## Tone Options (vocabulary for picking an extreme)

Use these as a *common language* for aesthetic direction in critiques and briefs. PagePerfect's existing canon lives in the **bold** rows.

| Tone | Character | PagePerfect fit |
|---|---|---|
| **Brutally minimal** | Stripped to essence, bold typography, vast whitespace | **Primary fit** — landing hero, journal index, docs |
| **Editorial / magazine** | Strong typography hierarchy, asymmetric layouts | **Primary fit** — journal articles, technical bar, kicker labels |
| **Brutalist / raw** | Exposed structure, harsh contrasts | **Adjacent fit** — section dividers, error states, technical content |
| Maximalist chaos | Layered, dense, controlled disorder | Off-brand |
| Retro-futuristic | Vintage meets sci-fi | Off-brand |
| Organic / natural | Soft edges, earthy colors, nature textures | Off-brand |
| Luxury / refined | Elegant spacing, premium typography, subtle details | Adjacent — only for paid-tier upgrade surfaces |
| Playful / toy-like | Bright colors, rounded shapes | Off-brand (we use `border-radius: 0`) |
| Art deco / geometric | Bold patterns, metallic accents, symmetric elegance | Off-brand |
| Soft / pastel | Gentle gradients, muted tones | Off-brand |
| Industrial / utilitarian | Functional, no-nonsense, mechanical precision | **Adjacent fit** — `/status` page, build manifest displays |

**Picking a tone is the start of the brief, not the end of it.** "Brutally minimal + Editorial" is fine ("Mueller-Brockmann meets Pentagram"); "Brutally minimal + Playful" is incoherent — pick one extreme.

## Six Core Principles

### 1. Simplicity Through Reduction
Begin with complexity, then remove until reaching the simplest effective solution. Every element justifies its existence or leaves.

### 2. Material Honesty (scoped for PagePerfect)
Digital materials have unique properties — embrace them. PagePerfect's adaptation:
- **Affordance through color + spacing + typography** (the specimen palette + sharp geometry already does this)
- **Shadows are tools, not decoration** — `shadow-paper` for the PDF preview is intentional skeuomorphism (it's a paper artifact). `shadow-card` is intentional elevation in the editor. Outside those, shadows should justify themselves.
- **Animations follow physics adapted to digital responsiveness** (see `memory/design/motion.md` + `.claude/skills/emil-design-eng/`)

### 3. Functional Layering
Hierarchy through type scale, color contrast, and spatial relationships. Layer information conceptually: primary → secondary → tertiary. Functional depth (modals over content, dropdowns over UI) — yes. Decorative depth — no.

### 4. Obsessive Detail
Excellence emerges from hundreds of small intentional decisions. Half-point differences matter. When detail conflicts with clarity, clarity wins. Counterpart: the kit's `emil-design-eng` Review Checklist enforces this at code-review time.

### 5. Coherent Design Language
Every element visually communicates its function. Elements feel part of a unified system. Nothing arbitrary. The PagePerfect specimen palette + Inter Tight / Source Serif 4 / IBM Plex Mono trinity is this system — don't bolt on new fonts or colors without a Design Council pass.

### 6. Invisibility of Technology
The best technology disappears. Users focus on content (their manuscript, their preview, their typography grade) — not on understanding the interface.

## Anti-AI-Generic Framing

The Bencium skill names patterns to avoid because they signal "machine-generated." PagePerfect-adapted list:

**Never default to (without thinking):**
- Generic SaaS blue `#3B82F6` — we have `#FF3333` red as our deliberate accent
- Purple gradients on white — off-brand entirely
- Glass morphism / liquid glass / blob backgrounds — off-brand (we use sharp geometry)
- Apple HIG mimicry — we are a precision instrument, not consumer software
- Soft drop shadows on every card — see Material Honesty above
- Rounded corners as default — PagePerfect uses `border-radius: 0` in marketing/docs
- Inter as the *default* sans for new surfaces — PagePerfect uses Inter *Tight* intentionally for display; don't expand into other Inter weights or other generic sans without a Council pass
- Cookie-cutter SaaS layouts (hero / 3 feature cards / testimonial / CTA) — see the landing's actual structure (typography-first hero, no decorative imagery, technical bar at bottom)

**Inspiration sources worth studying:**
- Müller-Brockmann's *Grid Systems in Graphic Design* (the engine of our grid system)
- Otl Aicher, Massimo Vignelli, Pentagram editorial work
- Modern type-led landing pages (Linear's early site, Vercel's docs, Stripe's older marketing)
- Editorial design from monographs and gallery catalogs (these influenced the `exhibit` template)

**Reject as inspiration:**
- Glassmorphic SaaS dashboards
- AI-generated portfolio sites
- "Friendly" tech mascots / illustrations / 3D blob graphics

## Color usage discipline

From the bencium skill, adapted:

- **Every color serves a purpose** (hierarchy, function, status, action). Decorative colors that don't communicate meaning don't ship.
- **Same color = same meaning throughout.** `#FF3333` is the primary CTA, always. It does not become a hover accent, a status color, or a decorative element.
- **Pair muted neutrals with sharp accents.** Cream + ink + red is the canonical PagePerfect example. Variations of this pattern (e.g., paper-warm + charcoal + ochre for an editorial sub-surface) need Design Council sign-off.
- **Dominant colors with sharp accents outperform timid, evenly-distributed palettes.** The specimen page is dominated by cream and ink; red is rare and punchy by design.

## When to invoke this file

Read this when:
- Designing a new surface (page, modal, component) — pick a tone, commit
- Critiquing UI work — use the Tone vocabulary + 6 principles as the lens
- Pushing back on AI-generic output — the Anti-AI list gives explicit names
- Reviewing a copy/design from a contractor — same lens

Do not read this when:
- Tactical CSS/motion craft questions — those are in `.claude/skills/emil-design-eng/` and `memory/design/motion.md`
- Token-level changes — those are in `memory/design/tokens.md`
- Accessibility audit — that's in `memory/design/accessibility.md` (Noor's veto)

## Attribution

Concepts distilled from Bencium's `bencium-innovative-ux-designer` SKILL.md (`bencium/bencium-claude-code-design-skill`). Adapted for PagePerfect's Swiss-Ogilvy specimen system — the original skill recommends *against* Inter and *for* photography/textures; this file diverges where those recommendations conflict with PagePerfect's intentional design system. The Tone Options vocabulary and 6 core principles are lifted directly because they're broadly useful as a design lens.
