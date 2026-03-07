const express = require('express');
const fsp = require('fs').promises;
const path = require('path');
const rateLimit = require('express-rate-limit');
const manuscriptStructure = require('../manuscript-structure');
const referencesSystem = require('../references-system');
const figuresSystem = require('../figures-system');
const bookEngineering = require('../book-engineering');
const platformCompliance = require('../platform-compliance');
const provenance = require('../provenance');
const templateExtensions = require('../template-extensions');
const typographyAssurance = require('../typography-assurance');
const multilingual = require('../multilingual');
const printQA = require('../print-qa');

const BIB_PATH = path.resolve(__dirname, '..', 'references/references.bib');

/**
 * Manuscript analysis, validation, and platform compliance routes.
 * @param {object} ctx — shared context from index.js
 */
module.exports = function analysisRoutes(ctx) {
  const router = express.Router();

  // SECURITY: Rate limit analysis endpoints — CPU-intensive operations
  const analysisLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'rate_limited', message: 'Too many analysis requests. Please try again later.' },
  });
  router.use('/api/analyze', analysisLimiter);
  router.use('/api/validate', analysisLimiter);

  // ── Structure ──
  router.post('/api/analyze/structure', (req, res) => {
    const { manuscriptText } = req.body || {};
    if (!manuscriptText || typeof manuscriptText !== 'string') {
      return res.status(400).json({ error: 'invalid_request', message: 'manuscriptText is required.' });
    }
    const result = manuscriptStructure.analyzeStructure(manuscriptText);
    res.json(result);
  });

  // ── References ──
  router.post('/api/analyze/references', async (req, res) => {
    const { manuscriptText, bibliography } = req.body || {};
    if (!manuscriptText || typeof manuscriptText !== 'string') {
      return res.status(400).json({ error: 'invalid_request', message: 'manuscriptText is required.' });
    }
    const citations = referencesSystem.extractCitations(manuscriptText);
    const bibContent = bibliography || await fsp.readFile(BIB_PATH, 'utf8');
    const validation = referencesSystem.validateBibliography(bibContent);
    const crossRef = referencesSystem.crossReference(manuscriptText, bibContent);
    res.json({ citations, validation, crossReference: crossRef });
  });

  // ── Bibliography validation ──
  router.post('/api/validate/bibliography', (req, res) => {
    const { bibliography } = req.body || {};
    if (!bibliography || typeof bibliography !== 'string') {
      return res.status(400).json({ error: 'invalid_request', message: 'bibliography (BibTeX content) is required.' });
    }
    const result = referencesSystem.validateBibliography(bibliography);
    res.json(result);
  });

  // ── Assets ──
  router.post('/api/analyze/assets', (req, res) => {
    const { manuscriptText, trimSize, bleedType, context } = req.body || {};
    if (!manuscriptText || typeof manuscriptText !== 'string') {
      return res.status(400).json({ error: 'invalid_request', message: 'manuscriptText is required.' });
    }
    const result = figuresSystem.validateAssets(manuscriptText, { trimSize, bleedType, context });
    res.json(result);
  });

  // ── Lint ──
  router.post('/api/analyze/lint', (req, res) => {
    const { manuscriptText, template } = req.body || {};
    if (!manuscriptText || typeof manuscriptText !== 'string') {
      return res.status(400).json({ error: 'invalid_request', message: 'manuscriptText is required.' });
    }
    const templateType = (ctx.DESIGN_TEMPLATES[template] || {}).gridType || 'academic';
    const result = bookEngineering.lintManuscript(manuscriptText, templateType);
    res.json(result);
  });

  // ── Platform compliance ──
  router.post('/api/analyze/platform', (req, res) => {
    const { platform, pageSize, pageCount, wordCount, marginPreset, template, hasImages, hasCitations, colorMode } = req.body || {};
    if (!platform) {
      return res.status(400).json({ error: 'invalid_request', message: 'platform is required.' });
    }
    const templateType = (ctx.DESIGN_TEMPLATES[template] || {}).gridType || 'academic';
    const result = platformCompliance.validatePlatform({
      platform,
      pageSize: pageSize || 'sixByNine',
      pageCount,
      wordCount: wordCount || 0,
      marginPreset: marginPreset || 'normal',
      template: templateType,
      hasImages: hasImages || false,
      hasCitations: hasCitations || false,
      colorMode: colorMode || 'bw',
    }, ctx.gridSystem);
    res.json(result);
  });

  router.get('/api/platforms', (_req, res) => {
    const platforms = Object.entries(platformCompliance.PLATFORMS).map(([key, spec]) => ({
      key,
      name: spec.name,
      type: spec.type,
      trimSizes: spec.trimSizes,
      pageRange: spec.pageRange,
      notes: spec.notes,
    }));
    res.json({ platforms });
  });

  router.get('/api/platforms/:key/pipeline', (req, res) => {
    const pipeline = platformCompliance.getExportPipeline(req.params.key);
    res.json(pipeline);
  });

  // ── Template extensions ──
  router.get('/api/template-tokens/:template', (req, res) => {
    const templateType = (ctx.DESIGN_TEMPLATES[req.params.template] || {}).gridType || 'academic';
    const schema = templateExtensions.getTokenSchemaForTemplate(templateType);
    res.json({ template: req.params.template, gridType: templateType, tokens: schema });
  });

  router.post('/api/validate/extensions', (req, res) => {
    const { template, extensions } = req.body || {};
    if (!extensions || typeof extensions !== 'object') {
      return res.status(400).json({ error: 'invalid_request', message: 'extensions object is required.' });
    }
    const templateType = (ctx.DESIGN_TEMPLATES[template] || {}).gridType || 'academic';
    const result = templateExtensions.validateExtensions(extensions, templateType);
    res.json(result);
  });

  // ── Typography ──
  router.post('/api/analyze/typography', (req, res) => {
    const { template, pageSize, marginPreset, extensions } = req.body || {};
    const templateType = (ctx.DESIGN_TEMPLATES[template] || {}).gridType || 'academic';
    const result = typographyAssurance.analyzeTypography({
      template: templateType,
      pageSize: pageSize || 'sixByNine',
      marginPreset: marginPreset || 'normal',
      extensions: extensions || {},
    });
    res.json(result);
  });

  // ── Multilingual ──
  router.post('/api/analyze/multilingual', (req, res) => {
    const { manuscriptText } = req.body || {};
    if (!manuscriptText || typeof manuscriptText !== 'string') {
      return res.status(400).json({ error: 'invalid_request', message: 'manuscriptText is required.' });
    }
    const result = multilingual.analyzeMultilingual(manuscriptText);
    res.json(result);
  });

  // ── Print QA ──
  router.post('/api/analyze/print-qa', (req, res) => {
    const { template, wordCount, figureCount, hasFootnotes, hasTables, hasImages, colorMode, paperStock, extensions } = req.body || {};
    const templateType = (ctx.DESIGN_TEMPLATES[template] || {}).gridType || 'academic';
    const result = printQA.runPrintQA({
      templateType,
      wordCount: wordCount || 0,
      figureCount: figureCount || 0,
      hasFootnotes: hasFootnotes || false,
      hasTables: hasTables || false,
      hasImages: hasImages || false,
      colorMode: colorMode || 'bw',
      paperStock: paperStock || 'white',
      extensions: extensions || {},
    });
    res.json(result);
  });

  // ── Full analysis (all systems combined) ──
  router.post('/api/analyze/full', (req, res) => {
    const { manuscriptText, template, pageSize, marginPreset, platform, paperStock, colorMode, extensions } = req.body || {};
    if (!manuscriptText || typeof manuscriptText !== 'string') {
      return res.status(400).json({ error: 'invalid_request', message: 'manuscriptText is required.' });
    }

    const tplKey = ctx.DESIGN_TEMPLATES[String(template)] ? String(template) : 'symphony';
    const templateType = ctx.DESIGN_TEMPLATES[tplKey].gridType || 'academic';
    const wordCount = manuscriptText.split(/\s+/).filter(w => w.length > 0).length;
    const hasFootnotes = /\[\^[^\]]+\]/.test(manuscriptText);
    const hasCitations = /\[@[^\]]+\]/.test(manuscriptText);

    const structure = manuscriptStructure.analyzeStructure(manuscriptText);
    const assets = figuresSystem.validateAssets(manuscriptText, { trimSize: pageSize });
    const lint = bookEngineering.lintManuscript(manuscriptText, templateType);
    const typography = typographyAssurance.analyzeTypography({
      template: templateType,
      pageSize: pageSize || 'sixByNine',
      marginPreset: marginPreset || 'normal',
      extensions: extensions || {},
    });
    const multilingualAnalysis = multilingual.analyzeMultilingual(manuscriptText);
    const qa = printQA.runPrintQA({
      templateType,
      wordCount,
      figureCount: assets.stats.figureCount,
      hasFootnotes,
      hasTables: assets.stats.tableCount > 0,
      hasImages: assets.stats.figureCount > 0,
      colorMode: colorMode || 'bw',
      paperStock: paperStock || 'white',
      extensions: extensions || {},
    });

    let platformResult = null;
    if (platform) {
      platformResult = platformCompliance.validatePlatform({
        platform,
        pageSize: pageSize || 'sixByNine',
        wordCount,
        marginPreset: marginPreset || 'normal',
        template: templateType,
        hasImages: assets.stats.figureCount > 0,
        hasCitations,
        colorMode: colorMode || 'bw',
      }, ctx.gridSystem);
    }

    const buildMeta = provenance.generateBuildMetadata({
      manuscriptText,
      template: tplKey,
      pageSize: pageSize || 'sixByNine',
      marginPreset: marginPreset || 'normal',
      safeMode: false,
      compileMode: 'full',
      title: structure.structure.metadata.title || 'Untitled',
    });

    res.json({
      buildId: buildMeta.buildId,
      structure,
      assets,
      lint,
      typography,
      multilingual: multilingualAnalysis,
      printQA: qa,
      platform: platformResult,
      provenance: buildMeta,
      summary: {
        wordCount,
        chapterCount: structure.structure.chapterCount,
        figureCount: assets.stats.figureCount,
        tableCount: assets.stats.tableCount,
        lintIssues: lint.stats.totalIssues,
        typographyScore: typography.score,
        typographyGrade: typography.grade,
        printQAScore: qa.score,
        printQAGrade: qa.grade,
        hasRTL: multilingualAnalysis.scriptAnalysis.hasRTL,
        isMultiscript: multilingualAnalysis.scriptAnalysis.isMultiscript,
        platformPassed: platformResult?.passed ?? null,
      },
    });
  });

  return router;
};
