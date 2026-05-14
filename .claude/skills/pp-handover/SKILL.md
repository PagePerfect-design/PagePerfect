---
name: pp-handover
description: Generate a PagePerfect-scoped handover at the end of a focused session. Captures what changed, what's verified vs only modified, what manual steps the user still owes, the compile-pipeline / tier-gating context if touched, and the literal next concrete action — so a cold reader picks up in 2 minutes. Use when wrapping a session, before a context switch, or when a teammate will continue.
---

# pp-handover

PagePerfect-scoped handover. Builds on the global `handover` skill with project-specific defaults: the compile pipeline, tier gating, PocketBase admin flows, watermark behavior, deployment split (Vercel + Coolify), and the Standing Council's veto axes.

## Output location

Write to `context/handovers/<YYYY-MM-DD>-<slug>.md` (the `context/` directory is gitignored; handovers live in your local working state, not the repo). If `context/` doesn't exist, create it.

## Structure

```
# Handover — <YYYY-MM-DD> — <session topic>

## What I was doing
<1-3 sentences, plain language. The goal, not the diff.>

## What changed
| File | Change | Verified? |
|------|--------|-----------|
| <path> | <one line> | [Yes — test/run passed] / [No — only edited] |

## What's verified vs only modified
- **Verified** (ran something, saw output, confirmed): <list>
- **Modified but not verified** (edited, didn't run): <list>
- **Not touched but worth knowing**: <list>

## Manual steps owed
Things that need a human hand:
- [ ] <step> (why it can't be automated)
- [ ] e.g. Apply suggested `.claude/settings.json` deny-list (writing to .claude/settings.json is auto-blocked)
- [ ] e.g. Add `print_orders` collection in PocketBase Admin UI
- [ ] e.g. Set `STRIPE_PRICE_PUBLISHER` on Coolify

## Compile-pipeline context (if touched)
Only fill if the session touched `backend/compile-worker.js`, `backend/latex-sanitizer.js`, `backend/text-normalizer.js`, `backend/grid-system.js`, or any template:
- Did re-verification at tier-check time still pass?
- Did orphan sweeper run cleanly?
- Did 45s timeout still hold?
- Did watermark inject for Drafter tier?
- Did `x-pp-watermarked` header set?

## Tier-gating context (if touched)
Only fill if the session touched `backend/index.js` enqueue, `compile-worker.js` tier re-verify, or payment flows:
- Tier levels: anonymous: 0, drafter: 1, publisher: 2, studio: 3
- Verification happens at enqueue AND execution — confirm both gates are intact.

## Decisions made
| Decision | Alternatives considered | Why this | Reversibility |
|---|---|---|---|
| <one line> | <list> | <reason> | [easy/medium/hard] |

If any decision should be an ADR, list it under `## ADRs to write`.

## Open questions
- <question> — to whom / what's needed to answer

## Council misses (honest self-assessment)
Did any non-trivial change skip a relevant Council member's lens? List them. This is for the correction loop, not a confession — better to surface than hide.

## Next concrete action
**The very next thing to do**, with file and line if possible:
- e.g. "Edit `frontend/src/app/(site)/pricing/page.tsx:72` to update the 14-day re-export FAQ answer; the typo `re-exporsts` is still there"
- One specific action. Not "wrap up the feature."

## ADRs to write (if any)
- <slug> — <one line> — go to `projects/pageperfect/decisions/`

## Memory updates suggested (if any)
- `memory/<file>` — <what to update and why>
- `memory/CORRECTIONS.md` — <lesson worth keeping>
```

## Operating principles

- **Cold-reader test.** Someone with zero context should be able to act on the handover in under 2 minutes. If they can't, your sentences are too dense.
- **Verified vs modified is non-negotiable.** "Edited the file" ≠ "the change works." State which is which.
- **Manual steps must be explicit.** Anything the harness blocked (settings.json writes, destructive ops) goes here.
- **Decisions get their rejected alternatives.** A decision without alternatives is just a preference. Record what you considered and why you didn't pick it.
- **No vague TODOs.** "Polish the editor" is not an action. "In `CompileShell.tsx:1659`, replace the bare `console.error` with the structured logger" is.
- **Don't editorialize.** The handover is a status snapshot, not a narrative. Bullets > paragraphs.

## Don't include

- A summary of the entire conversation — the handover is forward-looking, not retrospective.
- Files you didn't actually change — only what's relevant.
- Generic advice ("make sure to test before deploying") — actionable specifics only.
- Anything sensitive (admin passwords, customer data) — handovers are for future-you / teammates, not auditors.

## Self-review

Before emitting, check:
- Does "Next concrete action" name a file and line, or at least a specific thing to do?
- Is every modified file listed with a verified-or-not status?
- Are manual steps actionable without re-asking what they mean?
- Did I list ADRs needed, if any?
- Did I list memory updates needed, if any?

## Memory

- Read `memory/CORRECTIONS.md` before writing the "Council misses" section — note any patterns that match prior lessons.
- After writing, if the session uncovered a new lesson, append it to `memory/CORRECTIONS.md`.
