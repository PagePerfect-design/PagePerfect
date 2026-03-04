/**
 * Typst Error Translator — lightweight parser for Typst compilation errors.
 *
 * Typst errors are already human-readable with file, line, column info.
 * This module provides structured extraction rather than the heavy regex
 * translation needed for LaTeX's cryptic error messages.
 *
 * Typst error format:
 *   error: file.typ:12:5: unknown variable: foo
 *   warning: file.typ:30:1: content does not fit
 */

'use strict';

const SERVER_ERROR_CATEGORIES = new Set(['server', 'engine']);

/**
 * Parse a single Typst error/warning line into a structured object.
 */
function parseLine(line) {
  // Typst format: "error: <file>:<line>:<col>: <message>"
  const errorMatch = line.match(/^error:\s+(?:(.+?):(\d+):(\d+):\s+)?(.+)/);
  if (errorMatch) {
    return {
      severity: 'error',
      file: errorMatch[1] || null,
      line: errorMatch[2] ? parseInt(errorMatch[2]) : null,
      column: errorMatch[3] ? parseInt(errorMatch[3]) : null,
      message: errorMatch[4].trim(),
      category: classifyError(errorMatch[4]),
      raw: line,
    };
  }

  const warnMatch = line.match(/^warning:\s+(?:(.+?):(\d+):(\d+):\s+)?(.+)/);
  if (warnMatch) {
    return {
      severity: 'warn',
      file: warnMatch[1] || null,
      line: warnMatch[2] ? parseInt(warnMatch[2]) : null,
      column: warnMatch[3] ? parseInt(warnMatch[3]) : null,
      message: warnMatch[4].trim(),
      category: 'layout',
      raw: line,
    };
  }

  return null;
}

/**
 * Classify a Typst error message into a category.
 */
function classifyError(msg) {
  const lower = msg.toLowerCase();
  if (lower.includes('unknown font') || lower.includes('font')) return 'font';
  if (lower.includes('unknown variable') || lower.includes('expected')) return 'syntax';
  if (lower.includes('not found') || lower.includes('file')) return 'file';
  if (lower.includes('image') || lower.includes('decode')) return 'image';
  if (lower.includes('overflow') || lower.includes('fit')) return 'layout';
  return 'unknown';
}

/**
 * Generate a human-readable fix suggestion for a Typst error.
 */
function suggestFix(parsed) {
  switch (parsed.category) {
    case 'font':
      return 'Try a different template — each template bundles its own fonts.';
    case 'syntax':
      return 'Check your manuscript for special characters or formatting issues.';
    case 'file':
      return 'An image or included file could not be found. Check your file references.';
    case 'image':
      return 'An image could not be processed. Try re-exporting as PNG or JPG.';
    case 'layout':
      return 'Content overflows the page. Try wider margins or a larger page size.';
    default:
      return 'Simplify your manuscript and try again.';
  }
}

/**
 * Translate raw Typst stderr into structured error/warning objects.
 *
 * @param {string} stderr - Raw stderr from Typst compilation
 * @returns {{ errors: Array, warnings: Array, summary: object }}
 */
function translateStderr(stderr) {
  if (!stderr || typeof stderr !== 'string') {
    return { errors: [], warnings: [], summary: { total: 0, critical: 0, cosmetic: 0 } };
  }

  const errors = [];
  const warnings = [];
  const seen = new Set();

  for (const line of stderr.split('\n')) {
    const parsed = parseLine(line.trim());
    if (!parsed) continue;

    // Deduplicate by message
    if (seen.has(parsed.message)) continue;
    seen.add(parsed.message);

    const isServer = SERVER_ERROR_CATEGORIES.has(parsed.category);
    const item = {
      message: parsed.message,
      fix: suggestFix(parsed),
      severity: parsed.severity,
      category: parsed.category,
      isServerError: isServer,
      file: parsed.file,
      line: parsed.line,
      column: parsed.column,
      raw: parsed.raw.slice(0, 200),
    };

    if (parsed.severity === 'error') {
      errors.push(item);
    } else {
      warnings.push(item);
    }
  }

  return {
    errors,
    warnings,
    summary: {
      total: errors.length + warnings.length,
      critical: errors.length,
      cosmetic: warnings.length,
      serverErrors: errors.filter(e => e.isServerError).length,
      clientErrors: errors.filter(e => !e.isServerError).length,
    },
  };
}

/**
 * Translate a Typst compile failure into structured error objects.
 *
 * @param {string} stderr
 * @param {object} opts
 * @returns {{ errors: Array, fallbackMessage: string }}
 */
function translateCompileFailure(stderr, { safeMode = false, errorCode } = {}) {
  const errors = [];

  if (errorCode === 'compile_timeout') {
    errors.push({
      message: 'Compilation timed out',
      fix: 'Try splitting into smaller sections.',
      severity: 'error',
      category: 'timeout',
      isServerError: false,
    });
  }
  if (errorCode === 'spawn_failed') {
    errors.push({
      message: 'The Typst engine failed to start',
      fix: 'This is a server issue. Please try again later.',
      severity: 'error',
      category: 'server',
      isServerError: true,
    });
  }

  if (stderr && typeof stderr === 'string') {
    const result = translateStderr(stderr);
    errors.push(...result.errors);
  }

  if (errors.length === 0) {
    errors.push({
      message: 'Typesetting failed. Please review your Markdown.',
      fix: null,
      severity: 'error',
      category: 'unknown',
      isServerError: false,
    });
  }

  const fallbackMessage = errors
    .filter(e => e.severity === 'error')
    .map(e => e.message.endsWith('.') ? e.message : e.message + '.')
    .join(' ') || 'Typesetting failed.';

  return { errors, fallbackMessage };
}

module.exports = {
  translateStderr,
  translateCompileFailure,
};
