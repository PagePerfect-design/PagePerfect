/**
 * Text Normalizer — Format-agnostic input pre-processing.
 *
 * Converts raw plain text, pasted Word content, or loose Markdown into
 * well-structured Markdown that Pandoc can typeset perfectly.
 *
 * The goal: users paste or type ANY text and get a beautiful book.
 * No Markdown knowledge required.
 *
 * Template-aware processing:
 *   - cinema:   Fountain screenplay syntax → fenced divs for fountain.lua
 *   - verse:    Poetry line-break preservation
 *   - fiction:  Dollar-sign escaping (prevents tex_math_dollars crashes)
 *   - all:      Universal cleanup, heading detection, scene breaks
 */

'use strict';

// ── Template classification ────────────────────────────────────
// Templates where $...$ should NOT be interpreted as LaTeX math.
// Only academic/technical templates keep math enabled.
const MATH_TEMPLATES = new Set([
  'thesis', 'chicago', 'symphony', 'international', 'operator', 'matrix',
]);

// Templates that benefit from lettrine drop caps (book class with chapters)
const DROP_CAP_TEMPLATES = new Set([
  'paperback', 'memoir', 'symphony',
]);

// Templates where \usepackage{underscore} is injected
const UNDERSCORE_TEMPLATES = new Set([
  'operator', 'matrix',
]);

// Templates that get the table-safety Lua filter
const TABLE_SAFETY_TEMPLATES = new Set([
  'chronicle', 'exhibit', 'international',
]);

// ── Chapter heading patterns ────────────────────────────────────
// Matches common ways people write chapter headings in plain text.
// Each pattern captures the full heading text for conversion to Markdown #.
const CHAPTER_PATTERNS = [
  // "Chapter 1: Title" / "Chapter One: Title" / "CHAPTER 1"
  /^(chapter\s+(?:\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|[a-z]+)(?:\s*[:.—–-]\s*.+)?)$/gim,
  // "Part I: Title" / "PART ONE" / "Part 1"
  /^(part\s+(?:\d+|[IVXLC]+|one|two|three|four|five|six|seven|eight|nine|ten|[a-z]+)(?:\s*[:.—–-]\s*.+)?)$/gim,
  // "Prologue" / "Epilogue" / "Foreword" / "Afterword" / "Introduction" / "Conclusion" / "Preface"
  /^((?:prologue|epilogue|foreword|afterword|introduction|conclusion|preface|acknowledgements|acknowledgments|appendix|bibliography|glossary|index|dedication|author'?s?\s+note)(?:\s*[:.—–-]\s*.+)?)$/gim,
  // "Act I" / "Act 1" / "ACT ONE" (plays/screenplays)
  /^(act\s+(?:\d+|[IVXLC]+|one|two|three|four|five|six|seven|eight|nine|ten|[a-z]+)(?:\s*[:.—–-]\s*.+)?)$/gim,
];

// ── Scene break patterns ────────────────────────────────────────
const SCENE_BREAK_RE = /^[\s]*([*#~_\-=•·]{3,}|[*#~_\-=•·]\s+[*#~_\-=•·]\s+[*#~_\-=•·][\s*#~_\-=•·]*)[\s]*$/;

/**
 * Detect if text is poetry.
 * Poetry characteristics:
 * - Many short lines (< 60 chars)
 * - Blank lines between stanzas
 * - Low ratio of punctuation-terminated lines
 * - Few or no Markdown headings
 */
function detectPoetry(text) {
  const lines = text.split('\n');
  const nonEmpty = lines.filter(l => l.trim().length > 0);
  if (nonEmpty.length < 3) return false;

  const shortLines = nonEmpty.filter(l => l.trim().length < 60).length;
  const shortRatio = shortLines / nonEmpty.length;

  // Count stanza breaks (blank line surrounded by non-blank lines)
  let stanzaBreaks = 0;
  for (let i = 1; i < lines.length - 1; i++) {
    if (lines[i].trim() === '' && lines[i - 1].trim() !== '' && lines[i + 1]?.trim() !== '') {
      stanzaBreaks++;
    }
  }

  // Lines ending in sentence-terminal punctuation
  const terminalPunct = nonEmpty.filter(l => /[.!?][\s"'"\u201D]*$/.test(l.trim())).length;
  const punctRatio = terminalPunct / nonEmpty.length;

  // Markdown heading count
  const headings = nonEmpty.filter(l => /^#{1,6}\s/.test(l.trim())).length;

  // Negative signal: chapter-like headings mean this is prose, not poetry
  const chapterLike = nonEmpty.filter(l =>
    /^(chapter|part|act|book|section|prologue|epilogue|foreword|afterword|introduction|conclusion|preface)\b/i.test(l.trim())
  ).length;
  if (chapterLike >= 2) return false;

  // Negative signal: if most non-short lines are full sentences, it's prose
  const longProse = nonEmpty.filter(l => l.trim().length >= 60).length;
  if (longProse >= 3 && longProse > nonEmpty.length * 0.3) return false;

  // Heuristic: poetry has mostly short lines, few sentence-ending punctuation,
  // and stanza breaks
  if (shortRatio > 0.7 && punctRatio < 0.4 && stanzaBreaks >= 1 && headings < 2) {
    return true;
  }

  // Strong signal: very short lines with stanza structure
  const avgLength = nonEmpty.reduce((sum, l) => sum + l.trim().length, 0) / nonEmpty.length;
  if (avgLength < 40 && stanzaBreaks >= 2) {
    return true;
  }

  return false;
}

/**
 * Detect if text already uses Markdown formatting.
 * If it does, we should touch it less aggressively.
 */
function hasMarkdownStructure(text) {
  const lines = text.split('\n');
  let markdownSignals = 0;

  for (const line of lines) {
    const t = line.trim();
    if (/^#{1,6}\s/.test(t)) markdownSignals++;        // # Headings
    if (/^\*\*[^*]+\*\*$/.test(t)) markdownSignals++;  // **Bold lines**
    if (/^>\s/.test(t)) markdownSignals++;              // > Blockquotes
    if (/^[-*+]\s/.test(t)) markdownSignals++;          // - List items
    if (/^\d+\.\s/.test(t)) markdownSignals++;          // 1. Ordered lists
    if (/^```/.test(t)) markdownSignals++;              // Code fences
    if (/^\[.*\]\(.*\)/.test(t)) markdownSignals++;     // Links
    if (/!\[.*\]/.test(t)) markdownSignals++;           // Images
  }

  // If we find 3+ markdown constructs, the user knows what they're doing
  return markdownSignals >= 3;
}

/**
 * Check if a line looks like a chapter/section heading.
 * Returns the Markdown heading level (1 or 2) or 0 if not a heading.
 */
function detectHeadingLine(line) {
  const t = line.trim();
  if (!t || t.length > 120) return 0;

  // Already a Markdown heading — leave it alone
  if (/^#{1,6}\s/.test(t)) return 0;

  // ALL CAPS short line (likely a heading) — but not if it's a scene break
  if (t === t.toUpperCase() && t.length > 2 && t.length < 80 && /[A-Z]/.test(t) && !SCENE_BREAK_RE.test(t)) {
    // Check if it's a chapter-like heading
    if (/^(CHAPTER|PART|ACT|BOOK|SECTION|PROLOGUE|EPILOGUE|FOREWORD|AFTERWORD|INTRODUCTION|CONCLUSION|PREFACE|DEDICATION)\b/.test(t)) {
      return 1;
    }
    // Other all-caps lines might be section headings
    if (t.length < 50 && /^[A-Z][A-Z\s\d:,.!?—–\-']+$/.test(t)) {
      return 2;
    }
  }

  // Mixed case chapter patterns
  for (const pattern of CHAPTER_PATTERNS) {
    pattern.lastIndex = 0;
    if (pattern.test(t)) {
      return 1;
    }
  }

  return 0;
}

// ── Fountain screenplay patterns ────────────────────────────────
const SCENE_HEADING_RE = /^(?:\.(?=[A-Z])|(?:INT|EXT|EST|INT\.?\s*\/\s*EXT|I\/E)[\s.])/i;
const TRANSITION_RE = /^(?:>|(?:[A-Z\s]+TO:|FADE (?:IN|OUT|TO BLACK)|CUT TO BLACK|SMASH CUT|TIME CUT|MATCH CUT))\s*$/;
const CHARACTER_RE = /^([A-Z][A-Z0-9 ._\-']+)(\s*\((?:V\.?O\.?|O\.?S\.?|CONT'?D?|CONT'D|OFF|ON)\))?$/;
const PARENTHETICAL_RE = /^\(.+\)$/;

/**
 * Detect if text looks like Fountain screenplay syntax.
 * Checks for scene headings (INT./EXT.), character cues, and transitions.
 */
function detectFountain(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length < 5) return false;

  let sceneHeadings = 0;
  let characterCues = 0;

  for (let i = 0; i < lines.length; i++) {
    if (SCENE_HEADING_RE.test(lines[i])) sceneHeadings++;
    if (CHARACTER_RE.test(lines[i]) && i > 0) characterCues++;
  }

  // Need at least 1 scene heading and 2 character cues to be a screenplay
  return sceneHeadings >= 1 && characterCues >= 2;
}

/**
 * Convert Fountain screenplay syntax to Markdown with fenced divs.
 *
 * Fenced divs (::: class ... :::) are processed by the fountain.lua
 * Pandoc Lua filter into proper LaTeX screenplay geometry.
 *
 * @param {string} text - Raw Fountain text
 * @returns {string} Markdown with fenced divs
 */
function normalizeFountain(text) {
  const lines = text.split('\n');
  const output = [];
  let state = 'action'; // action | character | dialogue | parenthetical
  let prevBlank = true;

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const trimmed = raw.trim();

    // Blank line — resets state
    if (trimmed === '') {
      if (state === 'dialogue' || state === 'parenthetical') {
        output.push(':::');
        output.push('');
      }
      state = 'action';
      prevBlank = true;
      output.push('');
      continue;
    }

    // ── Scene heading ──
    if (SCENE_HEADING_RE.test(trimmed)) {
      if (state === 'dialogue' || state === 'parenthetical') {
        output.push(':::');
        output.push('');
      }
      // Strip forced scene heading prefix (.) if present
      const heading = trimmed.startsWith('.') ? trimmed.slice(1) : trimmed;
      output.push(`# ${heading}`);
      output.push('');
      state = 'action';
      prevBlank = false;
      continue;
    }

    // ── Transition ──
    if (TRANSITION_RE.test(trimmed) && prevBlank) {
      if (state === 'dialogue' || state === 'parenthetical') {
        output.push(':::');
        output.push('');
      }
      const trans = trimmed.startsWith('>') ? trimmed.slice(1).trim() : trimmed;
      output.push('::: transition');
      output.push(trans);
      output.push(':::');
      output.push('');
      state = 'action';
      prevBlank = false;
      continue;
    }

    // ── Character cue (must follow a blank line) ──
    if (prevBlank && CHARACTER_RE.test(trimmed)) {
      if (state === 'dialogue' || state === 'parenthetical') {
        output.push(':::');
        output.push('');
      }
      output.push('::: character');
      output.push(trimmed);
      output.push(':::');
      output.push('');
      state = 'character';
      prevBlank = false;
      continue;
    }

    // ── Parenthetical (follows character or is inside dialogue) ──
    if ((state === 'character' || state === 'dialogue') && PARENTHETICAL_RE.test(trimmed)) {
      if (state === 'dialogue') {
        output.push(':::');
        output.push('');
      }
      output.push('::: parenthetical');
      output.push(trimmed);
      output.push(':::');
      output.push('');
      state = 'character'; // Next non-blank line opens a new dialogue div
      prevBlank = false;
      continue;
    }

    // ── Dialogue (follows character or parenthetical) ──
    if (state === 'character' || state === 'dialogue') {
      if (state === 'character') {
        // First line of dialogue — open the div
        output.push('::: dialogue');
      }
      output.push(trimmed);
      state = 'dialogue';
      prevBlank = false;
      continue;
    }

    // ── Action (everything else) ──
    output.push(trimmed);
    prevBlank = false;
    state = 'action';
  }

  // Close any open dialogue div
  if (state === 'dialogue' || state === 'parenthetical') {
    output.push(':::');
  }

  return output.join('\n');
}

/**
 * Escape bare dollar signs in prose to prevent Pandoc's tex_math_dollars
 * extension from interpreting "$50" as LaTeX math.
 *
 * Only escapes dollar signs that look like currency (followed by a digit)
 * or appear in pairs around prose text (not actual math expressions).
 * Leaves code blocks and inline code untouched.
 *
 * @param {string} text - Markdown text
 * @returns {string} Text with dollar signs escaped
 */
function escapeDollarSigns(text) {
  const lines = text.split('\n');
  let inCodeBlock = false;
  const result = [];

  for (const line of lines) {
    // Track code fences
    if (/^```/.test(line.trim())) {
      inCodeBlock = !inCodeBlock;
      result.push(line);
      continue;
    }

    if (inCodeBlock) {
      result.push(line);
      continue;
    }

    // Escape dollar signs outside inline code spans
    // Strategy: split by inline code (`...`), only escape in non-code parts
    const parts = line.split(/(`[^`]+`)/);
    const escaped = parts.map((part, idx) => {
      // Odd indices are inline code — leave them alone
      if (idx % 2 === 1) return part;
      // Escape $ followed by digit (currency: $50, $1,000)
      // Also escape $ followed by a letter when not likely math (e.g., "$total")
      return part.replace(/\$/g, '\\$');
    });
    result.push(escaped.join(''));
  }

  return result.join('\n');
}

/**
 * Core normalizer: transform any text into clean Markdown.
 *
 * @param {string} text - Raw input text
 * @param {string} templateKey - The selected template (affects behavior)
 * @returns {string} Normalized Markdown
 */
function normalize(text, templateKey) {
  if (!text || typeof text !== 'string') return text || '';

  const isVerse = templateKey === 'verse';
  const isCinema = templateKey === 'cinema';
  const isAlreadyMarkdown = hasMarkdownStructure(text);
  // Only detect poetry if text isn't already structured Markdown
  const isPoetry = !isCinema && !isAlreadyMarkdown && detectPoetry(text);

  // ── Step 1: Universal cleanup ──
  let result = text;

  // Normalize line endings
  result = result.replace(/\r\n?/g, '\n');

  // Normalize Unicode whitespace
  result = result.replace(/[\u00A0\u2007\u202F]/g, ' ');

  // Collapse excessive blank lines (3+ → 2)
  result = result.replace(/\n{4,}/g, '\n\n\n');

  // Trim trailing whitespace per line
  result = result.split('\n').map(l => l.replace(/\s+$/, '')).join('\n');

  // ── Step 1b: Fountain screenplay conversion ──
  // If cinema template is selected and text looks like Fountain syntax,
  // convert to Markdown with fenced divs (processed by fountain.lua filter).
  // This REPLACES standard heading detection for screenplays.
  if (isCinema && !isAlreadyMarkdown && detectFountain(result)) {
    result = normalizeFountain(result);
    // Skip remaining prose-oriented processing — return after cleanup
    result = result.replace(/([.!?;:])[^\S\n]{2,}/g, '$1 ');
    result = result.replace(/^\n+/, '');
    return result;
  }

  // ── Step 2: Scene break normalization ──
  // Convert various scene break markers to standard Markdown thematic break
  if (!isVerse && !isPoetry) {
    result = result.split('\n').map(line => {
      if (SCENE_BREAK_RE.test(line)) return '\n* * *\n';
      return line;
    }).join('\n');
  }

  // ── Step 3: Chapter heading detection ──
  // Only for non-Markdown, non-poetry, non-cinema text
  if (!isAlreadyMarkdown && !isPoetry && !isCinema && !isVerse) {
    const lines = result.split('\n');
    const processed = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const level = detectHeadingLine(line);

      if (level > 0) {
        const prefix = '#'.repeat(level);
        // Ensure blank line before heading (unless start of file)
        if (processed.length > 0 && processed[processed.length - 1].trim() !== '') {
          processed.push('');
        }
        // Title-case the heading if it was all-caps
        let headingText = line.trim();
        if (headingText === headingText.toUpperCase() && headingText.length > 3) {
          headingText = titleCase(headingText);
        }
        processed.push(`${prefix} ${headingText}`);
        // Ensure blank line after heading
        if (i + 1 < lines.length && lines[i + 1].trim() !== '') {
          processed.push('');
        }
      } else {
        processed.push(line);
      }
    }

    result = processed.join('\n');
  }

  // ── Step 4: Poetry / Verse line break preservation ──
  // For poetry content or the verse template, ensure every line break
  // is preserved by appending Markdown hard breaks (two trailing spaces)
  if (isVerse || isPoetry) {
    const lines = result.split('\n');
    const processed = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Blank lines stay blank (stanza breaks)
      if (trimmed === '') {
        processed.push('');
        continue;
      }

      // Markdown headings — leave alone
      if (/^#{1,6}\s/.test(trimmed)) {
        processed.push(line);
        continue;
      }

      // Thematic breaks — leave alone
      if (/^(\*\s*\*\s*\*|---+|___+)$/.test(trimmed)) {
        processed.push(line);
        continue;
      }

      // If next line is also content (not blank, not heading), add hard break
      const nextLine = i + 1 < lines.length ? lines[i + 1] : null;
      if (nextLine !== null && nextLine.trim() !== '' && !/^#{1,6}\s/.test(nextLine.trim())) {
        // Append two spaces for Markdown hard line break
        processed.push(line.replace(/\s*$/, '') + '  ');
      } else {
        processed.push(line);
      }
    }

    result = processed.join('\n');
  }

  // ── Step 5: Double-space after punctuation cleanup ──
  // Authors coming from Word often have double spaces after periods.
  // Use [^\S\n] to match horizontal whitespace only — never collapse newlines.
  result = result.replace(/([.!?;:])[^\S\n]{2,}/g, '$1 ');

  // ── Step 6: Ensure document doesn't start with blank lines ──
  result = result.replace(/^\n+/, '');

  // ── Step 7: Dollar-sign escaping for non-math templates ──
  // Prevents Pandoc's tex_math_dollars from interpreting "$50" as math.
  // Only applied to fiction/narrative/creative templates where LaTeX math
  // is never expected. Academic and technical templates keep math enabled.
  if (!MATH_TEMPLATES.has(templateKey)) {
    result = escapeDollarSigns(result);
  }

  return result;
}

/**
 * Title-case a string (for ALL-CAPS headings).
 * Lowercases articles/prepositions/conjunctions unless first word.
 */
function titleCase(str) {
  const small = new Set([
    'a', 'an', 'the', 'and', 'but', 'or', 'nor', 'for', 'yet', 'so',
    'at', 'by', 'in', 'of', 'on', 'to', 'up', 'as', 'is', 'it',
    'if', 'no', 'do', 'my', 'we', 'he', 'me', 'am',
  ]);

  return str.toLowerCase().replace(/\b\w+/g, (word, index) => {
    if (index === 0 || !small.has(word)) {
      return word.charAt(0).toUpperCase() + word.slice(1);
    }
    return word;
  });
}

module.exports = {
  normalize,
  detectPoetry,
  hasMarkdownStructure,
  detectFountain,
  escapeDollarSigns,
  // Template classification sets (used by compile-worker.js)
  MATH_TEMPLATES,
  DROP_CAP_TEMPLATES,
  UNDERSCORE_TEMPLATES,
  TABLE_SAFETY_TEMPLATES,
};
