// Matrix — "This is an Annual Report"
// Swiss Corporate system — McKinsey/BCG precision
// Fira Sans body with tabular figures, structured hierarchy, executive clarity
// Target: Annual reports, white papers, consulting decks, business docs
//
// This is a Pandoc template — variables like $title$, $body$ use Pandoc syntax.

// ── COLORS ────────────────────────────────────────────────────
#let corpblue = rgb("191970")   // MidnightBlue
#let rulegrey = luma(179)       // gray 70%

// ── PAGE GEOMETRY ─────────────────────────────────────────────
#set page(
  margin: (top: 1in, bottom: 1in, left: 1in, right: 1in),
  header: context {
    let page-num = counter(page).at(here()).first()
    if page-num <= 1 { return }
    set text(size: 8pt, font: "Fira Sans")
    grid(
      columns: (1fr, 1fr),
      align(left, text(fill: rulegrey)[$if(title)$$title$$endif$]),
      align(right)[#counter(page).display()],
    )
    v(2pt)
    line(length: 100%, stroke: 0.5pt + rulegrey)
  },
  footer: none,
)

// ── TYPOGRAPHY — Fintech Precision ───────────────────────────
#set text(
  font: "$if(mainfont)$$mainfont$$else$Fira Sans$endif$",
  size: 10pt,
  ligatures: true,
  kerning: true,
  hyphenate: true,
  lang: "en",
  number-type: "lining",
)

// ── SPACING — Dense but legible ──────────────────────────────
#set par(
  first-line-indent: 0pt,
  spacing: 8pt,
  justify: true,
  leading: 0.65em * 1.4,
)

// ── SECTION HEADINGS — Corporate Weight Contrast ─────────────
// H1: Black weight, large, tight tracking
#show heading.where(level: 1): it => {
  v(20pt)
  text(size: 22pt, weight: "bold")[#it.body]
  v(8pt)
}

// H2: Bold, uppercase, tracked, navy
#show heading.where(level: 2): it => {
  v(16pt)
  text(size: 12pt, weight: "bold", fill: corpblue)[#upper(tracking(5pt, it.body))]
  v(6pt)
}

// H3: Bold, standard
#show heading.where(level: 3): it => {
  v(10pt)
  text(size: 10pt, weight: "bold")[#it.body]
  v(4pt)
}

// ── BLOCK QUOTES — Executive Summary Style ───────────────────
#show quote: it => {
  v(6pt)
  block[
    #box(width: 4pt, height: 100%, fill: corpblue)
    #h(8pt)
    #box(width: 100% - 20pt)[
      #set text(size: 10pt)
      #set par(leading: 0.65em * 1.2)
      #it.body
    ]
  ]
  v(6pt)
}

// ── LINKS ─────────────────────────────────────────────────────
#show link: it => {
  text(fill: corpblue)[#it]
}

// ── LISTS ─────────────────────────────────────────────────────
#set enum(indent: 1.2em)
#set list(indent: 1.2em)

// ── TABLES — Professional ────────────────────────────────────
#show table: set text(size: 9pt)

// ── Header includes (injected by compile pipeline) ───────────
$for(header-includes)$
$header-includes$
$endfor$

// ── DOCUMENT ──────────────────────────────────────────────────

$if(title)$
#line(length: 100%, stroke: 0.5pt + rulegrey)
#v(8pt)
#align(left)[
  #text(size: 28pt, weight: "bold")[$title$]
  $if(author)$
  #v(8pt)
  #text(size: 11pt, fill: rulegrey)[$author$]
  $endif$
  $if(date)$
  #v(4pt)
  #text(size: 9pt, fill: rulegrey)[#upper(tracking(3pt)[$date$])]
  $endif$
]
#v(4pt)
#line(length: 100%, stroke: 0.5pt + rulegrey)
#v(12pt)
$endif$

$body$

$if(bibliography)$
#pagebreak()
#heading(level: 1, numbering: none)[References]
$bibliography$
$endif$
