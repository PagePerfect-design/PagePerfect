// Thesis — "This is a Dissertation"
// Double-spaced academic format for university submission
// Latin Modern Roman body, numbered sections, declaration-ready structure
// Target: PhD/Masters theses, dissertations, capstone projects
//
// Pure Typst template — no Pandoc syntax. Variables (pp-title, pp-mainfont, etc.) injected by compile pipeline.

// ── PAGE GEOMETRY ─────────────────────────────────────────────
#set page(
  margin: (top: 1in, bottom: 1in, left: 1.5in, right: 1in),
  header: context {
    let page-num = counter(page).at(here()).first()
    if page-num <= 1 { return }
    align(right, text(size: 9pt)[#counter(page).display()])
  },
  footer: none,
)

// ── TYPOGRAPHY — Institutional Standard ──────────────────────
#set text(
  font: pp-mainfont,
  size: 12pt,
  ligatures: true,
  kerning: true,
  hyphenate: true,
  lang: "en",
)

// ── SPACING — Double-spaced (university requirement) ─────────
#set par(
  first-line-indent: 1.5em,
  spacing: 0pt,
  justify: true,
  leading: 0.65em * 2.0,
)

// ── SECTION HEADINGS — Numbered, Hierarchical ────────────────
// Most universities require numbered sections: 1, 1.1, 1.1.1
#set heading(numbering: "1.1.1")

#show heading.where(level: 1): it => {
  set par(first-line-indent: 0pt, spacing: 0pt, justify: false)
  v(28pt)
  text(size: 16pt, weight: "bold")[
    #counter(heading).display()
    #h(0.5em)
    #it.body
  ]
  v(14pt)
}

#show heading.where(level: 2): it => {
  set par(first-line-indent: 0pt, spacing: 0pt, justify: false)
  v(22pt)
  text(size: 14pt, weight: "bold")[
    #counter(heading).display()
    #h(0.5em)
    #it.body
  ]
  v(10pt)
}

#show heading.where(level: 3): it => {
  set par(first-line-indent: 0pt, spacing: 0pt, justify: false)
  v(16pt)
  text(size: 12pt, weight: "bold")[
    #counter(heading).display()
    #h(0.5em)
    #it.body
  ]
  v(8pt)
}

// ── FOOTNOTES ─────────────────────────────────────────────────
#set footnote.entry(
  separator: line(length: 2in, stroke: 0.4pt),
  indent: 0.5em,
  gap: 0.5em,
)

// ── BLOCK QUOTES — Indented, single-spaced ───────────────────
#show quote: it => {
  pad(left: 2em, right: 2em)[
    #set text(size: 11pt)
    #set par(leading: 0.65em * 1.15)
    #it.body
  ]
}

// ── LINKS ─────────────────────────────────────────────────────
#show link: it => {
  text(fill: rgb("333399"))[#underline[#it]]
}

// ── LISTS ─────────────────────────────────────────────────────
#set enum(indent: 2em)
#set list(indent: 2em)

// ── TABLES ────────────────────────────────────────────────────
#show table: set text(size: 10pt)

// %% CONTENT %%

#if pp-title != none [
#align(center)[
  #v(1in)
  #text(size: 18pt, weight: "bold")[#pp-title]
  #if pp-author != none [
  #v(24pt)
  #text(size: 14pt)[#pp-author]
  ]
  #if pp-date != none [
  #v(12pt)
  #text(size: 12pt)[#pp-date]
  ]
  #v(24pt)
  #line(length: 3cm, stroke: 0.4pt)
]
#v(36pt)
]
