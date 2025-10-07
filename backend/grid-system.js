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
// - Typographic scale based on proportional relationships
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
      trade: 11,     // 11pt baseline for Paperback template
      editorial: 11, // 11pt baseline for Chronicle template
      corporate: 11, // 11pt baseline for Matrix template
      creative: 11   // 11pt baseline for Avant-Garde template
    };
    
    // Typographic scale based on golden ratio (1.618)
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
   * Ensures margins are multiples of baseline grid
   */
  calculateMargins(pageSize, preset, template = 'academic') {
    const base = this.baseline[template];
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
    const gridMargin = (base * multiplier) / 72; // Convert pt to inches
    
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
