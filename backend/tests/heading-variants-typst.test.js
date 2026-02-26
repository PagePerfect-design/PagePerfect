'use strict';

const { getTypstVariantPreamble } = require('../heading-variants-typst');

describe('getTypstVariantPreamble', () => {
  describe('classic variant', () => {
    test('returns empty string for classic variant', () => {
      expect(getTypstVariantPreamble('symphony', 'classic')).toBe('');
      expect(getTypstVariantPreamble('chicago', 'classic')).toBe('');
      expect(getTypstVariantPreamble('thesis', 'classic')).toBe('');
    });

    test('returns empty string for null/undefined variant', () => {
      expect(getTypstVariantPreamble('symphony', null)).toBe('');
      expect(getTypstVariantPreamble('symphony', undefined)).toBe('');
    });

    test('returns empty string for unknown variant', () => {
      expect(getTypstVariantPreamble('symphony', 'unknown')).toBe('');
    });
  });

  describe('book-class modern variant', () => {
    test('symphony uses book-class modern', () => {
      const result = getTypstVariantPreamble('symphony', 'modern');
      expect(result).toContain('heading.where(level: 1)');
      expect(result).toContain('Chapter');
      expect(result).toContain('18pt');
      expect(result).toContain('tracking: 1.5pt');
    });

    test('paperback uses book-class modern', () => {
      const result = getTypstVariantPreamble('paperback', 'modern');
      expect(result).toContain('Chapter');
    });

    test('memoir uses book-class modern', () => {
      const result = getTypstVariantPreamble('memoir', 'modern');
      expect(result).toContain('Chapter');
    });
  });

  describe('book-class bold variant', () => {
    test('symphony uses book-class bold with 96pt numbers', () => {
      const result = getTypstVariantPreamble('symphony', 'bold');
      expect(result).toContain('96pt');
      expect(result).toContain('weight: "bold"');
      expect(result).toContain('stroke: 2pt');
    });

    test('includes level 2 and 3 headings', () => {
      const result = getTypstVariantPreamble('symphony', 'bold');
      expect(result).toContain('heading.where(level: 2)');
      expect(result).toContain('heading.where(level: 3)');
    });
  });

  describe('article-class modern variant', () => {
    test('chronicle uses article-class modern (no Chapter)', () => {
      const result = getTypstVariantPreamble('chronicle', 'modern');
      expect(result).toContain('heading.where(level: 1)');
      expect(result).not.toContain('Chapter');
      expect(result).toContain('16pt');
    });

    test('matrix uses article-class modern', () => {
      const result = getTypstVariantPreamble('matrix', 'modern');
      expect(result).not.toContain('Chapter');
    });
  });

  describe('article-class bold variant', () => {
    test('chronicle uses article-class bold with 3pt rule', () => {
      const result = getTypstVariantPreamble('chronicle', 'bold');
      expect(result).toContain('stroke: 3pt');
      expect(result).toContain('26pt');
    });
  });

  describe('thesis-class variants', () => {
    test('thesis modern preserves section numbering', () => {
      const result = getTypstVariantPreamble('thesis', 'modern');
      expect(result).toContain('counter(heading).display()');
      expect(result).toContain('heading.where(level: 1)');
      expect(result).toContain('heading.where(level: 2)');
      expect(result).toContain('heading.where(level: 3)');
    });

    test('thesis bold preserves section numbering', () => {
      const result = getTypstVariantPreamble('thesis', 'bold');
      expect(result).toContain('counter(heading).display()');
      expect(result).toContain('stroke: 3pt');
    });
  });

  describe('unknown template defaults to article', () => {
    test('unknown template modern uses article class', () => {
      const result = getTypstVariantPreamble('nonexistent', 'modern');
      expect(result).not.toContain('Chapter');
      expect(result).toContain('heading.where(level: 1)');
    });
  });

  describe('colors and styling', () => {
    test('modern variants use luma(140) for secondary text', () => {
      const book = getTypstVariantPreamble('symphony', 'modern');
      expect(book).toContain('luma(140)');
      const article = getTypstVariantPreamble('chronicle', 'modern');
      expect(article).toContain('luma(140)');
    });

    test('bold variants use luma(225) for ghost numbers', () => {
      const result = getTypstVariantPreamble('symphony', 'bold');
      expect(result).toContain('luma(225)');
    });
  });
});
