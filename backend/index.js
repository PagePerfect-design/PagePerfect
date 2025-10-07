const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const GridSystem = require('./grid-system');

const app = express();
const PORT = process.env.PORT || 4000;

// Initialize Grid System
const gridSystem = new GridSystem();

app.use(morgan('tiny'));
app.use(express.json({ limit: '20mb' }));
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001', 
    'http://localhost:5173',
    'https://pageperfectdesign.netlify.app',
    process.env.ALLOWED_ORIGIN
  ].filter(Boolean),
  methods: ['GET','POST','OPTIONS'],
  allowedHeaders: ['Content-Type'],
  credentials: true,
  optionsSuccessStatus: 200
}));

// Handle preflight requests explicitly
app.options('/api/compile', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.sendStatus(200);
});

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'pageperfect-backend', timestamp: new Date().toISOString(), version: '2.0' });
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

// Helper function to map page sizes and margin presets to LaTeX geometry options
function geometryFor(size, preset, template = 'academic') {
  // Müller-Brockmann Grid System Implementation
  // Uses systematic grid-based margins for visual harmony
  return gridSystem.calculateMargins(size, preset, template);
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
  let { manuscriptText, template, title, pageSize, marginPreset } = req.body || {};
  if (!manuscriptText || typeof manuscriptText !== 'string') {
    return res.status(400).json({ error: 'invalid_request', message: 'manuscriptText is required' });
  }
  const tplKey = TEMPLATES[String(template)] ? String(template) : 'chicago';
  const tpl = TEMPLATES[tplKey];

  // sanitize title
  if (typeof title !== 'string' || !title.trim()) title = 'Manuscript';
  title = title.replace(/[\r\n]/g, ' ').slice(0, 200);

  // sanitize pageSize
  const allowedSizes = new Set(['letter','a4','sixByNine','fiveFiveByEightFive','a5','sevenByTen','amazonFiveByEight','amazonSixByNine','amazonSevenByTen','amazonEightByTen','amazonEightFiveByEleven']);
  if (!allowedSizes.has(pageSize)) pageSize = 'letter';

  // sanitize marginPreset
  const allowedMargins = new Set(['normal','narrow','wide','minimal','academic','generous','compact']);
  if (!allowedMargins.has(marginPreset)) marginPreset = 'normal';

  const tmpBase = fs.mkdtempSync(path.join(os.tmpdir(), 'pp-'));
  const mdPath  = path.join(tmpBase, 'input.md');
  const pdfPath = path.join(tmpBase, 'output.pdf');

  fs.writeFileSync(mdPath, manuscriptText, 'utf8');

  const templateType = tplKey === 'chicago' ? 'academic' : 'trade';
  const geo = geometryFor(pageSize, marginPreset, templateType);
  console.log(`Generating PDF with pageSize: ${pageSize}, marginPreset: ${marginPreset}, geometry: ${geo}`);
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

// Route debugging function
function logRoutes(app) {
  const routes = []
  app._router?.stack?.forEach((s) => {
    if (s.route?.path) {
      const methods = Object.keys(s.route.methods).join(',').toUpperCase()
      routes.push(`${methods} ${s.route.path}`)
    }
  })
  console.log('[routes]', routes)
}

app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
  logRoutes(app);
});