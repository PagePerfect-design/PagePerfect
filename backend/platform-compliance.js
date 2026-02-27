/**
 * Platform Compliance System
 *
 * Broadens "platform compliance" into a full matrix and repeatable export pipeline.
 * Explicit presets and validators for POD (KDP, IngramSpark, Lulu),
 * offset print-ready PDFs, academic print shops, institutional repositories,
 * and ebook hand-off packs.
 */

// ================================================================
// Platform Specifications Matrix
// ================================================================

const PLATFORMS = {
  kdp: {
    name: 'Amazon KDP',
    type: 'pod',
    trimSizes: ['5x8', '5.25x8', '5.5x8.5', '6x9', '7x10', '8x10', '8.5x11'],
    pageRange: { min: 24, max: 828 },
    bleed: { required: false, standard: 0.125, unit: 'inches' },
    gutterByPages: { 150: 0.375, 300: 0.5, 500: 0.625, 828: 0.75 },
    outsideMarginMin: 0.25,
    topBottomMarginMin: 0.25,
    colorSpaces: ['RGB', 'CMYK'],
    pdfVersion: '1.4+',
    fontsEmbedded: true,
    maxFileSize: '650MB',
    coverRequired: true,
    isbn: 'optional',
    paperStock: ['white', 'cream'],
    binding: ['paperback', 'hardcover'],
    notes: 'Free ISBN provided. Expanded distribution available.',
  },
  ingram: {
    name: 'IngramSpark',
    type: 'pod',
    trimSizes: ['5x8', '5.5x8.5', '6x9', '7x10', '8.5x11', 'a5', 'a4', 'custom'],
    pageRange: { min: 18, max: 1200 },
    bleed: { required: true, standard: 0.125, unit: 'inches' },
    gutterMin: 0.625,
    outsideMarginMin: 0.5,
    topBottomMarginMin: 0.5,
    colorSpaces: ['CMYK'],
    pdfFormat: 'PDF/X-1a:2001',
    pdfVersion: '1.3',
    fontsEmbedded: true,
    maxFileSize: '1.5GB',
    coverRequired: true,
    isbn: 'required',
    paperStock: ['white', 'cream', 'groundwood'],
    binding: ['paperback', 'hardcover', 'saddle-stitch'],
    notes: 'Widest distribution network. Requires PDF/X-1a for interior.',
  },
  lulu: {
    name: 'Lulu xPress',
    type: 'pod',
    trimSizes: ['5.25x8', '5.5x8.5', '6x9', '7x10', '8.5x11', 'a5', 'a4'],
    pageRange: { min: 2, max: 800 },
    bleed: { required: false, standard: 0.125, unit: 'inches' },
    gutterMin: 0.375,
    outsideMarginMin: 0.25,
    topBottomMarginMin: 0.25,
    colorSpaces: ['RGB', 'CMYK'],
    pdfVersion: '1.4+',
    fontsEmbedded: true,
    maxFileSize: '2GB',
    coverRequired: true,
    isbn: 'optional',
    paperStock: ['white', 'cream'],
    binding: ['paperback', 'hardcover', 'coil', 'saddle-stitch'],
    notes: 'API available for automated ordering. Most flexible page count.',
  },
  offset: {
    name: 'Offset Print',
    type: 'offset',
    trimSizes: ['custom'],
    pageRange: { min: 8, max: 2000 },
    bleed: { required: true, standard: 3, unit: 'mm' },
    gutterMin: 0.5,
    outsideMarginMin: 0.5,
    topBottomMarginMin: 0.5,
    colorSpaces: ['CMYK'],
    pdfFormat: 'PDF/X-1a:2001 or PDF/X-4',
    pdfVersion: '1.3 or 1.6',
    fontsEmbedded: true,
    resolution: '300dpi minimum, 1200dpi for line art',
    notes: 'Economical for 500+ copies. Requires pre-press proofs.',
  },
  academic: {
    name: 'Academic Press',
    type: 'institutional',
    trimSizes: ['6x9', '7x10', 'a5', 'a4'],
    pageRange: { min: 50, max: 1500 },
    bleed: { required: false, standard: 0, unit: 'inches' },
    gutterMin: 0.75,
    outsideMarginMin: 1.0,
    topBottomMarginMin: 1.0,
    colorSpaces: ['CMYK', 'Grayscale'],
    pdfFormat: 'PDF/A-1b',
    fontsEmbedded: true,
    notes: 'University press requirements. Often requires camera-ready PDF.',
  },
  repository: {
    name: 'Institutional Repository',
    type: 'digital',
    trimSizes: ['a4', 'letter'],
    pageRange: { min: 1, max: 10000 },
    bleed: { required: false, standard: 0, unit: 'inches' },
    colorSpaces: ['RGB'],
    pdfFormat: 'PDF/A-1b',
    fontsEmbedded: true,
    accessibility: 'Tagged PDF recommended',
    notes: 'For theses, dissertations, open-access papers. PDF/A for long-term preservation.',
  },
  ebook: {
    name: 'eBook Hand-off',
    type: 'digital',
    trimSizes: ['reflowable'],
    colorSpaces: ['RGB'],
    imageResolution: '150dpi sufficient',
    formats: ['EPUB', 'MOBI', 'PDF'],
    notes: 'PagePerfect generates PDF. This preset validates for downstream EPUB conversion.',
  },
};

// ================================================================
// Platform Validation
// ================================================================

/**
 * Validate a manuscript configuration against a specific platform.
 *
 * @param {object} opts
 * @param {string} opts.platform     — key from PLATFORMS
 * @param {string} opts.pageSize     — trim size key
 * @param {number} opts.pageCount    — total pages
 * @param {number} opts.wordCount    — total words
 * @param {string} opts.marginPreset — margin preset name
 * @param {string} opts.template     — template key
 * @param {boolean} opts.hasImages   — whether manuscript has images
 * @param {boolean} opts.hasCitations — whether manuscript has citations
 * @param {string} opts.colorMode    — 'bw' | 'color'
 * @param {object} gridSystem        — GridSystem instance
 * @returns {{ platform, passed, checks, recommendations }}
 */
function validatePlatform(opts, gridSystem) {
  const {
    platform: platformKey = 'generic',
    pageSize = 'sixByNine',
    pageCount,
    wordCount = 0,
    marginPreset = 'normal',
    template = 'symphony',
    hasImages = false,
    hasCitations = false,
    colorMode = 'bw',
  } = opts;

  const spec = PLATFORMS[platformKey];
  if (!spec) {
    return {
      platform: platformKey,
      passed: true,
      checks: [{ name: 'Platform', status: 'info', detail: 'Generic output — no platform-specific validation.' }],
      recommendations: [],
    };
  }

  const checks = [];
  const recommendations = [];
  const estPages = pageCount || Math.ceil(wordCount / 250);

  // ── Page count ──
  if (spec.pageRange) {
    const valid = estPages >= spec.pageRange.min && estPages <= spec.pageRange.max;
    checks.push({
      name: 'Page count',
      status: valid ? 'pass' : 'fail',
      detail: valid
        ? `${estPages} pages (${spec.name}: ${spec.pageRange.min}–${spec.pageRange.max})`
        : `${estPages} pages — ${spec.name} requires ${spec.pageRange.min}–${spec.pageRange.max}`,
    });
  }

  // ── Margins ──
  if (gridSystem && spec.gutterMin) {
    const geoString = gridSystem.calculateTypstMargins(pageSize, marginPreset, template);
    const marginMatch = geoString.match(/margin:\s*([\d.]+)/);
    const actualMargin = marginMatch ? parseFloat(marginMatch[1]) : 1.0;
    const isMetric = geoString.includes('mm');
    const marginInches = isMetric ? actualMargin / 25.4 : actualMargin;

    // Dynamic gutter for KDP
    let minGutter = spec.gutterMin;
    if (platformKey === 'kdp' && spec.gutterByPages) {
      for (const [threshold, gutter] of Object.entries(spec.gutterByPages).sort(([a], [b]) => Number(a) - Number(b))) {
        if (estPages <= Number(threshold)) { minGutter = gutter; break; }
      }
    }

    const gutterOk = marginInches >= minGutter;
    checks.push({
      name: 'Inside margin (gutter)',
      status: gutterOk ? 'pass' : 'fail',
      detail: gutterOk
        ? `${marginInches.toFixed(3)}" ≥ ${minGutter}" minimum`
        : `${marginInches.toFixed(3)}" — needs ${minGutter}" for ${estPages} pages on ${spec.name}`,
    });
  }

  // ── Color space ──
  if (spec.colorSpaces) {
    const cmykRequired = spec.colorSpaces.length === 1 && spec.colorSpaces[0] === 'CMYK';
    if (cmykRequired && hasImages) {
      checks.push({
        name: 'Color space',
        status: 'warn',
        detail: `${spec.name} requires CMYK. RGB images will be auto-converted during PDF/X export.`,
      });
    } else {
      checks.push({
        name: 'Color space',
        status: 'pass',
        detail: `Supported: ${spec.colorSpaces.join(', ')}`,
      });
    }
  }

  // ── PDF format ──
  if (spec.pdfFormat) {
    const isPdfX = spec.pdfFormat.includes('PDF/X');
    const isPdfA = spec.pdfFormat.includes('PDF/A');
    checks.push({
      name: 'PDF format',
      status: isPdfX ? 'fail' : isPdfA ? 'warn' : 'pass',
      critical: isPdfX,
      detail: isPdfX
        ? `${spec.name} requires ${spec.pdfFormat}. Select "Export as PDF/X-1a" — standard PDF will be rejected at upload.`
        : isPdfA
          ? `${spec.name} recommends ${spec.pdfFormat} for archival compliance.`
          : 'Standard PDF output OK.',
    });
  }

  // ── Font embedding ──
  if (spec.fontsEmbedded) {
    checks.push({
      name: 'Font embedding',
      status: 'pass',
      detail: 'LuaLaTeX + fontspec — all fonts embedded automatically.',
    });
  }

  // ── Bleed ──
  if (spec.bleed?.required) {
    checks.push({
      name: 'Bleed',
      status: 'fail',
      critical: true,
      detail: `${spec.name} requires ${spec.bleed.standard}${spec.bleed.unit} bleed for full-bleed pages. Non-compliant files will be rejected.`,
    });
  } else {
    checks.push({
      name: 'Bleed',
      status: 'pass',
      detail: spec.bleed ? `Optional ${spec.bleed.standard}${spec.bleed.unit} bleed` : 'No bleed requirement.',
    });
  }

  // ── ISBN ──
  if (spec.isbn === 'required') {
    checks.push({
      name: 'ISBN',
      status: 'info',
      detail: `${spec.name} requires an ISBN. Obtain from Bowker or your national ISBN agency.`,
    });
  }

  // ── Recommendations ──
  if (platformKey === 'ingram') {
    recommendations.push('Export as PDF/X-1a for IngramSpark compliance.');
    recommendations.push('Ensure all images are CMYK or will be converted during export.');
    if (hasCitations) {
      recommendations.push('Include a complete bibliography — IngramSpark does not process citations at upload.');
    }
  }

  if (platformKey === 'kdp') {
    recommendations.push('Use a KDP-specific trim size for best compatibility.');
    if (estPages > 400) {
      recommendations.push(`For ${estPages} pages, consider cream paper stock for reduced spine curl.`);
    }
  }

  if (platformKey === 'academic' || platformKey === 'repository') {
    recommendations.push('Consider PDF/A format for long-term archival preservation.');
    if (hasCitations) {
      recommendations.push('Ensure bibliography follows your institution\'s required citation style.');
    }
  }

  if (platformKey === 'ebook') {
    recommendations.push('Keep images under 150 DPI for ebook — higher resolution increases file size without benefit.');
    recommendations.push('Use semantic heading structure (H1 → H2 → H3) for proper ebook TOC generation.');
    recommendations.push('Avoid fixed-width tables — they may not reflow in ebook readers.');
  }

  const blockers = checks.filter(c => c.status === 'fail');
  const passed = blockers.length === 0;

  return {
    platform: spec.name,
    platformKey,
    type: spec.type,
    passed,
    checks,
    blockers,
    recommendations,
    spec,
  };
}

// ================================================================
// Export Pipeline Presets
// ================================================================

/**
 * Get the recommended export pipeline for a platform.
 * Returns steps the user should follow.
 */
function getExportPipeline(platformKey) {
  const pipelines = {
    kdp: {
      steps: [
        { step: 1, action: 'Compile with full quality mode', details: 'Ensures microtype, csquotes, and full typography.' },
        { step: 2, action: 'Run pre-flight check', details: 'Validates page count, margins, and trim size for KDP.' },
        { step: 3, action: 'Download standard PDF', details: 'KDP accepts standard PDF with embedded fonts.' },
        { step: 4, action: 'Generate cover separately', details: 'Use KDP Cover Creator or upload custom cover PDF.' },
        { step: 5, action: 'Upload to KDP Print', details: 'Submit interior PDF + cover PDF via kdp.amazon.com.' },
      ],
      format: 'PDF',
    },
    ingram: {
      steps: [
        { step: 1, action: 'Compile with full quality mode', details: 'Full typography pipeline required.' },
        { step: 2, action: 'Run pre-flight check for IngramSpark', details: 'Validates margins, bleed, and format requirements.' },
        { step: 3, action: 'Export as PDF/X-1a', details: 'Converts to CMYK, flattens transparency, embeds ICC profile.' },
        { step: 4, action: 'Prepare cover with bleed and spine', details: 'Cover must include spine width based on page count.' },
        { step: 5, action: 'Upload to IngramSpark', details: 'Submit PDF/X-1a interior + cover via IngramSpark dashboard.' },
      ],
      format: 'PDF/X-1a:2001',
    },
    lulu: {
      steps: [
        { step: 1, action: 'Compile with full quality mode', details: 'Full typography pipeline.' },
        { step: 2, action: 'Run pre-flight check for Lulu', details: 'Validates page count and margins.' },
        { step: 3, action: 'Download standard PDF', details: 'Lulu accepts standard PDF or PDF/X.' },
        { step: 4, action: 'Upload via Lulu dashboard or API', details: 'Submit interior + cover.' },
      ],
      format: 'PDF',
    },
    offset: {
      steps: [
        { step: 1, action: 'Compile with full quality mode', details: 'Maximum typographic fidelity required.' },
        { step: 2, action: 'Export as PDF/X-1a or PDF/X-4', details: 'CMYK conversion required for offset.' },
        { step: 3, action: 'Add printer marks if required', details: 'Crop marks, color bars, registration marks.' },
        { step: 4, action: 'Send to print shop for proofing', details: 'Request a physical proof before full run.' },
      ],
      format: 'PDF/X-1a:2001 or PDF/X-4',
    },
    academic: {
      steps: [
        { step: 1, action: 'Compile with full quality mode', details: 'Full citation processing and typography.' },
        { step: 2, action: 'Verify citations and bibliography', details: 'Run reference validation to ensure completeness.' },
        { step: 3, action: 'Download standard PDF or PDF/A', details: 'Camera-ready PDF for press submission.' },
        { step: 4, action: 'Submit to publisher', details: 'Follow publisher-specific submission guidelines.' },
      ],
      format: 'PDF or PDF/A-1b',
    },
    repository: {
      steps: [
        { step: 1, action: 'Compile with full quality mode', details: 'Full citation and structure processing.' },
        { step: 2, action: 'Generate PDF/A for archival', details: 'Long-term preservation format.' },
        { step: 3, action: 'Add metadata', details: 'Ensure title, author, date, and subject are in PDF metadata.' },
        { step: 4, action: 'Upload to repository', details: 'Submit via institutional repository system.' },
      ],
      format: 'PDF/A-1b',
    },
    ebook: {
      steps: [
        { step: 1, action: 'Compile standard PDF', details: 'Generates the PDF baseline.' },
        { step: 2, action: 'Validate structure', details: 'Ensure proper heading hierarchy for TOC generation.' },
        { step: 3, action: 'Prepare hand-off pack', details: 'Markdown source + images for EPUB conversion.' },
        { step: 4, action: 'Convert externally', details: 'Use Pandoc or Calibre for EPUB generation from Markdown.' },
      ],
      format: 'Markdown + PDF',
    },
  };

  return pipelines[platformKey] || {
    steps: [
      { step: 1, action: 'Compile PDF', details: 'Standard compilation.' },
      { step: 2, action: 'Download', details: 'Standard PDF output.' },
    ],
    format: 'PDF',
  };
}

// ================================================================
// Exports
// ================================================================

module.exports = {
  PLATFORMS,
  validatePlatform,
  getExportPipeline,
};
