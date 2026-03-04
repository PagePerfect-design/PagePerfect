const {
  HEADING_VARIANTS,
  VARIANT_LABELS,
  VARIANT_DESCRIPTIONS,
  TEMPLATE_CLASS,
} = require('../heading-variants');

// ================================================================
// Constants
// ================================================================

describe('HEADING_VARIANTS', () => {
  it('has 3 variants', () => {
    expect(HEADING_VARIANTS).toHaveLength(3);
  });

  it('includes classic, modern, bold', () => {
    expect(HEADING_VARIANTS).toContain('classic');
    expect(HEADING_VARIANTS).toContain('modern');
    expect(HEADING_VARIANTS).toContain('bold');
  });
});

describe('VARIANT_LABELS', () => {
  it('has label for each variant', () => {
    for (const v of HEADING_VARIANTS) {
      expect(VARIANT_LABELS).toHaveProperty(v);
      expect(typeof VARIANT_LABELS[v]).toBe('string');
    }
  });
});

describe('VARIANT_DESCRIPTIONS', () => {
  it('has description for each variant', () => {
    for (const v of HEADING_VARIANTS) {
      expect(VARIANT_DESCRIPTIONS).toHaveProperty(v);
      expect(typeof VARIANT_DESCRIPTIONS[v]).toBe('string');
    }
  });
});

describe('TEMPLATE_CLASS', () => {
  it('classifies all 15 templates', () => {
    expect(Object.keys(TEMPLATE_CLASS)).toHaveLength(15);
  });

  it('every template is book or article', () => {
    for (const [key, cls] of Object.entries(TEMPLATE_CLASS)) {
      expect(['book', 'article']).toContain(cls);
    }
  });

  it('symphony, chicago, paperback are book class', () => {
    expect(TEMPLATE_CLASS.symphony).toBe('book');
    expect(TEMPLATE_CLASS.chicago).toBe('book');
    expect(TEMPLATE_CLASS.paperback).toBe('book');
  });

  it('chronicle, operator, matrix are article class', () => {
    expect(TEMPLATE_CLASS.chronicle).toBe('article');
    expect(TEMPLATE_CLASS.operator).toBe('article');
    expect(TEMPLATE_CLASS.matrix).toBe('article');
  });

  it('verse and memoir are book class', () => {
    expect(TEMPLATE_CLASS.verse).toBe('book');
    expect(TEMPLATE_CLASS.memoir).toBe('book');
  });
});
