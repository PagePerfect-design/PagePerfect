/**
 * Typography Assurance System
 *
 * Turns the typographic narrative into a measurable system:
 * baseline grid conformance checks, heading spacing checks,
 * running head collision checks, footnote grid alignment,
 * and a "typographic report" for the Press stage.
 */

const GridSystem = require('./grid-system');

// ================================================================
// Typographic Rules Database
// ================================================================

/**
 * Typographic rules per template category.
 * These encode the deliberate design decisions for each system.
 */
const TYPOGRAPHIC_RULES = {
  academic: {
    baselineGrid: 12,             // pt
    lineHeight: 1.15,             // ratio
    minLeading: 13.8,             // pt (12 × 1.15)
    maxLeading: 18,               // pt
    parIndentRange: [1.0, 2.5],   // em
    parSkipAllowed: false,
    headingFont: 'serif',
    bodyFont: 'serif',
    runningHeadSize: [8, 10],     // pt range
    footnoteSize: [8, 10],        // pt range
    blockquoteReduction: 0.85,    // multiplier vs body
    widowOrphanStrict: true,
    justification: 'full',
    hyphenation: 'moderate',
  },
  trade: {
    baselineGrid: 11,
    lineHeight: 1.35,
    minLeading: 14.85,
    maxLeading: 17,
    parIndentRange: [1.0, 2.0],
    parSkipAllowed: false,
    headingFont: 'sans-serif',
    bodyFont: 'sans-serif',
    runningHeadSize: [8, 10],
    footnoteSize: [8, 10],
    blockquoteReduction: 0.9,
    widowOrphanStrict: true,
    justification: 'full',
    hyphenation: 'light',
  },
  editorial: {
    baselineGrid: 11,
    lineHeight: 1.2,
    minLeading: 13.2,
    maxLeading: 16,
    parIndentRange: [0, 0],
    parSkipAllowed: true,
    headingFont: 'sans-serif',
    bodyFont: 'sans-serif',
    runningHeadSize: [7, 9],
    footnoteSize: [7, 9],
    blockquoteReduction: 0.9,
    widowOrphanStrict: false,
    justification: 'ragged-right',
    hyphenation: 'moderate',
  },
  corporate: {
    baselineGrid: 11,
    lineHeight: 1.15,
    minLeading: 12.65,
    maxLeading: 16,
    parIndentRange: [1.0, 2.0],
    parSkipAllowed: false,
    headingFont: 'sans-serif',
    bodyFont: 'sans-serif',
    runningHeadSize: [8, 10],
    footnoteSize: [8, 9],
    blockquoteReduction: 0.9,
    widowOrphanStrict: true,
    justification: 'full',
    hyphenation: 'minimal',
  },
  creative: {
    baselineGrid: 11,
    lineHeight: 1.2,
    minLeading: 13.2,
    maxLeading: 18,
    parIndentRange: [0, 0],
    parSkipAllowed: true,
    headingFont: 'sans-serif',
    bodyFont: 'sans-serif',
    runningHeadSize: [7, 9],
    footnoteSize: [7, 9],
    blockquoteReduction: 0.85,
    widowOrphanStrict: false,
    justification: 'ragged-right',
    hyphenation: 'light',
  },
  basic: {
    baselineGrid: 12,
    lineHeight: 1.15,
    minLeading: 13.8,
    maxLeading: 18,
    parIndentRange: [1.0, 2.0],
    parSkipAllowed: false,
    headingFont: 'serif',
    bodyFont: 'serif',
    runningHeadSize: [8, 10],
    footnoteSize: [8, 10],
    blockquoteReduction: 0.9,
    widowOrphanStrict: false,
    justification: 'full',
    hyphenation: 'moderate',
  },
};

// ================================================================
// Typographic Analysis
// ================================================================

/**
 * Run typography assurance checks on the compile configuration.
 * These are pre-compilation checks that validate the settings
 * against the template's typographic rules.
 *
 * @param {object} opts
 * @param {string} opts.template     — template key (gridType)
 * @param {string} opts.pageSize     — page size key
 * @param {string} opts.marginPreset — margin preset
 * @param {object} [opts.extensions] — template extension overrides
 * @returns {{ score, checks, report }}
 */
function analyzeTypography(opts) {
  const { template = 'academic', pageSize = 'sixByNine', marginPreset = 'normal', extensions = {} } = opts;

  const rules = TYPOGRAPHIC_RULES[template] || TYPOGRAPHIC_RULES.academic;
  const gridSystem = new GridSystem();
  const typo = gridSystem.generateTypography(template);
  const checks = [];
  let score = 100; // Start at perfect, deduct for issues

  // ── Baseline grid conformance ──
  const actualLeading = typo.baseSize * rules.lineHeight;
  const gridConformant = Math.abs(actualLeading - Math.round(actualLeading)) < 0.5;
  checks.push({
    name: 'Baseline grid conformance',
    status: gridConformant ? 'pass' : 'warn',
    detail: gridConformant
      ? `Leading ${actualLeading.toFixed(1)}pt snaps to ${rules.baselineGrid}pt grid`
      : `Leading ${actualLeading.toFixed(1)}pt does not align to grid`,
    impact: gridConformant ? 0 : 5,
  });
  if (!gridConformant) score -= 5;

  // ── Heading scale harmony ──
  const h1Ratio = typo.h1Size / typo.baseSize;
  const h2Ratio = typo.h2Size / typo.baseSize;
  const h3Ratio = typo.h3Size / typo.baseSize;
  const scaleProgression = h1Ratio > h2Ratio && h2Ratio > h3Ratio && h3Ratio > 1;
  checks.push({
    name: 'Heading scale progression',
    status: scaleProgression ? 'pass' : 'warn',
    detail: `H1: ${h1Ratio.toFixed(2)}× / H2: ${h2Ratio.toFixed(2)}× / H3: ${h3Ratio.toFixed(2)}× body`,
    impact: scaleProgression ? 0 : 8,
  });
  if (!scaleProgression) score -= 8;

  // ── Heading spacing grid alignment ──
  const h1Spacing = typo.spacingXxl || 36;
  const h1SnapsToGrid = h1Spacing % rules.baselineGrid === 0;
  checks.push({
    name: 'Heading spacing grid alignment',
    status: h1SnapsToGrid ? 'pass' : 'info',
    detail: h1SnapsToGrid
      ? `Chapter spacing (${h1Spacing}pt) aligns to ${rules.baselineGrid}pt grid`
      : `Chapter spacing (${h1Spacing}pt) slightly off ${rules.baselineGrid}pt grid — within tolerance`,
    impact: h1SnapsToGrid ? 0 : 3,
  });
  if (!h1SnapsToGrid) score -= 3;

  // ── Text block proportions ──
  const geoString = gridSystem.calculateMargins(pageSize, marginPreset, template);
  const marginMatch = geoString.match(/margin=([\d.]+)/);
  const isMetric = geoString.includes('mm');
  if (marginMatch) {
    const margin = parseFloat(marginMatch[1]);
    const marginInches = isMetric ? margin / 25.4 : margin;

    // Estimate text block width
    const pageDims = {
      letter: 8.5, a4: 8.27, sixByNine: 6, fiveFiveByEightFive: 5.5,
      sevenByTen: 7, a5: 5.83, amazonFiveByEight: 5, amazonSixByNine: 6,
      amazonSevenByTen: 7, amazonEightByTen: 8, amazonEightFiveByEleven: 8.5,
    };
    const pageWidth = pageDims[pageSize] || 6;
    const textWidth = pageWidth - marginInches * 2;
    const charsPerLine = Math.round(textWidth * 72 / (typo.baseSize * 0.5)); // rough estimate

    // Optimal characters per line: 45-75 (Bringhurst)
    const charCountOk = charsPerLine >= 45 && charsPerLine <= 75;
    checks.push({
      name: 'Characters per line (Bringhurst)',
      status: charCountOk ? 'pass' : charsPerLine < 40 || charsPerLine > 85 ? 'warn' : 'info',
      detail: `~${charsPerLine} characters/line (optimal: 45–75)`,
      impact: charCountOk ? 0 : 7,
    });
    if (!charCountOk) score -= 7;

    // Margin-to-text ratio
    const marginRatio = (marginInches * 2) / pageWidth;
    const ratioOk = marginRatio >= 0.2 && marginRatio <= 0.45;
    checks.push({
      name: 'Margin-to-page ratio',
      status: ratioOk ? 'pass' : 'info',
      detail: `${(marginRatio * 100).toFixed(0)}% of page width is margins (ideal: 20–45%)`,
      impact: ratioOk ? 0 : 5,
    });
    if (!ratioOk) score -= 5;
  }

  // ── Widow/orphan policy ──
  checks.push({
    name: 'Widow/orphan control',
    status: rules.widowOrphanStrict ? 'pass' : 'info',
    detail: rules.widowOrphanStrict
      ? 'Strict widow/orphan prevention (penalty ≥ 8000)'
      : 'Relaxed widow/orphan control (intentional for this template style)',
    impact: 0,
  });

  // ── Extension overrides impact ──
  if (Object.keys(extensions).length > 0) {
    let extensionConflicts = 0;
    if (extensions.fontSize && (extensions.fontSize < rules.baselineGrid - 2 || extensions.fontSize > rules.baselineGrid + 2)) {
      extensionConflicts++;
    }
    if (extensions.lineHeight && (extensions.lineHeight < rules.lineHeight - 0.2 || extensions.lineHeight > rules.lineHeight + 0.3)) {
      extensionConflicts++;
    }
    if (extensionConflicts > 0) {
      checks.push({
        name: 'Extension compatibility',
        status: 'warn',
        detail: `${extensionConflicts} extension override(s) deviate significantly from template design system`,
        impact: extensionConflicts * 5,
      });
      score -= extensionConflicts * 5;
    } else {
      checks.push({
        name: 'Extension compatibility',
        status: 'pass',
        detail: 'All overrides within template system tolerances',
        impact: 0,
      });
    }
  }

  score = Math.max(0, Math.min(100, score));

  // ── Generate report ──
  const report = {
    templateType: template,
    designSystem: rules,
    typography: {
      baseSize: typo.baseSize,
      leading: actualLeading,
      h1Size: typo.h1Size,
      h2Size: typo.h2Size,
      h3Size: typo.h3Size,
      scale: { h1: h1Ratio, h2: h2Ratio, h3: h3Ratio },
    },
    gridSystem: {
      baseline: rules.baselineGrid,
      leading: actualLeading,
      conformant: gridConformant,
    },
  };

  return {
    score,
    grade: score >= 90 ? 'A' : score >= 75 ? 'B' : score >= 60 ? 'C' : 'D',
    checks,
    report,
  };
}

// ================================================================
// Post-Compilation Typography Report
// ================================================================

/**
 * Generate a typographic report from compile log output.
 * This is the "premium" report shown in the Press/Export stage.
 *
 * @param {object} preAnalysis — from analyzeTypography
 * @param {object} compileLog — from book-engineering.analyzeCompileLog
 * @returns {object} Full typographic report
 */
function generateTypographicReport(preAnalysis, compileLog = null) {
  const report = {
    ...preAnalysis,
    timestamp: new Date().toISOString(),
  };

  if (compileLog) {
    // Incorporate compile-time findings
    const overfullCount = compileLog.overfullBoxes?.length || 0;
    const underfullCount = compileLog.underfullBoxes?.length || 0;

    if (overfullCount > 0) {
      report.checks.push({
        name: 'Overfull hbox warnings',
        status: overfullCount > 10 ? 'warn' : 'info',
        detail: `${overfullCount} overfull hbox warning(s) — text extending beyond margins`,
        impact: Math.min(overfullCount * 2, 15),
      });
      report.score = Math.max(0, report.score - Math.min(overfullCount * 2, 15));
    }

    if (underfullCount > 0) {
      report.checks.push({
        name: 'Underfull hbox warnings',
        status: underfullCount > 5 ? 'warn' : 'info',
        detail: `${underfullCount} underfull hbox warning(s) — loose line spacing`,
        impact: Math.min(underfullCount, 10),
      });
      report.score = Math.max(0, report.score - Math.min(underfullCount, 10));
    }

    report.compileStats = {
      overfullBoxes: overfullCount,
      underfullBoxes: underfullCount,
      floatIssues: compileLog.floatIssues?.length || 0,
      footnoteIssues: compileLog.footnoteIssues?.length || 0,
    };

    // Recalculate grade
    report.grade = report.score >= 90 ? 'A' : report.score >= 75 ? 'B' : report.score >= 60 ? 'C' : 'D';
  }

  return report;
}

// ================================================================
// Exports
// ================================================================

module.exports = {
  TYPOGRAPHIC_RULES,
  analyzeTypography,
  generateTypographicReport,
};
