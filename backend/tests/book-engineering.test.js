const {
  ENGINEERING_POLICIES,
  lintManuscript,
  analyzeCompileLog,
  generateEngineeringPreamble,
} = require('../book-engineering');

// ================================================================
// Engineering Policies
// ================================================================

describe('ENGINEERING_POLICIES', () => {
  const categories = ['academic', 'trade', 'editorial', 'corporate', 'creative', 'basic'];

  it('defines policies for all 6 categories', () => {
    for (const cat of categories) {
      expect(ENGINEERING_POLICIES).toHaveProperty(cat);
    }
  });

  it('every policy has widow/club/hyphen penalties', () => {
    for (const cat of categories) {
      const p = ENGINEERING_POLICIES[cat];
      expect(typeof p.widowPenalty).toBe('number');
      expect(typeof p.clubPenalty).toBe('number');
      expect(typeof p.hyphenPenalty).toBe('number');
    }
  });

  it('academic has strictest widow/orphan control (10000)', () => {
    expect(ENGINEERING_POLICIES.academic.widowPenalty).toBe(10000);
    expect(ENGINEERING_POLICIES.academic.clubPenalty).toBe(10000);
  });

  it('creative has most relaxed widow/orphan control', () => {
    expect(ENGINEERING_POLICIES.creative.widowPenalty).toBeLessThan(ENGINEERING_POLICIES.academic.widowPenalty);
  });

  it('editorial has raggedRight for Swiss style', () => {
    expect(ENGINEERING_POLICIES.editorial.raggedRight).toBe(true);
  });

  it('basic disables microtype for pdflatex compatibility', () => {
    expect(ENGINEERING_POLICIES.basic.microtype).toBe(false);
  });
});

// ================================================================
// lintManuscript
// ================================================================

describe('lintManuscript', () => {
  it('returns empty issues for clean text', () => {
    const md = '# Chapter 1\n\nThis is a clean paragraph.\n\n# Chapter 2\n\nAnother paragraph.';
    const { issues } = lintManuscript(md);
    expect(issues.filter(i => i.severity === 'warn')).toHaveLength(0);
  });

  it('detects double spaces after punctuation', () => {
    const md = 'Hello world.  This has double spaces.\n\nAnother sentence.  And more.';
    const { issues } = lintManuscript(md);
    const spacingIssues = issues.filter(i => i.type === 'spacing' && i.message.includes('Double'));
    expect(spacingIssues).toHaveLength(1);
    expect(spacingIssues[0].lines.length).toBeGreaterThan(0);
  });

  it('detects straight quotes', () => {
    const md = '"Hello" said "the" fox "to" the "rabbit" "again" "and" "more"';
    const { issues } = lintManuscript(md);
    const quoteIssues = issues.filter(i => i.type === 'typography' && i.message.includes('straight quotes'));
    expect(quoteIssues).toHaveLength(1);
  });

  it('detects bad em-dashes (-- without ---)', () => {
    const md = 'The cat--a black one--ran away.';
    const { issues } = lintManuscript(md);
    const dashIssues = issues.filter(i => i.message.includes('--'));
    expect(dashIssues).toHaveLength(1);
  });

  it('does not flag --- as bad dash', () => {
    const md = 'The cat---a black one---ran away.';
    const { issues } = lintManuscript(md);
    const dashIssues = issues.filter(i => i.message.includes('"--"'));
    expect(dashIssues).toHaveLength(0);
  });

  it('detects very long paragraphs (>800 chars)', () => {
    const longPara = 'Word '.repeat(200); // ~1000 chars
    const md = `# Chapter\n\n${longPara}\n\nShort paragraph.`;
    const { issues } = lintManuscript(md);
    const readabilityIssues = issues.filter(i => i.type === 'readability');
    expect(readabilityIssues).toHaveLength(1);
    expect(readabilityIssues[0].message).toMatch(/very long paragraph/i);
  });

  it('detects heading level skips', () => {
    const md = '# H1\n\n### H3 after H1\n\nText';
    const { issues } = lintManuscript(md);
    const structureIssues = issues.filter(i => i.type === 'structure');
    expect(structureIssues).toHaveLength(1);
    expect(structureIssues[0].message).toMatch(/H1 → H3/);
  });

  it('allows sequential heading levels', () => {
    const md = '# H1\n\n## H2\n\n### H3\n\nText';
    const { issues } = lintManuscript(md);
    const structureIssues = issues.filter(i => i.type === 'structure');
    expect(structureIssues).toHaveLength(0);
  });

  it('detects very long unbreakable words', () => {
    const longWord = 'a'.repeat(55);
    const md = `This paragraph has a ${longWord} in it.`;
    const { issues } = lintManuscript(md);
    const linebreakIssues = issues.filter(i => i.type === 'linebreak' && i.message.includes('long word'));
    expect(linebreakIssues).toHaveLength(1);
  });

  it('skips long words that are URLs', () => {
    const md = 'Visit https://example.com/very/long/path/that/goes/on/and/on/forever for more info.';
    const { issues } = lintManuscript(md);
    const wordIssues = issues.filter(i => i.type === 'linebreak' && i.message.includes('long word'));
    expect(wordIssues).toHaveLength(0);
  });

  it('detects bare long URLs', () => {
    const longUrl = 'https://example.com/' + 'a'.repeat(40);
    const md = `Visit ${longUrl} for more info.`;
    const { issues } = lintManuscript(md);
    const urlIssues = issues.filter(i => i.type === 'linebreak' && i.message.includes('bare URL'));
    expect(urlIssues).toHaveLength(1);
  });

  it('detects triple blank lines', () => {
    const md = 'Text\n\n\n\nMore text';
    const { issues } = lintManuscript(md);
    const spacingIssues = issues.filter(i => i.message.includes('triple'));
    expect(spacingIssues).toHaveLength(1);
  });

  it('detects inconsistent list markers', () => {
    const md = '- item 1\n* item 2\n+ item 3';
    const { issues } = lintManuscript(md);
    const consistencyIssues = issues.filter(i => i.type === 'consistency');
    expect(consistencyIssues).toHaveLength(1);
  });

  it('returns stats with word and line counts', () => {
    const md = '# Hello\n\nWorld is here.\n\nAnother paragraph.';
    const { stats } = lintManuscript(md);
    expect(stats.wordCount).toBeGreaterThan(0);
    expect(stats.lineCount).toBeGreaterThan(0);
    expect(stats.paragraphCount).toBeGreaterThan(0);
    expect(stats).toHaveProperty('totalIssues');
    expect(stats).toHaveProperty('byType');
    expect(stats).toHaveProperty('bySeverity');
  });

  it('categorizes issues by severity', () => {
    const md = 'Hello.  World.\n\n"quote"';
    const { stats } = lintManuscript(md);
    expect(typeof stats.bySeverity.warn).toBe('number');
    expect(typeof stats.bySeverity.info).toBe('number');
  });
});

// ================================================================
// analyzeCompileLog
// ================================================================

describe('analyzeCompileLog', () => {
  it('returns empty arrays for clean output', () => {
    const result = analyzeCompileLog('Output written on document.pdf');
    expect(result.overfullBoxes).toHaveLength(0);
    expect(result.underfullBoxes).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
  });

  it('detects overfull hbox warnings', () => {
    const log = 'Overfull \\hbox (12.5pt too wide) at line 42';
    const result = analyzeCompileLog(log);
    expect(result.overfullBoxes).toHaveLength(1);
    expect(result.overfullBoxes[0].amount).toBe(12.5);
    expect(result.overfullBoxes[0].line).toBe(42);
    expect(result.overfullBoxes[0].severity).toBe('warn'); // >10pt
  });

  it('classifies small overfull as info', () => {
    const log = 'Overfull \\hbox (3.2pt too wide)';
    const result = analyzeCompileLog(log);
    expect(result.overfullBoxes[0].severity).toBe('info');
  });

  it('detects underfull hbox with high badness', () => {
    const log = 'Underfull \\hbox (badness 10000) at line 55';
    const result = analyzeCompileLog(log);
    expect(result.underfullBoxes).toHaveLength(1);
    expect(result.underfullBoxes[0].badness).toBe(10000);
    expect(result.underfullBoxes[0].severity).toBe('warn'); // >8000
  });

  it('ignores underfull hbox with low badness', () => {
    const log = 'Underfull \\hbox (badness 2000) at line 10';
    const result = analyzeCompileLog(log);
    expect(result.underfullBoxes).toHaveLength(0);
  });

  it('detects float overflow warnings', () => {
    const log = 'Too many unprocessed floats';
    const result = analyzeCompileLog(log);
    expect(result.floatIssues).toHaveLength(1);
  });

  it('detects footnote split warnings', () => {
    const log = 'Footnote has been split across pages';
    const result = analyzeCompileLog(log);
    expect(result.footnoteIssues).toHaveLength(1);
  });

  it('handles multiple warnings in one log', () => {
    const log = [
      'Overfull \\hbox (5pt too wide) at line 10',
      'Overfull \\hbox (15pt too wide) at line 20',
      'Underfull \\hbox (badness 9000) at line 30',
      'Too many unprocessed floats',
    ].join('\n');
    const result = analyzeCompileLog(log);
    expect(result.overfullBoxes).toHaveLength(2);
    expect(result.underfullBoxes).toHaveLength(1);
    expect(result.floatIssues).toHaveLength(1);
  });
});

// ================================================================
// generateEngineeringPreamble
// ================================================================

describe('generateEngineeringPreamble', () => {
  it('includes comment header', () => {
    const preamble = generateEngineeringPreamble('academic');
    expect(preamble).toMatch(/% ── Book Engineering System ──/);
  });

  it('includes widow and orphan penalties', () => {
    const preamble = generateEngineeringPreamble('academic');
    expect(preamble).toContain('\\widowpenalty=10000');
    expect(preamble).toContain('\\clubpenalty=10000');
  });

  it('includes hyphen penalty and tolerance', () => {
    const preamble = generateEngineeringPreamble('trade');
    expect(preamble).toContain('\\hyphenpenalty=100');
    expect(preamble).toContain('\\tolerance=300');
  });

  it('uses raggedbottom for trade templates', () => {
    const preamble = generateEngineeringPreamble('trade');
    expect(preamble).toContain('\\raggedbottom');
  });

  it('uses flushbottom for academic templates', () => {
    const preamble = generateEngineeringPreamble('academic');
    expect(preamble).toContain('\\flushbottom');
  });

  it('includes URL breaking commands', () => {
    const preamble = generateEngineeringPreamble('academic');
    expect(preamble).toContain('\\UrlBreaks');
    expect(preamble).toContain('\\makeatletter');
    expect(preamble).toContain('\\makeatother');
  });

  it('falls back to academic for unknown category', () => {
    const preamble = generateEngineeringPreamble('unknown');
    expect(preamble).toContain('\\widowpenalty=10000');
  });

  it('applies overrides', () => {
    const preamble = generateEngineeringPreamble('academic', { widowPenalty: 5000 });
    expect(preamble).toContain('\\widowpenalty=5000');
    expect(preamble).toContain('\\clubpenalty=10000'); // not overridden
  });

  it('includes float placement tuning', () => {
    const preamble = generateEngineeringPreamble('academic');
    expect(preamble).toContain('\\floatpagefraction');
    expect(preamble).toContain('\\topfraction');
    expect(preamble).toContain('\\bottomfraction');
  });
});
