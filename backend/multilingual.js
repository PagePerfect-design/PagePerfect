/**
 * Multilingual and Scripture-safe System
 *
 * Defines RTL support, mixed-direction paragraphs, Arabic shaping,
 * font fallback policies, safe defaults for diacritics, line breaking,
 * and Quranic citation formatting. Also handles CJK, Devanagari,
 * and complex script detection.
 */

const fontAvailability = require('./font-availability');

// ================================================================
// Script Detection
// ================================================================

/** Unicode ranges for script detection */
const SCRIPT_RANGES = {
  arabic:      { pattern: /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/, direction: 'rtl', label: 'Arabic', shaping: true },
  hebrew:      { pattern: /[\u0590-\u05FF\uFB1D-\uFB4F]/, direction: 'rtl', label: 'Hebrew', shaping: false },
  devanagari:  { pattern: /[\u0900-\u097F\uA8E0-\uA8FF]/, direction: 'ltr', label: 'Devanagari', shaping: true },
  cjk:         { pattern: /[\u4E00-\u9FFF\u3400-\u4DBF\u3000-\u303F\u3040-\u309F\u30A0-\u30FF]/, direction: 'ltr', label: 'CJK', shaping: false },
  thai:        { pattern: /[\u0E00-\u0E7F]/, direction: 'ltr', label: 'Thai', shaping: false },
  greek:       { pattern: /[\u0370-\u03FF\u1F00-\u1FFF]/, direction: 'ltr', label: 'Greek', shaping: false },
  cyrillic:    { pattern: /[\u0400-\u04FF\u0500-\u052F]/, direction: 'ltr', label: 'Cyrillic', shaping: false },
  latin:       { pattern: /[A-Za-z\u00C0-\u024F\u1E00-\u1EFF]/, direction: 'ltr', label: 'Latin', shaping: false },
  syriac:      { pattern: /[\u0700-\u074F]/, direction: 'rtl', label: 'Syriac', shaping: true },
  thaana:      { pattern: /[\u0780-\u07BF]/, direction: 'rtl', label: 'Thaana', shaping: true },
  ethiopic:    { pattern: /[\u1200-\u137F]/, direction: 'ltr', label: 'Ethiopic', shaping: false },
  georgian:    { pattern: /[\u10A0-\u10FF]/, direction: 'ltr', label: 'Georgian', shaping: false },
};

/** Extended diacritics detection */
const DIACRITICS_PATTERN = /[\u0300-\u036F\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7-\u06E8\u06EA-\u06ED\u0E31\u0E34-\u0E3A\u0E47-\u0E4E]/;

/**
 * Detect scripts present in text.
 *
 * @param {string} text
 * @returns {{ scripts: Array, primaryScript, isMultiscript, hasRTL, hasDiacritics }}
 */
function detectScripts(text) {
  const found = [];
  const charCounts = {};

  for (const [name, info] of Object.entries(SCRIPT_RANGES)) {
    const matches = text.match(new RegExp(info.pattern.source, 'g'));
    if (matches && matches.length > 0) {
      charCounts[name] = matches.length;
      found.push({
        script: name,
        label: info.label,
        direction: info.direction,
        shaping: info.shaping,
        charCount: matches.length,
        percentage: 0, // calculated below
      });
    }
  }

  const totalChars = Object.values(charCounts).reduce((a, b) => a + b, 0);
  for (const f of found) {
    f.percentage = totalChars > 0 ? Math.round((f.charCount / totalChars) * 100) : 0;
  }

  found.sort((a, b) => b.charCount - a.charCount);

  const hasRTL = found.some(f => f.direction === 'rtl');
  const hasDiacritics = DIACRITICS_PATTERN.test(text);

  return {
    scripts: found,
    primaryScript: found[0]?.script || 'latin',
    isMultiscript: found.length > 1,
    hasRTL,
    hasDiacritics,
    hasMixedDirection: hasRTL && found.some(f => f.direction === 'ltr'),
  };
}

// ================================================================
// Font Fallback Policies
// ================================================================

/**
 * Font fallback chains for different scripts.
 * These are safe defaults for XeLaTeX with common system fonts.
 */
const FONT_FALLBACK = {
  arabic: {
    primary: ['Amiri', 'Scheherazade New', 'Noto Naskh Arabic'],
    fallback: ['Arial', 'Times New Roman'],
    notes: 'Amiri is preferred for Quranic text. Scheherazade for general Arabic.',
  },
  hebrew: {
    primary: ['David CLM', 'Noto Serif Hebrew', 'SBL Hebrew'],
    fallback: ['Arial Hebrew', 'Times New Roman'],
    notes: 'SBL Hebrew is preferred for scholarly texts.',
  },
  devanagari: {
    primary: ['Noto Serif Devanagari', 'Lohit Devanagari'],
    fallback: ['Arial Unicode MS'],
    notes: 'Noto Serif Devanagari provides excellent coverage.',
  },
  cjk: {
    primary: ['Noto Serif CJK SC', 'Noto Sans CJK SC', 'Source Han Serif SC'],
    fallback: ['SimSun', 'MS Mincho'],
    notes: 'CJK requires large font files. SC = Simplified Chinese.',
  },
  thai: {
    primary: ['Noto Serif Thai', 'TH Sarabun New'],
    fallback: ['Tahoma'],
    notes: 'Thai requires specific line-breaking rules.',
  },
  greek: {
    primary: ['EB Garamond', 'GFS Didot', 'Noto Serif'],
    fallback: ['Times New Roman'],
    notes: 'Most Latin fonts include polytonic Greek.',
  },
  cyrillic: {
    primary: ['EB Garamond', 'PT Serif', 'Noto Serif'],
    fallback: ['Times New Roman'],
    notes: 'Most modern Latin fonts include Cyrillic.',
  },
  latin: {
    primary: ['EB Garamond', 'ETbb', 'Alegreya Sans'],
    fallback: ['Latin Modern Roman', 'DejaVu Serif'],
    notes: 'Standard PagePerfect template fonts.',
  },
};

// ================================================================
// Line Breaking Rules
// ================================================================

/**
 * Script-specific line breaking policies.
 */
const LINE_BREAKING_RULES = {
  arabic: {
    allowKashida: true,           // Stretch via kashida before adding word space
    breakAtTatweel: true,         // Can break at tatweel (elongation character)
    noBreakBeforePunctuation: true,
    hyphenation: false,           // Arabic doesn't hyphenate
  },
  hebrew: {
    hyphenation: false,           // Hebrew rarely hyphenates
    noBreakBeforePunctuation: true,
  },
  cjk: {
    breakAnywhere: true,          // CJK can break between any characters
    noBreakBefore: '、。」）〉》',  // No break before these
    noBreakAfter: '「（〈《',       // No break after these
    hangingPunctuation: true,
  },
  thai: {
    wordBreakDictionary: true,    // Thai needs dictionary for word boundaries
    noBreakBeforePunctuation: true,
  },
  latin: {
    hyphenation: true,
    minLeftHyphen: 2,
    minRightHyphen: 3,
  },
};

// ================================================================
// LaTeX Preamble Generation
// ================================================================

/**
 * Generate multilingual LaTeX preamble based on detected scripts.
 *
 * @param {object} scriptAnalysis — from detectScripts
 * @param {object} [opts]         — { primaryFont }
 * @returns {string} LaTeX preamble
 */
function generateMultilingualPreamble(scriptAnalysis, opts = {}) {
  const commands = ['% ── Multilingual and Scripture-safe System ──'];

  if (!scriptAnalysis.isMultiscript && !scriptAnalysis.hasRTL) {
    // Simple case: Latin-only
    commands.push('% Single-script document (Latin). No additional multilingual setup needed.');
    return commands.join('\n');
  }

  // Polyglossia for multilingual support (XeLaTeX)
  commands.push('\\usepackage{polyglossia}');

  // Set main language based on primary script
  const langMap = {
    arabic: 'arabic',
    hebrew: 'hebrew',
    greek: 'greek',
    cyrillic: 'russian',
    thai: 'thai',
    latin: 'english',
  };

  const mainLang = langMap[scriptAnalysis.primaryScript] || 'english';
  commands.push(`\\setmainlanguage{${mainLang}}`);

  // Set other languages
  for (const script of scriptAnalysis.scripts) {
    const lang = langMap[script.script];
    if (lang && lang !== mainLang) {
      commands.push(`\\setotherlanguage{${lang}}`);
    }
  }

  // RTL support
  if (scriptAnalysis.hasRTL) {
    commands.push('');
    commands.push('% RTL support');
    commands.push('\\usepackage{bidi}');
  }

  // Font configuration for non-Latin scripts (availability-aware)
  for (const script of scriptAnalysis.scripts) {
    if (script.script === 'latin') continue;
    const fallback = FONT_FALLBACK[script.script];
    if (fallback) {
      // Walk the primary + fallback lists to find the first available font
      const candidates = [...fallback.primary, ...fallback.fallback];
      let fontName = candidates[0]; // default if probing unavailable
      for (const candidate of candidates) {
        if (fontAvailability.isFontAvailable(candidate)) {
          fontName = candidate;
          break;
        }
      }
      commands.push(`\\newfontfamily{\\${script.script}font}{${fontName}}[Script=${script.label}]`);
    }
  }

  // Mixed direction handling
  if (scriptAnalysis.hasMixedDirection) {
    commands.push('');
    commands.push('% Mixed-direction paragraph support');
    commands.push('\\newcommand{\\ltrtext}[1]{\\begingroup\\textdir TLT #1\\endgroup}');
    commands.push('\\newcommand{\\rtltext}[1]{\\begingroup\\textdir TRT #1\\endgroup}');
  }

  // Diacritics support
  if (scriptAnalysis.hasDiacritics) {
    commands.push('');
    commands.push('% Enhanced diacritics rendering');
    commands.push('% XeLaTeX handles combining diacritics natively via fontspec');
  }

  return commands.join('\n');
}

// ================================================================
// Manuscript Language Analysis
// ================================================================

/**
 * Analyze a manuscript for multilingual content and provide
 * recommendations.
 *
 * @param {string} md — manuscript markdown
 * @returns {{ scriptAnalysis, fontRequirements, lineBreakingNeeds, recommendations }}
 */
function analyzeMultilingual(md) {
  const scriptAnalysis = detectScripts(md);
  const recommendations = [];
  const fontRequirements = [];
  const lineBreakingNeeds = [];

  for (const script of scriptAnalysis.scripts) {
    // Font requirements
    const fallback = FONT_FALLBACK[script.script];
    if (fallback) {
      fontRequirements.push({
        script: script.label,
        required: fallback.primary,
        fallback: fallback.fallback,
        notes: fallback.notes,
      });
    }

    // Line breaking needs
    const lbRules = LINE_BREAKING_RULES[script.script];
    if (lbRules) {
      lineBreakingNeeds.push({
        script: script.label,
        rules: lbRules,
      });
    }
  }

  // Recommendations
  if (scriptAnalysis.hasRTL) {
    recommendations.push({
      severity: 'warn',
      message: 'RTL content detected. Ensure the bidi package is available in your LaTeX installation.',
    });
  }

  if (scriptAnalysis.hasMixedDirection) {
    recommendations.push({
      severity: 'info',
      message: 'Mixed LTR/RTL content detected. Paragraph direction will be handled automatically, but inline direction changes may need \\ltrtext{} or \\rtltext{} wrappers.',
    });
  }

  if (scriptAnalysis.scripts.find(s => s.script === 'cjk')) {
    recommendations.push({
      severity: 'info',
      message: 'CJK characters detected. Large CJK fonts may increase compilation time. Consider the xeCJK package for optimal typesetting.',
    });
  }

  if (scriptAnalysis.hasDiacritics) {
    recommendations.push({
      severity: 'info',
      message: 'Complex diacritics detected. XeLaTeX handles these natively. Ensure your chosen font supports the required Unicode combining characters.',
    });
  }

  return {
    scriptAnalysis,
    fontRequirements,
    lineBreakingNeeds,
    recommendations,
    preamble: generateMultilingualPreamble(scriptAnalysis),
  };
}

// ================================================================
// Exports
// ================================================================

module.exports = {
  SCRIPT_RANGES,
  FONT_FALLBACK,
  LINE_BREAKING_RULES,
  detectScripts,
  generateMultilingualPreamble,
  analyzeMultilingual,
};
