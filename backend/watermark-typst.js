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
  const opacity = 7; // percent (Typst uses 0-100%)

  return `
// ── PagePerfect Watermark: The Compositor's Mark ──────────────────
// Müller-Brockmann-inspired registration marks, tiled diagonally.
// Injected for free-tier downloads only.

#let pp-watermark-tile() = {
  box(width: 0.9in, height: 0.7in)[
    #set text(fill: luma(180), size: 3.5pt, font: "Latin Modern Sans")
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
  // Apply opacity
  place(center + horizon, rect(width: 100%, height: 100%, fill: white.transparentize(${100 - opacity}%)))
})
`;
}

module.exports = {
  generateTypstWatermarkPreamble,
};
