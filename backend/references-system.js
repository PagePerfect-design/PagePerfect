/**
 * References and Citations System
 *
 * Makes references feel governed rather than merely "supported".
 * Validates citation keys, detects duplicates, checks missing fields,
 * normalizes formatting, and provides citation preview data.
 */

// ================================================================
// Citation Key Rules
// ================================================================

/** Validate a citation key format */
function validateCitationKey(key) {
  const issues = [];

  // Must be non-empty
  if (!key || !key.trim()) {
    issues.push({ severity: 'error', message: 'Empty citation key.' });
    return { key, valid: false, issues };
  }

  // Standard format: AuthorYear or Author:Year or author2024
  const validPattern = /^[A-Za-z][A-Za-z0-9:_\-]*$/;
  if (!validPattern.test(key)) {
    issues.push({
      severity: 'error',
      message: `Key "${key}" contains invalid characters. Use letters, numbers, colons, hyphens, and underscores.`,
    });
  }

  // Warn about very short keys
  if (key.length < 3) {
    issues.push({ severity: 'warn', message: `Key "${key}" is very short. Consider a more descriptive key like "Author2024".` });
  }

  // Warn about keys without year hint
  if (!/\d{4}/.test(key) && !/\d{2}$/.test(key)) {
    issues.push({ severity: 'info', message: `Key "${key}" has no year indicator. Consider "AuthorYear" format for clarity.` });
  }

  return {
    key,
    valid: issues.every(i => i.severity !== 'error'),
    issues,
  };
}

// ================================================================
// BibTeX Parser (lightweight)
// ================================================================

/**
 * Parse a .bib file into structured entries.
 * Handles @type{key, field = {value}, ...} format.
 */
function parseBibTeX(bibContent) {
  const entries = [];
  const errors = [];

  // Match @type{key, ... }
  const entryPattern = /@(\w+)\s*\{([^,]+),([^@]*?)(?=\n\s*@|\n*$)/gs;
  let match;

  while ((match = entryPattern.exec(bibContent)) !== null) {
    const type = match[1].toLowerCase();
    const key = match[2].trim();
    const fieldsBlock = match[3];

    // Skip @string, @preamble, @comment
    if (['string', 'preamble', 'comment'].includes(type)) continue;

    const fields = {};
    // Parse field = {value} or field = "value" or field = number
    const fieldPattern = /(\w+)\s*=\s*(?:\{([^}]*)\}|"([^"]*)"|(\d+))/g;
    let fm;
    while ((fm = fieldPattern.exec(fieldsBlock)) !== null) {
      const fieldName = fm[1].toLowerCase();
      const value = fm[2] ?? fm[3] ?? fm[4] ?? '';
      fields[fieldName] = value.trim();
    }

    entries.push({ type, key, fields, raw: match[0] });
  }

  return { entries, errors };
}

// ================================================================
// Validation
// ================================================================

/** Required fields by entry type (BibTeX standard) */
const REQUIRED_FIELDS = {
  article:       ['author', 'title', 'journal', 'year'],
  book:          ['author', 'title', 'publisher', 'year'],
  inproceedings: ['author', 'title', 'booktitle', 'year'],
  incollection:  ['author', 'title', 'booktitle', 'publisher', 'year'],
  phdthesis:     ['author', 'title', 'school', 'year'],
  mastersthesis: ['author', 'title', 'school', 'year'],
  techreport:    ['author', 'title', 'institution', 'year'],
  misc:          ['title'],
  unpublished:   ['author', 'title', 'note'],
  inbook:        ['author', 'title', 'chapter', 'publisher', 'year'],
  proceedings:   ['title', 'year'],
  manual:        ['title'],
  booklet:       ['title'],
};

/**
 * Validate all entries in a .bib file.
 *
 * @param {string} bibContent — raw .bib file content
 * @returns {{ entries, duplicates, missingFields, keyIssues, normalizations, stats }}
 */
function validateBibliography(bibContent) {
  const { entries, errors } = parseBibTeX(bibContent);
  const results = {
    entries: entries.length,
    duplicates: [],
    missingFields: [],
    keyIssues: [],
    normalizations: [],
    warnings: [],
    stats: {
      totalEntries: entries.length,
      byType: {},
      fieldsPresent: {},
    },
  };

  // ── Duplicate key detection ──
  const keyCounts = {};
  for (const entry of entries) {
    keyCounts[entry.key] = (keyCounts[entry.key] || 0) + 1;
  }
  for (const [key, count] of Object.entries(keyCounts)) {
    if (count > 1) {
      results.duplicates.push({
        key,
        count,
        severity: 'error',
        message: `Duplicate citation key "${key}" appears ${count} times. Each key must be unique.`,
      });
    }
  }

  // ── Per-entry validation ──
  for (const entry of entries) {
    // Key validation
    const keyResult = validateCitationKey(entry.key);
    if (keyResult.issues.length > 0) {
      results.keyIssues.push(...keyResult.issues.map(i => ({ ...i, key: entry.key })));
    }

    // Type stats
    results.stats.byType[entry.type] = (results.stats.byType[entry.type] || 0) + 1;

    // Missing required fields
    const required = REQUIRED_FIELDS[entry.type] || REQUIRED_FIELDS.misc;
    for (const field of required) {
      if (!entry.fields[field] || !entry.fields[field].trim()) {
        results.missingFields.push({
          key: entry.key,
          type: entry.type,
          field,
          severity: 'warn',
          message: `Entry "${entry.key}" (@${entry.type}) is missing required field "${field}".`,
        });
      }
    }

    // ── Normalization suggestions ──
    const { fields } = entry;

    // Smart quotes → straight quotes in fields
    for (const [fname, fval] of Object.entries(fields)) {
      if (/[\u201C\u201D\u201E\u201F\u2018\u2019]/.test(fval)) {
        results.normalizations.push({
          key: entry.key,
          field: fname,
          severity: 'info',
          message: `Smart quotes in "${fname}" field of "${entry.key}". BibTeX expects straight quotes.`,
          original: fval,
          normalized: fval.replace(/[\u201C\u201D\u201E\u201F]/g, '"').replace(/[\u2018\u2019]/g, "'"),
        });
      }
    }

    // Page range normalization (-- → en-dash in rendering)
    if (fields.pages) {
      const pages = fields.pages;
      // Check for inconsistent page range separators
      if (/\d\s*-\s*\d/.test(pages) && !/--/.test(pages)) {
        results.normalizations.push({
          key: entry.key,
          field: 'pages',
          severity: 'info',
          message: `Page range in "${entry.key}" uses single hyphen. BibTeX convention is double-dash (e.g., "10--25").`,
          original: pages,
          normalized: pages.replace(/(\d+)\s*-\s*(\d+)/g, '$1--$2'),
        });
      }
    }

    // Year validation
    if (fields.year) {
      const yearNum = parseInt(fields.year, 10);
      if (isNaN(yearNum) || yearNum < 1000 || yearNum > new Date().getFullYear() + 2) {
        results.warnings.push({
          key: entry.key,
          field: 'year',
          severity: 'warn',
          message: `Unusual year "${fields.year}" in entry "${entry.key}".`,
        });
      }
    }

    // DOI format check
    if (fields.doi && !/^10\.\d{4,}\//.test(fields.doi)) {
      results.warnings.push({
        key: entry.key,
        field: 'doi',
        severity: 'warn',
        message: `DOI "${fields.doi}" in "${entry.key}" doesn't match standard format (10.xxxx/...).`,
      });
    }
  }

  return results;
}

// ================================================================
// Citation Extraction from Markdown
// ================================================================

/**
 * Extract all citation keys referenced in markdown text.
 * Pandoc-style: [@key], [@key1; @key2], @key
 */
function extractCitations(md) {
  const keys = new Set();
  const occurrences = [];

  const lines = md.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Bracketed citations: [@key], [@key1; @key2], [-@key]
    const bracketPattern = /\[([^\]]*@[^\]]*)\]/g;
    let m;
    while ((m = bracketPattern.exec(line)) !== null) {
      const inner = m[1];
      const keyPattern = /-?@([A-Za-z0-9:_\-]+)/g;
      let km;
      while ((km = keyPattern.exec(inner)) !== null) {
        keys.add(km[1]);
        occurrences.push({ key: km[1], line: i + 1, context: line.trim().slice(0, 80) });
      }
    }

    // Inline citations: @key (not inside brackets, not email)
    const inlinePattern = /(?<!\w)@([A-Za-z][A-Za-z0-9:_\-]+)(?!\w)/g;
    while ((m = inlinePattern.exec(line)) !== null) {
      // Skip if already found in brackets on this line
      if (!occurrences.find(o => o.key === m[1] && o.line === i + 1)) {
        keys.add(m[1]);
        occurrences.push({ key: m[1], line: i + 1, context: line.trim().slice(0, 80) });
      }
    }
  }

  return {
    keys: [...keys],
    count: keys.size,
    occurrences,
  };
}

/**
 * Cross-reference citations in markdown against a bibliography.
 * Returns undefined citations and unused entries.
 */
function crossReference(md, bibContent) {
  const citations = extractCitations(md);
  const { entries } = parseBibTeX(bibContent);
  const bibKeys = new Set(entries.map(e => e.key));

  const undefined_ = citations.keys.filter(k => !bibKeys.has(k));
  const unused = entries.filter(e => !citations.keys.includes(e.key)).map(e => e.key);

  return {
    totalCited: citations.count,
    totalBibEntries: entries.length,
    undefinedCitations: undefined_.map(k => ({
      key: k,
      occurrences: citations.occurrences.filter(o => o.key === k),
      severity: 'error',
      message: `Citation "@${k}" is used in the manuscript but not defined in the bibliography.`,
    })),
    unusedEntries: unused.map(k => ({
      key: k,
      severity: 'info',
      message: `Bibliography entry "${k}" is not cited in the manuscript.`,
    })),
    matched: citations.keys.filter(k => bibKeys.has(k)),
  };
}

// ================================================================
// Citation Style Preview
// ================================================================

/** Render a citation preview for a given template/style */
function previewCitation(entry, style = 'chicago') {
  const { fields, type } = entry;
  const author = fields.author || 'Unknown';
  const title = fields.title || 'Untitled';
  const year = fields.year || 'n.d.';

  switch (style) {
    case 'chicago': {
      // Chicago author-date
      if (type === 'book') {
        return `${author}. ${year}. *${title}*. ${fields.publisher || ''}.`;
      }
      if (type === 'article') {
        return `${author}. ${year}. "${title}." *${fields.journal || ''}* ${fields.volume || ''}${fields.number ? ` (${fields.number})` : ''}: ${fields.pages || ''}.`;
      }
      return `${author}. ${year}. "${title}."`;
    }
    case 'apa': {
      return `${author} (${year}). ${title}. ${fields.publisher || fields.journal || ''}.`;
    }
    case 'mla': {
      return `${author}. "${title}." *${fields.journal || fields.publisher || ''}*, ${year}.`;
    }
    default:
      return `${author}, "${title}", ${year}.`;
  }
}

// ================================================================
// Exports
// ================================================================

module.exports = {
  validateCitationKey,
  parseBibTeX,
  validateBibliography,
  extractCitations,
  crossReference,
  previewCitation,
  REQUIRED_FIELDS,
};
