/**
 * Compile Utilities — Shared functions between index.js and compile-worker.js
 *
 * Eliminates code duplication for:
 *   - Pandoc version detection and citeproc args
 *   - stderr sanitization
 *   - Citation stripping
 *   - Missing citation/package parsing
 *   - Style warnings
 *   - Tier hierarchy
 */

'use strict';

const { execSync } = require('child_process');
const path = require('path');

// ── Pandoc version detection (single source of truth) ──
let PANDOC_HAS_CITEPROC = true;
let PANDOC_VERSION = 'unknown';
try {
  const versionOutput = execSync('pandoc --version', { encoding: 'utf8', timeout: 5000 });
  const match = versionOutput.match(/pandoc(?:\.exe)?\s+(\d+)\.(\d+)(?:\.(\d+))?/);
  if (match) {
    const major = parseInt(match[1], 10);
    const minor = parseInt(match[2], 10);
    PANDOC_VERSION = `${match[1]}.${match[2]}${match[3] ? '.' + match[3] : ''}`;
    PANDOC_HAS_CITEPROC = major > 2 || (major === 2 && minor >= 11);
  }
} catch {
  // Pandoc not found — assume built-in citeproc (modern installs)
}

/**
 * Returns Pandoc arguments for citation processing.
 * @param {string} bibPath — path to .bib file
 * @returns {string[]}
 */
function citeprocArgs(bibPath) {
  if (PANDOC_HAS_CITEPROC) {
    return ['--citeproc', `--bibliography=${bibPath}`];
  }
  return ['--filter', 'pandoc-citeproc', `--bibliography=${bibPath}`];
}

/**
 * Sanitize stderr before sending to clients.
 * Strips server paths to prevent leaking container architecture.
 * @param {string} raw
 * @returns {string}
 */
function sanitizeStderr(raw) {
  return String(raw)
    .replace(/\/tmp\/pp-[a-zA-Z0-9_-]+\//g, '[workspace]/')
    .replace(/\/home\/[a-zA-Z0-9_-]+\//g, '[home]/')
    .replace(/\/app\/[a-zA-Z0-9_/-]*templates\//g, '[templates]/')
    .replace(/\/usr\/local\/[a-zA-Z0-9_/-]+/g, '[system]');
}

/**
 * Strip citation syntax from Markdown for safe mode compilation.
 * Only strips Pandoc citation patterns [@key], not bare @mentions.
 * @param {string} md
 * @returns {string}
 */
function stripCitations(md) {
  // Strip bracketed citations: [@key], [@key1; @key2], [see @key, p. 5]
  let out = md.replace(/\[[^[\]]*@[^[\]]*\]/g, '(citation)');
  // Strip bare citation keys that look like Pandoc citations (preceded by word boundary)
  out = out.replace(/(?<=\s|^)@([A-Za-z0-9:_-]+)/g, '$1');
  return out;
}

/**
 * Detect style warnings in manuscript text.
 * @param {string} md
 * @returns {string[]}
 */
function styleWarnings(md) {
  const warnings = [];
  if (/[.!?]\s{2,}[A-Z(]/g.test(md)) {
    warnings.push('Detected double spaces after punctuation. Consider using a single space.');
  }
  return warnings;
}

/**
 * Extract undefined citation keys from LaTeX/Pandoc stderr.
 * @param {string} stderr
 * @returns {string[]}
 */
function parseMissingCitations(stderr) {
  const keys = new Set();
  const patterns = [
    /Undefined citation\s*[: ]\s*'([^']+)'/gi,
    /citation ['"]?([A-Za-z0-9:_-]+)['"]?\s+undefined/gi,
    /reference\s+([A-Za-z0-9:_-]+)\s+not found/gi,
    /could not find citation\s+['"]?([A-Za-z0-9:_-]+)['"]?/gi,
  ];
  for (const re of patterns) {
    let m;
    while ((m = re.exec(stderr)) !== null) keys.add(m[1]);
  }
  return [...keys];
}

/**
 * Extract missing LaTeX package names from stderr.
 * @param {string} stderr
 * @returns {string[]}
 */
function parseMissingPackages(stderr) {
  const pkgs = new Set();
  const re = /LaTeX Error:\s*File\s+[`']([^`']+)\.sty['`]\s+not found/gi;
  let m;
  while ((m = re.exec(stderr)) !== null) pkgs.add(m[1]);
  return [...pkgs];
}

// ── Tier hierarchy (shared between index.js and compile-worker.js) ──
const TIER_LEVEL = { anonymous: 0, drafter: 1, publisher: 2, studio: 3 };

/**
 * Check if a user tier meets or exceeds a required tier.
 * @param {string} userTier
 * @param {string} requiredTier
 * @returns {boolean}
 */
function hasTier(userTier, requiredTier) {
  return (TIER_LEVEL[userTier] || 0) >= (TIER_LEVEL[requiredTier] || 0);
}

// ── PocketBase config detection ──
const POCKETBASE_URL = (process.env.POCKETBASE_URL || '').replace(/\/+$/, '');
const isPocketBaseConfigured = !!(POCKETBASE_URL && process.env.POCKETBASE_ADMIN_EMAIL);

/**
 * Default bibliography path
 */
const BIB_PATH = path.resolve(__dirname, 'references/references.bib');

module.exports = {
  PANDOC_HAS_CITEPROC,
  PANDOC_VERSION,
  citeprocArgs,
  sanitizeStderr,
  stripCitations,
  styleWarnings,
  parseMissingCitations,
  parseMissingPackages,
  TIER_LEVEL,
  hasTier,
  POCKETBASE_URL,
  isPocketBaseConfigured,
  BIB_PATH,
};
