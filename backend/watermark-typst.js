/**
 * watermark-typst.js — "The Compositor's Mark" (Typst version)
 *
 * Generates a Typst-native watermark for free-tier PDF downloads.
 * Port of the TikZ/eso-pic watermark from watermark.js.
 *
 * Design: Müller-Brockmann-inspired registration marks tiled diagonally
 * across every page at 7% opacity.
 *
 * The mark combines:
 *   - Registration crosshair text
 *   - "PAGE" / "PERFECT" letterspaced text
 *   - Tiled diagonally across every page
 */

'use strict';

/**
 * Returns Typst code that renders the compositor's mark watermark
 * on every page background via #set page(background: ...).
 */
function generateTypstWatermarkPreamble() {
  const tileSpacingX = 2.4; // inches
  const tileSpacingY = 2.4;
  const angle = 30; // degrees
  const opacity = 7; // percent — 7% visible = 93% transparent

  // Apply opacity directly to the watermark text color (not via overlay).
  // luma(180) at 93% transparency gives a very faint grey mark.
  const transparency = (100 - opacity) / 100; // 0.93

  return `
// ── PagePerfect Watermark: The Compositor's Mark ──────────────────
// Müller-Brockmann-inspired registration marks, tiled diagonally.
// Injected for free-tier downloads only.

#let pp-wm-color = luma(180).transparentize(${transparency})

#let pp-watermark-tile() = {
  box(width: 0.9in, height: 0.7in)[
    #set text(fill: pp-wm-color, size: 3.5pt, font: "Latin Modern Sans")
    #align(center + horizon)[
      #text(tracking: 2pt)[PAGE]
      #v(4pt)
      #text(size: 2pt)[+]
      #v(4pt)
      #text(tracking: 2pt)[PERFECT]
    ]
  ]
}

#set page(background: {
  place(center + horizon, rotate(${angle}deg,
    grid(
      columns: 6,
      rows: 8,
      column-gutter: ${tileSpacingX}in,
      row-gutter: ${tileSpacingY}in,
      ..range(48).map(_ => pp-watermark-tile())
    )
  ))
})
`;
}

module.exports = {
  generateTypstWatermarkPreamble,
};
