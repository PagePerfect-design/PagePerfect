// Operator — "The Engineering Manual"
// O'Reilly / Braun manual aesthetic — semantic interruptions, admonition blocks
// Fira Sans body + Fira Mono code, structured layout with sidenote margins
// Target: Developers, engineers, product makers, technical writers
//
// Pure Typst template — no Pandoc syntax. Variables (pp-title, pp-mainfont, etc.) injected by compile pipeline.

// ── COLORS ────────────────────────────────────────────────────
#let warningred = rgb("CC0000")
#let infoblue = rgb("0066CC")
#let codebg = luma(242)      // gray 95%
#let rulegrey = luma(153)    // gray 60%
#let headblue = rgb("003366")

// ── PAGE GEOMETRY ─────────────────────────────────────────────
#set page(
  margin: (top: 1in, bottom: 1in, left: 1in, right: 1in),
  header: context {
    let page-num = counter(page).at(here()).first()
    if page-num <= 1 { return }
    set text(size: 8pt, font: "Fira Sans")
    grid(
      columns: (1fr, 1fr),
      align(left, text(fill: rulegrey)[#pp-title]),
      align(right)[#counter(page).display()],
    )
    v(2pt)
    line(length: 100%, stroke: 0.5pt + rulegrey)
  },
  footer: none,
)

// ── TYPOGRAPHY — Machine Precision ───────────────────────────
#set text(
  font: pp-mainfont,
  size: 10pt,
  ligatures: true,
  kerning: true,
  hyphenate: true,
  lang: "en",
)

// ── SPACING ──────────────────────────────────────────────────
#set par(
  first-line-indent: 0pt,
  spacing: 8pt,
  justify: true,
  leading: 0.65em * 1.4,
)

// ── CODE BLOCKS ──────────────────────────────────────────────
#show raw.where(block: true): it => {
  block(
    width: 100%,
    fill: codebg,
    inset: 8pt,
    radius: 0pt,
  )[
    #set text(font: "Fira Mono", size: 8.5pt)
    #it
  ]
}

// ── SECTION HEADINGS — Technical Hierarchy ───────────────────
// H1: Navy blue, numbered
#show heading.where(level: 1): it => {
  set par(first-line-indent: 0pt, spacing: 0pt, justify: false)
  v(20pt)
  text(size: 18pt, weight: "bold", fill: headblue)[
    #counter(heading).display()
    #h(0.5em)
    #it.body
  ]
  v(8pt)
}

// H2: Navy blue, numbered
#show heading.where(level: 2): it => {
  set par(first-line-indent: 0pt, spacing: 0pt, justify: false)
  v(14pt)
  text(size: 13pt, weight: "bold", fill: headblue)[
    #counter(heading).display()
    #h(0.5em)
    #it.body
  ]
  v(6pt)
}

// H3: Bold, black
#show heading.where(level: 3): it => {
  set par(first-line-indent: 0pt, spacing: 0pt, justify: false)
  v(10pt)
  text(size: 10pt, weight: "bold")[#it.body]
  v(4pt)
}

// ── BLOCK QUOTES — Info callout (blue left border) ───────────
#show quote: it => {
  block(
    width: 100%,
    fill: infoblue.lighten(95%),
    inset: (left: 11pt, right: 8pt, top: 6pt, bottom: 6pt),
    stroke: (left: 3pt + infoblue),
  )[
    #text(weight: "bold", fill: infoblue)[Info]
    #parbreak()
    #set text(size: 10pt)
    #it.body
  ]
}

// ── LINKS ─────────────────────────────────────────────────────
#show link: it => {
  text(fill: infoblue)[#it]
}

// ── LISTS ─────────────────────────────────────────────────────
#set enum(indent: 1.5em)
#set list(indent: 1.5em)

// ── TABLES ────────────────────────────────────────────────────
#show table: set text(size: 9pt)

// %% CONTENT %%

#if pp-title != none [
#align(left)[
  #v(16pt)
  #text(size: 26pt, weight: "bold", fill: headblue)[#pp-title]
  #v(4pt)
  #line(length: 3cm, stroke: 2pt + headblue)
  #if pp-author != none [
  #v(8pt)
  #text(size: 12pt)[#pp-author]
  ]
  #if pp-date != none [
  #v(4pt)
  #text(size: 10pt, fill: rulegrey)[#pp-date]
  ]
]
#v(12pt)
]
