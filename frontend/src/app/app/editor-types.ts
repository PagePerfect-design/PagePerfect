/* ═══════════════════════════════════════════════════════════════════
   SHARED TYPES & CONSTANTS — Editor
   ═══════════════════════════════════════════════════════════════════ */

export type TemplateKey = 'minimal' | 'symphony' | 'chronicle' | 'exhibit' | 'matrix' | 'avantgarde' | 'chicago' | 'paperback' | 'international' | 'cinema' | 'heirloom' | 'operator' | 'verse' | 'thesis' | 'memoir'
export type HeadingVariant = 'classic' | 'modern' | 'bold'
export type PageSize = 'letter' | 'a4' | 'sixByNine' | 'fiveFiveByEightFive' | 'a5' | 'sevenByTen' | 'royal' | 'bFormat' | 'massMarket' | 'aFormat' | 'demy' | 'fiveTwentyFiveByEight' | 'crownQuarto' | 'b5' | 'amazonFiveByEight' | 'amazonSixByNine' | 'amazonSevenByTen' | 'amazonEightByTen' | 'amazonEightFiveByEleven'
export type MarginPreset = 'normal' | 'narrow' | 'wide' | 'minimal' | 'academic' | 'generous' | 'compact'
export type CompileMode = 'fast' | 'full'
export type CompileError = { message: string }
export type Status = 'idle' | 'compiling' | 'queued' | 'success' | 'error'
export type Stage = 'portal' | 'design' | 'launch'
export type HudTab = 'style' | 'layout' | 'settings' | null
export type Platform = 'kdp' | 'ingram'
export type PaperStock = 'white' | 'cream'
export type ExportFormat = 'pdf' | 'epub'
export type CustomFont = { fontId: string; fontName: string; originalName: string } | null

export type PreflightCheck = {
  name: string
  status: 'pass' | 'fail' | 'warn' | 'info'
  detail: string
}

export type PreflightResult = {
  passed: boolean
  platform: string
  checks: PreflightCheck[]
  stats: {
    estimatedPages: number
    wordCount: number
    spineInches: number
    spineMm: number
    gutterInches: number
    trimWidth: number
    trimHeight: number
    marginInches: number
  }
}

export type CompileQuality = {
  typographyScore: number | null
  typographyGrade: string | null
  overfullBoxes: number
  underfullBoxes: number
  buildId: string | null
} | null

export const PREFS_KEY = 'pp-prefs-v1'
export type Prefs = {
  template: TemplateKey
  pageSize: PageSize
  marginPreset: MarginPreset
  safeMode: boolean
  title: string
  headingVariant?: HeadingVariant
}

export type Genre = 'fiction' | 'nonfiction' | 'specialist' | 'all'

export type TemplateEntry = {
  name: string
  subtitle: string
  vibe: string
  genre: Genre
  font: string
}

export type DetectedGenre = {
  genre: Genre
  template: TemplateKey
  confidence: 'high' | 'medium' | 'low'
  message: string
}

export type Analysis = {
  chapters: number
  words: number
  images: number
  hasFrontmatter: boolean
  hasReferences: boolean
  detected: DetectedGenre | null
}

export const TEMPLATE_INFO: Record<TemplateKey, TemplateEntry> = {
  // Fiction
  symphony:      { name: 'Symphony',       subtitle: 'The Classic Novel',        vibe: 'Elegant serifs. Best for History, Romance, and Literary Fiction.',     genre: 'fiction',     font: 'EB Garamond' },
  paperback:     { name: 'Paperback',      subtitle: 'The Modern Bestseller',    vibe: 'Clean and fast. Best for Thrillers, Sci-Fi, and Airport Reads.',      genre: 'fiction',     font: 'Alegreya Sans' },
  exhibit:       { name: 'Exhibit',        subtitle: 'The Art Gallery',          vibe: 'Minimalist and airy. Best for Poetry, Photography, and Memoirs.',     genre: 'fiction',     font: 'Fira Sans' },
  memoir:        { name: 'Memoir',         subtitle: 'The Personal Story',       vibe: 'Warm and intimate. Best for Memoir, Autobiography, and Travel.',      genre: 'fiction',     font: 'Libre Baskerville' },
  // Non-Fiction
  chicago:       { name: 'Chicago',        subtitle: 'The University Press',     vibe: 'Scholarly authority. Best for Research, History, and Dissertations.', genre: 'nonfiction',  font: 'ETbb (Bembo)' },
  thesis:        { name: 'Thesis',         subtitle: 'The Dissertation',         vibe: 'Double-spaced, numbered sections. University submission format.',     genre: 'nonfiction',  font: 'Latin Modern' },
  chronicle:     { name: 'Chronicle',      subtitle: 'The Journalist',           vibe: 'Bold and objective. Best for True Crime, Essays, and Magazines.',     genre: 'nonfiction',  font: 'TeX Gyre Heros' },
  matrix:        { name: 'Matrix',         subtitle: 'The Boardroom Report',     vibe: 'Structured and dense. Best for Business, Strategy, and Reports.',     genre: 'nonfiction',  font: 'Fira Sans' },
  international: { name: 'International',  subtitle: 'The Swiss Standard',       vibe: 'Pure grid logic. Best for Design, Architecture, and Monographs.',     genre: 'nonfiction',  font: 'TeX Gyre Heros' },
  // Specialist
  verse:         { name: 'Verse',          subtitle: 'The Poetry Collection',    vibe: 'Centered titles, generous leading. For Poetry and Verse Drama.',      genre: 'specialist',  font: 'EB Garamond' },
  cinema:        { name: 'Cinema',         subtitle: 'The Screenplay',           vibe: 'Hollywood Standard. 1 page = 1 minute. Courier, proper sluglines.',  genre: 'specialist',  font: 'TeX Gyre Cursor' },
  heirloom:      { name: 'Heirloom',       subtitle: 'The Cookbook',              vibe: 'Ingredient blocks, bold steps. Best for Recipes and Food Writing.',   genre: 'specialist',  font: 'Fira Sans' },
  operator:      { name: 'Operator',       subtitle: 'The Technical Manual',     vibe: 'Warning boxes, code blocks. Best for Docs, Guides, and Manuals.',    genre: 'specialist',  font: 'Fira Sans' },
  avantgarde:    { name: 'Avant-Garde',    subtitle: 'The Experimental',         vibe: 'Brutalist blockquotes, deconstructed grid. For rule-breakers.',       genre: 'specialist',  font: 'Source Sans 3' },
  minimal:       { name: 'Minimal',        subtitle: 'The Universal',            vibe: 'Zero dependencies. Compiles anywhere. Pure content, no fuss.',        genre: 'specialist',  font: 'Latin Modern' },
}

export const HEADING_VARIANT_INFO: Record<HeadingVariant, { label: string; desc: string }> = {
  classic: { label: 'Classic', desc: 'Signature style' },
  modern:  { label: 'Modern',  desc: 'Clean & restrained' },
  bold:    { label: 'Bold',    desc: 'Dramatic & heavy' },
}

export const TEMPLATE_KEYS = Object.keys(TEMPLATE_INFO) as TemplateKey[]

export const GENRE_LABELS: Record<Genre, string> = {
  fiction: 'Fiction',
  nonfiction: 'Non-Fiction',
  specialist: 'Specialist',
  all: 'All',
}

export const GENRE_ORDER: Genre[] = ['fiction', 'nonfiction', 'specialist']

export const PAGE_SIZES: Record<string, { label: string; desc: string }> = {
  fiveFiveByEightFive: { label: '5.5 x 8.5"', desc: 'Digest' },
  sixByNine:           { label: '6 x 9"',      desc: 'Trade' },
  letter:              { label: '8.5 x 11"',   desc: 'Letter' },
  a4:                  { label: 'A4',           desc: '210x297mm' },
  a5:                  { label: 'A5',           desc: '148x210mm' },
  sevenByTen:          { label: '7 x 10"',     desc: 'Textbook' },
  royal:               { label: 'Royal',       desc: '156x234mm' },
  bFormat:             { label: 'B-format',    desc: '129x198mm' },
  massMarket:          { label: '4.25 x 6.87"', desc: 'Mass Market' },
  aFormat:             { label: 'A-format',    desc: '111x178mm' },
  demy:                { label: 'Demy',        desc: '138x216mm' },
  fiveTwentyFiveByEight: { label: '5.25 x 8"', desc: 'Fiction' },
  crownQuarto:         { label: 'Crown Quarto', desc: '189x246mm' },
  b5:                  { label: 'B5',          desc: '176x250mm' },
  amazonFiveByEight:   { label: '5 x 8"',      desc: 'KDP' },
  amazonSixByNine:     { label: '6 x 9"',      desc: 'KDP' },
  amazonSevenByTen:    { label: '7 x 10"',     desc: 'KDP' },
  amazonEightByTen:    { label: '8 x 10"',     desc: 'KDP' },
  amazonEightFiveByEleven: { label: '8.5 x 11"', desc: 'KDP' },
}

export const FREE_TIER_SIZES = new Set(['fiveFiveByEightFive', 'sixByNine', 'a5', 'royal', 'letter', 'a4'])

export const TIER_LEVEL: Record<string, number> = { anonymous: 0, drafter: 1, publisher: 2, studio: 3 }
export function hasTier(userTier: string, requiredTier: string): boolean {
  return (TIER_LEVEL[userTier] || 0) >= (TIER_LEVEL[requiredTier] || 0)
}

export const MARGIN_INFO: Record<MarginPreset, { label: string; desc: string }> = {
  minimal:  { label: 'Minimal',  desc: '2 units — max text area' },
  compact:  { label: 'Compact',  desc: '3 units — dense layout' },
  narrow:   { label: 'Narrow',   desc: '4 units — trade fiction' },
  normal:   { label: 'Normal',   desc: '5 units — balanced' },
  wide:     { label: 'Wide',     desc: '6 units — readable' },
  academic: { label: 'Academic', desc: '7 units — scholarly' },
  generous: { label: 'Generous', desc: '8 units — wide margins' },
}

export const ease = [0.25, 0.4, 0.25, 1] as const
