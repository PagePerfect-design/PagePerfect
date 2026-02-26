// Exhibit — "This is a Gallery Space"
// White Cube philosophy — MoMA, Tate Modern, Kinfolk aesthetic
// Fira Sans body + TeX Gyre Adventor display, extreme whitespace, matte ink
// Target: Photography books, portfolios, modern poetry, art catalogs
//
// This is a Pandoc template — variables like $title$, $body$ use Pandoc syntax.

// ── COLORS ────────────────────────────────────────────────────
#let ghostgrey = luma(204)  // gray 80%
#let captiongrey = luma(115) // gray 45%

// ── PAGE GEOMETRY ─────────────────────────────────────────────
#set page(
  margin: (top: 1.2in, bottom: 1in, left: 1in, right: 1in),
  header: none,
  footer: context {
    let page-num = counter(page).at(here()).first()
    let is-odd = calc.odd(page-num)
    if is-odd {
      align(right, text(size: 8pt, fill: captiongrey, font: "Fira Sans")[#page-num])
    } else {
      align(left, text(size: 8pt, fill: captiongrey, font: "Fira Sans")[#page-num])
    }
  },
)

// ── TYPOGRAPHY — Museum Geometric Humanist ───────────────────
#set text(
  font: "$if(mainfont)$$mainfont$$else$Fira Sans$endif$",
  size: 10pt,
  ligatures: true,
  kerning: true,
  hyphenate: false,
  lang: "en",
)

// ── SPACING — Generous "placard" rhythm ──────────────────────
#set par(
  first-line-indent: 0pt,
  spacing: 0.2in,
  justify: false,
  leading: 0.65em * 1.5,
)

// ── CHAPTER HEADINGS — Giant UltraLight Number + Label ───────
#show heading.where(level: 1): it => {
  pagebreak(weak: true, to: "odd")
  v(72pt)
  align(left)[
    #text(size: 80pt, weight: "light", fill: ghostgrey, font: "TeX Gyre Adventor")[
      #counter(heading).display()
    ]
    #v(24pt)
    #text(size: 14pt, weight: "regular")[#upper(tracking(15pt, it.body))]
  ]
  v(40pt)
}

// H2: Tiny uppercase tracked
#show heading.where(level: 2): it => {
  v(28pt)
  text(size: 10pt, font: "TeX Gyre Adventor")[#upper(tracking(12pt, it.body))]
  v(10pt)
}

// H3: Italic, no tracking
#show heading.where(level: 3): it => {
  v(18pt)
  text(size: 10pt, style: "italic", font: "Fira Sans")[#it.body]
  v(6pt)
}

// ── BLOCK QUOTES ─────────────────────────────────────────────
#show quote: it => {
  pad(right: 2em)[
    #set text(size: 9pt, fill: captiongrey)
    #set par(leading: 0.65em * 1.3)
    #it.body
  ]
}

// ── LINKS ─────────────────────────────────────────────────────
#show link: it => {
  text(fill: luma(128))[#it]
}

// ── LISTS ─────────────────────────────────────────────────────
#set enum(indent: 1em)
#set list(indent: 1em)

// ── TABLES ────────────────────────────────────────────────────
#show table: set text(size: 9pt)

// ── Header includes (injected by compile pipeline) ───────────
$for(header-includes)$
$header-includes$
$endfor$

// ── DOCUMENT ──────────────────────────────────────────────────

$if(title)$
// Title page — White Cube: extreme whitespace, light weight, left-aligned
#page(header: none, footer: none)[
  #v(1fr)
  #v(72pt)
  #align(left)[
    #text(size: 36pt, weight: "light", font: "TeX Gyre Adventor")[$title$]
    $if(author)$
    #v(24pt)
    #text(size: 10pt, fill: captiongrey)[#upper(tracking(12pt)[$author$])]
    $endif$
    $if(date)$
    #v(6pt)
    #text(size: 9pt, fill: ghostgrey)[$date$]
    $endif$
  ]
  #v(1fr)
]
$endif$

$body$

$if(bibliography)$
#pagebreak()
#heading(level: 1, numbering: none)[Bibliography]
$bibliography$
$endif$
