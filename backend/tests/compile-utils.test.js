'use strict';

const {
  sanitizeStderr,
  stripCitations,
  styleWarnings,
  parseMissingCitations,
  parseMissingPackages,
  TIER_LEVEL,
  hasTier,
} = require('../compile-utils');

describe('sanitizeStderr', () => {
  test('strips temp directory paths', () => {
    const raw = '/tmp/pp-abc123_xyz/input.tex:5: error';
    expect(sanitizeStderr(raw)).toBe('[workspace]/input.tex:5: error');
  });

  test('strips home directory paths', () => {
    const raw = '/home/ppuser/backend/templates/chicago.latex';
    expect(sanitizeStderr(raw)).toBe('[home]/backend/templates/chicago.latex');
  });

  test('strips system paths', () => {
    const raw = '/usr/local/texlive/2024/bin/lualatex';
    expect(sanitizeStderr(raw)).toBe('[system]');
  });

  test('strips template paths', () => {
    const raw = '/app/backend/templates/chicago.latex';
    expect(sanitizeStderr(raw)).toBe('[templates]/chicago.latex');
  });

  test('handles multiple substitutions in one string', () => {
    const raw = '/tmp/pp-test123/file.tex called /usr/local/bin/pandoc';
    const result = sanitizeStderr(raw);
    expect(result).not.toContain('/tmp/pp-');
    expect(result).not.toContain('/usr/local/');
  });

  test('converts non-string input to string', () => {
    expect(sanitizeStderr(null)).toBe('null');
    expect(sanitizeStderr(42)).toBe('42');
  });
});

describe('stripCitations', () => {
  test('strips bracketed citations', () => {
    expect(stripCitations('See [@Smith2020]')).toBe('See (citation)');
    expect(stripCitations('[@a; @b; @c]')).toBe('(citation)');
    expect(stripCitations('[see @key, p. 5]')).toBe('(citation)');
  });

  test('strips bare citation keys', () => {
    expect(stripCitations('According to @Smith2020')).toBe('According to Smith2020');
  });

  test('preserves regular text', () => {
    expect(stripCitations('Hello world')).toBe('Hello world');
    expect(stripCitations('email@example.com')).toBe('email@example.com');
  });
});

describe('styleWarnings', () => {
  test('detects double spaces after punctuation', () => {
    const warnings = styleWarnings('End of sentence.  Next sentence.');
    expect(warnings.length).toBe(1);
    expect(warnings[0]).toMatch(/double spaces/i);
  });

  test('returns empty array for clean text', () => {
    expect(styleWarnings('End of sentence. Next sentence.')).toEqual([]);
  });
});

describe('parseMissingCitations', () => {
  test('extracts undefined citation keys', () => {
    const stderr = "Undefined citation: 'Smith2020'\nUndefined citation: 'Jones2021'";
    const result = parseMissingCitations(stderr);
    expect(result).toContain('Smith2020');
    expect(result).toContain('Jones2021');
  });

  test('deduplicates citation keys', () => {
    const stderr = "Undefined citation: 'key1'\nUndefined citation: 'key1'";
    expect(parseMissingCitations(stderr)).toEqual(['key1']);
  });

  test('returns empty array when no missing citations', () => {
    expect(parseMissingCitations('Compilation successful')).toEqual([]);
  });
});

describe('parseMissingPackages', () => {
  test('extracts missing .sty package names', () => {
    const stderr = "LaTeX Error: File `fancyhdr.sty' not found";
    expect(parseMissingPackages(stderr)).toEqual(['fancyhdr']);
  });

  test('handles multiple missing packages', () => {
    const stderr = `
      LaTeX Error: File \`geometry.sty' not found
      LaTeX Error: File \`setspace.sty' not found
    `;
    const result = parseMissingPackages(stderr);
    expect(result).toContain('geometry');
    expect(result).toContain('setspace');
  });

  test('returns empty array when no missing packages', () => {
    expect(parseMissingPackages('Success')).toEqual([]);
  });
});

describe('hasTier', () => {
  test('anonymous < drafter < publisher < studio', () => {
    expect(hasTier('anonymous', 'drafter')).toBe(false);
    expect(hasTier('drafter', 'drafter')).toBe(true);
    expect(hasTier('drafter', 'publisher')).toBe(false);
    expect(hasTier('publisher', 'publisher')).toBe(true);
    expect(hasTier('publisher', 'studio')).toBe(false);
    expect(hasTier('studio', 'studio')).toBe(true);
    expect(hasTier('studio', 'drafter')).toBe(true);
    expect(hasTier('studio', 'publisher')).toBe(true);
  });

  test('unknown tiers default to level 0', () => {
    expect(hasTier('unknown', 'drafter')).toBe(false);
    expect(hasTier('drafter', 'unknown')).toBe(true);
  });
});

describe('TIER_LEVEL', () => {
  test('has correct hierarchy', () => {
    expect(TIER_LEVEL.anonymous).toBe(0);
    expect(TIER_LEVEL.drafter).toBe(1);
    expect(TIER_LEVEL.publisher).toBe(2);
    expect(TIER_LEVEL.studio).toBe(3);
  });
});
