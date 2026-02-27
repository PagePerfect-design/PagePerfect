'use strict';

/**
 * Drop Cap System (Typst)
 *
 * Generates Typst show rules that create a drop-cap (large initial letter)
 * on the first paragraph after each level-1 heading. This is the Typst
 * equivalent of LaTeX's \lettrine package.
 *
 * Strategy: Use Typst's state() to track when we've just passed a chapter
 * heading, then apply drop-cap styling to the next paragraph.
 *
 * Target templates: paperback, memoir, symphony (fiction/literary).
 */

// Templates that receive drop-cap preamble
const DROP_CAP_TEMPLATES = new Set(['paperback', 'memoir', 'symphony']);

/**
 * Generate the Typst drop-cap preamble for injection into header-includes.
 *
 * The generated Typst code:
 * 1. Defines a state variable to track "just saw H1"
 * 2. Adds a show rule on heading.where(level: 1) that sets the flag
 * 3. Adds a show rule on par that checks the flag and applies drop-cap
 *    styling to the first paragraph after a chapter heading
 *
 * @param {string} templateKey — e.g. 'paperback', 'memoir', 'symphony'
 * @param {object} [options]
 * @param {number} [options.lines] — drop cap height in lines (default 3)
 * @param {string} [options.font] — optional font override for the drop letter
 * @returns {string} Typst preamble snippet, or empty string if template not eligible
 */
function getDropCapPreamble(templateKey, options = {}) {
  if (!DROP_CAP_TEMPLATES.has(templateKey)) return '';

  const lines = options.lines || 3;
  const fontSize = `${lines}em`;
  const fontOverride = options.font
    ? `font: "${options.font}",`
    : '';

  return `// ── Drop Caps (first paragraph after H1) ─────────────────────
// Automatic lettrine for fiction templates. Uses Typst state() to detect
// when a paragraph immediately follows a chapter heading.

#let _pp-drop-cap-pending = state("pp-drop-cap", false)

// Signal that the next paragraph should get a drop cap
#show heading.where(level: 1): it => {
  _pp-drop-cap-pending.update(true)
  it
}

// Apply drop cap to the first paragraph after a chapter heading
#show par: it => {
  context {
    if _pp-drop-cap-pending.get() == true {
      _pp-drop-cap-pending.update(false)
      let body = it.body
      let children = body.children
      if children != none and children.len() > 0 {
        let first = children.first()
        // Extract the first letter from a text element
        if first.has("text") and first.text.len() > 0 {
          let txt = first.text
          let letter = txt.first()
          let rest-text = txt.slice(1)
          let rest-children = children.slice(1)
          // Build the drop cap letter
          let cap = box(
            inset: (right: 0.15em),
            text(
              size: ${fontSize},
              weight: "bold",
              ${fontOverride}
              baseline: 0.22em * ${lines},
              letter,
            ),
          )
          // Reassemble: drop-cap + remainder of first word + rest of paragraph
          set par(first-line-indent: 0pt)
          cap
          text(rest-text)
          rest-children.join()
        } else {
          it
        }
      } else {
        it
      }
    } else {
      it
    }
  }
}`;
}

module.exports = {
  getDropCapPreamble,
  DROP_CAP_TEMPLATES,
};
