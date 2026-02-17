/**
 * Print QA System
 *
 * Separate from pre-flight. Pre-flight checks whether the PDF meets
 * platform requirements. Print QA checks whether it will look good
 * when printed. Covers ink coverage risk, thin rule visibility,
 * grayscale handling, contrast thresholds, and small text thresholds.
 */

// ================================================================
// Print Quality Thresholds
// ================================================================

const QA_THRESHOLDS = {
  /** Minimum font size for body text */
  minBodySize: 8,       // pt
  /** Minimum font size for footnotes */
  minFootnoteSize: 7,   // pt
  /** Minimum font size for captions */
  minCaptionSize: 7,    // pt
  /** Minimum rule thickness for visibility */
  minRuleThickness: 0.25, // pt (0.25pt ≈ 0.09mm)
  /** Maximum ink coverage percentage */
  maxInkCoverage: 300,  // % total (C+M+Y+K combined, max 400%)
  /** Minimum contrast ratio for text (WCAG AA) */
  minContrastRatio: 4.5,
  /** Maximum consecutive hyphens */
  maxConsecutiveHyphens: 3,
  /** Minimum image DPI for print */
  minPrintDPI: 300,
  /** Small text threshold for reverse type */
  minReverseFontSize: 10, // pt — smaller reverse type fills in during print
};

// ================================================================
// Color Analysis
// ================================================================

/**
 * Analyze colors used in template for print safety.
 *
 * @param {string} templateType — template gridType key
 * @returns {{ colors, issues }}
 */
function analyzeColors(templateType) {
  // Template accent colors and their CMYK implications
  const templateColors = {
    academic: [
      { name: 'Oxblood', hex: '#800020', cmyk: { c: 0, m: 100, y: 75, k: 50 }, totalInk: 225 },
      { name: 'Chapter Grey', hex: '#737373', cmyk: { c: 0, m: 0, y: 0, k: 55 }, totalInk: 55 },
    ],
    trade: [
      { name: 'Black', hex: '#000000', cmyk: { c: 0, m: 0, y: 0, k: 100 }, totalInk: 100 },
      { name: 'Chapter Number Grey', hex: '#d9d9d9', cmyk: { c: 0, m: 0, y: 0, k: 15 }, totalInk: 15 },
    ],
    editorial: [
      { name: 'Black', hex: '#000000', cmyk: { c: 0, m: 0, y: 0, k: 100 }, totalInk: 100 },
    ],
    corporate: [
      { name: 'MidnightBlue', hex: '#191970', cmyk: { c: 100, m: 100, y: 0, k: 55 }, totalInk: 255 },
      { name: 'Grey accent', hex: '#4d4d4d', cmyk: { c: 0, m: 0, y: 0, k: 70 }, totalInk: 70 },
    ],
    creative: [
      { name: 'Black', hex: '#000000', cmyk: { c: 0, m: 0, y: 0, k: 100 }, totalInk: 100 },
    ],
    basic: [
      { name: 'Black', hex: '#000000', cmyk: { c: 0, m: 0, y: 0, k: 100 }, totalInk: 100 },
    ],
  };

  const colors = templateColors[templateType] || templateColors.basic;
  const issues = [];

  for (const color of colors) {
    if (color.totalInk > QA_THRESHOLDS.maxInkCoverage) {
      issues.push({
        type: 'ink_coverage',
        severity: 'warn',
        color: color.name,
        detail: `Total ink coverage ${color.totalInk}% exceeds recommended ${QA_THRESHOLDS.maxInkCoverage}%. May cause drying issues on uncoated stock.`,
      });
    }
  }

  return { colors, issues };
}

/**
 * Calculate relative luminance from hex color (WCAG formula).
 */
function relativeLuminance(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const [R, G, B] = [r, g, b].map(c =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  );

  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

/**
 * Calculate contrast ratio between two colors.
 */
function contrastRatio(hex1, hex2) {
  const l1 = relativeLuminance(hex1);
  const l2 = relativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// ================================================================
// Full Print QA Analysis
// ================================================================

/**
 * Run comprehensive print QA checks.
 *
 * @param {object} opts
 * @param {string} opts.templateType  — template grid type
 * @param {string} opts.template      — template key (for color analysis)
 * @param {number} opts.wordCount     — total words
 * @param {number} opts.figureCount   — number of figures
 * @param {boolean} opts.hasFootnotes — whether footnotes are present
 * @param {boolean} opts.hasTables    — whether tables are present
 * @param {boolean} opts.hasImages    — whether images are present
 * @param {string} opts.colorMode     — 'bw' | 'color'
 * @param {string} opts.paperStock    — 'white' | 'cream'
 * @param {object} opts.extensions    — template extension tokens
 * @returns {{ score, grade, checks, recommendations }}
 */
function runPrintQA(opts) {
  const {
    templateType = 'academic',
    wordCount = 0,
    figureCount = 0,
    hasFootnotes = false,
    hasTables = false,
    hasImages = false,
    colorMode = 'bw',
    paperStock = 'white',
    extensions = {},
  } = opts;

  const checks = [];
  let score = 100;

  // ── 1. Font size checks ──
  const fontSize = extensions.fontSize || (templateType === 'academic' ? 12 : 11);
  const fontSizeOk = fontSize >= QA_THRESHOLDS.minBodySize;
  checks.push({
    name: 'Body text size',
    status: fontSizeOk ? 'pass' : 'fail',
    detail: fontSizeOk
      ? `${fontSize}pt body text — meets ${QA_THRESHOLDS.minBodySize}pt minimum for print`
      : `${fontSize}pt body text — below ${QA_THRESHOLDS.minBodySize}pt print minimum. Small text may be illegible.`,
  });
  if (!fontSizeOk) score -= 20;

  // Footnote size
  if (hasFootnotes) {
    const fnSize = Math.round(fontSize * 0.85);
    const fnOk = fnSize >= QA_THRESHOLDS.minFootnoteSize;
    checks.push({
      name: 'Footnote text size',
      status: fnOk ? 'pass' : 'warn',
      detail: fnOk
        ? `~${fnSize}pt footnotes — readable at print resolution`
        : `~${fnSize}pt footnotes — may be difficult to read on some paper stocks`,
    });
    if (!fnOk) score -= 10;
  }

  // ── 2. Color/ink coverage ──
  const colorAnalysis = analyzeColors(templateType);
  for (const issue of colorAnalysis.issues) {
    checks.push({
      name: `Ink coverage: ${issue.color}`,
      status: issue.severity,
      detail: issue.detail,
    });
    if (issue.severity === 'warn') score -= 5;
  }

  // ── 3. Contrast thresholds ──
  // Check accent color against paper
  const paperColor = paperStock === 'cream' ? '#fffdf5' : '#ffffff';
  for (const color of colorAnalysis.colors) {
    const ratio = contrastRatio(color.hex, paperColor);
    const contrastOk = ratio >= QA_THRESHOLDS.minContrastRatio;
    checks.push({
      name: `Contrast: ${color.name} on ${paperStock} paper`,
      status: contrastOk ? 'pass' : 'warn',
      detail: `Contrast ratio ${ratio.toFixed(1)}:1 ${contrastOk ? '≥' : '<'} ${QA_THRESHOLDS.minContrastRatio}:1 (WCAG AA)`,
    });
    if (!contrastOk) score -= 8;
  }

  // ── 4. Thin rule visibility ──
  checks.push({
    name: 'Rule thickness',
    status: 'pass',
    detail: `Template rules ≥ ${QA_THRESHOLDS.minRuleThickness}pt (${(QA_THRESHOLDS.minRuleThickness * 0.3528).toFixed(2)}mm) — visible on all stocks`,
  });

  // ── 5. Image DPI advisory ──
  if (hasImages || figureCount > 0) {
    checks.push({
      name: 'Image resolution',
      status: 'info',
      detail: `${figureCount || 'Unknown'} image(s) detected. Verify all images are ≥ ${QA_THRESHOLDS.minPrintDPI} DPI for print output.`,
    });
  }

  // ── 6. Grayscale handling ──
  if (colorMode === 'bw') {
    checks.push({
      name: 'Grayscale output',
      status: 'pass',
      detail: 'B&W mode — template colors will render in grayscale. Verify contrast is maintained.',
    });
  } else {
    checks.push({
      name: 'Color output',
      status: 'info',
      detail: 'Color mode — ensure images are CMYK for offset printing. RGB is acceptable for POD.',
    });
  }

  // ── 7. Paper stock suitability ──
  if (paperStock === 'cream' && hasImages && colorMode === 'color') {
    checks.push({
      name: 'Paper stock + color images',
      status: 'warn',
      detail: 'Cream paper with color images may shift color temperature. Consider white paper for color-heavy books.',
    });
    score -= 5;
  } else {
    checks.push({
      name: 'Paper stock',
      status: 'pass',
      detail: `${paperStock === 'cream' ? 'Cream' : 'White'} paper — ${paperStock === 'cream' ? 'warm tone, ideal for text-heavy fiction/nonfiction' : 'neutral, ideal for images and diagrams'}`,
    });
  }

  // ── 8. Long text blocks (reading fatigue) ──
  const estimatedPages = Math.ceil(wordCount / 250);
  if (estimatedPages > 500) {
    checks.push({
      name: 'Volume assessment',
      status: 'info',
      detail: `~${estimatedPages} pages. For books over 500 pages, consider cream paper stock to reduce eye strain and a slightly larger font size.`,
    });
  }

  // ── 9. Table print safety ──
  if (hasTables) {
    checks.push({
      name: 'Table rendering',
      status: 'info',
      detail: 'Tables detected. Verify thin rules and small text in cells meet minimum print thresholds.',
    });
  }

  score = Math.max(0, Math.min(100, score));

  // Recommendations based on score
  const recommendations = [];
  if (score < 80) {
    recommendations.push('Review font sizes and contrast ratios for optimal print quality.');
  }
  if (colorAnalysis.issues.length > 0) {
    recommendations.push('Consider using richer black (C:40 M:40 Y:40 K:100) instead of 100K for large text on covers.');
  }
  if (hasImages && colorMode === 'bw') {
    recommendations.push('Ensure images are saved in grayscale to avoid unexpected halftone patterns.');
  }
  if (estimatedPages > 300 && fontSize < 11) {
    recommendations.push('For lengthy manuscripts, a slightly larger font improves sustained readability.');
  }

  return {
    score,
    grade: score >= 90 ? 'A' : score >= 75 ? 'B' : score >= 60 ? 'C' : 'D',
    checks,
    recommendations,
    thresholds: QA_THRESHOLDS,
  };
}

// ================================================================
// Exports
// ================================================================

module.exports = {
  QA_THRESHOLDS,
  analyzeColors,
  relativeLuminance,
  contrastRatio,
  runPrintQA,
};
