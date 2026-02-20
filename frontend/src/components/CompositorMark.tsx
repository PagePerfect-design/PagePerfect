/**
 * CompositorMark — The PagePerfect logo mark
 *
 * A bold P letterform with baseline grid lines descending from the bowl,
 * echoing the typographic grid system at the heart of PagePerfect.
 * Faithfully recreated from the original PagePerfect icon design.
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
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 68 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Heavy stem — full height */}
      <rect x="0" y="0" width="15" height="100" fill={color} />

      {/* Bowl with counter cutout */}
      <path
        fillRule="evenodd"
        d="M15 0H34C54 0 68 12.5 68 28C68 43.5 54 56 34 56H15V43H32C43 43 53 37 53 28C53 19 43 13 32 13H15Z"
        fill={color}
      />

      {/* Baseline grid lines — progressively thinner */}
      <rect x="18.5" y="56" width="3.2" height="44" fill={color} opacity="0.92" />
      <rect x="24"   y="56" width="2.7" height="44" fill={color} opacity="0.76" />
      <rect x="29"   y="56" width="2.3" height="44" fill={color} opacity="0.62" />
      <rect x="33.5" y="56" width="1.9" height="44" fill={color} opacity="0.48" />
      <rect x="37.5" y="56" width="1.6" height="44" fill={color} opacity="0.36" />
      <rect x="41"   y="56" width="1.3" height="44" fill={color} opacity="0.26" />
      <rect x="44"   y="56" width="1.0" height="44" fill={color} opacity="0.18" />
      <rect x="46.8" y="56" width="0.8" height="44" fill={color} opacity="0.11" />
      <rect x="49.2" y="56" width="0.6" height="44" fill={color} opacity="0.06" />
    </svg>
  )
}
