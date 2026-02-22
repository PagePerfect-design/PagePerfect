/**
 * Compile Worker — BullMQ processor for PDF compilation jobs.
 *
 * Runs pandoc/lualatex with bounded concurrency (default: 3).
 * Each job receives only lightweight metadata — the manuscript is written
 * to a temp file BEFORE enqueue and the path is passed via job data.
 *
 * SECURITY FIXES APPLIED:
 *   - LaTeX sanitization on all user-supplied strings (title, font names)
 *   - Auth re-verified via userId + admin token (no user auth token in Redis)
 *   - Injection detection on manuscript text
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
const multilingual = require('./multilingual');
const templateExtensions = require('./template-extensions');
const headingVariants = require('./heading-variants');
const watermark = require('./watermark');
const fontAvailability = require('./font-availability');
const publishing = require('./publishing');
const textNormalizer = require('./text-normalizer');
const latexSanitizer = require('./latex-sanitizer');
const {
  PANDOC_HAS_CITEPROC,
  citeprocArgs,
  sanitizeStderr,
  stripCitations,
  styleWarnings,
  parseMissingCitations,
  parseMissingPackages,
  hasTier,
  POCKETBASE_URL,
  isPocketBaseConfigured,
  BIB_PATH,
} = require('./compile-utils');

const gridSystem = new GridSystem();
const COMPILE_TIMEOUT_MS = Number(process.env.COMPILE_TIMEOUT_MS || 45_000);

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
    return { userId: null, tier: 'anonymous', credits: 0 };
  }
  try {
    const token = await getPbAdminToken();
    if (!token) return { userId, tier: 'drafter', credits: 0 };

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
        return { userId: record.id, tier, credits: Number(record.pdf_credits) || 0 };
      }
    }
  } catch (err) {
    log.error({ err: err.message }, 'Tier re-verification failed');
  }
  return { userId, tier: 'drafter', credits: 0 };
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
  } = job.data;

  const tplKey = templateRegistry[String(template)] ? String(template) : 'symphony';
  const tpl = templateRegistry[tplKey];

  // ── Read manuscript from temp file (NOT from Redis) ──
  let manuscriptText;
  try {
    manuscriptText = await fsp.readFile(manuscriptPath, 'utf8');
  } catch (err) {
    throw new Error(`Manuscript file not found: ${err.message}`);
  }

  // ── Security: check for LaTeX injection attempts in manuscript ──
  if (latexSanitizer.hasInjectionAttempt(manuscriptText)) {
    log.warn({ jobId: job.id }, 'LaTeX injection attempt detected');
    // Don't block — the -raw_tex flag in Pandoc should prevent execution.
    // But log it for monitoring.
  }

  // ── Re-verify auth at compile time via admin token (no user token in Redis) ──
  const user = await verifyUserTierById(enqueueUserId);
  const userTier = user.tier;
  const userId = user.userId;
  const wantPdfX = outputFormat === 'pdfx1a';
  const wantEpub = outputFormat === 'epub';

  // ── Feature gates (re-checked — tier may have changed) ──
  if (wantEpub && !hasTier(userTier, 'studio'))
    return { success: false, error: 'tier_required', message: 'EPUB export requires Studio.' };
  if (wantPdfX && !hasTier(userTier, 'publisher'))
    return { success: false, error: 'tier_required', message: 'PDF/X-1a requires Publisher or Studio.' };
  if (customFonts && typeof customFonts === 'object' && Object.keys(customFonts).length > 0)
    if (!hasTier(userTier, 'studio'))
      return { success: false, error: 'tier_required', message: 'Custom fonts require Studio.' };

  // ── Watermark decision — re-evaluated at compile time ──
  let needsWatermark = false;
  if (isDownload && isPocketBaseConfigured) {
    if (hasTier(userTier, 'publisher')) needsWatermark = false;
    else if (user.credits > 0 && userId) needsWatermark = false;
    else needsWatermark = true;
  } else if (isDownload && !isPocketBaseConfigured) {
    needsWatermark = true;
  }

  // ── Normalize text for format-agnostic input ──
  manuscriptText = textNormalizer.normalize(manuscriptText, tplKey);

  // ── Compile in isolated temp dir ──
  const tmpBase = await fsp.mkdtemp(path.join(os.tmpdir(), 'pp-worker-'));
  const mdPath = path.join(tmpBase, 'input.md');
  const pdfPath = path.join(tmpBase, 'output.pdf');
  const effectiveMd = safeMode ? stripCitations(manuscriptText) : manuscriptText;
  await fsp.writeFile(mdPath, effectiveMd, 'utf8');

  // ── Sanitize title for LaTeX ──
  const safeTitle = latexSanitizer.sanitizeTitle(title);

  // ── EPUB path ──
  if (wantEpub) return compileEpub(tmpBase, mdPath, safeTitle, safeMode);

  // ── PDF compilation ──
  const templateType = tpl.gridType || 'academic';
  const geo = gridSystem.calculateMargins(pageSize, marginPreset, templateType);
  const isFast = compileMode === 'fast';
  const warnings = styleWarnings(manuscriptText);

  // Font resolution — validate font names from registry, not arbitrary user input
  const fontRes = fontAvailability.resolveFont(tpl.mainfont);
  const mainFont = fontRes.resolved;
  if (fontRes.warning) warnings.push(fontRes.warning);
  const sansRes = tpl.sansfont ? fontAvailability.resolveFont(tpl.sansfont) : null;
  const monoRes = tpl.monofont ? fontAvailability.resolveFont(tpl.monofont) : null;
  if (sansRes?.warning) warnings.push(sansRes.warning);
  if (monoRes?.warning) warnings.push(monoRes.warning);

  // Template patching
  let tplContent = await fsp.readFile(tpl.templatePath, 'utf8');
  for (const { original, resolved } of [
    { original: tpl.mainfont, resolved: mainFont },
    ...(sansRes ? [{ original: tpl.sansfont, resolved: sansRes.resolved }] : []),
    ...(monoRes ? [{ original: tpl.monofont, resolved: monoRes.resolved }] : []),
  ]) {
    if (original !== resolved) {
      const esc = original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      tplContent = tplContent.replace(
        new RegExp(`(\\\\set(?:main|sans|mono)font\\{)${esc}(\\})`, 'g'), `$1${resolved}$2`
      );
    }
  }

  // Custom font override — validate font file names
  const CUSTOM_FONTS_DIR = path.join(os.tmpdir(), 'pp-custom-fonts');
  if (customFonts && typeof customFonts === 'object') {
    for (const slot of ['main', 'sans', 'mono']) {
      const fontId = customFonts[slot];
      if (!fontId || typeof fontId !== 'string') continue;
      // Validate fontId format (UUID only — prevents path traversal)
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(fontId)) continue;
      const srcDir = path.join(CUSTOM_FONTS_DIR, fontId);
      if (!fs.existsSync(srcDir)) continue;
      const files = fs.readdirSync(srcDir).filter(f => /\.(ttf|otf)$/i.test(f));
      if (files.length === 0) continue;
      // Validate filename is safe (no path separators, no special chars)
      const safeFileName = files[0].replace(/[^a-zA-Z0-9._-]/g, '_');
      fs.copyFileSync(path.join(srcDir, files[0]), path.join(tmpBase, safeFileName));
      const cmd = slot === 'main' ? 'setmainfont' : slot === 'sans' ? 'setsansfont' : 'setmonofont';
      tplContent = tplContent.replace(new RegExp(`(\\\\${cmd})(\\[.*?\\])?\\{[^}]+\\}`), `$1[Path=./]{${safeFileName}}`);
      warnings.push(`Custom ${slot} font applied: ${safeFileName}`);
    }
  }

  await fsp.writeFile(path.join(tmpBase, 'template.latex'), tplContent, 'utf8');

  // Preamble assembly
  const preamble = [`\\geometry{${geo}}`];
  let buildMeta;
  try {
    preamble.push(bookEngineering.generateEngineeringPreamble(templateType));
    const scripts = multilingual.detectScripts(effectiveMd);
    if (scripts.isMultiscript || scripts.hasRTL)
      preamble.push(multilingual.generateMultilingualPreamble(scripts));

    buildMeta = provenance.generateBuildMetadata({
      manuscriptText, template: tplKey, pageSize, marginPreset, safeMode, compileMode, title,
      outputFormat: wantPdfX ? 'pdfx1a' : 'pdf',
      headingVariant, needsWatermark, customFonts: customFonts || null,
    });
    preamble.push(provenance.generateMetadataPreamble(buildMeta));

    if (extensions && typeof extensions === 'object' && Object.keys(extensions).length > 0) {
      const ext = templateExtensions.validateExtensions(extensions, templateType);
      if (ext.valid) preamble.push(templateExtensions.generateExtensionPreamble(ext.resolvedTokens));
      else warnings.push(`Extension errors: ${ext.errors.map(e => e.error).join('; ')}`);
    }

    const vp = headingVariants.getVariantPreamble(tplKey, headingVariant);
    if (vp) preamble.push(vp);
    if (needsWatermark) preamble.push(watermark.generateWatermarkPreamble());
  } catch (err) {
    try { fs.rmSync(tmpBase, { recursive: true, force: true }); } catch {}
    return { success: false, error: 'preamble_error', message: String(err) };
  }

  await fsp.writeFile(path.join(tmpBase, 'header.tex'), preamble.join('\n\n'), 'utf8');

  // Pandoc spawn
  const hardBreaks = tplKey === 'verse' ? '+hard_line_breaks' : '';
  const fromFmt = safeMode ? `--from=markdown${hardBreaks}-raw_tex-raw_attribute`
    : PANDOC_HAS_CITEPROC ? `--from=markdown+citations${hardBreaks}-raw_tex-raw_attribute`
    : `--from=markdown${hardBreaks}-raw_tex-raw_attribute`;

  const args = [
    mdPath, fromFmt, '--pdf-engine=lualatex',
    '-M', `title=${safeTitle}`,
    `--template=${path.join(tmpBase, 'template.latex')}`,
    '-H', path.join(tmpBase, 'header.tex'),
    '-V', `mainfont=${mainFont}`,
    ...(isFast ? [] : ['-V', 'microtype=true', '-V', 'csquotes=true']),
    '-o', pdfPath,
    ...(safeMode ? [] : citeprocArgs(BIB_PATH)),
  ];

  const startTs = Date.now();
  const result = await new Promise((resolve) => {
    let proc;
    try { proc = spawn('pandoc', args, { cwd: tmpBase }); }
    catch (e) { resolve({ ok: false, error: 'spawn_failed', message: String(e) }); return; }

    let stderr = '';
    proc.stderr.on('data', (d) => { stderr += d.toString(); });
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
    try { fs.rmSync(tmpBase, { recursive: true, force: true }); } catch {}
    const stderr = result.stderr || '';
    const msgs = buildErrorMessages(stderr, safeMode);
    return {
      success: false, error: result.error || 'compile_failed',
      message: msgs.join(' '), warnings,
      detail: sanitizeStderr(stderr.split('\n').slice(-15).join('\n')),
    };
  }

  // PDF/X-1a conversion
  let finalPdfPath = pdfPath;
  let finalFormat = 'PDF';
  if (wantPdfX) {
    const pdfxPath = path.join(tmpBase, 'output-pdfx1a.pdf');
    const conv = await publishing.convertToPdfX1a(pdfPath, pdfxPath, safeTitle);
    if (!conv.success) {
      try { fs.rmSync(tmpBase, { recursive: true, force: true }); } catch {}
      return { success: false, error: 'pdfx_conversion_failed', message: conv.error };
    }
    finalPdfPath = pdfxPath;
    finalFormat = 'PDF/X-1a:2001';
  }

  const compileLog = bookEngineering.analyzeCompileLog(result.stderr);

  return {
    success: true,
    pdfPath: finalPdfPath,
    tmpBase,
    elapsed: result.elapsed,
    buildId: buildMeta?.buildId,
    contentHash: buildMeta?.contentHash,
    needsWatermark,
    fontFallback: fontRes.isFallback ? `${fontRes.original} -> ${fontRes.resolved}` : null,
    compileLog: { overfull: compileLog.overfullBoxes.length, underfull: compileLog.underfullBoxes.length },
    warnings,
    outputFormat: finalFormat,
    userId, userTier, userCredits: user.credits,
    isDownload,
    template: tplKey,
    pageSize,
    title,
  };
}

function buildErrorMessages(stderr, safeMode) {
  const msgs = [];
  const fontErr = stderr.match(/The font "([^"]+)" cannot be found/i) || stderr.match(/font "([^"]+)" not found/i);
  if (fontErr) msgs.push(`Font "${fontErr[1]}" not found.`);
  const missCit = safeMode ? [] : parseMissingCitations(stderr);
  if (missCit.length) msgs.push(`Undefined citations: ${missCit.join(', ')}.`);
  const missPkg = parseMissingPackages(stderr);
  if (missPkg.length) msgs.push(`Missing LaTeX packages: ${missPkg.join(', ')}.`);
  const undef = stderr.match(/Undefined control sequence[\s\S]*?l\.\d+\s+(.*)/);
  const latexErr = stderr.match(/^!\s+(.+?)\.?\s*$/m);
  if (undef) msgs.push(`LaTeX error: Undefined control sequence near "${undef[1].trim().slice(0, 80)}".`);
  else if (latexErr && !fontErr && !missPkg.length) msgs.push(`LaTeX error: ${latexErr[1].slice(0, 120)}.`);
  if (msgs.length === 0) msgs.push('Typesetting failed. Please review your Markdown.');
  if (safeMode) msgs.push('Safe mode was enabled — citations were not processed.');
  return msgs;
}

function compileEpub(tmpBase, mdPath, safeTitle, safeMode) {
  const epubPath = path.join(tmpBase, 'output.epub');
  const cssPath = path.join(__dirname, 'templates', 'epub-style.css');
  const args = [
    mdPath, '--to=epub3', '-M', `title=${safeTitle}`, '--epub-title-page=true',
    ...(fs.existsSync(cssPath) ? ['--css', cssPath] : []),
    '-o', epubPath,
    ...(safeMode ? [] : citeprocArgs(BIB_PATH)),
  ];
  return new Promise((resolve) => {
    let proc;
    try { proc = spawn('pandoc', args, { cwd: tmpBase }); }
    catch (e) { try { fs.rmSync(tmpBase, { recursive: true, force: true }); } catch {} resolve({ success: false, error: 'spawn_failed', message: String(e) }); return; }
    let stderr = '';
    proc.stderr.on('data', (d) => { stderr += d.toString(); });
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
