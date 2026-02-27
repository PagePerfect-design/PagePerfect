// Verse — "This is a Poem"
// Line-based layout for poetry, verse drama, and song lyrics
// EB Garamond body, centered titles, no paragraph indent, generous leading
// Target: Poetry collections, verse drama, lyric anthologies, song books
//
// This is a Pandoc template — variables like $title$, $body$ use Pandoc syntax.

// ── COLORS ────────────────────────────────────────────────────
#let titlegrey = luma(102) // gray 40%

// ── PAGE GEOMETRY ─────────────────────────────────────────────
#set page(
  margin: (top: 1.2in, bottom: 1in, left: 1.2in, right: 1.2in),
  header: none,
  footer: context {
    align(center, text(size: 9pt)[#counter(page).display()])
  },
)

// ── TYPOGRAPHY — Classical Serif for Verse ───────────────────
#set text(
  font: "$if(mainfont)$$mainfont$$else$EB Garamond$endif$",
  size: 11pt,
  ligatures: true,
  kerning: true,
  hyphenate: false,
  lang: "en",
)

// ── SPACING — Generous breathing room for verse ──────────────
#set par(
  first-line-indent: 0pt,
  spacing: 6pt,
  justify: false,
  leading: 0.65em * 1.4,
)

// ── CHAPTER HEADINGS — Centered, Delicate ────────────────────
// Poem titles as chapter openings — centered, italic, thin rule
#show heading.where(level: 1): it => {
  pagebreak(weak: true, to: "odd")
  v(60pt)
  align(center)[
    #text(size: 10pt, fill: titlegrey)[
      #smallcaps[#upper[#counter(heading).display()]]
    ]
    #v(10pt)
    #text(size: 16pt, style: "italic")[#it.body]
    #v(4pt)
    #line(length: 0.6cm, stroke: 0.3pt)
  ]
  v(24pt)
}

// H2 = poem title within a section — centered italic
#show heading.where(level: 2): it => {
  v(30pt)
  align(center, text(size: 14pt, style: "italic")[#it.body])
  v(12pt)
}

// H3 = subsection — centered small caps
#show heading.where(level: 3): it => {
  v(18pt)
  align(center, text(size: 11pt)[#smallcaps[#it.body]])
  v(8pt)
}

// ── BLOCK QUOTES — Epigraph style ────────────────────────────
#show quote: it => {
  pad(left: 2em, right: 2em)[
    #set text(size: 10pt, style: "italic")
    #set par(leading: 0.65em * 1.2)
    #it.body
  ]
}

// ── LINKS ─────────────────────────────────────────────────────
#show link: it => {
  text(fill: luma(102))[#it]
}

// ── LISTS ─────────────────────────────────────────────────────
#set enum(indent: 1.5em)
#set list(indent: 1.5em)

// ── TABLES ────────────────────────────────────────────────────
#show table: set text(size: 10pt)

// ── Pandoc compatibility ─────────────────────────────────────
// Pandoc emits #horizontalrule for Markdown "---" thematic breaks
#let horizontalrule = line(start: (25%,0%), end: (75%,0%))

// ── Header includes (injected by compile pipeline) ───────────
$for(header-includes)$
$header-includes$
$endfor$

// ── DOCUMENT ──────────────────────────────────────────────────

$if(title)$
// Title page — centered, delicate, poetic
#page(header: none, footer: none)[
  #align(center + horizon)[
    #text(size: 24pt, style: "italic")[$title$]
    #v(8pt)
    #line(length: 1.5cm, stroke: 0.3pt)
    $if(author)$
    #v(12pt)
    #text(size: 12pt)[#smallcaps[$author$]]
    $endif$
    $if(date)$
    #v(8pt)
    #text(size: 11pt, fill: titlegrey)[$date$]
    $endif$
  ]
]
$endif$

$body$

$if(bibliography)$
#pagebreak()
#heading(level: 2, numbering: none)[Notes]
$bibliography$
$endif$
