// Müller-Brockmann Grid System Implementation
// Based on principles of clarity, objectivity, and systematic organization
//
// 📚 REFERENCE: Josef Müller-Brockmann's "Grid Systems in Graphic Design"
// For comprehensive understanding of grid systems in graphic design, we recommend
// Josef Müller-Brockmann's seminal work: 
// https://ia902309.us.archive.org/4/items/GridSystemsInGraphicDesignJosefMullerBrockmann/Grid%20systems%20in%20graphic%20design%20-%20Josef%20Muller-Brockmann.pdf
//
// This implementation follows Müller-Brockmann's principles of:
// - Systematic organization and rationalization
// - Baseline grid for consistent vertical rhythm
// - Proportional typographic scale tuned for print readability
// - Grid-based spacing for visual harmony

/**
 * Grid System Configuration
 * Implements baseline grid and typographic scale
 */
class GridSystem {
  constructor() {
    // Baseline grid: 12pt baseline for academic, 11pt for trade
    this.baseline = {
      academic: 12,  // 12pt baseline for Chicago template
      thesis: 12,    // 12pt baseline for Thesis template (double-spaced)
      trade: 11,     // 11pt baseline for Paperback template
      editorial: 11, // 11pt baseline for Chronicle template
      corporate: 11, // 11pt baseline for Matrix template
      creative: 11,  // 11pt baseline for Avant-Garde template
      basic: 12      // 12pt baseline for Minimal template
    };
    
    // Proportional typographic scale — ratios tuned for print readability
    // (H1 2.25× / H2 1.75× / H3 1.375× produce ~1.28× step progression)
    this.scale = {
      h1: 2.25,    // 27pt for 12pt base, 24.75pt for 11pt base
      h2: 1.75,    // 21pt for 12pt base, 19.25pt for 11pt base
      h3: 1.375,   // 16.5pt for 12pt base, 15.125pt for 11pt base
      body: 1,     // 12pt for academic, 11pt for trade
      small: 0.875 // 10.5pt for 12pt base, 9.625pt for 11pt base
    };
    
    // Line height ratios for optimal readability
    this.lineHeight = {
      academic: 1.5,  // 18pt line height for 12pt text
      thesis: 2.0,    // 24pt line height for 12pt text (double-spaced)
      trade: 1.4      // 15.4pt line height for 11pt text
    };
    
    // Grid units (multiples of baseline)
    this.gridUnits = {
      xs: 0.25,   // 3pt for academic, 2.75pt for trade
      sm: 0.5,    // 6pt for academic, 5.5pt for trade
      md: 1,      // 12pt for academic, 11pt for trade
      lg: 1.5,    // 18pt for academic, 16.5pt for trade
      xl: 2,      // 24pt for academic, 22pt for trade
      xxl: 3      // 36pt for academic, 33pt for trade
    };
  }

  /**
   * Calculate grid-based margins
   * Ensures margins are multiples of baseline grid.
   * Validates that margins don't consume more than 40% of the page width,
   * which would leave insufficient text area.
   */
  calculateMargins(pageSize, preset, template = 'academic') {
    const base = this.baseline[template] || this.baseline.academic; // Fallback to academic
    const mm = (n) => `${n}mm`;
    const in_ = (n) => `${n}in`;

    // Grid-based margin calculations
    const marginMultipliers = {
      minimal: 2,    // 2 grid units
      compact: 3,    // 3 grid units
      narrow: 4,     // 4 grid units
      normal: 5,     // 5 grid units
      wide: 6,       // 6 grid units
      academic: 7,   // 7 grid units
      generous: 8    // 8 grid units
    };

    const multiplier = marginMultipliers[preset] || marginMultipliers.normal;
    let gridMargin = (base * multiplier) / 72; // Convert pt to inches

    // Page width lookup (in inches) for margin validation
    const pageWidths = {
      a4: 8.27, letter: 8.5, sixByNine: 6, fiveFiveByEightFive: 5.5,
      sevenByTen: 7, a5: 5.83, royal: 6.14, bFormat: 5.08, aFormat: 4.37,
      demy: 5.43, crownQuarto: 7.44, b5: 6.93, massMarket: 4.25,
      fiveTwentyFiveByEight: 5.25, amazonFiveByEight: 5,
      amazonSixByNine: 6, amazonSevenByTen: 7, amazonEightByTen: 8,
      amazonEightFiveByEleven: 8.5,
    };
    const pageWidth = pageWidths[pageSize] || pageWidths.letter;
    // Cap margin so that left + right margins don't exceed 40% of page width.
    // This ensures at least 60% of page width is usable text area.
    const maxMargin = pageWidth * 0.20; // 20% per side = 40% total
    if (gridMargin > maxMargin) {
      gridMargin = maxMargin;
    }
    
    switch (pageSize) {
      case 'a4':
        return `a4paper,margin=${mm(gridMargin * 25.4)}`;
      case 'letter':
      default:
        return `letterpaper,margin=${in_(gridMargin)}`;
      case 'sixByNine':
        return `paperwidth=6in,paperheight=9in,margin=${in_(gridMargin)}`;
      case 'fiveFiveByEightFive':
        return `paperwidth=5.5in,paperheight=8.5in,margin=${in_(gridMargin)}`;
      case 'sevenByTen':
        return `paperwidth=7in,paperheight=10in,margin=${in_(gridMargin)}`;
      case 'a5':
        return `paperwidth=148mm,paperheight=210mm,margin=${mm(gridMargin * 25.4)}`;
      // UK book sizes
      case 'royal':
        return `paperwidth=156mm,paperheight=234mm,margin=${mm(gridMargin * 25.4)}`;
      case 'bFormat':
        return `paperwidth=129mm,paperheight=198mm,margin=${mm(gridMargin * 25.4)}`;
      case 'aFormat':
        return `paperwidth=111mm,paperheight=178mm,margin=${mm(gridMargin * 25.4)}`;
      case 'demy':
        return `paperwidth=138mm,paperheight=216mm,margin=${mm(gridMargin * 25.4)}`;
      case 'crownQuarto':
        return `paperwidth=189mm,paperheight=246mm,margin=${mm(gridMargin * 25.4)}`;
      // International standards
      case 'b5':
        return `paperwidth=176mm,paperheight=250mm,margin=${mm(gridMargin * 25.4)}`;
      // US book sizes
      case 'massMarket':
        return `paperwidth=4.25in,paperheight=6.87in,margin=${in_(gridMargin)}`;
      case 'fiveTwentyFiveByEight':
        return `paperwidth=5.25in,paperheight=8in,margin=${in_(gridMargin)}`;
      // Amazon KDP sizes
      case 'amazonFiveByEight':
        return `paperwidth=5in,paperheight=8in,margin=${in_(gridMargin)}`;
      case 'amazonSixByNine':
        return `paperwidth=6in,paperheight=9in,margin=${in_(gridMargin)}`;
      case 'amazonSevenByTen':
        return `paperwidth=7in,paperheight=10in,margin=${in_(gridMargin)}`;
      case 'amazonEightByTen':
        return `paperwidth=8in,paperheight=10in,margin=${in_(gridMargin)}`;
      case 'amazonEightFiveByEleven':
        return `paperwidth=8.5in,paperheight=11in,margin=${in_(gridMargin)}`;
    }
  }

  /**
   * Generate typographic scale for LaTeX
   */
  generateTypography(template = 'academic') {
    const base = this.baseline[template];
    const lineHeight = this.lineHeight[template];
    
    return {
      baseSize: base,
      lineHeight: lineHeight,
      h1Size: Math.round(base * this.scale.h1),
      h2Size: Math.round(base * this.scale.h2),
      h3Size: Math.round(base * this.scale.h3),
      smallSize: Math.round(base * this.scale.small),
      // Grid-based spacing
      spacingXs: Math.round(base * this.gridUnits.xs),
      spacingSm: Math.round(base * this.gridUnits.sm),
      spacingMd: Math.round(base * this.gridUnits.md),
      spacingLg: Math.round(base * this.gridUnits.lg),
      spacingXl: Math.round(base * this.gridUnits.xl),
      spacingXxl: Math.round(base * this.gridUnits.xxl)
    };
  }

  /**
   * Calculate Typst page geometry string.
   * Returns a Typst #set page(...) snippet for the compile pipeline.
   */
  calculateTypstMargins(pageSize, preset, template = 'academic') {
    const base = this.baseline[template] || this.baseline.academic;
    const marginMultipliers = {
      minimal: 2, compact: 3, narrow: 4, normal: 5,
      wide: 6, academic: 7, generous: 8,
    };
    const multiplier = marginMultipliers[preset] || marginMultipliers.normal;
    let gridMargin = (base * multiplier) / 72; // pt to inches

    const pageWidths = {
      a4: 8.27, letter: 8.5, sixByNine: 6, fiveFiveByEightFive: 5.5,
      sevenByTen: 7, a5: 5.83, royal: 6.14, bFormat: 5.08, aFormat: 4.37,
      demy: 5.43, crownQuarto: 7.44, b5: 6.93, massMarket: 4.25,
      fiveTwentyFiveByEight: 5.25, amazonFiveByEight: 5,
      amazonSixByNine: 6, amazonSevenByTen: 7, amazonEightByTen: 8,
      amazonEightFiveByEleven: 8.5,
    };
    const pageWidth = pageWidths[pageSize] || pageWidths.letter;
    const maxMargin = pageWidth * 0.20;
    if (gridMargin > maxMargin) gridMargin = maxMargin;

    // Page dimensions lookup
    const pageDims = {
      a4:           { w: '210mm',    h: '297mm' },
      letter:       { w: '8.5in',    h: '11in' },
      sixByNine:    { w: '6in',      h: '9in' },
      fiveFiveByEightFive: { w: '5.5in', h: '8.5in' },
      sevenByTen:   { w: '7in',      h: '10in' },
      a5:           { w: '148mm',    h: '210mm' },
      royal:        { w: '156mm',    h: '234mm' },
      bFormat:      { w: '129mm',    h: '198mm' },
      aFormat:      { w: '111mm',    h: '178mm' },
      demy:         { w: '138mm',    h: '216mm' },
      crownQuarto:  { w: '189mm',    h: '246mm' },
      b5:           { w: '176mm',    h: '250mm' },
      massMarket:   { w: '4.25in',   h: '6.87in' },
      fiveTwentyFiveByEight: { w: '5.25in', h: '8in' },
      amazonFiveByEight:     { w: '5in',    h: '8in' },
      amazonSixByNine:       { w: '6in',    h: '9in' },
      amazonSevenByTen:      { w: '7in',    h: '10in' },
      amazonEightByTen:      { w: '8in',    h: '10in' },
      amazonEightFiveByEleven: { w: '8.5in', h: '11in' },
    };

    const dims = pageDims[pageSize] || pageDims.letter;
    const useMm = dims.w.endsWith('mm');
    const marginStr = useMm
      ? `${(gridMargin * 25.4).toFixed(1)}mm`
      : `${gridMargin.toFixed(3)}in`;

    return `#set page(width: ${dims.w}, height: ${dims.h}, margin: ${marginStr})`;
  }

  /**
   * Generate Typst typographic commands.
   * Returns Typst set rules for text sizing and paragraph spacing.
   */
  generateTypstCommands(template = 'academic') {
    const typo = this.generateTypography(template);
    return `
// Grid System Typography
#set par(leading: ${(typo.baseSize * typo.lineHeight / 2).toFixed(1)}pt)

// Typographic Scale (available as functions)
#let grid-h1(body) = text(size: ${typo.h1Size}pt, weight: "bold", body)
#let grid-h2(body) = text(size: ${typo.h2Size}pt, weight: "bold", body)
#let grid-h3(body) = text(size: ${typo.h3Size}pt, weight: "bold", body)
#let grid-small(body) = text(size: ${typo.smallSize}pt, body)

// Grid-based Spacing
#let grid-space-xs = v(${typo.spacingXs}pt)
#let grid-space-sm = v(${typo.spacingSm}pt)
#let grid-space-md = v(${typo.spacingMd}pt)
#let grid-space-lg = v(${typo.spacingLg}pt)
#let grid-space-xl = v(${typo.spacingXl}pt)
#let grid-space-xxl = v(${typo.spacingXxl}pt)
`;
  }

  /**
   * Generate LaTeX commands for grid system
   */
  generateLaTeXCommands(template = 'academic') {
    const typo = this.generateTypography(template);
    
    return `
% Grid System Typography
\\usepackage{setspace}
\\setstretch{${typo.lineHeight}}

% Typographic Scale
\\newcommand{\\gridHOne}{\\fontsize{${typo.h1Size}pt}{${Math.round(typo.h1Size * typo.lineHeight)}pt}\\selectfont}
\\newcommand{\\gridHTwo}{\\fontsize{${typo.h2Size}pt}{${Math.round(typo.h2Size * typo.lineHeight)}pt}\\selectfont}
\\newcommand{\\gridHThree}{\\fontsize{${typo.h3Size}pt}{${Math.round(typo.h3Size * typo.lineHeight)}pt}\\selectfont}
\\newcommand{\\gridSmall}{\\fontsize{${typo.smallSize}pt}{${Math.round(typo.smallSize * typo.lineHeight)}pt}\\selectfont}

% Grid-based Spacing
\\newcommand{\\gridSpaceXs}{\\vspace{${typo.spacingXs}pt}}
\\newcommand{\\gridSpaceSm}{\\vspace{${typo.spacingSm}pt}}
\\newcommand{\\gridSpaceMd}{\\vspace{${typo.spacingMd}pt}}
\\newcommand{\\gridSpaceLg}{\\vspace{${typo.spacingLg}pt}}
\\newcommand{\\gridSpaceXl}{\\vspace{${typo.spacingXl}pt}}
\\newcommand{\\gridSpaceXxl}{\\vspace{${typo.spacingXxl}pt}}

% Baseline Grid (for debugging - remove in production)
% \\usepackage{eso-pic}
% \\AddToShipoutPictureBG{%
%   \\AtTextUpperLeft{%
%     \\multiput(0,0)(0,${typo.baseSize})(0,100){%
%       \\line(1,0){\\textwidth}%
%     }%
%   }%
% }
`;
  }
}

module.exports = GridSystem;
