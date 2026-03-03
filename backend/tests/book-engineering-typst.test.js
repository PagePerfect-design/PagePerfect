'use strict';

const {
  generateTypstEngineeringPreamble,
  analyzeTypstCompileLog,
  ENGINEERING_POLICIES,
} = require('../book-engineering');

describe('generateTypstEngineeringPreamble', () => {
  test('contains engineering system comment', () => {
    const result = generateTypstEngineeringPreamble('academic');
    expect(result).toContain('Book Engineering System');
  });

  // The Typst preamble deliberately does NOT emit justify or hyphenation
  // rules. Every template already sets both explicitly, and the preamble
  // comes after the template in assembly order — emitting them here would
  // override the template's intentional choices (exhibit, cinema, verse, etc.)

  test('does not emit justify rules (template is the authority)', () => {
    for (const type of Object.keys(ENGINEERING_POLICIES)) {
      const result = generateTypstEngineeringPreamble(type);
      expect(result).not.toContain('#set par(justify:');
    }
  });

  test('does not emit hyphenation rules (template is the authority)', () => {
    for (const type of Object.keys(ENGINEERING_POLICIES)) {
      const result = generateTypstEngineeringPreamble(type);
      expect(result).not.toContain('#set text(hyphenate:');
    }
  });

  test('overrides do not reintroduce justify/hyphenation', () => {
    const result = generateTypstEngineeringPreamble('academic', { raggedRight: true, hyphenPenalty: 10000 });
    expect(result).not.toContain('#set par(justify:');
    expect(result).not.toContain('#set text(hyphenate:');
  });

  test('unknown template falls back to academic policy', () => {
    const result = generateTypstEngineeringPreamble('nonexistent');
    const academic = generateTypstEngineeringPreamble('academic');
    expect(result).toBe(academic);
  });

  test('all template types produce valid output (comment only)', () => {
    for (const type of Object.keys(ENGINEERING_POLICIES)) {
      const result = generateTypstEngineeringPreamble(type);
      expect(result).toContain('Book Engineering System');
      expect(typeof result).toBe('string');
    }
  });

  test('does not contain LaTeX commands', () => {
    const result = generateTypstEngineeringPreamble('academic');
    expect(result).not.toContain('\\widowpenalty');
    expect(result).not.toContain('\\clubpenalty');
    expect(result).not.toContain('\\hyphenpenalty');
  });
});

describe('analyzeTypstCompileLog', () => {
  test('returns empty result for null input', () => {
    const result = analyzeTypstCompileLog(null);
    expect(result.overfullBoxes).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
  });

  test('returns empty result for empty string', () => {
    const result = analyzeTypstCompileLog('');
    expect(result.overfullBoxes).toHaveLength(0);
  });

  test('returns empty result for non-string input', () => {
    const result = analyzeTypstCompileLog(42);
    expect(result.overfullBoxes).toHaveLength(0);
  });

  test('detects "content does not fit" as overfull', () => {
    const result = analyzeTypstCompileLog('warning: content does not fit on the page');
    expect(result.overfullBoxes.length).toBeGreaterThanOrEqual(1);
    expect(result.overfullBoxes[0].severity).toBe('warn');
  });

  test('detects "out of bounds" as overfull', () => {
    const result = analyzeTypstCompileLog('error: element out of page bounds');
    expect(result.overfullBoxes.length).toBeGreaterThanOrEqual(1);
  });

  test('detects warning lines', () => {
    const result = analyzeTypstCompileLog('warning: something happened');
    expect(result.warnings.length).toBeGreaterThanOrEqual(1);
    expect(result.warnings[0].severity).toBe('warn');
  });

  test('detects unknown font warnings', () => {
    const result = analyzeTypstCompileLog('error: unknown font family: Missing Font');
    expect(result.warnings.length).toBeGreaterThanOrEqual(1);
  });

  test('detects font not found warnings', () => {
    const result = analyzeTypstCompileLog('warning: font "X" not found on system');
    expect(result.warnings.length).toBeGreaterThanOrEqual(1);
  });

  test('result has all expected fields', () => {
    const result = analyzeTypstCompileLog('');
    expect(result).toHaveProperty('overfullBoxes');
    expect(result).toHaveProperty('underfullBoxes');
    expect(result).toHaveProperty('warnings');
    expect(result).toHaveProperty('pageBreakIssues');
    expect(result).toHaveProperty('floatIssues');
    expect(result).toHaveProperty('footnoteIssues');
  });

  test('handles multi-line stderr', () => {
    const stderr = [
      'warning: content does not fit',
      'info: compilation took 1.2s',
      'warning: unknown font family: Foo',
    ].join('\n');
    const result = analyzeTypstCompileLog(stderr);
    expect(result.overfullBoxes.length).toBeGreaterThanOrEqual(1);
    expect(result.warnings.length).toBeGreaterThanOrEqual(1);
  });
});
