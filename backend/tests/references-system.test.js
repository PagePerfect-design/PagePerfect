const {
  validateCitationKey,
  parseBibTeX,
  validateBibliography,
  extractCitations,
  crossReference,
  previewCitation,
  REQUIRED_FIELDS,
} = require('../references-system');

// ================================================================
// validateCitationKey
// ================================================================

describe('validateCitationKey', () => {
  it('accepts standard AuthorYear format', () => {
    const result = validateCitationKey('Smith2024');
    expect(result.valid).toBe(true);
    expect(result.key).toBe('Smith2024');
  });

  it('accepts colon-separated key', () => {
    expect(validateCitationKey('Smith:2024').valid).toBe(true);
  });

  it('accepts hyphenated key', () => {
    expect(validateCitationKey('Smith-Jones2024').valid).toBe(true);
  });

  it('rejects empty key', () => {
    const result = validateCitationKey('');
    expect(result.valid).toBe(false);
    expect(result.issues[0].severity).toBe('error');
  });

  it('rejects key with spaces', () => {
    expect(validateCitationKey('Smith 2024').valid).toBe(false);
  });

  it('rejects key starting with number', () => {
    expect(validateCitationKey('2024Smith').valid).toBe(false);
  });

  it('warns about very short keys', () => {
    const result = validateCitationKey('ab');
    expect(result.valid).toBe(true); // valid but has warnings
    expect(result.issues.some(i => i.severity === 'warn')).toBe(true);
  });

  it('info when key has no year', () => {
    const result = validateCitationKey('SmithJones');
    expect(result.issues.some(i => i.severity === 'info' && i.message.includes('year'))).toBe(true);
  });

  it('does not warn about year when key ends with 2-digit number', () => {
    const result = validateCitationKey('Smith24');
    expect(result.issues.filter(i => i.message.includes('year'))).toHaveLength(0);
  });
});

// ================================================================
// parseBibTeX
// ================================================================

describe('parseBibTeX', () => {
  const sampleBib = `
@article{Smith2024,
  author = {John Smith},
  title = {A Great Paper},
  journal = {Nature},
  year = {2024},
  volume = {42},
  pages = {10--25},
}

@book{Doe2023,
  author = {Jane Doe},
  title = {The Big Book},
  publisher = {Academic Press},
  year = {2023},
}
`;

  it('parses multiple entries', () => {
    const { entries } = parseBibTeX(sampleBib);
    expect(entries).toHaveLength(2);
  });

  it('extracts entry type', () => {
    const { entries } = parseBibTeX(sampleBib);
    expect(entries[0].type).toBe('article');
    expect(entries[1].type).toBe('book');
  });

  it('extracts citation key', () => {
    const { entries } = parseBibTeX(sampleBib);
    expect(entries[0].key).toBe('Smith2024');
    expect(entries[1].key).toBe('Doe2023');
  });

  it('parses fields with braces', () => {
    const { entries } = parseBibTeX(sampleBib);
    expect(entries[0].fields.author).toBe('John Smith');
    expect(entries[0].fields.journal).toBe('Nature');
  });

  it('parses fields with quotes', () => {
    const bib = '@article{key1, title = "Quoted Title", year = {2024}}';
    const { entries } = parseBibTeX(bib);
    expect(entries[0].fields.title).toBe('Quoted Title');
  });

  it('parses numeric field values', () => {
    const bib = '@article{key1, year = 2024, volume = 42}';
    const { entries } = parseBibTeX(bib);
    expect(entries[0].fields.year).toBe('2024');
  });

  it('skips @string and @preamble entries', () => {
    // @string and @preamble with comma-key format are skipped by type filter
    const bib = '@string{jn,\n  value = {Nature}\n}\n\n@article{key1,\n  title = {Test},\n  year = {2024}\n}\n';
    const { entries } = parseBibTeX(bib);
    // @string is filtered out, only @article remains
    expect(entries).toHaveLength(1);
    expect(entries[0].type).toBe('article');
  });

  it('handles empty input', () => {
    const { entries } = parseBibTeX('');
    expect(entries).toHaveLength(0);
  });
});

// ================================================================
// REQUIRED_FIELDS
// ================================================================

describe('REQUIRED_FIELDS', () => {
  it('defines requirements for common entry types', () => {
    expect(REQUIRED_FIELDS).toHaveProperty('article');
    expect(REQUIRED_FIELDS).toHaveProperty('book');
    expect(REQUIRED_FIELDS).toHaveProperty('inproceedings');
    expect(REQUIRED_FIELDS).toHaveProperty('phdthesis');
  });

  it('article requires author, title, journal, year', () => {
    expect(REQUIRED_FIELDS.article).toEqual(expect.arrayContaining(['author', 'title', 'journal', 'year']));
  });

  it('book requires author, title, publisher, year', () => {
    expect(REQUIRED_FIELDS.book).toEqual(expect.arrayContaining(['author', 'title', 'publisher', 'year']));
  });
});

// ================================================================
// validateBibliography
// ================================================================

describe('validateBibliography', () => {
  it('detects duplicate keys', () => {
    const bib = '@article{Smith2024, title={A}, year={2024}}\n@article{Smith2024, title={B}, year={2024}}';
    const result = validateBibliography(bib);
    expect(result.duplicates.length).toBeGreaterThan(0);
    expect(result.duplicates[0].key).toBe('Smith2024');
    expect(result.duplicates[0].count).toBe(2);
  });

  it('reports missing required fields', () => {
    const bib = '@article{Smith2024, title = {A Title}}';
    const result = validateBibliography(bib);
    const missing = result.missingFields.filter(m => m.key === 'Smith2024');
    expect(missing.length).toBeGreaterThan(0);
    expect(missing.some(m => m.field === 'author')).toBe(true);
  });

  it('reports stats by type', () => {
    const bib = '@article{a1, title={A}, author={X}, journal={J}, year={2024}}\n@book{b1, title={B}, author={Y}, publisher={P}, year={2023}}';
    const result = validateBibliography(bib);
    expect(result.stats.byType.article).toBe(1);
    expect(result.stats.byType.book).toBe(1);
  });

  it('suggests page range normalization', () => {
    const bib = '@article{Smith2024, author={A}, title={T}, journal={J}, year={2024}, pages={10-25}}';
    const result = validateBibliography(bib);
    const norm = result.normalizations.find(n => n.field === 'pages');
    expect(norm).toBeDefined();
    expect(norm.normalized).toContain('--');
  });

  it('warns about unusual years', () => {
    const bib = '@article{old, title={T}, year={500}}';
    const result = validateBibliography(bib);
    expect(result.warnings.some(w => w.field === 'year')).toBe(true);
  });

  it('warns about malformed DOIs', () => {
    const bib = '@article{a1, title={T}, year={2024}, doi={not-a-doi}}';
    const result = validateBibliography(bib);
    expect(result.warnings.some(w => w.field === 'doi')).toBe(true);
  });

  it('accepts valid DOIs', () => {
    const bib = '@article{a1, title={T}, year={2024}, doi={10.1234/abc.5678}}';
    const result = validateBibliography(bib);
    expect(result.warnings.filter(w => w.field === 'doi')).toHaveLength(0);
  });

  it('detects smart quotes and suggests normalization', () => {
    const bib = '@article{a1, title={\u201CSmart Title\u201D}, year={2024}}';
    const result = validateBibliography(bib);
    const smartQuoteNorm = result.normalizations.find(n => n.message.includes('Smart quotes'));
    expect(smartQuoteNorm).toBeDefined();
  });
});

// ================================================================
// extractCitations
// ================================================================

describe('extractCitations', () => {
  it('extracts bracketed citations', () => {
    const md = 'As shown by [@Smith2024], this is important.';
    const result = extractCitations(md);
    expect(result.keys).toContain('Smith2024');
    expect(result.count).toBe(1);
  });

  it('extracts multiple citations in one bracket', () => {
    const md = 'See [@Smith2024; @Doe2023] for details.';
    const result = extractCitations(md);
    expect(result.keys).toContain('Smith2024');
    expect(result.keys).toContain('Doe2023');
    expect(result.count).toBe(2);
  });

  it('extracts inline citations', () => {
    const md = 'As @Smith2024 argues, this is true.';
    const result = extractCitations(md);
    expect(result.keys).toContain('Smith2024');
  });

  it('handles suppressed-author citations', () => {
    const md = 'Smith says [-@Smith2024] this works.';
    const result = extractCitations(md);
    expect(result.keys).toContain('Smith2024');
  });

  it('deduplicates keys', () => {
    const md = 'See [@Smith2024]. Also [@Smith2024] again.';
    const result = extractCitations(md);
    expect(result.keys.filter(k => k === 'Smith2024')).toHaveLength(1);
  });

  it('records line numbers in occurrences', () => {
    const md = 'Line 1.\nSee [@Smith2024] here.\nLine 3.';
    const result = extractCitations(md);
    expect(result.occurrences[0].line).toBe(2);
  });

  it('returns empty for text without citations', () => {
    const md = 'No citations here. Just plain text.';
    const result = extractCitations(md);
    expect(result.count).toBe(0);
    expect(result.keys).toHaveLength(0);
  });
});

// ================================================================
// crossReference
// ================================================================

describe('crossReference', () => {
  const bib = '@article{Smith2024, author={A}, title={T}, journal={J}, year={2024}}\n@book{Doe2023, author={B}, title={T}, publisher={P}, year={2023}}\n@book{Unused2020, author={C}, title={T}, publisher={P}, year={2020}}';

  it('identifies undefined citations', () => {
    const md = 'See [@Smith2024] and [@Missing2025].';
    const result = crossReference(md, bib);
    expect(result.undefinedCitations).toHaveLength(1);
    expect(result.undefinedCitations[0].key).toBe('Missing2025');
  });

  it('identifies unused bibliography entries', () => {
    const md = 'See [@Smith2024].';
    const result = crossReference(md, bib);
    const unusedKeys = result.unusedEntries.map(e => e.key);
    expect(unusedKeys).toContain('Unused2020');
    expect(unusedKeys).toContain('Doe2023');
  });

  it('identifies matched references', () => {
    const md = 'See [@Smith2024] and [@Doe2023].';
    const result = crossReference(md, bib);
    expect(result.matched).toContain('Smith2024');
    expect(result.matched).toContain('Doe2023');
  });

  it('counts totals correctly', () => {
    const md = 'See [@Smith2024].';
    const result = crossReference(md, bib);
    expect(result.totalCited).toBe(1);
    expect(result.totalBibEntries).toBe(3);
  });
});

// ================================================================
// previewCitation
// ================================================================

describe('previewCitation', () => {
  const bookEntry = {
    type: 'book',
    key: 'Doe2023',
    fields: { author: 'Jane Doe', title: 'The Big Book', publisher: 'Academic Press', year: '2023' },
  };

  const articleEntry = {
    type: 'article',
    key: 'Smith2024',
    fields: { author: 'John Smith', title: 'A Great Paper', journal: 'Nature', year: '2024', volume: '42', pages: '10--25' },
  };

  it('renders Chicago style for book', () => {
    const preview = previewCitation(bookEntry, 'chicago');
    expect(preview).toContain('Jane Doe');
    expect(preview).toContain('2023');
    expect(preview).toContain('*The Big Book*');
    expect(preview).toContain('Academic Press');
  });

  it('renders Chicago style for article', () => {
    const preview = previewCitation(articleEntry, 'chicago');
    expect(preview).toContain('John Smith');
    expect(preview).toContain('"A Great Paper."');
    expect(preview).toContain('*Nature*');
  });

  it('renders APA style', () => {
    const preview = previewCitation(bookEntry, 'apa');
    expect(preview).toContain('Jane Doe (2023)');
    expect(preview).toContain('The Big Book');
  });

  it('renders MLA style', () => {
    const preview = previewCitation(articleEntry, 'mla');
    expect(preview).toContain('"A Great Paper."');
    expect(preview).toContain('2024');
  });

  it('handles unknown style gracefully', () => {
    const preview = previewCitation(bookEntry, 'unknown');
    expect(preview).toContain('Jane Doe');
    expect(preview).toContain('2023');
  });

  it('handles missing fields', () => {
    const sparseEntry = { type: 'misc', key: 'x', fields: {} };
    const preview = previewCitation(sparseEntry, 'chicago');
    expect(preview).toContain('Unknown');
    expect(preview).toContain('n.d.');
  });
});
