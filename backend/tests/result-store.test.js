const fs = require('fs');
const fsp = require('fs').promises;
const os = require('os');
const path = require('path');
const { LocalResultStore } = require('../result-store');

describe('LocalResultStore', () => {
  let store;
  let tmpSrcDir;

  beforeAll(async () => {
    store = new LocalResultStore();
    tmpSrcDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'rs-test-'));
  });

  afterAll(async () => {
    try { await fsp.rm(tmpSrcDir, { recursive: true, force: true }); } catch {}
  });

  test('type is local', () => {
    expect(store.type).toBe('local');
  });

  test('creates results directory', () => {
    expect(fs.existsSync(store.dir)).toBe(true);
  });

  test('persists a PDF file', async () => {
    const srcPath = path.join(tmpSrcDir, 'test.pdf');
    await fsp.writeFile(srcPath, 'fake pdf content');

    const destPath = await store.persist('test-job-1', srcPath);
    expect(destPath).toBeTruthy();
    expect(destPath).toContain('test-job-1.pdf');
    expect(fs.existsSync(destPath)).toBe(true);

    // Clean up
    await store.remove(destPath);
  });

  test('persists an EPUB file', async () => {
    const srcPath = path.join(tmpSrcDir, 'test.epub');
    await fsp.writeFile(srcPath, 'fake epub content');

    const destPath = await store.persist('test-job-epub', srcPath);
    expect(destPath).toContain('.epub');
    expect(fs.existsSync(destPath)).toBe(true);

    await store.remove(destPath);
  });

  test('exists returns true for existing file', async () => {
    const srcPath = path.join(tmpSrcDir, 'exist.pdf');
    await fsp.writeFile(srcPath, 'content');
    const destPath = await store.persist('test-exists', srcPath);

    expect(await store.exists(destPath)).toBe(true);
    await store.remove(destPath);
  });

  test('exists returns false for missing file', async () => {
    expect(await store.exists('/tmp/nonexistent-file.pdf')).toBe(false);
  });

  test('createReadStream works', async () => {
    const srcPath = path.join(tmpSrcDir, 'stream.pdf');
    const content = 'streamable content';
    await fsp.writeFile(srcPath, content);
    const destPath = await store.persist('test-stream', srcPath);

    const stream = store.createReadStream(destPath);
    const chunks = [];
    await new Promise((resolve, reject) => {
      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('end', resolve);
      stream.on('error', reject);
    });
    expect(Buffer.concat(chunks).toString()).toBe(content);

    await store.remove(destPath);
  });

  test('remove deletes file', async () => {
    const srcPath = path.join(tmpSrcDir, 'remove.pdf');
    await fsp.writeFile(srcPath, 'to be removed');
    const destPath = await store.persist('test-remove', srcPath);

    expect(fs.existsSync(destPath)).toBe(true);
    await store.remove(destPath);
    expect(fs.existsSync(destPath)).toBe(false);
  });

  test('owns recognizes own paths', () => {
    expect(store.owns(path.join(store.dir, 'test.pdf'))).toBe(true);
    expect(store.owns('/some/other/path.pdf')).toBe(false);
    expect(store.owns('s3://bucket/key')).toBe(false);
    expect(store.owns(null)).toBe(false);
  });

  test('sweep removes old files', async () => {
    // Create a file and set its mtime to 2 hours ago
    const srcPath = path.join(tmpSrcDir, 'old.pdf');
    await fsp.writeFile(srcPath, 'old content');
    const destPath = await store.persist('test-sweep-old', srcPath);

    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    await fsp.utimes(destPath, twoHoursAgo, twoHoursAgo);

    const swept = await store.sweep(60 * 60 * 1000); // 1 hour threshold
    expect(swept).toBeGreaterThanOrEqual(1);
    expect(fs.existsSync(destPath)).toBe(false);
  });

  test('persist returns null on error', async () => {
    const result = await store.persist('test-error', '/nonexistent/path/file.pdf');
    expect(result).toBeNull();
  });
});
