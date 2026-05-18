#!/usr/bin/env node
/**
 * build-icons.mjs — Regenerate PagePerfect favicons, app icons, and OG card.
 *
 * Source of truth: public/Gemini_Generated_Image_kzcwpjkzcwpjkzcw.png
 * (the cleaner of the two Gemini renders — slightly more breathing room
 * around the PP monogram).
 *
 * The Gemini source is landscape and the mark sits off-centre, so we:
 *   1. Threshold to a binary mask (anything darker than mid-grey = mark).
 *   2. Find the tight bounding box of the mark.
 *   3. Extract, fit onto a square cream canvas with the requested padding.
 *
 * Run: `node scripts/build-icons.mjs` from the frontend/ directory.
 */

import sharp from 'sharp'
import pngToIco from 'png-to-ico'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PUBLIC = resolve(__dirname, '..', 'public')
const SRC = resolve(PUBLIC, 'Gemini_Generated_Image_kzcwpjkzcwpjkzcw.png')

const PAPER = '#FDFCF8'
const INK = '#111111'
const RED = '#FF3333'

const FONT_700 = resolve(
  __dirname,
  '..',
  'node_modules',
  '@fontsource',
  'inter-tight',
  'files',
  'inter-tight-latin-700-normal.woff'
)
const FONT_500 = resolve(
  __dirname,
  '..',
  'node_modules',
  '@fontsource',
  'inter-tight',
  'files',
  'inter-tight-latin-500-normal.woff'
)
const FONT_400 = resolve(
  __dirname,
  '..',
  'node_modules',
  '@fontsource',
  'inter-tight',
  'files',
  'inter-tight-latin-400-normal.woff'
)

/**
 * Find the tight bbox of the dark mark on a light background.
 * Returns { left, top, width, height } in source pixels.
 */
async function findMarkBbox(srcBuffer) {
  const img = sharp(srcBuffer).ensureAlpha().greyscale()
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true })
  const { width, height, channels } = info
  // Dark pixels = mark. Threshold at 0x80.
  let minX = width
  let maxX = -1
  let minY = height
  let maxY = -1
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * channels
      if (data[i] < 0x80) {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  }
  if (maxX < 0) throw new Error('no dark pixels found in source')
  return {
    left: minX,
    top: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
  }
}

/**
 * Extract the mark from the Gemini source as an ink-on-transparent PNG at
 * the requested size. We use the source's inverted luminance as the alpha
 * channel — dark pixels (the mark) become opaque INK, light pixels (paper)
 * become fully transparent. This lets us composite onto any background
 * without the source's off-white edge bleeding through.
 */
async function extractMarkInked(srcBuffer, bbox, targetW, targetH) {
  const { data: alpha, info } = await sharp(srcBuffer)
    .extract({ left: bbox.left, top: bbox.top, width: bbox.width, height: bbox.height })
    .resize(targetW, targetH, { fit: 'inside', kernel: 'lanczos3' })
    .greyscale()
    .negate()
    .raw()
    .toBuffer({ resolveWithObject: true })

  // The Gemini source has compression noise in its "white" background that
  // negate() turns into faint non-zero alpha. Apply a soft threshold:
  // alpha below the noise floor goes fully transparent, above the ink
  // ceiling goes fully opaque, in between is a linear ramp (preserves
  // anti-aliased edges).
  const NOISE_FLOOR = 24
  const INK_CEILING = 232
  const SPAN = INK_CEILING - NOISE_FLOOR

  const w = info.width
  const h = info.height
  const rgba = Buffer.alloc(w * h * 4)
  for (let i = 0; i < w * h; i++) {
    const a = alpha[i]
    let aOut
    if (a <= NOISE_FLOOR) aOut = 0
    else if (a >= INK_CEILING) aOut = 255
    else aOut = Math.round(((a - NOISE_FLOOR) / SPAN) * 255)
    rgba[i * 4 + 0] = 0x11
    rgba[i * 4 + 1] = 0x11
    rgba[i * 4 + 2] = 0x11
    rgba[i * 4 + 3] = aOut
  }
  const mark = await sharp(rgba, { raw: { width: w, height: h, channels: 4 } })
    .png()
    .toBuffer()
  return { mark, width: w, height: h }
}

/**
 * Render the PP mark onto a square canvas at the given size with marginPct
 * of empty space on each side. marginPct = 0.12 means the mark occupies
 * 76% of the canvas; marginPct = 0.20 (maskable safe zone) means 60%.
 */
async function renderSquareIcon(srcBuffer, bbox, size, marginPct, background) {
  const inner = Math.round(size * (1 - marginPct * 2))
  const scale = inner / Math.max(bbox.width, bbox.height)
  const markW = Math.round(bbox.width * scale)
  const markH = Math.round(bbox.height * scale)

  const { mark } = await extractMarkInked(srcBuffer, bbox, markW, markH)

  const canvas = sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background,
    },
  })

  return canvas
    .composite([
      {
        input: mark,
        left: Math.round((size - markW) / 2),
        top: Math.round((size - markH) / 2),
      },
    ])
    .png()
    .toBuffer()
}

async function fontDataUrl(path) {
  const buf = await readFile(path)
  return `data:font/woff;base64,${buf.toString('base64')}`
}

/**
 * Render the 1200×630 OG card. Cream paper, PP mark on the left, wordmark
 * + tagline stacked on the right, thin red rule under the wordmark.
 */
async function renderOgCard(srcBuffer, bbox) {
  const W = 1200
  const H = 630
  const PAD = 80
  const MARK_SIZE = 300

  const [font700, font500, font400] = await Promise.all([
    fontDataUrl(FONT_700),
    fontDataUrl(FONT_500),
    fontDataUrl(FONT_400),
  ])

  // Mark: ink-on-transparent so it composites cleanly on cream.
  const scale = MARK_SIZE / Math.max(bbox.width, bbox.height)
  const markW = Math.round(bbox.width * scale)
  const markH = Math.round(bbox.height * scale)
  const { mark } = await extractMarkInked(srcBuffer, bbox, markW, markH)

  // Layout coordinates
  const markX = PAD
  const markY = Math.round((H - markH) / 2)
  const textX = markX + markW + 56
  const wordmarkY = markY + Math.round(markH * 0.40)
  const ruleY = wordmarkY + 18
  const taglineTopY = ruleY + 56
  const taglineMidY = taglineTopY + 56
  const footerY = H - PAD - 8

  // SVG layer: wordmark, accent rule, tagline, footer eyebrow.
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <style>
      @font-face { font-family: 'Inter Tight'; font-weight: 700; font-style: normal; src: url('${font700}') format('woff'); }
      @font-face { font-family: 'Inter Tight'; font-weight: 500; font-style: normal; src: url('${font500}') format('woff'); }
      @font-face { font-family: 'Inter Tight'; font-weight: 400; font-style: normal; src: url('${font400}') format('woff'); }
      .wordmark { font-family: 'Inter Tight', sans-serif; font-weight: 700; font-size: 76px; letter-spacing: -0.02em; fill: ${INK}; }
      .tagline { font-family: 'Inter Tight', sans-serif; font-weight: 400; font-size: 36px; letter-spacing: -0.01em; fill: ${INK}; }
      .eyebrow { font-family: 'Inter Tight', sans-serif; font-weight: 500; font-size: 16px; letter-spacing: 0.16em; text-transform: uppercase; fill: ${INK}; opacity: 0.6; }
    </style>
  </defs>
  <text x="${textX}" y="${wordmarkY}" class="wordmark">PagePerfect</text>
  <rect x="${textX}" y="${ruleY}" width="64" height="3" fill="${RED}"/>
  <text x="${textX}" y="${taglineTopY}" class="tagline">Professional typesetting</text>
  <text x="${textX}" y="${taglineMidY}" class="tagline">in your browser.</text>
  <text x="${PAD}" y="${footerY}" class="eyebrow">pageperfect.studio</text>
  <text x="${W - PAD}" y="${footerY}" class="eyebrow" text-anchor="end">Markdown → Print-ready PDF</text>
</svg>`

  const canvas = sharp({
    create: {
      width: W,
      height: H,
      channels: 4,
      background: PAPER,
    },
  })

  return canvas
    .composite([
      { input: Buffer.from(svg), top: 0, left: 0 },
      { input: mark, left: markX, top: markY },
    ])
    .png({ quality: 92 })
    .toBuffer()
}

async function write(path, buf) {
  await writeFile(path, buf)
  console.log(`  wrote ${path.replace(PUBLIC + '/', '')} (${(buf.length / 1024).toFixed(1)} KB)`)
}

async function main() {
  console.log('Reading source:', SRC.replace(PUBLIC + '/', ''))
  const src = await readFile(SRC)
  const bbox = await findMarkBbox(src)
  console.log(
    `Mark bbox: ${bbox.width}×${bbox.height} at (${bbox.left}, ${bbox.top})`
  )

  // Standard icons — 12% margin, cream background to match the brand.
  const STANDARD_MARGIN = 0.12
  // Maskable icon — Android applies a circular/rounded mask that may crop
  // up to 20% on any edge. Safe zone is the inner 80%, so we pad accordingly.
  const MASKABLE_MARGIN = 0.18

  const cream = { r: 0xfd, g: 0xfc, b: 0xf8, alpha: 1 }
  const transparent = { r: 0, g: 0, b: 0, alpha: 0 }

  console.log('Rendering icons...')
  const fav16 = await renderSquareIcon(src, bbox, 16, STANDARD_MARGIN, cream)
  const fav32 = await renderSquareIcon(src, bbox, 32, STANDARD_MARGIN, cream)
  const fav48 = await renderSquareIcon(src, bbox, 48, STANDARD_MARGIN, cream)
  const apple180 = await renderSquareIcon(src, bbox, 180, STANDARD_MARGIN, cream)
  const android192 = await renderSquareIcon(src, bbox, 192, STANDARD_MARGIN, cream)
  const android512 = await renderSquareIcon(src, bbox, 512, STANDARD_MARGIN, cream)
  const maskable512 = await renderSquareIcon(src, bbox, 512, MASKABLE_MARGIN, cream)

  await write(resolve(PUBLIC, 'favicon-16x16.png'), fav16)
  await write(resolve(PUBLIC, 'favicon-32x32.png'), fav32)
  await write(resolve(PUBLIC, 'apple-touch-icon.png'), apple180)
  await write(resolve(PUBLIC, 'android-chrome-192x192.png'), android192)
  await write(resolve(PUBLIC, 'android-chrome-512x512.png'), android512)
  await write(resolve(PUBLIC, 'android-chrome-512x512-maskable.png'), maskable512)

  console.log('Building favicon.ico (16, 32, 48)...')
  const ico = await pngToIco([fav16, fav32, fav48])
  await write(resolve(PUBLIC, 'favicon.ico'), ico)

  console.log('Rendering OG card 1200×630...')
  const og = await renderOgCard(src, bbox)
  await write(resolve(PUBLIC, 'og-image.png'), og)

  console.log('\nDone.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
