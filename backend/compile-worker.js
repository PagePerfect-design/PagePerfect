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
    engine,
    template: opts.template || job.data.template,
    safeMode: Boolean(opts.safeMode ?? job.data.safeMode),
    compileMode: opts.compileMode || job.data.compileMode || 'fast',
    nodeVersion: process.version,
    workerPid: process.pid,
    containerId: os.hostname(),
    timestamp: new Date().toISOString(),
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
// Core processor — called by BullMQ Worker for each job
// ================================================================

/**
 * @param {import('bullmq').Job} job
 * @param {object} templateRegistry - DESIGN_TEMPLATES from index.js
 * @returns {object} Result metadata (PDF stays on disk, not in Redis)
 */
async function processCompileJob(job, templateRegistry) {
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

  // ── Typst compilation ──
  let typstTpl = await fsp.readFile(typstTemplatePath, 'utf8');
    await fsp.writeFile(path.join(tmpBase, 'template.typ'), typstTpl, 'utf8');

    // Assemble Typst preamble (header-includes)
    // Pandoc emits #horizontalrule for markdown '---' thematic breaks;
    // the default Pandoc template defines it, but custom templates don't.
    const typstPreamble = [
      '#let horizontalrule = line(start: (25%,0%), end: (75%,0%))',
      geo,
    ];
    let buildMeta;
    try {
      typstPreamble.push(bookEngineering.generateTypstEngineeringPreamble(templateType));

      buildMeta = provenance.generateBuildMetadata({
        manuscriptText, template: tplKey, pageSize, marginPreset, safeMode, compileMode, title,
        outputFormat: wantPdfX ? 'pdfx1a' : 'pdf',
        headingVariant, needsWatermark, customFonts: customFonts || null,
      });
      // Provenance as Typst comment
      typstPreamble.push(`// Build: ${buildMeta.buildId} | ${buildMeta.timestamp}`);

      const vp = headingVariantsTypst.getTypstVariantPreamble(tplKey, headingVariant);
      if (vp) typstPreamble.push(vp);

      if (needsWatermark) typstPreamble.push(watermarkTypst.generateTypstWatermarkPreamble());
    } catch (err) {
      let debugFiles = [];
      try { debugFiles = fs.readdirSync(tmpBase); } catch {}
      try { fs.rmSync(tmpBase, { recursive: true, force: true }); } catch {}
      return {
        success: false, error: 'preamble_error', message: String(err), warnings,
        debug: { texSource: null, latexLog: null, headerTex: null, filesInDir: debugFiles, captureError: null },
        debugMeta: buildDebugMeta(job, { engine: 'typst' }),
      };
    }

    await fsp.writeFile(path.join(tmpBase, 'header-includes.typ'), typstPreamble.join('\n\n'), 'utf8');

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

    // Pandoc format flags (same logic as LuaLaTeX path)
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

    // Typst Pandoc args — NOTE: no Lua filters needed!
    // heading-vmode.lua → not needed (Typst has no titlesec bug)
    // drop-cap.lua → TODO: implement as Typst show rule
    // table-safety.lua → not needed (Typst tables work in multi-column)
    // fountain.lua → still applied via Pandoc Lua filter (works with any output format)
    const luaFilters = [];
    const filtersDir = path.join(__dirname, 'filters');
    if (tplKey === 'cinema') {
      luaFilters.push('--lua-filter', path.join(filtersDir, 'fountain.lua'));
    }

    // Extract author/date from job data for title page rendering
    const authorMeta = job.data.author ? ['-M', `author=${latexSanitizer.sanitizeTitle(job.data.author, 200)}`] : [];
    const dateMeta = job.data.date ? ['-M', `date=${latexSanitizer.sanitizeTitle(job.data.date, 100)}`] : [];

    const typstArgs = [
      mdPath, fromFmt, '--pdf-engine=typst',
      `--top-level-division=${topLevelDiv}`,
      `--resource-path=${tmpBase}`,
      '-M', `title=${safeTitle}`,
      ...authorMeta,
      ...dateMeta,
      `--template=${path.join(tmpBase, 'template.typ')}`,
      '-H', path.join(tmpBase, 'header-includes.typ'),
      '-V', `mainfont=${mainFont}`,
      ...luaFilters,
      '-o', pdfPath,
      ...(safeMode ? [] : citeprocArgs(BIB_PATH)),
    ];

    const startTs = Date.now();
    const result = await new Promise((resolve) => {
      let proc;
      try { proc = spawn('pandoc', typstArgs, { cwd: tmpBase, env: SAFE_SPAWN_ENV }); }
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

    // Create export snapshot for provenance audit trail (same as LuaLaTeX path)
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
    catch (e) { try { fs.rmSync(tmpBase, { recursive: true, force: true }); } catch {} resolve({ success: false, error: 'spawn_failed', message: String(e) }); return; }
    let stderr = '';
    let stderrBytes = 0;
    proc.stderr.on('data', (d) => { if (stderrBytes < MAX_STDERR_BYTES) { stderr += d.toString(); stderrBytes += d.length; } });
    proc.on('error', () => { try { fs.rmSync(tmpBase, { recursive: true, force: true }); } catch {} resolve({ success: false, error: 'spawn_failed' }); });
    let timedOut = false;
    const kill = setTimeout(() => { timedOut = true; try { proc.kill('SIGKILL'); } catch {} }, COMPILE_TIMEOUT_MS);
    proc.on('close', (code) => {
      clearTimeout(kill);
      if (timedOut) { try { fs.rmSync(tmpBase, { recursive: true, force: true }); } catch {} resolve({ success: false, error: 'compile_timeout' }); return; }
      if (code === 0 && fs.existsSync(epubPath)) {
        resolve({ success: true, pdfPath: epubPath, tmpBase, elapsed: 0, outputFormat: 'EPUB3', isDownload: true });
      } else {
        try { fs.rmSync(tmpBase, { recursive: true, force: true }); } catch {}
        resolve({ success: false, error: 'epub_failed', detail: sanitizeStderr(stderr.split('\n').slice(-15).join('\n')) });
      }
    });
  });
}

module.exports = { processCompileJob };
