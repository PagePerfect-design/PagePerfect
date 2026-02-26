// Cinema — "The Hollywood Standard"
// Production-ready screenplay format — "1 Page = 1 Minute" rule
// TeX Gyre Cursor (Courier), strict margins, industry-standard spacing
// Target: Screenwriters, indie filmmakers, playwrights
//
// This is a Pandoc template — variables like $title$, $body$ use Pandoc syntax.

// ── PAGE GEOMETRY — Strict screenplay margins ────────────────
#set page(
  width: 8.5in,
  height: 11in,
  margin: (top: 1in, bottom: 1in, left: 1.5in, right: 1in),
  header: context {
    let page-num = counter(page).at(here()).first()
    if page-num <= 1 { return }
    align(right, text(size: 12pt, font: "TeX Gyre Cursor")[#counter(page).display().])
  },
  footer: none,
)

// ── TYPOGRAPHY — Courier 12pt is non-negotiable ──────────────
#set text(
  font: "$if(mainfont)$$mainfont$$else$TeX Gyre Cursor$endif$",
  size: 12pt,
  ligatures: false,
  kerning: false,
  hyphenate: false,
  lang: "en",
)

// ── SPACING — Strict screenplay spacing ──────────────────────
// 12pt font, 12pt leading (single spaced)
#set par(
  first-line-indent: 0pt,
  spacing: 12pt,
  justify: false,
  leading: 0.65em * 1.0,
)

// ── HEADINGS — Screenplay hierarchy ──────────────────────────
// Sluglines (scene headings) = H1 = ALL CAPS, triple-spaced above
#show heading.where(level: 1): it => {
  v(24pt)
  text(size: 12pt, weight: "bold")[#upper[#it.body]]
  v(12pt)
}

// H2: Bold, normal case
#show heading.where(level: 2): it => {
  v(12pt)
  text(size: 12pt, weight: "bold")[#it.body]
  v(6pt)
}

// H3: Regular weight
#show heading.where(level: 3): it => {
  v(12pt)
  text(size: 12pt, weight: "regular")[#it.body]
  v(3pt)
}

// ── BLOCK QUOTES — Dialogue blocks ──────────────────────────
// Centered narrower block for dialogue, mimicking screenplay format
#show quote: it => {
  pad(left: 1in, right: 0.5in)[
    #it.body
  ]
}

// ── LINKS — No color (print screenplay) ─────────────────────
#show link: it => { it }

// ── TABLES ────────────────────────────────────────────────────
#show table: set text(size: 10pt)

// ── Header includes (injected by compile pipeline) ───────────
$for(header-includes)$
$header-includes$
$endfor$

// ── DOCUMENT ──────────────────────────────────────────────────

$if(title)$
// Title page — Hollywood standard centered
#page(header: none, footer: none)[
  #v(2in)
  #align(center)[
    #text(size: 12pt)[#upper[$title$]]
    $if(author)$
    #v(24pt)
    #text(size: 12pt)[by]
    #v(12pt)
    #text(size: 12pt)[$author$]
    $endif$
    $if(date)$
    #v(24pt)
    #text(size: 12pt)[$date$]
    $endif$
  ]
]
$endif$

$body$
