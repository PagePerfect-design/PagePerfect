/**
 * Compile Worker — BullMQ processor for PDF compilation jobs.
 *
 * Runs pandoc + typst with bounded concurrency (default: 3).
 * Each job receives only lightweight metadata — the manuscript is written
 * to a temp file BEFORE enqueue and the path is passed via job data.
 *
 * SECURITY FIXES APPLIED:
 *   - Sanitization on all user-supplied strings (title, font names)
 *   - Auth re-verified via userId + admin token (no user auth token in Redis)
 *   - Font names validated against registry
 *
 * CRITICAL: Auth and watermark decisions are RE-VERIFIED at compile time,
 * NOT trusted from the enqueue snapshot. A user's tier or credits may
 * change while a job waits in the queue.
 */

const fs = require('fs');
const fsp = require('fs').promises;
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const log = require('./logger').child({ module: 'worker' });

// ── Backend modules ──
const GridSystem = require('./grid-system');
const provenance = require('./provenance');
const bookEngineering = require('./book-engineering');
const templateExtensions = require('./template-extensions');
const headingVariants = require('./heading-variants');
const fontAvailability = require('./font-availability');
const publishing = require('./publishing');
const typstErrorTranslator = require('./typst-error-translator');
const typographyAssurance = require('./typography-assurance');
const dropCapTypst = require('./drop-cap-typst');
const layoutSanityChecker = require('./layout-sanity-checker');
const textNormalizer = require('./text-normalizer');
const watermarkTypst = require('./watermark-typst');
const headingVariantsTypst = require('./heading-variants-typst');
const latexSanitizer = require('./latex-sanitizer');
const {
  PANDOC_HAS_CITEPROC,
  citeprocArgs,
  sanitizeStderr,
  stripCitations,
  styleWarnings,
  hasTier,
  POCKETBASE_URL,
  isPocketBaseConfigured,
  BIB_PATH,
} = require('./compile-utils');

const { execSync } = require('child_process');

const gridSystem = new GridSystem();
const COMPILE_TIMEOUT_MS = Number(process.env.COMPILE_TIMEOUT_MS || 45_000);
const MAX_STDERR_BYTES = 256 * 1024; // 256KB — cap stderr accumulation from Pandoc

// ── Toolchain version detection (once at module load) ──
let _pandocVersion = 'unknown';
let _typstVersion = 'unknown';
try {
  const pv = execSync('pandoc --version 2>/dev/null | head -1', { encoding: 'utf8', timeout: 5000 });
  const m = pv.match(/pandoc(?:\.exe)?\s+([\d.]+)/);
  if (m) _pandocVersion = m[1];
} catch {}
try {
  const tv = execSync('typst --version 2>/dev/null', { encoding: 'utf8', timeout: 5000 });
  const m = tv.match(/typst\s+([\d.]+)/i) || tv.match(/([\d.]+)/);
  if (m) _typstVersion = m[1];
} catch {}
log.info({ pandocVersion: _pandocVersion, typstVersion: _typstVersion }, 'Typst compile engine ready');

/**
 * Build deterministic runtime metadata for every compile result.
 * Always present — allows correlating failures with environment state
 * without digging into server logs.
 */
function buildDebugMeta(job, opts = {}) {
  return {
    locale: SAFE_SPAWN_ENV.LANG,
    pandocVersion: _pandocVersion,
    typstVersion: _typstVersion,
    engine: 'typst',
    template: opts.template || job.data.template,
    safeMode: Boolean(opts.safeMode ?? job.data.safeMode),
    compileMode: opts.compileMode || job.data.compileMode || 'fast',
    nodeVersion: process.version,
    workerPid: process.pid,
    containerId: os.hostname(),
    timestamp: new Date().toISOString(),
  };
}

/**
 * Build a consistent failure result. Guarantees every failure includes
 * errors, warnings, debug, debugMeta, and detail — even if some are empty.
 * This prevents null fields from reaching the status endpoint / frontend.
 */
function buildFailureResult(opts) {
  return {
    success: false,
    error: opts.error || 'compile_failed',
    message: opts.message || 'Compilation failed.',
    errors: opts.errors || [],
    warnings: opts.warnings || [],
    detail: opts.detail || null,
    debug: opts.debug || { texSource: null, latexLog: null, headerTex: null, filesInDir: [], captureError: null },
    debugMeta: opts.debugMeta || null,
    ...(opts.extra || {}),
  };
}

// SECURITY: Minimal environment for spawned Pandoc/Typst processes.
// Strips all backend secrets (Stripe, PocketBase, Redis) that Pandoc doesn't need.
const SPAWN_LOCALE = (process.env.PP_SPAWN_LOCALE !== undefined)
  ? process.env.PP_SPAWN_LOCALE
  : 'C.UTF-8';
const SAFE_SPAWN_ENV = {
  PATH: process.env.PATH,
  HOME: process.env.HOME || '/app',
  TMPDIR: os.tmpdir(),
  LANG: SPAWN_LOCALE,
  LC_ALL: SPAWN_LOCALE,
  LC_CTYPE: SPAWN_LOCALE,
  SOURCE_DATE_EPOCH: String(Math.floor(Date.now() / 1000)),
};

// ================================================================
// PocketBase auth — re-verified at compile time via admin token
// ================================================================

let _pbAdminToken = null;
let _pbTokenExpiry = 0;

async function getPbAdminToken() {
  if (_pbAdminToken && Date.now() < _pbTokenExpiry) return _pbAdminToken;
  if (!POCKETBASE_URL || !process.env.POCKETBASE_ADMIN_EMAIL || !process.env.POCKETBASE_ADMIN_PASSWORD) {
    return null;
  }
  try {
    const resp = await fetch(`${POCKETBASE_URL}/api/collections/_superusers/auth-with-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(5000),
      body: JSON.stringify({
        identity: process.env.POCKETBASE_ADMIN_EMAIL,
        password: process.env.POCKETBASE_ADMIN_PASSWORD,
      }),
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    _pbAdminToken = data.token;
    _pbTokenExpiry = Date.now() + 115 * 60 * 1000;
    return _pbAdminToken;
  } catch (err) {
    log.error({ err: err.message }, 'PocketBase admin auth failed');
    return null;
  }
}

/**
 * Re-verify user tier using userId + admin token (NOT user auth token).
 * This avoids storing user auth tokens in Redis.
 */
async function verifyUserTierById(userId) {
  if (!isPocketBaseConfigured || !userId) {
    return { userId: null, tier: 'anonymous' };
  }
  try {
    const token = await getPbAdminToken();
    if (!token) return { userId, tier: 'drafter' };

    const resp = await fetch(`${POCKETBASE_URL}/api/collections/users/records/${userId}`, {
      headers: { Authorization: token, 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(5000),
    });
    if (resp?.ok) {
      const record = await resp.json();
      if (record) {
        let tier = record.tier || 'drafter';
        if (tier === 'drafter' && record.publisher_window_end) {
          if (new Date(record.publisher_window_end) > new Date()) tier = 'publisher';
        }
        return { userId: record.id, tier };
      }
    }
  } catch (err) {
    log.error({ err: err.message }, 'Tier re-verification failed');
  }
  return { userId, tier: 'drafter' };
}

// ================================================================
// Helpers
// ================================================================

/**
 * Escape a JS string for safe embedding in a Typst string literal.
 * Returns a quoted Typst string: "some text"
 */
function typstString(s) {
  if (s == null) return 'none';
  return '"' + String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
}

// ================================================================
// Core processor — called by BullMQ Worker for each job
// ================================================================

/**
 * @param {import('bullmq').Job} job
 * @param {object} templateRegistry - DESIGN_TEMPLATES from index.js
 * @returns {object} Result metadata (PDF stays on disk, not in Redis)
 */
async function processCompileJob(job, templateRegistry) {
  // TOP-LEVEL SAFETY NET: If ANYTHING throws unexpectedly, we still return
  // a complete failure result instead of leaving BullMQ with no return value
  // (which causes debugMeta: null, errors: null in the status endpoint).
  try {
    return await _processCompileJobInner(job, templateRegistry);
  } catch (err) {
    log.error({ jobId: job?.id, err: err.message, stack: err.stack }, 'processCompileJob: unhandled exception — returning safe failure');
    return buildFailureResult({
      error: 'internal_error',
      message: `Internal compile error: ${err.message}`,
      debugMeta: buildDebugMeta(job),
    });
  }
}

async function _processCompileJobInner(job, templateRegistry) {
  const {
    manuscriptPath, template, title, pageSize, marginPreset,
    safeMode, compileMode, outputFormat, customFonts,
    headingVariant, isDownload, userId: enqueueUserId, extensions,
    assets,
  } = job.data;

  const tplKey = templateRegistry[String(template)] ? String(template) : 'symphony';
  const tpl = templateRegistry[tplKey];

  // ── Read manuscript from temp file (NOT from Redis) ──
  let manuscriptText;
  try {
    manuscriptText = await fsp.readFile(manuscriptPath, 'utf8');
  } catch (err) {
    return {
      success: false, error: 'manuscript_not_found',
      message: `Manuscript file not found: ${err.message}`,
      debug: { texSource: null, latexLog: null, headerTex: null, filesInDir: [], captureError: null, manuscriptPath },
      debugMeta: buildDebugMeta(job),
    };
  }

  // ── Re-verify auth at compile time via admin token (no user token in Redis) ──
  const user = await verifyUserTierById(enqueueUserId);
  const userTier = user.tier;
  const userId = user.userId;
  const wantPdfX = outputFormat === 'pdfx1a';
  const wantEpub = outputFormat === 'epub';

  // ── Feature gates (re-checked — tier may have changed) ──
  const meta = buildDebugMeta(job, { template: tplKey, safeMode, compileMode });
  if (wantEpub && !hasTier(userTier, 'studio'))
    return { success: false, error: 'tier_required', message: 'EPUB export requires Studio.', debugMeta: meta };
  if (wantPdfX && !hasTier(userTier, 'publisher'))
    return { success: false, error: 'tier_required', message: 'PDF/X-1a requires Publisher or Studio.', debugMeta: meta };
  if (customFonts && typeof customFonts === 'object' && Object.keys(customFonts).length > 0)
    if (!hasTier(userTier, 'studio'))
      return { success: false, error: 'tier_required', message: 'Custom fonts require Studio.', debugMeta: meta };

  // ── Watermark decision — re-evaluated at compile time ──
  // Publisher+ tiers get unwatermarked downloads; everyone else gets watermarked.
  let needsWatermark = false;
  if (isDownload && isPocketBaseConfigured) {
    needsWatermark = !hasTier(userTier, 'publisher');
  } else if (isDownload && !isPocketBaseConfigured) {
    needsWatermark = true;
  }

  // ── Warnings accumulator (declared early — used by multiple stages below) ──
  const warnings = styleWarnings(manuscriptText);

  // ── Normalize text for format-agnostic input ──
  manuscriptText = textNormalizer.normalize(manuscriptText, tplKey);

  // ── Strip remote images (prevents Pandoc from fetching external URLs) ──
  const imgResult = textNormalizer.stripRemoteImages(manuscriptText);
  manuscriptText = imgResult.text;
  if (imgResult.stripped > 0) {
    warnings.push(`${imgResult.stripped} remote image(s) removed — upload assets directly.`);
  }

  // ── Compile in isolated temp dir ──
  const tmpBase = await fsp.mkdtemp(path.join(os.tmpdir(), 'pp-worker-'));
  const mdPath = path.join(tmpBase, 'input.md');
  const pdfPath = path.join(tmpBase, 'output.pdf');
  const effectiveMd = safeMode ? stripCitations(manuscriptText) : manuscriptText;
  await fsp.writeFile(mdPath, effectiveMd, 'utf8');

  // ── Copy uploaded image assets into compile temp dir ──
  // Assets are stored in /tmp/pp-assets/{UUID}/{filename} and referenced in
  // Markdown as ![caption](filename). Pandoc's --resource-path covers tmpBase,
  // so copying the files there makes them findable.
  if (Array.isArray(assets) && assets.length > 0) {
    const CUSTOM_ASSETS_DIR = path.join(os.tmpdir(), 'pp-assets');
    let assetsCopied = 0;
    for (const assetId of assets) {
      // Validate UUID format (prevents path traversal)
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(assetId)) continue;
      const srcDir = path.join(CUSTOM_ASSETS_DIR, assetId);
      if (!fs.existsSync(srcDir)) {
        warnings.push(`Image asset ${assetId.slice(0, 8)}… not found (may have expired).`);
        continue;
      }
      try {
        const files = fs.readdirSync(srcDir).filter(f => /\.(png|jpe?g|pdf|svg|eps|tiff?)$/i.test(f));
        for (const file of files) {
          const safeFileName = file.replace(/[^a-zA-Z0-9._-]/g, '_');
          fs.copyFileSync(path.join(srcDir, file), path.join(tmpBase, safeFileName));
          assetsCopied++;
        }
      } catch (err) {
        log.warn({ assetId, err: err.message }, 'Failed to copy asset into compile dir');
      }
    }
    if (assetsCopied > 0) {
      log.info({ jobId: job.id, assetsCopied }, 'Copied image assets into compile dir');
    }
  }

  // ── Sanitize title for LaTeX ──
  const safeTitle = latexSanitizer.sanitizeTitle(title);

  // ── EPUB path ──
  if (wantEpub) return compileEpub(tmpBase, mdPath, safeTitle, safeMode);

  // ── PDF compilation ──
  const templateType = tpl.gridType || 'academic';
  const isFast = compileMode === 'fast';

  // ── Typst template resolution ──
  const typstTemplatePath = path.resolve(__dirname, 'typst-templates', `${tplKey}.typ`);
  if (!fs.existsSync(typstTemplatePath)) {
    return {
      success: false, error: 'template_not_found',
      message: `Typst template "${tplKey}" not found.`,
      warnings,
      debugMeta: buildDebugMeta(job),
    };
  }

  log.info({ jobId: job.id, engine: 'typst', tplKey }, 'Compiling with Typst');

  const geo = gridSystem.calculateTypstMargins(pageSize, marginPreset, templateType);

  // Lint manuscript for common issues (double spaces, bad dashes, heading hierarchy)
  try {
    const lint = bookEngineering.lintManuscript(manuscriptText, templateType);
    for (const issue of lint.issues || []) {
      if (issue.severity === 'warn' || issue.severity === 'info') {
        warnings.push(issue.message);
      }
    }
  } catch (err) {
    log.warn({ err: err.message }, 'Manuscript lint failed');
  }

  // Font resolution — validate font names from registry, not arbitrary user input
  const fontRes = fontAvailability.resolveFont(tpl.mainfont);
  const mainFont = fontRes.resolved;
  if (fontRes.warning) warnings.push(fontRes.warning);
  const sansRes = tpl.sansfont ? fontAvailability.resolveFont(tpl.sansfont) : null;
  const monoRes = tpl.monofont ? fontAvailability.resolveFont(tpl.monofont) : null;
  if (sansRes?.warning) warnings.push(sansRes.warning);
  if (monoRes?.warning) warnings.push(monoRes.warning);

  // ══════════════════════════════════════════════════════════════
  // SPLIT PIPELINE: Pandoc body-only → JS assembly → Typst compile
  // ══════════════════════════════════════════════════════════════

  // Pre-flight: disk space check
  try {
    const tmpStats = await fsp.statfs(tmpBase);
    const freeBytes = tmpStats.bavail * tmpStats.bsize;
    const freeMB = Math.round(freeBytes / (1024 * 1024));
    if (freeBytes < 50 * 1024 * 1024) {
      log.warn({ jobId: job.id, freeMB }, 'Insufficient disk space for compilation');
      try { fs.rmSync(tmpBase, { recursive: true, force: true }); } catch {}
      return {
        success: false, error: 'disk_full',
        message: `Insufficient disk space (${freeMB} MB free).`,
        warnings,
        debugMeta: buildDebugMeta(job, { engine: 'typst' }),
      };
    }
  } catch {}

  // ── STEP A: Pandoc converts Markdown → Typst body ──────────
  const bodyPath = path.join(tmpBase, 'body.typ');
  const hardBreaks = tplKey === 'verse' ? '+hard_line_breaks' : '';
  const disableMath = !textNormalizer.MATH_TEMPLATES.has(tplKey) ? '-tex_math_dollars' : '';
  const fencedDivs = tplKey === 'cinema' ? '+fenced_divs' : '';
  const fromFmt = safeMode
    ? `--from=markdown${hardBreaks}${fencedDivs}${disableMath}-raw_tex-raw_attribute`
    : PANDOC_HAS_CITEPROC
      ? `--from=markdown+citations${hardBreaks}${fencedDivs}${disableMath}-raw_tex-raw_attribute`
      : `--from=markdown${hardBreaks}${fencedDivs}${disableMath}-raw_tex-raw_attribute`;

  const tplClass = headingVariants.TEMPLATE_CLASS[tplKey] || 'article';
  const topLevelDiv = tplClass === 'book' ? 'chapter' : 'section';

  const luaFilters = [];
  const filtersDir = path.join(__dirname, 'filters');
  if (tplKey === 'cinema') {
    luaFilters.push('--lua-filter', path.join(filtersDir, 'fountain.lua'));
  }

  // Pandoc body-only: no --template, no --pdf-engine, no -H, no -V
  const pandocArgs = [
    mdPath, fromFmt, '-t', 'typst',
    `--top-level-division=${topLevelDiv}`,
    `--resource-path=${tmpBase}`,
    ...luaFilters,
    ...(safeMode ? [] : citeprocArgs(BIB_PATH)),
    '-o', bodyPath,
  ];

  const pandocResult = await new Promise((resolve) => {
    let proc;
    try { proc = spawn('pandoc', pandocArgs, { cwd: tmpBase, env: SAFE_SPAWN_ENV }); }
    catch (e) { resolve({ ok: false, error: 'spawn_failed', message: String(e) }); return; }
    let stderr = '';
    let stderrBytes = 0;
    proc.stderr.on('data', (d) => { if (stderrBytes < MAX_STDERR_BYTES) { stderr += d.toString(); stderrBytes += d.length; } });
    proc.on('error', (e) => resolve({ ok: false, error: 'spawn_failed', message: String(e) }));
    let timedOut = false;
    const kill = setTimeout(() => { timedOut = true; try { proc.kill('SIGKILL'); } catch {} }, COMPILE_TIMEOUT_MS);
    proc.on('close', (code) => {
      clearTimeout(kill);
      if (timedOut) { resolve({ ok: false, error: 'pandoc_timeout', stderr }); return; }
      if (code === 0) { resolve({ ok: true, stderr }); }
      else { resolve({ ok: false, error: 'pandoc_failed', stderr }); }
    });
  });

  if (!pandocResult.ok) {
    let debugFiles = [];
    try { debugFiles = fs.readdirSync(tmpBase); } catch {}
    try { fs.rmSync(tmpBase, { recursive: true, force: true }); } catch {}
    return {
      success: false, error: pandocResult.error || 'pandoc_failed',
      message: sanitizeStderr((pandocResult.stderr || '').split('\n').slice(-10).join('\n')) || 'Pandoc markdown-to-typst conversion failed.',
      warnings,
      debug: { filesInDir: debugFiles },
      debugMeta: buildDebugMeta(job, { engine: 'typst' }),
    };
  }

  // ── STEP B: Read template, split at %% CONTENT %% ──────────
  let tplContent;
  try {
    tplContent = await fsp.readFile(typstTemplatePath, 'utf8');
  } catch (err) {
    try { fs.rmSync(tmpBase, { recursive: true, force: true }); } catch {}
    return {
      success: false, error: 'template_read_error', message: String(err), warnings,
      debugMeta: buildDebugMeta(job, { engine: 'typst' }),
    };
  }

  const CONTENT_MARKER = '// %% CONTENT %%';
  const markerIdx = tplContent.indexOf(CONTENT_MARKER);
  if (markerIdx < 0) {
    try { fs.rmSync(tmpBase, { recursive: true, force: true }); } catch {}
    return {
      success: false, error: 'template_marker_missing',
      message: `Template "${tplKey}" missing %% CONTENT %% marker.`, warnings,
      debugMeta: buildDebugMeta(job, { engine: 'typst' }),
    };
  }
  const tplStyle = tplContent.slice(0, markerIdx).trim();
  const tplContentSection = tplContent.slice(markerIdx + CONTENT_MARKER.length).trim();

  // ── STEP C: Assemble main.typ ──────────────────────────────
  let buildMeta;
  const mainParts = [];
  try {
    // 1. Preamble: Pandoc compatibility + pipeline variables
    mainParts.push(
      '// PagePerfect compiled document — assembled by compile-worker.js',
      '// Pandoc emits #horizontalrule for Markdown "---" thematic breaks',
      '#let horizontalrule = { v(1.5em); align(center)[#text(size: 9pt, fill: luma(140))[\\* #h(1em) \\* #h(1em) \\*]]; v(1.5em) }',
      '// Helper: tracking() applies letter-spacing to content',
      '#let tracking(amount, content) = text(tracking: amount)[#content]',
      `#let pp-title = ${typstString(safeTitle)}`,
      `#let pp-author = ${job.data.author ? typstString(latexSanitizer.sanitizeTitle(job.data.author, 200)) : 'none'}`,
      `#let pp-date = ${job.data.date ? typstString(latexSanitizer.sanitizeTitle(job.data.date, 100)) : 'none'}`,
      `#let pp-mainfont = ${typstString(mainFont)}`,
    );

    // 2. Template style rules (before %% CONTENT %%)
    mainParts.push(tplStyle);

    // 3. Grid override (overrides template's default margins)
    mainParts.push(geo);

    // 4. Engineering policies
    mainParts.push(bookEngineering.generateTypstEngineeringPreamble(templateType));

    // 5. Heading variant override (if not 'classic')
    const vp = headingVariantsTypst.getTypstVariantPreamble(tplKey, headingVariant);
    if (vp) mainParts.push(vp);

    // 6. Watermark (free tier only)
    if (needsWatermark) mainParts.push(watermarkTypst.generateTypstWatermarkPreamble());

    // 7. Build provenance
    buildMeta = provenance.generateBuildMetadata({
      manuscriptText, template: tplKey, pageSize, marginPreset, safeMode, compileMode, title,
      outputFormat: wantPdfX ? 'pdfx1a' : 'pdf',
      headingVariant, needsWatermark, customFonts: customFonts || null,
    });
    mainParts.push(`// Build: ${buildMeta.buildId} | ${buildMeta.timestamp}`);

    // 8. Template content (title page — after %% CONTENT %%)
    if (tplContentSection) mainParts.push(tplContentSection);

    // 9. Body (from Pandoc conversion)
    const bodyContent = await fsp.readFile(bodyPath, 'utf8');
    mainParts.push(bodyContent);
  } catch (err) {
    let debugFiles = [];
    try { debugFiles = fs.readdirSync(tmpBase); } catch {}
    try { fs.rmSync(tmpBase, { recursive: true, force: true }); } catch {}
    return {
      success: false, error: 'assembly_error', message: String(err), warnings,
      debug: { filesInDir: debugFiles, captureError: null },
      debugMeta: buildDebugMeta(job, { engine: 'typst' }),
    };
  }

  const mainTyp = mainParts.filter(Boolean).join('\n\n');
  const mainPath = path.join(tmpBase, 'main.typ');
  await fsp.writeFile(mainPath, mainTyp, 'utf8');

  // ── STEP D: Typst compile ─────────────────────────────────
  const typstArgs = ['compile'];

  // Custom font path for uploaded fonts
  const customFontDir = job.data.customFontDir;
  if (customFontDir && fs.existsSync(customFontDir)) {
    typstArgs.push('--font-path', customFontDir);
  }

  typstArgs.push('main.typ', 'output.pdf');

  const startTs = Date.now();
  const result = await new Promise((resolve) => {
    let proc;
    try { proc = spawn('typst', typstArgs, { cwd: tmpBase, env: SAFE_SPAWN_ENV }); }
    catch (e) { resolve({ ok: false, error: 'spawn_failed', message: String(e) }); return; }

    let stderr = '';
    let stderrBytes = 0;
    proc.stderr.on('data', (d) => { if (stderrBytes < MAX_STDERR_BYTES) { stderr += d.toString(); stderrBytes += d.length; } });
    proc.on('error', (e) => resolve({ ok: false, error: 'spawn_failed', message: String(e) }));

    let timedOut = false;
    const kill = setTimeout(() => { timedOut = true; try { proc.kill('SIGKILL'); } catch {} }, COMPILE_TIMEOUT_MS);

    proc.on('close', (code) => {
      clearTimeout(kill);
      if (timedOut) { resolve({ ok: false, error: 'compile_timeout', stderr }); return; }
      if (code === 0 && fs.existsSync(pdfPath)) {
        resolve({ ok: true, stderr, elapsed: Date.now() - startTs });
      } else {
        resolve({ ok: false, error: 'compile_failed', stderr });
      }
    });
  });

  // ── STEP D2: Generate per-page SVGs for preview ────────────
  let svgPageCount = 0;
  let svgPages = [];
  if (result.ok) {
    try {
      const svgArgs = ['compile'];
      if (customFontDir && fs.existsSync(customFontDir)) {
        svgArgs.push('--font-path', customFontDir);
      }
      svgArgs.push('main.typ', 'page-{0p}.svg');

      await new Promise((resolve) => {
        let proc;
        try { proc = spawn('typst', svgArgs, { cwd: tmpBase, env: SAFE_SPAWN_ENV }); }
        catch { resolve(); return; }
        proc.on('error', () => resolve());
        const kill = setTimeout(() => { try { proc.kill('SIGKILL'); } catch {} resolve(); }, COMPILE_TIMEOUT_MS);
        proc.on('close', () => { clearTimeout(kill); resolve(); });
      });

      // Read generated SVG pages into memory (cap at 30 for size)
      const SVG_PAGE_CAP = 30;
      const files = fs.readdirSync(tmpBase).filter(f => /^page-\d+\.svg$/.test(f));
      svgPageCount = files.length;
      if (svgPageCount > 0) {
        const sorted = files.sort((a, b) =>
          parseInt(a.match(/(\d+)/)[1], 10) - parseInt(b.match(/(\d+)/)[1], 10)
        );
        for (const f of sorted.slice(0, SVG_PAGE_CAP)) {
          svgPages.push(fs.readFileSync(path.join(tmpBase, f), 'utf-8'));
        }
      }
    } catch (err) {
      log.warn({ err: err.message }, 'SVG page generation failed (non-fatal, PDF still available)');
    }
  }

  if (!result.ok) {
    // Debug capture for Typst failures
    let debugFiles = [];
    let debugCaptureError = null;
    try { debugFiles = fs.readdirSync(tmpBase); } catch {}

    try { fs.rmSync(tmpBase, { recursive: true, force: true }); } catch {}

    let structuredErrors = [];
    let fallbackMessage = 'Compilation failed.';
    let detail = null;
    const stderr = result.stderr || '';
    try {
      const translated = typstErrorTranslator.translateCompileFailure(
        stderr, { safeMode, errorCode: result.error }
      );
      structuredErrors = translated.errors;
      fallbackMessage = translated.fallbackMessage;
    } catch (translErr) {
      log.error({ jobId: job.id, err: translErr.message }, 'typstErrorTranslator threw');
      fallbackMessage = stderr.split('\n').filter(l => l.trim()).slice(-5).join(' ') || 'Compilation failed.';
    }
    try { detail = sanitizeStderr(stderr.split('\n').slice(-80).join('\n')); } catch {}

    return {
      success: false, error: result.error || 'compile_failed',
      message: fallbackMessage, warnings,
      errors: structuredErrors,
      detail,
      debug: { filesInDir: debugFiles, captureError: debugCaptureError },
      debugMeta: buildDebugMeta(job, { engine: 'typst' }),
    };
  }

  // Success! PDF/X-1a conversion if needed (same Ghostscript pipeline)
  let finalPdfPath = pdfPath;
  let finalFormat = 'PDF';
  if (wantPdfX) {
    const pdfxPath = path.join(tmpBase, 'output-pdfx1a.pdf');
    const conv = await publishing.convertToPdfX1a(pdfPath, pdfxPath, safeTitle);
    if (!conv.success) {
      try { fs.rmSync(tmpBase, { recursive: true, force: true }); } catch {}
      return {
        success: false, error: 'pdfx_conversion_failed', message: conv.error, warnings,
        debugMeta: buildDebugMeta(job, { engine: 'typst' }),
      };
    }
    finalPdfPath = pdfxPath;
    finalFormat = 'PDF/X-1a:2001';
  }

  const compileLog = bookEngineering.analyzeTypstCompileLog(result.stderr);
  const translatedErrors = typstErrorTranslator.translateStderr(result.stderr);
  const layoutReport = layoutSanityChecker.analyzeTypstLayout(result.stderr, { template: tplKey });

  let typographyReport = null;
  try {
    const preAnalysis = typographyAssurance.analyzeTypography({
      template: tplKey, pageSize, marginPreset, extensions,
    });
    typographyReport = typographyAssurance.generateTypographicReport(preAnalysis, compileLog);
  } catch (err) {
    log.warn({ err: err.message }, 'Typography report generation failed');
  }

  const contentHash = require('crypto').createHash('sha256').update(manuscriptText).digest('hex').substring(0, 16);

  log.info({ jobId: job.id, engine: 'typst', elapsed: result.elapsed, template: tplKey }, 'Typst compile SUCCESS');

  // Create export snapshot for provenance audit trail
  let exportSnapshot = null;
  if (buildMeta) {
    try {
      exportSnapshot = provenance.createExportSnapshot(buildMeta, {
        success: true,
        compileTimeMs: result.elapsed,
        preflightPassed: null,
        lintIssueCount: compileLog.overfullBoxes.length + compileLog.underfullBoxes.length,
      });
    } catch (err) {
      log.warn({ err: err.message }, 'Typst export snapshot creation failed');
    }
  }

  return {
    success: true,
    pdfPath: finalPdfPath,
    svgPageCount,
    svgPages,
    tmpBase,
    elapsed: result.elapsed,
    engine: 'typst',
    buildId: buildMeta?.buildId || `typst-${Date.now()}`,
    contentHash,
    pageSize, marginPreset,
    outputFormat: finalFormat,
    needsWatermark,
    fontFallback: fontRes.isFallback ? `${fontRes.original} -> ${fontRes.resolved}` : null,
    compileLog: { overfull: compileLog.overfullBoxes.length, underfull: compileLog.underfullBoxes.length },
    translatedErrors: translatedErrors.summary.total > 0 ? translatedErrors : null,
    typographyReport: typographyReport ? {
      score: typographyReport.score,
      grade: typographyReport.grade,
      compileStats: typographyReport.compileStats || null,
    } : null,
    layoutReport: layoutReport.issues.length > 0 ? { grade: layoutReport.grade, issues: layoutReport.issues.length, summary: layoutReport.summary } : null,
    warnings,
    exportSnapshot,
    debugMeta: buildDebugMeta(job, { engine: 'typst' }),
    userId, userTier,
    isDownload,
    template: tplKey,
    title: safeTitle,
  };

}

// LuaLaTeX engine removed — Typst is the sole PDF engine.

function compileEpub(tmpBase, mdPath, safeTitle, safeMode) {
  const epubPath = path.join(tmpBase, 'output.epub');
  const cssPath = path.join(__dirname, 'templates', 'epub-style.css');
  const args = [
    mdPath, '--to=epub3',
    `--resource-path=${tmpBase}`,
    '-M', `title=${safeTitle}`, '--epub-title-page=true',
    ...(fs.existsSync(cssPath) ? ['--css', cssPath] : []),
    '-o', epubPath,
    ...(safeMode ? [] : citeprocArgs(BIB_PATH)),
  ];
  return new Promise((resolve) => {
    let proc;
    try { proc = spawn('pandoc', args, { cwd: tmpBase, env: SAFE_SPAWN_ENV }); }
    catch (e) {
      try { fs.rmSync(tmpBase, { recursive: true, force: true }); } catch {}
      resolve(buildFailureResult({ error: 'spawn_failed', message: `EPUB spawn failed: ${e.message}` }));
      return;
    }
    let stderr = '';
    let stderrBytes = 0;
    proc.stderr.on('data', (d) => { if (stderrBytes < MAX_STDERR_BYTES) { stderr += d.toString(); stderrBytes += d.length; } });
    proc.on('error', () => {
      try { fs.rmSync(tmpBase, { recursive: true, force: true }); } catch {}
      resolve(buildFailureResult({ error: 'spawn_failed', message: 'EPUB conversion process error.' }));
    });
    let timedOut = false;
    const kill = setTimeout(() => { timedOut = true; try { proc.kill('SIGKILL'); } catch {} }, COMPILE_TIMEOUT_MS);
    proc.on('close', (code) => {
      clearTimeout(kill);
      if (timedOut) {
        try { fs.rmSync(tmpBase, { recursive: true, force: true }); } catch {}
        resolve(buildFailureResult({ error: 'compile_timeout', message: 'EPUB conversion timed out.' }));
        return;
      }
      if (code === 0 && fs.existsSync(epubPath)) {
        resolve({ success: true, pdfPath: epubPath, tmpBase, elapsed: 0, outputFormat: 'EPUB3', isDownload: true });
      } else {
        try { fs.rmSync(tmpBase, { recursive: true, force: true }); } catch {}
        resolve(buildFailureResult({
          error: 'epub_failed',
          message: 'EPUB conversion failed.',
          detail: sanitizeStderr(stderr.split('\n').slice(-80).join('\n')),
        }));
      }
    });
  });
}

module.exports = { processCompileJob };
