/**
 * Error Translator — converts raw LaTeX/Pandoc stderr into structured,
 * human-readable error objects with fix suggestions.
 *
 * Used by compile-worker.js to provide actionable error messages
 * instead of raw TeX output.
 */

// ================================================================
// Error Pattern Registry
// ================================================================

const ERROR_PATTERNS = [
  // ── Critical: Will cause KDP/IngramSpark rejection ──
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
    pattern: /Missing \$ inserted/g,
    severity: 'error',
    category: 'syntax',
    translate: () => ({
      message: 'Special character (like _ or ^) found outside math mode',
      fix: 'Remove underscores/carets from regular text, or wrap math expressions in $...$.',
      kdpImpact: 'Will prevent PDF generation',
    }),
  },
  {
    pattern: /Undefined control sequence.*?\\(\w+)/g,
    severity: 'error',
    category: 'syntax',
    translate: (m) => ({
      message: `Unknown command "\\${m[1]}"`,
      fix: 'Remove the backslash command from your text. Markdown does not use LaTeX commands.',
      kdpImpact: 'Will prevent PDF generation',
    }),
  },
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
];

// ================================================================
// Main Translation Function
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
    let match;
    const regex = new RegExp(entry.pattern.source, entry.pattern.flags);
    while ((match = regex.exec(stderr)) !== null) {
      const translated = entry.translate(match);
      const item = {
        ...translated,
        severity: entry.severity,
        category: entry.category,
        raw: match[0].slice(0, 200), // Truncate raw match
      };

      if (entry.severity === 'error') {
        errors.push(item);
      } else {
        warnings.push(item);
      }
    }
  }

  // Deduplicate by message
  const dedupe = (arr) => {
    const seen = new Set();
    return arr.filter(item => {
      if (seen.has(item.message)) return false;
      seen.add(item.message);
      return true;
    });
  };

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
// Exports
// ================================================================

module.exports = { translateStderr, ERROR_PATTERNS };
