/**
 * Template Regression Test Suite
 *
 * Tests that all 15 templates can successfully generate PDFs with
 * representative content. This catches template-breaking changes
 * before they reach production.
 *
 * These tests require Pandoc and Typst to be installed.
 * In CI, they run inside the Docker container.
 * Locally, skip with: npm test -- --testPathIgnorePatterns=template-regression
 */

const { execSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Check if pandoc and typst are available
let hasPandoc = false;
let hasTypst = false;

try {
  execSync('which pandoc', { stdio: 'pipe' });
  hasPandoc = true;
} catch { /* not installed */ }

try {
  execSync('which typst', { stdio: 'pipe' });
  hasTypst = true;
} catch { /* not installed */ }

const canRun = hasPandoc && hasTypst;
const describeIf = canRun ? describe : describe.skip;

// ── Test fixtures ──

const ACADEMIC_SAMPLE = `---
title: Regression Test Document
---

# Introduction

This is a regression test document designed to exercise the core features
of each PagePerfect template. It includes headings, paragraphs, emphasis,
and common Markdown structures.

## Section One

The quick brown fox jumps over the lazy dog. This sentence contains
**bold text**, *italic text*, and a [hyperlink](https://example.com).

### Subsection

- Item one
- Item two
- Item three

## Section Two

> This is a blockquote that tests the template's blockquote styling.
> It spans multiple lines to ensure proper wrapping.

Here is some inline code: \`const x = 42\`. And a code block:

\`\`\`
function hello() {
  return "world";
}
\`\`\`

## Conclusion

This concludes the regression test document. The typesetter should
produce a clean, well-formatted PDF without errors.
`;

const FICTION_SAMPLE = `---
title: The Test Novel
---

# Chapter One

The morning light filtered through the old windows, casting long shadows
across the worn desk. She opened the manuscript and began to read.

"This is dialogue," she said, turning the page carefully.

He nodded. "And this is more dialogue --- with an em-dash."

---

The scene break above should render correctly. Below this paragraph,
we continue with narrative text that tests the template's body copy
styling, paragraph indentation, and line spacing.

# Chapter Two

A new chapter begins here. The chapter heading should be styled according
to the template's heading hierarchy, with appropriate spacing above and
below.

This paragraph contains some special characters: curly quotes "like these"
and apostrophes like it's and don't. Smart typography should handle these.
`;

// ── Template registry ──

const TEMPLATES = [
  'chicago', 'symphony', 'thesis', 'minimal', 'paperback', 'memoir',
  'exhibit', 'heirloom', 'verse', 'chronicle', 'international',
  'operator', 'matrix', 'avantgarde', 'cinema',
];

const TEMPLATE_DIR = path.join(__dirname, '..', 'templates');

// ── Helpers ──

function compileTemplate(templateKey, markdown, opts = {}) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pp-regtest-'));
  const mdPath = path.join(tmpDir, 'input.md');
  const pdfPath = path.join(tmpDir, 'output.pdf');
  const templatePath = path.join(TEMPLATE_DIR, `${templateKey}.latex`);

  fs.writeFileSync(mdPath, markdown, 'utf8');

  const args = [
    mdPath,
    '-o', pdfPath,
    `--template=${templatePath}`,
    '--pdf-engine=typst',
    '-f', 'markdown-raw_tex-raw_attribute',
    '--resource-path', tmpDir,
  ];

  if (opts.variables) {
    for (const [key, value] of Object.entries(opts.variables)) {
      args.push('-V', `${key}=${value}`);
    }
  }

  const result = spawnSync('pandoc', args, {
    cwd: tmpDir,
    timeout: 60000, // 60s timeout for regression tests
    env: {
      PATH: process.env.PATH,
      HOME: process.env.HOME || '/app',
      TMPDIR: os.tmpdir(),
      LANG: process.env.LANG || 'en_US.UTF-8',
    },
  });

  const success = result.status === 0 && fs.existsSync(pdfPath);
  const stderr = result.stderr ? result.stderr.toString() : '';
  const pdfSize = success ? fs.statSync(pdfPath).size : 0;

  // Cleanup
  try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch { /* best-effort */ }

  return { success, stderr, pdfSize, exitCode: result.status };
}

// ── Tests ──

describeIf('Template Regression Suite', () => {
  // Increase timeout for LaTeX compilation
  jest.setTimeout(120000);

  describe('All 15 templates exist on disk', () => {
    for (const tpl of TEMPLATES) {
      test(`${tpl}.latex exists`, () => {
        const tplPath = path.join(TEMPLATE_DIR, `${tpl}.latex`);
        expect(fs.existsSync(tplPath)).toBe(true);
      });
    }
  });

  describe('Academic sample compiles with all templates', () => {
    for (const tpl of TEMPLATES) {
      test(`${tpl} produces a valid PDF`, () => {
        const result = compileTemplate(tpl, ACADEMIC_SAMPLE);

        expect(result.success).toBe(true);
        expect(result.pdfSize).toBeGreaterThan(1000); // At least 1KB
        expect(result.exitCode).toBe(0);

        // Check for critical warnings in stderr
        if (result.stderr) {
          // Overfull hbox > 50pt is a regression signal
          const criticalOverfull = result.stderr.match(/Overfull \\hbox.*?(\d+\.?\d*)pt/g);
          if (criticalOverfull) {
            const maxOverfull = Math.max(
              ...criticalOverfull.map(m => parseFloat(m.match(/(\d+\.?\d*)pt/)?.[1] || '0'))
            );
            expect(maxOverfull).toBeLessThan(50); // No line should overflow by > 50pt
          }
        }
      });
    }
  });

  describe('Fiction sample compiles with trade/fiction templates', () => {
    const fictionTemplates = ['paperback', 'memoir', 'exhibit', 'avantgarde'];

    for (const tpl of fictionTemplates) {
      test(`${tpl} produces a valid PDF from fiction content`, () => {
        const result = compileTemplate(tpl, FICTION_SAMPLE);

        expect(result.success).toBe(true);
        expect(result.pdfSize).toBeGreaterThan(1000);
        expect(result.exitCode).toBe(0);
      });
    }
  });

  describe('Page size variations', () => {
    const sizes = [
      { key: '5.5in,8.5in', label: '5.5×8.5' },
      { key: '6in,9in', label: '6×9' },
      { key: '148mm,210mm', label: 'A5' },
    ];

    for (const size of sizes) {
      test(`paperback template at ${size.label}`, () => {
        const result = compileTemplate('paperback', FICTION_SAMPLE, {
          variables: { papersize: size.key },
        });

        expect(result.success).toBe(true);
        expect(result.pdfSize).toBeGreaterThan(1000);
      });
    }
  });

  describe('Heading variants', () => {
    const variants = ['classic', 'modern', 'bold'];
    for (const variant of variants) {
      test(`paperback with ${variant} headings compiles`, () => {
        const result = compileTemplate('paperback', FICTION_SAMPLE, {
          variables: { headingvariant: variant },
        });
        expect(result.success).toBe(true);
        expect(result.pdfSize).toBeGreaterThan(1000);
      });
    }
  });

  describe('Multi-column and specialist templates', () => {
    test('chronicle (multi-column) handles long content', () => {
      const longContent = `---\ntitle: Chronicle Test\n---\n\n# Lead Story\n\n${'The editor reviewed the day\u2019s stories with careful attention to detail, checking facts and verifying sources. '.repeat(30)}\n\n## Second Section\n\n${'Additional reporting confirmed the initial findings and added context. '.repeat(20)}\n`;
      const result = compileTemplate('chronicle', longContent);
      expect(result.success).toBe(true);
    });

    test('cinema template handles screenplay syntax', () => {
      const screenplay = `---\ntitle: Test Screenplay\n---\n\n# INT. OFFICE - DAY\n\nA sparse room. A DETECTIVE sits at a desk.\n\nDETECTIVE\n\n> I need answers.\n\n# EXT. STREET - NIGHT\n\nRain falls on empty pavement.\n`;
      const result = compileTemplate('cinema', screenplay);
      expect(result.success).toBe(true);
    });

    test('heirloom template handles recipe-like content', () => {
      const recipe = `---\ntitle: Test Cookbook\n---\n\n# Classic Bread\n\n## Ingredients\n\n- 3 cups flour\n- 1 tsp salt\n- 1 packet yeast\n- 1 cup warm water\n\n## Instructions\n\n1. Mix dry ingredients.\n2. Add water and knead for 10 minutes.\n3. Let rise for 1 hour.\n4. Bake at 375\\textdegree F for 30 minutes.\n`;
      const result = compileTemplate('heirloom', recipe);
      expect(result.success).toBe(true);
    });

    test('verse template handles poetry', () => {
      const poetry = `---\ntitle: Collected Poems\n---\n\n# Morning Light\n\nThe sun breaks through the eastern clouds,\nA golden thread on silver shrouds,\nThe world awakens, stretches wide,\nAnd shakes the dew from every side.\n\n# Evening Song\n\nThe twilight hums a quiet tune,\nBeneath the silver crescent moon,\nThe stars emerge like scattered seeds\nAbove the swaying meadow reeds.\n`;
      const result = compileTemplate('verse', poetry);
      expect(result.success).toBe(true);
    });
  });

  describe('Edge cases', () => {
    test('Empty document produces PDF', () => {
      const result = compileTemplate('minimal', '---\ntitle: Empty\n---\n\n# Title\n\nOne paragraph.\n');
      expect(result.success).toBe(true);
    });

    test('Special characters do not crash compilation', () => {
      const md = `---
title: Special Characters
---

# Special Characters Test

Curly quotes: "hello" and 'world'

Em-dashes: word---word

En-dashes: 1--10

Ellipsis: wait...

Ampersand: Tom & Jerry

Percent: 100% complete
`;
      const result = compileTemplate('symphony', md);
      expect(result.success).toBe(true);
    });

    test('Long paragraph does not cause fatal overflow', () => {
      const longParagraph = 'This is a very long sentence that repeats many times to test line breaking. '.repeat(50);
      const md = `---\ntitle: Long Paragraph\n---\n\n# Test\n\n${longParagraph}\n`;
      const result = compileTemplate('chicago', md);
      expect(result.success).toBe(true);
    });

    test('Deeply nested lists do not crash', () => {
      const md = `---\ntitle: Nested Lists\n---\n\n# Test\n\n- Level 1\n  - Level 2\n    - Level 3\n      - Level 4\n        - Level 5\n`;
      const result = compileTemplate('operator', md);
      expect(result.success).toBe(true);
    });

    test('Tables compile without error', () => {
      const md = `---\ntitle: Tables\n---\n\n# Results\n\n| Metric | Q1 | Q2 | Q3 | Q4 |\n|--------|----|----|----|----|\\n| Revenue | 100 | 120 | 130 | 150 |\n| Growth | 5% | 8% | 12% | 15% |\n`;
      const result = compileTemplate('matrix', md);
      expect(result.success).toBe(true);
    });
  });
});

// ── Grid system tests (always run — no pandoc/typst needed) ──

describe('Grid system integration', () => {
  const GridSystem = require('../grid-system');
  let grid;

  beforeEach(() => {
    grid = new GridSystem();
  });

  test('all margin presets produce valid Typst geometry', () => {
    const presets = ['minimal', 'compact', 'narrow', 'normal', 'wide', 'academic', 'generous'];
    for (const preset of presets) {
      const result = grid.calculateTypstMargins('sixByNine', preset);
      expect(result).toContain('margin:');
      expect(result).not.toContain('NaN');
      expect(result).not.toContain('undefined');
    }
  });

  test('all default page sizes produce valid Typst geometry', () => {
    const sizes = ['fiveFiveByEightFive', 'sixByNine', 'a5', 'royal', 'letter', 'a4'];
    for (const size of sizes) {
      const result = grid.calculateTypstMargins(size, 'normal');
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(10);
      expect(result).not.toContain('NaN');
      expect(result).not.toContain('undefined');
    }
  });

  test('Typst typography preamble contains par leading', () => {
    const typst = grid.generateTypstCommands();
    expect(typst).toContain('par(leading');
  });
});

// ── Template file integrity (always run) ──

describe('Template file integrity', () => {
  const TYPST_DIR = path.join(__dirname, '..', 'typst-templates');

  test('all 15 Typst template files exist and are non-empty', () => {
    const expected = [
      'chicago', 'symphony', 'thesis', 'minimal', 'paperback', 'memoir',
      'exhibit', 'heirloom', 'verse', 'chronicle', 'international',
      'operator', 'matrix', 'avantgarde', 'cinema',
    ];
    for (const tpl of expected) {
      const tplPath = path.join(TYPST_DIR, `${tpl}.typ`);
      expect(fs.existsSync(tplPath)).toBe(true);
      const content = fs.readFileSync(tplPath, 'utf8');
      expect(content.length).toBeGreaterThan(50);
      // Every Typst template should set the document body
      expect(content).toContain('$body$');
    }
  });

  test('Typst templates use valid Typst syntax patterns', () => {
    const templates = fs.readdirSync(TYPST_DIR).filter(f => f.endsWith('.typ'));
    for (const file of templates) {
      const content = fs.readFileSync(path.join(TYPST_DIR, file), 'utf8');
      // Should contain #set or #show directives (valid Typst)
      expect(content).toMatch(/#(?:set|show|let|import)/);
    }
  });
});

// ── Standalone runner (for CI without Jest) ──

if (require.main === module) {
  if (!canRun) {
    console.log('SKIP: pandoc and/or typst not available');
    process.exit(0);
  }

  console.log('Running template regression checks...\n');
  let passed = 0;
  let failed = 0;

  for (const tpl of TEMPLATES) {
    const result = compileTemplate(tpl, ACADEMIC_SAMPLE);
    if (result.success) {
      console.log(`  PASS  ${tpl} (${(result.pdfSize / 1024).toFixed(0)} KB)`);
      passed++;
    } else {
      console.log(`  FAIL  ${tpl} (exit ${result.exitCode})`);
      if (result.stderr) {
        console.log(`        ${result.stderr.split('\n').slice(-3).join('\n        ')}`);
      }
      failed++;
    }
  }

  console.log(`\n${passed} passed, ${failed} failed out of ${TEMPLATES.length} templates`);
  process.exit(failed > 0 ? 1 : 0);
}
