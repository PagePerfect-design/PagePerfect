const {
  KDP_TRIM_SIZES,
  PAPER_STOCK,
  kdpGutter,
  spineWidth,
  preflight,
  coverDimensions,
} = require('../publishing');

// Mock grid system for preflight tests
const mockGridSystem = {
  calculateTypstMargins: (pageSize, marginPreset, template) => {
    // Return a realistic Typst geometry string based on presets
    const margins = { minimal: 12, compact: 15, narrow: 18, normal: 22, wide: 26, academic: 30, generous: 34 };
    const m = margins[marginPreset] || 22;
    return `#set page(width: 6in, height: 9in, margin: ${m}mm)`;
  },
};

// ================================================================
// KDP_TRIM_SIZES
// ================================================================

describe('KDP_TRIM_SIZES', () => {
  it('has 19 page sizes', () => {
    expect(Object.keys(KDP_TRIM_SIZES).length).toBe(19);
  });

  it('every size has width, height, and label', () => {
    for (const [key, size] of Object.entries(KDP_TRIM_SIZES)) {
      expect(typeof size.w).toBe('number');
      expect(typeof size.h).toBe('number');
      expect(typeof size.label).toBe('string');
      expect(size.w).toBeGreaterThan(0);
      expect(size.h).toBeGreaterThan(0);
      expect(size.h).toBeGreaterThan(size.w); // portrait orientation
    }
  });

  it('includes standard KDP sizes', () => {
    expect(KDP_TRIM_SIZES).toHaveProperty('amazonFiveByEight');
    expect(KDP_TRIM_SIZES).toHaveProperty('amazonSixByNine');
    expect(KDP_TRIM_SIZES).toHaveProperty('amazonSevenByTen');
  });

  it('includes international sizes', () => {
    expect(KDP_TRIM_SIZES).toHaveProperty('a4');
    expect(KDP_TRIM_SIZES).toHaveProperty('a5');
    expect(KDP_TRIM_SIZES).toHaveProperty('b5');
  });
});

// ================================================================
// PAPER_STOCK
// ================================================================

describe('PAPER_STOCK', () => {
  it('has white and cream stocks', () => {
    expect(PAPER_STOCK).toHaveProperty('white');
    expect(PAPER_STOCK).toHaveProperty('cream');
  });

  it('cream is thicker than white', () => {
    expect(PAPER_STOCK.cream.factor).toBeGreaterThan(PAPER_STOCK.white.factor);
  });
});

// ================================================================
// kdpGutter
// ================================================================

describe('kdpGutter', () => {
  it('returns 0.375" for books ≤150 pages', () => {
    expect(kdpGutter(100)).toBe(0.375);
    expect(kdpGutter(150)).toBe(0.375);
  });

  it('returns 0.5" for 151-300 pages', () => {
    expect(kdpGutter(151)).toBe(0.5);
    expect(kdpGutter(300)).toBe(0.5);
  });

  it('returns 0.625" for 301-500 pages', () => {
    expect(kdpGutter(301)).toBe(0.625);
    expect(kdpGutter(500)).toBe(0.625);
  });

  it('returns 0.75" for >500 pages', () => {
    expect(kdpGutter(501)).toBe(0.75);
    expect(kdpGutter(800)).toBe(0.75);
  });
});

// ================================================================
// spineWidth
// ================================================================

describe('spineWidth', () => {
  it('calculates spine for white paper', () => {
    const spine = spineWidth(200, 'white');
    expect(spine).toBeCloseTo(200 * 0.002252, 3);
  });

  it('calculates spine for cream paper', () => {
    const spine = spineWidth(200, 'cream');
    expect(spine).toBeCloseTo(200 * 0.0025, 3);
  });

  it('cream spine is wider than white for same page count', () => {
    expect(spineWidth(200, 'cream')).toBeGreaterThan(spineWidth(200, 'white'));
  });

  it('scales linearly with page count', () => {
    const s100 = spineWidth(100, 'white');
    const s200 = spineWidth(200, 'white');
    expect(s200).toBeCloseTo(s100 * 2, 3);
  });

  it('defaults to white for unknown stock', () => {
    expect(spineWidth(100, 'unknown')).toBe(spineWidth(100, 'white'));
  });

  it('returns 4 decimal places', () => {
    const spine = spineWidth(200, 'white');
    const decimals = spine.toString().split('.')[1]?.length || 0;
    expect(decimals).toBeLessThanOrEqual(4);
  });
});

// ================================================================
// preflight
// ================================================================

describe('preflight', () => {
  it('returns passed status and checks array', () => {
    const result = preflight({ wordCount: 50000 }, mockGridSystem);
    expect(result).toHaveProperty('passed');
    expect(result).toHaveProperty('checks');
    expect(result).toHaveProperty('stats');
    expect(Array.isArray(result.checks)).toBe(true);
  });

  it('estimates pages from word count (250 per page)', () => {
    const result = preflight({ wordCount: 50000 }, mockGridSystem);
    expect(result.stats.estimatedPages).toBe(200); // 50000/250
  });

  it('uses explicit page count when provided', () => {
    const result = preflight({ wordCount: 50000, pageCount: 300 }, mockGridSystem);
    expect(result.stats.estimatedPages).toBe(300);
  });

  it('passes all checks for standard config', () => {
    const result = preflight({
      pageSize: 'sixByNine',
      wordCount: 50000,
      platform: 'generic',
    }, mockGridSystem);
    expect(result.passed).toBe(true);
  });

  // KDP platform checks
  it('validates KDP page count range (24-828)', () => {
    const low = preflight({ wordCount: 10, platform: 'kdp' }, mockGridSystem);
    const pcCheck = low.checks.find(c => c.name === 'Page count');
    expect(pcCheck.status).toBe('fail');

    const ok = preflight({ wordCount: 50000, platform: 'kdp' }, mockGridSystem);
    const pcCheckOk = ok.checks.find(c => c.name === 'Page count');
    expect(pcCheckOk.status).toBe('pass');
  });

  // IngramSpark checks
  it('validates IngramSpark page count range (18-1200)', () => {
    const result = preflight({
      wordCount: 50000,
      platform: 'ingram',
    }, mockGridSystem);
    const pcCheck = result.checks.find(c => c.name === 'Page count');
    expect(pcCheck.status).toBe('pass');
  });

  // Lulu checks
  it('validates Lulu page count range (2-800)', () => {
    const result = preflight({
      wordCount: 50000,
      platform: 'lulu',
    }, mockGridSystem);
    const pcCheck = result.checks.find(c => c.name === 'Page count');
    expect(pcCheck.status).toBe('pass');
  });

  it('always passes font embedding check', () => {
    const result = preflight({ wordCount: 50000 }, mockGridSystem);
    const fontCheck = result.checks.find(c => c.name === 'Font embedding');
    expect(fontCheck.status).toBe('pass');
  });

  it('blocks PDF format for IngramSpark (requires PDF/X-1a)', () => {
    const result = preflight({
      wordCount: 50000,
      platform: 'ingram',
    }, mockGridSystem);
    const pdfCheck = result.checks.find(c => c.name === 'PDF format');
    expect(pdfCheck.status).toBe('fail');
    expect(pdfCheck.critical).toBe(true);
  });

  it('includes spine width in stats', () => {
    const result = preflight({ wordCount: 50000 }, mockGridSystem);
    expect(result.stats.spineInches).toBeGreaterThan(0);
    expect(result.stats.spineMm).toBeGreaterThan(0);
  });

  it('includes trim dimensions in stats', () => {
    const result = preflight({ pageSize: 'a5', wordCount: 50000 }, mockGridSystem);
    expect(result.stats.trimWidth).toBe(5.83);
    expect(result.stats.trimHeight).toBe(8.27);
  });
});

// ================================================================
// coverDimensions
// ================================================================

describe('coverDimensions', () => {
  it('calculates full cover dimensions', () => {
    const result = coverDimensions({
      trimWidth: 6,
      trimHeight: 9,
      pageCount: 200,
    });
    expect(result).toHaveProperty('coverWidth');
    expect(result).toHaveProperty('coverHeight');
    expect(result).toHaveProperty('spine');
    expect(result).toHaveProperty('bleed');
    expect(result).toHaveProperty('safety');
    expect(result).toHaveProperty('safeArea');
    expect(result).toHaveProperty('breakdown');
  });

  it('cover width = bleed + back + spine + front + bleed', () => {
    const result = coverDimensions({ trimWidth: 6, trimHeight: 9, pageCount: 200 });
    const expected = result.bleed + 6 + result.spine + 6 + result.bleed;
    expect(result.coverWidth).toBeCloseTo(expected, 3);
  });

  it('cover height = bleed + trimHeight + bleed', () => {
    const result = coverDimensions({ trimWidth: 6, trimHeight: 9, pageCount: 200 });
    expect(result.coverHeight).toBeCloseTo(0.125 + 9 + 0.125, 3);
  });

  it('standard bleed is 0.125"', () => {
    const result = coverDimensions({});
    expect(result.bleed).toBe(0.125);
  });

  it('hardcover has larger safety margin', () => {
    const paperback = coverDimensions({ binding: 'paperback' });
    const hardcover = coverDimensions({ binding: 'hardcover' });
    expect(hardcover.safety).toBeGreaterThan(paperback.safety);
  });

  it('IngramSpark hardcover has extra safety', () => {
    const generic = coverDimensions({ binding: 'hardcover', platform: 'generic' });
    const ingram = coverDimensions({ binding: 'hardcover', platform: 'ingram' });
    expect(ingram.safety).toBeGreaterThan(generic.safety);
  });

  it('includes mm conversions', () => {
    const result = coverDimensions({ trimWidth: 6, trimHeight: 9, pageCount: 200 });
    expect(result.coverWidthMm).toBeCloseTo(result.coverWidth * 25.4, 1);
    expect(result.coverHeightMm).toBeCloseTo(result.coverHeight * 25.4, 1);
    expect(result.spineMm).toBeCloseTo(result.spine * 25.4, 1);
  });

  it('breakdown sums to cover dimensions', () => {
    const result = coverDimensions({ trimWidth: 6, trimHeight: 9, pageCount: 200 });
    const b = result.breakdown;
    const calcWidth = b.leftBleed + b.backCover + b.spine + b.frontCover + b.rightBleed;
    expect(result.coverWidth).toBeCloseTo(calcWidth, 3);
    const calcHeight = b.topBleed + b.trimHeight + b.bottomBleed;
    expect(result.coverHeight).toBeCloseTo(calcHeight, 3);
  });

  it('spine safety is smaller for thin books', () => {
    const thin = coverDimensions({ pageCount: 50 });  // spine < 0.35"
    const thick = coverDimensions({ pageCount: 200 }); // spine > 0.35"
    expect(thin.spineSafety).toBeLessThan(thick.spineSafety);
  });

  it('cream paper produces wider spine', () => {
    const white = coverDimensions({ pageCount: 200, paperStock: 'white' });
    const cream = coverDimensions({ pageCount: 200, paperStock: 'cream' });
    expect(cream.spine).toBeGreaterThan(white.spine);
    expect(cream.coverWidth).toBeGreaterThan(white.coverWidth);
  });
});
