// Paperback — "This is a Netflix Adaptation"
// Commercial fiction template — NYT Bestseller aesthetic
// Alegreya Sans (humanist) body + cinematic chapter drops
// Target: Thrillers, modern romance, fiction, page-turners
//
// This is a Pandoc template — variables like $title$, $body$ use Pandoc syntax.

// ── COLORS ────────────────────────────────────────────────────
#let chapnum-grey = luma(217) // gray 85%

// ── PAGE GEOMETRY ─────────────────────────────────────────────
#set page(
  margin: (top: 1in, bottom: 1in, left: 1in, right: 1in),
  header: context {
    let page-num = counter(page).at(here()).first()
    if page-num <= 1 { return }
    let is-odd = calc.odd(page-num)
    set text(size: 8pt, font: "TeX Gyre Heros")
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
    align(center, text(size: 8pt)[#page-num])
  },
)

// ── TYPOGRAPHY — Humanist Sans for Fiction ────────────────────
#set text(
  font: "$if(mainfont)$$mainfont$$else$Alegreya Sans$endif$",
  size: 11pt,
  ligatures: true,
  kerning: true,
  hyphenate: true,
  lang: "en",
)

// ── SPACING — Fiction standard ────────────────────────────────
#set par(
  first-line-indent: 1.5em,
  spacing: 0pt,
  justify: true,
  leading: 0.65em * 1.35,
)

// ── CHAPTER HEADINGS — Cinematic Title Card ──────────────────
// Dramatic drop with massive grey number + bold title, right-aligned
#show heading.where(level: 1): it => {
  pagebreak(weak: true, to: "odd")
  v(48pt)
  align(right)[
    #text(size: 60pt, weight: "bold", fill: chapnum-grey, font: "TeX Gyre Heros")[
      #counter(heading).display()
    ]
    #v(-8pt)
    #text(size: 14pt, weight: "bold")[#it.body]
  ]
  v(24pt)
}

// Level 2: Left-aligned bold
#show heading.where(level: 2): it => {
  v(18pt)
  text(size: 12pt, weight: "bold")[#it.body]
  v(8pt)
}

// Level 3: Left-aligned bold, smaller
#show heading.where(level: 3): it => {
  v(12pt)
  text(size: 11pt, weight: "bold")[#it.body]
  v(6pt)
}

// ── SCENE BREAKS ──────────────────────────────────────────────
// Centered asterisks for time/scene transitions
#let scene-break() = {
  v(12pt)
  align(center, text(size: 12pt)[*  \*  \*  \*  *])
  v(12pt)
}

// ── BLOCK QUOTES ──────────────────────────────────────────────
#show quote: it => {
  pad(left: 1.5em, right: 1.5em)[
    #set text(style: "italic")
    #set par(leading: 0.65em * 1.2)
    #it.body
  ]
}

// ── LINKS ─────────────────────────────────────────────────────
#show link: it => {
  text(fill: rgb("555555"))[#it]
}

// ── LISTS ─────────────────────────────────────────────────────
#set enum(indent: 1.5em)
#set list(indent: 1.5em)

// ── TABLES ────────────────────────────────────────────────────
#show table: set text(size: 10pt)

// ── Header includes (injected by compile pipeline) ───────────
$for(header-includes)$
$header-includes$
$endfor$

// ── DOCUMENT ──────────────────────────────────────────────────

$if(title)$
// Title page — cinematic, right-aligned
#page(header: none, footer: none)[
  #align(right + horizon)[
    #text(size: 32pt, weight: "bold")[$title$]
    $if(author)$
    #v(16pt)
    #text(size: 14pt)[$author$]
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
