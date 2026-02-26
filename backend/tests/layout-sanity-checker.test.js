'use strict';

const {
  analyzeTypstLayout,
  analyzeLatexLayout,
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
});

describe('analyzeLatexLayout', () => {
  test('returns grade A for empty log', () => {
    const result = analyzeLatexLayout('');
    expect(result.issues).toHaveLength(0);
    expect(result.grade).toBe('A');
  });

  test('returns grade A for null log', () => {
    const result = analyzeLatexLayout(null);
    expect(result.grade).toBe('A');
  });

  test('detects overfull hbox with severity based on amount', () => {
    const log = 'Overfull \\hbox (15.5pt too wide) in paragraph';
    const result = analyzeLatexLayout(log);
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0].category).toBe(CATEGORY.OVERFULL);
    expect(result.issues[0].severity).toBe(SEVERITY.WARNING);
    expect(result.issues[0].excess).toBeCloseTo(15.5);
  });

  test('small overfull hbox is info severity', () => {
    const log = 'Overfull \\hbox (3.2pt too wide)';
    const result = analyzeLatexLayout(log);
    expect(result.issues[0].severity).toBe(SEVERITY.INFO);
  });

  test('detects underfull hbox with high badness', () => {
    const log = 'Underfull \\hbox (badness 10000)';
    const result = analyzeLatexLayout(log);
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0].category).toBe(CATEGORY.UNDERFULL);
    expect(result.issues[0].severity).toBe(SEVERITY.WARNING);
    expect(result.issues[0].badness).toBe(10000);
  });

  test('ignores underfull hbox with low badness', () => {
    const log = 'Underfull \\hbox (badness 3000)';
    const result = analyzeLatexLayout(log);
    expect(result.issues).toHaveLength(0);
  });

  test('underfull hbox 5000-9999 is info severity', () => {
    const log = 'Underfull \\hbox (badness 6000)';
    const result = analyzeLatexLayout(log);
    expect(result.issues[0].severity).toBe(SEVERITY.INFO);
  });

  test('detects underfull vbox as short_page', () => {
    const log = 'Underfull \\vbox (badness 10000)';
    const result = analyzeLatexLayout(log);
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0].category).toBe(CATEGORY.SHORT_PAGE);
  });

  test('ignores underfull vbox with low badness', () => {
    const log = 'Underfull \\vbox (badness 2000)';
    const result = analyzeLatexLayout(log);
    expect(result.issues).toHaveLength(0);
  });

  test('detects font warnings', () => {
    const log = 'Font Warning: Font shape not available';
    const result = analyzeLatexLayout(log);
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0].category).toBe(CATEGORY.FONT_WARNING);
  });

  test('detects missing character warnings', () => {
    const log = 'missing character: There is no X in font Y';
    const result = analyzeLatexLayout(log);
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0].category).toBe(CATEGORY.FONT_WARNING);
  });

  test('extracts LaTeX line numbers from l.123 format', () => {
    const log = 'Overfull \\hbox (20pt too wide)\nl.42 some content';
    const result = analyzeLatexLayout(log);
    expect(result.issues[0].line).toBe(42);
  });

  test('line is null when no l.NNN found', () => {
    const log = 'Overfull \\hbox (20pt too wide)';
    const result = analyzeLatexLayout(log);
    expect(result.issues[0].line).toBeNull();
  });
});

describe('grading system', () => {
  test('grade A for score >= 95', () => {
    // 1 info = -1 = 99 = A
    const result = analyzeLatexLayout('Overfull \\hbox (2pt too wide)');
    expect(result.grade).toBe('A');
  });

  test('grade B for many info-level issues', () => {
    // 10 infos = -10 = 90 = B
    const lines = Array(10).fill(null).map((_, i) => `Overfull \\hbox (${i + 1}pt too wide)`).join('\n');
    const result = analyzeLatexLayout(lines);
    expect(result.grade).toBe('B');
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
