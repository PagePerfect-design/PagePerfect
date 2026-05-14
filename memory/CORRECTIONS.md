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

## Changelog

- 2026-04-14: File created as part of `CLAUDE.md` refactor.
- 2026-05-14: Added claude-mem precedence rule + `.claude/settings.json` operator-only rule.
