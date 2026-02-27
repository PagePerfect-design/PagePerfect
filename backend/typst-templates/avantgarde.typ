// Avant-Garde — "This is a Manifesto"
// Deconstructed Grid — Ray Gun, Emigre, David Carson meets 2020s Brutalism
// Source Sans 3 body + bold display, rotated elements, radical asymmetry
// Target: Zines, manifestos, lookbooks, art-school publications
//
// Pure Typst template — no Pandoc syntax. Variables (pp-title, pp-mainfont, etc.) injected by compile pipeline.

// ── COLORS ────────────────────────────────────────────────────
#let ghostnum = luma(230) // gray 90%

// ── PAGE GEOMETRY ─────────────────────────────────────────────
#set page(
  margin: (top: 1in, bottom: 1in, left: 1in, right: 1in),
  header: none,
  footer: context {
    align(center, text(size: 9pt, weight: "bold", font: "DejaVu Sans")[
      #counter(page).display()
    ])
  },
)

// ── TYPOGRAPHY — Art School Tension ──────────────────────────
#set text(
  font: pp-mainfont,
  size: 11pt,
  ligatures: true,
  kerning: true,
  hyphenate: false,
  lang: "en",
)

// ── SPACING — Block paragraphs ───────────────────────────────
#set par(
  first-line-indent: 0pt,
  spacing: 10pt,
  justify: false,
  leading: 0.65em * 1.35,
)

// ── CHAPTER HEADINGS — Deconstructed ─────────────────────────
// Massive ghost number behind + uppercase bold title
#show heading.where(level: 1): it => {
  pagebreak(weak: true, to: "odd")
  v(36pt)
  align(left)[
    #text(size: 120pt, weight: "bold", fill: ghostnum)[
      #counter(heading).display()
    ]
    #v(-60pt)
    #text(size: 20pt, weight: "bold")[#upper[#it.body]]
  ]
  v(20pt)
}

// H2: Aggressive, uppercase
#show heading.where(level: 2): it => {
  v(18pt)
  text(size: 14pt, weight: "bold", font: "DejaVu Sans")[#upper[#it.body]]
  v(6pt)
}

// H3: Bold, normal case
#show heading.where(level: 3): it => {
  v(12pt)
  text(size: 11pt, weight: "bold", font: "DejaVu Sans")[#it.body]
  v(4pt)
}

// ── BLOCK QUOTES — Brutalist ─────────────────────────────────
// Full-width rules above and below, bold large text
#show quote: it => {
  v(6pt)
  line(length: 100%, stroke: 2pt)
  v(4pt)
  text(weight: "bold", size: 13pt)[#set par(leading: 0.65em * 1.1); #it.body]
  v(4pt)
  line(length: 100%, stroke: 2pt)
  v(6pt)
}

// ── LINKS ─────────────────────────────────────────────────────
#show link: it => {
  text(fill: black)[#it]
}

// ── LISTS ─────────────────────────────────────────────────────
#set enum(indent: 1em)
#set list(indent: 1em)

// ── TABLES ────────────────────────────────────────────────────
#show table: set text(size: 9pt)

// %% CONTENT %%

#if pp-title != none [
// Title page — Brutalist manifesto
#page(header: none, footer: none)[
  #v(72pt)
  #align(left)[
    #text(size: 48pt, weight: "bold")[#upper[#pp-title]]
    #v(4pt)
    #line(length: 3cm, stroke: 4pt)
    #if pp-author != none [
    #v(16pt)
    #text(size: 14pt, font: "DejaVu Sans")[#pp-author]
    ]
    #if pp-date != none [
    #v(6pt)
    #text(size: 10pt, font: "DejaVu Sans")[#upper[#pp-date]]
    ]
  ]
  #v(1fr)
]
]
