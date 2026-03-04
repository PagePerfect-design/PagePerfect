'use strict';

const {
  analyzeTypstLayout,
  SEVERITY,
  CATEGORY,
} = require('../layout-sanity-checker');

describe('constants', () => {
  test('SEVERITY has info, warning, error', () => {
    expect(SEVERITY.INFO).toBe('info');
    expect(SEVERITY.WARNING).toBe('warning');
    expect(SEVERITY.ERROR).toBe('error');
  });

  test('CATEGORY has all expected categories', () => {
    expect(CATEGORY.WIDOW).toBe('widow');
    expect(CATEGORY.ORPHAN).toBe('orphan');
    expect(CATEGORY.OVERFULL).toBe('overfull');
    expect(CATEGORY.UNDERFULL).toBe('underfull');
    expect(CATEGORY.SHORT_PAGE).toBe('short_page');
    expect(CATEGORY.FONT_WARNING).toBe('font_warning');
    expect(CATEGORY.IMAGE).toBe('image');
    expect(CATEGORY.REFERENCE).toBe('reference');
  });
});

describe('analyzeTypstLayout', () => {
  test('returns grade A for empty stderr', () => {
    const result = analyzeTypstLayout('');
    expect(result.issues).toHaveLength(0);
    expect(result.grade).toBe('A');
    expect(result.summary).toContain('No layout warnings');
  });

  test('returns grade A for null stderr', () => {
    const result = analyzeTypstLayout(null);
    expect(result.grade).toBe('A');
  });

  test('detects content overflow warning', () => {
    const result = analyzeTypstLayout('warning: content does not fit within the page');
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0].category).toBe(CATEGORY.OVERFULL);
    expect(result.issues[0].severity).toBe(SEVERITY.WARNING);
    expect(result.issues[0].fix).toBeTruthy();
  });

  test('detects layout convergence failure', () => {
    const result = analyzeTypstLayout('warning: layout did not converge within 5 iterations');
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0].category).toBe(CATEGORY.OVERFULL);
  });

  test('detects missing glyph warning', () => {
    const result = analyzeTypstLayout('warning: missing glyph for character U+1234');
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0].category).toBe(CATEGORY.FONT_WARNING);
  });

  test('detects "font does not contain" warning', () => {
    const result = analyzeTypstLayout('warning: font "Arial" does not contain glyph for X');
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0].category).toBe(CATEGORY.FONT_WARNING);
  });

  test('detects "could not fit all content" as error severity', () => {
    const result = analyzeTypstLayout('error: could not fit all content onto the pages');
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0].severity).toBe(SEVERITY.ERROR);
  });

  test('extracts Typst line numbers from file.typ:12:5 format', () => {
    const result = analyzeTypstLayout('warning: template.typ:42:5: content does not fit');
    expect(result.issues[0].line).toBe(42);
  });

  test('line is null when no file reference', () => {
    const result = analyzeTypstLayout('warning: content does not fit');
    expect(result.issues[0].line).toBeNull();
  });

  test('includes template name in summary when provided', () => {
    const result = analyzeTypstLayout('warning: content does not fit', { template: 'symphony' });
    expect(result.summary).toContain('symphony');
  });

  test('summary shows issue counts', () => {
    const stderr = [
      'warning: content does not fit',
      'warning: missing glyph for X',
    ].join('\n');
    const result = analyzeTypstLayout(stderr);
    expect(result.summary).toContain('2 warning');
  });

  test('grades degrade with more issues', () => {
    // 4 warnings = -20 points = 80 = C
    const lines = Array(4).fill('warning: content does not fit at different locations').map((m, i) => m + ` ${i}`);
    const result = analyzeTypstLayout(lines.join('\n'));
    expect(['B', 'C']).toContain(result.grade);
  });

  test('detects "out of bounds" as overfull error', () => {
    const result = analyzeTypstLayout('error: element out of page bounds');
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0].category).toBe(CATEGORY.OVERFULL);
    expect(result.issues[0].severity).toBe(SEVERITY.ERROR);
  });

  test('detects "unknown font family" as font warning', () => {
    const result = analyzeTypstLayout('error: unknown font family: Missing Font');
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0].category).toBe(CATEGORY.FONT_WARNING);
  });

  test('detects "font not found" as font warning', () => {
    const result = analyzeTypstLayout('warning: font "Arial" not found on system');
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0].category).toBe(CATEGORY.FONT_WARNING);
  });

  test('detects "file not found" as image error', () => {
    const result = analyzeTypstLayout('error: file not found: image.png');
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0].category).toBe(CATEGORY.IMAGE);
    expect(result.issues[0].severity).toBe(SEVERITY.ERROR);
  });

  test('detects "failed to decode image" as image error', () => {
    const result = analyzeTypstLayout('error: failed to decode image data.jpg');
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0].category).toBe(CATEGORY.IMAGE);
  });

  test('detects "undefined label" as reference warning', () => {
    const result = analyzeTypstLayout('warning: undefined label <my-label>');
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0].category).toBe(CATEGORY.REFERENCE);
    expect(result.issues[0].severity).toBe(SEVERITY.WARNING);
  });

  test('detects "undefined reference" as reference warning', () => {
    const result = analyzeTypstLayout('warning: undefined reference to section 3');
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0].category).toBe(CATEGORY.REFERENCE);
  });

  test('handles mixed Typst warnings correctly', () => {
    const stderr = [
      'warning: content does not fit on page',
      'error: file not found: hero.png',
      'warning: unknown font family: Futura',
      'warning: undefined label <ch1>',
      'info: compilation took 0.5s',
    ].join('\n');
    const result = analyzeTypstLayout(stderr);
    expect(result.issues).toHaveLength(4);
    expect(result.issues.map(i => i.category)).toEqual([
      CATEGORY.OVERFULL, CATEGORY.IMAGE, CATEGORY.FONT_WARNING, CATEGORY.REFERENCE
    ]);
  });

  test('extracts line numbers from :LINE:COL: format', () => {
    const result = analyzeTypstLayout('warning: input:99:3: content does not fit');
    expect(result.issues[0].line).toBe(99);
  });
});

describe('grading system', () => {
  test('grade A for single info-level issue', () => {
    // 1 warning = -5 = 95 = A
    const result = analyzeTypstLayout('warning: content does not fit on one spot');
    expect(result.grade).toBe('A');
  });

  test('grade degrades with errors', () => {
    // Each ERROR = -15, so 2 errors = -30 = 70 = C
    const stderr = [
      'error: could not fit all content part 1',
      'error: could not fit all content part 2',
    ].join('\n');
    const result = analyzeTypstLayout(stderr);
    expect(['C', 'D']).toContain(result.grade);
  });
});
