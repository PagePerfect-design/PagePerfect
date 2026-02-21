/**
 * CompositorMark — The PagePerfect PP monogram
 *
 * Bold geometric interlocking PP letterform traced from the master PNG:
 *   - Two heavy vertical stems (width 18) connected by a horizontal top bar
 *   - Elliptical P-bowl on the right (rx 40, ry 33)
 *   - Inner counter (rx 22, ry 16) with evenodd fill rule
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
  const w = Math.round(size * 88 / 100)
  return (
    <svg
      width={w}
      height={size}
      viewBox="0 0 88 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M0,0 H48 A40,33 0 0 1 48,66 V100 H30 V17 H18 V100 H0 Z M48,17 A22,16 0 0 1 48,49 Z"
        fill={color}
      />
    </svg>
  )
}
