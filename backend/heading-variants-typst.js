/**
 * Heading Variants System (Typst version)
 *
 * Each of the 15 base templates has 3 heading variants:
 *   - classic: The template's built-in heading style (no override)
 *   - modern:  Clean, restrained, letterspaced, minimal ornamentation
 *   - bold:    Dramatic, oversized numbers, heavy rules, high contrast
 *
 * Variants are Typst show rules injected via header-includes.
 * "classic" returns empty string because the template already contains defaults.
 *
 * IMPORTANT: Every heading show rule MUST reset `first-line-indent`, `spacing`,
 * and `justify` to prevent inheritance from the template's #set par(...).
 * Without this, templates with first-line-indent (chicago: 2em, symphony: 1.5em,
 * paperback: 1.5em, etc.) cause indented chapter numbers and titles,
 * templates with spacing > 0 (exhibit: 0.2in, heirloom: 8pt, etc.)
 * add unwanted gaps between heading elements, and templates with justify: true
 * cause catastrophic word-spacing in headings (titles stretched across the line).
 */

'use strict';

// Re-use TEMPLATE_CLASS from the LaTeX module
const { TEMPLATE_CLASS } = require('./heading-variants');

// ================================================================
// Book-class variants (templates with level-1 heading as chapter)
// ================================================================

const BOOK_MODERN = `
// ── Heading Variant: Modern ──────────────────────────────────
// Clean, restrained, letterspaced. No ornament, no drama.

#show heading.where(level: 1): it => {
  set par(first-line-indent: 0pt, spacing: 0pt, justify: false)
  pagebreak(weak: true, to: "odd")
  v(40pt)
  text(size: 10pt, tracking: 1.5pt, fill: luma(140))[
    #upper[Chapter #counter(heading).display()]
  ]
  v(8pt)
  text(size: 18pt, tracking: 0.3pt)[#it.body]
  v(28pt)
}

#show heading.where(level: 2): it => {
  set par(first-line-indent: 0pt, spacing: 0pt, justify: false)
  v(22pt)
  text(size: 11pt, tracking: 0.8pt)[#upper[#it.body]]
  v(8pt)
}

#show heading.where(level: 3): it => {
  set par(first-line-indent: 0pt, spacing: 0pt, justify: false)
  v(16pt)
  text(size: 11pt, fill: luma(140))[#it.body]
  v(6pt)
}

#show heading.where(level: 4): it => {
  set par(first-line-indent: 0pt, spacing: 0pt, justify: false)
  v(12pt)
  text(size: 10pt, style: "italic")[#it.body]
  v(4pt)
}
`;

const BOOK_BOLD = `
// ── Heading Variant: Bold ────────────────────────────────────
// Dramatic, oversized numbers, heavy rules, maximum presence.

#show heading.where(level: 1): it => {
  set par(first-line-indent: 0pt, spacing: 0pt, justify: false)
  pagebreak(weak: true, to: "odd")
  v(24pt)
  text(size: 96pt, weight: "bold", fill: luma(225))[
    #counter(heading).display()
  ]
  v(-40pt)
  text(size: 24pt, weight: "bold")[#upper[#it.body]]
  v(6pt)
  line(length: 100%, stroke: 2pt)
  v(28pt)
}

#show heading.where(level: 2): it => {
  set par(first-line-indent: 0pt, spacing: 0pt, justify: false)
  v(20pt)
  line(length: 100%, stroke: 1pt)
  v(6pt)
  text(size: 14pt, weight: "bold")[#upper[#it.body]]
  v(10pt)
}

#show heading.where(level: 3): it => {
  set par(first-line-indent: 0pt, spacing: 0pt, justify: false)
  v(16pt)
  text(size: 11pt, weight: "bold")[#it.body]
  v(6pt)
}

#show heading.where(level: 4): it => {
  set par(first-line-indent: 0pt, spacing: 0pt, justify: false)
  v(12pt)
  text(size: 11pt, weight: "bold")[#it.body]
  v(4pt)
}
`;

// ================================================================
// Article-class variants (templates without chapters)
// ================================================================

const ARTICLE_MODERN = `
// ── Heading Variant: Modern ──────────────────────────────────
// Clean, restrained, letterspaced. Hairline rules, no drama.

#show heading.where(level: 1): it => {
  set par(first-line-indent: 0pt, spacing: 0pt, justify: false)
  v(22pt)
  text(size: 16pt, tracking: 0.6pt)[#it.body]
  v(10pt)
}

#show heading.where(level: 2): it => {
  set par(first-line-indent: 0pt, spacing: 0pt, justify: false)
  v(16pt)
  text(size: 10pt, tracking: 1pt, fill: luma(140))[#upper[#it.body]]
  v(6pt)
}

#show heading.where(level: 3): it => {
  set par(first-line-indent: 0pt, spacing: 0pt, justify: false)
  v(10pt)
  text(size: 11pt, style: "italic", fill: luma(140))[#it.body]
  v(4pt)
}
`;

const ARTICLE_BOLD = `
// ── Heading Variant: Bold ────────────────────────────────────
// Heavy rules, large type, maximum presence.

#show heading.where(level: 1): it => {
  set par(first-line-indent: 0pt, spacing: 0pt, justify: false)
  v(6pt)
  line(length: 100%, stroke: 3pt)
  v(8pt)
  text(size: 26pt, weight: "bold")[#it.body]
  v(10pt)
}

#show heading.where(level: 2): it => {
  set par(first-line-indent: 0pt, spacing: 0pt, justify: false)
  v(3pt)
  line(length: 100%, stroke: 0.5pt)
  v(6pt)
  text(size: 14pt, weight: "bold")[#upper[#it.body]]
  v(6pt)
}

#show heading.where(level: 3): it => {
  set par(first-line-indent: 0pt, spacing: 0pt, justify: false)
  v(10pt)
  text(size: 11pt, weight: "bold")[#it.body]
  v(4pt)
}
`;

// ================================================================
// Thesis-class variants (article with numbered sections)
// ================================================================

const THESIS_MODERN = `
// ── Heading Variant: Modern (Thesis — numbered sections preserved) ──

#show heading.where(level: 1): it => {
  set par(first-line-indent: 0pt, spacing: 0pt, justify: false)
  v(22pt)
  text(size: 16pt, tracking: 0.6pt)[
    #counter(heading).display() #h(0.5em) #it.body
  ]
  v(10pt)
}

#show heading.where(level: 2): it => {
  set par(first-line-indent: 0pt, spacing: 0pt, justify: false)
  v(16pt)
  text(size: 10pt, tracking: 1pt, fill: luma(140))[
    #upper[#counter(heading).display() #h(0.5em) #it.body]
  ]
  v(6pt)
}

#show heading.where(level: 3): it => {
  set par(first-line-indent: 0pt, spacing: 0pt, justify: false)
  v(10pt)
  text(size: 11pt, style: "italic", fill: luma(140))[
    #counter(heading).display() #h(0.5em) #it.body
  ]
  v(4pt)
}
`;

const THESIS_BOLD = `
// ── Heading Variant: Bold (Thesis — numbered sections preserved) ──

#show heading.where(level: 1): it => {
  set par(first-line-indent: 0pt, spacing: 0pt, justify: false)
  v(6pt)
  line(length: 100%, stroke: 3pt)
  v(8pt)
  text(size: 26pt, weight: "bold")[
    #counter(heading).display() #h(0.5em) #it.body
  ]
  v(10pt)
}

#show heading.where(level: 2): it => {
  set par(first-line-indent: 0pt, spacing: 0pt, justify: false)
  v(3pt)
  line(length: 100%, stroke: 0.5pt)
  v(6pt)
  text(size: 14pt, weight: "bold")[
    #upper[#counter(heading).display() #h(0.5em) #it.body]
  ]
  v(6pt)
}

#show heading.where(level: 3): it => {
  set par(first-line-indent: 0pt, spacing: 0pt, justify: false)
  v(10pt)
  text(size: 11pt, weight: "bold")[
    #counter(heading).display() #h(0.5em) #it.body
  ]
  v(4pt)
}
`;

// ================================================================
// Variant Selection
// ================================================================

/**
 * Get the Typst preamble override for a heading variant.
 *
 * @param {string} templateKey — e.g. 'symphony', 'chronicle'
 * @param {string} variant — 'classic' | 'modern' | 'bold'
 * @returns {string} Typst show rules (empty string for 'classic')
 */
function getTypstVariantPreamble(templateKey, variant) {
  if (!variant || variant === 'classic') return '';

  const cls = TEMPLATE_CLASS[templateKey] || 'article';

  if (variant === 'modern') {
    if (templateKey === 'thesis') return THESIS_MODERN;
    return cls === 'book' ? BOOK_MODERN : ARTICLE_MODERN;
  }
  if (variant === 'bold') {
    if (templateKey === 'thesis') return THESIS_BOLD;
    return cls === 'book' ? BOOK_BOLD : ARTICLE_BOLD;
  }

  return '';
}

module.exports = {
  getTypstVariantPreamble,
};
