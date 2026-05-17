'use strict';

const express = require('express');
const http = require('http');
const fs = require('fs');
const fsp = require('fs').promises;
const path = require('path');
const os = require('os');
const crypto = require('crypto');

// Mock compile-worker before requiring routes
jest.mock('../compile-worker', () => ({ processCompileJob: jest.fn() }));
jest.mock('../entitlements', () => ({ checkExportEntitlement: jest.fn().mockReturnValue({ allowed: true }) }));

const compileRoutes = require('../routes/compile');

// ── Helpers ──

function createCtx(overrides = {}) {
  return {
    compileLimiter: (_req, _res, next) => next(),
    compileQueue: null,
    redisHealthy: false,
    verifyUserTier: jest.fn().mockResolvedValue({ userId: 'user-1', tier: 'drafter' }),
    hasTier: (t, r) => {
      const L = { anonymous: 0, drafter: 1, publisher: 2, studio: 3 };
      return (L[t] || 0) >= (L[r] || 0);
    },
    storeJobResult: jest.fn(),
    getJobResult: jest.fn().mockResolvedValue(null),
    deleteJobResult: jest.fn(),
    storeJobSecret: jest.fn(),
    getJobSecret: jest.fn().mockResolvedValue(null),
    persistPdf: jest.fn(),
    resultStore: null,
    RESULTS_DIR: '/tmp/ppresults',
    DESIGN_TEMPLATES: {
      chicago: { name: 'Chicago', templatePath: '/fake', mainfont: 'Palatino' },
      symphony: { name: 'Symphony', templatePath: '/fake', mainfont: 'Palatino' },
    },
    jobGenerations: new Map(),
    activeSyncCompiles: 0,
    MAX_SYNC_CONCURRENT: 2,
    ...overrides,
  };
}

function createApp(ctx) {
  const app = express();
  app.use(express.json({ limit: '5mb' }));
  app.use(compileRoutes(ctx));
  return app;
}

async function request(app, method, urlPath, { body, headers } = {}) {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      const opts = {
        hostname: '127.0.0.1',
        port,
        path: urlPath,
        method,
        headers: { ...headers },
      };
      if (body) opts.headers['Content-Type'] = 'application/json';
      const req = http.request(opts, (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          server.close();
          const raw = Buffer.concat(chunks);
          let parsed;
          try {
            parsed = JSON.parse(raw.toString());
          } catch {
            parsed = raw.toString();
          }
          resolve({
            status: res.statusCode,
            headers: res.headers,
            raw,
            body: parsed,
          });
        });
      });
      req.on('error', (e) => { server.close(); reject(e); });
      if (body) req.write(JSON.stringify(body));
      req.end();
    });
  });
}

// ── Temp file management ──
const tempFiles = [];

async function createTempPdf(content = '%PDF-1.4 fake pdf content for testing') {
  const tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'pp-test-'));
  const filePath = path.join(tmpDir, 'output.pdf');
  await fsp.writeFile(filePath, content);
  tempFiles.push(tmpDir);
  return filePath;
}

async function createTempEpub(content = 'PK fake epub content for testing') {
  const tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'pp-test-'));
  const filePath = path.join(tmpDir, 'output.epub');
  await fsp.writeFile(filePath, content);
  tempFiles.push(tmpDir);
  return filePath;
}

afterAll(async () => {
  for (const dir of tempFiles) {
    try {
      await fsp.rm(dir, { recursive: true, force: true });
    } catch { /* ignore cleanup errors */ }
  }
});

// ══════════════════════════════════════════════════════════
// Tests
// ══════════════════════════════════════════════════════════

describe('GET /api/compile/result/:id', () => {

  // ── 1. Result Not Found ──
  describe('Result not found', () => {
    test('returns 404 when no cached result exists', async () => {
      const ctx = createCtx();
      ctx.getJobResult.mockResolvedValue(null);
      const app = createApp(ctx);

      const res = await request(app, 'GET', '/api/compile/result/nonexistent-id');

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('not_found');
    });

    test('returns 404 with descriptive message', async () => {
      const ctx = createCtx();
      ctx.getJobResult.mockResolvedValue(null);
      const app = createApp(ctx);

      const res = await request(app, 'GET', '/api/compile/result/abc-123');

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/not found|expired/i);
    });
  });

  // ── 2. Failed Compilation Result ──
  describe('Failed compilation result', () => {
    test('returns 400 when result has success=false', async () => {
      const ctx = createCtx();
      ctx.getJobResult.mockResolvedValue({
        success: false,
        error: 'compile_error',
        message: 'LaTeX compilation failed.',
      });
      const app = createApp(ctx);

      const res = await request(app, 'GET', '/api/compile/result/failed-job');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('compile_error');
    });

    test('returns the full error result object on failure', async () => {
      const ctx = createCtx();
      const failedResult = {
        success: false,
        error: 'timeout',
        message: 'Compilation exceeded 45s limit.',
        detail: 'Process SIGKILL after timeout',
      };
      ctx.getJobResult.mockResolvedValue(failedResult);
      const app = createApp(ctx);

      const res = await request(app, 'GET', '/api/compile/result/timeout-job');

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('timeout');
      expect(res.body.message).toBe('Compilation exceeded 45s limit.');
      expect(res.body.detail).toBe('Process SIGKILL after timeout');
    });
  });

  // ── 3. Auth: Authenticated User ──
  describe('Auth: authenticated user', () => {
    test('streams PDF when owner matches requester', async () => {
      const pdfPath = await createTempPdf();
      const ctx = createCtx();
      ctx.getJobResult.mockResolvedValue({
        success: true,
        userId: 'user-1',
        pdfPath,
        title: 'My Book',
        template: 'chicago',
        pageSize: 'letter',
      });
      ctx.verifyUserTier.mockResolvedValue({ userId: 'user-1', tier: 'publisher' });
      const app = createApp(ctx);

      const res = await request(app, 'GET', '/api/compile/result/auth-job');

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toBe('application/pdf');
      expect(res.raw.toString()).toContain('%PDF-1.4');
    });

    test('returns 403 when requester is not the owner', async () => {
      const pdfPath = await createTempPdf();
      const ctx = createCtx();
      ctx.getJobResult.mockResolvedValue({
        success: true,
        userId: 'user-1',
        pdfPath,
        title: 'Secret Book',
        template: 'chicago',
        pageSize: 'letter',
      });
      ctx.verifyUserTier.mockResolvedValue({ userId: 'user-OTHER', tier: 'publisher' });
      const app = createApp(ctx);

      const res = await request(app, 'GET', '/api/compile/result/forbidden-job');

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('forbidden');
    });
  });

  // ── 4. Auth: Anonymous User with Secret ──
  describe('Auth: anonymous user with secret', () => {
    test('streams PDF when correct secret provided via header', async () => {
      const pdfPath = await createTempPdf();
      const secret = crypto.randomBytes(16).toString('hex');
      const ctx = createCtx();
      ctx.getJobResult.mockResolvedValue({
        success: true,
        userId: null,
        pdfPath,
        title: 'Anon Book',
        template: 'symphony',
        pageSize: 'a5',
      });
      ctx.getJobSecret.mockResolvedValue(secret);
      const app = createApp(ctx);

      const res = await request(app, 'GET', '/api/compile/result/anon-job', {
        headers: { 'x-pp-result-secret': secret },
      });

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toBe('application/pdf');
      expect(res.raw.toString()).toContain('%PDF-1.4');
    });

    test('streams PDF when correct secret provided via query param', async () => {
      const pdfPath = await createTempPdf();
      const secret = 'my-secret-token-12345';
      const ctx = createCtx();
      ctx.getJobResult.mockResolvedValue({
        success: true,
        userId: null,
        pdfPath,
        title: 'Query Book',
        template: 'chicago',
        pageSize: 'sixByNine',
      });
      ctx.getJobSecret.mockResolvedValue(secret);
      const app = createApp(ctx);

      const res = await request(app, 'GET', `/api/compile/result/query-job?secret=${secret}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toBe('application/pdf');
    });

    test('returns 403 when wrong secret provided', async () => {
      const pdfPath = await createTempPdf();
      const ctx = createCtx();
      ctx.getJobResult.mockResolvedValue({
        success: true,
        userId: null,
        pdfPath,
        title: 'Protected',
        template: 'chicago',
        pageSize: 'letter',
      });
      ctx.getJobSecret.mockResolvedValue('correct-secret-value');
      const app = createApp(ctx);

      const res = await request(app, 'GET', '/api/compile/result/wrong-secret', {
        headers: { 'x-pp-result-secret': 'wrong-secret-values' },
      });

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('forbidden');
    });

    test('returns 403 when secret has wrong length (timing-safe)', async () => {
      const pdfPath = await createTempPdf();
      const ctx = createCtx();
      ctx.getJobResult.mockResolvedValue({
        success: true,
        userId: null,
        pdfPath,
        title: 'Protected',
        template: 'chicago',
        pageSize: 'letter',
      });
      ctx.getJobSecret.mockResolvedValue('a-32-character-secret-value!!!!');
      const app = createApp(ctx);

      const res = await request(app, 'GET', '/api/compile/result/len-mismatch', {
        headers: { 'x-pp-result-secret': 'short' },
      });

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('forbidden');
    });

    test('returns 403 when no secret provided but one is required', async () => {
      const pdfPath = await createTempPdf();
      const ctx = createCtx();
      ctx.getJobResult.mockResolvedValue({
        success: true,
        userId: null,
        pdfPath,
        title: 'Protected',
        template: 'chicago',
        pageSize: 'letter',
      });
      ctx.getJobSecret.mockResolvedValue('stored-secret-abc');
      const app = createApp(ctx);

      const res = await request(app, 'GET', '/api/compile/result/no-secret-given');

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('forbidden');
    });

    test('streams PDF when no stored secret exists (no auth required)', async () => {
      const pdfPath = await createTempPdf();
      const ctx = createCtx();
      ctx.getJobResult.mockResolvedValue({
        success: true,
        userId: null,
        pdfPath,
        title: 'Public Book',
        template: 'chicago',
        pageSize: 'letter',
      });
      ctx.getJobSecret.mockResolvedValue(null);
      const app = createApp(ctx);

      const res = await request(app, 'GET', '/api/compile/result/public-job');

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toBe('application/pdf');
    });

    test('secret survives for the result TTL so retries work', async () => {
      // Previous behavior: deleted the secret after the first successful read,
      // which meant a single network hiccup mid-download produced a 403 on
      // retry. Now: the secret lives for the result's natural ~30-min TTL —
      // matching the /api/compile/pages handler's behavior — so re-fetching
      // with a valid secret succeeds.
      const pdfPath = await createTempPdf();
      const secret = 'one-time-secret-token';
      const ctx = createCtx();
      ctx.getJobResult.mockResolvedValue({
        success: true,
        userId: null,
        pdfPath,
        title: 'One Time',
        template: 'chicago',
        pageSize: 'letter',
      });
      ctx.getJobSecret.mockResolvedValue(secret);
      const app = createApp(ctx);

      await request(app, 'GET', '/api/compile/result/consume-secret', {
        headers: { 'x-pp-result-secret': secret },
      });

      expect(ctx.deleteJobResult).not.toHaveBeenCalledWith('consume-secret:secret');
    });
  });

  // ── 5. File Existence ──
  describe('File existence', () => {
    test('returns 410 when PDF file is missing from disk', async () => {
      const ctx = createCtx();
      ctx.getJobResult.mockResolvedValue({
        success: true,
        userId: null,
        pdfPath: '/tmp/nonexistent/output.pdf',
        title: 'Gone Book',
        template: 'chicago',
        pageSize: 'letter',
      });
      const app = createApp(ctx);

      const res = await request(app, 'GET', '/api/compile/result/expired-job');

      expect(res.status).toBe(410);
      expect(res.body.error).toBe('expired');
    });

    test('returns 410 when pdfPath is null', async () => {
      const ctx = createCtx();
      ctx.getJobResult.mockResolvedValue({
        success: true,
        userId: null,
        pdfPath: null,
        title: 'Null Path',
        template: 'chicago',
        pageSize: 'letter',
      });
      const app = createApp(ctx);

      const res = await request(app, 'GET', '/api/compile/result/null-path');

      expect(res.status).toBe(410);
      expect(res.body.error).toBe('expired');
    });

    test('calls deleteJobResult when file is expired', async () => {
      const ctx = createCtx();
      ctx.getJobResult.mockResolvedValue({
        success: true,
        userId: null,
        pdfPath: '/tmp/gone/output.pdf',
        title: 'Deleted',
        template: 'chicago',
        pageSize: 'letter',
      });
      const app = createApp(ctx);

      await request(app, 'GET', '/api/compile/result/cleanup-job');

      expect(ctx.deleteJobResult).toHaveBeenCalledWith('cleanup-job');
    });

    test('uses resultStore.exists when resultStore is set', async () => {
      const ctx = createCtx();
      const mockStore = {
        exists: jest.fn().mockResolvedValue(false),
        createReadStream: jest.fn(),
      };
      ctx.resultStore = mockStore;
      ctx.getJobResult.mockResolvedValue({
        success: true,
        userId: null,
        pdfPath: 's3://bucket/result.pdf',
        title: 'S3 Book',
        template: 'chicago',
        pageSize: 'letter',
      });
      const app = createApp(ctx);

      const res = await request(app, 'GET', '/api/compile/result/s3-missing');

      expect(mockStore.exists).toHaveBeenCalledWith('s3://bucket/result.pdf');
      expect(res.status).toBe(410);
    });

    test('streams successfully when file exists on disk', async () => {
      const pdfContent = '%PDF-1.7 This is the actual content of the file';
      const pdfPath = await createTempPdf(pdfContent);
      const ctx = createCtx();
      ctx.getJobResult.mockResolvedValue({
        success: true,
        userId: null,
        pdfPath,
        title: 'Real Book',
        template: 'chicago',
        pageSize: 'letter',
      });
      const app = createApp(ctx);

      const res = await request(app, 'GET', '/api/compile/result/real-file');

      expect(res.status).toBe(200);
      expect(res.raw.toString()).toBe(pdfContent);
    });
  });

  // ── 6. Response Headers ──
  describe('Response headers', () => {
    async function getWithResult(resultOverrides) {
      const pdfPath = await createTempPdf();
      const ctx = createCtx();
      ctx.getJobResult.mockResolvedValue({
        success: true,
        userId: null,
        pdfPath,
        title: 'Header Book',
        template: 'chicago',
        pageSize: 'letter',
        ...resultOverrides,
      });
      const app = createApp(ctx);
      return request(app, 'GET', '/api/compile/result/headers-test');
    }

    test('Content-Type is application/pdf for PDF output', async () => {
      const res = await getWithResult({});
      expect(res.headers['content-type']).toBe('application/pdf');
    });

    test('Content-Type is application/epub+zip for EPUB output', async () => {
      const epubPath = await createTempEpub();
      const ctx = createCtx();
      ctx.getJobResult.mockResolvedValue({
        success: true,
        userId: null,
        pdfPath: epubPath,
        title: 'Epub Book',
        template: 'chicago',
        pageSize: 'letter',
        outputFormat: 'EPUB3',
      });
      const app = createApp(ctx);

      const res = await request(app, 'GET', '/api/compile/result/epub-test');

      expect(res.headers['content-type']).toBe('application/epub+zip');
    });

    test('X-PP-Watermarked is "true" when needsWatermark=true', async () => {
      const res = await getWithResult({ needsWatermark: true });
      expect(res.headers['x-pp-watermarked']).toBe('true');
    });

    test('X-PP-Watermarked is "false" when needsWatermark=false', async () => {
      const res = await getWithResult({ needsWatermark: false });
      expect(res.headers['x-pp-watermarked']).toBe('false');
    });

    test('X-PP-Watermarked is "false" when needsWatermark is undefined', async () => {
      const res = await getWithResult({});
      expect(res.headers['x-pp-watermarked']).toBe('false');
    });

    test('X-PP-Build-Id is set when buildId present', async () => {
      const res = await getWithResult({ buildId: 'build-abc-123' });
      expect(res.headers['x-pp-build-id']).toBe('build-abc-123');
    });

    test('X-PP-Build-Id is absent when buildId not present', async () => {
      const res = await getWithResult({});
      expect(res.headers['x-pp-build-id']).toBeUndefined();
    });

    test('X-PP-Content-Hash is set when contentHash present', async () => {
      const res = await getWithResult({ contentHash: 'sha256-deadbeef' });
      expect(res.headers['x-pp-content-hash']).toBe('sha256-deadbeef');
    });

    test('X-PP-Compile-Time is set when elapsed present', async () => {
      const res = await getWithResult({ elapsed: 2345 });
      expect(res.headers['x-pp-compile-time']).toBe('2345');
    });

    test('X-PP-Compile-Time is absent when elapsed not present', async () => {
      const res = await getWithResult({});
      expect(res.headers['x-pp-compile-time']).toBeUndefined();
    });

    test('X-PP-Font-Fallback is set when fontFallback present', async () => {
      const res = await getWithResult({ fontFallback: 'Noto Serif' });
      expect(res.headers['x-pp-font-fallback']).toBe('Noto Serif');
    });

    test('X-PP-Format matches outputFormat', async () => {
      const res = await getWithResult({ outputFormat: 'PDF/X-1a' });
      expect(res.headers['x-pp-format']).toBe('PDF/X-1a');
    });

    test('X-PP-Format defaults to "PDF" when outputFormat not set', async () => {
      const res = await getWithResult({});
      expect(res.headers['x-pp-format']).toBe('PDF');
    });

    test('Content-Disposition has inline disposition with filename', async () => {
      const res = await getWithResult({ title: 'My Great Novel', template: 'paperback', pageSize: 'sixByNine' });
      const disposition = res.headers['content-disposition'];
      expect(disposition).toMatch(/^inline; filename="/);
      expect(disposition).toContain('my-great-novel');
      expect(disposition).toContain('.pdf');
    });

    test('X-PP-Filename header is set', async () => {
      const res = await getWithResult({ title: 'Test Title' });
      expect(res.headers['x-pp-filename']).toBeDefined();
      expect(res.headers['x-pp-filename']).toContain('test-title');
      expect(res.headers['x-pp-filename']).toContain('.pdf');
    });

    test('Cache-Control is no-store', async () => {
      const res = await getWithResult({});
      expect(res.headers['cache-control']).toBe('no-store');
    });

    test('EPUB filename ends with .epub', async () => {
      const epubPath = await createTempEpub();
      const ctx = createCtx();
      ctx.getJobResult.mockResolvedValue({
        success: true,
        userId: null,
        pdfPath: epubPath,
        title: 'Epub Novel',
        template: 'chicago',
        pageSize: 'letter',
        outputFormat: 'EPUB3',
      });
      const app = createApp(ctx);

      const res = await request(app, 'GET', '/api/compile/result/epub-filename');

      expect(res.headers['x-pp-filename']).toMatch(/\.epub$/);
      expect(res.headers['content-disposition']).toContain('.epub');
    });
  });

  // ── 7. Streaming ──
  describe('Streaming', () => {
    test('streams actual file content to response', async () => {
      const content = 'UNIQUE-PDF-CONTENT-' + crypto.randomBytes(8).toString('hex');
      const pdfPath = await createTempPdf(content);
      const ctx = createCtx();
      ctx.getJobResult.mockResolvedValue({
        success: true,
        userId: null,
        pdfPath,
        title: 'Stream Test',
        template: 'chicago',
        pageSize: 'letter',
      });
      const app = createApp(ctx);

      const res = await request(app, 'GET', '/api/compile/result/stream-test');

      expect(res.status).toBe(200);
      expect(res.raw.toString()).toBe(content);
    });

    test('uses resultStore.createReadStream when resultStore is set', async () => {
      const content = 'STORED-PDF-BYTES-FROM-S3';
      const { Readable } = require('stream');
      const mockStream = Readable.from(Buffer.from(content));

      const ctx = createCtx();
      ctx.resultStore = {
        exists: jest.fn().mockResolvedValue(true),
        createReadStream: jest.fn().mockReturnValue(mockStream),
      };
      ctx.getJobResult.mockResolvedValue({
        success: true,
        userId: null,
        pdfPath: 's3://bucket/key.pdf',
        title: 'S3 Book',
        template: 'chicago',
        pageSize: 'letter',
      });
      const app = createApp(ctx);

      const res = await request(app, 'GET', '/api/compile/result/s3-stream');

      expect(res.status).toBe(200);
      expect(ctx.resultStore.createReadStream).toHaveBeenCalledWith('s3://bucket/key.pdf');
      expect(res.raw.toString()).toBe(content);
    });

    test('uses fs.createReadStream when no resultStore', async () => {
      const content = 'LOCAL-FS-PDF-BYTES';
      const pdfPath = await createTempPdf(content);
      const ctx = createCtx();
      ctx.resultStore = null;
      ctx.getJobResult.mockResolvedValue({
        success: true,
        userId: null,
        pdfPath,
        title: 'Local Book',
        template: 'chicago',
        pageSize: 'letter',
      });
      const app = createApp(ctx);

      const res = await request(app, 'GET', '/api/compile/result/local-stream');

      expect(res.status).toBe(200);
      expect(res.raw.toString()).toBe(content);
    });

    test('streams binary content correctly', async () => {
      const binaryContent = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x00, 0xFF, 0xD8, 0xFF, 0xE0]);
      const pdfPath = await createTempPdf(binaryContent);
      const ctx = createCtx();
      ctx.getJobResult.mockResolvedValue({
        success: true,
        userId: null,
        pdfPath,
        title: 'Binary Book',
        template: 'chicago',
        pageSize: 'letter',
      });
      const app = createApp(ctx);

      const res = await request(app, 'GET', '/api/compile/result/binary-stream');

      expect(res.status).toBe(200);
      expect(Buffer.compare(res.raw, binaryContent)).toBe(0);
    });
  });

  // ── 8. Filename Generation ──
  describe('Filename generation', () => {
    test('slugifies title with special characters', async () => {
      const pdfPath = await createTempPdf();
      const ctx = createCtx();
      ctx.getJobResult.mockResolvedValue({
        success: true,
        userId: null,
        pdfPath,
        title: "Alice's Adventures in Wonderland!",
        template: 'chicago',
        pageSize: 'letter',
      });
      const app = createApp(ctx);

      const res = await request(app, 'GET', '/api/compile/result/slug-test');

      const filename = res.headers['x-pp-filename'];
      expect(filename).toMatch(/^alices-adventures-in-wonderland/);
      expect(filename).not.toContain("'");
      expect(filename).not.toContain('!');
    });

    test('includes template code in filename', async () => {
      const pdfPath = await createTempPdf();
      const ctx = createCtx();
      ctx.getJobResult.mockResolvedValue({
        success: true,
        userId: null,
        pdfPath,
        title: 'Test',
        template: 'chronicle',
        pageSize: 'letter',
      });
      const app = createApp(ctx);

      const res = await request(app, 'GET', '/api/compile/result/tpl-code');

      expect(res.headers['x-pp-filename']).toContain('chronicle');
    });

    test('includes page size code in filename', async () => {
      const pdfPath = await createTempPdf();
      const ctx = createCtx();
      ctx.getJobResult.mockResolvedValue({
        success: true,
        userId: null,
        pdfPath,
        title: 'Test',
        template: 'chicago',
        pageSize: 'sixByNine',
      });
      const app = createApp(ctx);

      const res = await request(app, 'GET', '/api/compile/result/size-code');

      expect(res.headers['x-pp-filename']).toContain('6x9');
    });

    test('defaults title to "manuscript" when empty', async () => {
      const pdfPath = await createTempPdf();
      const ctx = createCtx();
      ctx.getJobResult.mockResolvedValue({
        success: true,
        userId: null,
        pdfPath,
        title: '',
        template: 'chicago',
        pageSize: 'letter',
      });
      const app = createApp(ctx);

      const res = await request(app, 'GET', '/api/compile/result/empty-title');

      expect(res.headers['x-pp-filename']).toMatch(/^manuscript/);
    });
  });

  // ── 9. Edge Cases ──
  describe('Edge cases', () => {
    test('handles result with all optional metadata fields set', async () => {
      const pdfPath = await createTempPdf();
      const ctx = createCtx();
      ctx.getJobResult.mockResolvedValue({
        success: true,
        userId: null,
        pdfPath,
        title: 'Full Meta Book',
        template: 'symphony',
        pageSize: 'a4',
        buildId: 'build-xyz',
        contentHash: 'hash-abc',
        elapsed: 5678,
        fontFallback: 'DejaVu Serif',
        needsWatermark: true,
        outputFormat: 'PDF',
      });
      const app = createApp(ctx);

      const res = await request(app, 'GET', '/api/compile/result/full-meta');

      expect(res.status).toBe(200);
      expect(res.headers['x-pp-build-id']).toBe('build-xyz');
      expect(res.headers['x-pp-content-hash']).toBe('hash-abc');
      expect(res.headers['x-pp-compile-time']).toBe('5678');
      expect(res.headers['x-pp-font-fallback']).toBe('DejaVu Serif');
      expect(res.headers['x-pp-watermarked']).toBe('true');
      expect(res.headers['x-pp-format']).toBe('PDF');
      expect(res.headers['cache-control']).toBe('no-store');
    });

    test('handles result with no optional metadata fields', async () => {
      const pdfPath = await createTempPdf();
      const ctx = createCtx();
      ctx.getJobResult.mockResolvedValue({
        success: true,
        userId: null,
        pdfPath,
        title: 'Bare Book',
        template: 'chicago',
        pageSize: 'letter',
      });
      const app = createApp(ctx);

      const res = await request(app, 'GET', '/api/compile/result/bare-meta');

      expect(res.status).toBe(200);
      expect(res.headers['x-pp-watermarked']).toBe('false');
      expect(res.headers['x-pp-format']).toBe('PDF');
      expect(res.headers['x-pp-build-id']).toBeUndefined();
      expect(res.headers['x-pp-content-hash']).toBeUndefined();
      expect(res.headers['x-pp-compile-time']).toBeUndefined();
      expect(res.headers['x-pp-font-fallback']).toBeUndefined();
    });

    test('resultStore.exists returning true allows streaming via resultStore', async () => {
      const content = 'REMOTE-CONTENT';
      const { Readable } = require('stream');

      const ctx = createCtx();
      ctx.resultStore = {
        exists: jest.fn().mockResolvedValue(true),
        createReadStream: jest.fn().mockReturnValue(Readable.from(Buffer.from(content))),
      };
      ctx.getJobResult.mockResolvedValue({
        success: true,
        userId: null,
        pdfPath: '/remote/path/result.pdf',
        title: 'Remote',
        template: 'chicago',
        pageSize: 'letter',
      });
      const app = createApp(ctx);

      const res = await request(app, 'GET', '/api/compile/result/remote-exists');

      expect(res.status).toBe(200);
      expect(ctx.resultStore.exists).toHaveBeenCalledWith('/remote/path/result.pdf');
      expect(ctx.resultStore.createReadStream).toHaveBeenCalledWith('/remote/path/result.pdf');
      expect(res.raw.toString()).toBe(content);
    });
  });
});
