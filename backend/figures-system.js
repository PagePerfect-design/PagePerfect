/**
 * Figures, Tables, and Assets System
 *
 * Image pipeline that specifies supported formats, recommended DPI,
 * maximum dimensions, safe defaults for bleed and margins.
 * Handles figure/table numbering, captions, and cross-references.
 * Validates images and transparency risks before PDF/X conversion.
 */

// ================================================================
// Asset Specification Constants
// ================================================================

const SUPPORTED_FORMATS = {
  // Fully supported
  png:  { supported: true,  printSafe: true,  transparency: true,  label: 'PNG',  notes: 'Best for diagrams, screenshots. Supports transparency.' },
  jpg:  { supported: true,  printSafe: true,  transparency: false, label: 'JPEG', notes: 'Best for photographs. No transparency.' },
  jpeg: { supported: true,  printSafe: true,  transparency: false, label: 'JPEG', notes: 'Best for photographs. No transparency.' },
  pdf:  { supported: true,  printSafe: true,  transparency: true,  label: 'PDF',  notes: 'Vector graphics. Ideal for diagrams, charts.' },
  svg:  { supported: true,  printSafe: false, transparency: true,  label: 'SVG',  notes: 'Vector. May need conversion for print.' },
  eps:  { supported: true,  printSafe: true,  transparency: false, label: 'EPS',  notes: 'Legacy vector format. Fully print-safe.' },
  // Limited support
  tiff: { supported: true,  printSafe: true,  transparency: false, label: 'TIFF', notes: 'Professional print format. Large files.' },
  gif:  { supported: false, printSafe: false, transparency: true,  label: 'GIF',  notes: 'Not recommended for print. Limited colors.' },
  webp: { supported: false, printSafe: false, transparency: true,  label: 'WebP', notes: 'Web-only format. Not supported in LaTeX.' },
  bmp:  { supported: false, printSafe: false, transparency: false, label: 'BMP',  notes: 'Uncompressed. Not recommended.' },
};

/** DPI requirements by context */
const DPI_REQUIREMENTS = {
  print300:    { min: 300, recommended: 300, label: 'Print standard',     notes: 'Required for professional print output' },
  print600:    { min: 600, recommended: 600, label: 'High-quality print', notes: 'Recommended for fine art, photography' },
  lineArt:     { min: 600, recommended: 1200, label: 'Line art',         notes: 'Black-and-white line drawings, diagrams' },
  screenOnly:  { min: 72,  recommended: 150,  label: 'Screen/ebook',     notes: 'Sufficient for digital-only output' },
};

/** Maximum dimensions (inches) for common trim sizes */
const MAX_IMAGE_DIMENSIONS = {
  // Max printable area = trim size minus margins
  '5x8':     { maxWidth: 3.5,  maxHeight: 6.5 },
  '5.5x8.5': { maxWidth: 4.0,  maxHeight: 7.0 },
  '6x9':     { maxWidth: 4.5,  maxHeight: 7.5 },
  '7x10':    { maxWidth: 5.5,  maxHeight: 8.5 },
  '8.5x11':  { maxWidth: 7.0,  maxHeight: 9.5 },
  a4:        { maxWidth: 6.7,  maxHeight: 9.8 },
  a5:        { maxWidth: 4.4,  maxHeight: 6.9 },
};

/** Bleed specifications */
const BLEED_SPECS = {
  standard: { bleed: 0.125, safeZone: 0.25, label: 'Standard (⅛")' },
  none:     { bleed: 0,     safeZone: 0.25, label: 'No bleed' },
  full:     { bleed: 0.25,  safeZone: 0.375, label: 'Full bleed (¼")' },
};

// ================================================================
// Asset Extraction from Markdown
// ================================================================

/**
 * Extract all image references from markdown.
 * Returns structured data about each figure.
 */
function extractFigures(md) {
  const figures = [];
  const lines = md.split('\n');
  let figureNumber = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Standard markdown image: ![alt text](path "optional title")
    const imgMatch = line.match(/!\[([^\]]*)\]\(([^)]+?)(?:\s+"([^"]*)")?\)/);
    if (imgMatch) {
      figureNumber++;
      const alt = imgMatch[1];
      const src = imgMatch[2].trim();
      const title = imgMatch[3] || '';
      const ext = src.split('.').pop()?.toLowerCase() || '';

      figures.push({
        number: figureNumber,
        line: i + 1,
        alt,
        src,
        title,
        extension: ext,
        format: SUPPORTED_FORMATS[ext] || null,
        hasCaption: alt.length > 0,
        isExternal: /^https?:\/\//.test(src),
      });
    }
  }

  return figures;
}

/**
 * Extract all tables from markdown.
 * Detects pipe tables and their captions.
 */
function extractTables(md) {
  const tables = [];
  const lines = md.split('\n');
  let tableNumber = 0;
  let inTable = false;
  let tableStart = -1;
  let tableRows = 0;
  let tableCols = 0;
  let caption = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isTableRow = /^\|.*\|/.test(line.trim());
    const isSeparator = /^\|[\s\-:|]+\|/.test(line.trim());

    if (isTableRow && !inTable) {
      // Start of table — check previous line for caption
      inTable = true;
      tableStart = i + 1;
      tableRows = 0;
      tableCols = (line.match(/\|/g) || []).length - 1;

      // Look for table caption in preceding line: "Table N: Caption" or ": Caption"
      if (i > 0) {
        const prevLine = lines[i - 1].trim();
        const captionMatch = prevLine.match(/^(?:Table\s+\d+[:.]\s*)?[:]\s*(.+)$/i) ||
                             prevLine.match(/^Table\s+\d+[:.]\s*(.+)$/i);
        if (captionMatch) {
          caption = captionMatch[1];
        }
      }
    }

    if (inTable && isTableRow) {
      if (!isSeparator) tableRows++;
    } else if (inTable && !isTableRow) {
      // End of table
      tableNumber++;
      tables.push({
        number: tableNumber,
        line: tableStart,
        rows: tableRows,
        columns: tableCols,
        caption: caption || `Table ${tableNumber}`,
        hasCaption: caption.length > 0,
      });
      inTable = false;
      caption = '';
    }
  }

  // Handle table at end of file
  if (inTable) {
    tableNumber++;
    tables.push({
      number: tableNumber,
      line: tableStart,
      rows: tableRows,
      columns: tableCols,
      caption: caption || `Table ${tableNumber}`,
      hasCaption: caption.length > 0,
    });
  }

  return tables;
}

/**
 * Extract cross-references from markdown.
 * Looks for patterns like {#fig:label}, {#tbl:label}, [@fig:label], [@tbl:label]
 */
function extractCrossReferences(md) {
  const refs = [];

  // pandoc-crossref style: {#fig:label}, {#tbl:label}, {#sec:label}, {#eq:label}
  const definePattern = /\{#(fig|tbl|sec|eq):([^}]+)\}/g;
  let m;
  while ((m = definePattern.exec(md)) !== null) {
    refs.push({ type: m[1], label: m[2], kind: 'definition', position: m.index });
  }

  // Reference patterns: [@fig:label], [@tbl:label]
  const refPattern = /\[@(fig|tbl|sec|eq):([^\]]+)\]/g;
  while ((m = refPattern.exec(md)) !== null) {
    refs.push({ type: m[1], label: m[2], kind: 'reference', position: m.index });
  }

  return refs;
}

// ================================================================
// Validation
// ================================================================

/**
 * Validate all figures in the manuscript.
 *
 * @param {string} md — manuscript markdown
 * @param {object} opts — { trimSize, bleedType, context }
 * @returns {{ figures, tables, crossRefs, issues, stats }}
 */
function validateAssets(md, opts = {}) {
  const { trimSize = '6x9', bleedType = 'standard', context = 'print300' } = opts;

  const figures = extractFigures(md);
  const tables = extractTables(md);
  const crossRefs = extractCrossReferences(md);
  const issues = [];

  const dpiReq = DPI_REQUIREMENTS[context] || DPI_REQUIREMENTS.print300;
  const maxDims = MAX_IMAGE_DIMENSIONS[trimSize] || MAX_IMAGE_DIMENSIONS['6x9'];
  const bleed = BLEED_SPECS[bleedType] || BLEED_SPECS.standard;

  // ── Figure validation ──
  for (const fig of figures) {
    // Format check
    if (!fig.format) {
      issues.push({
        type: 'format',
        severity: 'error',
        figure: fig.number,
        line: fig.line,
        message: `Figure ${fig.number}: Unknown format ".${fig.extension}". Supported: ${Object.keys(SUPPORTED_FORMATS).filter(k => SUPPORTED_FORMATS[k].supported).join(', ')}.`,
      });
    } else if (!fig.format.supported) {
      issues.push({
        type: 'format',
        severity: 'error',
        figure: fig.number,
        line: fig.line,
        message: `Figure ${fig.number}: Format "${fig.format.label}" is not supported for PDF output. ${fig.format.notes}`,
      });
    } else if (!fig.format.printSafe) {
      issues.push({
        type: 'format',
        severity: 'warn',
        figure: fig.number,
        line: fig.line,
        message: `Figure ${fig.number}: "${fig.format.label}" may need conversion for print. Consider PNG or PDF.`,
      });
    }

    // Transparency risk (for PDF/X conversion)
    if (fig.format?.transparency) {
      issues.push({
        type: 'transparency',
        severity: 'info',
        figure: fig.number,
        line: fig.line,
        message: `Figure ${fig.number}: "${fig.format.label}" supports transparency. Transparency will be flattened for PDF/X-1a conversion (IngramSpark).`,
      });
    }

    // Caption check
    if (!fig.hasCaption) {
      issues.push({
        type: 'caption',
        severity: 'warn',
        figure: fig.number,
        line: fig.line,
        message: `Figure ${fig.number}: No alt text/caption. Add descriptive text in brackets: ![Caption here](path).`,
      });
    }

    // External image warning
    if (fig.isExternal) {
      issues.push({
        type: 'external',
        severity: 'warn',
        figure: fig.number,
        line: fig.line,
        message: `Figure ${fig.number}: External URL detected. External images may fail during compilation. Consider embedding the image locally.`,
      });
    }
  }

  // ── Table validation ──
  for (const tbl of tables) {
    if (!tbl.hasCaption) {
      issues.push({
        type: 'caption',
        severity: 'info',
        table: tbl.number,
        line: tbl.line,
        message: `Table ${tbl.number}: No caption found. Add "Table N: Description" above the table for proper numbering.`,
      });
    }

    if (tbl.columns > 8) {
      issues.push({
        type: 'layout',
        severity: 'warn',
        table: tbl.number,
        line: tbl.line,
        message: `Table ${tbl.number}: ${tbl.columns} columns may overflow page margins at ${trimSize}. Consider landscape orientation or splitting.`,
      });
    }
  }

  // ── Cross-reference validation ──
  const definitions = crossRefs.filter(r => r.kind === 'definition');
  const references = crossRefs.filter(r => r.kind === 'reference');
  const definedLabels = new Set(definitions.map(d => `${d.type}:${d.label}`));

  for (const ref of references) {
    const fullLabel = `${ref.type}:${ref.label}`;
    if (!definedLabels.has(fullLabel)) {
      issues.push({
        type: 'crossref',
        severity: 'warn',
        message: `Cross-reference "@${fullLabel}" has no matching definition "{#${fullLabel}}" in the document.`,
      });
    }
  }

  // ── Stats ──
  const stats = {
    figureCount: figures.length,
    tableCount: tables.length,
    crossRefDefinitions: definitions.length,
    crossRefReferences: references.length,
    formatsUsed: [...new Set(figures.map(f => f.extension))],
    externalImages: figures.filter(f => f.isExternal).length,
    missingCaptions: figures.filter(f => !f.hasCaption).length + tables.filter(t => !t.hasCaption).length,
  };

  return { figures, tables, crossRefs, issues, stats };
}

// ================================================================
// LaTeX Preamble for Figures/Tables
// ================================================================

/**
 * Generate LaTeX preamble additions for proper figure/table handling.
 */
function generateAssetsPreamble(assetAnalysis) {
  const commands = [
    '% ── Figures, Tables, and Assets System ──',
  ];

  if (assetAnalysis.stats.figureCount > 0) {
    commands.push(
      '\\usepackage{graphicx}',
      '\\usepackage{float}',
      '\\usepackage[font=small,labelfont=bf,format=hang]{caption}',
      '\\captionsetup[figure]{name=Figure}',
      '\\captionsetup[table]{name=Table}',
      '',
      '% Figure placement defaults — prefer [htbp]',
      '\\makeatletter',
      '\\def\\fps@figure{htbp}',
      '\\def\\fps@table{htbp}',
      '\\makeatother',
    );
  }

  // Cross-reference support
  if (assetAnalysis.stats.crossRefDefinitions > 0) {
    commands.push(
      '',
      '% Cross-reference numbering',
      '\\usepackage{cleveref}',
      '\\crefname{figure}{Figure}{Figures}',
      '\\crefname{table}{Table}{Tables}',
    );
  }

  return commands.join('\n');
}

// ================================================================
// DPI Estimation Helper
// ================================================================

/**
 * Estimate DPI from known image dimensions and print size.
 * This is used for advisory purposes when actual image metadata isn't available.
 */
function estimateDPI(pixelWidth, pixelHeight, printWidthInches, printHeightInches) {
  const dpiW = pixelWidth / printWidthInches;
  const dpiH = pixelHeight / printHeightInches;
  const effectiveDPI = Math.min(dpiW, dpiH);

  let quality;
  if (effectiveDPI >= 300) quality = 'excellent';
  else if (effectiveDPI >= 200) quality = 'acceptable';
  else if (effectiveDPI >= 150) quality = 'low';
  else quality = 'insufficient';

  return {
    effectiveDPI: Math.round(effectiveDPI),
    horizontalDPI: Math.round(dpiW),
    verticalDPI: Math.round(dpiH),
    quality,
    printSafe: effectiveDPI >= 300,
    message: effectiveDPI >= 300
      ? `${Math.round(effectiveDPI)} DPI — print-ready`
      : `${Math.round(effectiveDPI)} DPI — below 300 DPI print minimum. Resize or replace for print output.`,
  };
}

// ================================================================
// Exports
// ================================================================

module.exports = {
  SUPPORTED_FORMATS,
  DPI_REQUIREMENTS,
  MAX_IMAGE_DIMENSIONS,
  BLEED_SPECS,
  extractFigures,
  extractTables,
  extractCrossReferences,
  validateAssets,
  generateAssetsPreamble,
  estimateDPI,
};
