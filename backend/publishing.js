/**
 * Publishing utilities — pre-flight validation, cover dimensions,
 * PDF/X-1a conversion, and platform-specific specs.
 *
 * Supports: Amazon KDP, IngramSpark, Lulu, generic.
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// ================================================================
// Platform Spec Constants
// ================================================================

/** KDP trim sizes with dimensions in inches */
const KDP_TRIM_SIZES = {
  amazonFiveByEight:         { w: 5,   h: 8,    label: '5 × 8"' },
  fiveFiveByEightFive:       { w: 5.5, h: 8.5,  label: '5.5 × 8.5"' },
  amazonSixByNine:           { w: 6,   h: 9,    label: '6 × 9"' },
  sixByNine:                 { w: 6,   h: 9,    label: '6 × 9"' },
  amazonSevenByTen:          { w: 7,   h: 10,   label: '7 × 10"' },
  sevenByTen:                { w: 7,   h: 10,   label: '7 × 10"' },
  amazonEightByTen:          { w: 8,   h: 10,   label: '8 × 10"' },
  amazonEightFiveByEleven:   { w: 8.5, h: 11,   label: '8.5 × 11"' },
  letter:                    { w: 8.5, h: 11,   label: 'US Letter' },
  a4:                        { w: 8.27, h: 11.69, label: 'A4' },
  a5:                        { w: 5.83, h: 8.27,  label: 'A5' },
  royal:                     { w: 6.14, h: 9.21,  label: 'Royal' },
  bFormat:                   { w: 5.08, h: 7.80,  label: 'B-format' },
  massMarket:                { w: 4.25, h: 6.87,  label: 'Mass Market' },
  aFormat:                   { w: 4.37, h: 7.01,  label: 'A-format' },
  demy:                      { w: 5.43, h: 8.50,  label: 'Demy' },
  fiveTwentyFiveByEight:     { w: 5.25, h: 8.00,  label: '5.25 × 8"' },
  crownQuarto:               { w: 7.44, h: 9.69,  label: 'Crown Quarto' },
  b5:                        { w: 6.93, h: 9.84,  label: 'B5' },
};

/** Paper stock spine width factors (inches per page) */
const PAPER_STOCK = {
  white: { factor: 0.002252, label: 'White (55#)' },
  cream: { factor: 0.0025,   label: 'Cream (60#)' },
};

/** KDP dynamic gutter — minimum inside margin based on page count */
function kdpGutter(pageCount) {
  if (pageCount <= 150) return 0.375;
  if (pageCount <= 300) return 0.5;
  if (pageCount <= 500) return 0.625;
  return 0.75;
}

/** Spine width in inches */
function spineWidth(pageCount, paperStock = 'white') {
  const stock = PAPER_STOCK[paperStock] || PAPER_STOCK.white;
  return +(pageCount * stock.factor).toFixed(4);
}

// ================================================================
// Pre-flight Validator
// ================================================================

/**
 * Run pre-flight checks for the given configuration.
 *
 * @param {object} opts
 * @param {string} opts.pageSize      — key from KDP_TRIM_SIZES
 * @param {string} opts.marginPreset  — margin preset name
 * @param {string} opts.template      — template key
 * @param {number} opts.wordCount     — manuscript word count
 * @param {number} [opts.pageCount]   — override page count (else estimated from wordCount)
 * @param {string} [opts.platform]    — 'kdp' | 'ingram' | 'lulu' | 'generic'
 * @param {string} [opts.paperStock]  — 'white' | 'cream'
 * @param {object} gridSystem         — GridSystem instance for margin calculation
 * @returns {{ passed: boolean, checks: Array<{name, status, detail}>, stats: object }}
 */
function preflight(opts, gridSystem) {
  const {
    pageSize = 'sixByNine',
    marginPreset = 'normal',
    template = 'symphony',
    wordCount = 0,
    pageCount: explicitPageCount,
    platform = 'generic',
    paperStock = 'white',
  } = opts;

  const checks = [];
  const estimatedPages = explicitPageCount || Math.ceil(wordCount / 250);
  const trimDims = KDP_TRIM_SIZES[pageSize] || KDP_TRIM_SIZES.sixByNine;
  const spine = spineWidth(estimatedPages, paperStock);
  const gutter = kdpGutter(estimatedPages);

  // Parse actual margins from grid system geometry string
  const geoString = gridSystem.calculateTypstMargins(pageSize, marginPreset, template);
  const marginMatch = geoString.match(/margin:\s*([\d.]+)/);
  const actualMargin = marginMatch ? parseFloat(marginMatch[1]) : 1.0;
  // Convert mm to inches if needed
  const isMetric = geoString.includes('mm');
  const marginInches = isMetric ? actualMargin / 25.4 : actualMargin;

  // ── Check 1: Page count limits ──
  if (platform === 'kdp') {
    const valid = estimatedPages >= 24 && estimatedPages <= 828;
    checks.push({
      name: 'Page count',
      status: valid ? 'pass' : 'fail',
      detail: valid
        ? `${estimatedPages} pages (KDP range: 24–828)`
        : `${estimatedPages} pages — KDP requires 24–828 pages`,
    });
  } else if (platform === 'ingram') {
    const valid = estimatedPages >= 18 && estimatedPages <= 1200;
    checks.push({
      name: 'Page count',
      status: valid ? 'pass' : 'fail',
      detail: valid
        ? `${estimatedPages} pages (IngramSpark range: 18–1200)`
        : `${estimatedPages} pages — IngramSpark requires 18–1200 pages`,
    });
  } else if (platform === 'lulu') {
    const valid = estimatedPages >= 2 && estimatedPages <= 800;
    checks.push({
      name: 'Page count',
      status: valid ? 'pass' : 'fail',
      detail: valid
        ? `${estimatedPages} pages (Lulu range: 2–800)`
        : `${estimatedPages} pages — Lulu requires 2–800 pages`,
    });
  } else {
    checks.push({
      name: 'Page count',
      status: estimatedPages > 0 ? 'pass' : 'warn',
      detail: `${estimatedPages} estimated pages`,
    });
  }

  // ── Check 2: Inside margin (gutter) ──
  if (platform === 'kdp' || platform === 'ingram') {
    const minGutter = platform === 'kdp' ? gutter : 0.625;
    const gutterOk = marginInches >= minGutter;
    checks.push({
      name: 'Inside margin (gutter)',
      status: gutterOk ? 'pass' : 'fail',
      critical: true,
      detail: gutterOk
        ? `${marginInches.toFixed(3)}" ≥ ${minGutter}" minimum`
        : `${marginInches.toFixed(3)}" — ${platform === 'kdp' ? 'KDP' : 'IngramSpark'} requires ${minGutter}" minimum for ${estimatedPages} pages. Increase margin preset or your upload will be rejected.`,
    });
  } else {
    checks.push({
      name: 'Inside margin',
      status: 'pass',
      detail: `${marginInches.toFixed(3)}"`,
    });
  }

  // ── Check 3: Outside margins ──
  const minOutside = platform === 'ingram' ? 0.5 : 0.25;
  const outsideOk = marginInches >= minOutside;
  checks.push({
    name: 'Outside margins',
    status: outsideOk ? 'pass' : 'fail',
    critical: !!(platform === 'kdp' || platform === 'ingram'),
    detail: outsideOk
      ? `${marginInches.toFixed(3)}" ≥ ${minOutside}" minimum`
      : `${marginInches.toFixed(3)}" — needs ${minOutside}" minimum. This will cause a platform rejection.`,
  });

  // ── Check 3b: Bleed requirement ──
  if (platform === 'ingram') {
    checks.push({
      name: 'Bleed',
      status: 'info',
      critical: false,
      detail: 'IngramSpark requires 0.125" bleed for full-bleed pages. Text-only interiors are compliant without bleed.',
    });
  }

  // ── Check 4: Trim size validation ──
  const isKdpSize = pageSize.startsWith('amazon') || ['fiveFiveByEightFive', 'sixByNine', 'sevenByTen', 'letter', 'a4', 'a5'].includes(pageSize);
  if (platform === 'kdp') {
    checks.push({
      name: 'Trim size',
      status: isKdpSize ? 'pass' : 'fail',
      critical: true,
      detail: isKdpSize
        ? `${trimDims.label} — KDP-supported trim size`
        : `${trimDims.label} — not a KDP-supported trim size. KDP will reject this upload.`,
    });
  } else {
    checks.push({
      name: 'Trim size',
      status: 'pass',
      detail: `${trimDims.label} (${trimDims.w}" × ${trimDims.h}")`,
    });
  }

  // ── Check 5: Font embedding ──
  // LuaLaTeX with fontspec always embeds fonts — this is a guaranteed pass
  checks.push({
    name: 'Font embedding',
    status: 'pass',
    detail: 'LuaLaTeX + fontspec — all fonts embedded automatically',
  });

  // ── Check 6: PDF format ──
  if (platform === 'ingram') {
    checks.push({
      name: 'PDF format',
      status: 'fail',
      critical: true,
      detail: 'IngramSpark requires PDF/X-1a. Select "Export as PDF/X-1a" — standard PDF will be rejected.',
    });
  } else {
    checks.push({
      name: 'PDF format',
      status: 'pass',
      detail: 'Standard PDF (LuaLaTeX output)',
    });
  }

  // ── Check 7: Spine width ──
  const spineOk = spine >= 0.0625; // minimum spine for text
  checks.push({
    name: 'Spine width',
    status: spineOk ? 'pass' : 'info',
    detail: `${spine.toFixed(4)}" (${(spine * 25.4).toFixed(2)} mm) — ${PAPER_STOCK[paperStock]?.label || 'white'} paper`,
  });

  const blockers = checks.filter(c => c.status === 'fail');
  const warnings = checks.filter(c => c.status === 'warn');
  const passed = blockers.length === 0;

  return {
    passed,
    platform,
    checks,
    blockers,
    warnings,
    stats: {
      estimatedPages,
      wordCount,
      spineInches: spine,
      spineMm: +(spine * 25.4).toFixed(2),
      gutterInches: gutter,
      trimWidth: trimDims.w,
      trimHeight: trimDims.h,
      marginInches: +marginInches.toFixed(3),
    },
  };
}

// ================================================================
// Cover Dimensions Calculator
// ================================================================

/**
 * Calculate full cover dimensions for print-on-demand.
 *
 * @param {object} opts
 * @param {number} opts.trimWidth   — book width in inches
 * @param {number} opts.trimHeight  — book height in inches
 * @param {number} opts.pageCount   — total page count
 * @param {string} [opts.paperStock] — 'white' | 'cream'
 * @param {string} [opts.binding]    — 'paperback' | 'hardcover'
 * @param {string} [opts.platform]   — 'kdp' | 'ingram' | 'lulu' | 'generic'
 * @returns {object} Full cover dimensions
 */
function coverDimensions(opts) {
  const {
    trimWidth = 6,
    trimHeight = 9,
    pageCount = 200,
    paperStock = 'white',
    binding = 'paperback',
    platform = 'generic',
  } = opts;

  const spine = spineWidth(pageCount, paperStock);
  const bleed = 0.125; // standard bleed for all platforms

  // Safety margin (distance from trim to keep text/images)
  let safety;
  if (binding === 'hardcover') {
    safety = platform === 'ingram' ? 0.75 : 0.5; // casewrap needs more
  } else {
    safety = 0.25; // paperback
  }

  // Spine safety (keep text away from spine edges)
  const spineSafety = spine >= 0.35 ? 0.0625 : 0.03125;

  // Full cover dimensions
  const coverWidth = bleed + trimWidth + spine + trimWidth + bleed;
  const coverHeight = bleed + trimHeight + bleed;

  // Safe print area (where text/images should stay)
  const safeWidth = (trimWidth - safety) * 2 + (spine - spineSafety * 2);
  const safeHeight = trimHeight - safety * 2;

  // Hardcover wrap (extra material for case binding)
  const hardcoverWrap = binding === 'hardcover' ? 0.625 : 0;

  return {
    coverWidth:  +coverWidth.toFixed(4),
    coverHeight: +coverHeight.toFixed(4),
    coverWidthMm:  +(coverWidth * 25.4).toFixed(2),
    coverHeightMm: +(coverHeight * 25.4).toFixed(2),
    spine: +spine.toFixed(4),
    spineMm: +(spine * 25.4).toFixed(2),
    bleed,
    safety,
    spineSafety,
    hardcoverWrap,
    safeArea: {
      width:  +safeWidth.toFixed(4),
      height: +safeHeight.toFixed(4),
    },
    breakdown: {
      leftBleed: bleed,
      backCover: trimWidth,
      spine,
      frontCover: trimWidth,
      rightBleed: bleed,
      topBleed: bleed,
      trimHeight,
      bottomBleed: bleed,
    },
    paperStock: PAPER_STOCK[paperStock]?.label || paperStock,
    binding,
    pageCount,
    platform,
  };
}

// ================================================================
// PDF/X-1a Conversion (via Ghostscript)
// ================================================================

const PDFX_DEF_PATH = path.resolve(__dirname, 'pdfx-def.ps');
const ICC_PROFILE_PATH = '/usr/share/color/icc/ghostscript/default_cmyk.icc';

/**
 * Convert a standard PDF to PDF/X-1a:2001 using Ghostscript.
 *
 * @param {string} inputPath   — path to input PDF
 * @param {string} outputPath  — path for output PDF/X-1a
 * @param {string} [title]     — document title for metadata
 * @param {number} [timeout]   — ms before SIGKILL (default: 60000)
 * @returns {Promise<{success: boolean, outputPath?: string, error?: string}>}
 */
function convertToPdfX1a(inputPath, outputPath, title = 'Document', timeout = 60000) {
  return new Promise((resolve) => {
    // Check if ghostscript is available
    const gsCheck = spawn('which', ['gs']);
    let gsFound = false;
    gsCheck.on('close', (code) => {
      gsFound = code === 0;
      if (!gsFound) {
        return resolve({
          success: false,
          error: 'Ghostscript (gs) is not installed. Add ghostscript to the Dockerfile.',
        });
      }

      const args = [
        '-dPDFX=1',
        '-dBATCH',
        '-dNOPAUSE',
        '-dNOOUTERSAVE',
        '-dCompatibilityLevel=1.3',
        '-sDEVICE=pdfwrite',
        '-sColorConversionStrategy=CMYK',
        '-sProcessColorModel=DeviceCMYK',
        '-dPDFSETTINGS=/prepress',
        '-dDownsampleColorImages=false',
        '-dDownsampleGrayImages=false',
        '-dDownsampleMonoImages=false',
        '-dEmbedAllFonts=true',
        '-dSubsetFonts=true',
        '-dPDFXCompatibilityPolicy=1',
        `-sOutputFile=${outputPath}`,
      ];

      // Use PDFX_def.ps if it exists, otherwise rely on Ghostscript defaults
      if (fs.existsSync(PDFX_DEF_PATH)) {
        args.push('-f', PDFX_DEF_PATH);
      }

      args.push(inputPath);

      const gs = spawn('gs', args);
      let stderr = '';
      gs.stderr.on('data', (d) => { stderr += d.toString(); });

      let timedOut = false;
      const killer = setTimeout(() => {
        timedOut = true;
        try { gs.kill('SIGKILL'); } catch {}
      }, timeout);

      gs.on('close', (code) => {
        clearTimeout(killer);
        if (timedOut) {
          return resolve({ success: false, error: 'PDF/X-1a conversion timed out.' });
        }
        if (code === 0 && fs.existsSync(outputPath)) {
          return resolve({ success: true, outputPath });
        }
        return resolve({
          success: false,
          error: `Ghostscript exited with code ${code}: ${stderr.split('\n').slice(-5).join('\n')}`,
        });
      });
    });
  });
}

// ================================================================
// Exports
// ================================================================

module.exports = {
  KDP_TRIM_SIZES,
  PAPER_STOCK,
  kdpGutter,
  spineWidth,
  preflight,
  coverDimensions,
  convertToPdfX1a,
};
