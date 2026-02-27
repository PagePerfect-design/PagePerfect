// Minimal — "This is The Source Code"
// Radical Compatibility — zero extra dependencies, pure content focus
// Latin Modern body, wide margins, plain page style
// Target: Drafts, screenplays, documentation, submissions
//
// Pure Typst template — no Pandoc syntax. Variables (pp-title, pp-mainfont, etc.) injected by compile pipeline.

// ── PAGE GEOMETRY ─────────────────────────────────────────────
#set page(
  margin: (top: 1in, bottom: 1in, left: 1in, right: 1in),
  footer: context {
    align(center, text(size: 10pt)[
      #counter(page).display()
    ])
  },
)

// ── TYPOGRAPHY — Latin Modern ─────────────────────────────────
#set text(
  font: pp-mainfont,
  size: 12pt,
  hyphenate: true,
  lang: "en",
)

// ── SPACING ───────────────────────────────────────────────────
#set par(
  first-line-indent: 0pt,
  spacing: 6pt,
  justify: true,
  leading: 0.65em * 1.5,
)

// ── HEADINGS — Standard, tightened ────────────────────────────
#show heading.where(level: 1): it => {
  v(18pt)
  text(size: 16pt, weight: "bold")[#it.body]
  v(10pt)
}

#show heading.where(level: 2): it => {
  v(14pt)
  text(size: 13pt, weight: "bold")[#it.body]
  v(8pt)
}

#show heading.where(level: 3): it => {
  v(10pt)
  text(size: 11pt, weight: "bold")[#it.body]
  v(6pt)
}

// ── LINKS ─────────────────────────────────────────────────────
#show link: it => {
  text(fill: rgb("2244AA"))[#underline[#it]]
}

// ── TABLES ────────────────────────────────────────────────────
#show table: set text(size: 10pt)

// %% CONTENT %%

#if pp-title != none [
#align(center)[
  #text(size: 20pt, weight: "bold")[#pp-title]
  #if pp-author != none [
  #v(8pt)
  #text(size: 14pt)[#pp-author]
  ]
  #if pp-date != none [
  #v(4pt)
  #text(size: 12pt)[#pp-date]
  ]
]
#v(24pt)
]
