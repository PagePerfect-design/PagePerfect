/**
 * Compile Worker — BullMQ processor for PDF compilation jobs.
 *
 * Runs pandoc/lualatex with bounded concurrency (default: 3).
 * Each job receives only lightweight metadata — the manuscript is written
 * to a temp file BEFORE enqueue and the path is passed via job data.
 *
 * CRITICAL: Auth and watermark decisions are RE-VERIFIED at compile time,
 * NOT trusted from the enqueue snapshot. A user's tier or credits may
 * change while a job waits in the queue. (Fixes A1, A2)
 */

const fs = require('fs');
const fsp = require('fs').promises;
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

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

const gridSystem = new GridSystem();
const COMPILE_TIMEOUT_MS = Number(process.env.COMPILE_TIMEOUT_MS || 45_000);
const BIB_PATH = path.resolve(__dirname, 'references/references.bib');

// ── Pandoc version detection ──
let PANDOC_HAS_CITEPROC = true;
try {
  const { execSync } = require('child_process');
  const ver = execSync('pandoc --version', { encoding: 'utf8', timeout: 5000 });
  const m = ver.match(/pandoc(?:\.exe)?\s+(\d+)\.(\d+)/);
  if (m) PANDOC_HAS_CITEPROC = parseInt(m[1]) > 2 || (parseInt(m[1]) === 2 && parseInt(m[2]) >= 11);
} catch { /* assume built-in */ }

function citeprocArgs(bibPath) {
  return PANDOC_HAS_CITEPROC
    ? ['--citeproc', `--bibliography=${bibPath}`]
    : ['--filter', 'pandoc-citeproc', `--bibliography=${bibPath}`];
}

function sanitizeStderr(raw) {
  return String(raw)
    .replace(/\/tmp\/pp-[a-zA-Z0-9_-]+\//g, '[workspace]/')
    .replace(/\/home\/[a-zA-Z0-9_-]+\//g, '[home]/')
    .replace(/\/app\/[a-zA-Z0-9_/-]*templates\//g, '[templates]/')
    .replace(/\/usr\/local\/[a-zA-Z0-9_/-]+/g, '[system]');
}

function stripCitations(md) {
  return md.replace(/\[[^[\]]*@[^[\]]*\]/g, '(citation)').replace(/@([A-Za-z0-9:_\-]+)/g, '$1');
}

function styleWarnings(md) {
  const w = [];
  if (/[.!?]\s{2,}[A-Z(]/g.test(md)) w.push('Detected double spaces after punctuation.');
  return w;
}

function parseMissingCitations(stderr) {
  const keys = new Set();
  for (const re of [
    /Undefined citation\s*[: ]\s*'([^']+)'/gi,
    /citation ['"]?([A-Za-z0-9:_\-]+)['"]?\s+undefined/gi,
    /reference\s+([A-Za-z0-9:_\-]+)\s+not found/gi,
    /could not find citation\s+['"]?([A-Za-z0-9:_\-]+)['"]?/gi,
  ]) { let m; while ((m = re.exec(stderr)) !== null) keys.add(m[1]); }
  return [...keys];
}

function parseMissingPackages(stderr) {
  const pkgs = new Set();
  const re = /LaTeX Error:\s*File\s+[`']([^`']+)\.sty['`]\s+not found/gi;
  let m; while ((m = re.exec(stderr)) !== null) pkgs.add(m[1]);
  return [...pkgs];
}

// ================================================================
// PocketBase auth — re-verified at compile time
// ================================================================

const POCKETBASE_URL = (process.env.POCKETBASE_URL || '').replace(/\/+$/, '');
const isPocketBaseConfigured = !!(POCKETBASE_URL && process.env.POCKETBASE_ADMIN_EMAIL);
const TIER_LEVEL = { anonymous: 0, drafter: 1, publisher: 2, studio: 3 };
function hasTier(a, b) { return (TIER_LEVEL[a] || 0) >= (TIER_LEVEL[b] || 0); }

/**
 * Re-verify user tier using the auth token saved at enqueue time.
 */
async function verifyUserTierFromToken(authToken) {
  if (!isPocketBaseConfigured || !authToken) {
    return { userId: null, tier: 'anonymous', credits: 0 };
  }
  try {
    const resp = await fetch(`${POCKETBASE_URL}/api/collections/users/auth-refresh`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}`, 'Content-Type': 'application/json' },
    });
    if (resp?.ok) {
      const { record } = await resp.json();
      if (record) {
        let tier = record.tier || 'drafter';
        if (tier === 'drafter' && record.publisher_window_end) {
          if (new Date(record.publisher_window_end) > new Date()) tier = 'publisher';
        }
        return { userId: record.id, tier, credits: Number(record.pdf_credits) || 0 };
      }
    }
  } catch (err) {
    console.error('[worker:auth] Re-verification failed:', err.message);
  }
  return { userId: null, tier: 'anonymous', credits: 0 };
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
    headingVariant, isDownload, authToken, extensions,
  } = job.data;

  const tplKey = templateRegistry[String(template)] ? String(template) : 'symphony';
  const tpl = templateRegistry[tplKey];

  // ── Read manuscript from temp file (NOT from Redis — D3 fix) ──
  let manuscriptText;
  try {
    manuscriptText = await fsp.readFile(manuscriptPath, 'utf8');
  } catch (err) {
    throw new Error(`Manuscript file not found: ${err.message}`);
  }

  // ── Re-verify auth at compile time (A1) ──
  const user = await verifyUserTierFromToken(authToken);
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

  // ── Watermark decision — re-evaluated at compile time (A2) ──
  let needsWatermark = false;
  if (isDownload && isPocketBaseConfigured) {
    if (hasTier(userTier, 'publisher')) needsWatermark = false;
    else if (user.credits > 0 && userId) needsWatermark = false;
    else needsWatermark = true;
  } else if (isDownload && !isPocketBaseConfigured) {
    needsWatermark = true;
  }

  // ── Normalize text for format-agnostic input ──
  // This transforms plain text, pasted Word content, or raw prose into
  // well-structured Markdown. Handles chapter detection, poetry line
  // preservation, scene breaks, etc. — so users never need to know Markdown.
  manuscriptText = textNormalizer.normalize(manuscriptText, tplKey);

  // ── Compile in isolated temp dir ──
  const tmpBase = await fsp.mkdtemp(path.join(os.tmpdir(), 'pp-worker-'));
  const mdPath = path.join(tmpBase, 'input.md');
  const pdfPath = path.join(tmpBase, 'output.pdf');
  const effectiveMd = safeMode ? stripCitations(manuscriptText) : manuscriptText;
  await fsp.writeFile(mdPath, effectiveMd, 'utf8');

  // ── EPUB path ──
  if (wantEpub) return compileEpub(tmpBase, mdPath, title, safeMode);

  // ── PDF compilation ──
  const templateType = tpl.gridType || 'academic';
  const geo = gridSystem.calculateMargins(pageSize, marginPreset, templateType);
  const isFast = compileMode === 'fast';
  const warnings = styleWarnings(manuscriptText);

  // Font resolution
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

  // Custom font override
  const CUSTOM_FONTS_DIR = path.join(os.tmpdir(), 'pp-custom-fonts');
  if (customFonts && typeof customFonts === 'object') {
    for (const slot of ['main', 'sans', 'mono']) {
      const fontId = customFonts[slot];
      if (!fontId || typeof fontId !== 'string') continue;
      const srcDir = path.join(CUSTOM_FONTS_DIR, fontId);
      if (!fs.existsSync(srcDir)) continue;
      const files = fs.readdirSync(srcDir).filter(f => /\.(ttf|otf)$/i.test(f));
      if (files.length === 0) continue;
      fs.copyFileSync(path.join(srcDir, files[0]), path.join(tmpBase, files[0]));
      const cmd = slot === 'main' ? 'setmainfont' : slot === 'sans' ? 'setsansfont' : 'setmonofont';
      tplContent = tplContent.replace(new RegExp(`(\\\\${cmd})(\\[.*?\\])?\\{[^}]+\\}`), `$1[Path=./]{${files[0]}}`);
      warnings.push(`Custom ${slot} font applied: ${files[0]}`);
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
  // Line break preservation is handled entirely by the text normalizer
  // (Markdown hard breaks via trailing "  "). Do NOT add +hard_line_breaks
  // here — it would double-break lines and crash LaTeX with:
  //   ! LaTeX Error: There's no line here to end.
  const fromFmt = safeMode ? '--from=markdown-raw_tex-raw_attribute'
    : PANDOC_HAS_CITEPROC ? '--from=markdown+citations-raw_tex-raw_attribute'
    : '--from=markdown-raw_tex-raw_attribute';

  const args = [
    mdPath, fromFmt, '--pdf-engine=lualatex',
    '-M', `title=${title}`,
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
    const conv = await publishing.convertToPdfX1a(pdfPath, pdfxPath, title);
    if (!conv.success) {
      try { fs.rmSync(tmpBase, { recursive: true, force: true }); } catch {}
      return { success: false, error: 'pdfx_conversion_failed', message: conv.error };
    }
    finalPdfPath = pdfxPath;
    finalFormat = 'PDF/X-1a:2001';
  }

  const compileLog = bookEngineering.analyzeCompileLog(result.stderr);

  // Return metadata — PDF stays on disk at finalPdfPath.
  // GET /api/compile/result/:id streams it and cleans up.
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

function compileEpub(tmpBase, mdPath, title, safeMode) {
  const epubPath = path.join(tmpBase, 'output.epub');
  const cssPath = path.join(__dirname, 'templates', 'epub-style.css');
  const args = [
    mdPath, '--to=epub3', '-M', `title=${title}`, '--epub-title-page=true',
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
