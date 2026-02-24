const {
  SECTION_CATALOG,
  SECTION_PATTERNS,
  parseFrontMatter,
  detectSections,
  analyzeStructure,
  generateStructurePreamble,
  generateMissingSections,
} = require('../manuscript-structure');

// ================================================================
// SECTION_CATALOG
// ================================================================

describe('SECTION_CATALOG', () => {
  it('has 24 section types', () => {
    expect(Object.keys(SECTION_CATALOG).length).toBe(24);
  });

  it('sections have order, matter, label, and required fields', () => {
    for (const [key, sec] of Object.entries(SECTION_CATALOG)) {
      expect(typeof sec.order).toBe('number');
      expect(['front', 'body', 'back']).toContain(sec.matter);
      expect(typeof sec.label).toBe('string');
      expect(typeof sec.required).toBe('boolean');
    }
  });

  it('front matter sections have lower order than body', () => {
    const frontOrders = Object.values(SECTION_CATALOG).filter(s => s.matter === 'front').map(s => s.order);
    const bodyOrders = Object.values(SECTION_CATALOG).filter(s => s.matter === 'body').map(s => s.order);
    expect(Math.max(...frontOrders)).toBeLessThan(Math.min(...bodyOrders));
  });

  it('body sections have lower order than back matter', () => {
    const bodyOrders = Object.values(SECTION_CATALOG).filter(s => s.matter === 'body').map(s => s.order);
    const backOrders = Object.values(SECTION_CATALOG).filter(s => s.matter === 'back').map(s => s.order);
    expect(Math.max(...bodyOrders)).toBeLessThan(Math.min(...backOrders));
  });

  it('titlePage and chapter are required', () => {
    expect(SECTION_CATALOG.titlePage.required).toBe(true);
    expect(SECTION_CATALOG.chapter.required).toBe(true);
  });
});

// ================================================================
// parseFrontMatter
// ================================================================

describe('parseFrontMatter', () => {
  it('parses YAML front matter', () => {
    const md = '---\ntitle: "My Book"\nauthor: "Jane Doe"\ndate: "2026"\n---\n\n# Chapter 1';
    const { meta, body } = parseFrontMatter(md);
    expect(meta.title).toBe('My Book');
    expect(meta.author).toBe('Jane Doe');
    expect(meta.date).toBe('2026');
    expect(body).toContain('# Chapter 1');
  });

  it('handles single-quoted values', () => {
    const md = "---\ntitle: 'My Book'\n---\n\nBody";
    const { meta } = parseFrontMatter(md);
    expect(meta.title).toBe('My Book');
  });

  it('returns empty meta when no front matter', () => {
    const md = '# Chapter 1\n\nSome text.';
    const { meta, body } = parseFrontMatter(md);
    expect(meta).toEqual({});
    expect(body).toBe(md);
  });

  it('handles unquoted values', () => {
    const md = '---\ntitle: My Book\n---\n\nBody';
    const { meta } = parseFrontMatter(md);
    expect(meta.title).toBe('My Book');
  });
});

// ================================================================
// detectSections
// ================================================================

describe('detectSections', () => {
  it('detects title page from YAML', () => {
    const md = '---\ntitle: "Test"\n---\n\n# Chapter 1';
    const sections = detectSections(md);
    expect(sections.find(s => s.type === 'titlePage')).toBeDefined();
  });

  it('detects standard sections', () => {
    const md = '# Foreword\n\n# Preface\n\n# Chapter 1: Start\n\n# Bibliography';
    const sections = detectSections(md);
    expect(sections.find(s => s.type === 'foreword')).toBeDefined();
    expect(sections.find(s => s.type === 'preface')).toBeDefined();
    expect(sections.find(s => s.type === 'bibliography')).toBeDefined();
  });

  it('detects dedication', () => {
    const md = '# Dedication\n\nFor my family.';
    const sections = detectSections(md);
    expect(sections.find(s => s.type === 'dedication')).toBeDefined();
  });

  it('detects acknowledgements with alternate spelling', () => {
    const md = '# Acknowledgments\n\nThanks.';
    const sections = detectSections(md);
    expect(sections.find(s => s.type === 'acknowledgements')).toBeDefined();
  });

  it('detects back matter sections', () => {
    const md = '# Epilogue\n\n# Appendix\n\n# Glossary\n\n# Index';
    const sections = detectSections(md);
    expect(sections.find(s => s.type === 'epilogue')).toBeDefined();
    expect(sections.find(s => s.type === 'appendix')).toBeDefined();
    expect(sections.find(s => s.type === 'glossary')).toBeDefined();
    expect(sections.find(s => s.type === 'index')).toBeDefined();
  });

  it('returns sections sorted by line number', () => {
    const md = '# Foreword\n\n# Chapter 1: Start\n\n# Bibliography';
    const sections = detectSections(md);
    for (let i = 1; i < sections.length; i++) {
      expect(sections[i].line).toBeGreaterThanOrEqual(sections[i - 1].line);
    }
  });

  it('detects copyright with © symbol', () => {
    const md = '# Copyright\n\n© 2026 Author.';
    const sections = detectSections(md);
    expect(sections.find(s => s.type === 'copyright')).toBeDefined();
  });

  it('detects part headings', () => {
    const md = '# Part I\n\n# Part II';
    const sections = detectSections(md);
    const parts = sections.filter(s => s.type === 'part');
    expect(parts.length).toBeGreaterThanOrEqual(1);
  });
});

// ================================================================
// analyzeStructure
// ================================================================

describe('analyzeStructure', () => {
  it('returns sections, warnings, suggestions, structure', () => {
    const md = '---\ntitle: "Test"\nauthor: "Author"\n---\n\n# Chapter 1\n\nText.';
    const result = analyzeStructure(md);
    expect(result).toHaveProperty('sections');
    expect(result).toHaveProperty('warnings');
    expect(result).toHaveProperty('suggestions');
    expect(result).toHaveProperty('structure');
  });

  it('suggests adding title page when missing', () => {
    const md = '# Chapter 1\n\nSome text.';
    const { suggestions } = analyzeStructure(md);
    const titleSuggestion = suggestions.find(s => s.section === 'titlePage');
    expect(titleSuggestion).toBeDefined();
    expect(titleSuggestion.template).toContain('title:');
  });

  it('suggests adding copyright page when missing', () => {
    const md = '---\ntitle: "Test"\n---\n\n# Chapter 1\n\nText.';
    const { suggestions } = analyzeStructure(md);
    const copySuggestion = suggestions.find(s => s.section === 'copyright');
    expect(copySuggestion).toBeDefined();
  });

  it('warns when citations exist but no bibliography section', () => {
    const md = '---\ntitle: "Test"\n---\n\nAs shown by [@Smith2024], this is true.';
    const { suggestions } = analyzeStructure(md);
    const bibSuggestion = suggestions.find(s => s.section === 'bibliography');
    expect(bibSuggestion).toBeDefined();
    expect(bibSuggestion.severity).toBe('warn');
  });

  it('warns about out-of-order matter sections', () => {
    const md = '# Bibliography\n\n# Foreword\n\nText.';
    const { warnings } = analyzeStructure(md);
    const orderWarnings = warnings.filter(w => w.type === 'order');
    expect(orderWarnings.length).toBeGreaterThan(0);
  });

  it('counts headings and chapters', () => {
    const md = '# One\n\n## Sub\n\n# Two\n\n## Sub2';
    const { structure } = analyzeStructure(md);
    expect(structure.headingCounts.h1).toBe(2);
    expect(structure.headingCounts.h2).toBe(2);
  });

  it('suggests list of figures when many images present', () => {
    const images = Array(6).fill('![Fig](image.png)').join('\n\n');
    const md = `# Chapter 1\n\n${images}`;
    const { suggestions } = analyzeStructure(md);
    expect(suggestions.find(s => s.section === 'listOfFigures')).toBeDefined();
  });

  it('includes metadata in structure', () => {
    const md = '---\ntitle: "My Book"\nauthor: "Author"\n---\n\nText.';
    const { structure } = analyzeStructure(md);
    expect(structure.metadata.title).toBe('My Book');
    expect(structure.metadata.author).toBe('Author');
  });
});

// ================================================================
// generateStructurePreamble
// ================================================================

describe('generateStructurePreamble', () => {
  it('includes front/back matter commands when front matter present', () => {
    const analysis = analyzeStructure('# Foreword\n\n# Chapter 1: Start');
    const preamble = generateStructurePreamble(analysis);
    expect(preamble).toContain('\\frontmatterstart');
    expect(preamble).toContain('\\bodymatterstart');
    expect(preamble).toContain('\\backmatterstart');
  });

  it('includes dedication environment', () => {
    const analysis = analyzeStructure('# Chapter 1\n\nText.');
    const preamble = generateStructurePreamble(analysis);
    expect(preamble).toContain('\\newenvironment{dedication}');
  });

  it('includes epigraph environment', () => {
    const analysis = analyzeStructure('# Chapter 1\n\nText.');
    const preamble = generateStructurePreamble(analysis);
    expect(preamble).toContain('\\newenvironment{bookepigraph}');
  });

  it('includes copyright page command', () => {
    const analysis = analyzeStructure('# Chapter 1');
    const preamble = generateStructurePreamble(analysis);
    expect(preamble).toContain('\\copyrightpage');
  });

  it('includes book part command', () => {
    const analysis = analyzeStructure('# Chapter 1');
    const preamble = generateStructurePreamble(analysis);
    expect(preamble).toContain('\\bookpart');
  });
});

// ================================================================
// generateMissingSections
// ================================================================

describe('generateMissingSections', () => {
  it('generates copyright page when missing', () => {
    const analysis = analyzeStructure('# Chapter 1\n\nText.');
    const { append } = generateMissingSections(analysis, { title: 'My Book', author: 'Jane', date: '2026' });
    expect(append).toContain('# Copyright');
    expect(append).toContain('© 2026 Jane');
  });

  it('includes ISBN when provided', () => {
    const analysis = analyzeStructure('# Chapter 1');
    const { append } = generateMissingSections(analysis, { author: 'Jane', isbn: '978-1-234-56789-0' });
    expect(append).toContain('ISBN: 978-1-234-56789-0');
  });

  it('does not generate copyright when already present', () => {
    const analysis = analyzeStructure('# Copyright\n\n© 2026.\n\n# Chapter 1');
    const { append } = generateMissingSections(analysis, { author: 'Jane' });
    expect(append).not.toContain('# Copyright');
  });

  it('returns empty strings when nothing to generate', () => {
    const analysis = analyzeStructure('# Copyright\n\n© 2026.\n\n# Chapter 1');
    const { prepend, append } = generateMissingSections(analysis);
    expect(prepend).toBe('');
  });
});
