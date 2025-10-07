const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(morgan('tiny'));
app.use(express.json({ limit: '20mb' }));
app.use(cors({
  origin: ['http://localhost:3001', 'https://pageperfectdesign.netlify.app'],
  methods: ['GET','POST','OPTIONS'],
  allowedHeaders: ['Content-Type'],
}));

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'pageperfect-backend' });
});

// Template registry
const TEMPLATES = {
         chicago: {
           templatePath: path.resolve(__dirname, 'templates/chicago.latex'),
           mainfont: 'DejaVu Serif'
         },
  paperback: {
    templatePath: path.resolve(__dirname, 'templates/paperback.latex'),
    mainfont: 'Lato'
  }
};

const BIB_PATH = path.resolve(__dirname, 'references/references.bib');

// Helper function to map page sizes to LaTeX geometry options
function geometryFor(size) {
  switch (size) {
    case 'a4':
      return 'a4paper,margin=25mm';
    case 'sixByNine': // common trade
      return 'paperwidth=6in,paperheight=9in,margin=0.875in';
    case 'fiveFiveByEightFive': // digest
      return 'paperwidth=5.5in,paperheight=8.5in,margin=0.75in';
    case 'sevenByTen':
      return 'paperwidth=7in,paperheight=10in,margin=0.9in';
    case 'a5':
      return 'paperwidth=148mm,paperheight=210mm,margin=15mm';
    case 'letter':
    default:
      return 'letterpaper,margin=1in';
  }
}

// Basic style warnings (non-fatal)
function styleWarnings(md) {
  const warnings = [];
  const doubleSpaceAfterPeriod = /[.!?]\s{2,}[A-Z(]/g;
  if (doubleSpaceAfterPeriod.test(md)) {
    warnings.push('Detected double spaces after punctuation. Consider using a single space.');
  }
  return warnings;
}

// Parse missing citations from stderr
function parseMissingCitations(stderr) {
  const keys = new Set();
  const patterns = [
    /Undefined citation\s*[: ]\s*'([^']+)'/gi,
    /citation ['"]?([A-Za-z0-9:_\-]+)['"]?\s+undefined/gi,
    /reference\s+([A-Za-z0-9:_\-]+)\s+not found/gi,
    /could not find citation\s+['"]?([A-Za-z0-9:_\-]+)['"]?/gi
  ];
  for (const re of patterns) {
    let m;
    while ((m = re.exec(stderr)) !== null) keys.add(m[1]);
  }
  return [...keys];
}

// Parse missing LaTeX packages
function parseMissingPackages(stderr) {
  const pkgs = new Set();
  const re = /LaTeX Error:\s*File\s+[`']([^`']+)\.sty['`]\s+not found/gi;
  let m;
  while ((m = re.exec(stderr)) !== null) pkgs.add(m[1]);
  return [...pkgs];
}

app.post('/api/compile', async (req, res) => {
  let { manuscriptText, template, title, pageSize } = req.body || {};
  if (!manuscriptText || typeof manuscriptText !== 'string') {
    return res.status(400).json({ error: 'invalid_request', message: 'manuscriptText is required' });
  }
  const tplKey = TEMPLATES[String(template)] ? String(template) : 'chicago';
  const tpl = TEMPLATES[tplKey];

  // sanitize title
  if (typeof title !== 'string' || !title.trim()) title = 'Manuscript';
  title = title.replace(/[\r\n]/g, ' ').slice(0, 200);

  // sanitize pageSize
  const allowedSizes = new Set(['letter','a4','sixByNine','fiveFiveByEightFive','a5','sevenByTen']);
  if (!allowedSizes.has(pageSize)) pageSize = 'letter';

  const tmpBase = fs.mkdtempSync(path.join(os.tmpdir(), 'pp-'));
  const mdPath  = path.join(tmpBase, 'input.md');
  const pdfPath = path.join(tmpBase, 'output.pdf');

  fs.writeFileSync(mdPath, manuscriptText, 'utf8');

  const geo = geometryFor(pageSize);
  const args = [
    mdPath,
    '--from=markdown',
    '--pdf-engine=xelatex',
    '-M', `title=${title}`,
    `--template=${tpl.templatePath}`,
    '-V', `mainfont=${tpl.mainfont}`,
    '-V', `geometry:${geo}`,
    '-o', pdfPath,
  ];

  const warnings = styleWarnings(manuscriptText);
  const pandoc = spawn('pandoc', args, { cwd: tmpBase });

  let stderr = '';
  pandoc.stderr.on('data', (d) => { stderr += d.toString(); });

  pandoc.on('close', (code) => {
    if (code === 0 && fs.existsSync(pdfPath)) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline; filename="PagePerfect.pdf"');
      const stream = fs.createReadStream(pdfPath);
      stream.on('close', () => {
        try { fs.rmSync(tmpBase, { recursive: true, force: true }); } catch {}
      });
      stream.pipe(res);
    } else {
      const missingCitations = parseMissingCitations(stderr);
      const missingPackages  = parseMissingPackages(stderr);

      const messages = [];
      if (missingCitations.length) messages.push(`Undefined citations: ${missingCitations.join(', ')}.`);
      if (missingPackages.length)  messages.push(`Missing LaTeX packages: ${missingPackages.join(', ')}.`);
      if (messages.length === 0)   messages.push('Typesetting failed. Please review your Markdown and citations.');

      const tail = stderr.split('\n').slice(-15).join('\n');

      res.status(400).json({
        error: 'compile_failed',
        message: messages.join(' '),
        missingCitations,
        missingPackages,
        warnings,
        detail: tail
      });

      try { fs.rmSync(tmpBase, { recursive: true, force: true }); } catch {}
    }
  });
});

app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});