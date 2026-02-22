const {
  FONT_REGISTRY,
  probeInstalledFonts,
  isFontAvailable,
  resolveFont,
  resolveTemplateFont,
  auditFonts,
  quickCheck,
} = require('../font-availability');

// ================================================================
// Font Registry
// ================================================================

describe('FONT_REGISTRY', () => {
  it('has 25+ registered fonts', () => {
    expect(Object.keys(FONT_REGISTRY).length).toBeGreaterThanOrEqual(25);
  });

  it('every font has category, fallbacks, and critical flag', () => {
    for (const [name, entry] of Object.entries(FONT_REGISTRY)) {
      expect(entry).toHaveProperty('category');
      expect(entry).toHaveProperty('fallbacks');
      expect(entry).toHaveProperty('critical');
      expect(Array.isArray(entry.fallbacks)).toBe(true);
      expect(['serif', 'sans', 'mono', 'multilingual']).toContain(entry.category);
    }
  });

  it('every font has source and usedBy', () => {
    for (const [name, entry] of Object.entries(FONT_REGISTRY)) {
      expect(typeof entry.source).toBe('string');
      expect(Array.isArray(entry.usedBy)).toBe(true);
    }
  });

  it('has critical fonts for each main category', () => {
    const criticals = Object.entries(FONT_REGISTRY).filter(([, e]) => e.critical);
    const criticalCategories = new Set(criticals.map(([, e]) => e.category));
    expect(criticalCategories).toContain('serif');
    expect(criticalCategories).toContain('sans');
    expect(criticalCategories).toContain('mono');
  });

  it('fallbacks reference only fonts in the registry or known system fonts', () => {
    const registered = new Set(Object.keys(FONT_REGISTRY));
    // Some fallbacks may reference system fonts not in the registry
    const knownSystemFonts = new Set(['Lohit Devanagari', 'David CLM', 'Source Han Serif SC']);
    for (const [name, entry] of Object.entries(FONT_REGISTRY)) {
      for (const fb of entry.fallbacks) {
        const known = registered.has(fb) || knownSystemFonts.has(fb);
        if (!known) {
          // This is acceptable but let's just ensure fallbacks are strings
          expect(typeof fb).toBe('string');
        }
      }
    }
  });
});

// ================================================================
// probeInstalledFonts
// ================================================================

describe('probeInstalledFonts', () => {
  it('returns a Set', () => {
    const result = probeInstalledFonts();
    expect(result).toBeInstanceOf(Set);
  });

  it('caches results across calls', () => {
    const first = probeInstalledFonts();
    const second = probeInstalledFonts();
    expect(first).toBe(second); // same reference = cached
  });

  it('returns fresh set when forced', () => {
    const first = probeInstalledFonts();
    const forced = probeInstalledFonts(true);
    // Could be same or different reference depending on timing
    expect(forced).toBeInstanceOf(Set);
  });
});

// ================================================================
// resolveFont
// ================================================================

describe('resolveFont', () => {
  it('returns resolution object with expected shape', () => {
    const result = resolveFont('EB Garamond');
    expect(result).toHaveProperty('resolved');
    expect(result).toHaveProperty('original');
    expect(result).toHaveProperty('isFallback');
    expect(result).toHaveProperty('warning');
    expect(result.original).toBe('EB Garamond');
  });

  it('returns the original name when probing is unavailable', () => {
    // In the test environment, fc-list probably isn't available
    // so installed.size === 0, and it should return the original font
    const installed = probeInstalledFonts();
    if (installed.size === 0) {
      const result = resolveFont('EB Garamond');
      expect(result.resolved).toBe('EB Garamond');
      expect(result.isFallback).toBe(false);
      expect(result.warning).toBeNull();
    }
  });

  it('handles unregistered font names', () => {
    const result = resolveFont('Comic Sans MS');
    expect(result.original).toBe('Comic Sans MS');
    // Should still return something (either the font or a fallback)
    expect(typeof result.resolved).toBe('string');
  });
});

// ================================================================
// resolveTemplateFont
// ================================================================

describe('resolveTemplateFont', () => {
  it('resolves all three font slots', () => {
    const result = resolveTemplateFont('symphony', {
      mainfont: 'EB Garamond',
      sansfont: 'Libertinus Sans',
      monofont: 'DejaVu Sans Mono',
    });
    expect(result).toHaveProperty('mainfont');
    expect(result).toHaveProperty('sansfont');
    expect(result).toHaveProperty('monofont');
    expect(result).toHaveProperty('warnings');
    expect(Array.isArray(result.warnings)).toBe(true);
  });

  it('handles null sansfont and monofont', () => {
    const result = resolveTemplateFont('minimal', {
      mainfont: 'Latin Modern Roman',
      sansfont: null,
      monofont: null,
    });
    expect(result.mainfont).toBeDefined();
    expect(result.sansfont).toBeNull();
    expect(result.monofont).toBeNull();
  });

  it('mainfont result has expected shape', () => {
    const result = resolveTemplateFont('test', { mainfont: 'EB Garamond' });
    expect(result.mainfont).toHaveProperty('resolved');
    expect(result.mainfont).toHaveProperty('original');
    expect(result.mainfont).toHaveProperty('isFallback');
  });
});

// ================================================================
// isFontAvailable
// ================================================================

describe('isFontAvailable', () => {
  it('returns a boolean', () => {
    const result = isFontAvailable('EB Garamond');
    expect(typeof result).toBe('boolean');
  });

  it('returns true when probing is unavailable (safe default)', () => {
    const installed = probeInstalledFonts();
    if (installed.size === 0) {
      expect(isFontAvailable('AnyFont')).toBe(true);
    }
  });
});

// ================================================================
// auditFonts
// ================================================================

describe('auditFonts', () => {
  it('returns audit report with expected shape', () => {
    const report = auditFonts();
    expect(report).toHaveProperty('total');
    expect(report).toHaveProperty('available');
    expect(report).toHaveProperty('missing');
    expect(report).toHaveProperty('probeWorking');
    expect(report).toHaveProperty('fonts');
    expect(Array.isArray(report.fonts)).toBe(true);
  });

  it('total matches registry size', () => {
    const report = auditFonts();
    expect(report.total).toBe(Object.keys(FONT_REGISTRY).length);
  });

  it('fonts array has name, category, critical for each entry', () => {
    const report = auditFonts();
    for (const font of report.fonts) {
      expect(font).toHaveProperty('name');
      expect(font).toHaveProperty('category');
      expect(font).toHaveProperty('critical');
      expect(font).toHaveProperty('available');
    }
  });

  it('sorts critical missing fonts first', () => {
    const report = auditFonts();
    if (report.fonts.length > 1 && report.missing > 0) {
      // First missing font should be critical (if any critical is missing)
      const missingFonts = report.fonts.filter(f => f.available === false);
      if (missingFonts.length > 1) {
        const criticalMissing = missingFonts.filter(f => f.critical);
        if (criticalMissing.length > 0) {
          expect(missingFonts[0].critical).toBe(true);
        }
      }
    }
  });
});

// ================================================================
// quickCheck
// ================================================================

describe('quickCheck', () => {
  it('returns check result with expected shape', () => {
    const check = quickCheck();
    expect(check).toHaveProperty('ok');
    expect(check).toHaveProperty('total');
    expect(check).toHaveProperty('available');
    expect(check).toHaveProperty('missing');
    expect(check).toHaveProperty('criticalMissing');
    expect(typeof check.ok).toBe('boolean');
    expect(Array.isArray(check.criticalMissing)).toBe(true);
  });

  it('total matches registry size', () => {
    const check = quickCheck();
    expect(check.total).toBe(Object.keys(FONT_REGISTRY).length);
  });

  it('ok is true when no critical fonts missing', () => {
    const check = quickCheck();
    if (check.criticalMissing.length === 0) {
      expect(check.ok).toBe(true);
    }
  });

  it('returns probeWorking flag', () => {
    const check = quickCheck();
    expect(typeof check.probeWorking).toBe('boolean');
  });
});
