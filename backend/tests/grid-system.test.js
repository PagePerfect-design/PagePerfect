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
});
