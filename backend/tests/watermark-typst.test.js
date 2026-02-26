'use strict';

const { generateTypstWatermarkPreamble } = require('../watermark-typst');

describe('generateTypstWatermarkPreamble', () => {
  let output;

  beforeAll(() => {
    output = generateTypstWatermarkPreamble();
  });

  test('returns a non-empty string', () => {
    expect(typeof output).toBe('string');
    expect(output.length).toBeGreaterThan(0);
  });

  test('defines pp-wm-color with transparentize', () => {
    expect(output).toContain('#let pp-wm-color');
    expect(output).toContain('luma(180)');
    expect(output).toContain('transparentize(0.93)');
  });

  test('defines pp-watermark-tile function', () => {
    expect(output).toContain('#let pp-watermark-tile()');
  });

  test('sets page background', () => {
    expect(output).toContain('#set page(background:');
  });

  test('uses correct grid dimensions (6 columns, 8 rows)', () => {
    expect(output).toContain('columns: 6');
    expect(output).toContain('rows: 8');
  });

  test('generates 48 tiles via range(48)', () => {
    expect(output).toContain('range(48)');
  });

  test('applies 30-degree rotation', () => {
    expect(output).toContain('rotate(30deg');
  });

  test('uses correct tile spacing (2.4 inches)', () => {
    expect(output).toContain('column-gutter: 2.4in');
    expect(output).toContain('row-gutter: 2.4in');
  });

  test('contains watermark text content', () => {
    expect(output).toContain('PAGE');
    expect(output).toContain('PERFECT');
  });

  test('uses Latin Modern Sans font', () => {
    expect(output).toContain('Latin Modern Sans');
  });

  test('applies letter tracking', () => {
    expect(output).toContain('tracking: 2pt');
  });

  test('uses correct text size', () => {
    expect(output).toContain('size: 3.5pt');
  });

  test('uses pp-wm-color for fill', () => {
    expect(output).toContain('fill: pp-wm-color');
  });

  test('uses transparency ratio not percentage', () => {
    // Should be 0.93 not 93%
    expect(output).toContain('0.93');
    expect(output).not.toMatch(/transparentize\(93%\)/);
  });
});
