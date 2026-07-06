# CORRECTIONS

Append-only log of lessons from mistakes. When a rule here conflicts with a rule elsewhere, this file wins until the conflict is resolved in the canonical location.

## Format

```
## YYYY-MM-DD — Short title

**What happened:** one-paragraph description of the mistake.
**Root cause:** why it happened.
**Rule going forward:** the new rule, in imperative mood.
**Canonical home:** which other file this rule belongs in long-term (move it there and shorten this entry to a pointer).
```

## Entries

## 2026-05-14 — claude-mem precedence vs PROCESS.md

**What happened:** The `claude-mem` plugin auto-captures every session into a local memory store and surfaces it back via MCP tools in future sessions. There was ambiguity about whether claude-mem-captured assertions should override the workflow rules in `memory/PROCESS.md`.
**Root cause:** Two memory systems were introduced in the same restructure (`memory/` tree from master-build-kit + `claude-mem` plugin) without a precedence rule.
**Rule going forward:** `memory/PROCESS.md` (and the rest of the `memory/` tree) is the canonical source of workflow rules, conventions, and the Standing Council. `claude-mem` is session-recall context only — it provides what was done, not authority over how things should be done. When the two conflict, `memory/` wins; the conflicting claude-mem observation should be flagged for review (it may indicate the workflow rule needs updating, but never quietly).
**Canonical home:** `memory/PROCESS.md` (workflow rules section) once a stable phrasing is settled. Until then this CORRECTIONS entry is the pointer.

## 2026-05-14 — `.claude/settings.json` is operator-only

**What happened:** Both this session and the previous handover session attempted to write `.claude/settings.json` directly and were blocked by the Claude Code harness's self-modification guard.
**Root cause:** The harness intentionally prevents the agent from modifying its own permission boundary. CLAUDE.md documents this.
**Rule going forward:** Do not attempt to write `.claude/settings.json` from Claude Code. Surface the recommended JSON to the user; they paste it via `vim` (or any other text editor) themselves. Re-attempts waste a tool call + create a permission denial trace.
**Canonical home:** Already in `CLAUDE.md` (the "Suggested `.claude/settings.json`" section). Keep this CORRECTIONS entry as a pointer-on-failure.

## 2026-07-06 — Canon docs asserted a contrast ratio that was mathematically wrong

**What happened:** `tokens.md`, `accessibility.md`, and `DESIGN.md` all sanctioned `rgba(17,17,17,0.5)` for labels claiming "≥ 4.5:1 — AA". Actual blend on cream `#FDFCF8` is ~`#878786` ≈ 3.5:1 — fails AA for normal-size text. Dozens of live `text-[#111111]/40-/50` labels shipped on the strength of that wrong number.
**Root cause:** A stated ratio in a memory doc was never recomputed; audits inherited the claim as a sanctioned exception.
**Rule going forward:** Contrast claims in canon docs are verified by computation, not trusted. Label floor is solid `#555555`; 50% ink is decorative/aria-hidden or ≥18px display furniture only. Docs corrected 2026-07-06.
**Canonical home:** `memory/design/tokens.md` + `memory/design/accessibility.md` (corrected in place).

## 2026-07-06 — Audit imports before auditing style

**What happened:** 7 of 19 editor components (~2,900 lines: TopBar, FloatingHUD, LaunchOverlay, IngestZone, PublishingSystems, TemplateNotes, TemplateHelp) were dead code with zero imports; ~150 of 559 design-audit findings targeted files nobody rendered. The Design Council review caught it; the per-file audit did not.
**Root cause:** Per-file audits assume the file is live. `components.md` also still documented all seven as live.
**Rule going forward:** Before any per-file sweep (audit, restyle, migration), grep each target's importers first; dead files get deleted, not remediated. Keep `components.md` in sync when components are added/removed.
**Canonical home:** This entry.

## Changelog

- 2026-04-14: File created as part of `CLAUDE.md` refactor.
- 2026-05-14: Added claude-mem precedence rule + `.claude/settings.json` operator-only rule.
- 2026-07-06: Added contrast-math verification rule + audit-imports-first rule.
