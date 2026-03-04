/**
 * Collaboration and Provenance System
 *
 * Versioning, export snapshots, build metadata, and reproducible builds.
 * Every export includes build metadata so authors can trace exactly
 * which settings produced a given PDF.
 */

const crypto = require('crypto');
const { execSync } = require('child_process');

// ── Detect runtime versions once at startup ──
let _pandocVersion = 'unknown';
let _typstVersion = 'unknown';
try {
  const pv = execSync('pandoc --version', { encoding: 'utf8', timeout: 3000 });
  const m = pv.match(/pandoc(?:\.exe)?\s+([\d.]+)/);
  if (m) _pandocVersion = m[1];
} catch { /* pandoc not installed */ }
try {
  const tv = execSync('typst --version', { encoding: 'utf8', timeout: 3000 });
  const m = tv.match(/typst\s+([\d.]+)/i) || tv.match(/([\d.]+)/);
  if (m) _typstVersion = m[1];
} catch { /* typst not installed */ }

// ================================================================
// Build Metadata
// ================================================================

/**
 * Generate a complete build metadata object.
 * This gets embedded in the PDF and returned with every compile.
 *
 * @param {object} opts
 * @param {string} opts.manuscriptText — the raw markdown
 * @param {string} opts.template       — template key
 * @param {string} opts.pageSize       — page size key
 * @param {string} opts.marginPreset   — margin preset
 * @param {boolean} opts.safeMode      — citation safe mode
 * @param {string} opts.compileMode    — 'fast' | 'full'
 * @param {string} opts.title          — document title
 * @param {string} [opts.userId]       — optional user ID
 * @param {string} [opts.outputFormat] — 'pdf' | 'pdfx1a'
 * @param {string} [opts.headingVariant] — 'classic' | 'modern' | 'bold'
 * @param {boolean} [opts.needsWatermark] — whether output is watermarked
 * @param {object} [opts.customFonts]  — custom font mappings { main?, sans?, mono? }
 * @returns {object} Build metadata
 */
function generateBuildMetadata(opts) {
  const {
    manuscriptText = '',
    template = 'symphony',
    pageSize = 'sixByNine',
    marginPreset = 'normal',
    safeMode = true,
    compileMode = 'fast',
    title = 'Untitled',
    userId = null,
    outputFormat = 'pdf',
    headingVariant = 'classic',
    needsWatermark = false,
    customFonts = null,
  } = opts;

  const now = new Date();

  // Content fingerprint — deterministic hash of manuscript + settings.
  // IMPORTANT: settingsString must include EVERY parameter that affects the
  // compiled output. If two compiles with different parameters share the same
  // hash, a cached result with the wrong watermark/fonts/variant could be
  // served to the wrong user.
  const settingsString = JSON.stringify({
    template, pageSize, marginPreset, safeMode, compileMode,
    outputFormat, headingVariant, needsWatermark,
    customFonts: customFonts || null,
  });
  const contentHash = crypto.createHash('sha256')
    .update(manuscriptText)
    .digest('hex')
    .slice(0, 12);
  const settingsHash = crypto.createHash('sha256')
    .update(settingsString)
    .digest('hex')
    .slice(0, 8);

  // Build ID: timestamp + content hash + settings hash
  const buildId = `pp-${now.toISOString().replace(/[-:T]/g, '').slice(0, 14)}-${contentHash}-${settingsHash}`;

  return {
    buildId,
    timestamp: now.toISOString(),
    timestampUnix: Math.floor(now.getTime() / 1000),

    // Content fingerprint
    contentHash,
    settingsHash,
    wordCount: manuscriptText.split(/\s+/).filter(w => w.length > 0).length,
    characterCount: manuscriptText.length,

    // Build configuration
    config: {
      template,
      pageSize,
      marginPreset,
      safeMode,
      compileMode,
      outputFormat,
      title,
    },

    // System info — runtime versions for reproducibility
    system: {
      engine: 'PagePerfect',
      version: '3.1',
      pdfEngine: 'typst',
      pdfEngineVersion: _typstVersion,
      processor: 'pandoc',
      processorVersion: _pandocVersion,
    },

    // User context (if authenticated)
    ...(userId ? { userId } : {}),
  };
}

// ================================================================
// Export Snapshot
// ================================================================

/**
 * Create an export snapshot — a complete record of what was exported.
 * Useful for reproducible builds and audit trails.
 *
 * @param {object} buildMeta — from generateBuildMetadata
 * @param {object} results   — compilation results
 * @returns {object} Snapshot object
 */
function createExportSnapshot(buildMeta, results = {}) {
  return {
    snapshotVersion: 1,
    buildId: buildMeta.buildId,
    timestamp: buildMeta.timestamp,
    config: buildMeta.config,
    contentHash: buildMeta.contentHash,
    settingsHash: buildMeta.settingsHash,
    wordCount: buildMeta.wordCount,

    // Results
    success: results.success !== false,
    compileTimeMs: results.compileTimeMs || null,
    outputFormat: buildMeta.config.outputFormat,
    estimatedPages: results.estimatedPages || Math.ceil(buildMeta.wordCount / 250),

    // Validation results
    preflightPassed: results.preflightPassed ?? null,
    lintIssues: results.lintIssueCount ?? null,
    structureWarnings: results.structureWarningCount ?? null,

    // Provenance chain
    system: buildMeta.system,
  };
}

// ================================================================
// LaTeX Metadata Embedding
// ================================================================

/**
 * Generate LaTeX commands to embed build metadata in the PDF.
 * Uses hyperref's pdfinfo mechanism.
 *
 * @param {object} buildMeta — from generateBuildMetadata
 * @returns {string} LaTeX preamble snippet
 */
function generateMetadataPreamble(buildMeta) {
  const safeStr = (s) => String(s || '').replace(/[\\{}]/g, '');

  return [
    '% ── Provenance & Build Metadata ──',
    '\\hypersetup{',
    `  pdfproducer={PagePerfect ${buildMeta.system.version} / Typst ${safeStr(buildMeta.system.pdfEngineVersion)} / Pandoc ${safeStr(buildMeta.system.processorVersion)}},`,
    `  pdfcreator={PagePerfect Build ${safeStr(buildMeta.buildId)}},`,
    `  pdfsubject={Template: ${safeStr(buildMeta.config.template)} / Size: ${safeStr(buildMeta.config.pageSize)} / Margins: ${safeStr(buildMeta.config.marginPreset)}},`,
    `  pdfkeywords={PagePerfect, ${safeStr(buildMeta.config.template)}, ${safeStr(buildMeta.contentHash)}}`,
    '}',
  ].join('\n');
}

// ================================================================
// Version Comparison
// ================================================================

/**
 * Compare two build snapshots to identify what changed.
 *
 * @param {object} snapshotA — older snapshot
 * @param {object} snapshotB — newer snapshot
 * @returns {{ changed, details }}
 */
function compareSnapshots(snapshotA, snapshotB) {
  const changes = [];

  if (snapshotA.contentHash !== snapshotB.contentHash) {
    changes.push({
      field: 'content',
      from: snapshotA.contentHash,
      to: snapshotB.contentHash,
      message: 'Manuscript content changed.',
    });
  }

  if (snapshotA.settingsHash !== snapshotB.settingsHash) {
    // Detailed config diff
    const configA = snapshotA.config || {};
    const configB = snapshotB.config || {};
    for (const key of new Set([...Object.keys(configA), ...Object.keys(configB)])) {
      if (configA[key] !== configB[key]) {
        changes.push({
          field: `config.${key}`,
          from: configA[key],
          to: configB[key],
          message: `${key} changed from "${configA[key]}" to "${configB[key]}".`,
        });
      }
    }
  }

  if (snapshotA.wordCount !== snapshotB.wordCount) {
    const diff = snapshotB.wordCount - snapshotA.wordCount;
    changes.push({
      field: 'wordCount',
      from: snapshotA.wordCount,
      to: snapshotB.wordCount,
      message: `Word count ${diff > 0 ? 'increased' : 'decreased'} by ${Math.abs(diff)} (${snapshotA.wordCount} → ${snapshotB.wordCount}).`,
    });
  }

  return {
    changed: changes.length > 0,
    changeCount: changes.length,
    details: changes,
    timeBetween: snapshotA.timestamp && snapshotB.timestamp
      ? new Date(snapshotB.timestamp).getTime() - new Date(snapshotA.timestamp).getTime()
      : null,
  };
}

// ================================================================
// Exports
// ================================================================

module.exports = {
  generateBuildMetadata,
  createExportSnapshot,
  generateMetadataPreamble,
  compareSnapshots,
};
