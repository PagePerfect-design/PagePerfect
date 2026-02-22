const {
  TOKEN_SCHEMA,
  validateToken,
  validateExtensions,
  generateExtensionPreamble,
  getTokenSchemaForTemplate,
} = require('../template-extensions');

// ================================================================
// Token Schema
// ================================================================

describe('TOKEN_SCHEMA', () => {
  it('has 12 tokens', () => {
    expect(Object.keys(TOKEN_SCHEMA)).toHaveLength(12);
  });

  it('every token has type, label, and defaults', () => {
    for (const [name, schema] of Object.entries(TOKEN_SCHEMA)) {
      expect(schema).toHaveProperty('type');
      expect(schema).toHaveProperty('label');
      expect(schema).toHaveProperty('defaults');
      expect(typeof schema.defaults).toBe('object');
    }
  });

  it('every token has defaults for all 6 categories', () => {
    const categories = ['academic', 'trade', 'editorial', 'corporate', 'creative', 'basic'];
    for (const [name, schema] of Object.entries(TOKEN_SCHEMA)) {
      for (const cat of categories) {
        expect(schema.defaults).toHaveProperty(cat);
      }
    }
  });

  it('number tokens have min, max', () => {
    const numberTokens = Object.entries(TOKEN_SCHEMA).filter(([, s]) => s.type === 'number');
    expect(numberTokens.length).toBeGreaterThan(0);
    for (const [name, schema] of numberTokens) {
      expect(typeof schema.min).toBe('number');
      expect(typeof schema.max).toBe('number');
      expect(schema.max).toBeGreaterThan(schema.min);
    }
  });

  it('enum tokens have options array', () => {
    const enumTokens = Object.entries(TOKEN_SCHEMA).filter(([, s]) => s.type === 'enum');
    expect(enumTokens.length).toBeGreaterThan(0);
    for (const [name, schema] of enumTokens) {
      expect(Array.isArray(schema.options)).toBe(true);
      expect(schema.options.length).toBeGreaterThan(1);
    }
  });

  it('color tokens have a regex pattern', () => {
    const colorTokens = Object.entries(TOKEN_SCHEMA).filter(([, s]) => s.type === 'color');
    expect(colorTokens.length).toBeGreaterThan(0);
    for (const [name, schema] of colorTokens) {
      expect(schema.pattern).toBeInstanceOf(RegExp);
    }
  });
});

// ================================================================
// validateToken
// ================================================================

describe('validateToken', () => {
  // Number type
  it('accepts valid number within range', () => {
    const result = validateToken('fontSize', 10);
    expect(result.valid).toBe(true);
    expect(result.value).toBe(10);
  });

  it('accepts number as string', () => {
    const result = validateToken('fontSize', '11');
    expect(result.valid).toBe(true);
    expect(result.value).toBe(11);
  });

  it('rejects number below min', () => {
    const result = validateToken('fontSize', 5);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/minimum/i);
  });

  it('rejects number above max', () => {
    const result = validateToken('fontSize', 20);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/maximum/i);
  });

  it('rejects NaN for number type', () => {
    const result = validateToken('fontSize', 'not-a-number');
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/must be a number/i);
  });

  it('accepts boundary values', () => {
    expect(validateToken('fontSize', 8).valid).toBe(true);   // min
    expect(validateToken('fontSize', 16).valid).toBe(true);  // max
  });

  // Color type
  it('accepts valid hex color', () => {
    const result = validateToken('headingColor', '#FF3333');
    expect(result.valid).toBe(true);
    expect(result.value).toBe('#FF3333');
  });

  it('rejects invalid hex color', () => {
    expect(validateToken('headingColor', 'red').valid).toBe(false);
    expect(validateToken('headingColor', '#FFF').valid).toBe(false);
    expect(validateToken('headingColor', '#GGGGGG').valid).toBe(false);
    expect(validateToken('headingColor', '').valid).toBe(false);
  });

  // Enum type
  it('accepts valid enum value', () => {
    const result = validateToken('headingStyle', 'smallcaps');
    expect(result.valid).toBe(true);
    expect(result.value).toBe('smallcaps');
  });

  it('rejects invalid enum value', () => {
    const result = validateToken('headingStyle', 'bold');
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/must be one of/i);
  });

  // Unknown token
  it('rejects unknown token name', () => {
    const result = validateToken('unknownToken', 42);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/unknown token/i);
  });
});

// ================================================================
// validateExtensions
// ================================================================

describe('validateExtensions', () => {
  it('returns defaults when no overrides given', () => {
    const result = validateExtensions({}, 'academic');
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.overrideCount).toBe(0);
    expect(result.resolvedTokens.fontSize).toBe(12); // academic default
  });

  it('applies valid overrides', () => {
    const result = validateExtensions({ fontSize: 14, headingColor: '#333333' }, 'trade');
    expect(result.valid).toBe(true);
    expect(result.resolvedTokens.fontSize).toBe(14);
    expect(result.resolvedTokens.headingColor).toBe('#333333');
    expect(result.overrideCount).toBe(2);
  });

  it('collects errors for invalid overrides', () => {
    const result = validateExtensions({ fontSize: 99, headingColor: 'bad' }, 'academic');
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(2);
    expect(result.errors[0]).toHaveProperty('token');
    expect(result.errors[0]).toHaveProperty('error');
  });

  it('keeps defaults for tokens not overridden', () => {
    const result = validateExtensions({ fontSize: 10 }, 'trade');
    expect(result.resolvedTokens.lineHeight).toBe(1.35); // trade default
    expect(result.resolvedTokens.paragraphIndent).toBe(1.5); // trade default
  });

  it('falls back to academic defaults for unknown category', () => {
    const result = validateExtensions({}, 'unknownCategory');
    expect(result.resolvedTokens.fontSize).toBe(12); // academic default
  });

  it('uses trade defaults correctly', () => {
    const result = validateExtensions({}, 'trade');
    expect(result.resolvedTokens.fontSize).toBe(11);
    expect(result.resolvedTokens.lineHeight).toBe(1.35);
    expect(result.resolvedTokens.paragraphIndent).toBe(1.5);
  });

  it('uses editorial defaults correctly', () => {
    const result = validateExtensions({}, 'editorial');
    expect(result.resolvedTokens.paragraphIndent).toBe(0);
    expect(result.resolvedTokens.paragraphSpacing).toBe(6);
    expect(result.resolvedTokens.headingStyle).toBe('uppercase');
  });
});

// ================================================================
// generateExtensionPreamble
// ================================================================

describe('generateExtensionPreamble', () => {
  const defaults = validateExtensions({}, 'academic').resolvedTokens;

  it('starts with comment header', () => {
    const preamble = generateExtensionPreamble(defaults);
    expect(preamble).toMatch(/% ── Template Extension System ──/);
  });

  it('includes font size renew command', () => {
    const preamble = generateExtensionPreamble(defaults);
    expect(preamble).toMatch(/\\renewcommand\{\\normalsize\}/);
    expect(preamble).toContain('12pt'); // academic fontSize default
  });

  it('includes line height', () => {
    const preamble = generateExtensionPreamble(defaults);
    expect(preamble).toMatch(/\\setstretch\{/);
  });

  it('includes parindent', () => {
    const preamble = generateExtensionPreamble(defaults);
    expect(preamble).toMatch(/\\setlength\{\\parindent\}/);
  });

  it('includes parskip', () => {
    const preamble = generateExtensionPreamble(defaults);
    expect(preamble).toMatch(/\\setlength\{\\parskip\}/);
  });

  it('defines heading color for non-black', () => {
    const tokens = { ...defaults, headingColor: '#800020' };
    const preamble = generateExtensionPreamble(tokens);
    expect(preamble).toMatch(/\\definecolor\{headingaccent\}\{HTML\}\{800020\}/);
  });

  it('skips heading color definition for black', () => {
    const tokens = { ...defaults, headingColor: '#000000' };
    const preamble = generateExtensionPreamble(tokens);
    expect(preamble).not.toMatch(/\\definecolor/);
  });

  it('includes chapter drop height', () => {
    const preamble = generateExtensionPreamble(defaults);
    expect(preamble).toMatch(/\\titlespacing\*\{\\chapter\}/);
  });

  it('includes section spacing', () => {
    const preamble = generateExtensionPreamble(defaults);
    expect(preamble).toMatch(/\\titlespacing\*\{\\section\}/);
  });
});

// ================================================================
// getTokenSchemaForTemplate
// ================================================================

describe('getTokenSchemaForTemplate', () => {
  it('returns schema with default values for the category', () => {
    const schema = getTokenSchemaForTemplate('trade');
    expect(schema.fontSize.default).toBe(11);
    expect(schema.lineHeight.default).toBe(1.35);
  });

  it('does not include the full defaults map', () => {
    const schema = getTokenSchemaForTemplate('academic');
    for (const [name, def] of Object.entries(schema)) {
      expect(def).not.toHaveProperty('defaults');
    }
  });

  it('preserves type, min, max, options metadata', () => {
    const schema = getTokenSchemaForTemplate('academic');
    expect(schema.fontSize.type).toBe('number');
    expect(schema.fontSize.min).toBe(8);
    expect(schema.fontSize.max).toBe(16);
    expect(schema.headingStyle.type).toBe('enum');
    expect(schema.headingStyle.options).toContain('smallcaps');
  });

  it('falls back to academic for unknown category', () => {
    const schema = getTokenSchemaForTemplate('mystery');
    expect(schema.fontSize.default).toBe(12); // academic
  });

  it('returns all 12 tokens', () => {
    const schema = getTokenSchemaForTemplate('corporate');
    expect(Object.keys(schema)).toHaveLength(12);
  });
});
