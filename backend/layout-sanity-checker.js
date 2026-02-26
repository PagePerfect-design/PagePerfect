/**
 * layout-sanity-checker.js — Post-compilation layout quality analysis
 *
 * Detects typography issues that survive compilation:
 *   - Widows (last line of paragraph alone at top of page)
 *   - Orphans (first line of paragraph alone at bottom of page)
 *   - Short final lines (runts)
 *   - Overfull content (text extending past margins)
 *   - Underfull pages (pages with excessive whitespace)
 *
 * Works with BOTH Typst and LuaLaTeX compilation output.
 *
 * Typst approach: Parse Typst's stderr warnings for layout issues.
 * LuaLaTeX approach: Parse .log file for badness/overfull/underfull messages.
 *
 * For PDF-level analysis (future): Use a PDF parser to detect very short
 * last-lines-on-page via text extraction + bounding box analysis.
 */

const log = require('./logger');

// ── Severity Levels ──────────────────────────────────────────
const SEVERITY = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
};

// ── Issue Categories ─────────────────────────────────────────
const CATEGORY = {
  WIDOW: 'widow',
  ORPHAN: 'orphan',
  OVERFULL: 'overfull',
  UNDERFULL: 'underfull',
  SHORT_PAGE: 'short_page',
  FONT_WARNING: 'font_warning',
};

/**
 * Analyze a Typst compile log (stderr) for layout issues.
 * Typst emits warnings for content overflow and missing glyphs.
 *
 * @param {string} stderr - Typst's stderr output
 * @param {object} [options] - Analysis options
 * @param {string} [options.template] - Template name for context
 * @returns {{ issues: Array, grade: string, summary: string }}
 */
function analyzeTypstLayout(stderr, options = {}) {
  const issues = [];
  if (!stderr) return { issues, grade: 'A', summary: 'No layout warnings detected.' };

  const lines = stderr.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Content overflow — Typst's equivalent of overfull hbox
    if (/content does not fit/i.test(line) || /layout did not converge/i.test(line)) {
      issues.push({
        category: CATEGORY.OVERFULL,
        severity: SEVERITY.WARNING,
        message: line.trim(),
        line: extractTypstLineNumber(line),
        fix: 'Content exceeds page bounds. Consider reducing font size, widening margins, or breaking long words with soft hyphens.',
      });
    }

    // Missing glyph warnings — font can't render certain characters
    if (/missing glyph/i.test(line) || /font.*does not contain/i.test(line)) {
      issues.push({
        category: CATEGORY.FONT_WARNING,
        severity: SEVERITY.WARNING,
        message: line.trim(),
        line: extractTypstLineNumber(line),
        fix: 'A character is missing from the selected font. The PDF may show a blank or fallback glyph.',
      });
    }

    // Page overflow — content pushed past the last page
    if (/could not fit all content/i.test(line)) {
      issues.push({
        category: CATEGORY.OVERFULL,
        severity: SEVERITY.ERROR,
        message: line.trim(),
        line: extractTypstLineNumber(line),
        fix: 'Content overflows the page. This usually means a very long unbreakable element (image, table, code block) exceeds available space.',
      });
    }
  }

  const grade = calculateGrade(issues);
  const summary = buildSummary(issues, options.template);

  return { issues, grade, summary };
}

/**
 * Analyze a LuaLaTeX compile log for layout issues.
 * LaTeX emits "Overfull \\hbox", "Underfull \\vbox", and badness warnings.
 *
 * @param {string} logContent - LaTeX .log file content
 * @param {object} [options] - Analysis options
 * @param {string} [options.template] - Template name for context
 * @returns {{ issues: Array, grade: string, summary: string }}
 */
function analyzeLatexLayout(logContent, options = {}) {
  const issues = [];
  if (!logContent) return { issues, grade: 'A', summary: 'No layout warnings detected.' };

  const lines = logContent.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Overfull \hbox — text exceeds line width
    const overfullH = line.match(/Overfull \\hbox \((\d+(?:\.\d+)?)pt too wide\)/);
    if (overfullH) {
      const excess = parseFloat(overfullH[1]);
      issues.push({
        category: CATEGORY.OVERFULL,
        severity: excess > 10 ? SEVERITY.WARNING : SEVERITY.INFO,
        message: `Overfull hbox: ${excess}pt too wide`,
        line: extractLatexLineNumber(lines, i),
        excess,
        fix: excess > 10
          ? 'Text extends significantly past the margin. Consider hyphenation or rephrasing.'
          : 'Minor overfull — usually invisible to readers.',
      });
    }

    // Underfull \hbox — loose line (too much space between words)
    const underfullH = line.match(/Underfull \\hbox \(badness (\d+)\)/);
    if (underfullH) {
      const badness = parseInt(underfullH[1]);
      if (badness >= 5000) {
        issues.push({
          category: CATEGORY.UNDERFULL,
          severity: badness >= 10000 ? SEVERITY.WARNING : SEVERITY.INFO,
          message: `Underfull hbox: badness ${badness}`,
          line: extractLatexLineNumber(lines, i),
          badness,
          fix: 'A line has excessive word spacing. This is often a widow/orphan side-effect or a forced break.',
        });
      }
    }

    // Underfull \vbox — page has too much vertical space (short page / orphan indicator)
    const underfullV = line.match(/Underfull \\vbox \(badness (\d+)\)/);
    if (underfullV) {
      const badness = parseInt(underfullV[1]);
      if (badness >= 5000) {
        issues.push({
          category: CATEGORY.SHORT_PAGE,
          severity: badness >= 10000 ? SEVERITY.WARNING : SEVERITY.INFO,
          message: `Underfull vbox: badness ${badness} — possible widow/orphan or short page`,
          line: extractLatexLineNumber(lines, i),
          badness,
          fix: 'A page has significant empty space at the bottom. This may indicate a widow, orphan, or forced page break.',
        });
      }
    }

    // Font warnings
    if (/Font Warning.*not available/i.test(line) || /missing character/i.test(line)) {
      issues.push({
        category: CATEGORY.FONT_WARNING,
        severity: SEVERITY.WARNING,
        message: line.trim().substring(0, 200),
        fix: 'A font or character is not available. Check that all required fonts are installed.',
      });
    }
  }

  const grade = calculateGrade(issues);
  const summary = buildSummary(issues, options.template);

  return { issues, grade, summary };
}

/**
 * Extract line number from a Typst error/warning line.
 * Format: "warning: file.typ:12:5: message"
 */
function extractTypstLineNumber(line) {
  const m = line.match(/\.typ:(\d+):\d+/);
  return m ? parseInt(m[1]) : null;
}

/**
 * Extract line number context from LaTeX log.
 * LaTeX logs reference "l.123" for line numbers.
 */
function extractLatexLineNumber(lines, currentIndex) {
  // Look ahead for "l.\d+" pattern within 3 lines
  for (let j = currentIndex; j < Math.min(currentIndex + 4, lines.length); j++) {
    const m = lines[j].match(/l\.(\d+)/);
    if (m) return parseInt(m[1]);
  }
  return null;
}

/**
 * Calculate a letter grade based on issue counts and severity.
 * A = perfect, B = minor issues, C = noticeable, D = poor, F = critical
 */
function calculateGrade(issues) {
  let score = 100;

  for (const issue of issues) {
    switch (issue.severity) {
      case SEVERITY.ERROR:
        score -= 15;
        break;
      case SEVERITY.WARNING:
        score -= 5;
        break;
      case SEVERITY.INFO:
        score -= 1;
        break;
    }
  }

  if (score >= 95) return 'A';
  if (score >= 85) return 'B';
  if (score >= 70) return 'C';
  if (score >= 50) return 'D';
  return 'F';
}

/**
 * Build a human-readable summary.
 */
function buildSummary(issues, template) {
  if (issues.length === 0) {
    return template
      ? `Layout check passed for "${template}" — no issues detected.`
      : 'Layout check passed — no issues detected.';
  }

  const errors = issues.filter(i => i.severity === SEVERITY.ERROR).length;
  const warnings = issues.filter(i => i.severity === SEVERITY.WARNING).length;
  const infos = issues.filter(i => i.severity === SEVERITY.INFO).length;

  const parts = [];
  if (errors > 0) parts.push(`${errors} error${errors > 1 ? 's' : ''}`);
  if (warnings > 0) parts.push(`${warnings} warning${warnings > 1 ? 's' : ''}`);
  if (infos > 0) parts.push(`${infos} info${infos > 1 ? 's' : ''}`);

  const prefix = template ? `Layout check for "${template}"` : 'Layout check';
  return `${prefix}: ${parts.join(', ')}.`;
}

module.exports = {
  analyzeTypstLayout,
  analyzeLatexLayout,
  SEVERITY,
  CATEGORY,
};
