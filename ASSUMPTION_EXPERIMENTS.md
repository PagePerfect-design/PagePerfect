# 5 Assumptions You're Probably Wrong About — With 7-Day Experiments

## Assumption 1: "Typography quality is my competitive advantage"

**Evidence in codebase:**
- `WhyDifferent.tsx:3` — "Passes KDP review. First try."
- `WhyDifferent.tsx:12` — "same typographic standards used by Penguin and Oxford University Press"
- 15 templates, GridSystem class, typography-assurance.js scoring, 19 page sizes, 7 margin presets
- Author Guide ends with link to Müller-Brockmann's 1968 grid systems book

**Why you're probably wrong:**
Users care about not getting rejected by KDP, not baseline grids. KDP rejection is caused by wrong trim size, missing bleed, or corrupt fonts — not golden-ratio type scales. A Word-to-PDF export that passes review would satisfy 90% of your market. The typography scoring system (`typography-assurance.js`) is advisory-only and users ignore it.

**7-day experiment:**

| Day | Action |
|-----|--------|
| 1 | Create two landing variants. A (current): leads with typography. B: leads with outcome ("Upload to KDP. No rejections. Done in 60 seconds.") |
| 2 | Deploy A/B split. Track CTA clicks. |
| 3–6 | Collect data. Minimum 100 visitors per variant. |
| 7 | If Variant B wins by >15%, typography is not the selling point — speed and certainty are. |

**Kill signal:** Strip all Müller-Brockmann and "golden ratio" language from marketing. Keep the engineering.

---

## Assumption 2: "Authors will write in (or tolerate) Markdown"

**Evidence in codebase:**
- `authorGuide.ts:5-20` — Opens with Markdown syntax tutorial
- `sample.ts` — Sample uses Pandoc citation syntax (`[@Finch2023]`)
- `Steps.tsx:5` — "Paste from Word, drop in a .docx, or write in Markdown"
- `authorGuide.ts:38-43` — "Add headings (##), italics (*text*), and citations ([@Key]) as needed"

**Why you're probably wrong:**
After .docx upload, Pandoc converts to Markdown and users land in a code editor. You're asking novelists to learn markup. The Author Guide literally tells Word users to hand-edit `##` and `*text*`. The sample manuscript is about 17th-century maritime trade with academic citations — fiction authors don't see themselves.

**7-day experiment:**

| Day | Action |
|-----|--------|
| 1 | Track entry method: paste, .docx upload, "Try sample", or direct typing. Track time-to-first-compile and users who never compile. |
| 2 | Create a fiction sample (3 chapters, dialogue, scene breaks, no citations). |
| 3 | Add one-question intercept after .docx upload: "Was the conversion accurate?" |
| 4–7 | Collect data. |

**What to look for:**
- If >60% enter via .docx/paste: users are Word refugees, not Markdown natives. Evaluate WYSIWYG layer.
- If fiction sample gets 2x+ engagement: positioning is wrong.
- If >30% of .docx uploaders say conversion was inaccurate: import pipeline is a churn factory.

---

## Assumption 3: "The watermark-then-upgrade model drives conversions"

**Evidence in codebase:**
- `CompileShell.tsx` — Watermark detected after download via response header
- `CompileShell.tsx` — Post-download banner points to /pricing upgrade
- `watermark.js` — TikZ overlay, 8% opacity, server-side
- ~~`$2.99 single clean PDF` option~~ **REMOVED** — dead code cleaned out

**Why you're probably wrong:**
Punitive freemium: user does all the work, output is degraded at the last step. Watermark is invisible during editing. User discovers it after download, lands on pricing page with $19.99/$199 options. Feels tricked.

**7-day experiment:**

| Day | Action |
|-----|--------|
| 1 | Track funnel: download → see watermark banner → click Upgrade → reach /pricing → start payment. |
| 2 | Variant B: show watermark warning above preview iframe from first compile. |
| 3–7 | A/B test. If upfront variant converts same or better, surprise model destroys trust for zero gain. |

**Kill signal:** If watermark banner → pricing click-through < 5%, the punitive model is dead. Switch to value-add (free = good, paid = EPUB + custom fonts + batch).

---

## Assumption 4: "Users will self-serve through 15 templates and 19 page sizes"

**Evidence in codebase:**
- `CompileShell.tsx:102-120` — 15 templates with one-line descriptions
- Genre detection exists (`CompileShell.tsx:327-346`) but only used at import, never as ongoing guidance
- 15 templates × 19 sizes × 7 margins = ~2,000 possible configurations
- Descriptions like "Van de Graaf Canon monograph" and "White-cube gallery catalog"

**Why you're probably wrong:**
You built a cockpit and marketed it as a steering wheel. Barry Schwartz's research: reducing options from 24 to 6 increases purchase likelihood 10x. Template descriptions are designer jargon. "Van de Graaf Canon monograph" means nothing to a first-time author.

**7-day experiment:**

| Day | Action |
|-----|--------|
| 1 | Track: which templates users click, how many they preview before compiling, time between Design stage and first compile. |
| 2 | Variant: after genre detection, show only top 3 recommended templates. "All templates" toggle for power users. Default 6×9", normal margins. Hide heading variants. |
| 3 | Replace jargon descriptions with outcomes: "symphony" → "Classic academic — university press look." |
| 4–7 | A/B test. Measure time-to-first-compile, compiles per session, download rate. |

**Kill signal:** If 80%+ of compiles use paperback/chicago/minimal, collapse the other 12 into "Advanced."

---

## Assumption 5: "Educational content (journal + docs) builds trust and converts"

**Evidence in codebase:**
- 10+ journal articles about typography theory ("ROI of Legibility," "Semantics of the Serif," "Reverse Type is Dead")
- Zero articles about: KDP rejections, page size selection, copyright pages, widows/orphans fixes
- Docs titled "Operating the Engine" instead of "Help Center"
- `Engineering.tsx` exposes LuaLaTeX/Pandoc internals on a consumer landing page
- Author Guide recommends Müller-Brockmann's 1968 book

**Why you're probably wrong:**
The journal is a love letter to typography, not a support channel. Users with compile errors get essays about Colin Wheildon's 1974 legibility study instead of troubleshooting guides. "Operating the Engine" sounds like a car manual. Users want "Help."

**7-day experiment:**

| Day | Action |
|-----|--------|
| 1 | Track: journal visits, time on articles, bounce rate back to editor/pricing, whether journal readers ever compile. |
| 2 | Write 3 practical articles: "5 Reasons KDP Rejected Your PDF," "Which Page Size for Your Novel?," "Word to Published Book in 10 Minutes." |
| 3 | Track engagement: practical vs theory articles. |
| 4 | Add contextual help in editor: on compile error, show "Having trouble? See common fixes." |
| 5–7 | Measure: practical articles 3x+ engagement? Journal readers convert to paid? |

**Kill signal:** If <5% of users visit the journal and visitors don't convert higher, redirect effort to in-editor help.

---

## Summary

| # | Assumption | If Disproved, Action |
|---|-----------|---------------------|
| 1 | Typography is the selling point | Rewrite marketing around speed + certainty |
| 2 | Authors tolerate Markdown | Build/integrate WYSIWYG editor |
| 3 | Watermark-surprise drives upgrades | Transparent pre-download gating |
| 4 | 15 templates = breadth advantage | Collapse to 3-5 smart defaults |
| 5 | Journal builds trust + converts | Replace theory with practical help |

**Common thread:** You built this for yourself — a design-literate person who finds typography exciting. Your users are novelists and academics who want their book to not look embarrassing. These experiments will tell you whether the market rewards your taste or your users' workflow.
