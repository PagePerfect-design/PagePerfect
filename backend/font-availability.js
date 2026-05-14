/**
 * Font Availability System
 *
 * Canonical inventory of every font required by PagePerfect templates,
 * runtime detection via fc-list (fontconfig), smart fallback resolution,
 * and diagnostics for health checks.
 *
 * Strategy:
 *   1. FONT_REGISTRY — single source of truth for all font requirements
 *   2. probeInstalledFonts() — calls fc-list once and caches the result
 *   3. resolveFont(name) — returns the requested font if available, else best fallback
 *   4. auditFonts() — full availability report for diagnostics
 */

const { execSync } = require('child_process');
const log = require('./logger');

// ================================================================
// Font Name Aliases
// ================================================================
// Maps font names used in the template registry to known alternative
// names that may appear in different TeX Live versions or system installs.
// TeX Live 2021 (Ubuntu 22.04) ships older font names in some cases.

const FONT_ALIASES = {
  'Source Sans 3': ['Source Sans Pro', 'SourceSansPro', 'SourceSans3'],
  'Source Sans Pro': ['Source Sans 3', 'SourceSansPro', 'SourceSans3'],
  'Scheherazade New': ['Scheherazade', 'Scheherazade Delight'],
  'Scheherazade': ['Scheherazade New'],
  'EB Garamond': ['EBGaramond', 'EB Garamond 12'],
  'Libertinus Sans': ['Libertinus Sans Display', 'LibertinusSans'],
  'Libre Baskerville': ['LibreBaskerville'],
  'Noto Naskh Arabic': ['Noto Naskh Arabic UI'],
};

// ================================================================
// Font Registry — every font used across all templates & systems
// ================================================================

/**
 * Each entry maps a font name (as Typst/fontconfig sees it) to:
 *   - source: which TeX Live / system package provides it
 *   - usedBy: which templates reference it
 *   - fallbacks: ordered list of substitutes (best match first)
 *   - category: classification for grouping in diagnostics
 *   - critical: if true, compilation will likely fail without it
 */
const FONT_REGISTRY = {
  // ── Serif body fonts ────────────────────────────────────────
  'EB Garamond': {
    source: 'texlive-fonts-extra (ebgaramond)',
    usedBy: ['symphony'],
    fallbacks: ['ETbb', 'Latin Modern Roman', 'DejaVu Serif'],
    category: 'serif',
    critical: true,
  },
  'ETbb': {
    source: 'texlive-fonts-extra (etbb)',
    usedBy: ['chicago'],
    fallbacks: ['EB Garamond', 'Latin Modern Roman', 'DejaVu Serif'],
    category: 'serif',
    critical: true,
  },
  'Latin Modern Roman': {
    source: 'texlive-fonts-recommended (lmodern)',
    usedBy: ['minimal'],
    fallbacks: ['DejaVu Serif'],
    category: 'serif',
    critical: true,
  },
  'Libre Baskerville': {
    source: 'texlive-fonts-extra (librebaskerville) / Google Fonts',
    usedBy: ['memoir'],
    fallbacks: ['EB Garamond', 'ETbb', 'Latin Modern Roman', 'DejaVu Serif'],
    category: 'serif',
    critical: true,
  },
  'DejaVu Serif': {
    source: 'texlive-fonts-extra / fonts-dejavu',
    usedBy: ['heirloom (sans header)'],
    fallbacks: ['Latin Modern Roman'],
    category: 'serif',
    critical: false,
  },

  // ── Sans body fonts ─────────────────────────────────────────
  'Alegreya Sans': {
    source: 'texlive-fonts-extra (alegreya)',
    usedBy: ['paperback'],
    fallbacks: ['Fira Sans', 'Source Sans 3', 'DejaVu Sans'],
    category: 'sans',
    critical: true,
  },
  'Fira Sans': {
    source: 'texlive-fonts-extra (fira)',
    usedBy: ['exhibit', 'matrix', 'heirloom', 'operator'],
    fallbacks: ['Source Sans 3', 'Alegreya Sans', 'DejaVu Sans'],
    category: 'sans',
    critical: true,
  },
  'Source Sans 3': {
    source: 'texlive-fonts-extra (sourcesanspro)',
    usedBy: ['avantgarde'],
    fallbacks: ['Fira Sans', 'Alegreya Sans', 'DejaVu Sans'],
    category: 'sans',
    critical: true,
  },
  'DejaVu Sans': {
    source: 'texlive-fonts-extra / fonts-dejavu',
    usedBy: ['avantgarde (sans)'],
    fallbacks: ['Fira Sans', 'Source Sans 3'],
    category: 'sans',
    critical: false,
  },
  'Libertinus Sans': {
    source: 'texlive-fonts-extra (libertinus)',
    usedBy: ['symphony (sans)'],
    fallbacks: ['Latin Modern Sans', 'DejaVu Sans'],
    category: 'sans',
    critical: false,
  },

  // ── TeX Gyre family (Helvetica/Courier/Adventor clones) ─────
  'TeX Gyre Heros': {
    source: 'texlive-fonts-recommended (tex-gyre)',
    usedBy: ['chronicle', 'international', 'paperback (sans)'],
    fallbacks: ['Fira Sans', 'DejaVu Sans'],
    category: 'sans',
    critical: true,
  },
  'TeX Gyre Adventor': {
    source: 'texlive-fonts-recommended (tex-gyre)',
    usedBy: ['exhibit (sans)'],
    fallbacks: ['TeX Gyre Heros', 'Fira Sans', 'DejaVu Sans'],
    category: 'sans',
    critical: false,
  },
  'TeX Gyre Cursor': {
    source: 'texlive-fonts-recommended (tex-gyre)',
    usedBy: ['cinema', 'avantgarde (mono)', 'international (mono)'],
    fallbacks: ['DejaVu Sans Mono', 'Latin Modern Mono'],
    category: 'mono',
    critical: true,
  },

  // ── Monospace fonts ─────────────────────────────────────────
  'DejaVu Sans Mono': {
    source: 'texlive-fonts-extra / fonts-dejavu',
    usedBy: ['symphony (mono)', 'paperback (mono)'],
    fallbacks: ['Fira Mono', 'Latin Modern Mono', 'TeX Gyre Cursor'],
    category: 'mono',
    critical: false,
  },
  'Fira Mono': {
    source: 'texlive-fonts-extra (fira)',
    usedBy: ['exhibit (mono)', 'chronicle (mono)', 'heirloom (mono)', 'operator (mono)', 'matrix (mono)'],
    fallbacks: ['DejaVu Sans Mono', 'Latin Modern Mono', 'TeX Gyre Cursor'],
    category: 'mono',
    critical: false,
  },
  'Latin Modern Sans': {
    source: 'texlive-fonts-recommended (lmodern)',
    usedBy: ['chicago (sans)'],
    fallbacks: ['DejaVu Sans', 'TeX Gyre Heros'],
    category: 'sans',
    critical: false,
  },
  'Latin Modern Mono': {
    source: 'texlive-fonts-recommended (lmodern)',
    usedBy: ['chicago (mono)'],
    fallbacks: ['DejaVu Sans Mono', 'Fira Mono'],
    category: 'mono',
    critical: false,
  },

  // ── Multilingual fallback fonts ─────────────────────────────
  'Amiri': {
    source: 'texlive-fonts-extra (amiri) / fonts-hosny-amiri',
    usedBy: ['multilingual (Arabic primary)'],
    fallbacks: ['Scheherazade New', 'Noto Naskh Arabic', 'DejaVu Sans'],
    category: 'multilingual',
    critical: false,
  },
  'Scheherazade New': {
    source: 'texlive-fonts-extra / fonts-sil-scheherazade',
    usedBy: ['multilingual (Arabic fallback)'],
    fallbacks: ['Amiri', 'Noto Naskh Arabic', 'DejaVu Sans'],
    category: 'multilingual',
    critical: false,
  },
  'Noto Naskh Arabic': {
    source: 'fonts-noto / fonts-noto-core',
    usedBy: ['multilingual (Arabic fallback)'],
    fallbacks: ['Amiri', 'Scheherazade New', 'DejaVu Sans'],
    category: 'multilingual',
    critical: false,
  },
  'Noto Serif CJK SC': {
    source: 'fonts-noto-cjk',
    usedBy: ['multilingual (CJK primary)'],
    fallbacks: ['Noto Sans CJK SC', 'Source Han Serif SC'],
    category: 'multilingual',
    critical: false,
  },
  'Noto Sans CJK SC': {
    source: 'fonts-noto-cjk',
    usedBy: ['multilingual (CJK fallback)'],
    fallbacks: ['Noto Serif CJK SC', 'Source Han Serif SC'],
    category: 'multilingual',
    critical: false,
  },
  'Noto Serif Devanagari': {
    source: 'fonts-noto / fonts-noto-extra',
    usedBy: ['multilingual (Devanagari)'],
    fallbacks: ['Lohit Devanagari', 'DejaVu Sans'],
    category: 'multilingual',
    critical: false,
  },
  'Noto Serif Hebrew': {
    source: 'fonts-noto / fonts-noto-extra',
    usedBy: ['multilingual (Hebrew)'],
    fallbacks: ['David CLM', 'DejaVu Sans'],
    category: 'multilingual',
    critical: false,
  },
  'Noto Serif Thai': {
    source: 'fonts-noto / fonts-noto-extra',
    usedBy: ['multilingual (Thai)'],
    fallbacks: ['DejaVu Sans'],
    category: 'multilingual',
    critical: false,
  },
  'PT Serif': {
    source: 'fonts-paratype',
    usedBy: ['multilingual (Cyrillic)'],
    fallbacks: ['EB Garamond', 'DejaVu Serif'],
    category: 'multilingual',
    critical: false,
  },
};

// ================================================================
// Font Detection via fontconfig (fc-list)
// ================================================================

/** @type {Set<string> | null} */
let _cachedFontSet = null;
let _cacheTimestamp = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Probe all fonts available to fontconfig/Typst.
 * Primary: `fc-list` for fontconfig-visible fonts.
 * Secondary: `luaotfload-tool` database for TeX-path-only fonts.
 * Results are cached for CACHE_TTL_MS.
 *
 * @param {boolean} [forceRefresh=false]
 * @returns {Set<string>} Set of available font family names
 */
function probeInstalledFonts(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && _cachedFontSet && (now - _cacheTimestamp) < CACHE_TTL_MS) {
    return _cachedFontSet;
  }

  const families = new Set();

  // ── Primary: fontconfig (fc-list) ──
  try {
    // Use both family[0] and fullname to catch variant naming
    const raw = execSync('fc-list --format="%{family[0]}\\n%{fullname}\\n"', {
      encoding: 'utf8',
      timeout: 10_000,
    });
    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (trimmed) {
        // fc-list may return comma-separated variants (e.g. "Fira Sans,Fira Sans Light")
        for (const part of trimmed.split(',')) {
          const clean = part.trim();
          if (clean) families.add(clean);
        }
      }
    }
  } catch (err) {
    log.warn({ module: 'font-availability', err: err.message }, 'fc-list failed — font probing unavailable');
  }

  // ── Secondary: luaotfload font names database ──
  // luaotfload-tool --list=* dumps ALL fonts known to TeX (legacy probe),
  // including TeX-path fonts that fontconfig may not see.
  try {
    const raw = execSync('luaotfload-tool --list="*" --fields=familyname 2>/dev/null', {
      encoding: 'utf8',
      timeout: 15_000,
    });
    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('luaotfload')) {
        // Output format varies; extract the family name portion
        // Lines look like: "familyname    fontfile" or just the family name
        const parts = trimmed.split(/\t+/);
        const name = (parts[0] || '').trim();
        if (name && name.length < 100) families.add(name);
      }
    }
  } catch (err) {
    // luaotfload-tool may not be available outside Docker — that's fine
    if (families.size === 0) {
      log.warn({ module: 'font-availability', err: err.message }, 'luaotfload-tool also failed');
    }
  }

  _cachedFontSet = families;
  _cacheTimestamp = now;
  return families;
}

/**
 * Check if a specific font (or any of its known aliases) is available.
 *
 * @param {string} fontName
 * @returns {boolean}
 */
function isFontAvailable(fontName) {
  const installed = probeInstalledFonts();
  if (installed.size === 0) return true; // Can't probe — assume available
  if (installed.has(fontName)) return true;
  // Check known aliases
  const aliases = FONT_ALIASES[fontName];
  if (aliases) {
    for (const alias of aliases) {
      if (installed.has(alias)) return true;
    }
  }
  return false;
}

/**
 * Find the actual installed name for a font, checking aliases.
 * Returns the fontName itself if directly available, an alias if found,
 * or null if neither the font nor any alias is installed.
 *
 * @param {string} fontName
 * @param {Set<string>} installed
 * @returns {string|null}
 */
function findInstalledName(fontName, installed) {
  if (installed.has(fontName)) return fontName;
  const aliases = FONT_ALIASES[fontName];
  if (aliases) {
    for (const alias of aliases) {
      if (installed.has(alias)) return alias;
    }
  }
  return null;
}

// ================================================================
// Smart Fallback Resolution
// ================================================================

/**
 * Resolve a font name to the best available font.
 * Returns the requested font if available, otherwise walks the
 * fallback chain and returns the first available alternative.
 *
 * @param {string} fontName — requested font
 * @returns {{ resolved: string, original: string, isFallback: boolean, warning: string | null }}
 */
function resolveFont(fontName) {
  const installed = probeInstalledFonts();

  // If we can't probe, assume everything is fine
  if (installed.size === 0) {
    return { resolved: fontName, original: fontName, isFallback: false, warning: null };
  }

  // Requested font is directly available
  if (installed.has(fontName)) {
    return { resolved: fontName, original: fontName, isFallback: false, warning: null };
  }

  // Check aliases — font might be installed under a different name
  // (e.g. "Source Sans 3" installed as "Source Sans Pro" in TeX Live 2021)
  const aliasMatch = findInstalledName(fontName, installed);
  if (aliasMatch) {
    return {
      resolved: aliasMatch,
      original: fontName,
      isFallback: true,
      warning: `Font "${fontName}" found as "${aliasMatch}".`,
    };
  }

  // Walk fallback chain (also checking aliases for each fallback)
  const entry = FONT_REGISTRY[fontName];
  if (entry && entry.fallbacks) {
    for (const fb of entry.fallbacks) {
      const fbMatch = findInstalledName(fb, installed);
      if (fbMatch) {
        return {
          resolved: fbMatch,
          original: fontName,
          isFallback: true,
          warning: `Font "${fontName}" not found. Using fallback "${fbMatch}".`,
        };
      }
    }
  }

  // Nothing in registry — try a category-level emergency fallback
  const category = entry?.category || 'serif';
  const emergencyFallbacks = {
    serif: ['Latin Modern Roman', 'DejaVu Serif'],
    sans: ['DejaVu Sans', 'Latin Modern Sans'],
    mono: ['DejaVu Sans Mono', 'Latin Modern Mono'],
    multilingual: ['DejaVu Sans'],
  };

  for (const fb of (emergencyFallbacks[category] || [])) {
    const fbMatch = findInstalledName(fb, installed);
    if (fbMatch) {
      return {
        resolved: fbMatch,
        original: fontName,
        isFallback: true,
        warning: `Font "${fontName}" not found. Using emergency fallback "${fbMatch}".`,
      };
    }
  }

  // Last resort — return the original and let Typst try (it uses fontconfig)
  return {
    resolved: fontName,
    original: fontName,
    isFallback: false,
    warning: `Font "${fontName}" not found by fontconfig. Typst may still locate it via system paths.`,
  };
}

/**
 * Resolve all fonts for a template's compile arguments.
 * Takes mainfont, sansfont, monofont from the template registry and resolves each.
 *
 * @param {string} templateKey
 * @param {{ mainfont: string, sansfont?: string|null, monofont?: string|null }} templateEntry
 * @returns {{ mainfont: object, sansfont: object|null, monofont: object|null, warnings: string[] }}
 */
function resolveTemplateFont(templateKey, templateEntry) {
  const warnings = [];
  const mainResult = resolveFont(templateEntry.mainfont);
  if (mainResult.warning) warnings.push(mainResult.warning);

  const sansResult = templateEntry.sansfont ? resolveFont(templateEntry.sansfont) : null;
  if (sansResult?.warning) warnings.push(sansResult.warning);

  const monoResult = templateEntry.monofont ? resolveFont(templateEntry.monofont) : null;
  if (monoResult?.warning) warnings.push(monoResult.warning);

  return { mainfont: mainResult, sansfont: sansResult, monofont: monoResult, warnings };
}

// ================================================================
// Full Audit — Diagnostics
// ================================================================

/**
 * Audit all registered fonts against what's installed.
 * Returns a structured report for health checks and the /api/fonts/status endpoint.
 *
 * @returns {{ total, available, missing, fonts: Array, probeWorking: boolean }}
 */
function auditFonts() {
  const installed = probeInstalledFonts(true); // force refresh for audit
  const probeWorking = installed.size > 0;
  const fonts = [];
  let available = 0;
  let missing = 0;

  for (const [name, entry] of Object.entries(FONT_REGISTRY)) {
    // Check both direct name and aliases
    const installedAs = probeWorking ? findInstalledName(name, installed) : null;
    const isAvail = probeWorking ? (installedAs !== null) : null; // null = unknown
    if (isAvail) available++;
    if (isAvail === false) missing++;

    let bestFallback = null;
    if (!isAvail && probeWorking && entry.fallbacks) {
      for (const fb of entry.fallbacks) {
        const fbMatch = findInstalledName(fb, installed);
        if (fbMatch) {
          bestFallback = fbMatch;
          break;
        }
      }
    }

    fonts.push({
      name,
      available: isAvail,
      installedAs: (isAvail && installedAs !== name) ? installedAs : undefined,
      category: entry.category,
      critical: entry.critical,
      source: entry.source,
      usedBy: entry.usedBy,
      bestFallback: isAvail === false ? bestFallback : null,
    });
  }

  // Sort: critical missing first, then missing, then available
  fonts.sort((a, b) => {
    if (a.available !== b.available) return a.available ? 1 : -1;
    if (a.critical !== b.critical) return a.critical ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return {
    total: Object.keys(FONT_REGISTRY).length,
    available,
    missing,
    unknown: probeWorking ? 0 : Object.keys(FONT_REGISTRY).length,
    probeWorking,
    fonts,
  };
}

/**
 * Quick summary for health checks — avoids the full audit overhead.
 *
 * @returns {{ ok: boolean, total: number, available: number, missing: number, criticalMissing: string[] }}
 */
function quickCheck() {
  const installed = probeInstalledFonts();
  if (installed.size === 0) {
    return { ok: true, total: Object.keys(FONT_REGISTRY).length, available: 0, missing: 0, criticalMissing: [], probeWorking: false };
  }

  let available = 0;
  let missing = 0;
  const criticalMissing = [];

  for (const [name, entry] of Object.entries(FONT_REGISTRY)) {
    if (findInstalledName(name, installed)) {
      available++;
    } else {
      missing++;
      if (entry.critical) criticalMissing.push(name);
    }
  }

  return {
    ok: criticalMissing.length === 0,
    total: Object.keys(FONT_REGISTRY).length,
    available,
    missing,
    criticalMissing,
    probeWorking: true,
  };
}

// ================================================================
// Exports
// ================================================================

module.exports = {
  FONT_REGISTRY,
  FONT_ALIASES,
  probeInstalledFonts,
  isFontAvailable,
  findInstalledName,
  resolveFont,
  resolveTemplateFont,
  auditFonts,
  quickCheck,
};
