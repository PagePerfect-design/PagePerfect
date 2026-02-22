'use strict';

const {
  escapeLatex,
  sanitizeTitle,
  sanitizeFontName,
  sanitizeColor,
  sanitizeExtensionValue,
  hasInjectionAttempt,
} = require('../latex-sanitizer');

describe('escapeLatex', () => {
  test('escapes backslash first (braces in result also get escaped)', () => {
    // \textbackslash{} → the {} braces are also LaTeX specials, so they get escaped too
    expect(escapeLatex('\\')).toBe('\\textbackslash\\{\\}');
  });

  test('escapes all LaTeX special characters', () => {
    expect(escapeLatex('$')).toBe('\\$');
    expect(escapeLatex('&')).toBe('\\&');
    expect(escapeLatex('%')).toBe('\\%');
    expect(escapeLatex('#')).toBe('\\#');
    expect(escapeLatex('_')).toBe('\\_');
    expect(escapeLatex('{')).toBe('\\{');
    expect(escapeLatex('}')).toBe('\\}');
    // ~ and ^ produce \textasciitilde{} / \textasciicircum{} but the {} get escaped too
    expect(escapeLatex('~')).toBe('\\textasciitilde\\{\\}');
    expect(escapeLatex('^')).toBe('\\textasciicircum\\{\\}');
    // |, <, > replacements happen AFTER {/} escaping, so their braces stay intact
    expect(escapeLatex('|')).toBe('\\textbar{}');
    expect(escapeLatex('<')).toBe('\\textless{}');
    expect(escapeLatex('>')).toBe('\\textgreater{}');
  });

  test('handles mixed content', () => {
    expect(escapeLatex('Price: $100 & tax')).toBe('Price: \\$100 \\& tax');
  });

  test('returns empty string for non-string input', () => {
    expect(escapeLatex(null)).toBe('');
    expect(escapeLatex(undefined)).toBe('');
    expect(escapeLatex(42)).toBe('');
  });

  test('preserves safe characters', () => {
    expect(escapeLatex('Hello World')).toBe('Hello World');
    expect(escapeLatex('Chapter 1: Introduction')).toBe('Chapter 1: Introduction');
  });
});

describe('sanitizeTitle', () => {
  test('returns Manuscript for empty/null input', () => {
    expect(sanitizeTitle('')).toBe('Manuscript');
    expect(sanitizeTitle('   ')).toBe('Manuscript');
    expect(sanitizeTitle(null)).toBe('Manuscript');
    expect(sanitizeTitle(undefined)).toBe('Manuscript');
  });

  test('strips newlines and tabs', () => {
    expect(sanitizeTitle('My\nBook\tTitle')).toBe('My Book Title');
  });

  test('truncates to maxLen', () => {
    const long = 'A'.repeat(300);
    const result = sanitizeTitle(long);
    // After escaping (no special chars), should be 200 chars
    expect(result.length).toBeLessThanOrEqual(200);
  });

  test('escapes LaTeX specials in title', () => {
    expect(sanitizeTitle('My $100 Book')).toBe('My \\$100 Book');
  });

  test('trims whitespace', () => {
    expect(sanitizeTitle('  My Book  ')).toBe('My Book');
  });
});

describe('sanitizeFontName', () => {
  test('allows valid font names', () => {
    expect(sanitizeFontName('EB Garamond')).toBe('EB Garamond');
    expect(sanitizeFontName('Source Serif 4')).toBe('Source Serif 4');
    expect(sanitizeFontName('IBM Plex Mono')).toBe('IBM Plex Mono');
    expect(sanitizeFontName('Libre-Baskerville')).toBe('Libre-Baskerville');
  });

  test('rejects font names with special characters', () => {
    expect(sanitizeFontName('Font; rm -rf /')).toBeNull();
    expect(sanitizeFontName('Font\\ injection')).toBeNull();
    expect(sanitizeFontName('Font$(whoami)')).toBeNull();
    expect(sanitizeFontName('../../../etc/passwd')).toBeNull();
  });

  test('rejects names over 100 characters', () => {
    expect(sanitizeFontName('A'.repeat(101))).toBeNull();
  });

  test('returns null for non-string input', () => {
    expect(sanitizeFontName(null)).toBeNull();
    expect(sanitizeFontName(42)).toBeNull();
  });
});

describe('sanitizeColor', () => {
  test('accepts valid hex colors', () => {
    expect(sanitizeColor('#FF3333')).toBe('#FF3333');
    expect(sanitizeColor('#000000')).toBe('#000000');
    expect(sanitizeColor('#abcdef')).toBe('#abcdef');
  });

  test('rejects invalid formats', () => {
    expect(sanitizeColor('#FFF')).toBeNull();    // 3-char hex
    expect(sanitizeColor('FF3333')).toBeNull();   // missing #
    expect(sanitizeColor('#GGGGGG')).toBeNull();  // invalid hex chars
    expect(sanitizeColor('red')).toBeNull();       // named color
    expect(sanitizeColor('')).toBeNull();
    expect(sanitizeColor(null)).toBeNull();
  });
});

describe('sanitizeExtensionValue', () => {
  test('validates number type within range', () => {
    const schema = { type: 'number', min: 0, max: 100 };
    expect(sanitizeExtensionValue(50, schema)).toBe(50);
    expect(sanitizeExtensionValue('50', schema)).toBe(50);
    expect(sanitizeExtensionValue(-1, schema)).toBeNull();
    expect(sanitizeExtensionValue(101, schema)).toBeNull();
    expect(sanitizeExtensionValue('abc', schema)).toBeNull();
  });

  test('validates enum type', () => {
    const schema = { type: 'enum', options: ['left', 'center', 'right'] };
    expect(sanitizeExtensionValue('center', schema)).toBe('center');
    expect(sanitizeExtensionValue('justify', schema)).toBeNull();
  });

  test('validates color type', () => {
    const schema = { type: 'color' };
    expect(sanitizeExtensionValue('#FF3333', schema)).toBe('#FF3333');
    expect(sanitizeExtensionValue('red', schema)).toBeNull();
  });

  test('validates boolean type', () => {
    const schema = { type: 'boolean' };
    expect(sanitizeExtensionValue(true, schema)).toBe(true);
    expect(sanitizeExtensionValue(false, schema)).toBe(false);
  });

  test('rejects unknown schema types', () => {
    expect(sanitizeExtensionValue('anything', { type: 'string' })).toBeNull();
  });

  test('returns null for null schema', () => {
    expect(sanitizeExtensionValue('value', null)).toBeNull();
  });
});

describe('hasInjectionAttempt', () => {
  test('detects \\input injection', () => {
    expect(hasInjectionAttempt('\\input{/etc/passwd}')).toBe(true);
    expect(hasInjectionAttempt('\\input {secrets.tex}')).toBe(true);
  });

  test('detects \\include injection', () => {
    expect(hasInjectionAttempt('\\include{malicious}')).toBe(true);
  });

  test('detects \\write18 (shell escape)', () => {
    expect(hasInjectionAttempt('\\write18{rm -rf /}')).toBe(true);
  });

  test('detects \\immediate\\write', () => {
    expect(hasInjectionAttempt('\\immediate\\write18{cmd}')).toBe(true);
  });

  test('detects Lua injection patterns', () => {
    expect(hasInjectionAttempt('\\directlua{os.execute("whoami")}')).toBe(true);
    expect(hasInjectionAttempt('\\luaexec{os.execute("id")}')).toBe(true);
    expect(hasInjectionAttempt('\\luadirect{os.execute("ls")}')).toBe(true);
  });

  test('detects \\ShellEscape', () => {
    expect(hasInjectionAttempt('\\ShellEscape{cmd}')).toBe(true);
  });

  test('detects \\catcode manipulation', () => {
    expect(hasInjectionAttempt('\\catcode`\\@=11')).toBe(true);
  });

  test('detects \\openout / \\openin', () => {
    expect(hasInjectionAttempt('\\openout\\myfile=output.txt')).toBe(true);
    expect(hasInjectionAttempt('\\openin\\myfile=input.txt')).toBe(true);
  });

  test('returns false for safe content', () => {
    expect(hasInjectionAttempt('Hello world')).toBe(false);
    expect(hasInjectionAttempt('# Chapter 1\n\nSome text.')).toBe(false);
    expect(hasInjectionAttempt('The price is $100.')).toBe(false);
  });

  test('returns false for non-string input', () => {
    expect(hasInjectionAttempt(null)).toBe(false);
    expect(hasInjectionAttempt(undefined)).toBe(false);
    expect(hasInjectionAttempt(42)).toBe(false);
  });
});
