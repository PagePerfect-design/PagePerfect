/**
 * Manuscript Structure System
 *
 * Standardises front matter, body, and back matter with conventions
 * and auto-generation. Defines "what goes where" in Markdown and
 * produces predictable outputs in Typst.
 *
 * Book architecture follows Chicago Manual of Style ordering:
 *   Front Matter → Body → Back Matter
 */

// ================================================================
// Section Definitions & Ordering
// ================================================================

/** Canonical book section types with ordering weights */
const SECTION_CATALOG = {
  // ── Front Matter (recto/verso conventions) ──
  halfTitle:        { order: 1,   matter: 'front', label: 'Half Title',           recto: true,  numbered: false, required: false },
  seriesTitle:      { order: 2,   matter: 'front', label: 'Series Title',         recto: false, numbered: false, required: false },
  titlePage:        { order: 3,   matter: 'front', label: 'Title Page',           recto: true,  numbered: false, required: true  },
  copyright:        { order: 4,   matter: 'front', label: 'Copyright Page',       recto: false, numbered: false, required: true  },
  dedication:       { order: 5,   matter: 'front', label: 'Dedication',           recto: true,  numbered: false, required: false },
  epigraph:         { order: 6,   matter: 'front', label: 'Epigraph',             recto: true,  numbered: false, required: false },
  tableOfContents:  { order: 7,   matter: 'front', label: 'Table of Contents',    recto: true,  numbered: true,  required: false },
  listOfFigures:    { order: 8,   matter: 'front', label: 'List of Figures',      recto: true,  numbered: true,  required: false },
  listOfTables:     { order: 9,   matter: 'front', label: 'List of Tables',       recto: true,  numbered: true,  required: false },
  foreword:         { order: 10,  matter: 'front', label: 'Foreword',             recto: true,  numbered: true,  required: false },
  preface:          { order: 11,  matter: 'front', label: 'Preface',              recto: true,  numbered: true,  required: false },
  acknowledgements: { order: 12,  matter: 'front', label: 'Acknowledgements',     recto: true,  numbered: true,  required: false },
  introduction:     { order: 13,  matter: 'front', label: 'Introduction',         recto: true,  numbered: true,  required: false },

  // ── Body ──
  part:             { order: 100, matter: 'body',  label: 'Part',                 recto: true,  numbered: true,  required: false },
  chapter:          { order: 101, matter: 'body',  label: 'Chapter',              recto: true,  numbered: true,  required: true  },

  // ── Back Matter ──
  epilogue:         { order: 200, matter: 'back',  label: 'Epilogue',             recto: true,  numbered: true,  required: false },
  afterword:        { order: 201, matter: 'back',  label: 'Afterword',            recto: true,  numbered: true,  required: false },
  appendix:         { order: 202, matter: 'back',  label: 'Appendix',             recto: true,  numbered: true,  required: false },
  endnotes:         { order: 203, matter: 'back',  label: 'Endnotes',             recto: true,  numbered: true,  required: false },
  glossary:         { order: 204, matter: 'back',  label: 'Glossary',             recto: true,  numbered: true,  required: false },
  bibliography:     { order: 205, matter: 'back',  label: 'Bibliography',         recto: true,  numbered: true,  required: false },
  index:            { order: 206, matter: 'back',  label: 'Index',                recto: true,  numbered: true,  required: false },
  colophon:         { order: 207, matter: 'back',  label: 'Colophon',             recto: false, numbered: false, required: false },
  aboutAuthor:      { order: 208, matter: 'back',  label: 'About the Author',     recto: true,  numbered: false, required: false },
};

/** Detection patterns for identifying sections in Markdown */
const SECTION_PATTERNS = {
  halfTitle:        /^#\s+(half[\s-]title)\b/im,
  seriesTitle:      /^#\s+(series[\s-]title|also\s+by)\b/im,
  titlePage:        null, // Detected via YAML front matter `title:` field
  copyright:        /^#\s*(copyright|©)\b|^©\s*\d{4}/im,
  dedication:       /^#\s*(dedication|for\s+\w+|to\s+\w+.*,?\s*(with|in)\s+(love|memory|gratitude))/im,
  epigraph:         /^#\s*epigraph\b|^>\s*.{10,}.*\n>\s*—\s*.+/im,
  tableOfContents:  /^#\s*(table\s+of\s+contents|contents)\b/im,
  listOfFigures:    /^#\s*(list\s+of\s+figures|figures)\b/im,
  listOfTables:     /^#\s*(list\s+of\s+tables|tables)\b/im,
  foreword:         /^#\s*foreword\b/im,
  preface:          /^#\s*preface\b/im,
  acknowledgements: /^#\s*acknowledg(e)?ments?\b/im,
  introduction:     /^#\s*introduction\b/im,
  part:             /^#\s*(part\s+[IVXLC\d]+|part\s+\w+)\b/im,
  chapter:          /^#{1,2}\s+(chapter\s+\d+|chapter\s+\w+|\d+\.\s+)/im,
  epilogue:         /^#\s*epilogue\b/im,
  afterword:        /^#\s*afterword\b/im,
  appendix:         /^#\s*(appendix|appendices)\b/im,
  endnotes:         /^#\s*(end[\s-]?notes?)\b/im,
  glossary:         /^#\s*glossary\b/im,
  bibliography:     /^#\s*(bibliography|references|works\s+cited)\b/im,
  index:            /^#\s*index\b/im,
  colophon:         /^#\s*colophon\b/im,
  aboutAuthor:      /^#\s*(about\s+the\s+author|author\s+bio)\b/im,
};

// ================================================================
// Manuscript Analysis
// ================================================================

/**
 * Parse YAML front matter from markdown.
 * Returns { meta, body } where meta is the parsed YAML object.
 */
function parseFrontMatter(md) {
  const match = md.match(/^---\s*\n([\s\S]*?)\n---\s*\n/);
  if (!match) return { meta: {}, body: md };

  const yamlBlock = match[1];
  const meta = {};
  for (const line of yamlBlock.split('\n')) {
    const kv = line.match(/^(\w[\w-]*)\s*:\s*(.+)$/);
    if (kv) {
      const key = kv[1].trim();
      let val = kv[2].trim();
      // Strip quotes
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      meta[key] = val;
    }
  }
  return { meta, body: md.slice(match[0].length) };
}

/**
 * Detect all sections present in the manuscript.
 * Returns an array of { type, label, line, matter, order } sorted by appearance.
 */
function detectSections(md) {
  const lines = md.split('\n');
  const found = [];

  // Check for title page via front matter
  const { meta } = parseFrontMatter(md);
  if (meta.title) {
    found.push({ type: 'titlePage', label: 'Title Page', line: 0, matter: 'front', order: SECTION_CATALOG.titlePage.order });
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Only look at heading lines
    if (!line.startsWith('#')) continue;

    for (const [type, pattern] of Object.entries(SECTION_PATTERNS)) {
      if (!pattern) continue;
      if (pattern.test(line)) {
        const cat = SECTION_CATALOG[type];
        found.push({
          type,
          label: cat.label,
          line: i + 1,
          matter: cat.matter,
          order: cat.order,
        });
        break; // One match per line
      }
    }
  }

  // Sort by line number (appearance order)
  found.sort((a, b) => a.line - b.line);
  return found;
}

/**
 * Validate manuscript structure against book architecture rules.
 *
 * @param {string} md — full manuscript markdown
 * @returns {{ sections, warnings, suggestions, structure }}
 */
function analyzeStructure(md) {
  const sections = detectSections(md);
  const { meta } = parseFrontMatter(md);
  const warnings = [];
  const suggestions = [];

  // Determine matters present
  const hasFront = sections.some(s => s.matter === 'front');
  const hasBody = sections.some(s => s.matter === 'body');
  const hasBack = sections.some(s => s.matter === 'back');

  // Count chapters and generic headings
  const lines = md.split('\n');
  const h1Count = lines.filter(l => /^#\s+/.test(l)).length;
  const h2Count = lines.filter(l => /^##\s+/.test(l)).length;

  // ── Ordering validation ──
  let lastOrder = -1;
  let lastMatter = '';
  for (const s of sections) {
    // Matter should progress: front → body → back
    const matterOrder = { front: 0, body: 1, back: 2 };
    if (matterOrder[s.matter] < matterOrder[lastMatter]) {
      warnings.push({
        type: 'order',
        severity: 'warn',
        message: `"${s.label}" (${s.matter} matter) appears after ${lastMatter} matter at line ${s.line}. Standard order is: front → body → back.`,
        line: s.line,
      });
    }
    lastMatter = s.matter;
    lastOrder = s.order;
  }

  // ── Missing required sections ──
  if (!meta.title && !sections.find(s => s.type === 'titlePage')) {
    suggestions.push({
      type: 'missing',
      severity: 'info',
      section: 'titlePage',
      message: 'No title page detected. Add a YAML front matter block with title, author, and date.',
      template: '---\ntitle: "Your Title"\nauthor: "Author Name"\ndate: "2026"\n---',
    });
  }

  if (!sections.find(s => s.type === 'copyright')) {
    suggestions.push({
      type: 'missing',
      severity: 'info',
      section: 'copyright',
      message: 'No copyright page detected. Consider adding one for published works.',
      template: '# Copyright\n\n© 2026 Author Name. All rights reserved.\n\nISBN: 000-0-00-000000-0',
    });
  }

  // ── Chapter detection ──
  const chapterSections = sections.filter(s => s.type === 'chapter');
  if (h1Count > 0 && chapterSections.length === 0) {
    suggestions.push({
      type: 'structure',
      severity: 'info',
      message: `Found ${h1Count} top-level headings but no standard chapter markers. Consider using "# Chapter 1: Title" format for proper chapter handling.`,
    });
  }

  // ── Front matter suggestions ──
  const hasReferences = /\[@[^\]]+\]/.test(md);
  if (hasReferences && !sections.find(s => s.type === 'bibliography')) {
    suggestions.push({
      type: 'missing',
      severity: 'warn',
      section: 'bibliography',
      message: 'Citations found but no bibliography section. Add "# Bibliography" or "# References" at the end.',
    });
  }

  const hasFootnotes = /\[\^[^\]]+\]/.test(md);
  if (hasFootnotes && !sections.find(s => s.type === 'endnotes')) {
    suggestions.push({
      type: 'info',
      severity: 'info',
      section: 'endnotes',
      message: 'Footnotes detected. These will render as footnotes by default. For endnotes, add "# Endnotes" section.',
    });
  }

  const figureCount = (md.match(/!\[[^\]]*\]/g) || []).length;
  if (figureCount >= 5 && !sections.find(s => s.type === 'listOfFigures')) {
    suggestions.push({
      type: 'missing',
      severity: 'info',
      section: 'listOfFigures',
      message: `${figureCount} figures detected. Consider adding a "# List of Figures" section.`,
    });
  }

  const tableCount = (md.match(/\|.*\|.*\|/g) || []).length;
  if (tableCount >= 3 && !sections.find(s => s.type === 'listOfTables')) {
    suggestions.push({
      type: 'missing',
      severity: 'info',
      section: 'listOfTables',
      message: `Tables detected. Consider adding a "# List of Tables" section.`,
    });
  }

  // ── Structure summary ──
  const structure = {
    frontMatter: sections.filter(s => s.matter === 'front').map(s => s.label),
    body: sections.filter(s => s.matter === 'body').map(s => s.label),
    backMatter: sections.filter(s => s.matter === 'back').map(s => s.label),
    hasFrontMatter: hasFront,
    hasBody: hasBody,
    hasBackMatter: hasBack,
    totalSections: sections.length,
    chapterCount: chapterSections.length || h1Count,
    headingCounts: { h1: h1Count, h2: h2Count },
    metadata: meta,
  };

  return { sections, warnings, suggestions, structure };
}

// ================================================================
// LaTeX Front/Back Matter Generation
// ================================================================

/**
 * Generate LaTeX preamble additions for manuscript structure.
 * Adds proper front/back matter handling, page numbering, etc.
 */
function generateStructurePreamble(structureAnalysis) {
  const { structure } = structureAnalysis;
  const commands = [];

  // Front matter uses roman numerals, body uses arabic
  if (structure.hasFrontMatter) {
    commands.push(
      '% ── Manuscript Structure: Front/Back Matter ──',
      '\\newcommand{\\frontmatterstart}{\\frontmatter\\pagenumbering{roman}}',
      '\\newcommand{\\bodymatterstart}{\\mainmatter\\pagenumbering{arabic}}',
      '\\newcommand{\\backmatterstart}{\\backmatter}',
    );
  }

  // Dedication environment
  commands.push(
    '\\newenvironment{dedication}{%',
    '  \\clearpage\\thispagestyle{empty}\\vspace*{\\fill}\\begin{center}\\itshape',
    '}{%',
    '  \\end{center}\\vspace*{\\fill}\\clearpage',
    '}',
  );

  // Epigraph environment
  commands.push(
    '\\newenvironment{bookepigraph}{%',
    '  \\clearpage\\thispagestyle{empty}\\vspace*{\\fill}\\begin{flushright}\\begin{minipage}{0.6\\textwidth}',
    '}{%',
    '  \\end{minipage}\\end{flushright}\\vspace*{\\fill}\\clearpage',
    '}',
  );

  // Copyright page command
  commands.push(
    '\\newcommand{\\copyrightpage}[1]{%',
    '  \\clearpage\\thispagestyle{empty}\\vspace*{\\fill}',
    '  {\\small\\raggedright #1\\par}',
    '  \\vspace*{\\fill}\\clearpage',
    '}',
  );

  // Part page (opens recto)
  commands.push(
    '\\newcommand{\\bookpart}[1]{%',
    '  \\cleardoublepage\\thispagestyle{empty}\\vspace*{\\fill}',
    '  \\begin{center}{\\Huge\\bfseries #1}\\end{center}',
    '  \\vspace*{\\fill}\\clearpage',
    '}',
  );

  return commands.join('\n');
}

/**
 * Generate auto-generated sections as Markdown to prepend/append.
 * Only generates sections that are missing and marked as auto-generable.
 *
 * @param {object} structureAnalysis — result of analyzeStructure
 * @param {object} opts — { title, author, date, isbn }
 * @returns {{ prepend: string, append: string }}
 */
function generateMissingSections(structureAnalysis, opts = {}) {
  const { sections } = structureAnalysis;
  const { title = 'Untitled', author = '', date = new Date().getFullYear(), isbn = '' } = opts;
  const existingTypes = new Set(sections.map(s => s.type));

  let prepend = '';
  let append = '';

  // Auto-generate copyright page if missing and we have metadata
  if (!existingTypes.has('copyright') && (author || title !== 'Untitled')) {
    append += `\n\n---\n\n# Copyright\n\n© ${date} ${author || 'Author'}. All rights reserved.\n\n`;
    if (isbn) append += `ISBN: ${isbn}\n\n`;
    append += 'No part of this publication may be reproduced, stored in a retrieval system, or transmitted in any form or by any means without the prior written permission of the publisher.\n';
  }

  return { prepend, append };
}

// ================================================================
// Exports
// ================================================================

module.exports = {
  SECTION_CATALOG,
  SECTION_PATTERNS,
  parseFrontMatter,
  detectSections,
  analyzeStructure,
  generateStructurePreamble,
  generateMissingSections,
};
