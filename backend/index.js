const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const fsp = require('fs').promises;
const os = require('os');
const path = require('path');
const { execSync } = require('child_process');
const GridSystem = require('./grid-system');
const lulu = require('./lulu');
const log = require('./logger');
const { createResultStore } = require('./result-store');

// ── Redis (optional — gracefully degrades if not configured) ──
let redis = null;
let redisHealthy = false;

function createRedisConnection({ forBullMQ = false } = {}) {
  const Redis = require('ioredis');
  const opts = forBullMQ
    ? { maxRetriesPerRequest: null, enableOfflineQueue: false }
    : { maxRetriesPerRequest: null };
  return process.env.REDIS_URL
    ? new Redis(process.env.REDIS_URL, opts)
    : new Redis({ host: process.env.REDIS_HOST || 'localhost', port: Number(process.env.REDIS_PORT || 6379), ...opts });
}

try {
  if (process.env.REDIS_URL || process.env.REDIS_HOST) {
    redis = createRedisConnection();
    redis.on('connect', () => { redisHealthy = true; log.info({ module: 'redis' }, 'Connected'); });
    redis.on('error', (err) => { redisHealthy = false; log.error({ module: 'redis', err: err.message }, 'Connection error'); });
    redis.on('close', () => { redisHealthy = false; });
  }
} catch (err) {
  log.warn({ module: 'redis', err: err.message }, 'Not available');
}

// ── BullMQ Compile Queue ──
const { processCompileJob } = require('./compile-worker');
let compileQueue = null;
let compileWorker = null;
let compileQueueEvents = null;

// In-memory job results map (primary) + Redis backup (survives restarts)
const jobResults = new Map();
const RESULT_REDIS_TTL = 1800; // 30 minutes (up from 10 — results now persist)

// ── Result Store (pluggable: local disk or S3) ──
// Set RESULT_STORE_TYPE=s3 for multi-replica deployments.
// See result-store.js for full configuration.
const resultStore = createResultStore();
const RESULTS_DIR = resultStore.type === 'local' ? resultStore.dir : '__s3__';

/**
 * Persist a compiled PDF via the result store abstraction.
 * Returns the new path/reference, or null on failure.
 */
async function persistPdf(jobId, srcPdfPath) {
  return resultStore.persist(jobId, srcPdfPath);
}

function storeJobResult(id, value) {
  value._storedAt = Date.now();
  jobResults.set(id, value);
  if (redisHealthy && redis) {
    // Store full metadata to Redis (including pdfPath for recovery)
    const redisValue = { ...value };
    // Keep pdfPath in Redis so we can check if the file still exists on recovery
    delete redisValue.tmpBase; // tmpBase is local-only
    redis.setex(`pp:result:${id}`, RESULT_REDIS_TTL, JSON.stringify(redisValue)).catch(() => {});
  }
}

async function getJobResult(id) {
  const local = jobResults.get(id);
  if (local) return local;
  if (!redisHealthy || !redis) return null;
  try {
    const raw = await redis.get(`pp:result:${id}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Check if the PDF file still exists (local disk or S3)
    if (parsed.pdfPath && parsed.success) {
      const fileExists = await resultStore.exists(parsed.pdfPath);
      if (fileExists) {
        // File exists — promote back to in-memory for faster subsequent access
        parsed._recoveredFromRedis = true;
        jobResults.set(id, parsed);
        return parsed;
      } else {
        // File was cleaned up — result is unservable, clean up Redis
        redis.del(`pp:result:${id}`).catch(() => {});
        return null;
      }
    }
    // Non-success results (errors) — return metadata only
    if (!parsed.success) return parsed;
    return null;
  } catch { return null; }
}

function deleteJobResult(id) {
  jobResults.delete(id);
  if (redisHealthy && redis) redis.del(`pp:result:${id}`).catch(() => {});
}

function storeJobSecret(jobId, secret) {
  jobResults.set(`${jobId}:secret`, secret);
  if (redisHealthy && redis) redis.setex(`pp:result:${jobId}:secret`, RESULT_REDIS_TTL, secret).catch(() => {});
}

async function getJobSecret(jobId) {
  const local = jobResults.get(`${jobId}:secret`);
  if (local) return local;
  if (!redisHealthy || !redis) return null;
  try { return await redis.get(`pp:result:${jobId}:secret`); } catch { return null; }
}

// Sync fallback semaphore
const MAX_SYNC_CONCURRENT = Number(process.env.MAX_SYNC_CONCURRENT || 2);
let activeSyncCompiles = 0;

// Result cleanup: TTL 30 minutes (persisted PDFs survive longer)
const RESULT_TTL_MS = 30 * 60 * 1000;
const resultCleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [id, res] of jobResults) {
    if (res._storedAt && now - res._storedAt > RESULT_TTL_MS) {
      if (res.tmpBase) fsp.rm(res.tmpBase, { recursive: true, force: true }).catch(() => {});
      // Clean persisted PDF via result store
      if (res.pdfPath && resultStore.owns(res.pdfPath)) {
        resultStore.remove(res.pdfPath).catch(() => {});
      }
      deleteJobResult(id);
    }
  }
}, 60_000);
resultCleanupInterval.unref();

// Result store sweeper: catch orphaned PDFs (e.g. from unclean shutdowns)
const RESULTS_MAX_AGE_MS = 45 * 60 * 1000; // 45 minutes
const resultsCleanupInterval = setInterval(async () => {
  const swept = await resultStore.sweep(RESULTS_MAX_AGE_MS);
  if (swept > 0) log.info({ module: 'result-sweep', swept, storeType: resultStore.type }, 'Cleaned orphaned result PDFs');
}, 5 * 60 * 1000);
resultsCleanupInterval.unref();

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
    if (swept > 0) console.log(`[disk-sweep] Removed ${swept} orphaned temp dir(s)`);
  } catch (err) {
    console.error('[disk-sweep] Error:', err.message);
  }
}

sweepOrphanedTmpDirs();
const diskSweepInterval = setInterval(sweepOrphanedTmpDirs, ORPHAN_MAX_AGE_MS);
diskSweepInterval.unref();

// ── Asset Directory Sweeper (24h TTL) ──
// Uploaded images stored in /tmp/pp-assets/{UUID}/ — longer-lived than compile temp dirs.
const ASSET_DIR = path.join(os.tmpdir(), 'pp-assets');
const ASSET_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

async function sweepExpiredAssets() {
  try {
    if (!fs.existsSync(ASSET_DIR)) return;
    const entries = await fsp.readdir(ASSET_DIR);
    const now = Date.now();
    let swept = 0;
    for (const entry of entries) {
      const fullPath = path.join(ASSET_DIR, entry);
      try {
        const stats = await fsp.stat(fullPath);
        if (now - stats.mtimeMs > ASSET_MAX_AGE_MS) {
          await fsp.rm(fullPath, { recursive: true, force: true });
          swept++;
        }
      } catch { /* already cleaned */ }
    }
    if (swept > 0) log.info({ module: 'asset-sweep', swept }, 'Cleaned expired image assets');
  } catch { /* best-effort */ }
}

setTimeout(sweepExpiredAssets, 60_000); // first sweep 1 min after boot
const assetSweepInterval = setInterval(sweepExpiredAssets, 60 * 60 * 1000); // hourly
assetSweepInterval.unref();

// ── Debug Artifact Sweeper (1h TTL) ──
// Debug artifacts (texSource, latexLog, headerTex) are written to /tmp/pp-debug/{jobId}.json
// by the compile worker to keep Redis payloads small. Expire after 1 hour.
const DEBUG_DIR = path.join(os.tmpdir(), 'pp-debug');
const DEBUG_MAX_AGE_MS = 60 * 60 * 1000; // 1 hour

async function sweepExpiredDebugArtifacts() {
  try {
    if (!fs.existsSync(DEBUG_DIR)) return;
    const entries = await fsp.readdir(DEBUG_DIR);
    const now = Date.now();
    let swept = 0;
    for (const entry of entries) {
      const fullPath = path.join(DEBUG_DIR, entry);
      try {
        const stats = await fsp.stat(fullPath);
        if (now - stats.mtimeMs > DEBUG_MAX_AGE_MS) {
          await fsp.unlink(fullPath);
          swept++;
        }
      } catch { /* already cleaned */ }
    }
    if (swept > 0) log.info({ module: 'debug-sweep', swept }, 'Cleaned expired debug artifacts');
  } catch { /* best-effort */ }
}

setTimeout(sweepExpiredDebugArtifacts, 90_000);
const debugSweepInterval = setInterval(sweepExpiredDebugArtifacts, 30 * 60 * 1000); // every 30 min
debugSweepInterval.unref();

// ── Disk Space Sentinel ──
// Monitors /tmp usage and triggers emergency sweep if above threshold
const DISK_SPACE_CHECK_INTERVAL_MS = 5 * 60 * 1000; // Check every 5 minutes
const DISK_SPACE_EMERGENCY_THRESHOLD = 0.80; // 80% usage triggers emergency sweep

async function checkDiskSpace() {
  try {
    const tmpDir = os.tmpdir();
    const { exec } = require('child_process');
    const dfOutput = await new Promise((resolve, reject) => {
      exec(`df -P "${tmpDir}" | tail -1`, { timeout: 5000 }, (err, stdout) => {
        if (err) return reject(err);
        resolve(stdout.trim());
      });
    });
    // Parse df output: Filesystem 1024-blocks Used Available Capacity Mounted-on
    const parts = dfOutput.split(/\s+/);
    if (parts.length >= 5) {
      const usagePercent = parseInt(parts[4]) / 100;
      if (usagePercent >= DISK_SPACE_EMERGENCY_THRESHOLD) {
        console.warn(`[disk-sentinel] /tmp usage at ${(usagePercent * 100).toFixed(0)}% — triggering emergency sweep`);
        // Emergency: sweep ALL temp dirs regardless of age
        const entries = await fsp.readdir(tmpDir);
        let swept = 0;
        for (const entry of entries) {
          if (!PP_TMP_PREFIXES.some(p => entry.startsWith(p))) continue;
          const fullPath = path.join(tmpDir, entry);
          try {
            await fsp.rm(fullPath, { recursive: true, force: true });
            swept++;
          } catch { /* best-effort */ }
        }
        // Also clear expired in-memory results to free file handles
        // Use 10 min TTL in emergency (vs normal 30 min) — still gives users time to download
        const EMERGENCY_RESULT_TTL_MS = 10 * 60 * 1000;
        const now = Date.now();
        for (const [id, res] of jobResults) {
          if (res._storedAt && now - res._storedAt > EMERGENCY_RESULT_TTL_MS) {
            if (res.tmpBase) fsp.rm(res.tmpBase, { recursive: true, force: true }).catch(() => {});
            if (res.pdfPath && resultStore.owns(res.pdfPath)) resultStore.remove(res.pdfPath).catch(() => {});
            deleteJobResult(id);
          }
        }
        // Also sweep expired assets in emergency
        try {
          const assetDir = path.join(tmpDir, 'pp-assets');
          if (fs.existsSync(assetDir)) {
            const assetEntries = await fsp.readdir(assetDir);
            for (const entry of assetEntries) {
              const fullPath = path.join(assetDir, entry);
              try {
                const stats = await fsp.stat(fullPath);
                if (now - stats.mtimeMs > 60 * 60 * 1000) { // 1 hour in emergency (not 24h)
                  await fsp.rm(fullPath, { recursive: true, force: true });
                  swept++;
                }
              } catch { /* best-effort */ }
            }
          }
        } catch { /* best-effort */ }
        if (swept > 0) console.warn(`[disk-sentinel] Emergency swept ${swept} temp dir(s)`);
      }
    }
  } catch (err) {
    // Non-fatal — disk check is best-effort
    log.debug({ err: err.message }, 'Disk space check failed (non-fatal)');
  }
}

const diskSpaceSentinelInterval = setInterval(checkDiskSpace, DISK_SPACE_CHECK_INTERVAL_MS);
diskSpaceSentinelInterval.unref();
// Initial check after 30 seconds
setTimeout(checkDiskSpace, 30_000);

// ── Manuscript Expiry Sweeper ──
const MANUSCRIPT_MAX_AGE_MS = 24 * 60 * 60 * 1000;

async function sweepExpiredManuscripts() {
  const pbUrl = (process.env.POCKETBASE_URL || '').replace(/\/+$/, '');
  if (!pbUrl || !process.env.POCKETBASE_ADMIN_EMAIL || !process.env.POCKETBASE_ADMIN_PASSWORD) return;

  try {
    let token = null;
    try {
      const resp = await fetch(`${pbUrl}/api/collections/_superusers/auth-with-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(5000),
        body: JSON.stringify({
          identity: process.env.POCKETBASE_ADMIN_EMAIL,
          password: process.env.POCKETBASE_ADMIN_PASSWORD,
        }),
      });
      if (resp.ok) { const data = await resp.json(); token = data.token; }
    } catch { /* PocketBase not reachable */ }
    if (!token) return;

    const cutoff = new Date(Date.now() - MANUSCRIPT_MAX_AGE_MS).toISOString().replace('T', ' ');
    const listResp = await fetch(
      `${pbUrl}/api/collections/manuscripts/records?filter=${encodeURIComponent(`updated < "${cutoff}"`)}&fields=id&perPage=200`,
      { headers: { Authorization: token }, signal: AbortSignal.timeout(5000) }
    );
    if (!listResp.ok) return;

    const { items } = await listResp.json();
    let purged = 0;
    for (const item of items || []) {
      try {
        const del = await fetch(`${pbUrl}/api/collections/manuscripts/records/${item.id}`, {
          method: 'DELETE',
          headers: { Authorization: token },
          signal: AbortSignal.timeout(5000),
        });
        if (del.ok) purged++;
      } catch { /* best-effort */ }
    }
    if (purged > 0) console.log(`[manuscript-sweep] Purged ${purged} expired manuscript(s)`);
  } catch (err) {
    console.error('[manuscript-sweep] Error:', err.message);
  }
}

setTimeout(sweepExpiredManuscripts, 30_000);
const manuscriptSweepInterval = setInterval(sweepExpiredManuscripts, 6 * 60 * 60 * 1000);
manuscriptSweepInterval.unref();

// ── BullMQ Setup ──
// Set WORKER_ONLY=true to disable the embedded compile worker.
// In that mode, compile jobs are enqueued but processed by standalone worker.js processes.
// This enables horizontal scaling: multiple API servers + dedicated worker fleet.
const WORKER_ONLY = process.env.WORKER_ONLY === 'true';

if (redis) {
  try {
    const { Queue, Worker, QueueEvents } = require('bullmq');

    compileQueue = new Queue('pp-compile', { connection: createRedisConnection({ forBullMQ: true }) });

    if (!WORKER_ONLY) {
      compileWorker = new Worker('pp-compile', async (job) => {
        return processCompileJob(job, DESIGN_TEMPLATES);
      }, {
        connection: createRedisConnection({ forBullMQ: true }),
        concurrency: Number(process.env.COMPILE_CONCURRENCY || 3),
        lockDuration: 60_000,
        stalledInterval: 30_000,
        maxStalledCount: 0,
        removeOnComplete: { count: 200, age: 3600 },       // keep last 200 or 1 hour, whichever is smaller
        removeOnFail: { count: 1000, age: 24 * 3600 },   // keep last 1000 or 24 hours — more forensic retention for failures
      });

      compileWorker.on('completed', async (job, result) => {
        // Persist PDF to results store so it survives temp dir cleanup and restarts
        if (result.success && result.pdfPath) {
          const persistedPath = await persistPdf(job.id, result.pdfPath);
          if (persistedPath) {
            // Clean up the compile temp dir immediately — PDF is safe in results store
            if (result.tmpBase) fsp.rm(result.tmpBase, { recursive: true, force: true }).catch(() => {});
            result.pdfPath = persistedPath;
            delete result.tmpBase;
          }
        }
        // DEFENSIVE: Ensure debug field survives BullMQ JSON serialization round-trip.
        // BullMQ stores returnvalue in Redis via JSON.stringify. If the debug object
        // was lost during deserialization (edge case), reconstruct a placeholder so
        // the status endpoint never returns debug: null for a known failure.
        if (!result.success && !result.debug) {
          log.warn({ module: 'queue', jobId: job.id }, 'debug field missing from worker return value — BullMQ may have dropped it during serialization');
          result.debug = {
            texSource: null,
            latexLog: null,
            headerTex: null,
            filesInDir: [],
            captureError: 'debug object lost during BullMQ completed event — field was undefined after JSON round-trip',
          };
        }
        storeJobResult(job.id, result);

        // Structured compile logging — success and failure
        if (result.success) {
          log.info({
            module: 'queue', jobId: job.id,
            elapsed: result.elapsed || '?',
            template: result.template, pageSize: result.pageSize,
            typographyGrade: result.typographyReport?.grade || null,
            watermarked: result.needsWatermark || false,
          }, 'Job completed');
        } else {
          // Structured failure log — full forensic context for every compile failure.
          // This lets you immediately correlate failures with runtime environment.
          log.error({
            module: 'queue', jobId: job.id,
            errorCode: result.error,
            errorCategory: result.errors?.[0]?.category || 'unknown',
            locale: result.debugMeta?.locale || process.env.LANG,
            pandocVersion: result.debugMeta?.pandocVersion || PANDOC_VERSION,
            workerPid: result.debugMeta?.workerPid || process.pid,
            containerId: result.debugMeta?.containerId || os.hostname(),
            template: result.debugMeta?.template || job.data?.template,
            debugSize: result.debug ? JSON.stringify(result.debug).length : 0,
            hasDebugRef: !!(result.debug?.debugRef),
          }, `Compile failed: ${result.message?.substring(0, 200) || 'unknown'}`);
        }
      });

      compileWorker.on('failed', (job, err) => {
        const failResult = {
          success: false,
          error: 'worker_error',
          message: err.message || 'Compilation failed unexpectedly.',
          debug: { texSource: null, latexLog: null, headerTex: null, filesInDir: [], captureError: `BullMQ failed event: ${err.message}`, stack: err.stack?.substring(0, 2000) || null },
          debugMeta: {
            locale: process.env.LANG || 'C.UTF-8',
            pandocVersion: PANDOC_VERSION,
            lualatexVersion: LUALATEX_VERSION,
            nodeVersion: process.version,
            workerPid: process.pid,
            containerId: os.hostname(),
            timestamp: new Date().toISOString(),
          },
        };
        storeJobResult(job.id, failResult);
        log.error({
          module: 'queue', jobId: job?.id,
          err: err.message, stack: err.stack?.substring(0, 500),
          containerId: os.hostname(),
        }, 'Job failed (BullMQ error)');
      });
    } else {
      log.info({ module: 'queue' }, 'WORKER_ONLY=true — embedded worker disabled, use standalone worker.js');
    }

    compileQueueEvents = new QueueEvents('pp-compile', { connection: createRedisConnection({ forBullMQ: true }) });

    log.info({ module: 'queue', concurrency: WORKER_ONLY ? 'external' : (process.env.COMPILE_CONCURRENCY || 3), workerOnly: WORKER_ONLY }, 'BullMQ initialized');
  } catch (err) {
    log.warn({ module: 'queue', err: err.message }, 'BullMQ setup failed, using sync fallback');
    compileQueue = null;
    compileWorker = null;
  }
}

// ── Locale runtime assertion ──
// Verify the configured locale exists in the OS. A missing locale will cause
// LuaLaTeX's luaotfload to fail with "Unable to read environment locale".
// This catches base image changes that could silently reintroduce the bug.
try {
  const localeList = execSync('locale -a 2>/dev/null', { encoding: 'utf8', timeout: 5000 });
  const configuredLocale = (process.env.LANG || 'C.UTF-8').replace(/\./, '.').toLowerCase();
  const available = localeList.split('\n').map(l => l.trim().toLowerCase());
  // Check both exact match and common alias (C.UTF-8 vs C.utf8)
  const localeFound = available.some(l => l === configuredLocale || l === configuredLocale.replace('.utf-8', '.utf8') || l === configuredLocale.replace('.utf8', '.utf-8'));
  if (localeFound) {
    log.info({ module: 'startup', locale: process.env.LANG || 'C.UTF-8' }, 'Locale verified');
  } else {
    log.fatal({ module: 'startup', locale: process.env.LANG || 'C.UTF-8', available: available.filter(l => l).slice(0, 20) }, 'CONFIGURED LOCALE NOT FOUND — LuaLaTeX will fail. Set LANG to an available locale (e.g. C.UTF-8).');
  }
} catch (err) {
  log.warn({ module: 'startup', err: err.message }, 'Locale check skipped (locale command not available)');
}

// ── Pandoc version detection ──
let PANDOC_VERSION = 'unknown';
let LUALATEX_VERSION = 'unknown';
try {
  const versionOutput = execSync('pandoc --version', { encoding: 'utf8', timeout: 5000 });
  const match = versionOutput.match(/pandoc(?:\.exe)?\s+(\d+)\.(\d+)(?:\.(\d+))?/);
  if (match) {
    PANDOC_VERSION = `${match[1]}.${match[2]}${match[3] ? '.' + match[3] : ''}`;
    log.info({ module: 'startup', pandocVersion: PANDOC_VERSION, pdfEngine: 'lualatex' }, 'Pandoc detected');
  }
} catch {
  log.warn({ module: 'startup' }, 'Could not detect Pandoc version');
}
try {
  const lualatexOutput = execSync('lualatex --version 2>/dev/null | head -1', { encoding: 'utf8', timeout: 5000 });
  const luaMatch = lualatexOutput.match(/Version\s+([^\s(]+)/i) || lualatexOutput.match(/([\d.]+)/);
  if (luaMatch) LUALATEX_VERSION = luaMatch[1];
} catch {
  // non-fatal — version is advisory
}

// ── Allowed origins ──
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:4000',
  process.env.FRONTEND_URL,
].filter(Boolean);

function isAllowedOrigin(origin) {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  // Vercel preview deployments: {project}-{hash}-{scope}.vercel.app
  // Tightened: require 'page-perfect' project name + exactly 9-char hash + team scope (alphanumeric, no dots)
  if (/^https:\/\/page-perfect-[a-z0-9]{9}-[a-z0-9]+\.vercel\.app$/.test(origin)) return true;
  return false;
}

// ── PocketBase Admin Client ──
const POCKETBASE_URL = (process.env.POCKETBASE_URL || '').replace(/\/+$/, '');
const PB_TIMEOUT_MS = Number(process.env.PB_TIMEOUT_MS || 5000);
let pbAdminToken = null;
let pbTokenExpiry = 0;

async function getPbAdminToken() {
  if (pbAdminToken && Date.now() < pbTokenExpiry) return pbAdminToken;
  if (!POCKETBASE_URL || !process.env.POCKETBASE_ADMIN_EMAIL || !process.env.POCKETBASE_ADMIN_PASSWORD) return null;
  try {
    const resp = await fetch(`${POCKETBASE_URL}/api/collections/_superusers/auth-with-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(PB_TIMEOUT_MS),
      body: JSON.stringify({
        identity: process.env.POCKETBASE_ADMIN_EMAIL,
        password: process.env.POCKETBASE_ADMIN_PASSWORD,
      }),
    });
    if (!resp.ok) { log.error({ module: 'pocketbase', status: resp.status }, 'Admin auth failed'); return null; }
    const data = await resp.json();
    pbAdminToken = data.token;
    pbTokenExpiry = Date.now() + 115 * 60 * 1000;
    return pbAdminToken;
  } catch (err) {
    log.error({ module: 'pocketbase', err: err.message }, 'Admin auth error');
    return null;
  }
}

async function pbFetch(pbPath, options = {}) {
  const token = await getPbAdminToken();
  if (!token) return null;
  const resp = await fetch(`${POCKETBASE_URL}${pbPath}`, {
    ...options,
    signal: AbortSignal.timeout(PB_TIMEOUT_MS),
    headers: { 'Content-Type': 'application/json', Authorization: token, ...options.headers },
  });
  return resp;
}

const isPocketBaseConfigured = !!(POCKETBASE_URL && process.env.POCKETBASE_ADMIN_EMAIL);

// ── Tier Verification ──
async function verifyUserTier(req) {
  if (!isPocketBaseConfigured) return { userId: null, tier: 'anonymous', publisherWindowEnd: null };
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return { userId: null, tier: 'anonymous', publisherWindowEnd: null };
  const token = authHeader.slice(7);
  try {
    const authResp = await fetch(`${POCKETBASE_URL}/api/collections/users/auth-refresh`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(PB_TIMEOUT_MS),
    });
    if (authResp && authResp.ok) {
      const authData = await authResp.json();
      const record = authData.record;
      if (record) {
        let effectiveTier = record.tier || 'drafter';
        const publisherWindowEnd = record.publisher_window_end || null;
        if (effectiveTier === 'drafter' && publisherWindowEnd) {
          const windowEnd = new Date(publisherWindowEnd);
          if (windowEnd > new Date()) effectiveTier = 'publisher';
        }
        return { userId: record.id, tier: effectiveTier, publisherWindowEnd };
      }
    }
  } catch (err) {
    log.error({ module: 'auth', err: err.message }, 'Tier verification failed');
  }
  return { userId: null, tier: 'anonymous', publisherWindowEnd: null };
}

const TIER_LEVEL = { anonymous: 0, drafter: 1, publisher: 2, studio: 3 };
function hasTier(userTier, requiredTier) {
  return (TIER_LEVEL[userTier] || 0) >= (TIER_LEVEL[requiredTier] || 0);
}

// ── Stripe Idempotency ──
let stripe;
try {
  if (process.env.STRIPE_SECRET_KEY) stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
} catch { /* stripe not configured */ }

const processedStripeEventsMap = new Map(); // eventId → timestamp
const processedStripeEventsQueue = [];
const MAX_STRIPE_EVENTS = 10000;
const STRIPE_IDEM_TTL = 72 * 60 * 60; // seconds (Redis)
const STRIPE_IDEM_TTL_MS = STRIPE_IDEM_TTL * 1000; // milliseconds (memory)

async function isStripeEventProcessed(eventId) {
  if (redis && redisHealthy) {
    try {
      const wasSet = await redis.set(`pp:stripe:${eventId}`, '1', 'EX', STRIPE_IDEM_TTL, 'NX');
      return wasSet === null;
    } catch (err) {
      log.warn({ module: 'stripe:idem', err: err.message }, 'Redis SETNX failed, falling back to memory');
    }
  }
  // Memory fallback — warn that replays are possible across restarts
  if (!redis || !redisHealthy) {
    log.warn({ module: 'stripe:idem' }, 'Redis unavailable — using in-memory idempotency (not durable across restarts)');
  }
  const now = Date.now();
  // Expire old entries beyond TTL
  while (processedStripeEventsQueue.length > 0) {
    const oldest = processedStripeEventsQueue[0];
    const ts = processedStripeEventsMap.get(oldest);
    if (ts && now - ts > STRIPE_IDEM_TTL_MS) {
      processedStripeEventsQueue.shift();
      processedStripeEventsMap.delete(oldest);
    } else {
      break;
    }
  }
  if (processedStripeEventsMap.has(eventId)) return true;
  processedStripeEventsMap.set(eventId, now);
  processedStripeEventsQueue.push(eventId);
  // Cap at MAX_STRIPE_EVENTS as safety net
  while (processedStripeEventsQueue.length > MAX_STRIPE_EVENTS) {
    const evicted = processedStripeEventsQueue.shift();
    processedStripeEventsMap.delete(evicted);
  }
  return false;
}

// ================================================================
// Design Template Registry
// ================================================================

const DESIGN_TEMPLATES = {
  symphony: { name: 'Symphony', description: 'Van de Graaf Canon, EB Garamond, ornamental openings — the academic monograph perfected.', category: 'Academic', templatePath: path.resolve(__dirname, 'templates/symphony.latex'), mainfont: 'EB Garamond', sansfont: 'Libertinus Sans', monofont: 'DejaVu Sans Mono', gridType: 'academic', characteristics: ['EB Garamond + Libertinus Sans', 'Van de Graaf Canon', 'Ornamental headings', 'Hanging footnotes'] },
  chicago: { name: 'Chicago', description: 'University press monograph — ETbb (Bembo), true footnotes, CMOS running heads.', category: 'Academic', templatePath: path.resolve(__dirname, 'templates/chicago.latex'), typstTemplatePath: path.resolve(__dirname, 'typst-templates/chicago.typ'), mainfont: 'ETbb', sansfont: 'Latin Modern Sans', monofont: 'Latin Modern Mono', gridType: 'academic', characteristics: ['ETbb (Bembo)', '2em paragraph indent', 'True footnotes', 'Centered running heads'] },
  paperback: { name: 'Paperback', description: 'Cinematic page-turner — Alegreya Sans, scene breaks, filmic chapter openings.', category: 'Fiction', templatePath: path.resolve(__dirname, 'templates/paperback.latex'), typstTemplatePath: path.resolve(__dirname, 'typst-templates/paperback.typ'), mainfont: 'Alegreya Sans', sansfont: 'TeX Gyre Heros', monofont: 'DejaVu Sans Mono', gridType: 'trade', characteristics: ['Alegreya Sans', 'Cinematic chapter numbers', 'Scene break ornaments', '1.5em fiction indent'] },
  chronicle: { name: 'Chronicle', description: 'Swiss journalism — TeX Gyre Heros, heavy rules, pull-quote blocks, flush-left ragged-right.', category: 'Editorial', templatePath: path.resolve(__dirname, 'templates/chronicle.latex'), mainfont: 'TeX Gyre Heros', sansfont: null, monofont: 'Fira Mono', gridType: 'editorial', characteristics: ['TeX Gyre Heros', 'Flush left / ragged right', '3pt section rules', 'Pull-quote blockquotes'] },
  exhibit: { name: 'Exhibit', description: 'White Cube gallery — Fira Sans, extreme whitespace, ghost-number chapter openings.', category: 'Trade', templatePath: path.resolve(__dirname, 'templates/exhibit.latex'), mainfont: 'Fira Sans', sansfont: 'TeX Gyre Adventor', monofont: 'Fira Mono', gridType: 'trade', characteristics: ['Fira Sans + TeX Gyre Adventor', '80pt ghost chapter numbers', 'Ragged right', 'Generous whitespace'] },
  matrix: { name: 'Matrix', description: 'Swiss corporate annual report — Fira Sans with lining figures, MidnightBlue accents, booktabs.', category: 'Business', templatePath: path.resolve(__dirname, 'templates/matrix.latex'), mainfont: 'Fira Sans', sansfont: null, monofont: 'Fira Mono', gridType: 'corporate', characteristics: ['Fira Sans (lining figures)', 'Corporate blue palette', 'Executive summary blocks', 'booktabs tables'] },
  avantgarde: { name: 'Avant-Garde', description: 'Deconstructed manifesto — Source Sans 3, 120pt ghost numbers, brutalist blockquotes.', category: 'Creative', templatePath: path.resolve(__dirname, 'templates/avantgarde.latex'), mainfont: 'Source Sans 3', sansfont: 'DejaVu Sans', monofont: 'TeX Gyre Cursor', gridType: 'creative', characteristics: ['Source Sans 3', '120pt ghost chapter numbers', 'Brutalist blockquotes', 'Ragged right'] },
  minimal: { name: 'Minimal', description: 'Radical compatibility — compiles anywhere, zero extra dependencies. Latin Modern on pdflatex.', category: 'Basic', templatePath: path.resolve(__dirname, 'templates/minimal.latex'), typstTemplatePath: path.resolve(__dirname, 'typst-templates/minimal.typ'), mainfont: 'Latin Modern Roman', sansfont: null, monofont: null, gridType: 'basic', characteristics: ['Zero dependencies', 'pdflatex compatible', 'Latin Modern', 'Maximum portability'] },
  international: { name: 'International', description: 'Müller-Brockmann Swiss Standard — one font, no italics, visible structure, modular grid.', category: 'Design', templatePath: path.resolve(__dirname, 'templates/international.latex'), mainfont: 'TeX Gyre Heros', sansfont: 'TeX Gyre Heros', monofont: 'TeX Gyre Cursor', gridType: 'editorial', characteristics: ['TeX Gyre Heros only', 'No italics', 'Flush left / ragged right', 'Rule-separated sections'] },
  cinema: { name: 'Cinema', description: 'Hollywood Standard screenplay — Courier 12pt, strict margins, 1 page = 1 minute rule.', category: 'Screenplay', templatePath: path.resolve(__dirname, 'templates/cinema.latex'), mainfont: 'TeX Gyre Cursor', sansfont: null, monofont: 'TeX Gyre Cursor', gridType: 'basic', characteristics: ['TeX Gyre Cursor (Courier)', 'Industry-standard margins', 'Single-spaced', 'Dialogue blocks'] },
  heirloom: { name: 'Heirloom', description: 'Modern gastronomy cookbook — recipe cards, ingredient blocks, warm saddlebrown palette.', category: 'Cookbook', templatePath: path.resolve(__dirname, 'templates/heirloom.latex'), mainfont: 'Fira Sans', sansfont: 'DejaVu Serif', monofont: 'Fira Mono', gridType: 'trade', characteristics: ['Fira Sans + DejaVu Serif headers', 'Ingredient colorboxes', 'Bold numbered steps', 'Warm earth tones'] },
  operator: { name: 'Operator', description: 'Engineering manual — Fira Sans/Mono, admonition boxes (warning/info/code), structured hierarchy.', category: 'Technical', templatePath: path.resolve(__dirname, 'templates/operator.latex'), mainfont: 'Fira Sans', sansfont: null, monofont: 'Fira Mono', gridType: 'editorial', characteristics: ['Fira Sans + Fira Mono', 'Warning/Info/Code admonition boxes', 'Navy blue headings', 'Technical hierarchy'] },
  verse: { name: 'Verse', description: 'Poetry collection — EB Garamond, centered titles, generous leading, line-based layout.', category: 'Poetry', templatePath: path.resolve(__dirname, 'templates/verse.latex'), mainfont: 'EB Garamond', sansfont: 'Libertinus Sans', monofont: 'DejaVu Sans Mono', gridType: 'creative', characteristics: ['EB Garamond', 'Centered italic titles', 'Generous leading', 'No paragraph indent'] },
  thesis: { name: 'Thesis', description: 'University dissertation — Latin Modern, double-spaced, numbered sections, submission-ready.', category: 'Academic', templatePath: path.resolve(__dirname, 'templates/thesis.latex'), mainfont: 'Latin Modern Roman', sansfont: 'Latin Modern Sans', monofont: 'Latin Modern Mono', gridType: 'thesis', characteristics: ['Latin Modern Roman', 'Double-spaced', 'Numbered sections', 'University standard'] },
  memoir: { name: 'Memoir', description: 'Personal narrative — Libre Baskerville, warm amber accents, decorative scene breaks.', category: 'Fiction', templatePath: path.resolve(__dirname, 'templates/memoir.latex'), mainfont: 'Libre Baskerville', sansfont: 'TeX Gyre Heros', monofont: 'DejaVu Sans Mono', gridType: 'trade', characteristics: ['Libre Baskerville', 'Warm amber accents', 'Decorative scene breaks', 'Intimate headings'] },
};

// ================================================================
// Express App Setup
// ================================================================

const app = express();
const PORT = process.env.PORT || 4000;

app.set('trust proxy', 1);

const gridSystem = new GridSystem();

// ── Security & Middleware ──
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'none'"],
      scriptSrc: ["'none'"],
      styleSrc: ["'none'"],
      imgSrc: ["'none'"],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      baseUri: ["'none'"],
      formAction: ["'self'"],
    },
  },
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => { log.info({ method: req.method, url: req.originalUrl, status: res.statusCode, ms: Date.now() - start }, 'request'); });
  next();
});

app.use(express.json({ limit: '5mb' }));

app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? (origin, callback) => callback(null, isAllowedOrigin(origin))
    : true,
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-PP-Result-Secret'],
  exposedHeaders: ['X-PP-Watermarked', 'X-PP-Credits-Remaining', 'X-PP-Filename', 'X-PP-Format'],
  credentials: true,
  optionsSuccessStatus: 200,
}));

// Rate limiting
let RedisStoreClass;
if (redis) {
  try { RedisStoreClass = require('rate-limit-redis').RedisStore; log.info({ module: 'rate-limit' }, 'Using Redis store'); }
  catch { /* fall back to in-memory */ }
}
function createRedisStore(prefix) {
  if (!RedisStoreClass) return {};
  return { store: new RedisStoreClass({ sendCommand: (...args) => redis.call(...args), prefix }) };
}

const compileLimiter = rateLimit({
  windowMs: 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false,
  ...createRedisStore('rl:compile:'),
  message: { error: 'rate_limited', message: 'Too many compile requests. Please wait a moment and try again.' },
});

const generalLimiter = rateLimit({
  windowMs: 60 * 1000, max: 120, standardHeaders: true, legacyHeaders: false,
  ...createRedisStore('rl:general:'),
});

app.use(generalLimiter);

// ================================================================
// Shared Context — passed to route modules
// ================================================================

const ctx = {
  redis,
  get redisHealthy() { return redisHealthy; },
  compileQueue,
  gridSystem,
  stripe,
  isPocketBaseConfigured,
  pbFetch,
  verifyUserTier,
  hasTier,
  isStripeEventProcessed,
  DESIGN_TEMPLATES,
  compileLimiter,
  storeJobResult,
  getJobResult,
  deleteJobResult,
  storeJobSecret,
  getJobSecret,
  persistPdf,
  resultStore,
  RESULTS_DIR,
  get activeSyncCompiles() { return activeSyncCompiles; },
  set activeSyncCompiles(v) { activeSyncCompiles = v; },
  MAX_SYNC_CONCURRENT,
};

// ================================================================
// Debug Ingest — client-side diagnostic logs (ephemeral, in-memory)
// ================================================================

const DEBUG_SESSION_LOGS = new Map();       // sessionId → [entries]
const DEBUG_MAX_ENTRIES = 200;
const DEBUG_MAX_SESSIONS = 50;
const DEBUG_TTL_MS = 30 * 60 * 1000;       // 30 min

app.post('/api/debug/ingest', (req, res) => {
  const { sessionId, entries } = req.body || {};
  if (!sessionId || !Array.isArray(entries)) return res.status(400).json({ ok: false });

  if (!DEBUG_SESSION_LOGS.has(sessionId)) {
    // Evict oldest if at capacity
    if (DEBUG_SESSION_LOGS.size >= DEBUG_MAX_SESSIONS) {
      const oldest = DEBUG_SESSION_LOGS.keys().next().value;
      DEBUG_SESSION_LOGS.delete(oldest);
    }
    DEBUG_SESSION_LOGS.set(sessionId, { entries: [], createdAt: Date.now() });
  }
  const session = DEBUG_SESSION_LOGS.get(sessionId);
  for (const e of entries.slice(0, 50)) {
    session.entries.push({ t: Date.now(), ...e });
    if (session.entries.length > DEBUG_MAX_ENTRIES) session.entries.shift();
  }
  // Log to server stdout for immediate visibility
  for (const e of entries.slice(0, 10)) {
    log.info({ module: 'debug-ingest', sessionId: sessionId.slice(0, 8), tag: e.tag }, e.msg || JSON.stringify(e.data || {}));
  }
  res.json({ ok: true });
});

app.get('/api/debug/session/:id', (req, res) => {
  const session = DEBUG_SESSION_LOGS.get(req.params.id);
  if (!session) return res.status(404).json({ error: 'not_found' });
  res.json({ sessionId: req.params.id, entries: session.entries });
});

// Sweep expired sessions every 10 min
setInterval(() => {
  const now = Date.now();
  for (const [id, s] of DEBUG_SESSION_LOGS) {
    if (now - s.createdAt > DEBUG_TTL_MS) DEBUG_SESSION_LOGS.delete(id);
  }
}, 10 * 60 * 1000);

// ================================================================
// Mount Route Modules
// ================================================================

// Stripe webhook must be mounted BEFORE json body parser kicks in,
// but our setup applies express.json globally. The stripe route
// module handles its own express.raw() middleware per-route.
app.use(require('./routes/stripe')(ctx));
app.use(require('./routes/health')(ctx));
app.use(require('./routes/publishing')(ctx));
app.use(require('./routes/lulu')(ctx));
app.use(require('./routes/analysis')(ctx));
app.use(require('./routes/compile')(ctx));
app.use(require('./routes/contact')());

// ================================================================
// Global Error Handler
// ================================================================

app.use((err, req, res, _next) => {
  log.error({ module: 'http', err: err.message, stack: err.stack, method: req.method, url: req.originalUrl }, 'Unhandled route error');
  if (res.headersSent) return;
  res.status(500).json({ error: 'internal_error', message: 'An unexpected error occurred. Please try again.' });
});

// ================================================================
// Start Server
// ================================================================

const server = app.listen(PORT, () => {
  log.info({
    module: 'startup',
    port: PORT,
    cors: process.env.NODE_ENV === 'production' ? ALLOWED_ORIGINS.join(', ') : 'permissive (dev)',
    stripe: stripe ? 'configured' : 'not configured',
    lulu: lulu.isConfigured() ? `configured (${lulu.getBaseUrl()})` : 'not configured',
    resend: process.env.RESEND_API_KEY ? 'configured' : 'not configured',
    templates: Object.keys(DESIGN_TEMPLATES).length,
    rateLimit: '20 compiles/min, 120 requests/min',
    resultStore: resultStore.type + (resultStore.type === 's3' ? ` (${resultStore.bucket})` : ` (${resultStore.dir})`),
    queue: compileQueue ? 'BullMQ (concurrency ' + (process.env.COMPILE_CONCURRENCY || 3) + ')' : 'sync fallback',
  }, `Backend listening on http://localhost:${PORT}`);
});

// ================================================================
// Graceful Shutdown
// ================================================================

async function gracefulShutdown(signal) {
  log.info({ module: 'shutdown', signal }, 'Received signal, shutting down gracefully');
  server.close(() => { log.info({ module: 'shutdown' }, 'HTTP server closed'); });

  if (compileWorker) {
    try { await compileWorker.close(); log.info({ module: 'shutdown' }, 'BullMQ worker closed'); }
    catch (err) { log.error({ module: 'shutdown', err: err.message }, 'Worker close error'); }
  }
  if (compileQueueEvents) try { await compileQueueEvents.close(); } catch {}
  if (compileQueue) try { await compileQueue.close(); } catch {}

  if (redis) {
    try { await redis.quit(); log.info({ module: 'shutdown' }, 'Redis disconnected'); }
    catch { try { redis.disconnect(); } catch {} }
  }

  clearInterval(resultCleanupInterval);

  for (const [id, res] of jobResults) {
    if (res.tmpBase) try { fs.rmSync(res.tmpBase, { recursive: true, force: true }); } catch {}
  }
  jobResults.clear();

  log.info({ module: 'shutdown' }, 'Cleanup complete, exiting');
  process.exit(0);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// ================================================================
// Crash Handlers
// ================================================================

process.on('uncaughtException', (err) => {
  log.fatal({ module: 'crash', err: err.message, stack: err.stack }, 'Uncaught exception — exiting');
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  const msg = reason instanceof Error ? reason.message : String(reason);
  const stack = reason instanceof Error ? reason.stack : undefined;
  log.fatal({ module: 'crash', err: msg, stack }, 'Unhandled rejection — exiting');
  process.exit(1);
});
