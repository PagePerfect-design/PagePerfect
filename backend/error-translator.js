/**
 * Error Translator — converts raw LaTeX/Pandoc stderr into structured,
 * human-readable error objects with fix suggestions.
 *
 * This is the SINGLE source of truth for error classification in the compile
 * pipeline. Both success-path warnings and failure-path errors flow through
 * this module so the frontend receives consistent structured objects.
 *
 * Used by compile-worker.js on both success and failure paths.
 */

const { parseMissingCitations, parseMissingPackages } = require('./compile-utils');

// ================================================================
// Error Pattern Registry — exhaustive patterns from stderr
// ================================================================

const ERROR_PATTERNS = [
  // ── Font errors (blocking) ──
  {
    pattern: /The font "([^"]+)" cannot be found/i,
    severity: 'error',
    category: 'font',
    translate: (m) => ({
      message: `Font "${m[1]}" is not available on the server`,
      fix: 'Try a different template — each template bundles its own fonts.',
    }),
  },
  {
    pattern: /Package fontspec Error.*?"([^"]+)"/i,
    severity: 'error',
    category: 'font',
    translate: (m) => ({
      message: `Font "${m[1]}" is not available on the server`,
      fix: 'Try a different template.',
    }),
  },
  {
    pattern: /luaotfload.*cannot/i,
    severity: 'error',
    category: 'font',
    translate: () => ({
      message: 'A font could not be loaded by the engine',
      fix: 'Try a different template.',
    }),
  },

  // ── Syntax errors (blocking) ──
  {
    pattern: /Missing \$ inserted/g,
    severity: 'error',
    category: 'syntax',
    translate: () => ({
      message: 'Special character (like _ or ^) found outside math mode',
      fix: 'Remove underscores/carets from regular text, or wrap math expressions in $...$.',
    }),
  },
  {
    pattern: /Double superscript|Double subscript/i,
    severity: 'error',
    category: 'syntax',
    translate: () => ({
      message: 'Consecutive ^ or _ characters found',
      fix: 'Use {braces} to group them, or remove the duplicates.',
    }),
  },
  {
    pattern: /Extra alignment tab/i,
    severity: 'error',
    category: 'syntax',
    translate: () => ({
      message: 'A table row has too many columns',
      fix: 'Check that each row has the same number of column separators.',
    }),
  },
  {
    pattern: /Undefined control sequence.*?\\(\w+)/g,
    severity: 'error',
    category: 'syntax',
    translate: (m) => ({
      message: `Unknown command "\\${m[1]}"`,
      fix: 'Remove the backslash command from your text. Markdown does not use LaTeX commands.',
    }),
  },
  {
    pattern: /Runaway argument/i,
    severity: 'error',
    category: 'syntax',
    translate: () => ({
      message: 'Unmatched bracket or brace in your text',
      fix: 'Check for missing closing braces } or brackets ].',
    }),
  },
  {
    pattern: /Emergency stop/i,
    severity: 'error',
    category: 'syntax',
    translate: () => ({
      message: 'The typesetter encountered a critical error and stopped',
      fix: 'Simplify your manuscript and try again.',
    }),
  },
  {
    pattern: /Missing \\begin\{document\}/i,
    severity: 'error',
    category: 'syntax',
    translate: () => ({
      message: 'Template configuration error',
      fix: 'Try a different template or contact support.',
    }),
  },

  // ── Layout warnings (non-fatal but important for print) ──
  {
    pattern: /Overfull \\hbox.*?(\d+\.?\d*)pt too wide/g,
    severity: 'warn',
    category: 'layout',
    translate: (m) => ({
      message: `Content overflows margins by ${m[1]}pt`,
      fix: 'Rephrase the paragraph, use a wider margin preset, or choose a larger page size.',
      kdpImpact: parseFloat(m[1]) > 10 ? 'May cause text to be cut off in print' : 'Minor — usually acceptable',
    }),
  },
  {
    pattern: /Underfull \\hbox.*?badness (\d+)/g,
    severity: 'info',
    category: 'layout',
    translate: (m) => ({
      message: `Line has excessive word spacing (badness ${m[1]})`,
      fix: parseInt(m[1]) > 8000
        ? 'Rephrase the sentence for a more natural word distribution.'
        : 'Minor spacing adjustment — usually fine for print.',
      kdpImpact: 'Cosmetic only — will not cause rejection',
    }),
  },
  {
    pattern: /Overfull \\vbox/g,
    severity: 'info',
    category: 'layout',
    translate: () => ({
      message: 'A page has more content than it can hold',
      fix: 'The engine will push extra content to the next page. This is usually fine.',
    }),
  },
  {
    pattern: /Underfull \\vbox/g,
    severity: 'info',
    category: 'layout',
    translate: () => ({
      message: 'A page has less content than ideal',
      fix: 'Extra white space at the bottom. Cosmetic only.',
    }),
  },
  {
    pattern: /Too many unprocessed floats/g,
    severity: 'warn',
    category: 'layout',
    translate: () => ({
      message: 'Too many images or tables queued without enough text between them',
      fix: 'Add more body text between consecutive figures, or reduce image count per section.',
      kdpImpact: 'May cause images to appear out of order or at document end',
    }),
  },
  {
    pattern: /Float\(s\) lost/g,
    severity: 'warn',
    category: 'layout',
    translate: () => ({
      message: 'An image or table could not be placed on the page',
      fix: 'Try reducing the number of consecutive figures.',
    }),
  },

  // ── Font/character warnings ──
  {
    pattern: /Missing character:.*?U\+([0-9A-F]+)/g,
    severity: 'warn',
    category: 'font',
    translate: (m) => ({
      message: `Character U+${m[1]} not available in current font`,
      fix: 'The character will appear as a blank space. Remove it or try a template with broader Unicode support.',
      kdpImpact: 'Blank space in PDF — KDP will not reject but readers will notice',
    }),
  },

  // ── Image/figure errors ──
  {
    pattern: /Cannot determine size of graphic.*?([^\s]+)/i,
    severity: 'error',
    category: 'image',
    translate: (m) => {
      const filename = m[1].split('/').pop();
      return {
        message: `Image "${filename}" has no size information`,
        fix: 'Re-export the image as PNG or JPG.',
      };
    },
  },
  {
    pattern: /Unknown graphics extension/i,
    severity: 'error',
    category: 'image',
    translate: () => ({
      message: 'An image uses an unsupported format',
      fix: 'Convert it to PNG, JPG, or PDF.',
    }),
  },

  // ── Memory/capacity errors ──
  {
    pattern: /TeX capacity exceeded.*pool size/i,
    severity: 'error',
    category: 'capacity',
    translate: () => ({
      message: 'Your manuscript is too complex for a single compile',
      fix: 'Try splitting into smaller sections.',
    }),
  },
  {
    pattern: /TeX capacity exceeded.*main memory/i,
    severity: 'error',
    category: 'capacity',
    translate: () => ({
      message: 'The typesetter ran out of memory',
      fix: 'Reduce image count or split into smaller sections.',
    }),
  },
  {
    pattern: /TeX capacity exceeded/i,
    severity: 'error',
    category: 'capacity',
    translate: () => ({
      message: 'The typesetter exceeded its capacity',
      fix: 'Simplify complex sections or reduce image count.',
    }),
  },

  // ── Encoding errors ──
  {
    pattern: /Invalid UTF-?8/i,
    severity: 'error',
    category: 'encoding',
    translate: () => ({
      message: 'Your manuscript contains invalid characters',
      fix: 'Paste your text through a plain text editor to clean encoding.',
    }),
  },
  {
    pattern: /inputenc Error.*Invalid.*byte/i,
    severity: 'error',
    category: 'encoding',
    translate: () => ({
      message: 'A non-standard character was found',
      fix: 'Try removing special symbols or pasting from a plain text editor.',
    }),
  },

  // ── Package errors ──
  {
    pattern: /Package titlesec Error.*?[Ee]ntered in horizontal mode/i,
    severity: 'error',
    category: 'package',
    translate: () => ({
      message: 'A heading was placed in an unexpected context',
      fix: 'Add a blank line before the heading in your manuscript. If this persists, try a different template.',
    }),
  },
  {
    pattern: /! LaTeX Error:\s*(.{1,120})/i,
    severity: 'error',
    category: 'package',
    translate: (m) => ({
      message: m[1].trim().replace(/\.+$/, ''),
      fix: 'Try a different template.',
    }),
  },
  {
    pattern: /Package .* Error/i,
    severity: 'error',
    category: 'package',
    translate: () => ({
      message: 'A LaTeX package reported an error',
      fix: 'Try a different template.',
    }),
  },

  // ── PDF/X conversion ──
  {
    pattern: /pdfx.*conversion.*fail/i,
    severity: 'error',
    category: 'pdfx',
    translate: () => ({
      message: 'PDF/X-1a conversion failed',
      fix: 'Try standard PDF export instead of PDF/X-1a.',
    }),
  },
  {
    pattern: /Ghostscript.*error/i,
    severity: 'error',
    category: 'pdfx',
    translate: () => ({
      message: 'Post-processing failed',
      fix: 'Try exporting as standard PDF instead of PDF/X-1a.',
    }),
  },

  // ── Server/engine errors (from spawn failures) ──
  {
    pattern: /(?:xelatex|lualatex).*not found/i,
    severity: 'error',
    category: 'server',
    translate: () => ({
      message: 'Server configuration error — typesetting engine not available',
      fix: 'This is a server issue. Please try again later.',
    }),
  },
  {
    pattern: /pandoc.*not found/i,
    severity: 'error',
    category: 'server',
    translate: () => ({
      message: 'Server configuration error — document converter not available',
      fix: 'This is a server issue. Please try again later.',
    }),
  },
  {
    pattern: /Error\s+\d+\s+\(driver return code\)/i,
    severity: 'error',
    category: 'server',
    translate: () => ({
      message: 'The PDF engine encountered a driver error',
      fix: 'Try a different template or simplify your manuscript.',
    }),
  },

  // ── File reference errors ──
  {
    pattern: /I can't find file.*[`']([^`']+)[`']/i,
    severity: 'error',
    category: 'file',
    translate: (m) => ({
      message: `Referenced file "${m[1]}" was not found`,
      fix: 'Check your file references.',
    }),
  },

  // ── Disk space / I/O errors ──
  {
    pattern: /No space left on device/i,
    severity: 'error',
    category: 'server',
    translate: () => ({
      message: 'The server ran out of disk space during compilation',
      fix: 'This is a temporary server issue. Please try again in a few minutes.',
    }),
  },
  {
    pattern: /I can't write on file/i,
    severity: 'error',
    category: 'server',
    translate: () => ({
      message: 'The server could not write output files (disk may be full)',
      fix: 'This is a temporary server issue. Please try again in a few minutes.',
    }),
  },

  // ── Lua runtime errors (LuaTeX-specific) ──
  {
    pattern: /LuaTeX error.*?:\s*(.{1,150})/i,
    severity: 'error',
    category: 'syntax',
    translate: (m) => ({
      message: `LuaTeX engine error: ${m[1].trim().replace(/\.+$/, '')}`,
      fix: 'Try a different template. If the problem persists, simplify your manuscript.',
    }),
  },
  {
    pattern: /attempt to call a nil value/i,
    severity: 'error',
    category: 'server',
    translate: () => ({
      message: 'A required Lua function is not available in this TeX installation',
      fix: 'Try a different template.',
    }),
  },

  // ── Pandoc conversion errors ──
  {
    pattern: /Error reading (?:bibliography|CSL)/i,
    severity: 'error',
    category: 'citation',
    translate: () => ({
      message: 'Could not read the bibliography or citation style file',
      fix: 'Check your citation format. Switch to Standard Mode to skip bibliography processing.',
    }),
  },
  {
    pattern: /Could not convert (?:image|figure)/i,
    severity: 'error',
    category: 'image',
    translate: () => ({
      message: 'An image could not be converted for PDF output',
      fix: 'Try re-exporting the image as PNG or JPG.',
    }),
  },

  // ── Permission errors ──
  {
    pattern: /Permission denied/i,
    severity: 'error',
    category: 'server',
    translate: () => ({
      message: 'Server permission error during compilation',
      fix: 'This is a server configuration issue. Please try again later.',
    }),
  },
];

// ================================================================
// Deduplication helper
// ================================================================

function dedupe(arr) {
  const seen = new Set();
  return arr.filter(item => {
    if (seen.has(item.message)) return false;
    seen.add(item.message);
    return true;
  });
}

// ================================================================
// Main Translation Function — used on SUCCESS path for advisory warnings
// ================================================================

/**
 * Translate raw stderr into structured error/warning objects.
 *
 * @param {string} stderr - Raw stderr from LuaLaTeX/Pandoc
 * @returns {{ errors: Array, warnings: Array, summary: object }}
 */
function translateStderr(stderr) {
  if (!stderr || typeof stderr !== 'string') {
    return { errors: [], warnings: [], summary: { total: 0, critical: 0, cosmetic: 0 } };
  }

  const errors = [];
  const warnings = [];

  for (const entry of ERROR_PATTERNS) {
    const regex = new RegExp(entry.pattern.source, entry.pattern.flags);
    let match;
    while ((match = regex.exec(stderr)) !== null) {
      const translated = entry.translate(match);
      const item = {
        ...translated,
        severity: entry.severity,
        category: entry.category,
        raw: match[0].slice(0, 200),
      };

      if (entry.severity === 'error') {
        errors.push(item);
      } else {
        warnings.push(item);
      }
    }
  }

  const dedupedErrors = dedupe(errors);
  const dedupedWarnings = dedupe(warnings);

  return {
    errors: dedupedErrors,
    warnings: dedupedWarnings,
    summary: {
      total: dedupedErrors.length + dedupedWarnings.length,
      critical: dedupedErrors.length,
      cosmetic: dedupedWarnings.filter(w => w.severity === 'info').length,
    },
  };
}

// ================================================================
// Failure Translation — used on FAILURE path for structured error responses
// ================================================================

/**
 * Translate a compile failure into structured error objects.
 * Replaces the old buildErrorMessages() with a richer, structured output.
 *
 * @param {string} stderr - Raw stderr from LuaLaTeX/Pandoc
 * @param {object} opts
 * @param {boolean} [opts.safeMode=false]
 * @param {string} [opts.errorCode] - Error code from the compile result (e.g. 'compile_timeout')
 * @returns {{ errors: Array<{message: string, fix: string|null, severity: string, category: string}>, fallbackMessage: string }}
 */
function translateCompileFailure(stderr, { safeMode = false, errorCode } = {}) {
  const errors = [];

  // Handle non-stderr error codes first
  if (errorCode === 'compile_timeout') {
    errors.push({
      message: 'Compilation timed out',
      fix: 'Try Fast compile mode, or split into smaller sections.',
      severity: 'error',
      category: 'timeout',
    });
  }
  if (errorCode === 'spawn_failed') {
    errors.push({
      message: 'The typesetting engine failed to start',
      fix: 'This is a server issue. Please try again later.',
      severity: 'error',
      category: 'server',
    });
  }

  // Run all stderr patterns
  if (stderr && typeof stderr === 'string') {
    for (const entry of ERROR_PATTERNS) {
      // Only collect errors and warnings (skip info for failure path)
      if (entry.severity === 'info') continue;

      const regex = new RegExp(entry.pattern.source, entry.pattern.flags);
      let match;
      while ((match = regex.exec(stderr)) !== null) {
        const translated = entry.translate(match);
        errors.push({
          message: translated.message,
          fix: translated.fix || null,
          severity: entry.severity,
          category: entry.category,
        });
      }
    }

    // Extract missing citations (uses dedicated multi-pattern parser)
    if (!safeMode) {
      const missCit = parseMissingCitations(stderr);
      if (missCit.length) {
        errors.push({
          message: `Undefined citations: ${missCit.join(', ')}`,
          fix: 'Check the citation keys or switch to Standard Mode to skip bibliography.',
          severity: 'error',
          category: 'citation',
        });
      }
    }

    // Extract missing packages (uses dedicated parser)
    const missPkg = parseMissingPackages(stderr);
    if (missPkg.length) {
      errors.push({
        message: `Missing LaTeX packages: ${missPkg.join(', ')}`,
        fix: 'Try a different template.',
        severity: 'error',
        category: 'package',
      });
    }
  }

  // Deduplicate
  const deduped = dedupe(errors);

  // Fallback if no patterns matched
  if (deduped.length === 0) {
    deduped.push({
      message: 'Typesetting failed. Please review your Markdown.',
      fix: null,
      severity: 'error',
      category: 'unknown',
    });
  }

  // Add safe mode note if applicable
  if (safeMode) {
    deduped.push({
      message: 'Standard mode was enabled — citations were not processed',
      fix: null,
      severity: 'info',
      category: 'info',
    });
  }

  // Build flat fallback message for backward compat
  const fallbackMessage = deduped
    .filter(e => e.severity === 'error')
    .map(e => e.message + '.')
    .join(' ') || 'Typesetting failed.';

  return { errors: deduped, fallbackMessage };
}

// ================================================================
// Exports
// ================================================================

module.exports = { translateStderr, translateCompileFailure, ERROR_PATTERNS };
