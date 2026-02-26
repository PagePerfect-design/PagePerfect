/**
 * Heading Variants System
 *
 * Each of the 15 base templates has 3 heading variants:
 *   - classic: The template's built-in heading style (no override)
 *   - modern:  Clean, restrained, letterspaced, minimal ornamentation
 *   - bold:    Dramatic, oversized numbers, heavy rules, high contrast
 *
 * Variants are LaTeX preamble snippets injected via -H header.tex,
 * overriding the template's built-in \titleformat commands.
 * Zero new .latex files — the variant system is purely additive.
 *
 * Architecture note: "classic" returns empty string because the
 * template's .latex file already contains the default headings.
 * "modern" and "bold" completely redefine \titleformat for all
 * heading levels, so they override whatever the template defines.
 */

// ================================================================
// Book-class variants (templates with \chapter)
// ================================================================

const BOOK_MODERN = `
% ── Heading Variant: Modern ──────────────────────────────────
% Clean, restrained, letterspaced. No ornament, no drama.
% NOTE: \\vspace* belongs in \\titlespacing* (before-sep), NOT inside the label.
% Putting \\vspace* in the label triggers "titlesec: entered in horizontal mode".
\\definecolor{hv@grey}{gray}{0.55}

\\titleformat{\\chapter}[display]
  {\\normalfont\\raggedright}
  {{\\fontsize{10pt}{10pt}\\selectfont\\sffamily\\addfontfeature{LetterSpace=15}\\color{hv@grey}\\MakeUppercase{\\chaptertitlename\\ \\thechapter}}}
  {8pt}
  {\\fontsize{18pt}{22pt}\\selectfont\\sffamily\\addfontfeature{LetterSpace=3}}

\\titleformat{name=\\chapter,numberless}[display]
  {\\normalfont\\raggedright}
  {}
  {0pt}
  {\\fontsize{18pt}{22pt}\\selectfont\\sffamily\\addfontfeature{LetterSpace=3}}

\\titlespacing*{\\chapter}{0pt}{40pt}{28pt}

\\titleformat{\\section}
  {\\normalfont\\sffamily\\fontsize{11pt}{14pt}\\selectfont\\addfontfeature{LetterSpace=8}\\MakeUppercase}
  {}{0em}{}
\\titleformat{\\subsection}
  {\\normalfont\\sffamily\\normalsize\\color{hv@grey}}
  {}{0em}{}
\\titleformat{\\subsubsection}
  {\\normalfont\\sffamily\\small\\itshape}{}{0em}{}

\\titlespacing*{\\section}{0pt}{22pt}{8pt}
\\titlespacing*{\\subsection}{0pt}{16pt}{6pt}
\\titlespacing*{\\subsubsection}{0pt}{12pt}{4pt}
`;

const BOOK_BOLD = `
% ── Heading Variant: Bold ────────────────────────────────────
% Dramatic, oversized numbers, heavy rules, maximum presence.
\\definecolor{hv@ghost}{gray}{0.88}

\\titleformat{\\chapter}[display]
  {\\normalfont\\raggedright}
  {{\\fontsize{96pt}{96pt}\\selectfont\\bfseries\\color{hv@ghost}\\thechapter}}
  {-40pt}
  {\\fontsize{24pt}{28pt}\\selectfont\\bfseries\\MakeUppercase}
  [\\vspace{6pt}{\\color{black}\\rule{\\textwidth}{2pt}}\\vspace{10pt}]

\\titleformat{name=\\chapter,numberless}[display]
  {\\normalfont\\raggedright}
  {}
  {0pt}
  {\\fontsize{24pt}{28pt}\\selectfont\\bfseries\\MakeUppercase}
  [\\vspace{6pt}{\\color{black}\\rule{\\textwidth}{2pt}}\\vspace{10pt}]

\\titlespacing*{\\chapter}{0pt}{24pt}{20pt}

\\titleformat{\\section}
  {\\normalfont\\bfseries\\fontsize{14pt}{17pt}\\selectfont\\MakeUppercase}
  {}{0em}{}
  [\\vspace{2pt}{\\color{black}\\rule{\\textwidth}{1pt}}]
\\titleformat{\\subsection}
  {\\normalfont\\bfseries\\fontsize{11pt}{14pt}\\selectfont}
  {}{0em}{}
\\titleformat{\\subsubsection}
  {\\normalfont\\bfseries\\normalsize}{}{0em}{}

\\titlespacing*{\\section}{0pt}{22pt}{8pt}
\\titlespacing*{\\subsection}{0pt}{16pt}{6pt}
\\titlespacing*{\\subsubsection}{0pt}{12pt}{4pt}
`;

// ================================================================
// Article-class variants (templates without \chapter)
// ================================================================

const ARTICLE_MODERN = `
% ── Heading Variant: Modern ──────────────────────────────────
% Clean, restrained, letterspaced. Hairline rules, no drama.
\\definecolor{hv@grey}{gray}{0.55}

\\titleformat{\\section}
  {\\normalfont\\sffamily\\fontsize{16pt}{20pt}\\selectfont\\addfontfeature{LetterSpace=6}}
  {}{0em}{}

\\titleformat{\\subsection}
  {\\normalfont\\sffamily\\fontsize{10pt}{13pt}\\selectfont\\addfontfeature{LetterSpace=10}\\color{hv@grey}\\MakeUppercase}
  {}{0em}{}

\\titleformat{\\subsubsection}
  {\\normalfont\\sffamily\\normalsize\\itshape\\color{hv@grey}}{}{0em}{}

\\titlespacing*{\\section}{0pt}{22pt}{10pt}
\\titlespacing*{\\subsection}{0pt}{16pt}{6pt}
\\titlespacing*{\\subsubsection}{0pt}{10pt}{4pt}
`;

const ARTICLE_BOLD = `
% ── Heading Variant: Bold ────────────────────────────────────
% Heavy rules, large type, maximum presence.
% NOTE: \\rule moved from format arg to after-code [] to avoid horizontal mode errors.

\\titleformat{\\section}
  {\\normalfont\\bfseries\\fontsize{26pt}{30pt}\\selectfont}
  {}{0em}{}
  [\\vspace{2pt}{\\color{black}\\rule{\\textwidth}{3pt}}]

\\titleformat{\\subsection}
  {\\normalfont\\bfseries\\fontsize{14pt}{17pt}\\selectfont\\MakeUppercase}
  {}{0em}{}
  [\\vspace{2pt}{\\color{black}\\rule{\\textwidth}{0.5pt}}]

\\titleformat{\\subsubsection}
  {\\normalfont\\bfseries\\normalsize}{}{0em}{}

\\titlespacing*{\\section}{0pt}{24pt}{10pt}
\\titlespacing*{\\subsection}{0pt}{18pt}{6pt}
\\titlespacing*{\\subsubsection}{0pt}{10pt}{4pt}
`;

// ================================================================
// Thesis-class variants (article with mandatory section numbering)
// ================================================================

const THESIS_MODERN = `
% ── Heading Variant: Modern (Thesis — numbered sections preserved) ──
% Clean, restrained, letterspaced — but keeps \\thesection numbering
% required by university submission standards.
\\definecolor{hv@grey}{gray}{0.55}

\\titleformat{\\section}
  {\\normalfont\\sffamily\\fontsize{16pt}{20pt}\\selectfont\\addfontfeature{LetterSpace=6}}
  {\\thesection\\quad}{0em}{}

\\titleformat{\\subsection}
  {\\normalfont\\sffamily\\fontsize{10pt}{13pt}\\selectfont\\addfontfeature{LetterSpace=10}\\color{hv@grey}\\MakeUppercase}
  {\\thesubsection\\quad}{0em}{}

\\titleformat{\\subsubsection}
  {\\normalfont\\sffamily\\normalsize\\itshape\\color{hv@grey}}
  {\\thesubsubsection\\quad}{0em}{}

\\titlespacing*{\\section}{0pt}{22pt}{10pt}
\\titlespacing*{\\subsection}{0pt}{16pt}{6pt}
\\titlespacing*{\\subsubsection}{0pt}{10pt}{4pt}
`;

const THESIS_BOLD = `
% ── Heading Variant: Bold (Thesis — numbered sections preserved) ──
% Heavy rules, large type — but keeps \\thesection numbering
% required by university submission standards.

\\titleformat{\\section}
  {\\normalfont\\bfseries\\fontsize{26pt}{30pt}\\selectfont}
  {\\thesection\\quad}{0em}{}
  [\\vspace{2pt}{\\color{black}\\rule{\\textwidth}{3pt}}]

\\titleformat{\\subsection}
  {\\normalfont\\bfseries\\fontsize{14pt}{17pt}\\selectfont\\MakeUppercase}
  {\\thesubsection\\quad}{0em}{}
  [\\vspace{2pt}{\\color{black}\\rule{\\textwidth}{0.5pt}}]

\\titleformat{\\subsubsection}
  {\\normalfont\\bfseries\\normalsize}
  {\\thesubsubsection\\quad}{0em}{}

\\titlespacing*{\\section}{0pt}{24pt}{10pt}
\\titlespacing*{\\subsection}{0pt}{18pt}{6pt}
\\titlespacing*{\\subsubsection}{0pt}{10pt}{4pt}
`;

// ================================================================
// Variant Registry
// ================================================================

/**
 * Map of template key → document class type.
 * 'book' templates have \chapter; 'article' templates do not.
 */
const TEMPLATE_CLASS = {
  // Book class (has chapters)
  symphony:      'book',
  chicago:       'book',
  paperback:     'book',
  exhibit:       'book',
  avantgarde:    'book',
  memoir:        'book',   // new
  verse:         'book',   // new
  // Article class (sections only)
  chronicle:     'article',
  international: 'article',
  operator:      'article',
  matrix:        'article',
  heirloom:      'article',
  minimal:       'article',
  cinema:        'article',
  thesis:        'article', // new — uses article with numbered sections
};

/**
 * Get the LaTeX preamble override for a heading variant.
 *
 * @param {string} templateKey — e.g. 'symphony', 'chronicle'
 * @param {string} variant — 'classic' | 'modern' | 'bold'
 * @returns {string} LaTeX preamble (empty string for 'classic')
 */
function getVariantPreamble(templateKey, variant) {
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

  return ''; // Unknown variant → no override
}

/**
 * Valid heading variant names.
 */
const HEADING_VARIANTS = ['classic', 'modern', 'bold'];

/**
 * Human-readable labels for each variant.
 */
const VARIANT_LABELS = {
  classic: 'Classic',
  modern: 'Modern',
  bold: 'Bold',
};

/**
 * Short descriptions for UI tooltips.
 */
const VARIANT_DESCRIPTIONS = {
  classic: 'The template\'s signature heading style',
  modern: 'Clean, restrained, letterspaced',
  bold: 'Dramatic, oversized, heavy rules',
};

module.exports = {
  getVariantPreamble,
  HEADING_VARIANTS,
  VARIANT_LABELS,
  VARIANT_DESCRIPTIONS,
  TEMPLATE_CLASS,
};
