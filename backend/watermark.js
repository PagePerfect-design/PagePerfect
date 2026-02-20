/**
 * watermark.js — "The Compositor's Mark"
 *
 * Generates a TikZ-based watermark preamble for free-tier PDF downloads.
 * Design: Müller-Brockmann-inspired registration marks tiled diagonally
 * across every page at 8% opacity.
 *
 * The mark combines:
 *   - Registration crosshair inside a circle
 *   - "PAGE" / "PERFECT" letterspaced small-caps text
 *   - Baseline grid fragments (dashed lines)
 *   - Corner crop marks (L-brackets)
 *   - Golden rectangle outline (φ proportions)
 */

'use strict';

/**
 * Returns LaTeX preamble that renders the compositor's mark watermark
 * on every page background via eso-pic + TikZ.
 */
function generateWatermarkPreamble() {
  // Tile spacing (inches) — controls density of the repeating pattern
  const tileSpacingX = 2.4;
  const tileSpacingY = 2.4;
  // Rotation angle (degrees)
  const angle = 30;
  // Opacity (0–1)
  const opacity = 0.07;

  return String.raw`
% ── PagePerfect Watermark: The Compositor's Mark ──────────────────
% Müller-Brockmann-inspired registration marks, tiled diagonally.
% Injected for free-tier downloads only.
\usepackage{eso-pic}
\usepackage{tikz}
\usetikzlibrary{calc}

% ── Define the single watermark tile ──────────────────────────────
\newcommand{\ppwatermarktile}{%
  \begin{tikzpicture}[
    every node/.style={inner sep=0pt, outer sep=0pt},
    line cap=round,
  ]
    % --- Golden rectangle outline (φ ≈ 1.618) ---
    % Width=0.52in, Height=0.52/1.618≈0.321in, centered
    \draw[gray, line width=0.15pt]
      (-0.26, -0.161) rectangle (0.26, 0.161);

    % --- Registration crosshair ---
    % Vertical stroke
    \draw[gray, line width=0.3pt] (0, -0.12) -- (0, 0.12);
    % Horizontal stroke
    \draw[gray, line width=0.3pt] (-0.12, 0) -- (0.12, 0);
    % Circle around crosshair
    \draw[gray, line width=0.25pt] (0, 0) circle[radius=0.09];

    % --- "PAGE" above crosshair ---
    \node[above, gray, font=\fontsize{3.5pt}{4pt}\selectfont\sffamily]
      at (0, 0.17) {\addfontfeature{LetterSpace=18}PAGE};

    % --- "PERFECT" below crosshair ---
    \node[below, gray, font=\fontsize{3.5pt}{4pt}\selectfont\sffamily]
      at (0, -0.17) {\addfontfeature{LetterSpace=18}PERFECT};

    % --- Baseline grid fragments (dashed lines) ---
    % Left side
    \draw[gray, line width=0.12pt, dash pattern=on 1.2pt off 1pt]
      (-0.42, 0.06) -- (-0.28, 0.06);
    \draw[gray, line width=0.12pt, dash pattern=on 1.2pt off 1pt]
      (-0.42, 0) -- (-0.28, 0);
    \draw[gray, line width=0.12pt, dash pattern=on 1.2pt off 1pt]
      (-0.42, -0.06) -- (-0.28, -0.06);
    % Right side
    \draw[gray, line width=0.12pt, dash pattern=on 1.2pt off 1pt]
      (0.28, 0.06) -- (0.42, 0.06);
    \draw[gray, line width=0.12pt, dash pattern=on 1.2pt off 1pt]
      (0.28, 0) -- (0.42, 0);
    \draw[gray, line width=0.12pt, dash pattern=on 1.2pt off 1pt]
      (0.28, -0.06) -- (0.42, -0.06);

    % --- Corner crop marks (L-brackets) ---
    % Top-left
    \draw[gray, line width=0.2pt]
      (-0.48, 0.28) -- (-0.48, 0.34) -- (-0.42, 0.34);
    % Top-right
    \draw[gray, line width=0.2pt]
      (0.42, 0.34) -- (0.48, 0.34) -- (0.48, 0.28);
    % Bottom-left
    \draw[gray, line width=0.2pt]
      (-0.48, -0.28) -- (-0.48, -0.34) -- (-0.42, -0.34);
    % Bottom-right
    \draw[gray, line width=0.2pt]
      (0.42, -0.34) -- (0.48, -0.34) -- (0.48, -0.28);

    % --- Small phi (φ) indicator ---
    \node[gray, font=\fontsize{2.2pt}{2.5pt}\selectfont\itshape]
      at (0.22, 0.135) {$\varphi$};

  \end{tikzpicture}%
}

% ── Tile the watermark across every page ──────────────────────────
\AddToShipoutPictureBG*{%
  \begin{tikzpicture}[remember picture, overlay]
    \begin{scope}[
      opacity=${opacity},
      shift={(current page.center)},
      rotate=${angle},
    ]
      % Tile in a grid large enough to cover any page size after rotation.
      % Range: -6..6 in both axes covers up to ~15in rotated pages.
      \foreach \ix in {-6,...,6} {
        \foreach \iy in {-6,...,6} {
          \node at (\ix * ${tileSpacingX}in, \iy * ${tileSpacingY}in)
            {\ppwatermarktile};
        }
      }
    \end{scope}
  \end{tikzpicture}%
}
`;
}

module.exports = {
  generateWatermarkPreamble,
};
