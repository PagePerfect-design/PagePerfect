/**
 * Heading Variants System — Constants
 *
 * Each of the 15 base templates has 3 heading variants:
 *   - classic: The template's built-in heading style (no override)
 *   - modern:  Clean, restrained, letterspaced, minimal ornamentation
 *   - bold:    Dramatic, oversized numbers, heavy rules, high contrast
 *
 * Typst preamble generation lives in heading-variants-typst.js.
 * This module exports only the shared constants used across the codebase.
 */

// ================================================================
// Variant Registry
// ================================================================

/**
 * Map of template key → document class type.
 * 'book' templates have chapters; 'article' templates do not.
 */
const TEMPLATE_CLASS = {
  // Book class (has chapters)
  symphony:      'book',
  chicago:       'book',
  paperback:     'book',
  exhibit:       'book',
  avantgarde:    'book',
  memoir:        'book',
  verse:         'book',
  // Article class (sections only)
  chronicle:     'article',
  international: 'article',
  operator:      'article',
  matrix:        'article',
  heirloom:      'article',
  minimal:       'article',
  cinema:        'article',
  thesis:        'article',
};

/**
 * Valid heading variant names.
 */
const HEADING_VARIANTS = ['classic', 'modern', 'bold'];

/**
 * Human-readable labels for each variant.
 */
const VARIANT_LABELS = {
  classic: 'Classic',
  modern: 'Modern',
  bold: 'Bold',
};

/**
 * Short descriptions for UI tooltips.
 */
const VARIANT_DESCRIPTIONS = {
  classic: 'The template\'s signature heading style',
  modern: 'Clean, restrained, letterspaced',
  bold: 'Dramatic, oversized, heavy rules',
};

module.exports = {
  HEADING_VARIANTS,
  VARIANT_LABELS,
  VARIANT_DESCRIPTIONS,
  TEMPLATE_CLASS,
};
