/**
 * LaTeX Sanitizer — Input sanitization for user-supplied strings
 * that enter the LaTeX compilation pipeline.
 *
 * SECURITY-CRITICAL: Any user-controlled string that reaches a .tex or
 * .latex file, or is passed as a Pandoc -M metadata value, MUST be
 * sanitized through this module to prevent LaTeX injection / RCE.
 *
 * LaTeX special characters: \ $ & % ^ _ { } ~ #
 * Additionally: | < > " (can cause issues in certain contexts)
 */

'use strict';

/**
 * Escape LaTeX special characters in a user-supplied string.
 * Converts dangerous characters to their LaTeX-safe equivalents.
 *
 * @param {string} input — raw user string
 * @returns {string} — string safe for LaTeX consumption
 */
function escapeLatex(input) {
  if (typeof input !== 'string') return '';

  // Order matters: backslash must be first (otherwise we'd double-escape)
  return input
    .replace(/\\/g, '\\textbackslash{}')
    .replace(/~/g, '\\textasciitilde{}')
    .replace(/\^/g, '\\textasciicircum{}')
    .replace(/&/g, '\\&')
    .replace(/%/g, '\\%')
    .replace(/\$/g, '\\$')
    .replace(/#/g, '\\#')
    .replace(/_/g, '\\_')
    .replace(/{/g, '\\{')
    .replace(/}/g, '\\}')
    .replace(/\|/g, '\\textbar{}')
    .replace(/</g, '\\textless{}')
    .replace(/>/g, '\\textgreater{}');
}

/**
 * Sanitize a title string for use in Pandoc -M title=VALUE.
 * Strips newlines, limits length, and escapes LaTeX specials.
 *
 * @param {string} title — raw user title
 * @param {number} [maxLen=200] — maximum character length
 * @returns {string} — sanitized title safe for LaTeX
 */
function sanitizeTitle(title, maxLen = 200) {
  if (typeof title !== 'string' || !title.trim()) return 'Manuscript';
  const cleaned = title.replace(/[\r\n\t]/g, ' ').trim().slice(0, maxLen);
  return escapeLatex(cleaned);
}

/**
 * Validate and sanitize a font name.
 * Font names should only contain alphanumeric characters, spaces, hyphens,
 * and periods. Reject anything else.
 *
 * @param {string} fontName — user-supplied font name
 * @returns {string|null} — sanitized font name, or null if invalid
 */
function sanitizeFontName(fontName) {
  if (typeof fontName !== 'string') return null;
  const cleaned = fontName.trim();
  // Allow only safe font name characters: letters, digits, spaces, hyphens, periods
  if (!/^[A-Za-z0-9 \-.]+$/.test(cleaned)) return null;
  if (cleaned.length > 100) return null;
  return cleaned;
}

/**
 * Sanitize a hex color value for LaTeX.
 * Accepts #RRGGBB format only.
 *
 * @param {string} color — user-supplied color
 * @returns {string|null} — valid hex color or null
 */
function sanitizeColor(color) {
  if (typeof color !== 'string') return null;
  const cleaned = color.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(cleaned)) return cleaned;
  return null;
}

/**
 * Sanitize an extension token value based on its schema type.
 * Returns the sanitized value or null if invalid.
 *
 * @param {*} value — user-supplied value
 * @param {object} schema — token schema entry (type, min, max, options, pattern)
 * @returns {*} — sanitized value or null
 */
function sanitizeExtensionValue(value, schema) {
  if (!schema) return null;

  switch (schema.type) {
    case 'number': {
      const num = Number(value);
      if (isNaN(num)) return null;
      if (schema.min !== undefined && num < schema.min) return null;
      if (schema.max !== undefined && num > schema.max) return null;
      return num;
    }
    case 'color':
      return sanitizeColor(value);
    case 'enum': {
      if (!Array.isArray(schema.options)) return null;
      if (!schema.options.includes(value)) return null;
      return value;
    }
    case 'boolean':
      return Boolean(value);
    default:
      // Unknown type — reject for safety
      return null;
  }
}

/**
 * Check a raw string for known LaTeX injection patterns.
 * Returns true if potentially malicious content is detected.
 *
 * @param {string} input — string to check
 * @returns {boolean} — true if suspicious
 */
function hasInjectionAttempt(input) {
  if (typeof input !== 'string') return false;

  const patterns = [
    /\\input\s*\{/i,
    /\\include\s*\{/i,
    /\\write18\s*\{/i,
    /\\immediate\s*\\write/i,
    /\\openout/i,
    /\\openin/i,
    /\\read\s/i,
    /\\catcode/i,
    /\\csname/i,
    /\\newwrite/i,
    /\\directlua/i,
    /\\luaexec/i,
    /\\luadirect/i,
    /\\ShellEscape/i,
    /\\write\s*\\(\w)/i,
  ];

  return patterns.some(re => re.test(input));
}

module.exports = {
  escapeLatex,
  sanitizeTitle,
  sanitizeFontName,
  sanitizeColor,
  sanitizeExtensionValue,
  hasInjectionAttempt,
};
