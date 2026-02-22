const express = require('express');
const publishing = require('../publishing');

/**
 * KDP utilities, preflight, and cover dimensions.
 * @param {object} ctx — shared context from index.js
 */
module.exports = function publishingRoutes(ctx) {
  const router = express.Router();

  // ── KDP helpers ──
  function kdpGutter(pageCount) {
    if (pageCount <= 150) return 0.375;
    if (pageCount <= 300) return 0.5;
    if (pageCount <= 500) return 0.625;
    return 0.75;
  }

  function spineWidth(pageCount, paperStock = 'white') {
    const factor = paperStock === 'cream' ? 0.0025 : 0.002252;
    return +(pageCount * factor).toFixed(4);
  }

  router.get('/api/kdp/spine', (req, res) => {
    const pageCount = parseInt(req.query.pages, 10);
    if (!pageCount || pageCount < 24 || pageCount > 828) {
      return res.status(400).json({
        error: 'invalid_pages',
        message: 'Page count must be between 24 and 828 (KDP limits).',
      });
    }
    res.json({
      pageCount,
      white: { spineInches: spineWidth(pageCount, 'white'), spineMm: +(spineWidth(pageCount, 'white') * 25.4).toFixed(2) },
      cream: { spineInches: spineWidth(pageCount, 'cream'), spineMm: +(spineWidth(pageCount, 'cream') * 25.4).toFixed(2) },
      gutterInches: kdpGutter(pageCount),
    });
  });

  router.get('/api/kdp/gutter', (req, res) => {
    const pageCount = parseInt(req.query.pages, 10);
    if (!pageCount || pageCount < 1) {
      return res.status(400).json({ error: 'invalid_pages', message: 'Page count is required.' });
    }
    res.json({ pageCount, gutterInches: kdpGutter(pageCount) });
  });

  // ── Pre-flight validation ──
  router.post('/api/preflight', (req, res) => {
    const { pageSize, marginPreset, template, wordCount, pageCount, platform, paperStock } = req.body || {};
    if (!wordCount && !pageCount) {
      return res.status(400).json({ error: 'invalid_request', message: 'wordCount or pageCount is required.' });
    }
    const templateType = (ctx.DESIGN_TEMPLATES[template] || {}).gridType || 'academic';
    const result = publishing.preflight({
      pageSize: pageSize || 'sixByNine',
      marginPreset: marginPreset || 'normal',
      template: templateType,
      wordCount: wordCount || 0,
      pageCount,
      platform: platform || 'generic',
      paperStock: paperStock || 'white',
    }, ctx.gridSystem);
    res.json(result);
  });

  // ── Cover dimensions ──
  router.get('/api/cover-dimensions', (req, res) => {
    const trimWidth = parseFloat(req.query.width);
    const trimHeight = parseFloat(req.query.height);
    const pageCount = parseInt(req.query.pages, 10);
    if (!trimWidth || !trimHeight || !pageCount) {
      return res.status(400).json({
        error: 'invalid_request',
        message: 'width, height (inches), and pages are required query parameters.',
      });
    }
    const result = publishing.coverDimensions({
      trimWidth,
      trimHeight,
      pageCount,
      paperStock: req.query.paper || 'white',
      binding: req.query.binding || 'paperback',
      platform: req.query.platform || 'generic',
    });
    res.json(result);
  });

  return router;
};
