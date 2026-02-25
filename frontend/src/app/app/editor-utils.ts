/* ═══════════════════════════════════════════════════════════════════
   SHARED UTILITY FUNCTIONS — Editor
   ═══════════════════════════════════════════════════════════════════ */

import type { TemplateKey, PageSize, DetectedGenre, Analysis } from './editor-types'

/** Translate raw pandoc/LuaLaTeX errors into plain English. */
export function translateError(raw: string): string {
  const s = raw.trim()
  const patterns: [RegExp, (m: RegExpMatchArray) => string][] = [
    // ── Special characters & math ──
    [/Missing \$ inserted/i, () => 'Your text contains a special character (like _ or ^) that needs escaping. Wrap math symbols in $...$ or remove them.'],
    [/Double superscript|Double subscript/i, () => 'Consecutive ^ or _ characters found. Use {braces} to group them, or remove the duplicates.'],
    [/Extra alignment tab/i, () => 'A table row has too many columns. Check that each row has the same number of & separators.'],

    // ── Command/structure errors ──
    [/Undefined control sequence.*\\(\w+)/i, (m) => `Unknown command "\\${m[1]}" in your manuscript. Remove it or check the spelling.`],
    [/Undefined control sequence/i, () => 'Your manuscript contains an unrecognized command. Check for stray backslashes.'],
    [/Missing \\begin\{document\}/i, () => 'Template configuration error. Try a different template or contact support.'],
    [/Runaway argument/i, () => 'Unmatched bracket or brace in your text. Check for missing } or ].'],
    [/Emergency stop/i, () => 'The typesetter encountered a critical error and stopped. Simplify your manuscript and try again.'],
    [/Too many unprocessed floats/i, () => 'Too many images or tables in a row without enough text between them. Add more text between figures, or break the section into smaller parts.'],
    [/Float\(s\) lost/i, () => 'An image or table could not be placed on the page. Try reducing the number of consecutive figures.'],

    // ── Page layout warnings (non-fatal but important for KDP) ──
    [/Overfull \\hbox.*?(\d+\.?\d*)pt/i, (m) => `Text on line overflows the margin by ${m[1]}pt. This may cause content to be cut off in print. Try rewording the paragraph or using a wider margin preset.`],
    [/Underfull \\hbox.*?badness (\d+)/i, (m) => {
      const badness = parseInt(m[1])
      return badness > 8000
        ? 'A line has excessive spacing between words. Try rewording the sentence for a more natural fit.'
        : 'Minor spacing adjustment on a line. This is usually fine for print.'
    }],
    [/Overfull \\vbox/i, () => 'A page has more content than it can hold. The engine will push extra content to the next page.'],
    [/Underfull \\vbox/i, () => 'A page has less content than ideal, leaving extra white space at the bottom. This is cosmetic only.'],

    // ── Font errors ──
    [/I can't find file.*`([^']+)'/i, (m) => `Referenced file "${m[1]}" was not found. Check your file references.`],
    [/Package fontspec Error.*"([^"]+)"/i, (m) => `The font "${m[1]}" is not available on the server. Try a different template.`],
    [/luaotfload.*cannot/i, () => 'A font could not be loaded. Try a different template.'],
    [/Font.*not found/i, () => 'A required font is not installed. Try a different template.'],
    [/Missing character.*U\+([0-9A-F]+)/i, (m) => `A character (U+${m[1]}) is not available in the current font. This may appear as a blank space in the PDF.`],

    // ── Citation/bibliography errors ──
    [/Undefined citation.*`([^']+)'/i, (m) => `Citation "${m[1]}" not found in your bibliography. Check the key or switch to Standard Mode.`],
    [/I couldn.t open.*\.bib/i, () => 'Bibliography file not found. Switch to Standard Mode to skip citations.'],
    [/Empty bibliography/i, () => 'Your bibliography section is empty. Add references or switch to Standard Mode.'],

    // ── Image/figure errors ──
    [/Cannot determine size of graphic.*?([^\s]+)/i, (m) => `Image "${m[1].split('/').pop()}" has no size information. Try re-exporting the image as PNG or JPG.`],
    [/Unknown graphics extension/i, () => 'An image uses an unsupported format. Convert it to PNG, JPG, or PDF.'],

    // ── Memory/capacity errors ──
    [/TeX capacity exceeded.*pool size/i, () => 'Your manuscript is too complex for a single compile. Try splitting into smaller sections.'],
    [/TeX capacity exceeded.*main memory/i, () => 'The typesetter ran out of memory. Your manuscript may have too many images or complex tables.'],
    [/TeX capacity exceeded/i, () => 'The typesetter exceeded its capacity. Try simplifying complex sections or reducing image count.'],

    // ── Encoding errors ──
    [/Invalid UTF-?8/i, () => 'Your manuscript contains invalid characters. Copy-paste from a plain text editor to clean encoding.'],
    [/inputenc Error.*Invalid.*byte/i, () => 'A non-standard character was found. Try removing special symbols or copy-pasting from Notepad/TextEdit.'],

    // ── Package errors ──
    [/Package titlesec Error.*?[Ee]ntered in horizontal mode/i, () => 'A heading was placed in an unexpected context. Add a blank line before the heading in your manuscript.'],
    [/Package .* Error/i, () => 'A LaTeX package reported an error. Try a different template.'],
    [/! LaTeX Error:\s*(.*)/i, (m) => m[1]],

    // ── PDF/X conversion errors ──
    [/pdfx.*conversion.*fail/i, () => 'PDF/X-1a conversion failed. The document may contain unsupported transparency or color profiles. Try standard PDF export instead.'],
    [/Ghostscript.*error/i, () => 'Post-processing failed. Try exporting as standard PDF instead of PDF/X-1a.'],

    // ── Server/engine errors ──
    [/(?:xelatex|lualatex).*not found/i, () => 'Server configuration error. The typesetting engine is not available.'],
    [/pandoc.*not found/i, () => 'Server configuration error. The document converter is not available.'],
    [/Error\s+\d+\s+\(driver return code\)/i, () => 'The PDF engine encountered a driver error. Try a different template or simplify your manuscript.'],
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
    [/Missing \$ inserted|special character/i, 'Remove _ or ^ characters, or wrap math in $...$'],
    [/Undefined citation|citation.*not found/i, 'Toggle on Standard mode in Options to skip bibliography'],
    [/I couldn.t open.*\.bib|Empty bibliography/i, 'Toggle on Standard mode in Options to skip bibliography'],
    [/Overfull \\hbox|overflows? the margin/i, 'Try wider margins or a larger page size'],
    [/font.*not (found|available)|cannot.*font|luaotfload/i, 'Try a different template'],
    [/timed?\s*out|timeout/i, 'Try Fast compile mode, or split into smaller sections'],
    [/TeX capacity exceeded|out of memory/i, 'Reduce image count or split into smaller sections'],
    [/Too many unprocessed floats|Float.*lost/i, 'Add more text between images and tables'],
    [/Runaway argument|Unmatched/i, 'Check for missing closing braces } or brackets ]'],
    [/Invalid UTF|invalid.*byte/i, 'Paste your text through a plain text editor to clean encoding'],
    [/Package .* Error|Missing \\begin/i, 'Try a different template'],
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
