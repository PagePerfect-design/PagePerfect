// Minimal — "This is The Source Code"
// Radical Compatibility — zero extra dependencies, pure content focus
// Latin Modern body, wide margins, plain page style
// Target: Drafts, screenplays, documentation, submissions
//
// This is a Pandoc template — variables like $title$, $body$ use Pandoc syntax.

// ── PAGE GEOMETRY ─────────────────────────────────────────────
#set page(
  margin: (top: 1in, bottom: 1in, left: 1in, right: 1in),
  footer: context {
    align(center, text(size: 10pt)[
      #counter(page).display()
    ])
  },
)

// ── TYPOGRAPHY — Latin Modern ─────────────────────────────────
#set text(
  font: "$if(mainfont)$$mainfont$$else$Latin Modern Roman$endif$",
  size: 12pt,
  hyphenate: true,
  lang: "en",
)

// ── SPACING ───────────────────────────────────────────────────
#set par(
  first-line-indent: 0pt,
  spacing: 6pt,
  justify: true,
  leading: 0.65em * 1.5,
)

// ── HEADINGS — Standard, tightened ────────────────────────────
#show heading.where(level: 1): it => {
  v(18pt)
  text(size: 16pt, weight: "bold")[#it.body]
  v(10pt)
}

#show heading.where(level: 2): it => {
  v(14pt)
  text(size: 13pt, weight: "bold")[#it.body]
  v(8pt)
}

#show heading.where(level: 3): it => {
  v(10pt)
  text(size: 11pt, weight: "bold")[#it.body]
  v(6pt)
}

// ── LINKS ─────────────────────────────────────────────────────
#show link: it => {
  text(fill: rgb("2244AA"))[#underline[#it]]
}

// ── TABLES ────────────────────────────────────────────────────
#show table: set text(size: 10pt)

// ── Header includes (injected by compile pipeline) ───────────
$for(header-includes)$
$header-includes$
$endfor$

// ── DOCUMENT ──────────────────────────────────────────────────

$if(title)$
#align(center)[
  #text(size: 20pt, weight: "bold")[$title$]
  $if(author)$
  #v(8pt)
  #text(size: 14pt)[$author$]
  $endif$
  $if(date)$
  #v(4pt)
  #text(size: 12pt)[$date$]
  $endif$
]
#v(24pt)
$endif$

$body$

$if(bibliography)$
#pagebreak()
#heading(level: 1, numbering: none)[References]
$bibliography$
$endif$
