/**
 * Standalone BullMQ Compile Worker
 *
 * Run this as a separate process from the Express API server for horizontal scaling.
 * The API server enqueues jobs; this worker processes them.
 *
 * Usage:
 *   node worker.js
 *
 * In production, run the API server and worker(s) separately:
 *   node index.js          # API server (no local worker)
 *   node worker.js         # Worker 1
 *   node worker.js         # Worker 2 (on another machine or container)
 *
 * Set WORKER_ONLY=true on the API server to disable its embedded worker.
 *
 * Environment variables:
 *   REDIS_URL / REDIS_HOST / REDIS_PORT — Redis connection (required)
 *   COMPILE_CONCURRENCY — Number of concurrent jobs (default: 3)
 *   COMPILE_TIMEOUT_MS — Per-job timeout (default: 45000)
 *   POCKETBASE_URL / POCKETBASE_ADMIN_EMAIL / POCKETBASE_ADMIN_PASSWORD — For tier verification
 *   RESULT_STORE_TYPE — 'local' | 's3' (default: 'local')
 */

const path = require('path');
const fs = require('fs');
const fsp = require('fs').promises;
const os = require('os');
const log = require('./logger');
const { processCompileJob } = require('./compile-worker');
const { createResultStore } = require('./result-store');

// ── Redis Connection ──

function createRedisConnection(opts = {}) {
  const Redis = require('ioredis');
  const redisOpts = { maxRetriesPerRequest: null, enableOfflineQueue: false, ...opts };
  return process.env.REDIS_URL
    ? new Redis(process.env.REDIS_URL, redisOpts)
    : new Redis({ host: process.env.REDIS_HOST || 'localhost', port: Number(process.env.REDIS_PORT || 6379), ...redisOpts });
}

// ── Template Registry (must match index.js) ──
// CRITICAL: Must include mainfont, sansfont, monofont, gridType — compile-worker.js
// reads these for font resolution, grid calculation, and preamble assembly.
// A registry with only templatePath will cause resolveFont(undefined) to throw.

const DESIGN_TEMPLATES = {
  symphony: { name: 'Symphony', templatePath: null, mainfont: 'EB Garamond', sansfont: 'Libertinus Sans', monofont: 'DejaVu Sans Mono', gridType: 'academic' },
  chicago: { name: 'Chicago', templatePath: null, mainfont: 'ETbb', sansfont: 'Latin Modern Sans', monofont: 'Latin Modern Mono', gridType: 'academic' },
  paperback: { name: 'Paperback', templatePath: null, mainfont: 'Alegreya Sans', sansfont: 'TeX Gyre Heros', monofont: 'DejaVu Sans Mono', gridType: 'trade' },
  chronicle: { name: 'Chronicle', templatePath: null, mainfont: 'TeX Gyre Heros', sansfont: null, monofont: 'Fira Mono', gridType: 'editorial' },
  exhibit: { name: 'Exhibit', templatePath: null, mainfont: 'Fira Sans', sansfont: 'TeX Gyre Adventor', monofont: 'Fira Mono', gridType: 'trade' },
  matrix: { name: 'Matrix', templatePath: null, mainfont: 'Fira Sans', sansfont: null, monofont: 'Fira Mono', gridType: 'corporate' },
  avantgarde: { name: 'Avant-Garde', templatePath: null, mainfont: 'Source Sans 3', sansfont: 'DejaVu Sans', monofont: 'TeX Gyre Cursor', gridType: 'creative' },
  minimal: { name: 'Minimal', templatePath: null, mainfont: 'Latin Modern Roman', sansfont: null, monofont: null, gridType: 'basic' },
  international: { name: 'International', templatePath: null, mainfont: 'TeX Gyre Heros', sansfont: 'TeX Gyre Heros', monofont: 'TeX Gyre Cursor', gridType: 'editorial' },
  cinema: { name: 'Cinema', templatePath: null, mainfont: 'TeX Gyre Cursor', sansfont: null, monofont: 'TeX Gyre Cursor', gridType: 'basic' },
  heirloom: { name: 'Heirloom', templatePath: null, mainfont: 'Fira Sans', sansfont: 'DejaVu Serif', monofont: 'Fira Mono', gridType: 'trade' },
  operator: { name: 'Operator', templatePath: null, mainfont: 'Fira Sans', sansfont: null, monofont: 'Fira Mono', gridType: 'editorial' },
  verse: { name: 'Verse', templatePath: null, mainfont: 'EB Garamond', sansfont: 'Libertinus Sans', monofont: 'DejaVu Sans Mono', gridType: 'creative' },
  thesis: { name: 'Thesis', templatePath: null, mainfont: 'Latin Modern Roman', sansfont: 'Latin Modern Sans', monofont: 'Latin Modern Mono', gridType: 'thesis' },
  memoir: { name: 'Memoir', templatePath: null, mainfont: 'Libre Baskerville', sansfont: 'TeX Gyre Heros', monofont: 'DejaVu Sans Mono', gridType: 'trade' },
};
const templateDir = path.resolve(__dirname, 'templates');
for (const name of Object.keys(DESIGN_TEMPLATES)) {
  const tplPath = path.resolve(templateDir, `${name}.latex`);
  if (fs.existsSync(tplPath)) {
    DESIGN_TEMPLATES[name].templatePath = tplPath;
  }
}

// ── Result Store ──

const resultStore = createResultStore();

// ── BullMQ Worker ──

const { Worker } = require('bullmq');
const RESULT_REDIS_TTL = 1800;

const redis = createRedisConnection();

async function persistAndStore(jobId, result) {
  if (result.success && result.pdfPath) {
    const persistedPath = await resultStore.persist(jobId, result.pdfPath);
    if (persistedPath) {
      if (result.tmpBase) fsp.rm(result.tmpBase, { recursive: true, force: true }).catch(() => {});
      result.pdfPath = persistedPath;
      delete result.tmpBase;
    }
  }
  // Store result metadata in Redis for the API server to read
  result._storedAt = Date.now();
  const redisValue = { ...result };
  delete redisValue.tmpBase;
  try {
    await redis.setex(`pp:result:${jobId}`, RESULT_REDIS_TTL, JSON.stringify(redisValue));
  } catch (err) {
    log.error({ module: 'worker', jobId, err: err.message }, 'Failed to store result in Redis');
  }
}

const concurrency = Number(process.env.COMPILE_CONCURRENCY || 3);

const worker = new Worker('pp-compile', async (job) => {
  log.info({ module: 'worker', jobId: job.id, template: job.data.template }, 'Processing job');
  const result = await processCompileJob(job, DESIGN_TEMPLATES);
  await persistAndStore(job.id, result);
  return result;
}, {
  connection: createRedisConnection(),
  concurrency,
  lockDuration: 60_000,
  stalledInterval: 30_000,
  maxStalledCount: 0,
  removeOnComplete: { count: 200 },
  removeOnFail: { count: 500 },
});

worker.on('completed', (job) => {
  log.info({ module: 'worker', jobId: job.id }, 'Job completed');
});

worker.on('failed', async (job, err) => {
  const result = {
    success: false, error: 'worker_error', message: err.message || 'Compilation failed.',
    debug: { texSource: null, latexLog: null, headerTex: null, filesInDir: [], captureError: `BullMQ failed event: ${err.message}`, stack: err.stack?.substring(0, 2000) || null },
  };
  await persistAndStore(job.id, result);
  log.error({ module: 'worker', jobId: job?.id, err: err.message }, 'Job failed');
});

worker.on('error', (err) => {
  log.error({ module: 'worker', err: err.message }, 'Worker error');
});

log.info({
  module: 'worker',
  concurrency,
  resultStore: resultStore.type,
  pid: process.pid,
}, 'Standalone compile worker started');

// ── Disk Sweeper ──

const PP_TMP_PREFIXES = ['pp-enqueue-', 'pp-sync-', 'pp-batch-', 'pp-conv-', 'pp-worker-'];
const ORPHAN_MAX_AGE_MS = 60 * 60 * 1000;

async function sweepOrphanedTmpDirs() {
  try {
    const tmpDir = os.tmpdir();
    const entries = await fsp.readdir(tmpDir);
    const now = Date.now();
    let swept = 0;
    for (const entry of entries) {
      if (!PP_TMP_PREFIXES.some(p => entry.startsWith(p))) continue;
      const fullPath = path.join(tmpDir, entry);
      try {
        const stats = await fsp.stat(fullPath);
        if (now - stats.mtimeMs > ORPHAN_MAX_AGE_MS) {
          await fsp.rm(fullPath, { recursive: true, force: true });
          swept++;
        }
      } catch { /* cleaned by another process */ }
    }
    if (swept > 0) log.info({ module: 'disk-sweep', swept }, 'Removed orphaned temp dirs');
  } catch (err) {
    log.error({ module: 'disk-sweep', err: err.message }, 'Sweep error');
  }
}

sweepOrphanedTmpDirs();
const diskSweepInterval = setInterval(sweepOrphanedTmpDirs, ORPHAN_MAX_AGE_MS);
diskSweepInterval.unref();

// ── Graceful Shutdown ──

async function shutdown(signal) {
  log.info({ module: 'worker', signal }, 'Shutting down worker');
  try { await worker.close(); } catch {}
  try { await redis.quit(); } catch {}
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('uncaughtException', (err) => {
  log.fatal({ module: 'worker', err: err.message, stack: err.stack }, 'Uncaught exception');
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  const msg = reason instanceof Error ? reason.message : String(reason);
  log.fatal({ module: 'worker', err: msg }, 'Unhandled rejection');
  process.exit(1);
});
