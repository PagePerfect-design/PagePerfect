// Memoir — "This is My Story"
// Warm, literary personal narrative — softer than Paperback, more intimate
// Libre Baskerville body, decorative scene breaks, warm amber accents
// Target: Memoir, autobiography, personal essays, travel writing
//
// This is a Pandoc template — variables like $title$, $body$ use Pandoc syntax.

// ── COLORS ────────────────────────────────────────────────────
#let memoiramber = rgb("8B6914")
#let chapgrey = luma(179) // gray 70%

// ── PAGE GEOMETRY ─────────────────────────────────────────────
#set page(
  margin: (top: 1in, bottom: 1in, left: 1in, right: 1in),
  header: context {
    let page-num = counter(page).at(here()).first()
    if page-num <= 1 { return }
    let is-odd = calc.odd(page-num)
    set text(size: 8pt)
    if is-odd {
      // Odd pages: chapter name (italic) right-aligned
      align(right, emph[
        #context {
          let headings = query(heading.where(level: 1).before(here()))
          if headings.len() > 0 { headings.last().body }
        }
      ])
    } else {
      // Even pages: book title (italic) left-aligned
      align(left, emph[$if(title)$$title$$endif$])
    }
  },
  footer: context {
    align(center, text(size: 9pt)[#counter(page).display()])
  },
)

// ── TYPOGRAPHY — Warm Literary Serif ─────────────────────────
#set text(
  font: "$if(mainfont)$$mainfont$$else$Libre Baskerville$endif$",
  size: 11pt,
  ligatures: true,
  kerning: true,
  hyphenate: true,
  lang: "en",
)

// ── SPACING — Comfortable reading ────────────────────────────
#set par(
  first-line-indent: 1.5em,
  spacing: 0pt,
  justify: true,
  leading: 0.65em * 1.35,
)

// ── CHAPTER HEADINGS — Intimate, Warm ────────────────────────
// Centered chapter number in grey + italic amber title + thin rule
#show heading.where(level: 1): it => {
  pagebreak(weak: true, to: "odd")
  v(36pt)
  align(center)[
    #text(size: 11pt, fill: chapgrey)[#counter(heading).display()]
    #v(12pt)
    #text(size: 16pt, style: "italic", fill: memoiramber)[#it.body]
    #v(6pt)
    #line(length: 1.2cm, stroke: 0.3pt)
  ]
  v(24pt)
}

// H2: Left-aligned bold
#show heading.where(level: 2): it => {
  v(20pt)
  text(size: 14pt, weight: "bold")[#it.body]
  v(8pt)
}

// H3: Left-aligned italic
#show heading.where(level: 3): it => {
  v(14pt)
  text(size: 11pt, style: "italic")[#it.body]
  v(6pt)
}

// ── SCENE BREAKS ─────────────────────────────────────────────
#let scene-break() = {
  v(14pt)
  align(center, text(size: 10pt, fill: memoiramber)[~ #h(1em) ~ #h(1em) ~])
  v(14pt)
}

// ── BLOCK QUOTES — Warm, Intimate ────────────────────────────
#show quote: it => {
  pad(left: 1.5em, right: 1.5em)[
    #set text(style: "italic")
    #set par(leading: 0.65em * 1.2)
    #it.body
  ]
}

// ── LINKS ─────────────────────────────────────────────────────
#show link: it => {
  text(fill: memoiramber)[#it]
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
// Title page — warm, centered, intimate
#page(header: none, footer: none)[
  #align(center + horizon)[
    #text(size: 28pt, style: "italic", fill: memoiramber)[$title$]
    #v(10pt)
    #line(length: 1.5cm, stroke: 0.3pt)
    $if(author)$
    #v(14pt)
    #text(size: 14pt)[$author$]
    $endif$
    $if(date)$
    #v(8pt)
    #text(size: 12pt, fill: chapgrey)[$date$]
    $endif$
  ]
]
$endif$

$body$

$if(bibliography)$
#pagebreak()
#heading(level: 2, numbering: none)[Bibliography]
$bibliography$
$endif$
