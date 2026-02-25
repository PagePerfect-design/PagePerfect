/**
 * Result Store — Pluggable backend for compiled PDF storage.
 *
 * Supports two backends:
 *   - 'local' (default): /tmp/ppresults on local disk. Works for single-server deployments.
 *   - 's3': S3-compatible object storage (AWS S3, DigitalOcean Spaces, MinIO).
 *           Works for multi-replica deployments — all replicas share the same bucket.
 *
 * Environment variables:
 *   RESULT_STORE_TYPE  — 'local' | 's3'  (default: 'local')
 *   RESULT_STORE_S3_BUCKET — S3 bucket name
 *   RESULT_STORE_S3_REGION — AWS region (default: 'us-east-1')
 *   RESULT_STORE_S3_ENDPOINT — Custom endpoint for S3-compatible services (e.g. DigitalOcean Spaces)
 *   RESULT_STORE_S3_PREFIX — Key prefix inside the bucket (default: 'ppresults/')
 *   AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY — Standard AWS credentials (or use IAM role)
 */

const fs = require('fs');
const fsp = require('fs').promises;
const os = require('os');
const path = require('path');
const log = require('./logger');

// ── Local Backend ──

class LocalResultStore {
  constructor() {
    this.dir = path.join(os.tmpdir(), 'ppresults');
    if (!fs.existsSync(this.dir)) fs.mkdirSync(this.dir, { recursive: true });
    this.type = 'local';
  }

  /** Copy a compiled PDF from a temp dir into the results directory. */
  async persist(jobId, srcPath) {
    try {
      const ext = path.extname(srcPath) || '.pdf';
      const destPath = path.join(this.dir, `${jobId}${ext}`);
      await fsp.copyFile(srcPath, destPath);
      return destPath;
    } catch (err) {
      log.error({ module: 'result-store:local', jobId, err: err.message }, 'Failed to persist');
      return null;
    }
  }

  /** Check if a result file exists. */
  async exists(filePath) {
    try {
      await fsp.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /** Create a readable stream for the result file. */
  createReadStream(filePath) {
    return fs.createReadStream(filePath);
  }

  /** Delete a result file. */
  async remove(filePath) {
    try {
      await fsp.unlink(filePath);
    } catch { /* already gone */ }
  }

  /** Sweep files older than maxAgeMs. Returns count of swept files. */
  async sweep(maxAgeMs) {
    try {
      const entries = await fsp.readdir(this.dir);
      const now = Date.now();
      let swept = 0;
      for (const entry of entries) {
        const fullPath = path.join(this.dir, entry);
        try {
          const stats = await fsp.stat(fullPath);
          if (now - stats.mtimeMs > maxAgeMs) {
            await fsp.unlink(fullPath);
            swept++;
          }
        } catch { /* already cleaned */ }
      }
      return swept;
    } catch { return 0; }
  }

  /** Check if a file path belongs to this store. */
  owns(filePath) {
    return typeof filePath === 'string' && filePath.startsWith(this.dir);
  }
}

// ── S3 Backend ──

class S3ResultStore {
  constructor() {
    this.type = 's3';
    this.bucket = process.env.RESULT_STORE_S3_BUCKET;
    this.region = process.env.RESULT_STORE_S3_REGION || 'us-east-1';
    this.prefix = process.env.RESULT_STORE_S3_PREFIX || 'ppresults/';
    this.endpoint = process.env.RESULT_STORE_S3_ENDPOINT || undefined;
    this._client = null;

    if (!this.bucket) {
      throw new Error('RESULT_STORE_S3_BUCKET is required when RESULT_STORE_TYPE=s3');
    }
  }

  _getClient() {
    if (this._client) return this._client;
    try {
      const { S3Client } = require('@aws-sdk/client-s3');
      this._client = new S3Client({
        region: this.region,
        ...(this.endpoint ? { endpoint: this.endpoint, forcePathStyle: true } : {}),
      });
      return this._client;
    } catch (err) {
      throw new Error(
        'S3 result store requires @aws-sdk/client-s3. Install it: npm install @aws-sdk/client-s3\n' +
        err.message
      );
    }
  }

  _key(jobId, ext) {
    return `${this.prefix}${jobId}${ext || '.pdf'}`;
  }

  async persist(jobId, srcPath) {
    try {
      const { PutObjectCommand } = require('@aws-sdk/client-s3');
      const ext = path.extname(srcPath) || '.pdf';
      const key = this._key(jobId, ext);
      const body = await fsp.readFile(srcPath);
      const contentType = ext === '.epub' ? 'application/epub+zip' : 'application/pdf';

      await this._getClient().send(new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      }));

      // Return an S3 reference path (s3://<bucket>/<key>)
      return `s3://${this.bucket}/${key}`;
    } catch (err) {
      log.error({ module: 'result-store:s3', jobId, err: err.message }, 'Failed to persist');
      return null;
    }
  }

  async exists(filePath) {
    try {
      const { HeadObjectCommand } = require('@aws-sdk/client-s3');
      const key = this._pathToKey(filePath);
      await this._getClient().send(new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }));
      return true;
    } catch {
      return false;
    }
  }

  createReadStream(filePath) {
    const { GetObjectCommand } = require('@aws-sdk/client-s3');
    const key = this._pathToKey(filePath);
    const { Readable } = require('stream');

    // Return a passthrough that we'll pipe the S3 response into
    const passthrough = new (require('stream').PassThrough)();

    this._getClient().send(new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    })).then(response => {
      if (response.Body && typeof response.Body.pipe === 'function') {
        response.Body.pipe(passthrough);
      } else if (response.Body) {
        // Web stream → Node stream
        Readable.fromWeb(response.Body).pipe(passthrough);
      } else {
        passthrough.destroy(new Error('Empty S3 response'));
      }
    }).catch(err => {
      passthrough.destroy(err);
    });

    return passthrough;
  }

  async remove(filePath) {
    try {
      const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
      const key = this._pathToKey(filePath);
      await this._getClient().send(new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }));
    } catch { /* best-effort */ }
  }

  async sweep(maxAgeMs) {
    try {
      const { ListObjectsV2Command, DeleteObjectCommand } = require('@aws-sdk/client-s3');
      const cutoff = new Date(Date.now() - maxAgeMs);
      let swept = 0;

      let continuationToken;
      do {
        const response = await this._getClient().send(new ListObjectsV2Command({
          Bucket: this.bucket,
          Prefix: this.prefix,
          ContinuationToken: continuationToken,
        }));

        for (const obj of response.Contents || []) {
          if (obj.LastModified && obj.LastModified < cutoff) {
            await this._getClient().send(new DeleteObjectCommand({
              Bucket: this.bucket,
              Key: obj.Key,
            }));
            swept++;
          }
        }

        continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
      } while (continuationToken);

      return swept;
    } catch { return 0; }
  }

  owns(filePath) {
    return typeof filePath === 'string' && filePath.startsWith('s3://');
  }

  _pathToKey(filePath) {
    if (filePath.startsWith('s3://')) {
      // s3://<bucket>/<key> → <key>
      const withoutProtocol = filePath.slice(5);
      const slashIdx = withoutProtocol.indexOf('/');
      return slashIdx >= 0 ? withoutProtocol.slice(slashIdx + 1) : withoutProtocol;
    }
    return filePath;
  }
}

// ── Factory ──

function createResultStore() {
  const storeType = (process.env.RESULT_STORE_TYPE || 'local').toLowerCase();

  if (storeType === 's3') {
    try {
      const store = new S3ResultStore();
      log.info({ module: 'result-store', type: 's3', bucket: store.bucket, prefix: store.prefix }, 'Using S3 result store');
      return store;
    } catch (err) {
      log.error({ module: 'result-store', err: err.message }, 'S3 store init failed, falling back to local');
      return new LocalResultStore();
    }
  }

  const store = new LocalResultStore();
  log.info({ module: 'result-store', type: 'local', dir: store.dir }, 'Using local result store');
  return store;
}

module.exports = { createResultStore, LocalResultStore, S3ResultStore };
