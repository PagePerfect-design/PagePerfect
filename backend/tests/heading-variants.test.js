const {
  getVariantPreamble,
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

// ================================================================
// getVariantPreamble
// ================================================================

describe('getVariantPreamble', () => {
  // Classic variant
  it('returns empty string for classic variant', () => {
    expect(getVariantPreamble('symphony', 'classic')).toBe('');
    expect(getVariantPreamble('chronicle', 'classic')).toBe('');
  });

  it('returns empty string for null variant', () => {
    expect(getVariantPreamble('symphony', null)).toBe('');
    expect(getVariantPreamble('symphony', undefined)).toBe('');
  });

  it('returns empty string for unknown variant', () => {
    expect(getVariantPreamble('symphony', 'unknown')).toBe('');
  });

  // Modern variant — book class
  it('returns book modern preamble for book-class templates', () => {
    const preamble = getVariantPreamble('symphony', 'modern');
    expect(preamble).toContain('Heading Variant: Modern');
    expect(preamble).toContain('\\titleformat{\\chapter}');
    expect(preamble).toContain('LetterSpace');
  });

  it('returns book modern for all book-class templates', () => {
    const bookTemplates = Object.entries(TEMPLATE_CLASS).filter(([, c]) => c === 'book').map(([k]) => k);
    for (const t of bookTemplates) {
      const preamble = getVariantPreamble(t, 'modern');
      expect(preamble).toContain('\\titleformat{\\chapter}');
    }
  });

  // Modern variant — article class
  it('returns article modern preamble for article-class templates', () => {
    const preamble = getVariantPreamble('chronicle', 'modern');
    expect(preamble).toContain('Heading Variant: Modern');
    expect(preamble).toContain('\\titleformat{\\section}');
    expect(preamble).not.toContain('\\titleformat{\\chapter}');
  });

  // Bold variant — book class
  it('returns book bold preamble for book-class templates', () => {
    const preamble = getVariantPreamble('paperback', 'bold');
    expect(preamble).toContain('Heading Variant: Bold');
    expect(preamble).toContain('\\titleformat{\\chapter}');
    expect(preamble).toContain('96pt'); // oversized chapter numbers
    expect(preamble).toContain('\\rule{\\textwidth}');
  });

  // Bold variant — article class
  it('returns article bold preamble for article-class templates', () => {
    const preamble = getVariantPreamble('operator', 'bold');
    expect(preamble).toContain('Heading Variant: Bold');
    expect(preamble).toContain('\\titleformat{\\section}');
    expect(preamble).toContain('\\rule{\\textwidth}');
    expect(preamble).not.toContain('\\titleformat{\\chapter}');
  });

  // Unknown template
  it('defaults to article class for unknown template', () => {
    const preamble = getVariantPreamble('nonexistent', 'modern');
    // Should return article modern (no chapter commands)
    expect(preamble).not.toContain('\\titleformat{\\chapter}');
    expect(preamble).toContain('\\titleformat{\\section}');
  });

  // All variants include proper LaTeX commands
  it('modern variant includes section and subsection formatting', () => {
    const bookModern = getVariantPreamble('symphony', 'modern');
    expect(bookModern).toContain('\\titleformat{\\section}');
    expect(bookModern).toContain('\\titleformat{\\subsection}');
    expect(bookModern).toContain('\\titleformat{\\subsubsection}');
  });

  it('bold variant includes spacing commands', () => {
    const bookBold = getVariantPreamble('symphony', 'bold');
    expect(bookBold).toContain('\\titlespacing');
  });

  // Modern variant defines hv@grey color
  it('modern variant defines grey color', () => {
    const preamble = getVariantPreamble('symphony', 'modern');
    expect(preamble).toContain('\\definecolor{hv@grey}');
  });

  // Bold variant defines hv@ghost color
  it('bold variant defines ghost color', () => {
    const preamble = getVariantPreamble('symphony', 'bold');
    expect(preamble).toContain('\\definecolor{hv@ghost}');
  });
});
