// Chicago — "The University Press Monograph"
// Strict academic template adhering to Chicago Manual of Style spirit
// ETbb (Bembo-like) body, true footnotes, deep indents, restrained hierarchy
// Target: Dissertations, monographs, history, theology, humanities
//
// This is a Pandoc template — variables like $title$, $body$ use Pandoc syntax.

// ── PAGE GEOMETRY (injected by grid-system via header-includes) ────────
// Default page setup — overridden by header-includes from compile pipeline
#set page(
  margin: (top: 1in, bottom: 1in, left: 1in, right: 1in),
  header: context {
    let page-num = counter(page).at(here()).first()
    // No header on first page of chapters (plain style)
    if page-num <= 1 { return }
    let is-odd = calc.odd(page-num)
    set text(size: 8pt, font: "ETbb")
    if is-odd {
      // Odd pages: chapter name (italic) right-aligned
      align(right, emph[
        #context {
          let headings = query(heading.where(level: 1).before(here()))
          if headings.len() > 0 { headings.last().body }
        }
      ])
    } else {
      // Even pages: book title (small caps) left-aligned
      align(left, smallcaps[$if(title)$$title$$endif$])
    }
  },
  footer: context {
    let page-num = counter(page).at(here()).first()
    align(center, text(size: 8pt, font: "ETbb")[#page-num])
  },
)

// ── TYPOGRAPHY ─────────────────────────────────────────────────
// Body: ETbb (Bembo-like) — the "Scholar's Serif"
#set text(
  font: "$if(mainfont)$$mainfont$$else$ETbb$endif$",
  size: 11pt,
  ligatures: true,
  kerning: true,
  hyphenate: true,
  lang: "en",
)

// ── SPACING ───────────────────────────────────────────────────
#set par(
  first-line-indent: 2em,
  spacing: 1.15em,
  justify: true,
  leading: 0.65em * 1.15,
)

// ── CHAPTER HEADINGS — Centered, Restrained ──────────────────
// Level 1: Chapter titles with "CHAPTER N" label + centered bold title
#show heading.where(level: 1): it => {
  pagebreak(weak: true, to: "odd")
  v(50pt)
  align(center)[
    #text(size: 10pt, weight: "regular")[
      #smallcaps[#upper[Chapter #counter(heading).display()]]
    ]
    #v(10pt)
    #text(size: 14pt, weight: "bold")[#it.body]
  ]
  v(30pt)
}

// Level 2: Centered, bold
#show heading.where(level: 2): it => {
  v(24pt)
  align(center, text(size: 12pt, weight: "bold")[#it.body])
  v(12pt)
}

// Level 3: Centered, italic
#show heading.where(level: 3): it => {
  v(18pt)
  align(center, text(size: 11pt, style: "italic")[#it.body])
  v(8pt)
}

// Level 4: Left-aligned, small caps
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
    #set text(size: 10pt)
    #set par(leading: 0.65em * 1.05)
    #it.body
  ]
}

// ── LINKS ─────────────────────────────────────────────────────
#show link: it => {
  text(fill: rgb("333333"))[#it]
}

// ── LISTS ─────────────────────────────────────────────────────
#set enum(indent: 2em)
#set list(indent: 2em)

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
// Title page
#page(header: none, footer: none)[
  #align(center + horizon)[
    #text(size: 20pt, weight: "bold")[$title$]
    $if(author)$
    #v(20pt)
    #text(size: 14pt)[$author$]
    $endif$
    $if(date)$
    #v(10pt)
    #text(size: 12pt)[$date$]
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
