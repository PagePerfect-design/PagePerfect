// Symphony Academic — "The Van de Graaf Canon"
// Classical academic design inspired by Gutenberg/Tschichold proportions
// EB Garamond body, ornamental chapter openings, microtype protrusion
// Target: Dissertations, literary criticism, humanities monographs
//
// This is a Pandoc template — variables like $title$, $body$ use Pandoc syntax.

// ── COLORS ────────────────────────────────────────────────────
#let oxblood = rgb("800020")
#let chaptergrey = luma(115) // gray 45%

// ── PAGE GEOMETRY ─────────────────────────────────────────────
#set page(
  margin: (top: 1in, bottom: 1in, left: 1in, right: 1in),
  header: context {
    let page-num = counter(page).at(here()).first()
    if page-num <= 1 { return }
    let is-odd = calc.odd(page-num)
    set text(size: 8pt, font: "EB Garamond")
    if is-odd {
      align(right)[
        #emph[
          #context {
            let headings = query(heading.where(level: 1).before(here()))
            if headings.len() > 0 { headings.last().body }
          }
        ]
        #h(1em)
        #counter(page).display()
      ]
    } else {
      align(left)[
        #counter(page).display()
        #h(1em)
        #smallcaps[$if(title)$$title$$endif$]
      ]
    }
  },
  footer: none,
)

// ── TYPOGRAPHY — EB Garamond ─────────────────────────────────
#set text(
  font: "$if(mainfont)$$mainfont$$else$EB Garamond$endif$",
  size: 12pt,
  ligatures: true,
  kerning: true,
  hyphenate: true,
  lang: "en",
)

// ── SPACING ───────────────────────────────────────────────────
#set par(
  first-line-indent: 1.5em,
  spacing: 0pt,
  justify: true,
  leading: 0.65em * 1.15,
)

// ── CHAPTER HEADINGS — Ornamental Style ──────────────────────
// Centered small-caps "CHAPTER N" in grey + oxblood title + thin rule
#show heading.where(level: 1): it => {
  pagebreak(weak: true, to: "odd")
  v(50pt)
  align(center)[
    #text(size: 11pt, weight: "regular", fill: chaptergrey)[
      #smallcaps[#upper[Chapter #counter(heading).display()]]
    ]
    #v(12pt)
    #text(size: 18pt, weight: "bold", fill: oxblood)[#smallcaps[#it.body]]
    #v(4pt)
    #line(length: 1cm, stroke: 0.4pt)
  ]
  v(30pt)
}

// Level 2: Left-aligned bold serif
#show heading.where(level: 2): it => {
  v(24pt)
  text(size: 14pt, weight: "bold")[#it.body]
  v(12pt)
}

// Level 3: Left-aligned italic
#show heading.where(level: 3): it => {
  v(18pt)
  text(size: 12pt, style: "italic")[#it.body]
  v(8pt)
}

// Level 4: Small caps
#show heading.where(level: 4): it => {
  v(14pt)
  text(size: 11pt)[#smallcaps[#it.body]]
  v(6pt)
}

// ── FOOTNOTES ─────────────────────────────────────────────────
#set footnote.entry(
  separator: line(length: 2in, stroke: 0.4pt),
  indent: 0.5em,
  gap: 0.5em,
)

// ── BLOCK QUOTES ──────────────────────────────────────────────
#show quote: it => {
  pad(left: 2em, right: 2em)[
    #set text(size: 10.5pt)
    #set par(leading: 0.65em * 1.05)
    #it.body
  ]
}

// ── LINKS ─────────────────────────────────────────────────────
#show link: it => {
  text(fill: oxblood)[#it]
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
// Title page — centered, classical, oxblood
#page(header: none, footer: none)[
  #align(center + horizon)[
    #text(size: 28pt, fill: oxblood)[#smallcaps[$title$]]
    #v(16pt)
    #line(length: 2cm, stroke: 0.4pt)
    $if(author)$
    #v(12pt)
    #text(size: 14pt, style: "italic")[$author$]
    $endif$
    $if(date)$
    #v(8pt)
    #text(size: 12pt)[$date$]
    $endif$
  ]
]
$endif$

$body$

$if(bibliography)$
#pagebreak()
#heading(level: 2, numbering: none)[References]
$bibliography$
$endif$
