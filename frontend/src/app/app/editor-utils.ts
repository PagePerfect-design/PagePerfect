/* ═══════════════════════════════════════════════════════════════════
   SHARED UTILITY FUNCTIONS — Editor
   ═══════════════════════════════════════════════════════════════════ */

import type { TemplateKey, PageSize, DetectedGenre, Analysis } from './editor-types'

/** Translate raw Typst engine errors into plain English. */
export function translateError(raw: string): string {
  const s = raw.trim()
  const patterns: [RegExp, (m: RegExpMatchArray) => string][] = [
    // ── Typst syntax/structure errors ──
    [/expected (identifier|expression|block|semicolon|comma)/i, (m) => `Syntax error: expected ${m[1]}. Check your manuscript for stray formatting characters.`],
    [/unexpected (token|character|end of|closing)/i, () => 'Unexpected character or token in the document. Check for stray formatting marks.'],
    [/unknown variable|cannot access field/i, () => 'Template configuration error. Try a different template or contact support.'],
    [/duplicate (key|field|parameter)/i, () => 'A duplicate setting was found in the template configuration. Try a different template.'],
    [/missing argument/i, () => 'Template configuration error — a required setting is missing. Try a different template.'],

    // ── Typst layout warnings ──
    [/content does not fit.*page/i, () => 'Content overflows the page. Try wider margins or a larger page size.'],
    [/layout did not converge/i, () => 'The page layout could not stabilize. Try simplifying complex sections.'],

    // ── Font errors (Typst) ──
    [/unknown font family.*"([^"]+)"/i, (m) => `The font "${m[1]}" is not available on the server. Try a different template.`],
    [/unknown font family/i, () => 'A font could not be found. Try a different template.'],
    [/font.*not found/i, () => 'A required font is not installed. Try a different template.'],
    [/failed to load font/i, () => 'A font could not be loaded. Try a different template.'],
    [/glyph not found|missing glyph/i, () => 'A character is not available in the current font. This may appear as a blank space in the PDF.'],

    // ── Citation/bibliography errors ──
    [/undefined reference|unknown citation/i, () => 'A citation key was not found in your bibliography. Check the key or switch to Standard Mode.'],
    [/bibliography.*not found|cannot.*\.bib/i, () => 'Bibliography file not found. Switch to Standard Mode to skip citations.'],
    [/Empty bibliography/i, () => 'Your bibliography section is empty. Add references or switch to Standard Mode.'],

    // ── Image/figure errors ──
    [/file not found.*\.(png|jpg|jpeg|svg|pdf)/i, (m) => `An image file (.${m[1]}) was not found. Check your file references.`],
    [/failed to (decode|load|parse) image/i, () => 'An image could not be processed. Try re-exporting it as PNG or JPG.'],
    [/unknown image format/i, () => 'An image uses an unsupported format. Convert it to PNG, JPG, or SVG.'],

    // ── Encoding errors ──
    [/Invalid UTF-?8/i, () => 'Your manuscript contains invalid characters. Copy-paste from a plain text editor to clean encoding.'],
    [/file is not valid utf-?8/i, () => 'A non-standard character was found. Try removing special symbols or copy-pasting from Notepad/TextEdit.'],

    // ── PDF/X conversion errors ──
    [/pdfx.*conversion.*fail/i, () => 'PDF/X-1a conversion failed. The document may contain unsupported transparency or color profiles. Try standard PDF export instead.'],
    [/Ghostscript.*error/i, () => 'Post-processing failed. Try exporting as standard PDF instead of PDF/X-1a.'],

    // ── Server/engine errors ──
    [/typst.*not found/i, () => 'Server configuration error. The typesetting engine is not available.'],
    [/pandoc.*not found/i, () => 'Server configuration error. The document converter is not available.'],
    [/timed?\s*out/i, () => 'Compilation timed out. Your manuscript may be too large — try splitting it into smaller sections.'],
    [/Compile failed \(status (\d+)\)/i, (m) => `The server returned an error (code ${m[1]}). Please try again.`],
    [/queue_full/i, () => 'The compile server is at capacity. Please wait a moment and try again.'],
    [/tier_required/i, () => 'This feature requires a paid plan. Upgrade to Publisher or Studio to access it.'],

    // ── Result/session errors (soft — auto-retry handles most of these) ──
    [/Preview expired/i, () => 'Your preview expired. Hit Recompile to refresh it.'],
    [/Result not found or expired/i, () => 'Your preview expired. Hit Recompile to refresh it.'],
    [/Result has expired/i, () => 'Your preview expired. Hit Recompile to refresh it.'],
    [/Server restarted.*recompile/i, () => 'The server restarted. Hit Recompile to refresh your preview.'],
    [/Job not found or expired/i, () => 'Your preview expired. Hit Recompile to refresh it.'],
    [/restart_expired/i, () => 'The server restarted. Hit Recompile to refresh your preview.'],
    [/Compile job expired/i, () => 'Your preview expired. Hit Recompile to refresh it.'],

    // ── Network errors ──
    [/Network disconnected/i, () => 'Lost connection to the compile server. Check your internet and retry.'],
    [/Network or server error/i, () => 'Could not reach the compile server. Check your connection or try again.'],
    [/Failed to retrieve compiled PDF/i, () => 'The PDF could not be retrieved. Click "Retry" to recompile.'],
    [/Failed to fetch|fetch failed|ERR_CONNECTION/i, () => 'Could not connect to the server. Check your internet connection.'],
  ]
  for (const [re, fn] of patterns) {
    const match = s.match(re)
    if (match) return fn(match)
  }
  return s
}

/** Suggest an actionable fix for a compile error. Returns null if no specific suggestion. */
export function suggestFix(raw: string): string | null {
  const s = raw.trim()
  const suggestions: [RegExp, string][] = [
    [/expected.*identifier|unexpected token|syntax error/i, 'Check for stray formatting characters in your manuscript'],
    [/undefined reference|unknown citation|citation.*not found/i, 'Toggle on Standard mode in Options to skip bibliography'],
    [/bibliography.*not found|cannot.*\.bib|Empty bibliography/i, 'Toggle on Standard mode in Options to skip bibliography'],
    [/content does not fit|overflows? the margin/i, 'Try wider margins or a larger page size'],
    [/font.*not (found|available)|cannot.*font|unknown font family/i, 'Try a different template'],
    [/timed?\s*out|timeout/i, 'Try Fast compile mode, or split into smaller sections'],
    [/layout did not converge|out of memory/i, 'Reduce image count or split into smaller sections'],
    [/file not found|failed to.*image/i, 'Check image file references'],
    [/Invalid UTF|invalid.*byte|not valid utf/i, 'Paste your text through a plain text editor to clean encoding'],
    [/unknown variable|missing argument|duplicate key/i, 'Try a different template'],
    [/queue_full|server.*capacity/i, 'Wait a moment and try again'],
  ]
  for (const [re, suggestion] of suggestions) {
    if (re.test(s)) return suggestion
  }
  return null
}

export function slug(s: string) {
  return s.toLowerCase().replace(/['']/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60)
}

export function sizeCode(size: PageSize) {
  const map: Record<PageSize, string> = {
    letter: 'letter', a4: 'a4', a5: 'a5', sixByNine: '6x9', fiveFiveByEightFive: '5.5x8.5',
    sevenByTen: '7x10', royal: 'royal', bFormat: 'b-format',
    massMarket: 'mass-market', aFormat: 'a-format', demy: 'demy',
    fiveTwentyFiveByEight: '5.25x8', crownQuarto: 'crown-quarto', b5: 'b5',
    amazonFiveByEight: 'amazon-5x8', amazonSixByNine: 'amazon-6x9',
    amazonSevenByTen: 'amazon-7x10', amazonEightByTen: 'amazon-8x10', amazonEightFiveByEleven: 'amazon-8.5x11',
  }
  return map[size] || 'letter'
}

export function timestamp() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`
}

export function buildFilename(title: string, t: TemplateKey, size: PageSize, ext = 'pdf') {
  return `${slug(title) || 'manuscript'}_${t}_${sizeCode(size)}_${timestamp()}.${ext}`
}

export function cleanFromWord(input: string): string {
  if (!input) return input
  let s = input
  s = s.replace(/\r\n?/g, '\n')
  s = s.replace(/[\u00A0\u2007\u202F]/g, ' ')
  s = s.replace(/\t/g, ' ')
  s = s.replace(/[\u201C\u201D\u201E\u201F\u00AB\u00BB]/g, '"')
  s = s.replace(/[\u2018\u2019\u2032]/g, "'")
  s = s.replace(/\u2026/g, '...')
  s = s.replace(/\s*[\u2013\u2014]\s*/g, ' — ')
  s = s.replace(/^[\s]*[•·]\s?/gm, '- ')
  s = s.replace(/\n{3,}/g, '\n\n')
  s = s.replace(/([.!?;:])\s{2,}/g, '$1 ')
  s = s.split('\n').map(l => l.replace(/\s+$/,'')).join('\n')
  return s
}

export function adjustHeadingsForTemplate(md: string, template: TemplateKey): string {
  if (template !== 'paperback') return md
  return md.replace(/^#\s+(chapter\b.*)$/gim, '## $1')
}

/**
 * Strategy 3: The "Sherlock" Detective — auto-detect genre from content.
 * Scans the first ~150 lines for structural signals.
 */
export function detectGenre(md: string): DetectedGenre | null {
  const head = md.split('\n').slice(0, 150).join('\n')
  const full = md

  // Poetry: short lines, stanza breaks, low punctuation ratio
  {
    const lines = full.split('\n')
    const nonEmpty = lines.filter((l: string) => l.trim().length > 0)
    if (nonEmpty.length >= 3) {
      const shortLines = nonEmpty.filter((l: string) => l.trim().length < 60).length
      const shortRatio = shortLines / nonEmpty.length
      let stanzaBreaks = 0
      for (let i = 1; i < lines.length - 1; i++) {
        if (lines[i].trim() === '' && lines[i - 1].trim() !== '' && lines[i + 1]?.trim() !== '') {
          stanzaBreaks++
        }
      }
      const terminalPunct = nonEmpty.filter((l: string) => /[.!?][\s"'"\u201D]*$/.test(l.trim())).length
      const punctRatio = terminalPunct / nonEmpty.length
      const headingCount = nonEmpty.filter((l: string) => /^#{1,6}\s/.test(l.trim())).length
      const avgLength = nonEmpty.reduce((sum: number, l: string) => sum + l.trim().length, 0) / nonEmpty.length

      if ((shortRatio > 0.7 && punctRatio < 0.4 && stanzaBreaks >= 1 && headingCount < 2) ||
          (avgLength < 40 && stanzaBreaks >= 2)) {
        return { genre: 'specialist', template: 'verse', confidence: 'high', message: 'Poetry detected. Applied Verse layout with preserved line breaks.' }
      }
    }
  }

  // Screenplay: INT./EXT./FADE IN/CUT TO
  if (/\b(INT\.|EXT\.|FADE IN|FADE OUT|CUT TO|DISSOLVE TO)\b/.test(head)) {
    return { genre: 'specialist', template: 'cinema', confidence: 'high', message: 'Screenplay detected. Applied Cinema format.' }
  }

  // Cookbook: Ingredients, measurements
  if (/\b(ingredients|tsp|tbsp|cups?|preheat|oven)\b/i.test(head) && /\b\d+\s*(tsp|tbsp|cups?|oz|ml|g)\b/i.test(full)) {
    return { genre: 'specialist', template: 'heirloom', confidence: 'high', message: 'Recipe format detected. Applied Heirloom cookbook layout.' }
  }

  // Technical manual: code blocks, warnings, admonitions
  const codeBlocks = (full.match(/^```/gm) || []).length
  if (codeBlocks >= 4 || /\b(WARNING|CAUTION|NOTE|TIP):\s/m.test(head)) {
    return { genre: 'specialist', template: 'operator', confidence: 'medium', message: 'Technical documentation detected. Applied Operator layout.' }
  }

  // Academic: Abstract, Bibliography, citations
  if (/\b(abstract|bibliography|references|acknowledgements)\b/im.test(head) || /\[@[^\]]+\]/.test(head)) {
    return { genre: 'nonfiction', template: 'chicago', confidence: 'medium', message: 'Academic structure detected. Applied Chicago scholarly style.' }
  }

  // Business/report: Executive Summary, KPIs, quarterly
  if (/\b(executive summary|quarterly|stakeholders?|KPIs?|fiscal)\b/i.test(head)) {
    return { genre: 'nonfiction', template: 'matrix', confidence: 'medium', message: 'Business report detected. Applied Matrix corporate style.' }
  }

  // Fiction signals: chapters, dialogue-heavy
  const dialogueLines = (head.match(/^[""\u201C]/gm) || []).length
  const chapterHeadings = (head.match(/^#{1,2}\s+(chapter|part|prologue|epilogue)\b/gim) || []).length
  if (chapterHeadings >= 2 || dialogueLines >= 5) {
    return { genre: 'fiction', template: 'paperback', confidence: 'low', message: 'Looks like fiction. Applied Paperback modern style.' }
  }

  return null
}

export function analyzeManuscript(md: string): Analysis {
  const mdHeadings = (md.match(/^#{1,2}\s+/gm) || []).length
  const plainChapters = (md.match(/^(chapter|part|act|prologue|epilogue|foreword|afterword|introduction|conclusion)\b/gim) || []).length
  const chapters = mdHeadings || plainChapters
  const words = md.split(/\s+/).filter(w => w.length > 0).length
  const images = (md.match(/!\[/g) || []).length
  const hasFrontmatter = md.trimStart().startsWith('---')
  const hasReferences = /\[@[^\]]+\]/.test(md)
  const detected = detectGenre(md)
  return { chapters, words, images, hasFrontmatter, hasReferences, detected }
}

export function wordCategory(count: number): string {
  if (count < 20000) return 'Short story'
  if (count < 50000) return 'Novella'
  if (count < 110000) return 'Novel'
  return 'Long-form'
}

/** Abortable delay — resolves after `ms` or rejects with AbortError when signal fires. */
export function abortableDelay(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) return reject(new DOMException('Aborted', 'AbortError'))
    const timer = setTimeout(resolve, ms)
    signal.addEventListener('abort', () => {
      clearTimeout(timer)
      reject(new DOMException('Aborted', 'AbortError'))
    }, { once: true })
  })
}
