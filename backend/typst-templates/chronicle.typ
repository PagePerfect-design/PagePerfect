// Chronicle — "This is Journalism"
// Swiss International Style editorial system — Neue Grafik / Vignelli
// TeX Gyre Heros (Helvetica) body, heavy rules, lede blocks, ragged right
// Target: Non-fiction, journalism, technical manuals, reports
//
// Pure Typst template — no Pandoc syntax. Variables (pp-title, pp-mainfont, etc.) injected by compile pipeline.

// ── COLORS ────────────────────────────────────────────────────
#let rulegrey = luma(89)  // gray 35%
#let numgrey = luma(166)  // gray 65%

// ── PAGE GEOMETRY ─────────────────────────────────────────────
#set page(
  margin: (top: 1in, bottom: 1in, left: 1in, right: 1in),
  header: context {
    let page-num = counter(page).at(here()).first()
    if page-num <= 1 { return }
    set text(size: 8pt, font: "TeX Gyre Heros")
    grid(
      columns: (1fr, 1fr),
      align(left, upper(tracking(3pt, text(size: 7pt)[#pp-title]))),
      align(right)[#counter(page).display()],
    )
    v(2pt)
    line(length: 100%, stroke: 2pt)
  },
  footer: none,
)

// ── TYPOGRAPHY — Swiss International Style ───────────────────
#set text(
  font: pp-mainfont,
  size: 11pt,
  ligatures: true,
  kerning: true,
  hyphenate: true,
  lang: "en",
)

// ── SPACING — Block paragraphs, ragged right ─────────────────
#set par(
  first-line-indent: 0pt,
  spacing: 0.15in,
  justify: false,
  leading: 0.65em * 1.4,
)

// ── SECTION HEADINGS — Newsroom Style ────────────────────────
// H1: 3pt rule above + bold 24pt
#show heading.where(level: 1): it => {
  set par(first-line-indent: 0pt, spacing: 0pt, justify: false)
  v(20pt)
  line(length: 100%, stroke: 3pt)
  v(6pt)
  text(size: 24pt, weight: "bold")[#it.body]
  v(10pt)
}

// H2: 0.5pt rule above + tracked uppercase 14pt
#show heading.where(level: 2): it => {
  set par(first-line-indent: 0pt, spacing: 0pt, justify: false)
  v(16pt)
  line(length: 100%, stroke: 0.5pt + rulegrey)
  v(4pt)
  text(size: 14pt, weight: "bold")[#upper(tracking(5pt, it.body))]
  v(6pt)
}

// H3: Bold, no rules
#show heading.where(level: 3): it => {
  set par(first-line-indent: 0pt, spacing: 0pt, justify: false)
  v(10pt)
  text(size: 11pt, weight: "bold")[#it.body]
  v(4pt)
}

// ── BLOCK QUOTES — Pull Quote Style ─────────────────────────
#show quote: it => {
  v(6pt)
  block[
    #box(width: 3pt, height: 100%, fill: black)
    #h(1em)
    #text(weight: "bold", size: 13pt)[#set par(leading: 0.65em * 1.2); #it.body]
  ]
  v(6pt)
}

// ── LINKS ─────────────────────────────────────────────────────
#show link: it => {
  text(fill: luma(102))[#it]
}

// ── LISTS ─────────────────────────────────────────────────────
#set enum(indent: 1.2em)
#set list(indent: 1.2em)

// ── TABLES ────────────────────────────────────────────────────
#show table: set text(size: 10pt)

// %% CONTENT %%

#if pp-title != none [
#line(length: 100%, stroke: 4pt)
#v(8pt)
#align(left)[
  #text(size: 36pt, weight: "bold")[#pp-title]
  #if pp-author != none [
  #v(6pt)
  #text(size: 14pt, fill: rulegrey)[#pp-author]
  ]
  #if pp-date != none [
  #v(2pt)
  #text(size: 9pt, fill: numgrey)[#upper(tracking(3pt)[#pp-date])]
  ]
]
#v(4pt)
#line(length: 100%, stroke: 1pt)
#v(12pt)
]
