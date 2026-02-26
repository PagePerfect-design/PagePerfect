'use strict';

const GridSystem = require('../grid-system');

describe('GridSystem — Typst methods', () => {
  let grid;

  beforeEach(() => {
    grid = new GridSystem();
  });

  describe('calculateTypstMargins', () => {
    test('returns #set page(...) syntax', () => {
      const result = grid.calculateTypstMargins('letter', 'normal');
      expect(result).toMatch(/^#set page\(/);
      expect(result).toContain('width:');
      expect(result).toContain('height:');
      expect(result).toContain('margin:');
    });

    test('letter uses inches', () => {
      const result = grid.calculateTypstMargins('letter', 'normal');
      expect(result).toContain('8.5in');
      expect(result).toContain('11in');
      expect(result).toMatch(/margin: [\d.]+in/);
    });

    test('a4 uses millimeters', () => {
      const result = grid.calculateTypstMargins('a4', 'normal');
      expect(result).toContain('210mm');
      expect(result).toContain('297mm');
      expect(result).toMatch(/margin: [\d.]+mm/);
    });

    test('a5 uses millimeters', () => {
      const result = grid.calculateTypstMargins('a5', 'normal');
      expect(result).toContain('148mm');
      expect(result).toContain('210mm');
    });

    test('sixByNine uses inches', () => {
      const result = grid.calculateTypstMargins('sixByNine', 'normal');
      expect(result).toContain('6in');
      expect(result).toContain('9in');
    });

    test('fiveFiveByEightFive uses inches', () => {
      const result = grid.calculateTypstMargins('fiveFiveByEightFive', 'normal');
      expect(result).toContain('5.5in');
      expect(result).toContain('8.5in');
    });

    test('royal uses millimeters', () => {
      const result = grid.calculateTypstMargins('royal', 'normal');
      expect(result).toContain('156mm');
      expect(result).toContain('234mm');
    });

    test('bFormat uses millimeters', () => {
      const result = grid.calculateTypstMargins('bFormat', 'normal');
      expect(result).toContain('129mm');
      expect(result).toContain('198mm');
    });

    test('massMarket uses inches', () => {
      const result = grid.calculateTypstMargins('massMarket', 'normal');
      expect(result).toContain('4.25in');
      expect(result).toContain('6.87in');
    });

    test('Amazon KDP sizes produce correct dimensions', () => {
      const result = grid.calculateTypstMargins('amazonSixByNine', 'normal');
      expect(result).toContain('6in');
      expect(result).toContain('9in');
    });

    test('minimal preset produces smaller margins than generous', () => {
      const minimal = grid.calculateTypstMargins('letter', 'minimal');
      const generous = grid.calculateTypstMargins('letter', 'generous');
      // Extract margin values
      const minMargin = parseFloat(minimal.match(/margin: ([\d.]+)in/)[1]);
      const genMargin = parseFloat(generous.match(/margin: ([\d.]+)in/)[1]);
      expect(minMargin).toBeLessThan(genMargin);
    });

    test('margin is capped at 20% of page width', () => {
      // For massMarket (4.25in wide), generous (8 units) should be capped
      const result = grid.calculateTypstMargins('massMarket', 'generous');
      const margin = parseFloat(result.match(/margin: ([\d.]+)in/)[1]);
      expect(margin).toBeLessThanOrEqual(4.25 * 0.20 + 0.001); // small tolerance for float
    });

    test('unknown page size defaults to letter', () => {
      const result = grid.calculateTypstMargins('nonexistent', 'normal');
      expect(result).toContain('8.5in');
      expect(result).toContain('11in');
    });

    test('unknown preset defaults to normal', () => {
      const result = grid.calculateTypstMargins('letter', 'nonexistent');
      const normal = grid.calculateTypstMargins('letter', 'normal');
      expect(result).toBe(normal);
    });

    test('unknown template defaults to academic baseline', () => {
      const result = grid.calculateTypstMargins('letter', 'normal', 'nonexistent');
      const academic = grid.calculateTypstMargins('letter', 'normal', 'academic');
      expect(result).toBe(academic);
    });

    test('trade template uses 11pt baseline (different margin from academic)', () => {
      const trade = grid.calculateTypstMargins('letter', 'normal', 'trade');
      const academic = grid.calculateTypstMargins('letter', 'normal', 'academic');
      expect(trade).not.toBe(academic);
    });
  });

  describe('generateTypstCommands', () => {
    test('returns string with Typst set rules', () => {
      const result = grid.generateTypstCommands('academic');
      expect(typeof result).toBe('string');
      expect(result).toContain('#set par(leading:');
    });

    test('defines grid-h1 through grid-small', () => {
      const result = grid.generateTypstCommands('academic');
      expect(result).toContain('#let grid-h1');
      expect(result).toContain('#let grid-h2');
      expect(result).toContain('#let grid-h3');
      expect(result).toContain('#let grid-small');
    });

    test('defines spacing functions xs through xxl', () => {
      const result = grid.generateTypstCommands('academic');
      expect(result).toContain('#let grid-space-xs');
      expect(result).toContain('#let grid-space-sm');
      expect(result).toContain('#let grid-space-md');
      expect(result).toContain('#let grid-space-lg');
      expect(result).toContain('#let grid-space-xl');
      expect(result).toContain('#let grid-space-xxl');
    });

    test('academic uses 12pt baseline sizes', () => {
      const result = grid.generateTypstCommands('academic');
      // h1 = 12 * 2.25 = 27pt
      expect(result).toContain('27pt');
      // h2 = 12 * 1.75 = 21pt
      expect(result).toContain('21pt');
    });

    test('trade uses 11pt baseline sizes', () => {
      const result = grid.generateTypstCommands('trade');
      // h2 = round(11 * 1.75) = round(19.25) = 19pt
      expect(result).toContain('19pt');
    });

    test('thesis uses same 12pt baseline as academic', () => {
      const result = grid.generateTypstCommands('thesis');
      expect(result).toContain('27pt');
    });

    test('unknown template produces NaN (no fallback in generateTypography)', () => {
      // generateTypography uses this.baseline[template] without fallback,
      // so unknown templates produce NaN. This is the existing behavior.
      const result = grid.generateTypstCommands('nonexistent');
      expect(result).toContain('NaN');
    });
  });
});
