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

// Helper function to map page sizes and margin presets to LaTeX geometry options
function geometryFor(size, preset) {
  // Enhanced margin philosophy:
  // Minimal = maximum text, minimal whitespace (draft/notes)
  // Compact = tight but readable (technical docs, references)
  // Narrow = more text space (dense academic work)
  // Normal = comfortable reading + print-safe (general use)
  // Wide = academic roomy (annotations, comments)
  // Academic = generous margins for scholarly work (dissertations, journals)
  // Generous = maximum whitespace (presentation, luxury books)
  
  const mm = (n) => `${n}mm`;
  const in_ = (n) => `${n}in`;

  switch (size) {
    case 'a4': {
      const margins = {
        minimal: mm(10),    // Maximum text space
        compact: mm(15),    // Tight but readable
        narrow: mm(18),     // More text space
        normal: mm(25),     // Comfortable reading
        wide: mm(30),       // Academic roomy
        academic: mm(35),   // Generous scholarly
        generous: mm(40)    // Maximum whitespace
      };
      return `a4paper,margin=${margins[preset] || margins.normal}`;
    }
    case 'a5': {
      const margins = {
        minimal: mm(8),     // Maximum text space
        compact: mm(12),    // Tight but readable
        narrow: mm(15),     // More text space
        normal: mm(18),     // Comfortable reading
        wide: mm(22),       // Academic roomy
        academic: mm(25),   // Generous scholarly
        generous: mm(30)    // Maximum whitespace
      };
      return `paperwidth=148mm,paperheight=210mm,margin=${margins[preset] || margins.normal}`;
    }
    case 'sixByNine': { // trade 6×9"
      const margins = {
        minimal: in_(0.4),  // Maximum text space
        compact: in_(0.55), // Tight but readable
        narrow: in_(0.65),  // More text space
        normal: in_(0.875), // Comfortable reading
        wide: in_(1.1),     // Academic roomy
        academic: in_(1.25), // Generous scholarly
        generous: in_(1.4)  // Maximum whitespace
      };
      return `paperwidth=6in,paperheight=9in,margin=${margins[preset] || margins.normal}`;
    }
    case 'fiveFiveByEightFive': { // 5.5×8.5"
      const margins = {
        minimal: in_(0.35), // Maximum text space
        compact: in_(0.5),  // Tight but readable
        narrow: in_(0.6),   // More text space
        normal: in_(0.75),  // Comfortable reading
        wide: in_(0.9),     // Academic roomy
        academic: in_(1.0), // Generous scholarly
        generous: in_(1.15) // Maximum whitespace
      };
      return `paperwidth=5.5in,paperheight=8.5in,margin=${margins[preset] || margins.normal}`;
    }
    case 'sevenByTen': {
      const margins = {
        minimal: in_(0.5),  // Maximum text space
        compact: in_(0.65), // Tight but readable
        narrow: in_(0.7),  // More text space
        normal: in_(0.9),   // Comfortable reading
        wide: in_(1.2),     // Academic roomy
        academic: in_(1.35), // Generous scholarly
        generous: in_(1.5)  // Maximum whitespace
      };
      return `paperwidth=7in,paperheight=10in,margin=${margins[preset] || margins.normal}`;
    }
    case 'amazonFiveByEight': { // Amazon KDP 5×8"
      const margins = {
        minimal: in_(0.3),  // Maximum text space
        compact: in_(0.45), // Tight but readable
        narrow: in_(0.55),  // More text space
        normal: in_(0.7),    // Comfortable reading
        wide: in_(0.85),     // Academic roomy
        academic: in_(0.95), // Generous scholarly
        generous: in_(1.05)  // Maximum whitespace
      };
      return `paperwidth=5in,paperheight=8in,margin=${margins[preset] || margins.normal}`;
    }
    case 'amazonSixByNine': { // Amazon KDP 6×9"
      const margins = {
        minimal: in_(0.4),  // Maximum text space
        compact: in_(0.55), // Tight but readable
        narrow: in_(0.65),  // More text space
        normal: in_(0.8),    // Comfortable reading
        wide: in_(1.0),      // Academic roomy
        academic: in_(1.15), // Generous scholarly
        generous: in_(1.3)   // Maximum whitespace
      };
      return `paperwidth=6in,paperheight=9in,margin=${margins[preset] || margins.normal}`;
    }
    case 'amazonSevenByTen': { // Amazon KDP 7×10"
      const margins = {
        minimal: in_(0.5),  // Maximum text space
        compact: in_(0.65), // Tight but readable
        narrow: in_(0.75),  // More text space
        normal: in_(0.9),    // Comfortable reading
        wide: in_(1.1),      // Academic roomy
        academic: in_(1.25), // Generous scholarly
        generous: in_(1.4)   // Maximum whitespace
      };
      return `paperwidth=7in,paperheight=10in,margin=${margins[preset] || margins.normal}`;
    }
    case 'amazonEightByTen': { // Amazon KDP 8×10"
      const margins = {
        minimal: in_(0.6),  // Maximum text space
        compact: in_(0.75), // Tight but readable
        narrow: in_(0.85),  // More text space
        normal: in_(1.0),    // Comfortable reading
        wide: in_(1.2),      // Academic roomy
        academic: in_(1.35), // Generous scholarly
        generous: in_(1.5)   // Maximum whitespace
      };
      return `paperwidth=8in,paperheight=10in,margin=${margins[preset] || margins.normal}`;
    }
    case 'amazonEightFiveByEleven': { // Amazon KDP 8.5×11"
      const margins = {
        minimal: in_(0.5),  // Maximum text space
        compact: in_(0.65), // Tight but readable
        narrow: in_(0.75),  // More text space
        normal: in_(1.0),    // Comfortable reading
        wide: in_(1.25),     // Academic roomy
        academic: in_(1.5), // Generous scholarly
        generous: in_(1.75)  // Maximum whitespace
      };
      return `paperwidth=8.5in,paperheight=11in,margin=${margins[preset] || margins.normal}`;
    }
    case 'letter':
    default: {
      const margins = {
        minimal: in_(0.5),  // Maximum text space
        compact: in_(0.65), // Tight but readable
        narrow: in_(0.75), // More text space
        normal: in_(1.0),   // Comfortable reading
        wide: in_(1.25),    // Academic roomy
        academic: in_(1.5), // Generous scholarly
        generous: in_(1.75) // Maximum whitespace
      };
      return `letterpaper,margin=${margins[preset] || margins.normal}`;
    }
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

  const geo = geometryFor(pageSize, marginPreset);
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