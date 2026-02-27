// Operator — "The Engineering Manual"
// O'Reilly / Braun manual aesthetic — semantic interruptions, admonition blocks
// Fira Sans body + Fira Mono code, structured layout with sidenote margins
// Target: Developers, engineers, product makers, technical writers
//
// This is a Pandoc template — variables like $title$, $body$ use Pandoc syntax.

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
      align(left, text(fill: rulegrey)[$if(title)$$title$$endif$]),
      align(right)[#counter(page).display()],
    )
    v(2pt)
    line(length: 100%, stroke: 0.5pt + rulegrey)
  },
  footer: none,
)

// ── TYPOGRAPHY — Machine Precision ───────────────────────────
#set text(
  font: "$if(mainfont)$$mainfont$$else$Fira Sans$endif$",
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

// ── Pandoc compatibility ─────────────────────────────────────
// Pandoc emits #horizontalrule for Markdown "---" thematic breaks
#let horizontalrule = line(start: (25%,0%), end: (75%,0%))

// ── Header includes (injected by compile pipeline) ───────────
$for(header-includes)$
$header-includes$
$endfor$

// ── DOCUMENT ──────────────────────────────────────────────────

$if(title)$
#align(left)[
  #v(16pt)
  #text(size: 26pt, weight: "bold", fill: headblue)[$title$]
  #v(4pt)
  #line(length: 3cm, stroke: 2pt + headblue)
  $if(author)$
  #v(8pt)
  #text(size: 12pt)[$author$]
  $endif$
  $if(date)$
  #v(4pt)
  #text(size: 10pt, fill: rulegrey)[$date$]
  $endif$
]
#v(12pt)
$endif$

$body$

$if(bibliography)$
#pagebreak()
#heading(level: 1, numbering: none)[References]
$bibliography$
$endif$
