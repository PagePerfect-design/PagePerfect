const express = require('express');
const crypto = require('crypto');
const fs = require('fs');
const fsp = require('fs').promises;
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const multer = require('multer');
const archiver = require('archiver');
const rateLimit = require('express-rate-limit');
const fontAvailability = require('../font-availability');
const headingVariants = require('../heading-variants');
const bookEngineering = require('../book-engineering');
const multilingual = require('../multilingual');
const provenance = require('../provenance');
const log = require('../logger');
const { processCompileJob } = require('../compile-worker');

// ── Constants ──
const MAX_MD_BYTES = Number(process.env.MAX_MD_BYTES || 2_000_000);
const COMPILE_TIMEOUT_MS = Number(process.env.COMPILE_TIMEOUT_MS || 45_000);
const MAX_QUEUE_DEPTH = Number(process.env.MAX_QUEUE_DEPTH || 50);
const MAX_DOCX_BYTES = Number(process.env.MAX_DOCX_BYTES || 10_000_000);

const FREE_TIER_SIZES = new Set(['letter', 'a4', 'sixByNine', 'fiveFiveByEightFive', 'a5', 'royal']);
const ALL_SIZES = new Set(['letter','a4','sixByNine','fiveFiveByEightFive','a5','sevenByTen','royal','bFormat','massMarket','aFormat','demy','fiveTwentyFiveByEight','crownQuarto','b5','amazonFiveByEight','amazonSixByNine','amazonSevenByTen','amazonEightByTen','amazonEightFiveByEleven']);
const ALL_MARGINS = new Set(['normal','narrow','wide','minimal','academic','generous','compact']);

const BIB_PATH = path.resolve(__dirname, '..', 'references/references.bib');

// ── Pandoc version detection ──
let PANDOC_HAS_CITEPROC = true;
try {
  const { execSync } = require('child_process');
  const versionOutput = execSync('pandoc --version', { encoding: 'utf8', timeout: 5000 });
  const match = versionOutput.match(/pandoc(?:\.exe)?\s+(\d+)\.(\d+)(?:\.(\d+))?/);
  if (match) {
    const major = parseInt(match[1], 10);
    const minor = parseInt(match[2], 10);
    PANDOC_HAS_CITEPROC = major > 2 || (major === 2 && minor >= 11);
  }
} catch { /* Pandoc not available at module load */ }

function citeprocArgs(bibPath) {
  if (PANDOC_HAS_CITEPROC) return ['--citeproc', `--bibliography=${bibPath}`];
  return ['--filter', 'pandoc-citeproc', `--bibliography=${bibPath}`];
}

// ── Filename helpers ──
function slug(s) {
  return String(s || '').toLowerCase().replace(/['']/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'manuscript';
}
function sizeCode(size) {
  const map = { a4:'a4', a5:'a5', sixByNine:'6x9', fiveFiveByEightFive:'5.5x8.5', sevenByTen:'7x10', amazonFiveByEight:'amazon-5x8', amazonSixByNine:'amazon-6x9', amazonSevenByTen:'amazon-7x10', amazonEightByTen:'amazon-8x10', amazonEightFiveByEleven:'amazon-8.5x11', royal:'royal', bFormat:'b-format', massMarket:'mass-market', aFormat:'a-format', demy:'demy', fiveTwentyFiveByEight:'5.25x8', crownQuarto:'crown-quarto', b5:'b5' };
  return map[size] || 'letter';
}
function templateCode(t) {
  const valid = ['minimal','symphony','chronicle','exhibit','matrix','avantgarde','paperback','international','cinema','heirloom','operator'];
  return valid.includes(t) ? t : 'chicago';
}
function timestamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
}
function buildFilename(title, template, pageSize) {
  return `${slug(title)}_${templateCode(template)}_${sizeCode(pageSize)}_${timestamp()}.pdf`;
}

// ── Stderr sanitization ──
function sanitizeStderr(raw) {
  return String(raw)
    .replace(/\/tmp\/pp-[a-zA-Z0-9_-]+\//g, '[workspace]/')
    .replace(/\/home\/[a-zA-Z0-9_-]+\//g, '[home]/')
    .replace(/\/app\/[a-zA-Z0-9_/-]*templates\//g, '[templates]/')
    .replace(/\/usr\/local\/[a-zA-Z0-9_/-]+/g, '[system]');
}
function styleWarnings(md) {
  const warnings = [];
  if (/[.!?]\s{2,}[A-Z(]/g.test(md)) warnings.push('Detected double spaces after punctuation. Consider using a single space.');
  return warnings;
}
function stripCitations(md) {
  let out = md.replace(/\[[^[\]]*@[^[\]]*\]/g, '(citation)');
  return out.replace(/@([A-Za-z0-9:_\-]+)/g, '$1');
}

// ── Custom font upload setup ──
const CUSTOM_FONTS_DIR_GLOBAL = path.join(os.tmpdir(), 'pp-custom-fonts');
if (!fs.existsSync(CUSTOM_FONTS_DIR_GLOBAL)) fs.mkdirSync(CUSTOM_FONTS_DIR_GLOBAL, { recursive: true });

const fontStorage = multer.diskStorage({
  destination: (_req, _file, cb) => { const d = path.join(CUSTOM_FONTS_DIR_GLOBAL, crypto.randomUUID()); fs.mkdirSync(d, { recursive: true }); cb(null, d); },
  filename: (_req, file, cb) => cb(null, file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')),
});
const fontUpload = multer({
  storage: fontStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    ['.ttf', '.otf'].includes(ext) ? cb(null, true) : cb(new Error('Only .ttf and .otf font files are supported.'));
  },
});

/**
 * Compile, convert, batch, and font upload routes.
 * @param {object} ctx — shared context from index.js
 */
module.exports = function compileRoutes(ctx) {
  const router = express.Router();

  const convertLimiter = rateLimit({ windowMs: 60_000, max: 20, message: { error: 'rate_limit', message: 'Too many conversion requests.' } });

  // ── Convert .docx → Markdown ──
  router.post('/api/convert', convertLimiter, express.raw({ type: '*/*', limit: '10mb' }), async (req, res) => {
    const buf = req.body;
    if (!Buffer.isBuffer(buf) || buf.length < 100) return res.status(400).json({ error: 'invalid_request', message: 'No file received. Send the .docx as the raw request body.' });
    if (buf.length > MAX_DOCX_BYTES) return res.status(413).json({ error: 'payload_too_large', message: `File exceeds ${MAX_DOCX_BYTES} byte limit.` });

    const tmpBase = await fsp.mkdtemp(path.join(os.tmpdir(), 'pp-conv-'));
    const docxPath = path.join(tmpBase, 'input.docx');
    await fsp.writeFile(docxPath, buf);
    const pandoc = spawn('pandoc', [docxPath, '-t', 'markdown', '--wrap=none', `--resource-path=${tmpBase}`], { cwd: tmpBase });
    let stdout = '', stderr = '';
    pandoc.stdout.on('data', (d) => { stdout += d.toString(); });
    pandoc.stderr.on('data', (d) => { stderr += d.toString(); });
    const killer = setTimeout(() => { try { pandoc.kill('SIGKILL'); } catch {} }, 30_000);
    pandoc.on('close', (code) => {
      clearTimeout(killer);
      try { fs.rmSync(tmpBase, { recursive: true, force: true }); } catch {}
      if (code === 0 && stdout.length > 0) return res.json({ markdown: stdout });
      log.error({ module: 'convert', exitCode: code, stderr: stderr.slice(0, 500) }, 'Pandoc conversion failed');
      return res.status(500).json({ error: 'conversion_failed', message: 'Failed to convert .docx to Markdown.', detail: sanitizeStderr(stderr.slice(0, 300)) });
    });
  });

  // ══════════════════════════════════════════════════════════
  // POST /api/compile — Async (202 + polling) with sync fallback
  // ══════════════════════════════════════════════════════════
  router.post('/api/compile', ctx.compileLimiter, async (req, res) => {
    let { manuscriptText, template, title, pageSize, marginPreset, safeMode, compileMode, outputFormat, customFonts, headingVariant: hv, download } = req.body || {};
    safeMode = Boolean(safeMode);
    compileMode = (compileMode === 'full') ? 'full' : 'fast';
    hv = headingVariants.HEADING_VARIANTS.includes(hv) ? hv : 'classic';
    const isDownload = Boolean(download);

    if (!manuscriptText || typeof manuscriptText !== 'string') return res.status(400).json({ error: 'invalid_request', message: 'manuscriptText is required' });
    const mdBytes = Buffer.byteLength(manuscriptText, 'utf8');
    if (mdBytes > MAX_MD_BYTES) return res.status(413).json({ error: 'payload_too_large', message: `Manuscript exceeds limit (${mdBytes} > ${MAX_MD_BYTES} bytes).` });

    const user = await ctx.verifyUserTier(req);
    const userTier = user.tier;

    const wantPdfX = outputFormat === 'pdfx1a';
    const wantEpub = outputFormat === 'epub';
    if (wantEpub && !ctx.hasTier(userTier, 'studio')) return res.status(403).json({ error: 'tier_required', message: 'EPUB export requires Studio.', requiredTier: 'studio' });
    if (wantPdfX && !ctx.hasTier(userTier, 'publisher')) return res.status(403).json({ error: 'tier_required', message: 'PDF/X-1a requires Publisher or Studio.', requiredTier: 'publisher' });
    if (customFonts && typeof customFonts === 'object' && Object.keys(customFonts).length > 0 && !ctx.hasTier(userTier, 'studio'))
      return res.status(403).json({ error: 'tier_required', message: 'Custom fonts require Studio.', requiredTier: 'studio' });
    if (isDownload && userTier === 'drafter' && user.credits <= 0 && pageSize && !FREE_TIER_SIZES.has(pageSize))
      return res.status(403).json({ error: 'tier_required', message: `Page size "${pageSize}" requires a paid plan.`, requiredTier: 'publisher' });
    if (!safeMode && !ctx.hasTier(userTier, 'publisher')) safeMode = true;

    if (typeof title !== 'string' || !title.trim()) title = 'Manuscript';
    title = title.replace(/[\r\n]/g, ' ').slice(0, 200);
    if (!ALL_SIZES.has(pageSize)) pageSize = 'letter';
    if (!ALL_MARGINS.has(marginPreset)) marginPreset = 'normal';

    // ── Async path: enqueue to BullMQ ──
    if (ctx.compileQueue && ctx.redisHealthy) {
      try {
        const waiting = await ctx.compileQueue.getWaitingCount();
        if (waiting >= MAX_QUEUE_DEPTH) return res.status(503).json({ error: 'queue_full', message: 'Server is at capacity. Please try again in a moment.' });

        const queueKey = isDownload ? `dl-${crypto.randomUUID()}` : `preview-${user.userId || req.ip}`;
        if (!isDownload) {
          const existingJob = await ctx.compileQueue.getJob(queueKey);
          if (existingJob) { const state = await existingJob.getState(); if (state === 'waiting' || state === 'delayed') await existingJob.remove(); }
        }

        const manuscriptDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'pp-enqueue-'));
        const manuscriptPath = path.join(manuscriptDir, 'manuscript.md');
        await fsp.writeFile(manuscriptPath, manuscriptText, 'utf8');

        await ctx.compileQueue.add('compile', {
          manuscriptPath, template, title, pageSize, marginPreset,
          safeMode, compileMode, outputFormat,
          customFonts: customFonts || null, headingVariant: hv,
          isDownload, userId: user.userId, extensions: req.body.extensions || null,
        }, { jobId: queueKey, priority: ctx.hasTier(userTier, 'publisher') ? 1 : 5 });

        const resultSecret = !user.userId ? crypto.randomBytes(16).toString('hex') : null;
        if (resultSecret) ctx.storeJobSecret(queueKey, resultSecret);

        log.info({ module: 'compile', jobId: queueKey, tier: userTier, download: isDownload }, 'Enqueued job');
        return res.status(202).json({
          jobId: queueKey, status: 'queued', message: 'Compilation queued.',
          statusUrl: `/api/compile/status/${queueKey}`, resultUrl: `/api/compile/result/${queueKey}`,
          ...(resultSecret ? { resultSecret } : {}),
        });
      } catch (err) {
        log.error({ module: 'compile', err: err.message }, 'Enqueue failed, falling through to sync');
      }
    }

    // ── Sync fallback ──
    if (ctx.activeSyncCompiles >= ctx.MAX_SYNC_CONCURRENT) return res.status(503).json({ error: 'server_busy', message: 'Server is at capacity. Please try again in a moment.' });
    ctx.activeSyncCompiles++;

    try {
      const tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'pp-sync-'));
      const manuscriptPath = path.join(tmpDir, 'manuscript.md');
      await fsp.writeFile(manuscriptPath, manuscriptText, 'utf8');

      const result = await processCompileJob({
        data: { manuscriptPath, template, title, pageSize, marginPreset, safeMode, compileMode, outputFormat, customFonts: customFonts || null, headingVariant: hv, isDownload, userId: user.userId, extensions: req.body.extensions || null },
      }, ctx.DESIGN_TEMPLATES);

      if (!result.success) { fsp.rm(tmpDir, { recursive: true, force: true }).catch(() => {}); return res.status(400).json(result); }

      const isEpub = result.outputFormat === 'EPUB3';
      const contentType = isEpub ? 'application/epub+zip' : 'application/pdf';
      const filename = isEpub ? `${slug(title) || 'manuscript'}.epub` : buildFilename(title, template, pageSize);

      if (result.buildId) res.setHeader('X-PP-Build-Id', result.buildId);
      if (result.contentHash) res.setHeader('X-PP-Content-Hash', result.contentHash);
      if (result.elapsed) res.setHeader('X-PP-Compile-Time', String(result.elapsed));
      if (result.fontFallback) res.setHeader('X-PP-Font-Fallback', result.fontFallback);
      res.setHeader('X-PP-Watermarked', result.needsWatermark ? 'true' : 'false');
      res.setHeader('X-PP-Template', result.template || template);
      res.setHeader('X-PP-Format', result.outputFormat || 'PDF');
      res.setHeader('X-PP-Filename', filename);
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
      res.setHeader('Cache-Control', 'no-store');

      const stream = fs.createReadStream(result.pdfPath);
      stream.on('close', () => { fsp.rm(result.tmpBase, { recursive: true, force: true }).catch(() => {}); fsp.rm(tmpDir, { recursive: true, force: true }).catch(() => {}); });
      stream.pipe(res);
    } catch (err) {
      log.error({ module: 'compile:sync', err: err.message }, 'Compilation error');
      if (!res.headersSent) res.status(500).json({ error: 'compile_failed', message: err.message });
    } finally {
      ctx.activeSyncCompiles--;
    }
  });

  // ══════════════════════════════════════════════════════════
  // GET /api/compile/status/:id
  // ══════════════════════════════════════════════════════════
  router.get('/api/compile/status/:id', async (req, res) => {
    const { id } = req.params;
    const cached = await ctx.getJobResult(id);
    if (cached) {
      if (cached._redisOnly && cached.success) return res.status(410).json({ jobId: id, status: 'expired', error: 'restart_expired', message: 'Server restarted during compilation. Please recompile.' });
      if (cached.success) return res.json({ jobId: id, status: 'completed', elapsed: cached.elapsed, outputFormat: cached.outputFormat, needsWatermark: cached.needsWatermark, warnings: cached.warnings, compileLog: cached.compileLog, typographyReport: cached.typographyReport || null, resultUrl: `/api/compile/result/${id}` });
      return res.json({ jobId: id, status: 'failed', error: cached.error, message: cached.message, warnings: cached.warnings, detail: cached.detail });
    }
    if (ctx.compileQueue) {
      try { const job = await ctx.compileQueue.getJob(id); if (job) { const state = await job.getState(); return res.json({ jobId: id, status: state, progress: job.progress || 0 }); } }
      catch (err) { log.error({ module: 'status', err: err.message }, 'Error fetching job'); }
    }
    return res.status(404).json({ error: 'not_found', message: 'Job not found or expired.' });
  });

  // ══════════════════════════════════════════════════════════
  // GET /api/compile/result/:id
  // ══════════════════════════════════════════════════════════
  router.get('/api/compile/result/:id', async (req, res) => {
    const { id } = req.params;
    const result = await ctx.getJobResult(id);

    if (!result) return res.status(404).json({ error: 'not_found', message: 'Result not found or expired.' });
    if (result._redisOnly) return res.status(410).json({ error: 'restart_expired', message: 'Server restarted. Please recompile.' });
    if (!result.success) return res.status(400).json(result);

    // Auth check
    if (result.userId) {
      const requester = await ctx.verifyUserTier(req);
      if (requester.userId !== result.userId) return res.status(403).json({ error: 'forbidden', message: 'Not authorized to access this result.' });
    } else {
      const storedSecret = await ctx.getJobSecret(id);
      if (storedSecret) {
        const providedSecret = req.query.secret || req.headers['x-pp-result-secret'];
        if (providedSecret !== storedSecret) return res.status(403).json({ error: 'forbidden', message: 'Invalid result secret.' });
        ctx.deleteJobResult(`${id}:secret`);
      }
    }

    if (!result.pdfPath || !fs.existsSync(result.pdfPath)) { ctx.deleteJobResult(id); return res.status(410).json({ error: 'expired', message: 'Result has expired. Please recompile.' }); }

    const isEpub = result.outputFormat === 'EPUB3';
    const contentType = isEpub ? 'application/epub+zip' : 'application/pdf';
    const filename = isEpub ? `${slug(result.title || 'manuscript')}.epub` : buildFilename(result.title || 'Manuscript', result.template || 'symphony', result.pageSize || 'letter');

    if (result.buildId) res.setHeader('X-PP-Build-Id', result.buildId);
    if (result.contentHash) res.setHeader('X-PP-Content-Hash', result.contentHash);
    if (result.elapsed) res.setHeader('X-PP-Compile-Time', String(result.elapsed));
    if (result.fontFallback) res.setHeader('X-PP-Font-Fallback', result.fontFallback);
    res.setHeader('X-PP-Watermarked', result.needsWatermark ? 'true' : 'false');
    res.setHeader('X-PP-Format', result.outputFormat || 'PDF');
    res.setHeader('X-PP-Filename', filename);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.setHeader('Cache-Control', 'no-store');

    const stream = fs.createReadStream(result.pdfPath);
    stream.on('close', () => { if (result.tmpBase) fsp.rm(result.tmpBase, { recursive: true, force: true }).catch(() => {}); ctx.deleteJobResult(id); });
    stream.on('error', () => { if (!res.headersSent) res.status(500).json({ error: 'stream_error', message: 'Failed to read PDF.' }); ctx.deleteJobResult(id); });
    stream.pipe(res);
  });

  // ══════════════════════════════════════════════════════════
  // POST /api/fonts/upload
  // ══════════════════════════════════════════════════════════
  router.post('/api/fonts/upload', fontUpload.single('font'), async (req, res) => {
    const user = await ctx.verifyUserTier(req);
    if (!ctx.hasTier(user.tier, 'studio')) {
      if (req.file) try { fs.rmSync(path.dirname(req.file.path), { recursive: true, force: true }); } catch {}
      return res.status(403).json({ error: 'tier_required', message: 'Custom font upload requires Studio.', requiredTier: 'studio' });
    }
    if (!req.file) return res.status(400).json({ error: 'no_file', message: 'No font file provided.' });

    const fontId = path.basename(path.dirname(req.file.path));
    const fontName = path.parse(req.file.originalname).name;
    setTimeout(() => { try { fs.rmSync(path.dirname(req.file.path), { recursive: true, force: true }); } catch {} }, 60 * 60 * 1000);
    log.info({ module: 'fonts', originalName: req.file.originalname, size: req.file.size, fontId }, 'Uploaded custom font');
    res.json({ fontId, fontName, originalName: req.file.originalname, size: req.file.size });
  });

  // ══════════════════════════════════════════════════════════
  // POST /api/batch-compile
  // ══════════════════════════════════════════════════════════
  router.post('/api/batch-compile', ctx.compileLimiter, async (req, res) => {
    const user = await ctx.verifyUserTier(req);
    if (!ctx.hasTier(user.tier, 'studio')) return res.status(403).json({ error: 'tier_required', message: 'Batch export requires Studio.', requiredTier: 'studio' });

    let { manuscriptText, template, title, marginPreset, safeMode, compileMode, pageSizes, customFonts, headingVariant: batchVariant } = req.body || {};
    safeMode = Boolean(safeMode);
    compileMode = (compileMode === 'full') ? 'full' : 'fast';
    batchVariant = headingVariants.HEADING_VARIANTS.includes(batchVariant) ? batchVariant : 'classic';

    if (!manuscriptText || typeof manuscriptText !== 'string') return res.status(400).json({ error: 'invalid_request', message: 'manuscriptText is required.' });
    if (!Array.isArray(pageSizes) || pageSizes.length === 0) return res.status(400).json({ error: 'invalid_request', message: 'pageSizes array is required.' });
    if (pageSizes.length > 20) return res.status(400).json({ error: 'too_many', message: 'Maximum 20 page sizes per batch.' });
    const mdBytes = Buffer.byteLength(manuscriptText, 'utf8');
    if (mdBytes > MAX_MD_BYTES) return res.status(413).json({ error: 'payload_too_large', message: 'Manuscript exceeds limit.' });

    const tplKey = ctx.DESIGN_TEMPLATES[String(template)] ? String(template) : 'symphony';
    const tpl = ctx.DESIGN_TEMPLATES[tplKey];
    if (typeof title !== 'string' || !title.trim()) title = 'Manuscript';
    title = title.replace(/[\r\n]/g, ' ').slice(0, 200);
    const validSizes = pageSizes.filter(s => ALL_SIZES.has(s));
    if (validSizes.length === 0) return res.status(400).json({ error: 'invalid_sizes', message: 'No valid page sizes provided.' });

    const templateType = tpl.gridType || 'academic';
    const effectiveMd = safeMode ? stripCitations(manuscriptText) : manuscriptText;
    const isFast = compileMode === 'fast';

    const fontResolution = fontAvailability.resolveFont(tpl.mainfont);
    const effectiveMainfont = fontResolution.resolved;
    const sansResolution = tpl.sansfont ? fontAvailability.resolveFont(tpl.sansfont) : null;
    const monoResolution = tpl.monofont ? fontAvailability.resolveFont(tpl.monofont) : null;

    let templateContent = await fsp.readFile(tpl.templatePath, 'utf8');
    const fontReplacements = [
      { original: tpl.mainfont, resolved: effectiveMainfont },
      ...(sansResolution ? [{ original: tpl.sansfont, resolved: sansResolution.resolved }] : []),
      ...(monoResolution ? [{ original: tpl.monofont, resolved: monoResolution.resolved }] : []),
    ];
    for (const { original, resolved } of fontReplacements) {
      if (original !== resolved) {
        const escaped = original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        templateContent = templateContent.replace(new RegExp(`(\\\\set(?:main|sans|mono)font\\{)${escaped}(\\})`, 'g'), `$1${resolved}$2`);
      }
    }

    const preambleParts = [];
    try {
      preambleParts.push(bookEngineering.generateEngineeringPreamble(templateType));
      const scriptAnalysis = multilingual.detectScripts(effectiveMd);
      if (scriptAnalysis.isMultiscript || scriptAnalysis.hasRTL) preambleParts.push(multilingual.generateMultilingualPreamble(scriptAnalysis));
      const buildMeta = provenance.generateBuildMetadata({ manuscriptText, template: tplKey, pageSize: validSizes[0], marginPreset, safeMode, compileMode, title, headingVariant: batchVariant, customFonts: customFonts || null });
      preambleParts.push(provenance.generateMetadataPreamble(buildMeta));
    } catch { return res.status(500).json({ error: 'preamble_error', message: 'Failed to assemble compile preamble.' }); }

    const batchVarPreamble = headingVariants.getVariantPreamble(tplKey, batchVariant);
    if (batchVarPreamble) preambleParts.push(batchVarPreamble);
    const preambleStr = preambleParts.join('\n\n');

    log.info({ module: 'batch', sizeCount: validSizes.length, template: tplKey, variant: batchVariant }, 'Starting batch compile');

    const pdfs = [];
    const errors = [];

    for (const size of validSizes) {
      if (!ALL_MARGINS.has(marginPreset)) marginPreset = 'normal';
      const geo = ctx.gridSystem.calculateMargins(size, marginPreset, templateType);
      const tmpBase = await fsp.mkdtemp(path.join(os.tmpdir(), 'pp-batch-'));

      try {
        const mdPath = path.join(tmpBase, 'input.md');
        const pdfPath = path.join(tmpBase, 'output.pdf');
        await fsp.writeFile(mdPath, effectiveMd, 'utf8');
        const tplPath = path.join(tmpBase, 'template.latex');
        await fsp.writeFile(tplPath, templateContent, 'utf8');
        const headerPath = path.join(tmpBase, 'header.tex');
        await fsp.writeFile(headerPath, `\\geometry{${geo}}\n\n${preambleStr}`, 'utf8');

        if (customFonts && typeof customFonts === 'object') {
          for (const slot of ['main', 'sans', 'mono']) {
            const fontId = customFonts[slot];
            if (!fontId || typeof fontId !== 'string') continue;
            const srcDir = path.join(CUSTOM_FONTS_DIR_GLOBAL, fontId);
            if (!fs.existsSync(srcDir)) continue;
            const files = fs.readdirSync(srcDir).filter(f => /\.(ttf|otf|woff2?)$/i.test(f));
            if (files.length > 0) fs.copyFileSync(path.join(srcDir, files[0]), path.join(tmpBase, files[0]));
          }
        }

        const batchFromFormat = safeMode ? '--from=markdown-raw_tex-raw_attribute' : PANDOC_HAS_CITEPROC ? '--from=markdown+citations-raw_tex-raw_attribute' : '--from=markdown-raw_tex-raw_attribute';
        const args = [mdPath, batchFromFormat, '--pdf-engine=lualatex', `--resource-path=${tmpBase}`, '-M', `title=${title}`, `--template=${tplPath}`, '-H', headerPath, '-V', `mainfont=${effectiveMainfont}`, ...(isFast ? [] : ['-V', 'microtype=true', '-V', 'csquotes=true']), '-o', pdfPath];
        if (!safeMode) args.push(...citeprocArgs(BIB_PATH));

        const compileResult = await new Promise((resolve) => {
          const proc = spawn('pandoc', args, { cwd: tmpBase });
          let stderr = '';
          proc.stderr.on('data', (d) => { stderr += d.toString(); });
          proc.on('error', () => resolve({ success: false, error: 'Pandoc spawn failed' }));
          const kill = setTimeout(() => { try { proc.kill('SIGKILL'); } catch {} resolve({ success: false, error: 'Timeout' }); }, COMPILE_TIMEOUT_MS);
          proc.on('close', (code) => {
            clearTimeout(kill);
            code === 0 && fs.existsSync(pdfPath) ? resolve({ success: true }) : resolve({ success: false, error: sanitizeStderr(stderr.split('\n').slice(-5).join('\n')) });
          });
        });

        if (compileResult.success) {
          const sizeSlug = size.replace(/([A-Z])/g, '-$1').toLowerCase();
          pdfs.push({ name: `${slug(title) || 'manuscript'}-${sizeSlug}.pdf`, path: pdfPath, tmpBase });
        } else {
          errors.push({ pageSize: size, error: compileResult.error });
          try { fs.rmSync(tmpBase, { recursive: true, force: true }); } catch {}
        }
      } catch (err) {
        errors.push({ pageSize: size, error: String(err) });
        try { fs.rmSync(tmpBase, { recursive: true, force: true }); } catch {}
      }
    }

    if (pdfs.length === 0) return res.status(400).json({ error: 'batch_failed', message: 'All compilations failed.', errors });

    const zipFilename = `${slug(title) || 'manuscript'}-batch.zip`;
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${zipFilename}"`);
    res.setHeader('X-PP-Format', 'batch-zip');
    res.setHeader('X-PP-Batch-Count', String(pdfs.length));

    const archive = archiver('zip', { zlib: { level: 1 } });
    archive.pipe(res);
    for (const pdf of pdfs) archive.file(pdf.path, { name: pdf.name });

    archive.on('end', () => {
      for (const pdf of pdfs) try { fs.rmSync(pdf.tmpBase, { recursive: true, force: true }); } catch {}
      log.info({ module: 'batch', completed: pdfs.length, total: validSizes.length, errors: errors.length }, 'Batch compile completed');
    });
    archive.on('error', () => {
      for (const pdf of pdfs) try { fs.rmSync(pdf.tmpBase, { recursive: true, force: true }); } catch {}
      if (!res.headersSent) res.status(500).json({ error: 'zip_failed', message: 'Failed to create ZIP archive.' });
    });
    archive.finalize();
  });

  return router;
};
