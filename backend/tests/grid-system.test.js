'use strict';

const GridSystem = require('../grid-system');

describe('GridSystem', () => {
  let grid;

  beforeEach(() => {
    grid = new GridSystem();
  });

  describe('constructor', () => {
    test('has academic and trade baselines', () => {
      expect(grid.baseline.academic).toBe(12);
      expect(grid.baseline.trade).toBe(11);
    });

    test('has golden-ratio scale', () => {
      expect(grid.scale.h1).toBe(2.25);
      expect(grid.scale.body).toBe(1);
    });

    test('has margin multipliers in gridUnits', () => {
      expect(grid.gridUnits.md).toBe(1);
      expect(grid.gridUnits.xl).toBe(2);
    });
  });

  describe('calculateMargins', () => {
    test('returns geometry string for letter size', () => {
      const result = grid.calculateMargins('letter', 'normal');
      expect(result).toContain('letterpaper');
      expect(result).toContain('margin=');
    });

    test('returns geometry string for A4', () => {
      const result = grid.calculateMargins('a4', 'normal');
      expect(result).toContain('a4paper');
      expect(result).toContain('mm');
    });

    test('returns geometry for 6x9', () => {
      const result = grid.calculateMargins('sixByNine', 'normal');
      expect(result).toContain('paperwidth=6in');
      expect(result).toContain('paperheight=9in');
    });

    test('caps margins at 20% per side for small pages', () => {
      // Mass market (4.25in wide) with generous (8 grid units) should be capped
      const result = grid.calculateMargins('massMarket', 'generous', 'academic');
      const marginMatch = result.match(/margin=([0-9.]+)in/);
      expect(marginMatch).toBeTruthy();
      const margin = parseFloat(marginMatch[1]);
      // Max should be 4.25 * 0.20 = 0.85in (allow floating point tolerance)
      expect(margin).toBeCloseTo(0.85, 2);
    });

    test('uses normal preset as default for unknown preset', () => {
      const normal = grid.calculateMargins('letter', 'normal');
      const unknown = grid.calculateMargins('letter', 'nonexistent');
      expect(normal).toBe(unknown);
    });

    test('falls back to academic template for unknown template', () => {
      const result = grid.calculateMargins('letter', 'normal', 'unknown');
      const academic = grid.calculateMargins('letter', 'normal', 'academic');
      expect(result).toBe(academic);
    });

    test('handles all page sizes without error', () => {
      const sizes = [
        'a4', 'letter', 'sixByNine', 'fiveFiveByEightFive', 'sevenByTen',
        'a5', 'royal', 'bFormat', 'aFormat', 'demy', 'crownQuarto', 'b5',
        'massMarket', 'fiveTwentyFiveByEight', 'amazonFiveByEight',
        'amazonSixByNine', 'amazonSevenByTen', 'amazonEightByTen',
        'amazonEightFiveByEleven',
      ];
      for (const size of sizes) {
        expect(() => grid.calculateMargins(size, 'normal')).not.toThrow();
      }
    });

    test('handles all margin presets without error', () => {
      const presets = ['minimal', 'compact', 'narrow', 'normal', 'wide', 'academic', 'generous'];
      for (const preset of presets) {
        expect(() => grid.calculateMargins('letter', preset)).not.toThrow();
      }
    });
  });

  describe('generateTypography', () => {
    test('returns academic typography with 12pt base', () => {
      const typo = grid.generateTypography('academic');
      expect(typo.baseSize).toBe(12);
      expect(typo.lineHeight).toBe(1.5);
      expect(typo.h1Size).toBe(27); // 12 * 2.25
      expect(typo.h2Size).toBe(21); // 12 * 1.75
    });

    test('returns trade typography with 11pt base', () => {
      const typo = grid.generateTypography('trade');
      expect(typo.baseSize).toBe(11);
      expect(typo.lineHeight).toBe(1.4);
      expect(typo.h1Size).toBe(25); // Math.round(11 * 2.25)
    });

    test('generates grid-based spacing', () => {
      const typo = grid.generateTypography('academic');
      expect(typo.spacingMd).toBe(12); // 12 * 1
      expect(typo.spacingXl).toBe(24); // 12 * 2
    });
  });

  describe('generateLaTeXCommands', () => {
    test('includes setspace package', () => {
      const result = grid.generateLaTeXCommands('academic');
      expect(result).toContain('\\usepackage{setspace}');
    });

    test('includes typographic scale commands', () => {
      const result = grid.generateLaTeXCommands('academic');
      expect(result).toContain('\\gridHOne');
      expect(result).toContain('\\gridHTwo');
      expect(result).toContain('\\gridHThree');
      expect(result).toContain('\\gridSmall');
    });

    test('includes grid spacing commands', () => {
      const result = grid.generateLaTeXCommands('trade');
      expect(result).toContain('\\gridSpaceXs');
      expect(result).toContain('\\gridSpaceMd');
      expect(result).toContain('\\gridSpaceXxl');
    });

    test('sets correct line stretch', () => {
      const academic = grid.generateLaTeXCommands('academic');
      expect(academic).toContain('\\setstretch{1.5}');

      const trade = grid.generateLaTeXCommands('trade');
      expect(trade).toContain('\\setstretch{1.4}');
    });
  });
});
