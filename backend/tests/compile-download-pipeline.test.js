'use strict';

// ── Mocks ── Must be set up BEFORE require()s ──

jest.mock('../compile-worker', () => ({
  processCompileJob: jest.fn(),
}));

jest.mock('../entitlements', () => ({
  checkExportEntitlement: jest.fn().mockResolvedValue({ allowed: true }),
}));

// Silence pino logger during tests
jest.mock('../logger', () => {
  const noop = () => {};
  const child = () => mockLogger;
  const mockLogger = { info: noop, warn: noop, error: noop, debug: noop, fatal: noop, trace: noop, child };
  return mockLogger;
});

const express = require('express');
const http = require('http');
const fs = require('fs');
const fsp = require('fs').promises;
const os = require('os');
const path = require('path');
const crypto = require('crypto');

const { processCompileJob } = require('../compile-worker');
const { checkExportEntitlement } = require('../entitlements');

// ── Test helpers ──

/**
 * Build a minimal Express app that mounts the compile routes.
 */
function createTestApp(ctx) {
  const app = express();
  // JSON parser must come before routes (the compile route expects req.body)
  app.use(express.json({ limit: '5mb' }));
  const compileRoutes = require('../routes/compile');
  app.use(compileRoutes(ctx));
  return app;
}

/**
 * Simple HTTP request helper — starts the app on an ephemeral port,
 * sends a request, collects the response, and tears down the server.
 */
function request(app, method, urlPath, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, () => {
      const port = server.address().port;
      const options = {
        hostname: '127.0.0.1',
        port,
        path: urlPath,
        method,
        headers: { 'Content-Type': 'application/json', ...headers },
      };
      const req = http.request(options, (res) => {
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => {
          server.close();
          const raw = Buffer.concat(chunks).toString('utf8');
          let parsed;
          try { parsed = JSON.parse(raw); } catch { parsed = raw; }
          resolve({ status: res.statusCode, headers: res.headers, body: parsed, raw });
        });
      });
      req.on('error', (err) => { server.close(); reject(err); });
      if (body) req.write(JSON.stringify(body));
      req.end();
    });
  });
}

/**
 * Build a mock ctx object with sensible defaults.
 * Individual tests can override fields as needed.
 */
function buildMockCtx(overrides = {}) {
  const jobResults = new Map();
  const jobSecrets = new Map();

  return {
    compileLimiter: (_req, _res, next) => next(),
    compileQueue: null,        // null = sync fallback by default
    redisHealthy: false,
    redis: null,

    verifyUserTier: jest.fn().mockResolvedValue({ userId: 'user-1', tier: 'studio' }),
    hasTier: jest.fn((userTier, required) => {
      const levels = { anonymous: 0, drafter: 1, publisher: 2, studio: 3 };
      return (levels[userTier] || 0) >= (levels[required] || 0);
    }),

    storeJobResult: jest.fn((id, value) => jobResults.set(id, value)),
    getJobResult: jest.fn(async (id) => jobResults.get(id) || null),
    deleteJobResult: jest.fn((id) => jobResults.delete(id)),

    storeJobSecret: jest.fn((jobId, secret) => jobSecrets.set(jobId, secret)),
    getJobSecret: jest.fn(async (jobId) => jobSecrets.get(jobId) || null),

    persistPdf: jest.fn(async (_jobId, srcPath) => srcPath),

    resultStore: null,  // will use fs.existsSync / fs.createReadStream fallback

    RESULTS_DIR: path.join(os.tmpdir(), `pp-test-results-${crypto.randomUUID()}`),

    DESIGN_TEMPLATES: {
      chicago: { name: 'Chicago', gridType: 'academic', mainfont: 'Latin Modern Roman' },
      symphony: { name: 'Symphony', gridType: 'academic', mainfont: 'Latin Modern Roman' },
      paperback: { name: 'Paperback', gridType: 'trade', mainfont: 'EB Garamond' },
      minimal: { name: 'Minimal', gridType: 'basic', mainfont: 'Latin Modern Roman' },
    },

    jobGenerations: new Map(),
    activeSyncCompiles: 0,
    MAX_SYNC_CONCURRENT: 2,

    ...overrides,
  };
}

// ── Shared state for test suite ──

const SAMPLE_MD = '# Chapter 1\n\nHello, world.\n';

// ══════════════════════════════════════════════════════════
// Test Suite
// ══════════════════════════════════════════════════════════

describe('Compile Download Pipeline', () => {
  let tmpDir;

  beforeEach(async () => {
    jest.clearAllMocks();
    tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'pp-test-'));
  });

  afterEach(async () => {
    try { await fsp.rm(tmpDir, { recursive: true, force: true }); } catch {}
  });

  // ════════════════════════════════════════════════════════
  // 1. POST /api/compile — Input Validation
  // ════════════════════════════════════════════════════════

  describe('POST /api/compile — Input Validation', () => {
    test('returns 400 when manuscriptText is missing', async () => {
      const ctx = buildMockCtx();
      const app = createTestApp(ctx);
      const res = await request(app, 'POST', '/api/compile', {});
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('invalid_request');
      expect(res.body.message).toMatch(/manuscriptText/i);
    });

    test('returns 400 when manuscriptText is not a string', async () => {
      const ctx = buildMockCtx();
      const app = createTestApp(ctx);
      const res = await request(app, 'POST', '/api/compile', { manuscriptText: 12345 });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('invalid_request');
    });

    test('returns 413 when manuscriptText exceeds MAX_MD_BYTES', async () => {
      const ctx = buildMockCtx();
      const app = createTestApp(ctx);
      // Default MAX_MD_BYTES is 2MB; send 3MB
      const bigText = 'x'.repeat(3 * 1024 * 1024);
      const res = await request(app, 'POST', '/api/compile', { manuscriptText: bigText });
      expect(res.status).toBe(413);
      expect(res.body.error).toBe('payload_too_large');
    });

    test('defaults invalid template to a valid template without error', async () => {
      const ctx = buildMockCtx();
      // Use sync fallback with processCompileJob mocked to return a result
      processCompileJob.mockResolvedValue({
        success: true, pdfPath: path.join(tmpDir, 'out.pdf'),
        elapsed: 100, outputFormat: 'PDF', needsWatermark: false, warnings: [],
      });
      await fsp.writeFile(path.join(tmpDir, 'out.pdf'), '%PDF-fake');

      const app = createTestApp(ctx);
      const res = await request(app, 'POST', '/api/compile', {
        manuscriptText: SAMPLE_MD,
        template: 'nonexistent_template',
        pageSize: 'bogus_size',
        marginPreset: 'not_a_preset',
      });
      // Should accept the request (202), not reject it
      expect(res.status).toBe(202);
      expect(res.body.jobId).toBeDefined();
    });

    test('returns 403 when EPUB output requires studio tier but user is drafter', async () => {
      const ctx = buildMockCtx({
        verifyUserTier: jest.fn().mockResolvedValue({ userId: 'user-1', tier: 'drafter' }),
      });
      const app = createTestApp(ctx);
      const res = await request(app, 'POST', '/api/compile', {
        manuscriptText: SAMPLE_MD,
        outputFormat: 'epub',
      });
      expect(res.status).toBe(403);
      expect(res.body.error).toBe('tier_required');
      expect(res.body.requiredTier).toBe('studio');
    });

    test('returns 403 when PDF/X-1a output requires publisher tier but user is drafter', async () => {
      const ctx = buildMockCtx({
        verifyUserTier: jest.fn().mockResolvedValue({ userId: 'user-1', tier: 'drafter' }),
      });
      const app = createTestApp(ctx);
      const res = await request(app, 'POST', '/api/compile', {
        manuscriptText: SAMPLE_MD,
        outputFormat: 'pdfx1a',
      });
      expect(res.status).toBe(403);
      expect(res.body.error).toBe('tier_required');
      expect(res.body.requiredTier).toBe('publisher');
    });

    test('returns 403 when custom fonts require studio tier but user is publisher', async () => {
      const ctx = buildMockCtx({
        verifyUserTier: jest.fn().mockResolvedValue({ userId: 'user-1', tier: 'publisher' }),
      });
      const app = createTestApp(ctx);
      const res = await request(app, 'POST', '/api/compile', {
        manuscriptText: SAMPLE_MD,
        customFonts: { mainFont: 'some-uuid' },
      });
      expect(res.status).toBe(403);
      expect(res.body.error).toBe('tier_required');
      expect(res.body.requiredTier).toBe('studio');
    });

    test('returns 403 when free-tier user downloads with a non-free page size', async () => {
      const ctx = buildMockCtx({
        verifyUserTier: jest.fn().mockResolvedValue({ userId: 'user-1', tier: 'drafter' }),
      });
      const app = createTestApp(ctx);
      const res = await request(app, 'POST', '/api/compile', {
        manuscriptText: SAMPLE_MD,
        download: true,
        pageSize: 'massMarket',   // not in FREE_TIER_SIZES
      });
      expect(res.status).toBe(403);
      expect(res.body.error).toBe('tier_required');
      expect(res.body.message).toMatch(/page size/i);
    });

    test('allows free-tier page sizes on download without error', async () => {
      const ctx = buildMockCtx({
        verifyUserTier: jest.fn().mockResolvedValue({ userId: 'user-1', tier: 'drafter' }),
      });
      processCompileJob.mockResolvedValue({
        success: true, pdfPath: path.join(tmpDir, 'out.pdf'),
        elapsed: 50, outputFormat: 'PDF', needsWatermark: true, warnings: [],
      });
      await fsp.writeFile(path.join(tmpDir, 'out.pdf'), '%PDF-fake');

      const app = createTestApp(ctx);
      const res = await request(app, 'POST', '/api/compile', {
        manuscriptText: SAMPLE_MD,
        download: true,
        pageSize: 'a4',   // in FREE_TIER_SIZES
      });
      expect(res.status).toBe(202);
    });

    test('EPUB is allowed for studio tier', async () => {
      const ctx = buildMockCtx({
        verifyUserTier: jest.fn().mockResolvedValue({ userId: 'user-1', tier: 'studio' }),
      });
      processCompileJob.mockResolvedValue({
        success: true, pdfPath: path.join(tmpDir, 'out.epub'),
        elapsed: 50, outputFormat: 'EPUB3', needsWatermark: false, warnings: [],
      });
      await fsp.writeFile(path.join(tmpDir, 'out.epub'), 'PK-fake-epub');

      const app = createTestApp(ctx);
      const res = await request(app, 'POST', '/api/compile', {
        manuscriptText: SAMPLE_MD,
        outputFormat: 'epub',
      });
      expect(res.status).toBe(202);
    });
  });

  // ════════════════════════════════════════════════════════
  // 2. POST /api/compile — Async Queue (BullMQ present)
  // ════════════════════════════════════════════════════════

  describe('POST /api/compile — Async Queueing', () => {
    function buildQueueCtx(overrides = {}) {
      return buildMockCtx({
        compileQueue: {
          getWaitingCount: jest.fn().mockResolvedValue(0),
          getJob: jest.fn().mockResolvedValue(null),
          add: jest.fn().mockResolvedValue({}),
        },
        redisHealthy: true,
        ...overrides,
      });
    }

    test('returns 202 with jobId, statusUrl, resultUrl', async () => {
      const ctx = buildQueueCtx();
      const app = createTestApp(ctx);
      const res = await request(app, 'POST', '/api/compile', {
        manuscriptText: SAMPLE_MD,
        template: 'chicago',
      });
      expect(res.status).toBe(202);
      expect(res.body.jobId).toBeDefined();
      expect(res.body.statusUrl).toMatch(/\/api\/compile\/status\//);
      expect(res.body.resultUrl).toMatch(/\/api\/compile\/result\//);
      expect(res.body.status).toBe('queued');
    });

    test('anonymous users receive a resultSecret', async () => {
      const ctx = buildQueueCtx({
        verifyUserTier: jest.fn().mockResolvedValue({ userId: null, tier: 'anonymous' }),
      });
      const app = createTestApp(ctx);
      const res = await request(app, 'POST', '/api/compile', {
        manuscriptText: SAMPLE_MD,
      });
      expect(res.status).toBe(202);
      expect(res.body.resultSecret).toBeDefined();
      expect(typeof res.body.resultSecret).toBe('string');
      expect(res.body.resultSecret.length).toBe(32); // 16 random bytes → 32 hex chars
    });

    test('authenticated users do NOT receive a resultSecret', async () => {
      const ctx = buildQueueCtx({
        verifyUserTier: jest.fn().mockResolvedValue({ userId: 'user-1', tier: 'publisher' }),
      });
      const app = createTestApp(ctx);
      const res = await request(app, 'POST', '/api/compile', {
        manuscriptText: SAMPLE_MD,
      });
      expect(res.status).toBe(202);
      expect(res.body.resultSecret).toBeUndefined();
    });

    test('download jobs get unique IDs (dl-*)', async () => {
      const ctx = buildQueueCtx();
      const app = createTestApp(ctx);
      const res = await request(app, 'POST', '/api/compile', {
        manuscriptText: SAMPLE_MD,
        download: true,
      });
      expect(res.status).toBe(202);
      expect(res.body.jobId).toMatch(/^dl-/);
    });

    test('preview jobs get deterministic IDs (preview-*)', async () => {
      const ctx = buildQueueCtx();
      const app = createTestApp(ctx);
      const res = await request(app, 'POST', '/api/compile', {
        manuscriptText: SAMPLE_MD,
        download: false,
      });
      expect(res.status).toBe(202);
      expect(res.body.jobId).toMatch(/^preview-/);
    });

    test('returns 503 when queue is full', async () => {
      const ctx = buildQueueCtx();
      ctx.compileQueue.getWaitingCount.mockResolvedValue(100); // exceeds MAX_QUEUE_DEPTH (50)
      const app = createTestApp(ctx);
      const res = await request(app, 'POST', '/api/compile', {
        manuscriptText: SAMPLE_MD,
      });
      expect(res.status).toBe(503);
      expect(res.body.error).toBe('queue_full');
    });
  });

  // ════════════════════════════════════════════════════════
  // 3. POST /api/compile — Sync Fallback
  // ════════════════════════════════════════════════════════

  describe('POST /api/compile — Sync Fallback', () => {
    test('returns 202 with jobId when compileQueue is null', async () => {
      const ctx = buildMockCtx();
      processCompileJob.mockResolvedValue({
        success: true, pdfPath: path.join(tmpDir, 'out.pdf'),
        elapsed: 200, outputFormat: 'PDF', needsWatermark: false, warnings: [],
      });
      await fsp.writeFile(path.join(tmpDir, 'out.pdf'), '%PDF-fake');

      const app = createTestApp(ctx);
      const res = await request(app, 'POST', '/api/compile', {
        manuscriptText: SAMPLE_MD,
      });
      expect(res.status).toBe(202);
      expect(res.body.jobId).toBeDefined();
      expect(res.body.statusUrl).toBeDefined();
      expect(res.body.resultUrl).toBeDefined();
    });

    test('returns 503 when MAX_SYNC_CONCURRENT is exceeded', async () => {
      const ctx = buildMockCtx({ activeSyncCompiles: 2, MAX_SYNC_CONCURRENT: 2 });
      const app = createTestApp(ctx);
      const res = await request(app, 'POST', '/api/compile', {
        manuscriptText: SAMPLE_MD,
      });
      expect(res.status).toBe(503);
      expect(res.body.error).toBe('server_busy');
    });

    test('sync preview jobs use preview-sync-* ID prefix', async () => {
      const ctx = buildMockCtx();
      processCompileJob.mockResolvedValue({
        success: true, pdfPath: path.join(tmpDir, 'out.pdf'),
        elapsed: 50, outputFormat: 'PDF', needsWatermark: false, warnings: [],
      });
      await fsp.writeFile(path.join(tmpDir, 'out.pdf'), '%PDF-fake');

      const app = createTestApp(ctx);
      const res = await request(app, 'POST', '/api/compile', {
        manuscriptText: SAMPLE_MD,
        download: false,
      });
      expect(res.status).toBe(202);
      expect(res.body.jobId).toMatch(/^preview-sync-/);
    });

    test('sync download jobs use dl-sync-* ID prefix', async () => {
      const ctx = buildMockCtx();
      processCompileJob.mockResolvedValue({
        success: true, pdfPath: path.join(tmpDir, 'out.pdf'),
        elapsed: 50, outputFormat: 'PDF', needsWatermark: false, warnings: [],
      });
      await fsp.writeFile(path.join(tmpDir, 'out.pdf'), '%PDF-fake');

      const app = createTestApp(ctx);
      const res = await request(app, 'POST', '/api/compile', {
        manuscriptText: SAMPLE_MD,
        download: true,
      });
      expect(res.status).toBe(202);
      expect(res.body.jobId).toMatch(/^dl-sync-/);
    });
  });

  // ════════════════════════════════════════════════════════
  // 4. GET /api/compile/status/:id
  // ════════════════════════════════════════════════════════

  describe('GET /api/compile/status/:id', () => {
    test('returns completed status for cached successful result', async () => {
      const ctx = buildMockCtx();
      const jobId = 'test-job-success';
      ctx.getJobResult.mockResolvedValue({
        success: true,
        elapsed: 1234,
        outputFormat: 'PDF',
        needsWatermark: false,
        warnings: ['Minor warning'],
        compileLog: null,
        typographyReport: { score: 85, grade: 'A' },
        buildId: 'build-abc',
        exportSnapshot: {},
        debugMeta: null,
        engine: 'typst',
        layoutReport: null,
        svgPageCount: 3,
      });
      const app = createTestApp(ctx);
      const res = await request(app, 'GET', `/api/compile/status/${jobId}`);
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('completed');
      expect(res.body.elapsed).toBe(1234);
      expect(res.body.outputFormat).toBe('PDF');
      expect(res.body.needsWatermark).toBe(false);
      expect(res.body.warnings).toEqual(['Minor warning']);
      expect(res.body.svgPageCount).toBe(3);
      expect(res.body.resultUrl).toMatch(/\/api\/compile\/result\/test-job-success/);
      expect(res.body.buildId).toBe('build-abc');
    });

    test('returns failed status for cached failed result', async () => {
      const ctx = buildMockCtx();
      const jobId = 'test-job-failed';
      ctx.getJobResult.mockResolvedValue({
        success: false,
        error: 'compile_failed',
        message: 'LaTeX compilation error',
        warnings: [],
        detail: 'Undefined control sequence',
        debug: {
          texSource: '\\begin{document}...',
          latexLog: 'error on line 42',
          headerTex: null,
          filesInDir: ['manuscript.md'],
        },
        debugMeta: { pandocVersion: '3.6.2' },
      });
      const app = createTestApp(ctx);
      const res = await request(app, 'GET', `/api/compile/status/${jobId}`);
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('failed');
      expect(res.body.error).toBe('compile_failed');
      expect(res.body.message).toBe('LaTeX compilation error');
      expect(res.body.debug).toBeDefined();
      expect(res.body.debug.texSource).toBe('\\begin{document}...');
    });

    test('returns failed status with reconstructed debug when debug is missing', async () => {
      const ctx = buildMockCtx();
      ctx.getJobResult.mockResolvedValue({
        success: false,
        error: 'compile_failed',
        message: 'Something broke',
        warnings: [],
        // debug is intentionally missing
      });
      const app = createTestApp(ctx);
      const res = await request(app, 'GET', '/api/compile/status/no-debug-job');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('failed');
      expect(res.body.debug).toBeDefined();
      expect(res.body.debug.captureError).toMatch(/debug object was undefined/);
    });

    test('returns 404 when no result and no queue', async () => {
      const ctx = buildMockCtx();
      // compileQueue is null (sync mode), and no cached result
      ctx.getJobResult.mockResolvedValue(null);
      const app = createTestApp(ctx);
      const res = await request(app, 'GET', '/api/compile/status/nonexistent');
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('not_found');
    });

    test('returns waiting status from BullMQ when job is in queue', async () => {
      const ctx = buildMockCtx({
        compileQueue: {
          getJob: jest.fn().mockResolvedValue({
            getState: jest.fn().mockResolvedValue('waiting'),
            progress: 0,
          }),
        },
        redisHealthy: true,
      });
      ctx.getJobResult.mockResolvedValue(null);
      const app = createTestApp(ctx);
      const res = await request(app, 'GET', '/api/compile/status/queued-job');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('waiting');
      expect(res.body.progress).toBe(0);
    });

    test('returns active status from BullMQ when job is running', async () => {
      const ctx = buildMockCtx({
        compileQueue: {
          getJob: jest.fn().mockResolvedValue({
            getState: jest.fn().mockResolvedValue('active'),
            progress: 50,
          }),
        },
        redisHealthy: true,
      });
      ctx.getJobResult.mockResolvedValue(null);
      const app = createTestApp(ctx);
      const res = await request(app, 'GET', '/api/compile/status/active-job');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('active');
      expect(res.body.progress).toBe(50);
    });

    test('resolves BullMQ completed job and stores result', async () => {
      const pdfPath = path.join(tmpDir, 'out.pdf');
      await fsp.writeFile(pdfPath, '%PDF-fake');

      const returnvalue = {
        success: true,
        pdfPath,
        elapsed: 500,
        outputFormat: 'PDF',
        needsWatermark: true,
        warnings: [],
        svgPageCount: 1,
      };

      const ctx = buildMockCtx({
        compileQueue: {
          getJob: jest.fn().mockResolvedValue({
            getState: jest.fn().mockResolvedValue('completed'),
            returnvalue,
            progress: 100,
            data: {},
          }),
        },
        redisHealthy: true,
        resultStore: {
          owns: jest.fn().mockReturnValue(true),
          exists: jest.fn().mockResolvedValue(true),
          createReadStream: jest.fn(),
        },
      });
      ctx.getJobResult.mockResolvedValue(null); // Not cached yet

      const app = createTestApp(ctx);
      const res = await request(app, 'GET', '/api/compile/status/completed-bullmq');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('completed');
      expect(res.body.elapsed).toBe(500);
      expect(res.body.needsWatermark).toBe(true);
      // storeJobResult should have been called to cache the BullMQ result
      expect(ctx.storeJobResult).toHaveBeenCalledWith('completed-bullmq', returnvalue);
    });

    test('resolves BullMQ failed job and stores result', async () => {
      const returnvalue = {
        success: false,
        error: 'compile_failed',
        message: 'Pandoc exit code 1',
        warnings: [],
        debug: { texSource: null, latexLog: 'error', headerTex: null, filesInDir: [] },
      };

      const ctx = buildMockCtx({
        compileQueue: {
          getJob: jest.fn().mockResolvedValue({
            getState: jest.fn().mockResolvedValue('failed'),
            returnvalue,
            progress: 0,
            data: {},
          }),
        },
        redisHealthy: true,
      });
      ctx.getJobResult.mockResolvedValue(null);

      const app = createTestApp(ctx);
      const res = await request(app, 'GET', '/api/compile/status/failed-bullmq');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('failed');
      expect(res.body.error).toBe('compile_failed');
      expect(ctx.storeJobResult).toHaveBeenCalledWith('failed-bullmq', returnvalue);
    });
  });

  // ════════════════════════════════════════════════════════
  // 5. GET /api/compile/result/:id — PDF Download
  // ════════════════════════════════════════════════════════

  describe('GET /api/compile/result/:id', () => {
    test('returns 404 when result does not exist', async () => {
      const ctx = buildMockCtx();
      ctx.getJobResult.mockResolvedValue(null);
      const app = createTestApp(ctx);
      const res = await request(app, 'GET', '/api/compile/result/nonexistent');
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('not_found');
    });

    test('returns 400 when result is a failure', async () => {
      const ctx = buildMockCtx();
      ctx.getJobResult.mockResolvedValue({
        success: false,
        error: 'compile_failed',
        message: 'Compilation failed.',
      });
      const app = createTestApp(ctx);
      const res = await request(app, 'GET', '/api/compile/result/failed-job');
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    test('streams PDF with correct headers for authenticated owner', async () => {
      const pdfPath = path.join(tmpDir, 'test-output.pdf');
      const pdfContent = '%PDF-1.5 fake pdf content for testing';
      await fsp.writeFile(pdfPath, pdfContent);

      const ctx = buildMockCtx({
        verifyUserTier: jest.fn().mockResolvedValue({ userId: 'user-1', tier: 'studio' }),
      });
      ctx.getJobResult.mockResolvedValue({
        success: true,
        pdfPath,
        userId: 'user-1',
        outputFormat: 'PDF',
        needsWatermark: false,
        title: 'My Book',
        template: 'symphony',
        pageSize: 'sixByNine',
        elapsed: 300,
        buildId: 'build-xyz',
      });
      ctx.getJobSecret.mockResolvedValue(null);

      const app = createTestApp(ctx);
      const res = await request(app, 'GET', '/api/compile/result/my-job');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toBe('application/pdf');
      expect(res.headers['x-pp-watermarked']).toBe('false');
      expect(res.headers['x-pp-format']).toBe('PDF');
      expect(res.headers['x-pp-build-id']).toBe('build-xyz');
      expect(res.headers['content-disposition']).toMatch(/inline; filename="/);
      expect(res.headers['content-disposition']).toMatch(/\.pdf"/);
      expect(res.headers['cache-control']).toBe('no-store');
      // The body should be the raw PDF content
      expect(res.raw).toContain('%PDF-1.5');
    });

    test('returns 403 when authenticated user is not the owner', async () => {
      const pdfPath = path.join(tmpDir, 'output.pdf');
      await fsp.writeFile(pdfPath, '%PDF-fake');

      const ctx = buildMockCtx({
        verifyUserTier: jest.fn().mockResolvedValue({ userId: 'different-user', tier: 'studio' }),
      });
      ctx.getJobResult.mockResolvedValue({
        success: true,
        pdfPath,
        userId: 'user-1',        // owner is user-1
        outputFormat: 'PDF',
        needsWatermark: false,
      });

      const app = createTestApp(ctx);
      const res = await request(app, 'GET', '/api/compile/result/owned-job');
      expect(res.status).toBe(403);
      expect(res.body.error).toBe('forbidden');
    });

    test('returns 403 for anonymous result with wrong secret', async () => {
      const pdfPath = path.join(tmpDir, 'output.pdf');
      await fsp.writeFile(pdfPath, '%PDF-fake');

      const ctx = buildMockCtx();
      ctx.getJobResult.mockResolvedValue({
        success: true,
        pdfPath,
        userId: null,   // anonymous result
        outputFormat: 'PDF',
        needsWatermark: true,
      });
      ctx.getJobSecret.mockResolvedValue('correct-secret-hex-value');

      const app = createTestApp(ctx);
      const res = await request(app, 'GET', '/api/compile/result/anon-job?secret=wrong-secret-value');
      expect(res.status).toBe(403);
      expect(res.body.error).toBe('forbidden');
    });

    test('streams PDF for anonymous result with correct secret via query param', async () => {
      const pdfPath = path.join(tmpDir, 'output.pdf');
      await fsp.writeFile(pdfPath, '%PDF-fake-anonymous');

      const correctSecret = crypto.randomBytes(16).toString('hex');
      const ctx = buildMockCtx();
      ctx.getJobResult.mockResolvedValue({
        success: true,
        pdfPath,
        userId: null,
        outputFormat: 'PDF',
        needsWatermark: true,
        title: 'Untitled',
        template: 'chicago',
        pageSize: 'letter',
      });
      ctx.getJobSecret.mockResolvedValue(correctSecret);

      const app = createTestApp(ctx);
      const res = await request(app, 'GET', `/api/compile/result/anon-job?secret=${correctSecret}`);
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toBe('application/pdf');
      expect(res.headers['x-pp-watermarked']).toBe('true');
      expect(res.raw).toContain('%PDF-fake-anonymous');
    });

    test('streams PDF for anonymous result with correct secret via header', async () => {
      const pdfPath = path.join(tmpDir, 'output.pdf');
      await fsp.writeFile(pdfPath, '%PDF-header-secret');

      const correctSecret = crypto.randomBytes(16).toString('hex');
      const ctx = buildMockCtx();
      ctx.getJobResult.mockResolvedValue({
        success: true,
        pdfPath,
        userId: null,
        outputFormat: 'PDF',
        needsWatermark: false,
        title: 'Test',
        template: 'minimal',
        pageSize: 'a4',
      });
      ctx.getJobSecret.mockResolvedValue(correctSecret);

      const app = createTestApp(ctx);
      const res = await request(app, 'GET', '/api/compile/result/header-secret-job', null, {
        'x-pp-result-secret': correctSecret,
      });
      expect(res.status).toBe(200);
      expect(res.raw).toContain('%PDF-header-secret');
    });

    test('returns 410 when PDF file has been deleted (expired)', async () => {
      const ctx = buildMockCtx();
      ctx.getJobResult.mockResolvedValue({
        success: true,
        pdfPath: path.join(tmpDir, 'deleted.pdf'), // file does not exist
        userId: 'user-1',
        outputFormat: 'PDF',
        needsWatermark: false,
      });
      ctx.verifyUserTier.mockResolvedValue({ userId: 'user-1', tier: 'studio' });
      ctx.getJobSecret.mockResolvedValue(null);

      const app = createTestApp(ctx);
      const res = await request(app, 'GET', '/api/compile/result/expired-job');
      expect(res.status).toBe(410);
      expect(res.body.error).toBe('expired');
      // The expired result should be cleaned from the store
      expect(ctx.deleteJobResult).toHaveBeenCalledWith('expired-job');
    });

    test('sets correct Content-Type for EPUB output', async () => {
      const epubPath = path.join(tmpDir, 'output.epub');
      await fsp.writeFile(epubPath, 'PK-fake-epub');

      const ctx = buildMockCtx({
        verifyUserTier: jest.fn().mockResolvedValue({ userId: 'user-1', tier: 'studio' }),
      });
      ctx.getJobResult.mockResolvedValue({
        success: true,
        pdfPath: epubPath,
        userId: 'user-1',
        outputFormat: 'EPUB3',
        needsWatermark: false,
        title: 'My Novel',
        template: 'paperback',
        pageSize: 'letter',
      });
      ctx.getJobSecret.mockResolvedValue(null);

      const app = createTestApp(ctx);
      const res = await request(app, 'GET', '/api/compile/result/epub-job');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toBe('application/epub+zip');
      expect(res.headers['x-pp-format']).toBe('EPUB3');
      expect(res.headers['content-disposition']).toMatch(/\.epub"/);
    });

    test('X-PP-Watermarked header reflects watermark status', async () => {
      const pdfPath = path.join(tmpDir, 'watermarked.pdf');
      await fsp.writeFile(pdfPath, '%PDF-watermarked');

      const ctx = buildMockCtx({
        verifyUserTier: jest.fn().mockResolvedValue({ userId: 'user-1', tier: 'drafter' }),
      });
      ctx.getJobResult.mockResolvedValue({
        success: true,
        pdfPath,
        userId: 'user-1',
        outputFormat: 'PDF',
        needsWatermark: true,    // watermarked for drafter
        title: 'Draft',
        template: 'chicago',
        pageSize: 'letter',
      });
      ctx.getJobSecret.mockResolvedValue(null);

      const app = createTestApp(ctx);
      const res = await request(app, 'GET', '/api/compile/result/watermark-job');
      expect(res.status).toBe(200);
      expect(res.headers['x-pp-watermarked']).toBe('true');
    });

    test('Content-Disposition filename includes template and size codes', async () => {
      const pdfPath = path.join(tmpDir, 'filename-test.pdf');
      await fsp.writeFile(pdfPath, '%PDF-fake');

      const ctx = buildMockCtx({
        verifyUserTier: jest.fn().mockResolvedValue({ userId: 'user-1', tier: 'studio' }),
      });
      ctx.getJobResult.mockResolvedValue({
        success: true,
        pdfPath,
        userId: 'user-1',
        outputFormat: 'PDF',
        needsWatermark: false,
        title: 'My Great Book',
        template: 'symphony',
        pageSize: 'sixByNine',
      });
      ctx.getJobSecret.mockResolvedValue(null);

      const app = createTestApp(ctx);
      const res = await request(app, 'GET', '/api/compile/result/filename-job');
      expect(res.status).toBe(200);
      const disposition = res.headers['content-disposition'];
      // Should contain slug of title, template code, and size code
      expect(disposition).toMatch(/my-great-book/);
      expect(disposition).toMatch(/6x9/);
      expect(disposition).toMatch(/\.pdf"/);
    });

    test('uses resultStore.createReadStream when resultStore is provided', async () => {
      const pdfPath = path.join(tmpDir, 'store-test.pdf');
      await fsp.writeFile(pdfPath, '%PDF-from-store');

      const mockStream = fs.createReadStream(pdfPath);
      const ctx = buildMockCtx({
        verifyUserTier: jest.fn().mockResolvedValue({ userId: 'user-1', tier: 'studio' }),
        resultStore: {
          exists: jest.fn().mockResolvedValue(true),
          createReadStream: jest.fn().mockReturnValue(mockStream),
          owns: jest.fn().mockReturnValue(true),
        },
      });
      ctx.getJobResult.mockResolvedValue({
        success: true,
        pdfPath,
        userId: 'user-1',
        outputFormat: 'PDF',
        needsWatermark: false,
        title: 'Store Test',
        template: 'chicago',
        pageSize: 'letter',
      });
      ctx.getJobSecret.mockResolvedValue(null);

      const app = createTestApp(ctx);
      const res = await request(app, 'GET', '/api/compile/result/store-job');
      expect(res.status).toBe(200);
      expect(ctx.resultStore.createReadStream).toHaveBeenCalledWith(pdfPath);
      expect(res.raw).toContain('%PDF-from-store');
    });
  });

  // ════════════════════════════════════════════════════════
  // 6. End-to-end: compile + status + download flow
  // ════════════════════════════════════════════════════════

  describe('End-to-end: compile → poll → download', () => {
    test('full sync compile-to-download flow for authenticated user', async () => {
      const pdfPath = path.join(tmpDir, 'e2e.pdf');
      const pdfContent = '%PDF-1.5 e2e test content';
      await fsp.writeFile(pdfPath, pdfContent);

      // Step 1: processCompileJob will eventually store a result
      processCompileJob.mockImplementation(async () => ({
        success: true,
        pdfPath,
        elapsed: 750,
        outputFormat: 'PDF',
        needsWatermark: false,
        warnings: [],
        svgPageCount: 2,
        svgPages: ['<svg>page1</svg>', '<svg>page2</svg>'],
        title: 'E2E Test',
        template: 'chicago',
        pageSize: 'letter',
        userId: 'user-1',
      }));

      const ctx = buildMockCtx({
        verifyUserTier: jest.fn().mockResolvedValue({ userId: 'user-1', tier: 'publisher' }),
      });
      const app = createTestApp(ctx);

      // Step 2: POST /api/compile
      const compileRes = await request(app, 'POST', '/api/compile', {
        manuscriptText: SAMPLE_MD,
        template: 'chicago',
        title: 'E2E Test',
        download: true,
        pageSize: 'letter',
      });
      expect(compileRes.status).toBe(202);
      const { jobId } = compileRes.body;
      expect(jobId).toMatch(/^dl-sync-/);

      // Step 3: Wait for background compile to finish
      // processCompileJob is mocked to resolve immediately, but the background
      // async function needs a tick to execute and call storeJobResult
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Step 4: GET /api/compile/status/:id — should now be completed
      const statusRes = await request(app, 'GET', `/api/compile/status/${jobId}`);
      expect(statusRes.status).toBe(200);
      expect(statusRes.body.status).toBe('completed');
      expect(statusRes.body.elapsed).toBe(750);

      // Step 5: GET /api/compile/result/:id — should stream the PDF
      const resultRes = await request(app, 'GET', `/api/compile/result/${jobId}`);
      expect(resultRes.status).toBe(200);
      expect(resultRes.headers['content-type']).toBe('application/pdf');
      expect(resultRes.raw).toContain('%PDF-1.5 e2e test content');
    });

    test('full sync compile-to-download flow for anonymous user with secret', async () => {
      const pdfPath = path.join(tmpDir, 'anon-e2e.pdf');
      await fsp.writeFile(pdfPath, '%PDF-anonymous-result');

      processCompileJob.mockImplementation(async () => ({
        success: true,
        pdfPath,
        elapsed: 500,
        outputFormat: 'PDF',
        needsWatermark: true,
        warnings: [],
        svgPageCount: 1,
        title: 'Anonymous Doc',
        template: 'minimal',
        pageSize: 'a4',
        userId: null,
      }));

      const ctx = buildMockCtx({
        verifyUserTier: jest.fn().mockResolvedValue({ userId: null, tier: 'anonymous' }),
      });
      // Force safeMode: anonymous can't use citations, but that is handled internally
      const app = createTestApp(ctx);

      // POST /api/compile
      const compileRes = await request(app, 'POST', '/api/compile', {
        manuscriptText: SAMPLE_MD,
        download: true,
        pageSize: 'a4',
      });
      expect(compileRes.status).toBe(202);
      const { jobId, resultSecret } = compileRes.body;
      expect(resultSecret).toBeDefined();

      // Wait for async background job to complete
      await new Promise((resolve) => setTimeout(resolve, 100));

      // GET result with the correct secret
      const resultRes = await request(app, 'GET', `/api/compile/result/${jobId}?secret=${resultSecret}`);
      expect(resultRes.status).toBe(200);
      expect(resultRes.headers['x-pp-watermarked']).toBe('true');
      expect(resultRes.raw).toContain('%PDF-anonymous-result');
    });
  });
});
