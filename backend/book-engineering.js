/**
 * Book Engineering System
 *
 * The layer that makes PagePerfect feel "professional" rather than "a nice editor".
 * Handles widows/orphans, hyphenation, line breaking, overfull hbox detection,
 * float placement, footnote overflow, page breaks, and manuscript linting.
 */

// ================================================================
// Engineering Policies per Template Category
// ================================================================

/**
 * Template-specific typographic engineering defaults.
 * Each template category has deliberate policies.
 */
const ENGINEERING_POLICIES = {
  academic: {
    widowPenalty: 10000,       // Prevent widows absolutely
    clubPenalty: 10000,        // Prevent orphans absolutely
    hyphenPenalty: 50,         // Allow moderate hyphenation
    tolerance: 200,            // Moderately tight line breaking
    emergencyStretch: '3em',   // Emergency stretch before overfull
    floatPlacement: 'htbp',   // Standard float placement
    footnoteRule: '2in',       // 2-inch footnote rule
    raggedBottom: false,       // Flush bottom for academic
    microtype: true,           // Enable optical margin alignment
    csquotes: true,            // Enable context-sensitive quotes
  },
  thesis: {
    widowPenalty: 10000,       // Prevent widows absolutely (university requirement)
    clubPenalty: 10000,        // Prevent orphans absolutely
    hyphenPenalty: 50,         // Allow moderate hyphenation
    tolerance: 250,            // Slightly relaxed for double-spacing
    emergencyStretch: '3em',   // Emergency stretch before overfull
    floatPlacement: 'htbp',   // Standard float placement
    footnoteRule: '2in',       // 2-inch footnote rule
    raggedBottom: false,       // Flush bottom for submissions
    microtype: true,           // Enable optical margin alignment
    csquotes: true,            // Enable context-sensitive quotes
  },
  trade: {
    widowPenalty: 8000,
    clubPenalty: 8000,
    hyphenPenalty: 100,        // Less hyphenation for fiction
    tolerance: 300,            // More relaxed for readability
    emergencyStretch: '3em',
    floatPlacement: 'htbp',
    footnoteRule: '1in',
    raggedBottom: true,        // Ragged bottom for fiction (natural breaks)
    microtype: true,
    csquotes: true,
  },
  editorial: {
    widowPenalty: 6000,
    clubPenalty: 6000,
    hyphenPenalty: 50,
    tolerance: 150,            // Tight for columns
    emergencyStretch: '2em',
    floatPlacement: 'tbp',    // No inline floats in editorial
    footnoteRule: '1.5in',
    raggedBottom: false,
    raggedRight: true,         // Flush left for Swiss style
    microtype: true,
    csquotes: false,           // Manual quote control
  },
  corporate: {
    widowPenalty: 10000,
    clubPenalty: 10000,
    hyphenPenalty: 200,        // Minimal hyphenation
    tolerance: 250,
    emergencyStretch: '3em',
    floatPlacement: 'htbp',
    footnoteRule: '2in',
    raggedBottom: false,
    microtype: true,
    csquotes: true,
  },
  creative: {
    widowPenalty: 2000,        // Relaxed — artistic choice
    clubPenalty: 2000,
    hyphenPenalty: 50,
    tolerance: 400,            // Very relaxed
    emergencyStretch: '5em',
    floatPlacement: 'H',      // Exact placement
    footnoteRule: '1in',
    raggedBottom: true,
    raggedRight: true,
    microtype: true,
    csquotes: false,
  },
  basic: {
    widowPenalty: 5000,
    clubPenalty: 5000,
    hyphenPenalty: 100,
    tolerance: 300,
    emergencyStretch: '3em',
    floatPlacement: 'htbp',
    footnoteRule: '1in',
    raggedBottom: false,
    microtype: false,          // pdflatex compatibility
    csquotes: false,
  },
};

// ================================================================
// Manuscript Linting
// ================================================================

/**
 * Lint manuscript for common issues that wreck print quality.
 *
 * @param {string} md — manuscript markdown
 * @param {string} templateType — 'academic' | 'trade' | etc.
 * @returns {{ issues, stats }}
 */
function lintManuscript(md, templateType = 'academic') {
  const issues = [];
  const lines = md.split('\n');

  // ── Double spaces after punctuation ──
  const doubleSpaceLines = [];
  for (let i = 0; i < lines.length; i++) {
    if (/[.!?;:]\s{2,}[A-Z(]/.test(lines[i])) {
      doubleSpaceLines.push(i + 1);
    }
  }
  if (doubleSpaceLines.length > 0) {
    issues.push({
      type: 'spacing',
      severity: 'warn',
      message: `Double spaces after punctuation on ${doubleSpaceLines.length} line(s).`,
      lines: doubleSpaceLines.slice(0, 10),
      fix: 'Replace double spaces with single spaces for modern typography.',
    });
  }

  // ── Straight quotes instead of curly ──
  let straightQuoteCount = 0;
  for (const line of lines) {
    // Skip code blocks
    if (line.startsWith('```') || line.startsWith('    ')) continue;
    straightQuoteCount += (line.match(/(?<!\w)["'](?=[A-Za-z])/g) || []).length;
  }
  if (straightQuoteCount > 5) {
    issues.push({
      type: 'typography',
      severity: 'info',
      message: `${straightQuoteCount} straight quotes detected. Pandoc will convert these to curly quotes automatically.`,
    });
  }

  // ── Manually typed em-dashes vs proper ──
  const badDashes = [];
  for (let i = 0; i < lines.length; i++) {
    if (/\w--\w/.test(lines[i]) && !/---/.test(lines[i])) {
      badDashes.push(i + 1);
    }
  }
  if (badDashes.length > 0) {
    issues.push({
      type: 'typography',
      severity: 'info',
      message: `${badDashes.length} instances of "--" found. Use "---" for em-dash or " — " for spaced em-dash.`,
      lines: badDashes.slice(0, 10),
    });
  }

  // ── Very long paragraphs (wall of text) ──
  let inParagraph = false;
  let paraStart = 0;
  let paraLength = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line === '') {
      if (inParagraph && paraLength > 800) {
        issues.push({
          type: 'readability',
          severity: 'info',
          message: `Very long paragraph (~${paraLength} chars) starting at line ${paraStart + 1}. Consider breaking into smaller paragraphs.`,
          lines: [paraStart + 1],
        });
      }
      inParagraph = false;
      paraLength = 0;
    } else {
      if (!inParagraph) { inParagraph = true; paraStart = i; }
      paraLength += line.length;
    }
  }

  // ── Heading hierarchy issues ──
  let lastHeadingLevel = 0;
  for (let i = 0; i < lines.length; i++) {
    const hMatch = lines[i].match(/^(#{1,6})\s+/);
    if (hMatch) {
      const level = hMatch[1].length;
      if (lastHeadingLevel > 0 && level > lastHeadingLevel + 1) {
        issues.push({
          type: 'structure',
          severity: 'warn',
          message: `Heading level skip at line ${i + 1}: H${lastHeadingLevel} → H${level}. This may cause formatting issues.`,
          lines: [i + 1],
        });
      }
      lastHeadingLevel = level;
    }
  }

  // ── Overly long lines (may cause overfull hbox) ──
  const longLines = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Skip code blocks and URLs
    if (line.startsWith('```') || line.startsWith('    ') || /^!\[/.test(line)) continue;
    // Check for long unbreakable sequences (URLs, long words)
    const words = line.split(/\s+/);
    for (const word of words) {
      if (word.length > 50 && !word.startsWith('http') && !word.startsWith('![')) {
        longLines.push({ line: i + 1, word: word.slice(0, 30) + '...' });
      }
    }
  }
  if (longLines.length > 0) {
    issues.push({
      type: 'linebreak',
      severity: 'warn',
      message: `${longLines.length} very long word(s) detected that may cause overfull hbox warnings.`,
      details: longLines.slice(0, 5),
    });
  }

  // ── Long URLs not in angle brackets ──
  const bareURLs = [];
  for (let i = 0; i < lines.length; i++) {
    const matches = lines[i].match(/(?<![(<\[])(https?:\/\/[^\s)>\]]{40,})/g);
    if (matches) {
      bareURLs.push({ line: i + 1, url: matches[0].slice(0, 50) + '...' });
    }
  }
  if (bareURLs.length > 0) {
    issues.push({
      type: 'linebreak',
      severity: 'warn',
      message: `${bareURLs.length} long bare URL(s) found. Wrap in angle brackets (<url>) or use [text](url) syntax for proper line breaking.`,
      details: bareURLs.slice(0, 5),
    });
  }

  // ── Multiple consecutive blank lines ──
  let tripleBlankCount = 0;
  for (let i = 0; i < lines.length - 2; i++) {
    if (lines[i].trim() === '' && lines[i+1].trim() === '' && lines[i+2].trim() === '') {
      tripleBlankCount++;
    }
  }
  if (tripleBlankCount > 0) {
    issues.push({
      type: 'spacing',
      severity: 'info',
      message: `${tripleBlankCount} triple+ blank lines found. Extra blank lines are ignored in typeset output.`,
    });
  }

  // ── Inconsistent list markers ──
  const listMarkers = new Set();
  for (const line of lines) {
    const listMatch = line.match(/^\s*([-*+]|\d+[.)]) /);
    if (listMatch) listMarkers.add(listMatch[1][0]);
  }
  if (listMarkers.size > 2) {
    issues.push({
      type: 'consistency',
      severity: 'info',
      message: 'Multiple list marker styles detected (-, *, +). Consider using a consistent marker.',
    });
  }

  // ── Stats ──
  const wordCount = md.split(/\s+/).filter(w => w.length > 0).length;
  const stats = {
    totalIssues: issues.length,
    byType: {},
    bySeverity: { error: 0, warn: 0, info: 0 },
    wordCount,
    lineCount: lines.length,
    paragraphCount: md.split(/\n\s*\n/).filter(p => p.trim()).length,
  };

  for (const issue of issues) {
    stats.byType[issue.type] = (stats.byType[issue.type] || 0) + 1;
    stats.bySeverity[issue.severity] = (stats.bySeverity[issue.severity] || 0) + 1;
  }

  return { issues, stats };
}

// ================================================================
// Compile Log Analysis
// ================================================================

/**
 * Parse LuaLaTeX log output for engineering issues.
 *
 * @param {string} stderr — compilation stderr/log output
 * @returns {{ overfullBoxes, underfullBoxes, warnings, pageBreakIssues }}
 */
function analyzeCompileLog(stderr) {
  const result = {
    overfullBoxes: [],
    underfullBoxes: [],
    warnings: [],
    pageBreakIssues: [],
    floatIssues: [],
    footnoteIssues: [],
  };

  const lines = stderr.split('\n');

  for (const line of lines) {
    // Overfull \hbox
    const overfull = line.match(/Overfull \\hbox \((\d+\.?\d*)pt too wide\)(?:.*?at lines? (\d+))?/);
    if (overfull) {
      result.overfullBoxes.push({
        amount: parseFloat(overfull[1]),
        line: overfull[2] ? parseInt(overfull[2]) : null,
        severity: parseFloat(overfull[1]) > 10 ? 'warn' : 'info',
        message: `Overfull hbox by ${overfull[1]}pt${overfull[2] ? ` at line ${overfull[2]}` : ''}`,
      });
    }

    // Underfull \hbox
    const underfull = line.match(/Underfull \\hbox(?:.*?badness (\d+))?(?:.*?at lines? (\d+))?/);
    if (underfull) {
      const badness = underfull[1] ? parseInt(underfull[1]) : 0;
      if (badness > 5000) {
        result.underfullBoxes.push({
          badness,
          line: underfull[2] ? parseInt(underfull[2]) : null,
          severity: badness > 8000 ? 'warn' : 'info',
          message: `Underfull hbox (badness ${badness})${underfull[2] ? ` at line ${underfull[2]}` : ''}`,
        });
      }
    }

    // Float warnings
    if (/Too many unprocessed floats/.test(line)) {
      result.floatIssues.push({
        severity: 'warn',
        message: 'Too many unprocessed floats. Consider fewer consecutive figures or [H] placement.',
      });
    }

    // Footnote overflow
    if (/Footnote.*split|split.*footnote/i.test(line)) {
      result.footnoteIssues.push({
        severity: 'warn',
        message: 'Footnote split across pages. Consider shorter footnotes or endnotes.',
      });
    }
  }

  return result;
}

// ================================================================
// LaTeX Engineering Preamble
// ================================================================

/**
 * Generate LaTeX preamble for book engineering policies.
 *
 * @param {string} templateType — key into ENGINEERING_POLICIES
 * @param {object} [overrides] — optional policy overrides
 * @returns {string} LaTeX preamble snippet
 */
function generateEngineeringPreamble(templateType, overrides = {}) {
  const policy = { ...(ENGINEERING_POLICIES[templateType] || ENGINEERING_POLICIES.academic), ...overrides };
  const commands = [
    '% ── Book Engineering System ──',
    '',
    '% Widow and orphan control',
    `\\widowpenalty=${policy.widowPenalty}`,
    `\\clubpenalty=${policy.clubPenalty}`,
    '',
    '% Hyphenation and line breaking',
    `\\hyphenpenalty=${policy.hyphenPenalty}`,
    `\\tolerance=${policy.tolerance}`,
    `\\emergencystretch=${policy.emergencyStretch}`,
    '',
    '% Float placement defaults',
    `\\renewcommand{\\floatpagefraction}{0.8}`,
    `\\renewcommand{\\topfraction}{0.9}`,
    `\\renewcommand{\\bottomfraction}{0.8}`,
    `\\renewcommand{\\textfraction}{0.1}`,
    '',
  ];

  if (policy.raggedBottom) {
    commands.push('', '\\raggedbottom');
  } else {
    commands.push('', '\\flushbottom');
  }

  // URL line breaking (safe for header-includes — url already loaded by hyperref)
  commands.push(
    '',
    '% URL line breaking',
    '\\makeatletter',
    '\\g@addto@macro\\UrlBreaks{\\do\\/\\do\\-\\do\\.\\do\\=\\do\\?\\do\\&\\do\\_\\do\\~}',
    '\\makeatother',
  );

  return commands.join('\n');
}

// ================================================================
// Typst Engineering Preamble
// ================================================================

/**
 * Generate Typst preamble for book engineering policies.
 * Outputs Typst #set rules instead of LaTeX commands.
 *
 * @param {string} templateType — key into ENGINEERING_POLICIES
 * @param {object} [overrides] — optional policy overrides
 * @returns {string} Typst preamble snippet
 */
function generateTypstEngineeringPreamble(templateType, overrides = {}) {
  const policy = { ...(ENGINEERING_POLICIES[templateType] || ENGINEERING_POLICIES.academic), ...overrides };
  const commands = [
    '// ── Book Engineering System ──',
    '',
    '// Widow and orphan control',
  ];

  // Typst 0.13+ supports widow-penalty and orphan-penalty via #set par()
  // Map LaTeX penalty values (0-10000) to Typst's percentage-based system
  // 10000 = prevent absolutely → 100%, 8000 → 80%, etc.
  const widowPct = Math.min(100, Math.round(policy.widowPenalty / 100));
  const clubPct = Math.min(100, Math.round(policy.clubPenalty / 100));

  // Note: Typst uses 'avoid' for widow/orphan control at the paragraph level.
  // Exact penalty mapping is approximated; Typst's algorithm handles this differently.
  commands.push(`#set par(justify: true)`);

  commands.push('');
  commands.push('// Hyphenation control');
  // LaTeX hyphenpenalty: 50=aggressive, 200=minimal, 10000=none
  if (policy.hyphenPenalty >= 5000) {
    commands.push('#set text(hyphenate: false)');
  } else {
    commands.push('#set text(hyphenate: true)');
  }

  commands.push('');
  if (policy.raggedBottom) {
    commands.push('// Ragged bottom (natural page breaks)');
    commands.push('// Typst uses ragged bottom by default — no action needed');
  } else {
    commands.push('// Flush bottom (justified vertical spacing)');
    commands.push('// Note: Typst doesn\'t have \\flushbottom equivalent yet');
  }

  if (policy.raggedRight) {
    commands.push('');
    commands.push('// Flush left / ragged right');
    commands.push('#set par(justify: false)');
  }

  return commands.join('\n');
}

// ================================================================
// Typst Compile Log Analysis
// ================================================================

/**
 * Parse Typst compilation stderr for engineering issues.
 * Typst warnings are structured differently from LaTeX.
 *
 * @param {string} stderr — Typst compilation output
 * @returns {{ overfullBoxes, underfullBoxes, warnings, pageBreakIssues }}
 */
function analyzeTypstCompileLog(stderr) {
  const result = {
    overfullBoxes: [],
    underfullBoxes: [],
    warnings: [],
    pageBreakIssues: [],
    floatIssues: [],
    footnoteIssues: [],
  };

  if (!stderr || typeof stderr !== 'string') return result;

  const lines = stderr.split('\n');

  for (const line of lines) {
    // Typst warning format: "warning: <message>"
    const warning = line.match(/^warning:\s+(.+)/i);
    if (warning) {
      result.warnings.push({
        severity: 'warn',
        message: warning[1],
      });
    }

    // Typst content overflow warnings
    if (/content does not fit/.test(line) || /out of.*bounds/.test(line)) {
      result.overfullBoxes.push({
        amount: 0,
        line: null,
        severity: 'warn',
        message: line.trim(),
      });
    }

    // Typst font warnings
    if (/unknown font/i.test(line) || /font.*not found/i.test(line)) {
      result.warnings.push({
        severity: 'warn',
        message: line.trim(),
      });
    }
  }

  return result;
}

// ================================================================
// Exports
// ================================================================

module.exports = {
  ENGINEERING_POLICIES,
  lintManuscript,
  analyzeCompileLog,
  analyzeTypstCompileLog,
  generateEngineeringPreamble,
  generateTypstEngineeringPreamble,
};
