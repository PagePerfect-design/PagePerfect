'use strict';

const { getDropCapPreamble, DROP_CAP_TEMPLATES } = require('../drop-cap-typst');

describe('DROP_CAP_TEMPLATES', () => {
  test('includes paperback, memoir, symphony', () => {
    expect(DROP_CAP_TEMPLATES.has('paperback')).toBe(true);
    expect(DROP_CAP_TEMPLATES.has('memoir')).toBe(true);
    expect(DROP_CAP_TEMPLATES.has('symphony')).toBe(true);
  });

  test('does not include non-fiction templates', () => {
    expect(DROP_CAP_TEMPLATES.has('thesis')).toBe(false);
    expect(DROP_CAP_TEMPLATES.has('operator')).toBe(false);
    expect(DROP_CAP_TEMPLATES.has('minimal')).toBe(false);
  });
});

describe('getDropCapPreamble', () => {
  test('returns empty string for non-fiction templates', () => {
    expect(getDropCapPreamble('thesis')).toBe('');
    expect(getDropCapPreamble('operator')).toBe('');
    expect(getDropCapPreamble('chronicle')).toBe('');
    expect(getDropCapPreamble('minimal')).toBe('');
  });

  test('returns Typst code for paperback', () => {
    const result = getDropCapPreamble('paperback');
    expect(result).toContain('#let _pp-drop-cap-pending');
    expect(result).toContain('#show heading.where(level: 1)');
    expect(result).toContain('#show par');
    expect(result).toContain('state("pp-drop-cap"');
  });

  test('returns Typst code for memoir', () => {
    const result = getDropCapPreamble('memoir');
    expect(result.length).toBeGreaterThan(100);
    expect(result).toContain('Drop Caps');
  });

  test('returns Typst code for symphony', () => {
    const result = getDropCapPreamble('symphony');
    expect(result).toContain('#show par');
  });

  test('defaults to 3-line drop cap height', () => {
    const result = getDropCapPreamble('paperback');
    expect(result).toContain('3em');
  });

  test('respects custom lines option', () => {
    const result = getDropCapPreamble('paperback', { lines: 4 });
    expect(result).toContain('4em');
    expect(result).not.toContain('3em');
  });

  test('includes font override when specified', () => {
    const result = getDropCapPreamble('paperback', { font: 'EB Garamond' });
    expect(result).toContain('font: "EB Garamond"');
  });

  test('omits font override when not specified', () => {
    const result = getDropCapPreamble('paperback');
    expect(result).not.toContain('font:');
  });

  test('uses state() for tracking heading state', () => {
    const result = getDropCapPreamble('paperback');
    expect(result).toContain('_pp-drop-cap-pending.update(true)');
    expect(result).toContain('_pp-drop-cap-pending.update(false)');
    expect(result).toContain('_pp-drop-cap-pending.get()');
  });

  test('sets first-line-indent to 0pt for drop cap paragraph', () => {
    const result = getDropCapPreamble('paperback');
    expect(result).toContain('first-line-indent: 0pt');
  });

  test('handles unknown template gracefully', () => {
    expect(getDropCapPreamble('nonexistent')).toBe('');
    expect(getDropCapPreamble('')).toBe('');
    expect(getDropCapPreamble(undefined)).toBe('');
  });
});
