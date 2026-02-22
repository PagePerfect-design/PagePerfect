const {
  TYPOGRAPHIC_RULES,
  analyzeTypography,
  generateTypographicReport,
} = require('../typography-assurance');

// ================================================================
// TYPOGRAPHIC_RULES
// ================================================================

describe('TYPOGRAPHIC_RULES', () => {
  const categories = ['academic', 'trade', 'editorial', 'corporate', 'creative', 'basic'];

  it('defines rules for all 6 categories', () => {
    for (const cat of categories) {
      expect(TYPOGRAPHIC_RULES).toHaveProperty(cat);
    }
  });

  it('every rule set has baseline grid and line height', () => {
    for (const cat of categories) {
      const rules = TYPOGRAPHIC_RULES[cat];
      expect(typeof rules.baselineGrid).toBe('number');
      expect(typeof rules.lineHeight).toBe('number');
      expect(typeof rules.minLeading).toBe('number');
      expect(typeof rules.maxLeading).toBe('number');
    }
  });

  it('academic and basic use 12pt baseline', () => {
    expect(TYPOGRAPHIC_RULES.academic.baselineGrid).toBe(12);
    expect(TYPOGRAPHIC_RULES.basic.baselineGrid).toBe(12);
  });

  it('trade/editorial/corporate/creative use 11pt baseline', () => {
    for (const cat of ['trade', 'editorial', 'corporate', 'creative']) {
      expect(TYPOGRAPHIC_RULES[cat].baselineGrid).toBe(11);
    }
  });

  it('editorial allows parskip (block paragraph style)', () => {
    expect(TYPOGRAPHIC_RULES.editorial.parSkipAllowed).toBe(true);
  });

  it('academic does not allow parskip', () => {
    expect(TYPOGRAPHIC_RULES.academic.parSkipAllowed).toBe(false);
  });

  it('editorial uses ragged-right justification', () => {
    expect(TYPOGRAPHIC_RULES.editorial.justification).toBe('ragged-right');
  });

  it('academic uses full justification', () => {
    expect(TYPOGRAPHIC_RULES.academic.justification).toBe('full');
  });

  it('every rule has paragraph indent range', () => {
    for (const cat of categories) {
      expect(Array.isArray(TYPOGRAPHIC_RULES[cat].parIndentRange)).toBe(true);
      expect(TYPOGRAPHIC_RULES[cat].parIndentRange).toHaveLength(2);
    }
  });
});

// ================================================================
// analyzeTypography
// ================================================================

describe('analyzeTypography', () => {
  it('returns score, grade, checks, report', () => {
    const result = analyzeTypography({ template: 'academic' });
    expect(result).toHaveProperty('score');
    expect(result).toHaveProperty('grade');
    expect(result).toHaveProperty('checks');
    expect(result).toHaveProperty('report');
    expect(typeof result.score).toBe('number');
    expect(['A', 'B', 'C', 'D']).toContain(result.grade);
  });

  it('score is 0-100', () => {
    const result = analyzeTypography({ template: 'academic' });
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it('checks baseline grid conformance', () => {
    const result = analyzeTypography({ template: 'academic' });
    const gridCheck = result.checks.find(c => c.name === 'Baseline grid conformance');
    expect(gridCheck).toBeDefined();
  });

  it('checks heading scale progression', () => {
    const result = analyzeTypography({ template: 'trade' });
    const scaleCheck = result.checks.find(c => c.name === 'Heading scale progression');
    expect(scaleCheck).toBeDefined();
    expect(scaleCheck.detail).toMatch(/H1.*H2.*H3/);
  });

  it('checks characters per line (Bringhurst)', () => {
    const result = analyzeTypography({ template: 'academic', pageSize: 'sixByNine' });
    const charCheck = result.checks.find(c => c.name.includes('Bringhurst'));
    expect(charCheck).toBeDefined();
  });

  it('checks widow/orphan control', () => {
    const result = analyzeTypography({ template: 'academic' });
    const widowCheck = result.checks.find(c => c.name.includes('Widow'));
    expect(widowCheck).toBeDefined();
  });

  it('reports typography details in report object', () => {
    const result = analyzeTypography({ template: 'trade' });
    expect(result.report.typography).toHaveProperty('baseSize');
    expect(result.report.typography).toHaveProperty('leading');
    expect(result.report.typography).toHaveProperty('h1Size');
    expect(result.report.typography).toHaveProperty('scale');
  });

  it('reports grid system details', () => {
    const result = analyzeTypography({ template: 'academic' });
    expect(result.report.gridSystem).toHaveProperty('baseline');
    expect(result.report.gridSystem).toHaveProperty('conformant');
  });

  it('grade A for score >= 90', () => {
    const result = analyzeTypography({ template: 'academic' });
    if (result.score >= 90) expect(result.grade).toBe('A');
  });

  it('includes extension compatibility check when extensions provided', () => {
    const result = analyzeTypography({
      template: 'academic',
      extensions: { fontSize: 8, lineHeight: 2.0 },
    });
    const extCheck = result.checks.find(c => c.name === 'Extension compatibility');
    expect(extCheck).toBeDefined();
    expect(extCheck.status).toBe('warn');
  });

  it('passes extension check when overrides are within tolerance', () => {
    const result = analyzeTypography({
      template: 'academic',
      extensions: { fontSize: 12 },
    });
    const extCheck = result.checks.find(c => c.name === 'Extension compatibility');
    expect(extCheck).toBeDefined();
    expect(extCheck.status).toBe('pass');
  });

  it('defaults to academic for unknown template', () => {
    const result = analyzeTypography({ template: 'nonexistent' });
    expect(result.report.templateType).toBe('nonexistent');
    // Should still produce valid output using academic rules
    expect(result.score).toBeGreaterThanOrEqual(0);
  });

  it('analyzes different page sizes', () => {
    const small = analyzeTypography({ template: 'academic', pageSize: 'amazonFiveByEight' });
    const large = analyzeTypography({ template: 'academic', pageSize: 'letter' });
    // Both should produce valid analyses
    expect(small.checks.length).toBeGreaterThan(0);
    expect(large.checks.length).toBeGreaterThan(0);
  });
});

// ================================================================
// generateTypographicReport
// ================================================================

describe('generateTypographicReport', () => {
  it('wraps pre-analysis with timestamp', () => {
    const preAnalysis = analyzeTypography({ template: 'trade' });
    const report = generateTypographicReport(preAnalysis);
    expect(report).toHaveProperty('timestamp');
    expect(report.score).toBe(preAnalysis.score);
  });

  it('incorporates compile log overfull warnings', () => {
    const preAnalysis = analyzeTypography({ template: 'trade' });
    const originalScore = preAnalysis.score;
    const compileLog = {
      overfullBoxes: [{ amount: 12 }, { amount: 8 }],
      underfullBoxes: [],
      floatIssues: [],
      footnoteIssues: [],
    };
    const report = generateTypographicReport(preAnalysis, compileLog);
    expect(report.score).toBeLessThan(originalScore);
    expect(report.compileStats.overfullBoxes).toBe(2);
  });

  it('incorporates compile log underfull warnings', () => {
    const preAnalysis = analyzeTypography({ template: 'academic' });
    const compileLog = {
      overfullBoxes: [],
      underfullBoxes: [{ badness: 9000 }, { badness: 8000 }],
      floatIssues: [],
      footnoteIssues: [],
    };
    const report = generateTypographicReport(preAnalysis, compileLog);
    expect(report.compileStats.underfullBoxes).toBe(2);
  });

  it('recalculates grade after compile log impact', () => {
    const preAnalysis = analyzeTypography({ template: 'trade' });
    const manyIssues = {
      overfullBoxes: Array(20).fill({ amount: 15 }),
      underfullBoxes: Array(10).fill({ badness: 9000 }),
      floatIssues: [{ message: 'float overflow' }],
      footnoteIssues: [],
    };
    const report = generateTypographicReport(preAnalysis, manyIssues);
    expect(report.score).toBeLessThan(preAnalysis.score);
    expect(['A', 'B', 'C', 'D']).toContain(report.grade);
  });

  it('handles null compile log gracefully', () => {
    const preAnalysis = analyzeTypography({ template: 'academic' });
    const report = generateTypographicReport(preAnalysis, null);
    expect(report.score).toBe(preAnalysis.score);
    expect(report).not.toHaveProperty('compileStats');
  });

  it('tracks float and footnote issues in compile stats', () => {
    const preAnalysis = analyzeTypography({ template: 'editorial' });
    const compileLog = {
      overfullBoxes: [],
      underfullBoxes: [],
      floatIssues: [{ message: 'float' }],
      footnoteIssues: [{ message: 'footnote' }],
    };
    const report = generateTypographicReport(preAnalysis, compileLog);
    expect(report.compileStats.floatIssues).toBe(1);
    expect(report.compileStats.footnoteIssues).toBe(1);
  });
});
