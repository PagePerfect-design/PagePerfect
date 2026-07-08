'use strict';

const { translateStderr, translateCompileFailure } = require('../typst-error-translator');

describe('translateStderr', () => {
  test('returns empty result for null/undefined input', () => {
    expect(translateStderr(null)).toEqual({ errors: [], warnings: [], summary: { total: 0, critical: 0, cosmetic: 0 } });
    expect(translateStderr(undefined)).toEqual({ errors: [], warnings: [], summary: { total: 0, critical: 0, cosmetic: 0 } });
    expect(translateStderr('')).toEqual({ errors: [], warnings: [], summary: { total: 0, critical: 0, cosmetic: 0 } });
  });

  test('returns empty result for non-string input', () => {
    expect(translateStderr(42)).toEqual({ errors: [], warnings: [], summary: { total: 0, critical: 0, cosmetic: 0 } });
  });

  test('parses a single error line with file/line/column', () => {
    const stderr = 'error: template.typ:12:5: unknown variable: foo';
    const result = translateStderr(stderr);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toBe('unknown variable: foo');
    expect(result.errors[0].severity).toBe('error');
    expect(result.errors[0].file).toBe('template.typ');
    expect(result.errors[0].line).toBe(12);
    expect(result.errors[0].column).toBe(5);
    expect(result.errors[0].category).toBe('syntax');
    expect(result.warnings).toHaveLength(0);
  });

  test('parses a warning line', () => {
    const stderr = 'warning: template.typ:30:1: content does not fit';
    const result = translateStderr(stderr);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0].message).toBe('content does not fit');
    expect(result.warnings[0].severity).toBe('warn');
    expect(result.warnings[0].category).toBe('layout');
    expect(result.errors).toHaveLength(0);
  });

  test('parses multiple errors and warnings', () => {
    const stderr = [
      'error: template.typ:5:1: unknown font family: Foobar',
      'warning: template.typ:10:1: glyph missing',
      'error: template.typ:20:3: expected closing bracket',
    ].join('\n');
    const result = translateStderr(stderr);
    expect(result.errors).toHaveLength(2);
    expect(result.warnings).toHaveLength(1);
    expect(result.summary.total).toBe(3);
    expect(result.summary.critical).toBe(2);
    expect(result.summary.cosmetic).toBe(1);
  });

  test('deduplicates by message', () => {
    const stderr = [
      'error: a.typ:1:1: unknown variable: x',
      'error: b.typ:2:1: unknown variable: x',
    ].join('\n');
    const result = translateStderr(stderr);
    expect(result.errors).toHaveLength(1);
  });

  test('classifies font errors', () => {
    const stderr = 'error: input.typ:1:1: unknown font family: Missing';
    const result = translateStderr(stderr);
    expect(result.errors[0].category).toBe('font');
    expect(result.errors[0].fix).toContain('font');
  });

  test('classifies file-not-found errors', () => {
    const stderr = 'error: input.typ:1:1: file not found: image.png';
    const result = translateStderr(stderr);
    expect(result.errors[0].category).toBe('file');
  });

  test('classifies image errors', () => {
    const stderr = 'error: input.typ:1:1: failed to decode image';
    const result = translateStderr(stderr);
    expect(result.errors[0].category).toBe('image');
  });

  test('classifies layout errors', () => {
    const stderr = 'error: input.typ:1:1: content overflow detected';
    const result = translateStderr(stderr);
    expect(result.errors[0].category).toBe('layout');
  });

  test('classifies unknown errors', () => {
    // "expected" triggers 'syntax', so use a message with no category keywords
    const stderr = 'error: input.typ:1:1: some obscure crash occurred';
    const result = translateStderr(stderr);
    expect(result.errors[0].category).toBe('unknown');
  });

  test('skips non-error/warning lines', () => {
    const stderr = 'info: compilation complete\nsome random output\n';
    const result = translateStderr(stderr);
    expect(result.errors).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
  });

  test('truncates raw field to 200 chars', () => {
    const longMsg = 'x'.repeat(300);
    const stderr = `error: file.typ:1:1: ${longMsg}`;
    const result = translateStderr(stderr);
    expect(result.errors[0].raw.length).toBeLessThanOrEqual(200);
  });

  test('handles error without file location', () => {
    const stderr = 'error: panicked at something';
    const result = translateStderr(stderr);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].file).toBeNull();
    expect(result.errors[0].line).toBeNull();
  });

  test('summary counts serverErrors and clientErrors', () => {
    const stderr = 'error: input.typ:1:1: unknown variable: x';
    const result = translateStderr(stderr);
    // 'syntax' category is not a server error
    expect(result.summary.serverErrors).toBe(0);
    expect(result.summary.clientErrors).toBe(1);
  });

  describe('engine_internal classification', () => {
    test('classifies "text does not have field children" as engine_internal', () => {
      const result = translateStderr('error: text does not have field "children"');
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].category).toBe('engine_internal');
      expect(result.errors[0].fix).toMatch(/different template/i);
      expect(result.errors[0].isServerError).toBe(true);
    });

    test('classifies "cannot access field X" as engine_internal', () => {
      const result = translateStderr('error: cannot access field "headings" on type content');
      expect(result.errors[0].category).toBe('engine_internal');
    });

    test('classifies "is not callable" as engine_internal', () => {
      const result = translateStderr('error: foo is not callable');
      expect(result.errors[0].category).toBe('engine_internal');
    });

    test('classifies "panicked" runtime errors as engine_internal', () => {
      const result = translateStderr('error: panicked at unwrap on None');
      expect(result.errors[0].category).toBe('engine_internal');
    });

    test('summary counts engine_internal as serverError', () => {
      const result = translateStderr('error: text does not have field "children"');
      expect(result.summary.serverErrors).toBe(1);
      expect(result.summary.clientErrors).toBe(0);
    });

    test('engine_internal fix steers user to a different template', () => {
      const result = translateStderr('error: type mismatch');
      expect(result.errors[0].fix).toMatch(/paperback|chronicle|exhibit/i);
      // Critically: NOT the opaque "simplify your manuscript" fallback
      expect(result.errors[0].fix).not.toMatch(/simplify/i);
    });

    test('classifies "expected ratio, found float" as engine_internal, not a manuscript issue', () => {
      // The free-tier watermark once emitted transparentize(0.93) — a bare
      // float where Typst wanted a ratio ("expected ratio, found float"),
      // which broke every free-tier download (PR #226). The old classifier
      // matched the bare word "expected", called it 'syntax', and told users
      // to "check your manuscript for special characters" — misdirection: this
      // is a template/engine type bug the user cannot fix in their Markdown.
      const result = translateStderr('error: watermark.typ:5:30: expected ratio, found float');
      expect(result.errors[0].category).toBe('engine_internal');
      expect(result.errors[0].isServerError).toBe(true);
      // Not the old syntax misdirection; steer to a different template instead.
      expect(result.errors[0].fix).not.toMatch(/special characters/i);
      expect(result.errors[0].fix).toMatch(/different template/i);
    });

    test('classifies generic Typst type mismatches (expected X, found Y) as engine_internal', () => {
      // The "expected <type>, found <type>" shape is a Typst runtime type
      // error — always template/engine territory, never user input.
      expect(translateStderr('error: t.typ:1:1: expected integer, found string').errors[0].category).toBe('engine_internal');
      expect(translateStderr('error: t.typ:1:1: expected sequence, found content').errors[0].category).toBe('engine_internal');
    });

    test('does NOT misclassify parse-syntax expectations as engine_internal', () => {
      // "expected closing bracket" is a genuine syntax expectation with no
      // ", found <type>" — it must stay 'syntax', not get swept into the
      // type-mismatch bucket.
      const result = translateStderr('error: t.typ:1:1: expected closing bracket');
      expect(result.errors[0].category).toBe('syntax');
    });
  });
});

describe('translateCompileFailure', () => {
  test('handles compile_timeout error code', () => {
    const result = translateCompileFailure('', { errorCode: 'compile_timeout' });
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toContain('timed out');
    expect(result.errors[0].category).toBe('timeout');
    expect(result.errors[0].isServerError).toBe(false);
  });

  test('handles spawn_failed error code', () => {
    const result = translateCompileFailure('', { errorCode: 'spawn_failed' });
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toContain('failed to start');
    expect(result.errors[0].category).toBe('server');
    expect(result.errors[0].isServerError).toBe(true);
  });

  test('combines error code and stderr errors', () => {
    const result = translateCompileFailure(
      'error: file.typ:1:1: unknown variable: z',
      { errorCode: 'compile_timeout' }
    );
    expect(result.errors).toHaveLength(2);
  });

  test('provides fallback when no errors found', () => {
    const result = translateCompileFailure('');
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toContain('Typesetting failed');
    expect(result.errors[0].category).toBe('unknown');
  });

  test('builds fallback message from all errors', () => {
    const result = translateCompileFailure('error: file.typ:1:1: bad thing');
    expect(result.fallbackMessage).toContain('bad thing');
    expect(result.fallbackMessage.endsWith('.')).toBe(true);
  });

  test('handles null stderr gracefully', () => {
    const result = translateCompileFailure(null);
    expect(result.errors).toHaveLength(1);
    expect(result.fallbackMessage).toContain('Typesetting failed');
  });
});
