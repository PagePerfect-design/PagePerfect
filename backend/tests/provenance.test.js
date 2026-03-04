const {
  generateBuildMetadata,
  createExportSnapshot,
  generateMetadataPreamble,
  compareSnapshots,
} = require('../provenance');

// ════════════════════════════════════════════════════════════════════
// Build Metadata Generation
// ════════════════════════════════════════════════════════════════════

describe('generateBuildMetadata', () => {
  const baseOpts = {
    manuscriptText: '# Chapter 1\n\nHello world.',
    template: 'paperback',
    pageSize: 'sixByNine',
    marginPreset: 'normal',
    safeMode: true,
    compileMode: 'fast',
    title: 'Test Book',
  };

  it('returns a buildId starting with pp-', () => {
    const meta = generateBuildMetadata(baseOpts);
    expect(meta.buildId).toMatch(/^pp-/);
  });

  it('generates a 12-char content hash', () => {
    const meta = generateBuildMetadata(baseOpts);
    expect(meta.contentHash).toHaveLength(12);
    expect(meta.contentHash).toMatch(/^[a-f0-9]+$/);
  });

  it('generates an 8-char settings hash', () => {
    const meta = generateBuildMetadata(baseOpts);
    expect(meta.settingsHash).toHaveLength(8);
    expect(meta.settingsHash).toMatch(/^[a-f0-9]+$/);
  });

  it('counts words correctly', () => {
    const meta = generateBuildMetadata(baseOpts);
    expect(meta.wordCount).toBe(5); // "#", "Chapter", "1", "Hello", "world."
  });

  it('counts characters correctly', () => {
    const meta = generateBuildMetadata(baseOpts);
    expect(meta.characterCount).toBe(baseOpts.manuscriptText.length);
  });

  it('includes config snapshot', () => {
    const meta = generateBuildMetadata(baseOpts);
    expect(meta.config.template).toBe('paperback');
    expect(meta.config.pageSize).toBe('sixByNine');
    expect(meta.config.marginPreset).toBe('normal');
    expect(meta.config.safeMode).toBe(true);
    expect(meta.config.compileMode).toBe('fast');
    expect(meta.config.title).toBe('Test Book');
  });

  it('includes system info', () => {
    const meta = generateBuildMetadata(baseOpts);
    expect(meta.system.engine).toBe('PagePerfect');
    expect(meta.system.version).toBe('3.1');
    expect(meta.system.pdfEngine).toBe('typst');
    expect(meta.system.processor).toBe('pandoc');
  });

  it('includes userId when provided', () => {
    const meta = generateBuildMetadata({ ...baseOpts, userId: 'user123' });
    expect(meta.userId).toBe('user123');
  });

  it('omits userId when not provided', () => {
    const meta = generateBuildMetadata(baseOpts);
    expect(meta).not.toHaveProperty('userId');
  });

  it('includes timestamp', () => {
    const meta = generateBuildMetadata(baseOpts);
    expect(meta.timestamp).toBeDefined();
    expect(new Date(meta.timestamp).getTime()).not.toBeNaN();
  });

  it('produces different hashes for different content', () => {
    const meta1 = generateBuildMetadata(baseOpts);
    const meta2 = generateBuildMetadata({ ...baseOpts, manuscriptText: 'Different text entirely.' });
    expect(meta1.contentHash).not.toBe(meta2.contentHash);
  });

  it('produces different settings hashes for different settings', () => {
    const meta1 = generateBuildMetadata(baseOpts);
    const meta2 = generateBuildMetadata({ ...baseOpts, template: 'chicago' });
    expect(meta1.settingsHash).not.toBe(meta2.settingsHash);
  });

  it('uses defaults for missing options', () => {
    const meta = generateBuildMetadata({});
    expect(meta.buildId).toMatch(/^pp-/);
    expect(meta.config.template).toBe('symphony');
    expect(meta.config.pageSize).toBe('sixByNine');
    expect(meta.wordCount).toBe(0);
  });
});

// ════════════════════════════════════════════════════════════════════
// Export Snapshot
// ════════════════════════════════════════════════════════════════════

describe('createExportSnapshot', () => {
  it('wraps build metadata with results', () => {
    const meta = generateBuildMetadata({
      manuscriptText: 'Hello world',
      template: 'paperback',
    });
    const snapshot = createExportSnapshot(meta, {
      success: true,
      compileTimeMs: 1234,
      preflightPassed: true,
      lintIssueCount: 2,
    });

    expect(snapshot.snapshotVersion).toBe(1);
    expect(snapshot.buildId).toBe(meta.buildId);
    expect(snapshot.success).toBe(true);
    expect(snapshot.compileTimeMs).toBe(1234);
    expect(snapshot.preflightPassed).toBe(true);
    expect(snapshot.lintIssues).toBe(2);
    expect(snapshot.system).toEqual(meta.system);
  });

  it('defaults to success=true when not specified', () => {
    const meta = generateBuildMetadata({ manuscriptText: 'test' });
    const snapshot = createExportSnapshot(meta);
    expect(snapshot.success).toBe(true);
  });

  it('estimates pages from word count', () => {
    const meta = generateBuildMetadata({ manuscriptText: 'word '.repeat(500) });
    const snapshot = createExportSnapshot(meta);
    expect(snapshot.estimatedPages).toBe(Math.ceil(500 / 250));
  });

  it('uses actual page count when provided', () => {
    const meta = generateBuildMetadata({ manuscriptText: 'text' });
    const snapshot = createExportSnapshot(meta, { estimatedPages: 42 });
    expect(snapshot.estimatedPages).toBe(42);
  });
});

// ════════════════════════════════════════════════════════════════════
// LaTeX Metadata Preamble
// ════════════════════════════════════════════════════════════════════

describe('generateMetadataPreamble', () => {
  it('generates valid LaTeX hypersetup block', () => {
    const meta = generateBuildMetadata({
      manuscriptText: 'test',
      template: 'paperback',
    });
    const preamble = generateMetadataPreamble(meta);
    expect(preamble).toContain('\\hypersetup{');
    expect(preamble).toContain('pdfproducer=');
    expect(preamble).toContain('pdfcreator=');
    expect(preamble).toContain('pdfsubject=');
    expect(preamble).toContain('pdfkeywords=');
  });

  it('includes build ID in pdfcreator', () => {
    const meta = generateBuildMetadata({ manuscriptText: 'test' });
    const preamble = generateMetadataPreamble(meta);
    expect(preamble).toContain(meta.buildId.replace(/[\\{}]/g, ''));
  });

  it('strips LaTeX special characters from values', () => {
    const meta = generateBuildMetadata({
      manuscriptText: 'test',
      title: 'Book {with} \\special chars',
    });
    const preamble = generateMetadataPreamble(meta);
    expect(preamble).not.toContain('{with}');
    expect(preamble).not.toContain('\\special');
  });
});

// ════════════════════════════════════════════════════════════════════
// Snapshot Comparison
// ════════════════════════════════════════════════════════════════════

describe('compareSnapshots', () => {
  it('detects no changes for identical snapshots', () => {
    const meta = generateBuildMetadata({ manuscriptText: 'hello' });
    const snapshot = createExportSnapshot(meta);
    const result = compareSnapshots(snapshot, snapshot);
    expect(result.changed).toBe(false);
    expect(result.changeCount).toBe(0);
  });

  it('detects content changes', () => {
    const meta1 = generateBuildMetadata({ manuscriptText: 'hello' });
    const meta2 = generateBuildMetadata({ manuscriptText: 'goodbye' });
    const snap1 = createExportSnapshot(meta1);
    const snap2 = createExportSnapshot(meta2);
    const result = compareSnapshots(snap1, snap2);
    expect(result.changed).toBe(true);
    expect(result.details.some(d => d.field === 'content')).toBe(true);
  });

  it('detects settings changes', () => {
    const meta1 = generateBuildMetadata({ manuscriptText: 'same', template: 'paperback' });
    const meta2 = generateBuildMetadata({ manuscriptText: 'same', template: 'chicago' });
    const snap1 = createExportSnapshot(meta1);
    const snap2 = createExportSnapshot(meta2);
    const result = compareSnapshots(snap1, snap2);
    expect(result.changed).toBe(true);
    expect(result.details.some(d => d.field === 'config.template')).toBe(true);
  });

  it('detects word count changes', () => {
    const meta1 = generateBuildMetadata({ manuscriptText: 'one two' });
    const meta2 = generateBuildMetadata({ manuscriptText: 'one two three four five' });
    const snap1 = createExportSnapshot(meta1);
    const snap2 = createExportSnapshot(meta2);
    const result = compareSnapshots(snap1, snap2);
    expect(result.details.some(d => d.field === 'wordCount')).toBe(true);
  });

  it('calculates time between snapshots', () => {
    const meta1 = generateBuildMetadata({ manuscriptText: 'test' });
    const snap1 = createExportSnapshot(meta1);
    const snap2 = { ...snap1, timestamp: new Date(Date.now() + 60000).toISOString() };
    const result = compareSnapshots(snap1, snap2);
    expect(result.timeBetween).toBeGreaterThan(0);
  });
});
