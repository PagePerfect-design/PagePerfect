// Heirloom — "The Modern Gastronomy Book"
// Cookbook format with mise-en-place grid separation
// DejaVu Serif headers + Fira Sans body, asymmetric recipe layout
// Target: Chefs, food bloggers, family recipe collections
//
// This is a Pandoc template — variables like $title$, $body$ use Pandoc syntax.

// ── COLORS ────────────────────────────────────────────────────
#let recipetitle = rgb("8B4513")  // saddlebrown
#let ingredientbg = luma(247)     // gray 97%
#let rulegrey = luma(153)         // gray 60%

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
  },
  footer: none,
)

// ── TYPOGRAPHY — Kitchen-Robust ──────────────────────────────
// Fira Sans for body (clean, readable at small sizes)
#set text(
  font: "$if(mainfont)$$mainfont$$else$Fira Sans$endif$",
  size: 11pt,
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

// ── SECTION HEADINGS — Recipe Card Style ─────────────────────
// H1: Rule above + warm saddlebrown serif title
#show heading.where(level: 1): it => {
  v(20pt)
  line(length: 100%, stroke: 0.5pt + rulegrey)
  v(8pt)
  text(size: 20pt, weight: "bold", fill: recipetitle, font: "DejaVu Serif")[#it.body]
  v(8pt)
}

// H2: Tracked uppercase, bold
#show heading.where(level: 2): it => {
  v(14pt)
  text(size: 12pt, weight: "bold")[#upper(tracking(3pt, it.body))]
  v(4pt)
}

// H3: Bold, standard
#show heading.where(level: 3): it => {
  v(8pt)
  text(size: 11pt, weight: "bold")[#it.body]
  v(3pt)
}

// ── BLOCK QUOTES — Ingredient/Note blocks ────────────────────
// Shaded background boxes (like recipe ingredient cards)
#show quote: it => {
  v(4pt)
  block(
    width: 100%,
    fill: ingredientbg,
    inset: 10pt,
    radius: 0pt,
  )[
    #set text(size: 10pt)
    #set par(leading: 0.65em * 1.2)
    #it.body
  ]
  v(4pt)
}

// ── LINKS ─────────────────────────────────────────────────────
#show link: it => {
  text(fill: recipetitle)[#it]
}

// ── LISTS — Bold numbered steps ──────────────────────────────
#set enum(indent: 2em)
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
#align(center)[
  #v(24pt)
  #text(size: 28pt, weight: "bold", fill: recipetitle, font: "DejaVu Serif")[$title$]
  #v(4pt)
  #line(length: 2cm, stroke: 0.5pt + rulegrey)
  $if(author)$
  #v(8pt)
  #text(size: 12pt)[$author$]
  $endif$
  $if(date)$
  #v(4pt)
  #text(size: 10pt, fill: rulegrey)[$date$]
  $endif$
]
#v(16pt)
$endif$

$body$

$if(bibliography)$
#pagebreak()
#heading(level: 1, numbering: none)[Sources]
$bibliography$
$endif$
