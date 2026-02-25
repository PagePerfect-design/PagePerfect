const { manuscriptFingerprint, checkExportEntitlement, sweepMemoryEntitlements } = require('../entitlements');

describe('Entitlements', () => {
  describe('manuscriptFingerprint', () => {
    test('produces consistent hash for same input', () => {
      const fp1 = manuscriptFingerprint('My Book', 'Chapter 1 content here');
      const fp2 = manuscriptFingerprint('My Book', 'Chapter 1 content here');
      expect(fp1).toBe(fp2);
      expect(fp1).toHaveLength(16);
    });

    test('produces different hash for different titles', () => {
      const fp1 = manuscriptFingerprint('My Book', 'Same content');
      const fp2 = manuscriptFingerprint('Different Book', 'Same content');
      expect(fp1).not.toBe(fp2);
    });

    test('produces different hash for significantly different content', () => {
      const fp1 = manuscriptFingerprint('Title', 'Chapter 1: The beginning of everything');
      const fp2 = manuscriptFingerprint('Title', 'Appendix A: Technical specifications');
      expect(fp1).not.toBe(fp2);
    });

    test('allows minor edits (same first 2000 chars)', () => {
      const base = 'A'.repeat(2000);
      const fp1 = manuscriptFingerprint('Title', base + ' original ending');
      const fp2 = manuscriptFingerprint('Title', base + ' edited ending');
      expect(fp1).toBe(fp2);
    });

    test('handles empty/null inputs', () => {
      expect(manuscriptFingerprint(null, null)).toHaveLength(16);
      expect(manuscriptFingerprint('', '')).toHaveLength(16);
      expect(manuscriptFingerprint(undefined, undefined)).toHaveLength(16);
    });

    test('normalizes title case', () => {
      const fp1 = manuscriptFingerprint('MY BOOK', 'content');
      const fp2 = manuscriptFingerprint('my book', 'content');
      expect(fp1).toBe(fp2);
    });
  });

  describe('checkExportEntitlement (memory fallback)', () => {
    const futureDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

    test('allows first export and stamps fingerprint', async () => {
      const result = await checkExportEntitlement({
        userId: 'test-user-1',
        publisherWindowEnd: futureDate,
        title: 'Unique Book A',
        content: 'Some unique content for book A',
        redis: null,
        redisHealthy: false,
      });
      expect(result.allowed).toBe(true);
      expect(result.fingerprint).toHaveLength(16);
    });

    test('allows re-export of same manuscript', async () => {
      const result = await checkExportEntitlement({
        userId: 'test-user-1',
        publisherWindowEnd: futureDate,
        title: 'Unique Book A',
        content: 'Some unique content for book A',
        redis: null,
        redisHealthy: false,
      });
      expect(result.allowed).toBe(true);
    });

    test('blocks export of different manuscript on same window', async () => {
      const result = await checkExportEntitlement({
        userId: 'test-user-1',
        publisherWindowEnd: futureDate,
        title: 'Completely Different Book',
        content: 'Totally different content',
        redis: null,
        redisHealthy: false,
      });
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('different manuscript');
    });

    test('rejects expired window', async () => {
      const pastDate = new Date(Date.now() - 1000).toISOString();
      const result = await checkExportEntitlement({
        userId: 'test-user-2',
        publisherWindowEnd: pastDate,
        title: 'Book',
        content: 'Content',
        redis: null,
        redisHealthy: false,
      });
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('expired');
    });

    test('rejects missing window', async () => {
      const result = await checkExportEntitlement({
        userId: 'test-user-3',
        publisherWindowEnd: null,
        title: 'Book',
        content: 'Content',
        redis: null,
        redisHealthy: false,
      });
      expect(result.allowed).toBe(false);
    });

    test('different users have independent entitlements', async () => {
      const result = await checkExportEntitlement({
        userId: 'test-user-4',
        publisherWindowEnd: futureDate,
        title: 'Completely Different Book',
        content: 'Totally different content',
        redis: null,
        redisHealthy: false,
      });
      expect(result.allowed).toBe(true);
    });
  });

  describe('sweepMemoryEntitlements', () => {
    test('does not throw', () => {
      expect(() => sweepMemoryEntitlements()).not.toThrow();
    });
  });
});
