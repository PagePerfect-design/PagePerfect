/**
 * CompositorMark — The PagePerfect logo mark
 *
 * A bold P letterform with baseline grid lines descending from the bowl,
 * echoing the typographic grid system at the heart of PagePerfect.
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
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Bold P letterform */}
      <path
        fillRule="evenodd"
        d="M24 12h30c14.5 0 26 11.2 26 25s-11.5 25-26 25H38v24H24V12zM38 49h14c7 0 13-5.6 13-12s-6-12-13-12H38v24z"
        fill={color}
      />

      {/* Baseline grid lines descending from bowl */}
      <rect x="43" y="65" width="2.5" height="22" fill={color} opacity="0.45" />
      <rect x="51" y="65" width="2.5" height="22" fill={color} opacity="0.35" />
      <rect x="59" y="65" width="2.5" height="22" fill={color} opacity="0.25" />
      <rect x="67" y="65" width="2.5" height="22" fill={color} opacity="0.15" />
    </svg>
  )
}
