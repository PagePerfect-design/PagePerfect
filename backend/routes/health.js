const express = require('express');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync } = require('child_process');
const fontAvailability = require('../font-availability');
const headingVariants = require('../heading-variants');
const platformCompliance = require('../platform-compliance');
const log = require('../logger');

/**
 * Health, info, template, and font status routes.
 * @param {object} ctx — shared context from index.js
 */
module.exports = function healthRoutes(ctx) {
  const router = express.Router();

  router.get('/api/health', async (_req, res) => {
    let redisOk = false;
    if (ctx.redis) {
      try { await ctx.redis.ping(); redisOk = true; } catch { /* redis down */ }
    }
    res.json({
      ok: true,
      service: 'pageperfect-backend',
      timestamp: new Date().toISOString(),
      version: '3.1',
      pdfEngine: 'lualatex',
      redis: ctx.redis ? (redisOk ? 'connected' : 'down') : 'not_configured',
    });
  });

  router.get('/api/health/ready', async (_req, res) => {
    const checks = {};
    let ready = true;

    // Redis
    if (ctx.redis) {
      try { await ctx.redis.ping(); checks.redis = 'ok'; }
      catch { checks.redis = 'down'; ready = false; }
    } else {
      checks.redis = 'not_configured';
    }

    // PocketBase
    if (ctx.isPocketBaseConfigured) {
      try {
        const pbUrl = (process.env.POCKETBASE_URL || '').replace(/\/+$/, '');
        const resp = await fetch(`${pbUrl}/api/health`, { signal: AbortSignal.timeout(3000) });
        checks.pocketbase = resp.ok ? 'ok' : 'down';
        if (!resp.ok) ready = false;
      } catch { checks.pocketbase = 'down'; ready = false; }
    } else {
      checks.pocketbase = 'not_configured';
    }

    // Pandoc
    try {
      execSync('pandoc --version', { timeout: 3000, stdio: 'pipe' });
      checks.pandoc = 'ok';
    } catch { checks.pandoc = 'missing'; ready = false; }

    // LuaLaTeX
    try {
      execSync('lualatex --version', { timeout: 3000, stdio: 'pipe' });
      checks.lualatex = 'ok';
    } catch { checks.lualatex = 'missing'; ready = false; }

    // Disk (/tmp writable)
    try {
      const testFile = path.join(os.tmpdir(), `pp-health-${Date.now()}`);
      fs.writeFileSync(testFile, 'ok');
      fs.unlinkSync(testFile);
      checks.disk = 'ok';
    } catch { checks.disk = 'read_only'; ready = false; }

    const status = ready ? 200 : 503;
    res.status(status).json({ ready, checks, timestamp: new Date().toISOString() });
  });

  router.get('/api/health/details', (_req, res) => {
    const templates = Object.keys(ctx.DESIGN_TEMPLATES);
    const pageSizes = ['letter','a4','sixByNine','fiveFiveByEightFive','a5','sevenByTen','royal','bFormat','massMarket','aFormat','demy','fiveTwentyFiveByEight','crownQuarto','b5','amazonFiveByEight','amazonSixByNine','amazonSevenByTen','amazonEightByTen','amazonEightFiveByEleven'];
    const marginPresets = ['normal','narrow','wide','minimal','academic','generous','compact'];
    const compileModes = ['fast','full'];
    const fontCheck = fontAvailability.quickCheck();
    res.json({
      ok: true,
      service: 'pageperfect-backend',
      templates,
      pageSizes,
      marginPresets,
      compileModes,
      pdfEngine: 'lualatex',
      safeModeAvailable: true,
      auth: ctx.isPocketBaseConfigured,
      payments: !!ctx.stripe,
      fonts: fontCheck,
      systems: {
        manuscriptStructure: true,
        references: true,
        figuresAndAssets: true,
        bookEngineering: true,
        platformCompliance: true,
        provenance: true,
        templateExtensions: true,
        typographyAssurance: true,
        multilingual: true,
        printQA: true,
        fontAvailability: true,
      },
      platforms: Object.keys(platformCompliance.PLATFORMS),
    });
  });

  router.get('/api/templates', (_req, res) => {
    const templates = Object.entries(ctx.DESIGN_TEMPLATES).map(([key, template]) => ({
      key,
      name: template.name,
      description: template.description,
      category: template.category,
      characteristics: template.characteristics,
      gridType: template.gridType,
    }));
    res.json({
      templates,
      headingVariants: headingVariants.HEADING_VARIANTS,
      variantLabels: headingVariants.VARIANT_LABELS,
      variantDescriptions: headingVariants.VARIANT_DESCRIPTIONS,
    });
  });

  router.get('/api/fonts/status', (_req, res) => {
    const audit = fontAvailability.auditFonts();
    res.json(audit);
  });

  // Root health check for Coolify
  router.get('/', (_req, res) => res.status(200).send('PagePerfect Engine Active'));

  return router;
};
