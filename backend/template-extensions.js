/**
 * Template Extension System
 *
 * Governed extension system: small, safe overrides in a controlled layer.
 * Authors can customise "Chicago, but with our house style" without
 * hacking LaTeX directly. Tokens for typography and layout, plus a
 * constraints model so the system still guarantees correctness.
 */

// ================================================================
// Extension Token Schema
// ================================================================

/**
 * All tokens that can be overridden, with their types, constraints,
 * and default values per template category.
 */
const TOKEN_SCHEMA = {
  // ── Typography tokens ──
  fontSize: {
    type: 'number',
    unit: 'pt',
    label: 'Base font size',
    min: 8,
    max: 16,
    defaults: { academic: 12, trade: 11, editorial: 10.5, corporate: 11, creative: 11, basic: 12 },
  },
  lineHeight: {
    type: 'number',
    unit: 'ratio',
    label: 'Line height multiplier',
    min: 1.0,
    max: 2.0,
    step: 0.05,
    defaults: { academic: 1.15, trade: 1.35, editorial: 1.2, corporate: 1.15, creative: 1.2, basic: 1.15 },
  },
  paragraphIndent: {
    type: 'number',
    unit: 'em',
    label: 'Paragraph indent',
    min: 0,
    max: 4,
    step: 0.25,
    defaults: { academic: 1.5, trade: 1.5, editorial: 0, corporate: 1.5, creative: 0, basic: 1.5 },
  },
  paragraphSpacing: {
    type: 'number',
    unit: 'pt',
    label: 'Paragraph spacing (parskip)',
    min: 0,
    max: 18,
    defaults: { academic: 0, trade: 0, editorial: 6, corporate: 0, creative: 8, basic: 0 },
  },

  // ── Heading tokens ──
  chapterDropHeight: {
    type: 'number',
    unit: 'pt',
    label: 'Chapter opening vertical drop',
    min: 0,
    max: 120,
    defaults: { academic: 50, trade: 48, editorial: 30, corporate: 40, creative: 60, basic: 40 },
  },
  headingColor: {
    type: 'color',
    label: 'Heading accent color',
    pattern: /^#[0-9a-fA-F]{6}$/,
    defaults: { academic: '#800020', trade: '#000000', editorial: '#000000', corporate: '#191970', creative: '#000000', basic: '#000000' },
  },
  headingStyle: {
    type: 'enum',
    label: 'Heading capitalization',
    options: ['normal', 'smallcaps', 'uppercase', 'italic'],
    defaults: { academic: 'smallcaps', trade: 'normal', editorial: 'uppercase', corporate: 'normal', creative: 'uppercase', basic: 'normal' },
  },

  // ── Layout tokens ──
  headerStyle: {
    type: 'enum',
    label: 'Running header style',
    options: ['title-chapter', 'chapter-only', 'none', 'page-only'],
    defaults: { academic: 'title-chapter', trade: 'title-chapter', editorial: 'chapter-only', corporate: 'title-chapter', creative: 'none', basic: 'page-only' },
  },
  footerPagePosition: {
    type: 'enum',
    label: 'Page number position',
    options: ['center', 'outside', 'inside', 'none'],
    defaults: { academic: 'outside', trade: 'center', editorial: 'outside', corporate: 'center', creative: 'center', basic: 'center' },
  },
  blockquoteStyle: {
    type: 'enum',
    label: 'Blockquote style',
    options: ['indented', 'italic-indented', 'bar-left', 'centered'],
    defaults: { academic: 'indented', trade: 'italic-indented', editorial: 'bar-left', corporate: 'indented', creative: 'centered', basic: 'indented' },
  },

  // ── Spacing tokens ──
  sectionSpacingAbove: {
    type: 'number',
    unit: 'pt',
    label: 'Space above sections',
    min: 6,
    max: 48,
    defaults: { academic: 24, trade: 18, editorial: 18, corporate: 24, creative: 24, basic: 18 },
  },
  sectionSpacingBelow: {
    type: 'number',
    unit: 'pt',
    label: 'Space below sections',
    min: 4,
    max: 24,
    defaults: { academic: 12, trade: 8, editorial: 8, corporate: 12, creative: 12, basic: 8 },
  },
};

// ================================================================
// Validation
// ================================================================

/**
 * Validate an extension token value against its schema.
 *
 * @param {string} tokenName — name from TOKEN_SCHEMA
 * @param {*} value          — the proposed value
 * @returns {{ valid, value, error? }}
 */
function validateToken(tokenName, value) {
  const schema = TOKEN_SCHEMA[tokenName];
  if (!schema) {
    return { valid: false, value, error: `Unknown token "${tokenName}".` };
  }

  switch (schema.type) {
    case 'number': {
      const num = parseFloat(value);
      if (isNaN(num)) return { valid: false, value, error: `${schema.label} must be a number.` };
      if (num < schema.min) return { valid: false, value, error: `${schema.label} minimum is ${schema.min}${schema.unit}.` };
      if (num > schema.max) return { valid: false, value, error: `${schema.label} maximum is ${schema.max}${schema.unit}.` };
      return { valid: true, value: num };
    }
    case 'color': {
      if (!schema.pattern.test(value)) return { valid: false, value, error: `${schema.label} must be a hex color (#RRGGBB).` };
      return { valid: true, value };
    }
    case 'enum': {
      if (!schema.options.includes(value)) return { valid: false, value, error: `${schema.label} must be one of: ${schema.options.join(', ')}.` };
      return { valid: true, value };
    }
    default:
      return { valid: false, value, error: `Unknown token type "${schema.type}".` };
  }
}

/**
 * Validate a full set of extension overrides.
 *
 * @param {object} extensions — { tokenName: value, ... }
 * @param {string} templateType — 'academic' | 'trade' | etc.
 * @returns {{ valid, resolvedTokens, errors }}
 */
function validateExtensions(extensions, templateType = 'academic') {
  const errors = [];
  const resolvedTokens = {};

  // Start with defaults for this template type
  for (const [name, schema] of Object.entries(TOKEN_SCHEMA)) {
    resolvedTokens[name] = schema.defaults[templateType] ?? schema.defaults.academic;
  }

  // Apply overrides
  for (const [name, value] of Object.entries(extensions)) {
    const result = validateToken(name, value);
    if (result.valid) {
      resolvedTokens[name] = result.value;
    } else {
      errors.push({ token: name, value, error: result.error });
    }
  }

  return {
    valid: errors.length === 0,
    resolvedTokens,
    errors,
    overrideCount: Object.keys(extensions).length,
  };
}

// ================================================================
// LaTeX Generation from Tokens
// ================================================================

/**
 * Generate LaTeX preamble from resolved extension tokens.
 *
 * @param {object} tokens — resolved tokens from validateExtensions
 * @returns {string} LaTeX preamble snippet
 */
function generateExtensionPreamble(tokens) {
  const commands = ['% ── Template Extension System ──'];

  // Font size (applied via \fontsize in document)
  if (tokens.fontSize) {
    commands.push(`\\renewcommand{\\normalsize}{\\fontsize{${tokens.fontSize}pt}{${Math.round(tokens.fontSize * tokens.lineHeight)}pt}\\selectfont}`);
  }

  // Line height
  if (tokens.lineHeight) {
    commands.push(`\\setstretch{${tokens.lineHeight}}`);
  }

  // Paragraph indent
  if (tokens.paragraphIndent !== undefined) {
    commands.push(`\\setlength{\\parindent}{${tokens.paragraphIndent}em}`);
  }

  // Paragraph spacing
  if (tokens.paragraphSpacing !== undefined) {
    commands.push(`\\setlength{\\parskip}{${tokens.paragraphSpacing}pt}`);
  }

  // Heading color
  if (tokens.headingColor && tokens.headingColor !== '#000000') {
    const hex = tokens.headingColor.replace('#', '');
    commands.push(`\\definecolor{headingaccent}{HTML}{${hex}}`);
  }

  // Chapter drop height
  if (tokens.chapterDropHeight !== undefined) {
    commands.push(`\\titlespacing*{\\chapter}{0pt}{${tokens.chapterDropHeight}pt}{30pt}`);
  }

  // Section spacing
  if (tokens.sectionSpacingAbove && tokens.sectionSpacingBelow) {
    commands.push(`\\titlespacing*{\\section}{0pt}{${tokens.sectionSpacingAbove}pt}{${tokens.sectionSpacingBelow}pt}`);
  }

  return commands.join('\n');
}

/**
 * Get the full token schema with defaults for a template type.
 * Used by the frontend to render the extension editor.
 */
function getTokenSchemaForTemplate(templateType) {
  const schema = {};
  for (const [name, def] of Object.entries(TOKEN_SCHEMA)) {
    schema[name] = {
      ...def,
      default: def.defaults[templateType] ?? def.defaults.academic,
    };
    // Remove the full defaults map from the public API
    delete schema[name].defaults;
  }
  return schema;
}

// ================================================================
// Exports
// ================================================================

module.exports = {
  TOKEN_SCHEMA,
  validateToken,
  validateExtensions,
  generateExtensionPreamble,
  getTokenSchemaForTemplate,
};
