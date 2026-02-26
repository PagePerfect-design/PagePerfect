// International — "The Swiss Standard"
// Müller-Brockmann modular grid system — one font, no italics, visible structure
// TeX Gyre Heros (Helvetica), asymmetric layout, section rules
// Target: Design portfolios, architecture proposals, brand guidelines, manifestos
//
// This is a Pandoc template — variables like $title$, $body$ use Pandoc syntax.

// ── COLORS ────────────────────────────────────────────────────
#let rulegrey = luma(77) // gray 30%

// ── PAGE GEOMETRY ─────────────────────────────────────────────
#set page(
  margin: (top: 1in, bottom: 1in, left: 1in, right: 1in),
  header: context {
    let page-num = counter(page).at(here()).first()
    if page-num <= 1 { return }
    set text(size: 7pt, font: "TeX Gyre Heros")
    grid(
      columns: (1fr, 1fr),
      align(left, upper(tracking(5pt, text(size: 7pt)[$if(title)$$title$$endif$]))),
      align(right)[#counter(page).display()],
    )
  },
  footer: none,
)

// ── TYPOGRAPHY — One Font Family Only ────────────────────────
// TeX Gyre Heros: hierarchy ONLY by size and weight
// Rule: No italics — Müller-Brockmann viewed them as "emotional corruption"
#set text(
  font: "$if(mainfont)$$mainfont$$else$TeX Gyre Heros$endif$",
  size: 9pt,
  ligatures: true,
  kerning: true,
  hyphenate: true,
  lang: "en",
)

// ── SPACING — Dense Swiss grid ───────────────────────────────
#set par(
  first-line-indent: 0pt,
  spacing: 8pt,
  justify: false,
  leading: 0.65em * 1.25,
)

// ── SECTION HEADINGS — Lowercase Swiss, ruled ────────────────
// H1: 0.5pt rule above + bold 18pt
#show heading.where(level: 1): it => {
  v(18pt)
  line(length: 100%, stroke: 0.5pt)
  v(6pt)
  text(size: 18pt, weight: "bold")[#it.body]
  v(8pt)
}

// H2: Bold 11pt, no rule
#show heading.where(level: 2): it => {
  v(12pt)
  text(size: 11pt, weight: "bold")[#it.body]
  v(4pt)
}

// H3: Regular weight, same size as body
#show heading.where(level: 3): it => {
  v(8pt)
  text(size: 9pt, weight: "regular")[#it.body]
  v(3pt)
}

// ── BLOCK QUOTES ─────────────────────────────────────────────
#show quote: it => {
  pad(left: 1em)[
    #set text(size: 8pt)
    #set par(leading: 0.65em * 1.15)
    #it.body
  ]
}

// ── LINKS ─────────────────────────────────────────────────────
#show link: it => {
  text(fill: luma(102))[#it]
}

// ── LISTS ─────────────────────────────────────────────────────
#set enum(indent: 1em)
#set list(indent: 1em)

// ── TABLES ────────────────────────────────────────────────────
#show table: set text(size: 8pt)

// ── Header includes (injected by compile pipeline) ───────────
$for(header-includes)$
$header-includes$
$endfor$

// ── DOCUMENT ──────────────────────────────────────────────────

$if(title)$
#v(24pt)
#align(left)[
  #text(size: 32pt, weight: "bold")[$title$]
  $if(author)$
  #v(8pt)
  #text(size: 9pt)[$author$]
  $endif$
  $if(date)$
  #v(4pt)
  #text(size: 7pt)[#upper(tracking(5pt)[$date$])]
  $endif$
]
#v(4pt)
#line(length: 100%, stroke: 0.5pt)
#v(16pt)
$endif$

$body$

$if(bibliography)$
#v(16pt)
#line(length: 100%, stroke: 0.5pt)
#v(8pt)
#heading(level: 1, numbering: none)[references]
$bibliography$
$endif$
