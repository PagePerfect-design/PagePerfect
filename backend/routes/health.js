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

    // Pandoc — version detection
    try {
      const pv = execSync('pandoc --version 2>/dev/null | head -1', { encoding: 'utf8', timeout: 3000 });
      const m = pv.match(/pandoc(?:\.exe)?\s+([\d.]+)/);
      checks.pandoc = m ? `ok (${m[1]})` : 'ok';
    } catch { checks.pandoc = 'missing'; ready = false; }

    // LuaLaTeX — version detection
    try {
      const lv = execSync('lualatex --version 2>/dev/null | head -1', { encoding: 'utf8', timeout: 3000 });
      const m = lv.match(/Version\s+([^\s(]+)/i) || lv.match(/([\d.]+)/);
      checks.lualatex = m ? `ok (${m[1]})` : 'ok';
    } catch { checks.lualatex = 'missing'; ready = false; }

    // Locale — verify the configured locale exists
    try {
      const localeList = execSync('locale -a 2>/dev/null', { encoding: 'utf8', timeout: 3000 });
      const configuredLocale = (process.env.LANG || 'C.UTF-8').toLowerCase();
      const available = localeList.split('\n').map(l => l.trim().toLowerCase());
      const found = available.some(l => l === configuredLocale || l === configuredLocale.replace('.utf-8', '.utf8') || l === configuredLocale.replace('.utf8', '.utf-8'));
      checks.locale = found ? `ok (${process.env.LANG || 'C.UTF-8'})` : 'missing';
      if (!found) ready = false;
    } catch { checks.locale = 'check_skipped'; }

    // Ghostscript — needed for PDF/X-1a conversion
    try {
      const gsv = execSync('gs --version 2>/dev/null', { encoding: 'utf8', timeout: 3000 });
      checks.ghostscript = `ok (${gsv.trim()})`;
    } catch { checks.ghostscript = 'missing'; }

    // Disk (/tmp writable + free space)
    try {
      const testFile = path.join(os.tmpdir(), `pp-health-${Date.now()}`);
      fs.writeFileSync(testFile, 'ok');
      fs.unlinkSync(testFile);
      checks.disk = 'ok';
      // Check free space
      try {
        const tmpStats = fs.statfsSync(os.tmpdir());
        const freeMB = Math.round((tmpStats.bavail * tmpStats.bsize) / (1024 * 1024));
        checks.diskFreeMB = freeMB;
        if (freeMB < 50) { checks.disk = `low (${freeMB} MB)`; ready = false; }
      } catch { /* statfs not available */ }
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
