/**
 * CompositorMark — The PagePerfect logo mark
 *
 * A Müller-Brockmann-inspired registration mark:
 *   - Registration crosshair inside a circle
 *   - Golden rectangle outline (φ proportions)
 *   - Baseline grid fragments (dashed lines)
 *   - Corner crop marks (L-brackets)
 *   - φ indicator
 */

export default function CompositorMark({
  size = 28,
  color = 'currentColor',
  className = '',
}: {
  size?: number
  color?: string
  className?: string
}) {
  // Viewbox: 100×100 centered at 50,50
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Golden rectangle outline (φ ≈ 1.618 → 62×38.3) centered */}
      <rect
        x="19" y="30.8"
        width="62" height="38.3"
        rx="0"
        stroke={color}
        strokeWidth="0.8"
        opacity="0.5"
      />

      {/* Registration crosshair — vertical */}
      <line
        x1="50" y1="38" x2="50" y2="62"
        stroke={color}
        strokeWidth="1.2"
        opacity="0.85"
      />
      {/* Registration crosshair — horizontal */}
      <line
        x1="38" y1="50" x2="62" y2="50"
        stroke={color}
        strokeWidth="1.2"
        opacity="0.85"
      />
      {/* Registration circle */}
      <circle
        cx="50" cy="50" r="9"
        stroke={color}
        strokeWidth="0.9"
        opacity="0.7"
      />

      {/* Baseline grid fragments — left */}
      <line x1="5" y1="45" x2="16" y2="45" stroke={color} strokeWidth="0.5" opacity="0.3" strokeDasharray="2 1.5" />
      <line x1="5" y1="50" x2="16" y2="50" stroke={color} strokeWidth="0.5" opacity="0.3" strokeDasharray="2 1.5" />
      <line x1="5" y1="55" x2="16" y2="55" stroke={color} strokeWidth="0.5" opacity="0.3" strokeDasharray="2 1.5" />

      {/* Baseline grid fragments — right */}
      <line x1="84" y1="45" x2="95" y2="45" stroke={color} strokeWidth="0.5" opacity="0.3" strokeDasharray="2 1.5" />
      <line x1="84" y1="50" x2="95" y2="50" stroke={color} strokeWidth="0.5" opacity="0.3" strokeDasharray="2 1.5" />
      <line x1="84" y1="55" x2="95" y2="55" stroke={color} strokeWidth="0.5" opacity="0.3" strokeDasharray="2 1.5" />

      {/* Corner crop marks — top-left */}
      <polyline points="8,18 8,10 16,10" stroke={color} strokeWidth="0.7" opacity="0.4" fill="none" />
      {/* Corner crop marks — top-right */}
      <polyline points="84,10 92,10 92,18" stroke={color} strokeWidth="0.7" opacity="0.4" fill="none" />
      {/* Corner crop marks — bottom-left */}
      <polyline points="8,82 8,90 16,90" stroke={color} strokeWidth="0.7" opacity="0.4" fill="none" />
      {/* Corner crop marks — bottom-right */}
      <polyline points="84,90 92,90 92,82" stroke={color} strokeWidth="0.7" opacity="0.4" fill="none" />

      {/* φ (phi) indicator */}
      <text
        x="75" y="34"
        fill={color}
        fontSize="6"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontStyle="italic"
        opacity="0.35"
      >
        φ
      </text>
    </svg>
  )
}
