#!/usr/bin/env node
/**
 * build-landing-specimens.mjs — Render brand-appropriate placeholder
 * specimens for the manifesto landing's two image slots:
 *
 *   /landing/landing-cover.webp         (1408x768, hero right column)
 *   /landing/landing-engine-masthead.webp (1408x768, chapter IV banner)
 *
 * The manifesto ships expecting Runware-generated photography that
 * hasn't landed yet. These placeholders preserve layout and stay on
 * brand (cream paper, ink, hairline rules, mono captions, one red
 * accent rule) so production doesn't 404 or collapse.
 *
 * When real Runware images land, drop them into public/landing/ at the
 * same filenames. These placeholders are minimal by design.
 *
 * Run: `npm run landing:specimens`
 */

import sharp from 'sharp'
import { readFile, writeFile } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PUBLIC_LANDING = resolve(__dirname, '..', 'public', 'landing')

const PAPER = '#FDFCF8'
const INK = '#111111'
const RED = '#FF3333'

const FONT_700 = resolve(__dirname, '..', 'node_modules', '@fontsource', 'inter-tight', 'files', 'inter-tight-latin-700-normal.woff')
const FONT_500 = resolve(__dirname, '..', 'node_modules', '@fontsource', 'inter-tight', 'files', 'inter-tight-latin-500-normal.woff')
const FONT_400 = resolve(__dirname, '..', 'node_modules', '@fontsource', 'inter-tight', 'files', 'inter-tight-latin-400-normal.woff')

async function fontDataUrl(path) {
  const buf = await readFile(path)
  return `data:font/woff;base64,${buf.toString('base64')}`
}

/**
 * Hero cover specimen — vertical "type ladder" composition.
 * Large folio numeral "I", Inter Tight specimen lines stepping down the
 * modular scale, baseline-grid hairlines, accent rule, mono caption.
 */
async function renderCover(fonts) {
  const W = 1408
  const H = 768
  const PAD = 96

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <style>
      @font-face { font-family: 'Inter Tight'; font-weight: 700; font-style: normal; src: url('${fonts.f700}') format('woff'); }
      @font-face { font-family: 'Inter Tight'; font-weight: 500; font-style: normal; src: url('${fonts.f500}') format('woff'); }
      @font-face { font-family: 'Inter Tight'; font-weight: 400; font-style: normal; src: url('${fonts.f400}') format('woff'); }
      .folio { font-family: 'Inter Tight', sans-serif; font-weight: 700; font-size: 320px; letter-spacing: -0.04em; fill: ${INK}; }
      .lead { font-family: 'Inter Tight', sans-serif; font-weight: 700; font-size: 64px; letter-spacing: -0.02em; fill: ${INK}; }
      .body { font-family: 'Inter Tight', sans-serif; font-weight: 400; font-size: 28px; letter-spacing: -0.01em; fill: ${INK}; opacity: 0.7; }
      .mono { font-family: 'Inter Tight', sans-serif; font-weight: 500; font-size: 13px; letter-spacing: 0.18em; text-transform: uppercase; fill: ${INK}; opacity: 0.55; }
    </style>
  </defs>
  <rect width="${W}" height="${H}" fill="${PAPER}"/>

  <!-- baseline grid hairlines (subtle) -->
  <g stroke="${INK}" stroke-width="0.5" opacity="0.06">
    <line x1="0" y1="128" x2="${W}" y2="128"/>
    <line x1="0" y1="256" x2="${W}" y2="256"/>
    <line x1="0" y1="384" x2="${W}" y2="384"/>
    <line x1="0" y1="512" x2="${W}" y2="512"/>
    <line x1="0" y1="640" x2="${W}" y2="640"/>
  </g>

  <!-- folio numeral -->
  <text x="${PAD}" y="320" class="folio">I</text>

  <!-- accent rule -->
  <rect x="${PAD}" y="360" width="96" height="4" fill="${RED}"/>

  <!-- lead -->
  <text x="${PAD}" y="450" class="lead">Markdown,</text>
  <text x="${PAD}" y="522" class="lead">precisely set.</text>

  <!-- body -->
  <text x="${PAD}" y="600" class="body">A specimen of the manifesto.</text>

  <!-- mono captions -->
  <text x="${PAD}" y="${H - PAD - 16}" class="mono">SPECIMEN · COVER · 2026</text>
  <text x="${W - PAD}" y="${H - PAD - 16}" class="mono" text-anchor="end">PLACEHOLDER · RUNWARE PENDING</text>

  <!-- hairline frame -->
  <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" fill="none" stroke="${INK}" stroke-width="1" opacity="0.15"/>
</svg>`

  return sharp(Buffer.from(svg)).webp({ quality: 90, effort: 6 }).toBuffer()
}

/**
 * Chapter IV masthead — horizontal foundry-style type scale.
 * Wordmark left, baseline rules continuing right, engine colophon
 * right-aligned. Reads as a printer's plate.
 */
async function renderEngineMasthead(fonts) {
  const W = 1408
  const H = 768
  const PAD = 80

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <style>
      @font-face { font-family: 'Inter Tight'; font-weight: 700; font-style: normal; src: url('${fonts.f700}') format('woff'); }
      @font-face { font-family: 'Inter Tight'; font-weight: 500; font-style: normal; src: url('${fonts.f500}') format('woff'); }
      @font-face { font-family: 'Inter Tight'; font-weight: 400; font-style: normal; src: url('${fonts.f400}') format('woff'); }
      .display { font-family: 'Inter Tight', sans-serif; font-weight: 700; font-size: 180px; letter-spacing: -0.04em; fill: ${INK}; }
      .scale-label { font-family: 'Inter Tight', sans-serif; font-weight: 500; font-size: 14px; letter-spacing: 0.18em; text-transform: uppercase; fill: ${INK}; opacity: 0.55; }
      .colophon-key { font-family: 'Inter Tight', sans-serif; font-weight: 500; font-size: 13px; letter-spacing: 0.16em; text-transform: uppercase; fill: ${INK}; opacity: 0.55; }
      .colophon-val { font-family: 'Inter Tight', sans-serif; font-weight: 500; font-size: 17px; letter-spacing: -0.01em; fill: ${INK}; }
      .mono { font-family: 'Inter Tight', sans-serif; font-weight: 500; font-size: 13px; letter-spacing: 0.18em; text-transform: uppercase; fill: ${INK}; opacity: 0.55; }
    </style>
  </defs>
  <rect width="${W}" height="${H}" fill="${PAPER}"/>

  <!-- baseline grid hairlines (subtle, anchor the scale) -->
  <g stroke="${INK}" stroke-width="0.5" opacity="0.08">
    <line x1="0" y1="320" x2="${W}" y2="320"/>
    <line x1="0" y1="400" x2="${W}" y2="400"/>
    <line x1="0" y1="480" x2="${W}" y2="480"/>
    <line x1="0" y1="560" x2="${W}" y2="560"/>
  </g>

  <!-- accent rule (top kicker) -->
  <rect x="${PAD}" y="${PAD + 40}" width="96" height="3" fill="${RED}"/>
  <text x="${PAD}" y="${PAD + 32}" class="mono">CHAPTER IV · ENGINE SPECIMEN</text>

  <!-- display wordmark -->
  <text x="${PAD}" y="320" class="display">Typst.</text>

  <!-- type scale spec on the right half -->
  <g>
    <text x="${PAD + 540}" y="380" class="colophon-val" style="font-size: 72px">9</text>
    <text x="${PAD + 540}" y="402" class="scale-label">CAPTIONS</text>
    <text x="${PAD + 700}" y="380" class="colophon-val" style="font-size: 64px">11</text>
    <text x="${PAD + 700}" y="402" class="scale-label">BODY</text>
    <text x="${PAD + 850}" y="380" class="colophon-val" style="font-size: 56px">14</text>
    <text x="${PAD + 850}" y="402" class="scale-label">LEAD</text>
    <text x="${PAD + 1000}" y="380" class="colophon-val" style="font-size: 48px">22</text>
    <text x="${PAD + 1000}" y="402" class="scale-label">H2</text>
    <text x="${PAD + 1150}" y="380" class="colophon-val" style="font-size: 40px">28</text>
    <text x="${PAD + 1150}" y="402" class="scale-label">H1</text>
  </g>

  <!-- colophon rows right-aligned -->
  <g>
    <text x="${PAD}" y="500" class="colophon-key">Engine</text>
    <text x="${PAD + 200}" y="500" class="colophon-val">Typst 0.13</text>
    <text x="${PAD}" y="540" class="colophon-key">Converter</text>
    <text x="${PAD + 200}" y="540" class="colophon-val">Pandoc 3.x</text>
    <text x="${PAD}" y="580" class="colophon-key">Post-proc</text>
    <text x="${PAD + 200}" y="580" class="colophon-val">Ghostscript 10.x</text>
    <text x="${PAD}" y="620" class="colophon-key">Validation</text>
    <text x="${PAD + 200}" y="620" class="colophon-val">Bleed · Gutter · Trim · Spine</text>
  </g>

  <!-- footer captions -->
  <text x="${PAD}" y="${H - PAD + 16}" class="mono">SPECIMEN · MASTHEAD · 2026</text>
  <text x="${W - PAD}" y="${H - PAD + 16}" class="mono" text-anchor="end">PLACEHOLDER · RUNWARE PENDING</text>

  <!-- hairline frame -->
  <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" fill="none" stroke="${INK}" stroke-width="1" opacity="0.15"/>
</svg>`

  return sharp(Buffer.from(svg)).webp({ quality: 90, effort: 6 }).toBuffer()
}

async function write(filename, buf) {
  const path = resolve(PUBLIC_LANDING, filename)
  await writeFile(path, buf)
  console.log(`  wrote landing/${filename} (${(buf.length / 1024).toFixed(1)} KB)`)
}

async function main() {
  const [f700, f500, f400] = await Promise.all([
    fontDataUrl(FONT_700),
    fontDataUrl(FONT_500),
    fontDataUrl(FONT_400),
  ])
  const fonts = { f700, f500, f400 }

  console.log('Rendering landing specimens...')
  const cover = await renderCover(fonts)
  const masthead = await renderEngineMasthead(fonts)

  await write('landing-cover.webp', cover)
  await write('landing-engine-masthead.webp', masthead)

  console.log('\nDone.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
