'use strict';

const http = require('http');
const express = require('express');
const path = require('path');
const os = require('os');
const fs = require('fs');

// Mock compile-worker to prevent import errors (it requires pandoc, etc.)
jest.mock('../compile-worker', () => ({
  processCompileJob: jest.fn(),
}));

// Mock entitlements to prevent side effects
jest.mock('../entitlements', () => ({
  checkExportEntitlement: jest.fn().mockResolvedValue({ allowed: true, fingerprint: 'abc123' }),
}));

// Mock font-availability to prevent file system scanning
jest.mock('../font-availability', () => ({
  getAvailableFonts: jest.fn().mockReturnValue([]),
  resolveFont: jest.fn().mockReturnValue(null),
  FONT_REGISTRY: {},
}));

// Mock heading-variants
jest.mock('../heading-variants', () => ({
  getHeadingPreamble: jest.fn().mockReturnValue(''),
  HEADING_VARIANTS: {},
}));

// Mock book-engineering
jest.mock('../book-engineering', () => ({
  analyzeCompileLog: jest.fn().mockReturnValue({ issues: [] }),
  lintManuscript: jest.fn().mockReturnValue({ issues: [] }),
}));

// Mock provenance
jest.mock('../provenance', () => ({
  generateBuildMetadata: jest.fn().mockReturnValue({ buildId: 'test-build' }),
  createExportSnapshot: jest.fn().mockReturnValue({}),
}));

// Mock logger to silence output
jest.mock('../logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  child: jest.fn().mockReturnValue({
    info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn(),
  }),
}));

const compileRoutes = require('../routes/compile');

// ── Helpers ──────────────────────────────────────────────────

/**
 * Create a minimal ctx object with sensible defaults.
 * Individual tests can override specific properties.
 */
function makeCtx(overrides = {}) {
  return {
    compileLimiter: (_req, _res, next) => next(),
    compileQueue: null,
    redisHealthy: false,
    redis: null,
    verifyUserTier: jest.fn().mockResolvedValue({ userId: 'user-1', tier: 'drafter' }),
    hasTier: (userTier, required) => {
      const levels = { anonymous: 0, drafter: 1, publisher: 2, studio: 3 };
      return (levels[userTier] || 0) >= (levels[required] || 0);
    },
    storeJobResult: jest.fn(),
    getJobResult: jest.fn().mockResolvedValue(null),
    deleteJobResult: jest.fn(),
    storeJobSecret: jest.fn(),
    getJobSecret: jest.fn().mockResolvedValue(null),
    persistPdf: jest.fn().mockResolvedValue('/tmp/ppresults/test.pdf'),
    resultStore: {
      exists: jest.fn().mockResolvedValue(true),
      createReadStream: jest.fn(),
      owns: jest.fn().mockReturnValue(false),
    },
    RESULTS_DIR: '/tmp/ppresults',
    DESIGN_TEMPLATES: {
      chicago: { name: 'Chicago', category: 'academic', templatePath: '/path/to/chicago.latex', mainfont: 'Palatino' },
    },
    jobGenerations: new Map(),
    activeSyncCompiles: 0,
    MAX_SYNC_CONCURRENT: 2,
    ...overrides,
  };
}

/**
 * Build a full successful compile result object.
 */
function makeSuccessResult(overrides = {}) {
  return {
    success: true,
    elapsed: 2345,
    outputFormat: 'PDF',
    needsWatermark: false,
    warnings: ['Minor style warning'],
    compileLog: { overfull: 0, underfull: 1 },
    typographyReport: { score: 85, grade: 'B' },
    buildId: 'build-abc123',
    exportSnapshot: { engine: 'lualatex', pandocVersion: '3.6.2' },
    debugMeta: { templateUsed: 'chicago' },
    engine: 'lualatex',
    layoutReport: { pages: 12 },
    svgPageCount: 0,
    pdfPath: '/tmp/pp-worker-xyz/output.pdf',
    ...overrides,
  };
}

/**
 * Build a full failed compile result object.
 */
function makeFailedResult(overrides = {}) {
  return {
    success: false,
    error: 'compile_error',
    message: 'LaTeX compilation failed',
    errors: ['Missing \\end{document}'],
    warnings: ['Overfull hbox in paragraph'],
    detail: 'Exit code 1',
    debug: {
      texSource: '\\documentclass{article}...',
      latexLog: 'This is LuaHBTeX...',
      headerTex: '\\usepackage{geometry}',
      filesInDir: ['input.md', 'output.tex'],
      captureError: null,
    },
    debugMeta: { templateUsed: 'chicago' },
    ...overrides,
  };
}

/**
 * Create a test Express app with compileRoutes mounted, start an HTTP server,
 * and return a helper to make requests.
 */
function createTestApp(ctx) {
  const app = express();
  app.use(express.json());
  const router = compileRoutes(ctx);
  app.use(router);
  return app;
}

/**
 * Make an HTTP request to an Express app and return { status, body }.
 */
function request(app, method, url) {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      const req = http.request(
        { hostname: '127.0.0.1', port, method, path: url },
        (res) => {
          let data = '';
          res.on('data', (chunk) => { data += chunk; });
          res.on('end', () => {
            server.close();
            try {
              resolve({ status: res.statusCode, body: JSON.parse(data) });
            } catch {
              resolve({ status: res.statusCode, body: data });
            }
          });
        }
      );
      req.on('error', (err) => { server.close(); reject(err); });
      req.end();
    });
  });
}


// ══════════════════════════════════════════════════════════════
// Tests
// ══════════════════════════════════════════════════════════════

describe('GET /api/compile/status/:id', () => {

  // ── 1. Cached results (from getJobResult) ────────────────

  describe('cached results', () => {

    test('successful cached result returns status=completed with all metadata fields', async () => {
      const result = makeSuccessResult();
      const ctx = makeCtx({
        getJobResult: jest.fn().mockResolvedValue(result),
      });
      const app = createTestApp(ctx);
      const { status, body } = await request(app, 'GET', '/api/compile/status/job-123');

      expect(status).toBe(200);
      expect(body.jobId).toBe('job-123');
      expect(body.status).toBe('completed');
      expect(body.elapsed).toBe(2345);
      expect(body.outputFormat).toBe('PDF');
      expect(body.needsWatermark).toBe(false);
      expect(body.warnings).toEqual(['Minor style warning']);
      expect(body.compileLog).toEqual({ overfull: 0, underfull: 1 });
      expect(body.typographyReport).toEqual({ score: 85, grade: 'B' });
      expect(body.buildId).toBe('build-abc123');
      expect(body.exportSnapshot).toEqual({ engine: 'lualatex', pandocVersion: '3.6.2' });
      expect(body.debugMeta).toEqual({ templateUsed: 'chicago' });
      expect(body.engine).toBe('lualatex');
      expect(body.layoutReport).toEqual({ pages: 12 });
      expect(body.svgPageCount).toBe(0);
      expect(body.resultUrl).toBe('/api/compile/result/job-123');
    });

    test('successful cached result with missing optional fields returns null defaults', async () => {
      const result = makeSuccessResult({
        typographyReport: undefined,
        buildId: undefined,
        exportSnapshot: undefined,
        debugMeta: undefined,
        engine: undefined,
        layoutReport: undefined,
        svgPageCount: undefined,
      });
      const ctx = makeCtx({
        getJobResult: jest.fn().mockResolvedValue(result),
      });
      const app = createTestApp(ctx);
      const { body } = await request(app, 'GET', '/api/compile/status/job-456');

      expect(body.status).toBe('completed');
      expect(body.typographyReport).toBeNull();
      expect(body.buildId).toBeNull();
      expect(body.exportSnapshot).toBeNull();
      expect(body.debugMeta).toBeNull();
      expect(body.engine).toBeNull();
      expect(body.layoutReport).toBeNull();
      expect(body.svgPageCount).toBe(0);
    });

    test('failed cached result returns status=failed with debug, error, message', async () => {
      const result = makeFailedResult();
      const ctx = makeCtx({
        getJobResult: jest.fn().mockResolvedValue(result),
      });
      const app = createTestApp(ctx);
      const { status, body } = await request(app, 'GET', '/api/compile/status/job-fail');

      expect(status).toBe(200);
      expect(body.jobId).toBe('job-fail');
      expect(body.status).toBe('failed');
      expect(body.error).toBe('compile_error');
      expect(body.message).toBe('LaTeX compilation failed');
      expect(body.errors).toEqual(['Missing \\end{document}']);
      expect(body.warnings).toEqual(['Overfull hbox in paragraph']);
      expect(body.detail).toBe('Exit code 1');
      expect(body.debug).toBeTruthy();
      expect(body.debug.texSource).toBe('\\documentclass{article}...');
      expect(body.debug.latexLog).toBe('This is LuaHBTeX...');
      expect(body.debugMeta).toEqual({ templateUsed: 'chicago' });
    });

    test('failed result with missing debug field reconstructs placeholder', async () => {
      const result = makeFailedResult({ debug: undefined });
      const ctx = makeCtx({
        getJobResult: jest.fn().mockResolvedValue(result),
      });
      const app = createTestApp(ctx);
      const { body } = await request(app, 'GET', '/api/compile/status/job-no-debug');

      expect(body.status).toBe('failed');
      expect(body.debug).toBeTruthy();
      expect(body.debug.texSource).toBeNull();
      expect(body.debug.latexLog).toBeNull();
      expect(body.debug.headerTex).toBeNull();
      expect(body.debug.filesInDir).toEqual([]);
      expect(body.debug.captureError).toMatch(/debug object was undefined/);
    });

    test('failed result with debugRef on disk loads from disk', async () => {
      // Create a temp debug file on disk
      const DEBUG_DIR = path.join(os.tmpdir(), 'pp-debug');
      if (!fs.existsSync(DEBUG_DIR)) fs.mkdirSync(DEBUG_DIR, { recursive: true });
      const debugFile = path.join(DEBUG_DIR, `test-debug-${Date.now()}.json`);
      const debugPayload = {
        texSource: 'loaded from disk',
        latexLog: 'disk log',
        headerTex: 'disk header',
        filesInDir: ['a.tex', 'b.md'],
        captureError: null,
      };
      fs.writeFileSync(debugFile, JSON.stringify(debugPayload));

      try {
        const result = makeFailedResult({
          debug: { debugRef: debugFile },
        });
        const ctx = makeCtx({
          getJobResult: jest.fn().mockResolvedValue(result),
        });
        const app = createTestApp(ctx);
        const { body } = await request(app, 'GET', '/api/compile/status/job-disk-debug');

        expect(body.status).toBe('failed');
        expect(body.debug.texSource).toBe('loaded from disk');
        expect(body.debug.latexLog).toBe('disk log');
        expect(body.debug.headerTex).toBe('disk header');
        expect(body.debug.filesInDir).toEqual(['a.tex', 'b.md']);
      } finally {
        // Clean up
        fs.unlinkSync(debugFile);
      }
    });

    test('failed result with invalid debugRef (path traversal) is blocked', async () => {
      const result = makeFailedResult({
        debug: { debugRef: '/etc/passwd' },
      });
      const ctx = makeCtx({
        getJobResult: jest.fn().mockResolvedValue(result),
      });
      const app = createTestApp(ctx);
      const { body } = await request(app, 'GET', '/api/compile/status/job-traversal');

      expect(body.status).toBe('failed');
      expect(body.debug.texSource).toBeNull();
      expect(body.debug.captureError).toMatch(/Invalid debug reference path/);
    });

    test('failed result with debugRef pointing to non-existent file returns error placeholder', async () => {
      const DEBUG_DIR = path.join(os.tmpdir(), 'pp-debug');
      const result = makeFailedResult({
        debug: { debugRef: path.join(DEBUG_DIR, 'does-not-exist-12345.json') },
      });
      const ctx = makeCtx({
        getJobResult: jest.fn().mockResolvedValue(result),
      });
      const app = createTestApp(ctx);
      const { body } = await request(app, 'GET', '/api/compile/status/job-missing-ref');

      expect(body.status).toBe('failed');
      expect(body.debug.texSource).toBeNull();
      expect(body.debug.captureError).toMatch(/Debug file not found/);
    });

    test('failed result with null errors field returns null', async () => {
      const result = makeFailedResult({ errors: null });
      const ctx = makeCtx({
        getJobResult: jest.fn().mockResolvedValue(result),
      });
      const app = createTestApp(ctx);
      const { body } = await request(app, 'GET', '/api/compile/status/job-null-errors');

      expect(body.status).toBe('failed');
      expect(body.errors).toBeNull();
    });
  });

  // ── 2. BullMQ job states ─────────────────────────────────

  describe('BullMQ job states', () => {

    function makeQueue(jobState, jobReturnValue = null, jobProgress = 0, jobData = {}) {
      return {
        getJob: jest.fn().mockResolvedValue({
          getState: jest.fn().mockResolvedValue(jobState),
          returnvalue: jobReturnValue,
          progress: jobProgress,
          data: jobData,
        }),
        getWaitingCount: jest.fn().mockResolvedValue(0),
        add: jest.fn(),
      };
    }

    test('job in waiting state returns status=waiting with progress 0', async () => {
      const ctx = makeCtx({ compileQueue: makeQueue('waiting') });
      const app = createTestApp(ctx);
      const { status, body } = await request(app, 'GET', '/api/compile/status/job-wait');

      expect(status).toBe(200);
      expect(body.jobId).toBe('job-wait');
      expect(body.status).toBe('waiting');
      expect(body.progress).toBe(0);
    });

    test('job in delayed state returns status=delayed with progress 0', async () => {
      const ctx = makeCtx({ compileQueue: makeQueue('delayed') });
      const app = createTestApp(ctx);
      const { body } = await request(app, 'GET', '/api/compile/status/job-delayed');

      expect(body.status).toBe('delayed');
      expect(body.progress).toBe(0);
    });

    test('job in active state returns status=active with progress value', async () => {
      const ctx = makeCtx({ compileQueue: makeQueue('active', null, 50) });
      const app = createTestApp(ctx);
      const { body } = await request(app, 'GET', '/api/compile/status/job-active');

      expect(body.status).toBe('active');
      expect(body.progress).toBe(50);
    });

    test('completed job with return value stores result and returns completed', async () => {
      const rv = makeSuccessResult();
      const storeJobResult = jest.fn();
      const ctx = makeCtx({
        compileQueue: makeQueue('completed', rv),
        storeJobResult,
      });
      const app = createTestApp(ctx);
      const { body } = await request(app, 'GET', '/api/compile/status/job-done');

      expect(body.status).toBe('completed');
      expect(body.elapsed).toBe(2345);
      expect(body.resultUrl).toBe('/api/compile/result/job-done');
      // Should store the result in cache
      expect(storeJobResult).toHaveBeenCalledWith('job-done', expect.objectContaining({ success: true }));
    });

    test('completed job but no return value yet returns status=active for poll continuation', async () => {
      const ctx = makeCtx({ compileQueue: makeQueue('completed', null, 75) });
      const app = createTestApp(ctx);
      const { body } = await request(app, 'GET', '/api/compile/status/job-no-rv');

      expect(body.status).toBe('active');
      expect(body.progress).toBe(75);
    });

    test('completed job with non-object return value returns status=active', async () => {
      const ctx = makeCtx({ compileQueue: makeQueue('completed', 'string-not-object') });
      const app = createTestApp(ctx);
      const { body } = await request(app, 'GET', '/api/compile/status/job-bad-rv');

      expect(body.status).toBe('active');
    });

    test('failed job with return value stores result and returns failed', async () => {
      const rv = makeFailedResult();
      const storeJobResult = jest.fn();
      const ctx = makeCtx({
        compileQueue: makeQueue('failed', rv),
        storeJobResult,
      });
      const app = createTestApp(ctx);
      const { body } = await request(app, 'GET', '/api/compile/status/job-fail-q');

      expect(body.status).toBe('failed');
      expect(body.error).toBe('compile_error');
      expect(body.message).toBe('LaTeX compilation failed');
      expect(body.debug).toBeTruthy();
      expect(storeJobResult).toHaveBeenCalledWith('job-fail-q', expect.objectContaining({ success: false }));
    });

    test('job not found in queue returns 404', async () => {
      const queue = {
        getJob: jest.fn().mockResolvedValue(null),
        getWaitingCount: jest.fn().mockResolvedValue(0),
        add: jest.fn(),
      };
      const ctx = makeCtx({ compileQueue: queue });
      const app = createTestApp(ctx);
      const { status, body } = await request(app, 'GET', '/api/compile/status/job-gone');

      expect(status).toBe(404);
      expect(body.error).toBe('not_found');
      expect(body.message).toMatch(/not found or expired/i);
    });
  });

  // ── 3. Stale result detection (compile generation) ───────

  describe('stale result detection', () => {

    function makeQueueWithGen(rv, jobData = {}) {
      return {
        getJob: jest.fn().mockResolvedValue({
          getState: jest.fn().mockResolvedValue('completed'),
          returnvalue: rv,
          progress: 100,
          data: jobData,
        }),
        getWaitingCount: jest.fn().mockResolvedValue(0),
        add: jest.fn(),
      };
    }

    test('completed job with stale generation returns status=active instead of stale result', async () => {
      const rv = makeSuccessResult({ _compileGen: 1 });
      const jobGenerations = new Map([['job-stale', 3]]);
      const ctx = makeCtx({
        compileQueue: makeQueueWithGen(rv),
        jobGenerations,
      });
      const app = createTestApp(ctx);
      const { body } = await request(app, 'GET', '/api/compile/status/job-stale');

      // rv._compileGen (1) < currentGen (3) → stale, return active
      expect(body.status).toBe('active');
      expect(body.progress).toBe(0);
    });

    test('completed job with current generation returns completed normally', async () => {
      const rv = makeSuccessResult({ _compileGen: 5 });
      const jobGenerations = new Map([['job-current', 5]]);
      const ctx = makeCtx({
        compileQueue: makeQueueWithGen(rv),
        jobGenerations,
      });
      const app = createTestApp(ctx);
      const { body } = await request(app, 'GET', '/api/compile/status/job-current');

      // rv._compileGen (5) === currentGen (5) → not stale
      expect(body.status).toBe('completed');
      expect(body.resultUrl).toBe('/api/compile/result/job-current');
    });

    test('completed job with newer generation returns completed normally', async () => {
      const rv = makeSuccessResult({ _compileGen: 7 });
      const jobGenerations = new Map([['job-newer', 5]]);
      const ctx = makeCtx({
        compileQueue: makeQueueWithGen(rv),
        jobGenerations,
      });
      const app = createTestApp(ctx);
      const { body } = await request(app, 'GET', '/api/compile/status/job-newer');

      // rv._compileGen (7) > currentGen (5) → not stale
      expect(body.status).toBe('completed');
    });

    test('job without generation tracking returns completed (no stale check)', async () => {
      // No _compileGen on rv, no entry in jobGenerations → skip stale check
      const rv = makeSuccessResult();
      const ctx = makeCtx({
        compileQueue: makeQueueWithGen(rv),
        jobGenerations: new Map(), // empty map — no generation tracked
      });
      const app = createTestApp(ctx);
      const { body } = await request(app, 'GET', '/api/compile/status/job-no-gen');

      expect(body.status).toBe('completed');
    });

    test('generation from job.data._compileGen is used when rv._compileGen is absent', async () => {
      const rv = makeSuccessResult(); // no _compileGen on rv
      const jobData = { _compileGen: 1 };
      const jobGenerations = new Map([['job-data-gen', 5]]);

      const queue = {
        getJob: jest.fn().mockResolvedValue({
          getState: jest.fn().mockResolvedValue('completed'),
          returnvalue: rv,
          progress: 100,
          data: jobData,
        }),
        getWaitingCount: jest.fn().mockResolvedValue(0),
        add: jest.fn(),
      };
      const ctx = makeCtx({
        compileQueue: queue,
        jobGenerations,
      });
      const app = createTestApp(ctx);
      const { body } = await request(app, 'GET', '/api/compile/status/job-data-gen');

      // Falls back to job.data._compileGen (1) < currentGen (5) → stale
      expect(body.status).toBe('active');
      expect(body.progress).toBe(0);
    });
  });

  // ── 4. PDF persistence during status check ───────────────

  describe('PDF persistence', () => {

    function makeQueueForPersistence(rv) {
      return {
        getJob: jest.fn().mockResolvedValue({
          getState: jest.fn().mockResolvedValue('completed'),
          returnvalue: rv,
          progress: 100,
          data: {},
        }),
        getWaitingCount: jest.fn().mockResolvedValue(0),
        add: jest.fn(),
      };
    }

    test('completed job with un-persisted PDF calls persistPdf and updates pdfPath', async () => {
      const rv = makeSuccessResult({
        pdfPath: '/tmp/pp-worker-xyz/output.pdf',
        tmpBase: '/tmp/pp-worker-xyz',
      });
      const persistPdf = jest.fn().mockResolvedValue('/tmp/ppresults/job-persist.pdf');
      const resultStore = {
        exists: jest.fn().mockResolvedValue(true),
        createReadStream: jest.fn(),
        owns: jest.fn().mockReturnValue(false), // not yet persisted
      };
      const ctx = makeCtx({
        compileQueue: makeQueueForPersistence(rv),
        persistPdf,
        resultStore,
      });
      const app = createTestApp(ctx);
      const { body } = await request(app, 'GET', '/api/compile/status/job-persist');

      expect(body.status).toBe('completed');
      expect(persistPdf).toHaveBeenCalledWith('job-persist', '/tmp/pp-worker-xyz/output.pdf');
    });

    test('completed job with already-persisted PDF skips persistence', async () => {
      const rv = makeSuccessResult({
        pdfPath: '/tmp/ppresults/already-there.pdf',
      });
      const persistPdf = jest.fn();
      const resultStore = {
        exists: jest.fn().mockResolvedValue(true),
        createReadStream: jest.fn(),
        owns: jest.fn().mockReturnValue(true), // already persisted
      };
      const ctx = makeCtx({
        compileQueue: makeQueueForPersistence(rv),
        persistPdf,
        resultStore,
      });
      const app = createTestApp(ctx);
      const { body } = await request(app, 'GET', '/api/compile/status/job-already');

      expect(body.status).toBe('completed');
      expect(persistPdf).not.toHaveBeenCalled();
    });

    test('persistence failure does not break status response', async () => {
      const rv = makeSuccessResult({
        pdfPath: '/tmp/pp-worker-xyz/output.pdf',
      });
      const persistPdf = jest.fn().mockRejectedValue(new Error('disk full'));
      const resultStore = {
        exists: jest.fn().mockResolvedValue(true),
        createReadStream: jest.fn(),
        owns: jest.fn().mockReturnValue(false),
      };
      const ctx = makeCtx({
        compileQueue: makeQueueForPersistence(rv),
        persistPdf,
        resultStore,
      });
      const app = createTestApp(ctx);
      const { body } = await request(app, 'GET', '/api/compile/status/job-disk-fail');

      // Should still return completed even if persistence fails
      expect(body.status).toBe('completed');
      expect(body.resultUrl).toBe('/api/compile/result/job-disk-fail');
    });

    test('failed job does not attempt PDF persistence', async () => {
      const rv = makeFailedResult();
      const persistPdf = jest.fn();
      const ctx = makeCtx({
        compileQueue: makeQueueForPersistence(rv),
        persistPdf,
      });
      const app = createTestApp(ctx);
      const { body } = await request(app, 'GET', '/api/compile/status/job-fail-no-persist');

      expect(body.status).toBe('failed');
      expect(persistPdf).not.toHaveBeenCalled();
    });
  });

  // ── 5. Edge cases ────────────────────────────────────────

  describe('edge cases', () => {

    test('no cached result and no compileQueue returns 404', async () => {
      const ctx = makeCtx({ compileQueue: null });
      const app = createTestApp(ctx);
      const { status, body } = await request(app, 'GET', '/api/compile/status/job-nowhere');

      expect(status).toBe(404);
      expect(body.error).toBe('not_found');
      expect(body.message).toMatch(/not found or expired/i);
    });

    test('queue error falls through to 404', async () => {
      const queue = {
        getJob: jest.fn().mockRejectedValue(new Error('Redis connection lost')),
        getWaitingCount: jest.fn().mockResolvedValue(0),
        add: jest.fn(),
      };
      const ctx = makeCtx({ compileQueue: queue });
      const app = createTestApp(ctx);
      const { status, body } = await request(app, 'GET', '/api/compile/status/job-queue-err');

      expect(status).toBe(404);
      expect(body.error).toBe('not_found');
    });

    test('cached result takes precedence over queue lookup', async () => {
      const cachedResult = makeSuccessResult({ elapsed: 9999 });
      const queue = {
        getJob: jest.fn(),
        getWaitingCount: jest.fn().mockResolvedValue(0),
        add: jest.fn(),
      };
      const ctx = makeCtx({
        getJobResult: jest.fn().mockResolvedValue(cachedResult),
        compileQueue: queue,
      });
      const app = createTestApp(ctx);
      const { body } = await request(app, 'GET', '/api/compile/status/job-both');

      expect(body.status).toBe('completed');
      expect(body.elapsed).toBe(9999);
      // Queue should not be queried when cache has the result
      expect(queue.getJob).not.toHaveBeenCalled();
    });

    test('response always includes jobId matching the requested id', async () => {
      const ctx = makeCtx({
        getJobResult: jest.fn().mockResolvedValue(makeSuccessResult()),
      });
      const app = createTestApp(ctx);
      const { body } = await request(app, 'GET', '/api/compile/status/my-unique-id-xyz');

      expect(body.jobId).toBe('my-unique-id-xyz');
    });

    test('resultUrl is correctly formatted for the job id', async () => {
      const ctx = makeCtx({
        getJobResult: jest.fn().mockResolvedValue(makeSuccessResult()),
      });
      const app = createTestApp(ctx);
      const { body } = await request(app, 'GET', '/api/compile/status/abc-def-123');

      expect(body.resultUrl).toBe('/api/compile/result/abc-def-123');
    });

    test('without resultStore, persistence check uses RESULTS_DIR prefix', async () => {
      const rv = makeSuccessResult({
        pdfPath: '/tmp/ppresults/already-persisted.pdf',
      });
      const queue = {
        getJob: jest.fn().mockResolvedValue({
          getState: jest.fn().mockResolvedValue('completed'),
          returnvalue: rv,
          progress: 100,
          data: {},
        }),
        getWaitingCount: jest.fn().mockResolvedValue(0),
        add: jest.fn(),
      };
      const persistPdf = jest.fn();
      const ctx = makeCtx({
        compileQueue: queue,
        resultStore: null,
        persistPdf,
        RESULTS_DIR: '/tmp/ppresults',
      });
      const app = createTestApp(ctx);
      const { body } = await request(app, 'GET', '/api/compile/status/job-no-store');

      expect(body.status).toBe('completed');
      // pdfPath starts with RESULTS_DIR, so should skip persistence
      expect(persistPdf).not.toHaveBeenCalled();
    });

    test('without resultStore, un-persisted PDF triggers persistPdf', async () => {
      const rv = makeSuccessResult({
        pdfPath: '/tmp/pp-worker-xyz/output.pdf',
      });
      const queue = {
        getJob: jest.fn().mockResolvedValue({
          getState: jest.fn().mockResolvedValue('completed'),
          returnvalue: rv,
          progress: 100,
          data: {},
        }),
        getWaitingCount: jest.fn().mockResolvedValue(0),
        add: jest.fn(),
      };
      const persistPdf = jest.fn().mockResolvedValue('/tmp/ppresults/job-fallback.pdf');
      const ctx = makeCtx({
        compileQueue: queue,
        resultStore: null,
        persistPdf,
        RESULTS_DIR: '/tmp/ppresults',
      });
      const app = createTestApp(ctx);
      const { body } = await request(app, 'GET', '/api/compile/status/job-fallback');

      expect(body.status).toBe('completed');
      expect(persistPdf).toHaveBeenCalledWith('job-fallback', '/tmp/pp-worker-xyz/output.pdf');
    });

    test('path traversal with dot-dot in debugRef is blocked', async () => {
      const DEBUG_DIR = path.join(os.tmpdir(), 'pp-debug');
      const result = makeFailedResult({
        debug: { debugRef: path.join(DEBUG_DIR, '..', '..', 'etc', 'shadow') },
      });
      const ctx = makeCtx({
        getJobResult: jest.fn().mockResolvedValue(result),
      });
      const app = createTestApp(ctx);
      const { body } = await request(app, 'GET', '/api/compile/status/job-dot-dot');

      expect(body.status).toBe('failed');
      expect(body.debug.captureError).toMatch(/Invalid debug reference path/);
    });
  });
});
