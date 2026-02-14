const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const GridSystem = require('./grid-system');

// ---- limits (env overridable) ----
const MAX_MD_BYTES = Number(process.env.MAX_MD_BYTES || 2_000_000); // ~2 MB
const COMPILE_TIMEOUT_MS = Number(process.env.COMPILE_TIMEOUT_MS || 45_000); // 45s

// ---- Allowed origins ----
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:4000',
  process.env.FRONTEND_URL, // e.g. https://pageperfect.studio
].filter(Boolean);

// Filename helper functions
function slug(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'manuscript';
}
function sizeCode(size) {
  switch (size) {
    case 'a4': return 'a4';
    case 'a5': return 'a5';
    case 'sixByNine': return '6x9';
    case 'fiveFiveByEightFive': return '5.5x8.5';
    case 'sevenByTen': return '7x10';
    case 'amazonFiveByEight': return 'amazon-5x8';
    case 'amazonSixByNine': return 'amazon-6x9';
    case 'amazonSevenByTen': return 'amazon-7x10';
    case 'amazonEightByTen': return 'amazon-8x10';
    case 'amazonEightFiveByEleven': return 'amazon-8.5x11';
    case 'letter':
    default: return 'letter';
  }
}
function templateCode(t) {
  switch (t) {
    case 'minimal': return 'minimal';
    case 'symphony': return 'symphony';
    case 'chronicle': return 'chronicle';
    case 'exhibit': return 'exhibit';
    case 'matrix': return 'matrix';
    case 'avantgarde': return 'avantgarde';
    case 'paperback': return 'paperback';
    case 'chicago':
    default: return 'chicago';
  }
}
function timestamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
}
function buildFilename(title, template, pageSize) {
  return `${slug(title)}_${templateCode(template)}_${sizeCode(pageSize)}_${timestamp()}.pdf`;
}

const app = express();
const PORT = process.env.PORT || 4000;

// Initialize Grid System
const gridSystem = new GridSystem();

// ================================================================
// Security & Middleware
// ================================================================

// Security headers
app.use(helmet({
  contentSecurityPolicy: false, // PDF responses need flexible CSP
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// Request logging
app.use(morgan('tiny'));

// Body parsing
app.use(express.json({ limit: '5mb' }));

// CORS — locked to known origins (falls back to permissive in dev)
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ALLOWED_ORIGINS
    : true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200,
}));

// Rate limiting — per IP
const compileLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,             // 20 compiles per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'rate_limited',
    message: 'Too many compile requests. Please wait a moment and try again.',
  },
});

const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply general limiter to all routes
app.use(generalLimiter);

// ================================================================
// Stripe Webhook (must be before json body parser for raw body)
// ================================================================
let stripe;
try {
  if (process.env.STRIPE_SECRET_KEY) {
    stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  }
} catch { /* stripe not configured */ }

// Stripe webhook endpoint — needs raw body
app.post('/api/stripe/webhook',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
      return res.status(501).json({ error: 'Stripe not configured' });
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        req.headers['stripe-signature'],
        process.env.STRIPE_WEBHOOK_SECRET,
      );
    } catch (err) {
      console.error('Stripe webhook signature verification failed:', err.message);
      return res.status(400).json({ error: 'Invalid signature' });
    }

    // Handle relevant events
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        console.log(`Checkout completed for customer ${session.customer}, tier: ${session.metadata?.tier}`);
        // TODO: Update user tier in Supabase using service role key
        //   - session.metadata.tier = 'publisher' | 'studio'
        //   - session.metadata.user_id = Supabase user ID
        //   - session.customer = Stripe customer ID
        //   - session.subscription = Stripe subscription ID (for publisher)
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        console.log(`Subscription cancelled for customer ${sub.customer}`);
        // TODO: Downgrade user to 'drafter' tier in Supabase
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        console.log(`Payment failed for customer ${invoice.customer}`);
        // TODO: Send notification, grace period logic
        break;
      }
      default:
        // Unhandled event type
        break;
    }

    res.json({ received: true });
  },
);

// Stripe checkout session creation
app.post('/api/stripe/checkout', async (req, res) => {
  if (!stripe) {
    return res.status(501).json({ error: 'Stripe not configured' });
  }

  const { tier } = req.body;
  if (!['publisher', 'studio'].includes(tier)) {
    return res.status(400).json({ error: 'Invalid tier' });
  }

  const priceId = tier === 'publisher'
    ? process.env.STRIPE_PRICE_PUBLISHER
    : process.env.STRIPE_PRICE_STUDIO;

  if (!priceId) {
    return res.status(500).json({ error: `Price not configured for tier: ${tier}` });
  }

  const mode = tier === 'publisher' ? 'subscription' : 'payment';

  try {
    const session = await stripe.checkout.sessions.create({
      mode,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/app?upgraded=${tier}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/pricing`,
      metadata: {
        tier,
        // user_id should be passed from the frontend after auth
      },
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('Stripe checkout error:', err.message);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// ================================================================
// Health & Info Endpoints
// ================================================================

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'pageperfect-backend', timestamp: new Date().toISOString(), version: '3.0' });
});

app.get('/api/health/details', (_req, res) => {
  const templates = Object.keys(DESIGN_TEMPLATES);
  const pageSizes = ['letter','a4','sixByNine','fiveFiveByEightFive','a5','sevenByTen','amazonFiveByEight','amazonSixByNine','amazonSevenByTen','amazonEightByTen','amazonEightFiveByEleven'];
  const marginPresets = ['normal','narrow','wide','minimal','academic','generous','compact'];
  const compileModes = ['fast','full'];
  res.json({
    ok: true,
    service: 'pageperfect-backend',
    templates,
    pageSizes,
    marginPresets,
    compileModes,
    safeModeAvailable: true,
    auth: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    payments: !!stripe,
  });
});

app.get('/api/templates', (_req, res) => {
  const templates = Object.entries(DESIGN_TEMPLATES).map(([key, template]) => ({
    key,
    name: template.name,
    description: template.description,
    category: template.category,
    characteristics: template.characteristics,
    gridType: template.gridType,
  }));
  res.json({ templates });
});

// ================================================================
// Design Template Registry
// ================================================================

const DESIGN_TEMPLATES = {
  minimal: {
    name: 'Minimal Layout',
    description: 'Simple, clean template compatible with BasicTeX.',
    category: 'Minimal',
    templatePath: path.resolve(__dirname, 'templates/minimal.latex'),
    mainfont: 'DejaVu Serif',
    gridType: 'basic',
    characteristics: ['Basic typography', 'Simple formatting', 'Maximum compatibility', 'No external packages'],
  },
  symphony: {
    name: 'Symphony Layout',
    description: 'Classic academic design with harmonious typography.',
    category: 'Academic',
    templatePath: path.resolve(__dirname, 'templates/symphony.latex'),
    mainfont: 'DejaVu Serif',
    gridType: 'academic',
    characteristics: ['Serif typography', 'Indented paragraphs', 'Classic hierarchy', 'Formal spacing'],
  },
  chronicle: {
    name: 'Chronicle Grid',
    description: 'Editorial-style layout with multi-column grid system.',
    category: 'Editorial',
    templatePath: path.resolve(__dirname, 'templates/chronicle.latex'),
    mainfont: 'DejaVu Sans',
    gridType: 'editorial',
    characteristics: ['Sans-serif typography', 'Block paragraphs', 'Editorial hierarchy', 'Professional spacing'],
  },
  exhibit: {
    name: 'Exhibit Frame',
    description: 'Modern trade design with clean lines and generous white space.',
    category: 'Trade',
    templatePath: path.resolve(__dirname, 'templates/exhibit.latex'),
    mainfont: 'Lato',
    gridType: 'trade',
    characteristics: ['Modern sans-serif', 'Block paragraphs', 'Clean hierarchy', 'Generous spacing'],
  },
  matrix: {
    name: 'Corporate Matrix',
    description: 'Structured business layout with systematic organization.',
    category: 'Corporate',
    templatePath: path.resolve(__dirname, 'templates/matrix.latex'),
    mainfont: 'Inter',
    gridType: 'corporate',
    characteristics: ['Professional typography', 'Systematic layout', 'Business hierarchy', 'Structured spacing'],
  },
  avantgarde: {
    name: 'Avant-Garde Canvas',
    description: 'Experimental design with creative freedom.',
    category: 'Creative',
    templatePath: path.resolve(__dirname, 'templates/avantgarde.latex'),
    mainfont: 'Source Sans Pro',
    gridType: 'creative',
    characteristics: ['Creative typography', 'Flexible layout', 'Experimental hierarchy', 'Dynamic spacing'],
  },
  chicago: {
    name: 'Classic Academic (Chicago)',
    description: 'Traditional academic style with Chicago conventions.',
    category: 'Legacy',
    templatePath: path.resolve(__dirname, 'templates/chicago.latex'),
    mainfont: 'DejaVu Serif',
    gridType: 'academic',
    characteristics: ['Serif typography', 'Indented paragraphs', 'Classic hierarchy', 'Traditional spacing'],
  },
  paperback: {
    name: 'Modern Trade Paperback',
    description: 'Contemporary trade book design.',
    category: 'Legacy',
    templatePath: path.resolve(__dirname, 'templates/paperback.latex'),
    mainfont: 'Lato',
    gridType: 'trade',
    characteristics: ['Sans-serif typography', 'Block paragraphs', 'Modern hierarchy', 'Contemporary spacing'],
  },
};

const BIB_PATH = path.resolve(__dirname, 'references/references.bib');

function geometryFor(size, preset, template = 'academic') {
  return gridSystem.calculateMargins(size, preset, template);
}

function styleWarnings(md) {
  const warnings = [];
  if (/[.!?]\s{2,}[A-Z(]/g.test(md)) {
    warnings.push('Detected double spaces after punctuation. Consider using a single space.');
  }
  return warnings;
}

function stripCitations(md) {
  let out = md.replace(/\[[^[\]]*@[^[\]]*\]/g, '(citation)');
  out = out.replace(/@([A-Za-z0-9:_\-]+)/g, '$1');
  return out;
}

function parseMissingCitations(stderr) {
  const keys = new Set();
  const patterns = [
    /Undefined citation\s*[: ]\s*'([^']+)'/gi,
    /citation ['"]?([A-Za-z0-9:_\-]+)['"]?\s+undefined/gi,
    /reference\s+([A-Za-z0-9:_\-]+)\s+not found/gi,
    /could not find citation\s+['"]?([A-Za-z0-9:_\-]+)['"]?/gi,
  ];
  for (const re of patterns) {
    let m;
    while ((m = re.exec(stderr)) !== null) keys.add(m[1]);
  }
  return [...keys];
}

function parseMissingPackages(stderr) {
  const pkgs = new Set();
  const re = /LaTeX Error:\s*File\s+[`']([^`']+)\.sty['`]\s+not found/gi;
  let m;
  while ((m = re.exec(stderr)) !== null) pkgs.add(m[1]);
  return [...pkgs];
}

// ================================================================
// Free tier page size restrictions
// ================================================================
const FREE_TIER_SIZES = new Set(['letter', 'a4', 'sixByNine']);
const ALL_SIZES = new Set(['letter','a4','sixByNine','fiveFiveByEightFive','a5','sevenByTen','amazonFiveByEight','amazonSixByNine','amazonSevenByTen','amazonEightByTen','amazonEightFiveByEleven']);
const ALL_MARGINS = new Set(['normal','narrow','wide','minimal','academic','generous','compact']);

// ================================================================
// Compile Endpoint
// ================================================================

app.post('/api/compile', compileLimiter, async (req, res) => {
  let { manuscriptText, template, title, pageSize, marginPreset, safeMode, compileMode } = req.body || {};
  safeMode = Boolean(safeMode);
  compileMode = (compileMode === 'full') ? 'full' : 'fast';

  if (!manuscriptText || typeof manuscriptText !== 'string') {
    return res.status(400).json({ error: 'invalid_request', message: 'manuscriptText is required' });
  }

  // Enforce payload size before spawning Pandoc
  const mdBytes = Buffer.byteLength(manuscriptText, 'utf8');
  if (mdBytes > MAX_MD_BYTES) {
    return res.status(413).json({
      error: 'payload_too_large',
      message: `Manuscript exceeds limit (${mdBytes} > ${MAX_MD_BYTES} bytes). Try splitting chapters or removing images.`,
    });
  }

  const tplKey = DESIGN_TEMPLATES[String(template)] ? String(template) : 'symphony';
  const tpl = DESIGN_TEMPLATES[tplKey];

  // Sanitize title
  if (typeof title !== 'string' || !title.trim()) title = 'Manuscript';
  title = title.replace(/[\r\n]/g, ' ').slice(0, 200);

  // Sanitize pageSize
  if (!ALL_SIZES.has(pageSize)) pageSize = 'letter';

  // Sanitize marginPreset
  if (!ALL_MARGINS.has(marginPreset)) marginPreset = 'normal';

  const tmpBase = fs.mkdtempSync(path.join(os.tmpdir(), 'pp-'));
  const mdPath  = path.join(tmpBase, 'input.md');
  const pdfPath = path.join(tmpBase, 'output.pdf');

  const effectiveMd = safeMode ? stripCitations(manuscriptText) : manuscriptText;
  fs.writeFileSync(mdPath, effectiveMd, 'utf8');

  const templateType = tpl.gridType || 'academic';
  const geo = geometryFor(pageSize, marginPreset, templateType);

  const isFast = compileMode === 'fast';
  const enableMicrotype = !isFast;
  const enableCsquotes  = !isFast;

  console.log(`[compile] template=${tplKey} size=${pageSize} margins=${marginPreset} safe=${safeMode} mode=${compileMode}`);

  const baseArgs = [
    mdPath,
    safeMode ? '--from=markdown' : '--from=markdown+citations',
    '--pdf-engine=xelatex',
    '-M', `title=${title}`,
    `--template=${tpl.templatePath}`,
    '-V', `mainfont=${tpl.mainfont}`,
    '-V', `geometry:${geo}`,
    ...(enableMicrotype ? ['-V','microtype=true'] : []),
    ...(enableCsquotes  ? ['-V','csquotes=true']  : []),
    '-o', pdfPath,
  ];

  const args = safeMode
    ? baseArgs
    : baseArgs.concat([
        '--filter', 'pandoc-citeproc',
        `--bibliography=${BIB_PATH}`,
      ]);

  const warnings = styleWarnings(manuscriptText);
  const startTs = Date.now();
  const pandoc = spawn('pandoc', args, { cwd: tmpBase });

  let stderr = '';
  pandoc.stderr.on('data', (d) => { stderr += d.toString(); });

  let timedOut = false;
  const killer = setTimeout(() => {
    timedOut = true;
    try { pandoc.kill('SIGKILL'); } catch {}
  }, COMPILE_TIMEOUT_MS);

  pandoc.on('close', (code) => {
    clearTimeout(killer);
    const elapsed = Date.now() - startTs;
    res.setHeader('X-PP-Compile-Time', String(elapsed));

    if (timedOut) {
      try { fs.rmSync(tmpBase, { recursive: true, force: true }); } catch {}
      return res.status(504).json({
        error: 'compile_timeout',
        message: `Compilation exceeded ${COMPILE_TIMEOUT_MS}ms and was stopped.`,
        detail: stderr.split('\n').slice(-15).join('\n'),
      });
    }

    if (code === 0 && fs.existsSync(pdfPath)) {
      const filename = buildFilename(title, tplKey, pageSize);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
      res.setHeader('X-PP-Filename', filename);
      const stream = fs.createReadStream(pdfPath);
      stream.on('close', () => {
        try { fs.rmSync(tmpBase, { recursive: true, force: true }); } catch {}
      });
      stream.pipe(res);
    } else {
      const missingCitations = safeMode ? [] : parseMissingCitations(stderr);
      const missingPackages  = parseMissingPackages(stderr);

      const messages = [];
      if (!safeMode) {
        if (missingCitations.length) messages.push(`Undefined citations: ${missingCitations.join(', ')}.`);
      } else {
        messages.push('Safe mode was enabled. Citations/bibliography were not processed.');
      }
      if (missingPackages.length) messages.push(`Missing LaTeX packages: ${missingPackages.join(', ')}.`);
      if (messages.length === 0) messages.push('Typesetting failed. Please review your Markdown.');

      const tail = stderr.split('\n').slice(-15).join('\n');

      res.status(400).json({
        error: 'compile_failed',
        message: messages.join(' '),
        missingCitations,
        missingPackages,
        warnings,
        detail: tail,
      });

      try { fs.rmSync(tmpBase, { recursive: true, force: true }); } catch {}
    }
  });
});

// ================================================================
// Start Server
// ================================================================

app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
  console.log(`  CORS: ${process.env.NODE_ENV === 'production' ? ALLOWED_ORIGINS.join(', ') : 'permissive (dev)'}`);
  console.log(`  Stripe: ${stripe ? 'configured' : 'not configured'}`);
  console.log(`  Rate limit: 20 compiles/min, 120 requests/min`);
});
