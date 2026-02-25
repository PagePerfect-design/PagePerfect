/**
 * Compile Worker — BullMQ processor for PDF compilation jobs.
 *
 * Runs pandoc/lualatex with bounded concurrency (default: 3).
 * Each job receives only lightweight metadata — the manuscript is written
 * to a temp file BEFORE enqueue and the path is passed via job data.
 *
 * SECURITY FIXES APPLIED:
 *   - LaTeX sanitization on all user-supplied strings (title, font names)
 *   - Auth re-verified via userId + admin token (no user auth token in Redis)
 *   - Injection detection on manuscript text
 *   - Font names validated against registry
 *
 * CRITICAL: Auth and watermark decisions are RE-VERIFIED at compile time,
 * NOT trusted from the enqueue snapshot. A user's tier or credits may
 * change while a job waits in the queue.
 */

const fs = require('fs');
const fsp = require('fs').promises;
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const log = require('./logger').child({ module: 'worker' });

// ── Backend modules ──
const GridSystem = require('./grid-system');
const provenance = require('./provenance');
const bookEngineering = require('./book-engineering');
const multilingual = require('./multilingual');
const templateExtensions = require('./template-extensions');
const headingVariants = require('./heading-variants');
const watermark = require('./watermark');
const fontAvailability = require('./font-availability');
const publishing = require('./publishing');
const errorTranslator = require('./error-translator');
const typographyAssurance = require('./typography-assurance');
const textNormalizer = require('./text-normalizer');
const latexSanitizer = require('./latex-sanitizer');
const {
  PANDOC_HAS_CITEPROC,
  citeprocArgs,
  sanitizeStderr,
  stripCitations,
  styleWarnings,
  hasTier,
  POCKETBASE_URL,
  isPocketBaseConfigured,
  BIB_PATH,
} = require('./compile-utils');

const gridSystem = new GridSystem();
const COMPILE_TIMEOUT_MS = Number(process.env.COMPILE_TIMEOUT_MS || 45_000);
const MAX_STDERR_BYTES = 256 * 1024; // 256KB — cap stderr accumulation from Pandoc

// SECURITY: Minimal environment for spawned Pandoc/LuaLaTeX processes.
// Strips all backend secrets (Stripe, PocketBase, Redis) that Pandoc doesn't need.
const SAFE_SPAWN_ENV = {
  PATH: process.env.PATH,
  HOME: process.env.HOME || '/app',
  TMPDIR: os.tmpdir(),
  LANG: process.env.LANG || 'en_US.UTF-8',
  TEXMFHOME: process.env.TEXMFHOME || '',
  TEXMFVAR: process.env.TEXMFVAR || '',
  SOURCE_DATE_EPOCH: String(Math.floor(Date.now() / 1000)),
};

// ================================================================
// PocketBase auth — re-verified at compile time via admin token
// ================================================================

let _pbAdminToken = null;
let _pbTokenExpiry = 0;

async function getPbAdminToken() {
  if (_pbAdminToken && Date.now() < _pbTokenExpiry) return _pbAdminToken;
  if (!POCKETBASE_URL || !process.env.POCKETBASE_ADMIN_EMAIL || !process.env.POCKETBASE_ADMIN_PASSWORD) {
    return null;
  }
  try {
    const resp = await fetch(`${POCKETBASE_URL}/api/collections/_superusers/auth-with-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(5000),
      body: JSON.stringify({
        identity: process.env.POCKETBASE_ADMIN_EMAIL,
        password: process.env.POCKETBASE_ADMIN_PASSWORD,
      }),
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    _pbAdminToken = data.token;
    _pbTokenExpiry = Date.now() + 115 * 60 * 1000;
    return _pbAdminToken;
  } catch (err) {
    log.error({ err: err.message }, 'PocketBase admin auth failed');
    return null;
  }
}

/**
 * Re-verify user tier using userId + admin token (NOT user auth token).
 * This avoids storing user auth tokens in Redis.
 */
async function verifyUserTierById(userId) {
  if (!isPocketBaseConfigured || !userId) {
    return { userId: null, tier: 'anonymous' };
  }
  try {
    const token = await getPbAdminToken();
    if (!token) return { userId, tier: 'drafter' };

    const resp = await fetch(`${POCKETBASE_URL}/api/collections/users/records/${userId}`, {
      headers: { Authorization: token, 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(5000),
    });
    if (resp?.ok) {
      const record = await resp.json();
      if (record) {
        let tier = record.tier || 'drafter';
        if (tier === 'drafter' && record.publisher_window_end) {
          if (new Date(record.publisher_window_end) > new Date()) tier = 'publisher';
        }
        return { userId: record.id, tier };
      }
    }
  } catch (err) {
    log.error({ err: err.message }, 'Tier re-verification failed');
  }
  return { userId, tier: 'drafter' };
}

// ================================================================
// Core processor — called by BullMQ Worker for each job
// ================================================================

/**
 * @param {import('bullmq').Job} job
 * @param {object} templateRegistry - DESIGN_TEMPLATES from index.js
 * @returns {object} Result metadata (PDF stays on disk, not in Redis)
 */
async function processCompileJob(job, templateRegistry) {
  const {
    manuscriptPath, template, title, pageSize, marginPreset,
    safeMode, compileMode, outputFormat, customFonts,
    headingVariant, isDownload, userId: enqueueUserId, extensions,
    assets,
  } = job.data;

  const tplKey = templateRegistry[String(template)] ? String(template) : 'symphony';
  const tpl = templateRegistry[tplKey];

  // ── Read manuscript from temp file (NOT from Redis) ──
  let manuscriptText;
  try {
    manuscriptText = await fsp.readFile(manuscriptPath, 'utf8');
  } catch (err) {
    return {
      success: false, error: 'manuscript_not_found',
      message: `Manuscript file not found: ${err.message}`,
      debug: { texSource: null, latexLog: null, headerTex: null, filesInDir: [], captureError: null, manuscriptPath },
    };
  }

  // ── Security: check for LaTeX injection attempts in manuscript ──
  if (latexSanitizer.hasInjectionAttempt(manuscriptText)) {
    log.warn({ jobId: job.id }, 'LaTeX injection attempt detected');
    // Don't block — the -raw_tex flag in Pandoc should prevent execution.
    // But log it for monitoring.
  }

  // ── Re-verify auth at compile time via admin token (no user token in Redis) ──
  const user = await verifyUserTierById(enqueueUserId);
  const userTier = user.tier;
  const userId = user.userId;
  const wantPdfX = outputFormat === 'pdfx1a';
  const wantEpub = outputFormat === 'epub';

  // ── Feature gates (re-checked — tier may have changed) ──
  if (wantEpub && !hasTier(userTier, 'studio'))
    return { success: false, error: 'tier_required', message: 'EPUB export requires Studio.' };
  if (wantPdfX && !hasTier(userTier, 'publisher'))
    return { success: false, error: 'tier_required', message: 'PDF/X-1a requires Publisher or Studio.' };
  if (customFonts && typeof customFonts === 'object' && Object.keys(customFonts).length > 0)
    if (!hasTier(userTier, 'studio'))
      return { success: false, error: 'tier_required', message: 'Custom fonts require Studio.' };

  // ── Watermark decision — re-evaluated at compile time ──
  // Publisher+ tiers get unwatermarked downloads; everyone else gets watermarked.
  let needsWatermark = false;
  if (isDownload && isPocketBaseConfigured) {
    needsWatermark = !hasTier(userTier, 'publisher');
  } else if (isDownload && !isPocketBaseConfigured) {
    needsWatermark = true;
  }

  // ── Warnings accumulator (declared early — used by multiple stages below) ──
  const warnings = styleWarnings(manuscriptText);

  // ── Normalize text for format-agnostic input ──
  manuscriptText = textNormalizer.normalize(manuscriptText, tplKey);

  // ── Strip remote images (prevents Pandoc from fetching external URLs) ──
  const imgResult = textNormalizer.stripRemoteImages(manuscriptText);
  manuscriptText = imgResult.text;
  if (imgResult.stripped > 0) {
    warnings.push(`${imgResult.stripped} remote image(s) removed — upload assets directly.`);
  }

  // ── Compile in isolated temp dir ──
  const tmpBase = await fsp.mkdtemp(path.join(os.tmpdir(), 'pp-worker-'));
  const mdPath = path.join(tmpBase, 'input.md');
  const pdfPath = path.join(tmpBase, 'output.pdf');
  const effectiveMd = safeMode ? stripCitations(manuscriptText) : manuscriptText;
  await fsp.writeFile(mdPath, effectiveMd, 'utf8');

  // ── Copy uploaded image assets into compile temp dir ──
  // Assets are stored in /tmp/pp-assets/{UUID}/{filename} and referenced in
  // Markdown as ![caption](filename). Pandoc's --resource-path covers tmpBase,
  // so copying the files there makes them findable.
  if (Array.isArray(assets) && assets.length > 0) {
    const CUSTOM_ASSETS_DIR = path.join(os.tmpdir(), 'pp-assets');
    let assetsCopied = 0;
    for (const assetId of assets) {
      // Validate UUID format (prevents path traversal)
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(assetId)) continue;
      const srcDir = path.join(CUSTOM_ASSETS_DIR, assetId);
      if (!fs.existsSync(srcDir)) {
        warnings.push(`Image asset ${assetId.slice(0, 8)}… not found (may have expired).`);
        continue;
      }
      try {
        const files = fs.readdirSync(srcDir).filter(f => /\.(png|jpe?g|pdf|svg|eps|tiff?)$/i.test(f));
        for (const file of files) {
          const safeFileName = file.replace(/[^a-zA-Z0-9._-]/g, '_');
          fs.copyFileSync(path.join(srcDir, file), path.join(tmpBase, safeFileName));
          assetsCopied++;
        }
      } catch (err) {
        log.warn({ assetId, err: err.message }, 'Failed to copy asset into compile dir');
      }
    }
    if (assetsCopied > 0) {
      log.info({ jobId: job.id, assetsCopied }, 'Copied image assets into compile dir');
    }
  }

  // ── Sanitize title for LaTeX ──
  const safeTitle = latexSanitizer.sanitizeTitle(title);

  // ── EPUB path ──
  if (wantEpub) return compileEpub(tmpBase, mdPath, safeTitle, safeMode);

  // ── PDF compilation ──
  const templateType = tpl.gridType || 'academic';
  const geo = gridSystem.calculateMargins(pageSize, marginPreset, templateType);
  const isFast = compileMode === 'fast';

  // Lint manuscript for common issues (double spaces, bad dashes, heading hierarchy)
  try {
    const lint = bookEngineering.lintManuscript(manuscriptText, templateType);
    for (const issue of lint.issues || []) {
      if (issue.severity === 'warn' || issue.severity === 'info') {
        warnings.push(issue.message);
      }
    }
  } catch (err) {
    log.warn({ err: err.message }, 'Manuscript lint failed');
  }

  // Font resolution — validate font names from registry, not arbitrary user input
  const fontRes = fontAvailability.resolveFont(tpl.mainfont);
  const mainFont = fontRes.resolved;
  if (fontRes.warning) warnings.push(fontRes.warning);
  const sansRes = tpl.sansfont ? fontAvailability.resolveFont(tpl.sansfont) : null;
  const monoRes = tpl.monofont ? fontAvailability.resolveFont(tpl.monofont) : null;
  if (sansRes?.warning) warnings.push(sansRes.warning);
  if (monoRes?.warning) warnings.push(monoRes.warning);

  // Template patching
  let tplContent = await fsp.readFile(tpl.templatePath, 'utf8');
  for (const { original, resolved } of [
    { original: tpl.mainfont, resolved: mainFont },
    ...(sansRes ? [{ original: tpl.sansfont, resolved: sansRes.resolved }] : []),
    ...(monoRes ? [{ original: tpl.monofont, resolved: monoRes.resolved }] : []),
  ]) {
    if (original !== resolved) {
      const esc = original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      tplContent = tplContent.replace(
        new RegExp(`(\\\\set(?:main|sans|mono)font\\{)${esc}(\\})`, 'g'), `$1${resolved}$2`
      );
    }
  }

  // Custom font override — validate font file names
  const CUSTOM_FONTS_DIR = path.join(os.tmpdir(), 'pp-custom-fonts');
  if (customFonts && typeof customFonts === 'object') {
    for (const slot of ['main', 'sans', 'mono']) {
      const fontId = customFonts[slot];
      if (!fontId || typeof fontId !== 'string') continue;
      // Validate fontId format (UUID only — prevents path traversal)
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(fontId)) continue;
      const srcDir = path.join(CUSTOM_FONTS_DIR, fontId);
      if (!fs.existsSync(srcDir)) continue;
      const files = fs.readdirSync(srcDir).filter(f => /\.(ttf|otf)$/i.test(f));
      if (files.length === 0) continue;
      // Validate filename is safe (no path separators, no special chars)
      const safeFileName = files[0].replace(/[^a-zA-Z0-9._-]/g, '_');
      fs.copyFileSync(path.join(srcDir, files[0]), path.join(tmpBase, safeFileName));
      const cmd = slot === 'main' ? 'setmainfont' : slot === 'sans' ? 'setsansfont' : 'setmonofont';
      tplContent = tplContent.replace(new RegExp(`(\\\\${cmd})(\\[.*?\\])?\\{[^}]+\\}`), `$1[Path=./]{${safeFileName}}`);
      warnings.push(`Custom ${slot} font applied: ${safeFileName}`);
    }
  }

  // ── Emoji / symbol fallback font (LuaLaTeX only) ──
  // Register a fallback chain so missing glyphs (emoji, symbols) don't crash
  // the compile or silently disappear. Noto Color Emoji must be installed in
  // the Docker image. The fallback is registered via luaotfload and applied
  // to the main font via RawFeature. We inject this BEFORE \setmainfont by
  // adding a \directlua block, then patch the \setmainfont call to reference it.
  //
  // DEFENSIVE: luaotfload.add_fallback() was added in luaotfload 3.17 (2021).
  // Older TeX Live installs won't have it. We wrap in pcall + type check so
  // the compile continues without emoji support rather than crashing.
  const emojiFallbackLua = [
    '\\directlua{',
    '  pp_emoji_fallback_ok = false',
    '  if luaotfload and type(luaotfload.add_fallback) == "function" then',
    '    local ok, err = pcall(function()',
    '      luaotfload.add_fallback("emojifallback", {',
    '        "Noto Color Emoji:mode=harf;",',
    '        "Noto Sans Symbols:mode=node;",',
    '        "Noto Sans Symbols2:mode=node;",',
    '        "DejaVu Sans:mode=node;",',
    '      })',
    '    end)',
    '    if ok then',
    '      pp_emoji_fallback_ok = true',
    '    else',
    '      texio.write_nl("log", "[pageperfect] emoji fallback registration failed: " .. tostring(err))',
    '    end',
    '  else',
    '    texio.write_nl("log", "[pageperfect] luaotfload.add_fallback not available — emoji fallback disabled")',
    '  end',
    '}',
  ].join('\n');

  // Inject the fallback registration BEFORE \setmainfont in the template
  const fontspecIdx = tplContent.indexOf('\\usepackage{fontspec}');
  if (fontspecIdx !== -1) {
    // Insert after \usepackage{fontspec}
    const insertPos = tplContent.indexOf('\n', fontspecIdx);
    if (insertPos !== -1) {
      tplContent = tplContent.slice(0, insertPos + 1)
        + '\n' + emojiFallbackLua + '\n'
        + tplContent.slice(insertPos + 1);
    }
  }

  // Patch \setmainfont to CONDITIONALLY include the fallback RawFeature.
  // Uses \directlua{tex.sprint()} which is fully expandable in LuaTeX —
  // the expansion happens before fontspec processes the option list.
  //
  // Handles BOTH fontspec syntaxes:
  //   Old: \setmainfont[Options]{Font}
  //   New: \setmainfont{Font}[Options]   (fontspec ≥ 2.5)
  tplContent = tplContent.replace(
    /\\setmainfont(?:\[([^\]]*)\])?\{([^}]+)\}(?:\[([^\]]*)\])?/,
    (match, preOpts, fontName, postOpts) => {
      const existingOpts = preOpts || postOpts || '';
      if (existingOpts.includes('fallback=')) return match; // already has fallback
      const conditionalFallback = '\\directlua{if pp_emoji_fallback_ok then tex.sprint(",RawFeature={fallback=emojifallback}") end}';
      // Normalize to [options]{font} syntax with conditional emoji fallback
      const opts = existingOpts
        ? `${existingOpts}${conditionalFallback}`
        : `Ligatures=TeX${conditionalFallback}`;
      return `\\setmainfont[${opts}]{${fontName}}`;
    }
  );

  await fsp.writeFile(path.join(tmpBase, 'template.latex'), tplContent, 'utf8');

  // Preamble assembly
  const preamble = [`\\geometry{${geo}}`];
  let buildMeta;
  try {
    preamble.push(bookEngineering.generateEngineeringPreamble(templateType));
    const scripts = multilingual.detectScripts(effectiveMd);
    if (scripts.isMultiscript || scripts.hasRTL)
      preamble.push(multilingual.generateMultilingualPreamble(scripts));

    buildMeta = provenance.generateBuildMetadata({
      manuscriptText, template: tplKey, pageSize, marginPreset, safeMode, compileMode, title,
      outputFormat: wantPdfX ? 'pdfx1a' : 'pdf',
      headingVariant, needsWatermark, customFonts: customFonts || null,
    });
    preamble.push(provenance.generateMetadataPreamble(buildMeta));

    if (extensions && typeof extensions === 'object' && Object.keys(extensions).length > 0) {
      const ext = templateExtensions.validateExtensions(extensions, templateType);
      if (ext.valid) preamble.push(templateExtensions.generateExtensionPreamble(ext.resolvedTokens));
      else warnings.push(`Extension errors: ${ext.errors.map(e => e.error).join('; ')}`);
    }

    const vp = headingVariants.getVariantPreamble(tplKey, headingVariant);
    if (vp) preamble.push(vp);
    if (needsWatermark) preamble.push(watermark.generateWatermarkPreamble());

    // ── Template-specific preamble injections ──

    // Lettrine drop caps for fiction/literary templates
    if (textNormalizer.DROP_CAP_TEMPLATES.has(tplKey)) {
      preamble.push([
        '% ── Drop Cap (lettrine) ──',
        '\\usepackage{lettrine}',
        '\\renewcommand{\\LettrineFontHook}{\\bfseries}',
        '\\setcounter{DefaultLines}{3}',
      ].join('\n'));
    }

    // Underscore protection for technical templates
    // (Also added directly in operator.latex and matrix.latex as belt-and-suspenders)
    if (textNormalizer.UNDERSCORE_TEMPLATES.has(tplKey)) {
      preamble.push([
        '% ── Underscore protection ──',
        '% Allows underscores in text mode without crashing (user_id, api_key)',
        '\\ifdefined\\underscore\\else\\usepackage{underscore}\\fi',
      ].join('\n'));
    }
  } catch (err) {
    let debugFiles = [];
    let debugHeaderTex = null;
    try { debugFiles = fs.readdirSync(tmpBase); } catch {}
    try {
      const hp = path.join(tmpBase, 'header.tex');
      if (fs.existsSync(hp)) debugHeaderTex = fs.readFileSync(hp, 'utf8');
    } catch {}
    try { fs.rmSync(tmpBase, { recursive: true, force: true }); } catch {}
    return {
      success: false, error: 'preamble_error', message: String(err), warnings,
      debug: { texSource: null, latexLog: null, headerTex: debugHeaderTex, filesInDir: debugFiles, captureError: null },
    };
  }

  await fsp.writeFile(path.join(tmpBase, 'header.tex'), preamble.join('\n\n'), 'utf8');

  // ── Pre-flight: disk space check ──
  // LuaLaTeX needs /tmp for .aux, .log, .toc, font cache, and PDF output.
  // If the filesystem is nearly full, the compile will fail with cryptic errors
  // ("I can't write on file", segfaults, truncated PDFs). Fail fast with a clear message.
  try {
    const tmpStats = await fsp.statfs(tmpBase);
    const freeBytes = tmpStats.bavail * tmpStats.bsize;
    const freeMB = Math.round(freeBytes / (1024 * 1024));
    if (freeBytes < 50 * 1024 * 1024) {
      log.warn({ jobId: job.id, freeMB }, 'Insufficient disk space for compilation');
      let debugFiles = [];
      try { debugFiles = fs.readdirSync(tmpBase); } catch {}
      try { fs.rmSync(tmpBase, { recursive: true, force: true }); } catch {}
      return {
        success: false, error: 'disk_full',
        message: `Insufficient disk space (${freeMB} MB free). The server needs at least 50 MB to compile a PDF. Please try again later.`,
        warnings,
        debug: { texSource: null, latexLog: null, headerTex: null, filesInDir: debugFiles, captureError: null, freeMB },
      };
    }
  } catch (err) {
    // statfs not available (Node < 18.15) or other error — proceed anyway
    log.debug({ err: err.message }, 'Disk space check skipped');
  }

  // Pandoc spawn
  const hardBreaks = tplKey === 'verse' ? '+hard_line_breaks' : '';

  // ── Template-aware Pandoc format flags ──
  // Disable tex_math_dollars for non-academic templates to prevent
  // "$50 on the first job" from crashing LaTeX as a math expression.
  const disableMath = !textNormalizer.MATH_TEMPLATES.has(tplKey)
    ? '-tex_math_dollars' : '';

  // Enable fenced_divs for cinema template (Fountain screenplay divs)
  const fencedDivs = tplKey === 'cinema' ? '+fenced_divs' : '';

  const fromFmt = safeMode
    ? `--from=markdown${hardBreaks}${fencedDivs}${disableMath}-raw_tex-raw_attribute`
    : PANDOC_HAS_CITEPROC
      ? `--from=markdown+citations${hardBreaks}${fencedDivs}${disableMath}-raw_tex-raw_attribute`
      : `--from=markdown${hardBreaks}${fencedDivs}${disableMath}-raw_tex-raw_attribute`;

  // ── Lua filters ──
  const luaFilters = [];
  const filtersDir = path.join(__dirname, 'filters');

  // Vertical-mode fix — prevents titlesec "entered in horizontal mode" error
  // by inserting \par before every heading in the Pandoc AST. Applied to all
  // templates universally; \par is a no-op when already in vertical mode.
  luaFilters.push('--lua-filter', path.join(filtersDir, 'heading-vmode.lua'));

  // Drop-cap filter for fiction/literary book-class templates
  if (textNormalizer.DROP_CAP_TEMPLATES.has(tplKey)) {
    luaFilters.push('--lua-filter', path.join(filtersDir, 'drop-cap.lua'));
  }

  // Table safety filter for editorial/multi-column templates
  if (textNormalizer.TABLE_SAFETY_TEMPLATES.has(tplKey)) {
    luaFilters.push('--lua-filter', path.join(filtersDir, 'table-safety.lua'));
  }

  // Fountain screenplay filter for cinema template
  if (tplKey === 'cinema') {
    luaFilters.push('--lua-filter', path.join(filtersDir, 'fountain.lua'));
  }

  // Determine top-level division from template class (article → section, book → chapter)
  const tplClass = headingVariants.TEMPLATE_CLASS[tplKey] || 'article';
  const topLevelDiv = tplClass === 'book' ? 'chapter' : 'section';

  const args = [
    mdPath, fromFmt, '--pdf-engine=lualatex',
    `--top-level-division=${topLevelDiv}`,
    `--resource-path=${tmpBase}`,
    '-M', `title=${safeTitle}`,
    `--template=${path.join(tmpBase, 'template.latex')}`,
    '-H', path.join(tmpBase, 'header.tex'),
    '-V', `mainfont=${mainFont}`,
    ...(isFast ? [] : ['-V', 'microtype=true', '-V', 'csquotes=true']),
    ...luaFilters,
    '-o', pdfPath,
    ...(safeMode ? [] : citeprocArgs(BIB_PATH)),
  ];

  const startTs = Date.now();
  const result = await new Promise((resolve) => {
    let proc;
    try { proc = spawn('pandoc', args, { cwd: tmpBase, env: SAFE_SPAWN_ENV }); }
    catch (e) { resolve({ ok: false, error: 'spawn_failed', message: String(e) }); return; }

    let stderr = '';
    let stderrBytes = 0;
    proc.stderr.on('data', (d) => { if (stderrBytes < MAX_STDERR_BYTES) { stderr += d.toString(); stderrBytes += d.length; } });
    proc.on('error', (e) => resolve({ ok: false, error: 'spawn_failed', message: String(e) }));

    let timedOut = false;
    const kill = setTimeout(() => { timedOut = true; try { proc.kill('SIGKILL'); } catch {} }, COMPILE_TIMEOUT_MS);

    proc.on('close', (code) => {
      clearTimeout(kill);
      if (timedOut) { resolve({ ok: false, error: 'compile_timeout', stderr }); return; }
      if (code === 0 && fs.existsSync(pdfPath)) {
        resolve({ ok: true, stderr, elapsed: Date.now() - startTs });
      } else {
        resolve({ ok: false, error: 'compile_failed', stderr });
      }
    });
  });

  if (!result.ok) {
    // ── Capture debug artifacts before cleanup ──
    // SAFETY: The entire debug capture block is wrapped in try/catch so that
    // a throw during artifact collection (errorTranslator, sanitizeStderr, etc.)
    // can never prevent the failure result from being returned to BullMQ.
    let debugTexSource = null;
    let debugLatexLog = null;
    let debugHeaderTex = null;
    let debugFiles = [];
    let debugCaptureError = null;

    try {
      try { debugFiles = fs.readdirSync(tmpBase); } catch {}

      // Read LuaLaTeX .log file (name varies by engine invocation)
      for (const f of debugFiles) {
        if (f.endsWith('.log')) {
          try {
            const raw = fs.readFileSync(path.join(tmpBase, f), 'utf8');
            debugLatexLog = sanitizeStderr(raw).substring(0, 100000);
          } catch {}
          break;
        }
      }

      // Read the preamble we injected
      const headerPath = path.join(tmpBase, 'header.tex');
      if (fs.existsSync(headerPath)) {
        try { debugHeaderTex = fs.readFileSync(headerPath, 'utf8'); } catch {}
      }

      // Generate .tex source for diagnostics (no LuaLaTeX — just Pandoc template rendering)
      try {
        const texPath = path.join(tmpBase, 'debug-output.tex');
        const texArgs = args.map(a => a === pdfPath ? texPath : a);
        const texProc = spawn('pandoc', texArgs, { cwd: tmpBase, env: SAFE_SPAWN_ENV });
        await new Promise((resolve) => {
          const t = setTimeout(() => { try { texProc.kill('SIGKILL'); } catch {} resolve(); }, 10000);
          texProc.on('close', () => { clearTimeout(t); resolve(); });
          texProc.on('error', () => { clearTimeout(t); resolve(); });
        });
        if (fs.existsSync(texPath)) {
          debugTexSource = fs.readFileSync(texPath, 'utf8').substring(0, 100000);
        }
      } catch {}
    } catch (captureErr) {
      debugCaptureError = String(captureErr);
      log.error({ jobId: job.id, err: captureErr.message }, 'Debug artifact capture threw — returning partial debug');
    }

    // NOW clean up
    try { fs.rmSync(tmpBase, { recursive: true, force: true }); } catch {}

    // Build the failure response — also wrapped so errorTranslator/sanitizeStderr can't throw us out
    let structuredErrors = [];
    let fallbackMessage = 'Compilation failed.';
    let detail = null;
    const stderr = result.stderr || '';
    try {
      const translated = errorTranslator.translateCompileFailure(
        stderr, { safeMode, errorCode: result.error }
      );
      structuredErrors = translated.errors;
      fallbackMessage = translated.fallbackMessage;
    } catch (translErr) {
      log.error({ jobId: job.id, err: translErr.message }, 'errorTranslator.translateCompileFailure threw');
      fallbackMessage = stderr.split('\n').filter(l => l.trim()).slice(-5).join(' ') || 'Compilation failed.';
    }
    try {
      detail = sanitizeStderr(stderr.split('\n').slice(-80).join('\n'));
    } catch (sanErr) {
      log.error({ jobId: job.id, err: sanErr.message }, 'sanitizeStderr threw');
      detail = stderr.substring(0, 5000);
    }

    return {
      success: false, error: result.error || 'compile_failed',
      message: fallbackMessage, warnings,
      errors: structuredErrors,
      detail,
      debug: {
        texSource: debugTexSource,
        latexLog: debugLatexLog,
        headerTex: debugHeaderTex,
        filesInDir: debugFiles,
        captureError: debugCaptureError,
      },
    };
  }

  // PDF/X-1a conversion
  let finalPdfPath = pdfPath;
  let finalFormat = 'PDF';
  if (wantPdfX) {
    const pdfxPath = path.join(tmpBase, 'output-pdfx1a.pdf');
    const conv = await publishing.convertToPdfX1a(pdfPath, pdfxPath, safeTitle);
    if (!conv.success) {
      let debugFiles = [];
      try { debugFiles = fs.readdirSync(tmpBase); } catch {}
      try { fs.rmSync(tmpBase, { recursive: true, force: true }); } catch {}
      return {
        success: false, error: 'pdfx_conversion_failed', message: conv.error, warnings,
        debug: { texSource: null, latexLog: null, headerTex: null, filesInDir: debugFiles, captureError: null },
      };
    }
    finalPdfPath = pdfxPath;
    finalFormat = 'PDF/X-1a:2001';
  }

  const compileLog = bookEngineering.analyzeCompileLog(result.stderr);

  // Translate raw stderr into structured, human-readable errors
  const translatedErrors = errorTranslator.translateStderr(result.stderr);

  // Generate typography quality report (pre-analysis + compile log)
  let typographyReport = null;
  try {
    const preAnalysis = typographyAssurance.analyzeTypography({
      template: tplKey, pageSize, marginPreset, extensions,
    });
    typographyReport = typographyAssurance.generateTypographicReport(preAnalysis, compileLog);
  } catch (err) {
    log.warn({ err: err.message }, 'Typography report generation failed');
  }

  // Create export snapshot for provenance audit trail
  let exportSnapshot = null;
  if (buildMeta) {
    try {
      exportSnapshot = provenance.createExportSnapshot(buildMeta, {
        success: true,
        compileTimeMs: result.elapsed,
        preflightPassed: null, // preflight runs client-side separately
        lintIssueCount: compileLog.overfullBoxes.length + compileLog.underfullBoxes.length,
      });
    } catch (err) {
      log.warn({ err: err.message }, 'Export snapshot creation failed');
    }
  }

  return {
    success: true,
    pdfPath: finalPdfPath,
    tmpBase,
    elapsed: result.elapsed,
    buildId: buildMeta?.buildId,
    contentHash: buildMeta?.contentHash,
    needsWatermark,
    fontFallback: fontRes.isFallback ? `${fontRes.original} -> ${fontRes.resolved}` : null,
    compileLog: { overfull: compileLog.overfullBoxes.length, underfull: compileLog.underfullBoxes.length },
    translatedErrors: translatedErrors.summary.total > 0 ? translatedErrors : null,
    typographyReport: typographyReport ? {
      score: typographyReport.score,
      grade: typographyReport.grade,
      compileStats: typographyReport.compileStats || null,
    } : null,
    warnings,
    outputFormat: finalFormat,
    exportSnapshot,
    userId, userTier,
    isDownload,
    template: tplKey,
    pageSize,
    title,
  };
}

// buildErrorMessages() removed — now handled by errorTranslator.translateCompileFailure()

function compileEpub(tmpBase, mdPath, safeTitle, safeMode) {
  const epubPath = path.join(tmpBase, 'output.epub');
  const cssPath = path.join(__dirname, 'templates', 'epub-style.css');
  const args = [
    mdPath, '--to=epub3',
    `--resource-path=${tmpBase}`,
    '-M', `title=${safeTitle}`, '--epub-title-page=true',
    ...(fs.existsSync(cssPath) ? ['--css', cssPath] : []),
    '-o', epubPath,
    ...(safeMode ? [] : citeprocArgs(BIB_PATH)),
  ];
  return new Promise((resolve) => {
    let proc;
    try { proc = spawn('pandoc', args, { cwd: tmpBase, env: SAFE_SPAWN_ENV }); }
    catch (e) { try { fs.rmSync(tmpBase, { recursive: true, force: true }); } catch {} resolve({ success: false, error: 'spawn_failed', message: String(e) }); return; }
    let stderr = '';
    let stderrBytes = 0;
    proc.stderr.on('data', (d) => { if (stderrBytes < MAX_STDERR_BYTES) { stderr += d.toString(); stderrBytes += d.length; } });
    proc.on('error', () => { try { fs.rmSync(tmpBase, { recursive: true, force: true }); } catch {} resolve({ success: false, error: 'spawn_failed' }); });
    let timedOut = false;
    const kill = setTimeout(() => { timedOut = true; try { proc.kill('SIGKILL'); } catch {} }, COMPILE_TIMEOUT_MS);
    proc.on('close', (code) => {
      clearTimeout(kill);
      if (timedOut) { try { fs.rmSync(tmpBase, { recursive: true, force: true }); } catch {} resolve({ success: false, error: 'compile_timeout' }); return; }
      if (code === 0 && fs.existsSync(epubPath)) {
        resolve({ success: true, pdfPath: epubPath, tmpBase, elapsed: 0, outputFormat: 'EPUB3', isDownload: true });
      } else {
        try { fs.rmSync(tmpBase, { recursive: true, force: true }); } catch {}
        resolve({ success: false, error: 'epub_failed', detail: sanitizeStderr(stderr.split('\n').slice(-15).join('\n')) });
      }
    });
  });
}

module.exports = { processCompileJob };
