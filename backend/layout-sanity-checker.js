/**
 * layout-sanity-checker.js — Post-compilation layout quality analysis
 *
 * Detects typography issues that survive compilation:
 *   - Overfull content (text extending past margins)
 *   - Font/glyph warnings
 *   - Image errors
 *   - Reference warnings
 *
 * Works with Typst compilation output (Typst is the sole PDF engine).
 *
 * Typst approach: Parse Typst's stderr warnings for layout issues.
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
  IMAGE: 'image',
  REFERENCE: 'reference',
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
      continue;
    }

    // Page overflow — content pushed past the last page
    if (/could not fit all content/i.test(line) || /out of (?:page )?bounds/i.test(line)) {
      issues.push({
        category: CATEGORY.OVERFULL,
        severity: SEVERITY.ERROR,
        message: line.trim(),
        line: extractTypstLineNumber(line),
        fix: 'Content overflows the page. This usually means a very long unbreakable element (image, table, code block) exceeds available space.',
      });
      continue;
    }

    // Missing glyph / font warnings — font can't render certain characters
    if (/missing glyph/i.test(line) || /font.*does not contain/i.test(line) ||
        /unknown font family/i.test(line) || /font.*not found/i.test(line)) {
      issues.push({
        category: CATEGORY.FONT_WARNING,
        severity: SEVERITY.WARNING,
        message: line.trim(),
        line: extractTypstLineNumber(line),
        fix: 'A font or character is unavailable. The PDF may use a fallback font or show blank glyphs.',
      });
      continue;
    }

    // Image errors — missing or corrupt image files
    if (/file not found/i.test(line) || /image.*not found/i.test(line) ||
        /failed to (?:decode|load) image/i.test(line) || /cannot (?:read|open) image/i.test(line)) {
      issues.push({
        category: CATEGORY.IMAGE,
        severity: SEVERITY.ERROR,
        message: line.trim(),
        line: extractTypstLineNumber(line),
        fix: 'An image file is missing or corrupted. Verify the image path and re-upload if needed.',
      });
      continue;
    }

    // Undefined label/reference warnings
    if (/undefined (?:label|reference)/i.test(line) || /label.*not found/i.test(line)) {
      issues.push({
        category: CATEGORY.REFERENCE,
        severity: SEVERITY.WARNING,
        message: line.trim(),
        line: extractTypstLineNumber(line),
        fix: 'A cross-reference points to a label that does not exist. Check for typos in label names.',
      });
      continue;
    }
  }

  const grade = calculateGrade(issues);
  const summary = buildSummary(issues, options.template);

  return { issues, grade, summary };
}

/**
 * Extract line number from a Typst error/warning line.
 * Formats: "warning: file.typ:12:5: message" or "error: at file.typ:12:5"
 */
function extractTypstLineNumber(line) {
  // Try .typ:LINE:COL format first
  const m = line.match(/\.typ:(\d+):\d+/);
  if (m) return parseInt(m[1]);
  // Try standalone :LINE:COL format (e.g., "input:12:5")
  const m2 = line.match(/:(\d+):\d+:/);
  return m2 ? parseInt(m2[1]) : null;
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
  SEVERITY,
  CATEGORY,
};
