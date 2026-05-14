# memory/compliance-risk/MEMORY.md — Compliance & Risk Index

Loaded when a compliance-risk skill is active.

## Standing rules

1. **Data Protection lawyer (#24) holds a veto** on privacy/consent language. No privacy copy ships without their sign-off.
2. **Typography Council holds a veto** on typographic-quality claims ("baseline grid," "golden-ratio scale," "Müller-Brockmann grid"). See `memory/PROCESS.md`.
3. **No claim without evidence.** Marketing claims about KDP/IngramSpark/Lulu compliance must trace to a verified preflight check, not a hope.
4. **Autonomy level 2 for review skills; level 1 for legal drafting or sensitive policy edits.**

## Skills owned

| Skill | Purpose |
|---|---|
| `claim-review` | Marketing claim review — does this sentence survive Brand + Technical + Legal lenses? |
| `legal-page-draft` | Privacy, Terms, DPA draft (level 1 — fresh confirm per draft) |
| `policy-alignment` | Align internal policy with platform requirements (KDP, IngramSpark TOS) |
| `security-claim-audit` | Audit security-shaped marketing claims ("sandboxed," "encrypted at rest") |
| `regulatory-change-response` | Response playbook when regulations change |

## Memory files

| File | Purpose |
|---|---|
| `claims-register.md` | Every external claim with provenance (where it appears, what evidence supports it) |
| `incident-disclosure.md` | Disclosure timeline rules, customer-comms templates |
| `jurisdictions.md` | Where we operate, what laws apply |
| `platform-rules.md` | KDP, IngramSpark, Lulu, App Store Connect rules |
| `regulatory-matrix.md` | Regulation × surface matrix (GDPR × privacy policy, etc.) |

## Sub-council

The **Legal Council (3)** convenes for legal pages, privacy policy, consent copy, liability-creating claims: Lawyer (#9), Regulatory (#23), Data Protection (#24, **veto**).

## Residual AG-flavored content

`claims-register.md` references AG's wallet-security claim posture. Rewrite for PagePerfect: typographic-quality claims, KDP-ready claims, GDPR for session-scoped manuscript storage.

**Rescoped 2026-05-14:** `regulatory-matrix.md` (crypto regs deleted, replaced with GDPR + platform-TOS + payments + IP matrix) and all four compliance skills (`claim-review`, `policy-alignment`, `security-claim-audit`, `regulatory-change-response`). Department perimeter is now PagePerfect-aligned. Remaining work: `claims-register.md`.
