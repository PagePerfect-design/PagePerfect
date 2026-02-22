const {
  stripRemoteImages,
  detectPoetry,
  hasMarkdownStructure,
  detectFountain,
  escapeDollarSigns,
  normalize,
  MATH_TEMPLATES,
  DROP_CAP_TEMPLATES,
  UNDERSCORE_TEMPLATES,
  TABLE_SAFETY_TEMPLATES,
} = require('../text-normalizer');

// ════════════════════════════════════════════════════════════════════
// SSRF Prevention — stripRemoteImages
// ════════════════════════════════════════════════════════════════════

describe('stripRemoteImages', () => {
  it('strips http image URLs', () => {
    const md = 'text ![photo](http://evil.com/image.png) more';
    const { text, stripped } = stripRemoteImages(md);
    expect(text).not.toContain('http://');
    expect(text).toContain('[Remote image removed: photo]');
    expect(stripped).toBe(1);
  });

  it('strips https image URLs', () => {
    const md = '![](https://example.com/pic.jpg)';
    const { text, stripped } = stripRemoteImages(md);
    expect(text).not.toContain('https://');
    expect(text).toContain('[Remote image removed: untitled]');
    expect(stripped).toBe(1);
  });

  it('strips multiple remote images', () => {
    const md = '![a](https://x.com/1.png) text ![b](http://y.com/2.png)';
    const { text, stripped } = stripRemoteImages(md);
    expect(stripped).toBe(2);
    expect(text).not.toContain('https://');
    expect(text).not.toContain('http://');
  });

  it('preserves local/relative image paths', () => {
    const md = '![local](./images/photo.png)';
    const { text, stripped } = stripRemoteImages(md);
    expect(text).toBe(md);
    expect(stripped).toBe(0);
  });

  it('preserves non-image links', () => {
    const md = '[click here](https://example.com)';
    const { text, stripped } = stripRemoteImages(md);
    expect(text).toBe(md);
    expect(stripped).toBe(0);
  });

  it('handles empty alt text', () => {
    const md = '![](https://evil.com/payload.png)';
    const { text } = stripRemoteImages(md);
    expect(text).toBe('[Remote image removed: untitled]');
  });

  it('handles empty input', () => {
    const { text, stripped } = stripRemoteImages('');
    expect(text).toBe('');
    expect(stripped).toBe(0);
  });
});

// ════════════════════════════════════════════════════════════════════
// Poetry Detection
// ════════════════════════════════════════════════════════════════════

describe('detectPoetry', () => {
  it('detects poetry with short lines and stanza breaks', () => {
    const poem = [
      'Roses are red',
      'Violets are blue',
      '',
      'Sugar is sweet',
      'And so are you',
    ].join('\n');
    expect(detectPoetry(poem)).toBe(true);
  });

  it('rejects prose paragraphs', () => {
    const prose = 'This is a long paragraph of prose text that goes on and on and has many words in it. ' +
      'It continues with more sentences. And even more text that fills the lines.';
    expect(detectPoetry(prose)).toBe(false);
  });

  it('rejects text with chapter headings', () => {
    const chapters = [
      'Chapter 1: The Beginning',
      'Some short text',
      '',
      'Chapter 2: The Middle',
      'More short text',
    ].join('\n');
    expect(detectPoetry(chapters)).toBe(false);
  });

  it('returns false for very short input', () => {
    expect(detectPoetry('hello\nworld')).toBe(false);
  });
});

// ════════════════════════════════════════════════════════════════════
// Markdown Structure Detection
// ════════════════════════════════════════════════════════════════════

describe('hasMarkdownStructure', () => {
  it('detects markdown with headings and lists', () => {
    const md = '# Title\n\n- item 1\n- item 2\n\n> quote\n\ntext';
    expect(hasMarkdownStructure(md)).toBe(true);
  });

  it('returns false for plain text', () => {
    const plain = 'Just some text\nwith no formatting\nat all.';
    expect(hasMarkdownStructure(plain)).toBe(false);
  });

  it('detects code fences and links', () => {
    const md = '# Heading\n```js\ncode\n```\n[link](url)';
    expect(hasMarkdownStructure(md)).toBe(true);
  });
});

// ════════════════════════════════════════════════════════════════════
// Fountain Screenplay Detection
// ════════════════════════════════════════════════════════════════════

describe('detectFountain', () => {
  it('detects Fountain screenplay syntax', () => {
    const fountain = [
      'INT. OFFICE - DAY',
      '',
      'JOHN',
      'Hello there.',
      '',
      'MARY',
      'Hi, how are you?',
      '',
      'EXT. PARK - NIGHT',
    ].join('\n');
    expect(detectFountain(fountain)).toBe(true);
  });

  it('rejects plain prose', () => {
    const prose = 'This is a regular paragraph.\nWith multiple lines.\nAnd no screenplay formatting.';
    expect(detectFountain(prose)).toBe(false);
  });

  it('rejects very short input', () => {
    expect(detectFountain('INT. ROOM')).toBe(false);
  });
});

// ════════════════════════════════════════════════════════════════════
// Dollar Sign Escaping
// ════════════════════════════════════════════════════════════════════

describe('escapeDollarSigns', () => {
  it('escapes currency amounts', () => {
    expect(escapeDollarSigns('costs $50')).toBe('costs \\$50');
  });

  it('preserves inline code', () => {
    expect(escapeDollarSigns('use `$var` here')).toBe('use `$var` here');
  });

  it('preserves code blocks', () => {
    const input = '```\n$variable = 1\n```';
    expect(escapeDollarSigns(input)).toBe(input);
  });

  it('escapes multiple dollar signs', () => {
    expect(escapeDollarSigns('$10 and $20')).toBe('\\$10 and \\$20');
  });
});

// ════════════════════════════════════════════════════════════════════
// Core Normalize Function
// ════════════════════════════════════════════════════════════════════

describe('normalize', () => {
  it('returns empty string for null/undefined input', () => {
    expect(normalize(null, 'paperback')).toBe('');
    expect(normalize(undefined, 'paperback')).toBe('');
    expect(normalize('', 'paperback')).toBe('');
  });

  it('normalizes line endings', () => {
    const result = normalize('line1\r\nline2\rline3', 'paperback');
    expect(result).not.toContain('\r');
  });

  it('collapses excessive blank lines', () => {
    const result = normalize('line1\n\n\n\n\nline2', 'paperback');
    expect(result.split('\n').filter(l => l === '').length).toBeLessThanOrEqual(3);
  });

  it('cleans double spaces after punctuation', () => {
    const result = normalize('Hello.  World!  Text.', 'paperback');
    expect(result).not.toContain('.  ');
    expect(result).toContain('. ');
  });

  it('escapes dollar signs for non-math templates', () => {
    const result = normalize('costs $50', 'paperback');
    expect(result).toContain('\\$50');
  });

  it('preserves dollar signs for math templates', () => {
    const result = normalize('equation $x^2$', 'thesis');
    expect(result).toContain('$x^2$');
    expect(result).not.toContain('\\$');
  });

  it('converts chapter headings in plain text', () => {
    const result = normalize('Chapter 1: The Beginning\n\nSome text here.', 'paperback');
    expect(result).toContain('# ');
  });

  it('preserves existing markdown structure', () => {
    const md = '# Title\n\n- item 1\n- item 2\n\n> quote\n\nParagraph text.';
    const result = normalize(md, 'paperback');
    expect(result).toContain('# Title');
  });

  it('normalizes unicode whitespace', () => {
    const result = normalize('text\u00A0here\u2007more', 'paperback');
    expect(result).not.toContain('\u00A0');
    expect(result).not.toContain('\u2007');
  });
});

// ════════════════════════════════════════════════════════════════════
// Template Classification Sets
// ════════════════════════════════════════════════════════════════════

describe('template classification sets', () => {
  it('MATH_TEMPLATES includes academic templates', () => {
    expect(MATH_TEMPLATES.has('thesis')).toBe(true);
    expect(MATH_TEMPLATES.has('chicago')).toBe(true);
    expect(MATH_TEMPLATES.has('operator')).toBe(true);
  });

  it('MATH_TEMPLATES excludes fiction templates', () => {
    expect(MATH_TEMPLATES.has('paperback')).toBe(false);
    expect(MATH_TEMPLATES.has('memoir')).toBe(false);
  });

  it('DROP_CAP_TEMPLATES includes fiction templates', () => {
    expect(DROP_CAP_TEMPLATES.has('paperback')).toBe(true);
    expect(DROP_CAP_TEMPLATES.has('memoir')).toBe(true);
    expect(DROP_CAP_TEMPLATES.has('symphony')).toBe(true);
  });

  it('UNDERSCORE_TEMPLATES includes technical templates', () => {
    expect(UNDERSCORE_TEMPLATES.has('operator')).toBe(true);
    expect(UNDERSCORE_TEMPLATES.has('matrix')).toBe(true);
  });

  it('TABLE_SAFETY_TEMPLATES includes multi-column templates', () => {
    expect(TABLE_SAFETY_TEMPLATES.has('chronicle')).toBe(true);
    expect(TABLE_SAFETY_TEMPLATES.has('international')).toBe(true);
  });
});
