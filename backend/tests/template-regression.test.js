/**
 * Template Regression Test Suite
 *
 * Tests that all 15 templates can successfully generate PDFs with
 * representative content. This catches template-breaking changes
 * before they reach production.
 *
 * These tests require Pandoc and LuaLaTeX to be installed.
 * In CI, they run inside the Docker container.
 * Locally, skip with: npm test -- --testPathIgnorePatterns=template-regression
 */

const { execSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Check if pandoc and lualatex are available
let hasPandoc = false;
let hasLualatex = false;

try {
  execSync('which pandoc', { stdio: 'pipe' });
  hasPandoc = true;
} catch { /* not installed */ }

try {
  execSync('which lualatex', { stdio: 'pipe' });
  hasLualatex = true;
} catch { /* not installed */ }

const canRun = hasPandoc && hasLualatex;
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
    '--pdf-engine=lualatex',
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
  });
});

// ── Standalone runner (for CI without Jest) ──

if (require.main === module) {
  if (!canRun) {
    console.log('SKIP: pandoc and/or lualatex not available');
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
