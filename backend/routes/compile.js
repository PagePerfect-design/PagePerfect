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
const provenance = require('../provenance');
const log = require('../logger');
const { processCompileJob } = require('../compile-worker');
const { checkExportEntitlement } = require('../entitlements');

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

// ── Image asset upload setup ──
const CUSTOM_ASSETS_DIR = path.join(os.tmpdir(), 'pp-assets');
if (!fs.existsSync(CUSTOM_ASSETS_DIR)) fs.mkdirSync(CUSTOM_ASSETS_DIR, { recursive: true });

const ALLOWED_IMAGE_EXTS = new Set(['.png', '.jpg', '.jpeg', '.pdf', '.svg', '.eps', '.tiff', '.tif']);
const ASSET_MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ASSET_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Tier-based asset limits
const ASSET_LIMITS = {
  anonymous: { maxFiles: 5, maxFileSize: 5 * 1024 * 1024 },
  drafter:   { maxFiles: 5, maxFileSize: 5 * 1024 * 1024 },
  publisher: { maxFiles: 15, maxFileSize: ASSET_MAX_FILE_SIZE },
  studio:    { maxFiles: 30, maxFileSize: ASSET_MAX_FILE_SIZE },
};

const assetStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const d = path.join(CUSTOM_ASSETS_DIR, crypto.randomUUID());
    fs.mkdirSync(d, { recursive: true });
    cb(null, d);
  },
  filename: (_req, file, cb) => cb(null, file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')),
});
const assetUpload = multer({
  storage: assetStorage,
  limits: { fileSize: ASSET_MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    ALLOWED_IMAGE_EXTS.has(ext) ? cb(null, true) : cb(new Error(`Unsupported image format "${ext}". Supported: PNG, JPG, PDF, SVG, EPS, TIFF.`));
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
    // Use minimal env with locale (same as compile path) — prevents "Unable to read environment locale"
    const convLocale = process.env.PP_SPAWN_LOCALE !== undefined ? process.env.PP_SPAWN_LOCALE : 'C.UTF-8';
    const convEnv = {
      PATH: process.env.PATH,
      HOME: process.env.HOME || '/app',
      TMPDIR: os.tmpdir(),
      LANG: convLocale,
      LC_ALL: convLocale,
      LC_CTYPE: convLocale,
    };
    const pandoc = spawn('pandoc', [docxPath, '-t', 'markdown', '--wrap=none', `--resource-path=${tmpBase}`], { cwd: tmpBase, env: convEnv });
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
    let { manuscriptText, template, title, pageSize, marginPreset, safeMode, compileMode, outputFormat, customFonts, headingVariant: hv, download, assets, author, date: docDate } = req.body || {};
    safeMode = Boolean(safeMode);
    compileMode = (compileMode === 'full') ? 'full' : 'fast';
    hv = headingVariants.HEADING_VARIANTS.includes(hv) ? hv : 'classic';
    const isDownload = Boolean(download);

    // Validate assets: must be an array of UUID strings
    let validAssets = [];
    if (Array.isArray(assets)) {
      validAssets = assets.filter(id =>
        typeof id === 'string' &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id) &&
        fs.existsSync(path.join(CUSTOM_ASSETS_DIR, id))
      ).slice(0, 30); // cap at 30
    }

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
    if (isDownload && !ctx.hasTier(userTier, 'publisher') && pageSize && !FREE_TIER_SIZES.has(pageSize))
      return res.status(403).json({ error: 'tier_required', message: `Page size "${pageSize}" requires a paid plan.`, requiredTier: 'publisher' });
    if (!safeMode && !ctx.hasTier(userTier, 'publisher')) safeMode = true;

    if (typeof title !== 'string' || !title.trim()) title = 'Manuscript';
    title = title.replace(/[\r\n]/g, ' ').slice(0, 200);
    if (!ALL_SIZES.has(pageSize)) pageSize = 'letter';
    if (!ALL_MARGINS.has(marginPreset)) marginPreset = 'normal';

    // ── Per-manuscript entitlement check (Publisher tier) ──
    // Publisher tier is per-manuscript: each $19.99 purchase binds to one manuscript.
    // Studio tier is lifetime unlimited — no entitlement check needed.
    if (isDownload && userTier === 'publisher' && user.publisherWindowEnd) {
      const entitlement = await checkExportEntitlement({
        userId: user.userId,
        publisherWindowEnd: user.publisherWindowEnd,
        title,
        content: manuscriptText,
        redis: ctx.redis,
        redisHealthy: ctx.redisHealthy,
      });
      if (!entitlement.allowed) {
        return res.status(403).json({
          error: 'entitlement_exhausted',
          message: entitlement.reason,
          requiredTier: 'publisher',
        });
      }
    }

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
          assets: validAssets.length > 0 ? validAssets : null,
          author: typeof author === 'string' ? author.slice(0, 200) : null,
          date: typeof docDate === 'string' ? docDate.slice(0, 100) : null,
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
        data: { manuscriptPath, template, title, pageSize, marginPreset, safeMode, compileMode, outputFormat, customFonts: customFonts || null, headingVariant: hv, isDownload, userId: user.userId, extensions: req.body.extensions || null, assets: validAssets.length > 0 ? validAssets : null, author: typeof author === 'string' ? author.slice(0, 200) : null, date: typeof docDate === 'string' ? docDate.slice(0, 100) : null },
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

    // Helper: ensure failed results always have a debug object, never null.
    // Debug artifacts may be stored on disk (via debugRef) to keep Redis payloads small.
    // This function resolves the reference and loads from disk if needed.
    const resolveDebug = (result) => {
      if (!result.success && !result.debug) {
        log.warn({ module: 'status', jobId: id, error: result.error }, 'debug field missing from compile result — reconstructing placeholder');
        return {
          texSource: null,
          latexLog: null,
          headerTex: null,
          filesInDir: [],
          captureError: 'debug object was undefined when status endpoint read the result (possible BullMQ serialization loss)',
        };
      }
      // If debug contains a disk reference, load and return the full payload
      if (result.debug && result.debug.debugRef && typeof result.debug.debugRef === 'string') {
        try {
          const raw = fs.readFileSync(result.debug.debugRef, 'utf8');
          return JSON.parse(raw);
        } catch {
          log.warn({ module: 'status', jobId: id, debugRef: result.debug.debugRef }, 'Failed to load debug artifacts from disk');
          return { texSource: null, latexLog: null, headerTex: null, filesInDir: [], captureError: `Debug file not found: ${result.debug.debugRef}` };
        }
      }
      return result.debug || null;
    };

    const cached = await ctx.getJobResult(id);
    if (cached) {
      if (cached.success) return res.json({ jobId: id, status: 'completed', elapsed: cached.elapsed, outputFormat: cached.outputFormat, needsWatermark: cached.needsWatermark, warnings: cached.warnings, compileLog: cached.compileLog, typographyReport: cached.typographyReport || null, buildId: cached.buildId || null, exportSnapshot: cached.exportSnapshot || null, debugMeta: cached.debugMeta || null, engine: cached.engine || null, layoutReport: cached.layoutReport || null, resultUrl: `/api/compile/result/${id}` });
      const debug = resolveDebug(cached);
      return res.json({ jobId: id, status: 'failed', error: cached.error, message: cached.message, errors: cached.errors || null, warnings: cached.warnings, detail: cached.detail, debug, debugMeta: cached.debugMeta || null });
    }
    if (ctx.compileQueue) {
      try {
        const job = await ctx.compileQueue.getJob(id);
        if (job) {
          const state = await job.getState();

          // Race condition: BullMQ marks the job 'completed' in Redis before
          // the compileWorker.on('completed') handler stores the result.
          // Previously we remapped 'completed' → 'active' which caused infinite
          // polling if the handler never fired. Instead, read the return value
          // directly from BullMQ and store it ourselves.
          if (state === 'completed' || state === 'failed') {
            const rv = job.returnvalue;
            if (rv && typeof rv === 'object') {
              // Persist PDF if the on('completed') handler hasn't done it yet
              const alreadyPersisted = ctx.resultStore ? ctx.resultStore.owns(rv.pdfPath) : (rv.pdfPath && rv.pdfPath.startsWith(ctx.RESULTS_DIR));
              if (rv.success && rv.pdfPath && !alreadyPersisted) {
                try {
                  const persistedPath = await ctx.persistPdf(id, rv.pdfPath);
                  if (persistedPath) {
                    if (rv.tmpBase) fsp.rm(rv.tmpBase, { recursive: true, force: true }).catch(() => {});
                    rv.pdfPath = persistedPath;
                    delete rv.tmpBase;
                  }
                } catch { /* persist failed — pdfPath still points to temp dir */ }
              }
              ctx.storeJobResult(id, rv);
              if (rv.success) {
                return res.json({ jobId: id, status: 'completed', elapsed: rv.elapsed, outputFormat: rv.outputFormat, needsWatermark: rv.needsWatermark, warnings: rv.warnings, compileLog: rv.compileLog, typographyReport: rv.typographyReport || null, buildId: rv.buildId || null, exportSnapshot: rv.exportSnapshot || null, debugMeta: rv.debugMeta || null, engine: rv.engine || null, layoutReport: rv.layoutReport || null, resultUrl: `/api/compile/result/${id}` });
              }
              const debug = resolveDebug(rv);
              return res.json({ jobId: id, status: 'failed', error: rv.error, message: rv.message, errors: rv.errors || null, warnings: rv.warnings, detail: rv.detail, debug, debugMeta: rv.debugMeta || null });
            }
            // BullMQ says done but no return value yet — brief poll continuation
            return res.json({ jobId: id, status: 'active', progress: job.progress || 0 });
          }

          return res.json({ jobId: id, status: state, progress: job.progress || 0 });
        }
      }
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

    const fileExists = ctx.resultStore
      ? await ctx.resultStore.exists(result.pdfPath)
      : (result.pdfPath && fs.existsSync(result.pdfPath));
    if (!result.pdfPath || !fileExists) { ctx.deleteJobResult(id); return res.status(410).json({ error: 'expired', message: 'Result has expired. Please recompile.' }); }

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

    const stream = ctx.resultStore
      ? ctx.resultStore.createReadStream(result.pdfPath)
      : fs.createReadStream(result.pdfPath);
    stream.on('error', () => { if (!res.headersSent) res.status(500).json({ error: 'stream_error', message: 'Failed to read PDF.' }); });
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
  // POST /api/assets/upload — Upload an image asset
  // ══════════════════════════════════════════════════════════
  router.post('/api/assets/upload', assetUpload.single('image'), async (req, res) => {
    const user = await ctx.verifyUserTier(req);
    const tier = user.tier || 'anonymous';
    const limits = ASSET_LIMITS[tier] || ASSET_LIMITS.drafter;

    // Clean up if file exceeds tier-specific size limit
    if (req.file && req.file.size > limits.maxFileSize) {
      try { fs.rmSync(path.dirname(req.file.path), { recursive: true, force: true }); } catch {}
      const maxMB = Math.round(limits.maxFileSize / (1024 * 1024));
      return res.status(413).json({ error: 'file_too_large', message: `Image exceeds ${maxMB} MB limit for your tier.` });
    }

    if (!req.file) return res.status(400).json({ error: 'no_file', message: 'No image file provided.' });

    // Count existing assets for this user (prevent accumulation)
    try {
      const existingDirs = fs.readdirSync(CUSTOM_ASSETS_DIR);
      // We track asset count by counting directories. For anonymous users, we use a
      // softer limit since we can't scope by user.
      if (existingDirs.length > limits.maxFiles * 10) {
        // Global safety cap — prevent disk exhaustion
        try { fs.rmSync(path.dirname(req.file.path), { recursive: true, force: true }); } catch {}
        return res.status(429).json({ error: 'too_many_assets', message: 'Server asset storage is full. Please try again later.' });
      }
    } catch { /* directory read failed — continue */ }

    const assetId = path.basename(path.dirname(req.file.path));
    const safeFilename = req.file.filename; // already sanitized by multer storage

    // Schedule cleanup after TTL
    setTimeout(() => {
      try { fs.rmSync(path.join(CUSTOM_ASSETS_DIR, assetId), { recursive: true, force: true }); } catch {}
    }, ASSET_TTL_MS);

    log.info({ module: 'assets', originalName: req.file.originalname, size: req.file.size, assetId }, 'Uploaded image asset');
    res.json({
      assetId,
      filename: safeFilename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimeType: req.file.mimetype,
    });
  });

  // ══════════════════════════════════════════════════════════
  // GET /api/assets/:id/:filename — Serve an uploaded image for preview
  // ══════════════════════════════════════════════════════════
  router.get('/api/assets/:id/:filename', (req, res) => {
    const { id, filename } = req.params;
    // Validate asset ID is UUID (prevents path traversal)
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return res.status(400).json({ error: 'invalid_id', message: 'Invalid asset ID.' });
    }
    // Validate filename (no path separators)
    if (/[/\\]/.test(filename) || filename.includes('..')) {
      return res.status(400).json({ error: 'invalid_filename', message: 'Invalid filename.' });
    }

    const filePath = path.join(CUSTOM_ASSETS_DIR, id, filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'not_found', message: 'Asset not found or expired.' });
    }

    const ext = path.extname(filename).toLowerCase();
    const mimeMap = {
      '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
      '.svg': 'image/svg+xml', '.tiff': 'image/tiff', '.tif': 'image/tiff',
      '.pdf': 'application/pdf', '.eps': 'application/postscript',
    };
    res.setHeader('Content-Type', mimeMap[ext] || 'application/octet-stream');
    res.setHeader('Cache-Control', 'private, max-age=3600');
    fs.createReadStream(filePath).pipe(res);
  });

  // ══════════════════════════════════════════════════════════
  // DELETE /api/assets/:id — Remove an uploaded image
  // ══════════════════════════════════════════════════════════
  router.delete('/api/assets/:id', (req, res) => {
    const { id } = req.params;
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return res.status(400).json({ error: 'invalid_id', message: 'Invalid asset ID.' });
    }

    const dirPath = path.join(CUSTOM_ASSETS_DIR, id);
    if (!fs.existsSync(dirPath)) {
      return res.status(404).json({ error: 'not_found', message: 'Asset not found or already deleted.' });
    }

    try {
      fs.rmSync(dirPath, { recursive: true, force: true });
      log.info({ module: 'assets', assetId: id }, 'Deleted image asset');
      res.json({ deleted: true, assetId: id });
    } catch (err) {
      log.error({ module: 'assets', assetId: id, err: err.message }, 'Failed to delete asset');
      res.status(500).json({ error: 'delete_failed', message: 'Failed to delete asset.' });
    }
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

    const fontResolution = fontAvailability.resolveFont(tpl.mainfont);
    const effectiveMainfont = fontResolution.resolved;

    // Read the pure Typst template and split at %% CONTENT %% marker
    const typstTemplatePath = path.resolve(__dirname, '..', 'typst-templates', `${tplKey}.typ`);
    let tplContent;
    try {
      tplContent = await fsp.readFile(typstTemplatePath, 'utf8');
    } catch {
      return res.status(500).json({ error: 'template_not_found', message: `Typst template "${tplKey}" not found.` });
    }
    const CONTENT_MARKER = '// %% CONTENT %%';
    const markerIdx = tplContent.indexOf(CONTENT_MARKER);
    if (markerIdx < 0) {
      return res.status(500).json({ error: 'template_marker_missing', message: `Template "${tplKey}" missing %% CONTENT %% marker.` });
    }
    const tplStyle = tplContent.slice(0, markerIdx).trim();
    const tplContentSection = tplContent.slice(markerIdx + CONTENT_MARKER.length).trim();

    // Assemble shared preamble parts
    const headingVariantsTypst = require('../heading-variants-typst');
    const latexSanitizer = require('../latex-sanitizer');
    const safeTitle = latexSanitizer.sanitizeTitle(title);
    const typstStr = (s) => s == null ? 'none' : '"' + String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';

    let engineeringPreamble = '';
    let variantPreamble = '';
    try {
      engineeringPreamble = bookEngineering.generateTypstEngineeringPreamble(templateType);
      variantPreamble = headingVariantsTypst.getTypstVariantPreamble(tplKey, batchVariant) || '';
    } catch { return res.status(500).json({ error: 'preamble_error', message: 'Failed to assemble compile preamble.' }); }

    const tplClass = headingVariants.TEMPLATE_CLASS[tplKey] || 'article';
    const topLevelDiv = tplClass === 'book' ? 'chapter' : 'section';

    log.info({ module: 'batch', sizeCount: validSizes.length, template: tplKey, variant: batchVariant }, 'Starting batch compile');

    const pdfs = [];
    const errors = [];

    const batchLocale = process.env.PP_SPAWN_LOCALE !== undefined ? process.env.PP_SPAWN_LOCALE : 'C.UTF-8';
    const BATCH_SPAWN_ENV = {
      PATH: process.env.PATH,
      HOME: process.env.HOME || '/app',
      TMPDIR: os.tmpdir(),
      LANG: batchLocale,
      LC_ALL: batchLocale,
      LC_CTYPE: batchLocale,
      SOURCE_DATE_EPOCH: String(Math.floor(Date.now() / 1000)),
    };

    for (const size of validSizes) {
      if (!ALL_MARGINS.has(marginPreset)) marginPreset = 'normal';
      const geo = ctx.gridSystem.calculateTypstMargins(size, marginPreset, templateType);
      const tmpBase = await fsp.mkdtemp(path.join(os.tmpdir(), 'pp-batch-'));

      try {
        const mdPath = path.join(tmpBase, 'input.md');
        const bodyPath = path.join(tmpBase, 'body.typ');
        const mainPath = path.join(tmpBase, 'main.typ');
        const pdfPath = path.join(tmpBase, 'output.pdf');
        await fsp.writeFile(mdPath, effectiveMd, 'utf8');

        // Step A: Pandoc body-only conversion
        const batchFromFormat = safeMode ? '--from=markdown-raw_tex-raw_attribute' : PANDOC_HAS_CITEPROC ? '--from=markdown+citations-raw_tex-raw_attribute' : '--from=markdown-raw_tex-raw_attribute';
        const pandocArgs = [mdPath, batchFromFormat, '-t', 'typst', `--top-level-division=${topLevelDiv}`, `--resource-path=${tmpBase}`, '-o', bodyPath];
        if (!safeMode) pandocArgs.push(...citeprocArgs(BIB_PATH));

        const pandocResult = await new Promise((resolve) => {
          const proc = spawn('pandoc', pandocArgs, { cwd: tmpBase, env: BATCH_SPAWN_ENV });
          let stderr = '';
          proc.stderr.on('data', (d) => { stderr += d.toString(); });
          proc.on('error', () => resolve({ ok: false, error: 'Pandoc spawn failed' }));
          const kill = setTimeout(() => { try { proc.kill('SIGKILL'); } catch {} resolve({ ok: false, error: 'Timeout' }); }, COMPILE_TIMEOUT_MS);
          proc.on('close', (code) => {
            clearTimeout(kill);
            code === 0 ? resolve({ ok: true }) : resolve({ ok: false, error: sanitizeStderr(stderr.split('\n').slice(-5).join('\n')) });
          });
        });

        if (!pandocResult.ok) {
          errors.push({ pageSize: size, error: pandocResult.error || 'Pandoc conversion failed' });
          try { fs.rmSync(tmpBase, { recursive: true, force: true }); } catch {}
          continue;
        }

        // Step B: Assemble main.typ
        const bodyContent = await fsp.readFile(bodyPath, 'utf8');
        const mainParts = [
          '#let horizontalrule = line(start: (25%,0%), end: (75%,0%))',
          `#let pp-title = ${typstStr(safeTitle)}`,
          '#let pp-author = none',
          '#let pp-date = none',
          `#let pp-mainfont = ${typstStr(effectiveMainfont)}`,
          tplStyle,
          geo,
          engineeringPreamble,
          variantPreamble,
          tplContentSection,
          bodyContent,
        ];
        await fsp.writeFile(mainPath, mainParts.filter(Boolean).join('\n\n'), 'utf8');

        // Step C: Typst compile
        const compileResult = await new Promise((resolve) => {
          const proc = spawn('typst', ['compile', 'main.typ', 'output.pdf'], { cwd: tmpBase, env: BATCH_SPAWN_ENV });
          let stderr = '';
          proc.stderr.on('data', (d) => { stderr += d.toString(); });
          proc.on('error', () => resolve({ success: false, error: 'Typst spawn failed' }));
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
