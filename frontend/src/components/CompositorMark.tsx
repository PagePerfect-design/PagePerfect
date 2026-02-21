/**
 * CompositorMark — The PagePerfect PP monogram
 *
 * Bold geometric interlocking PP letterform:
 *   - Two heavy vertical stems connected by a horizontal top bar
 *   - Semicircular P-bowl on the right
 *   - Single path with evenodd fill rule for the counter
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
  const w = Math.round(size * 62 / 90)
  return (
    <svg
      width={w}
      height={size}
      viewBox="0 0 62 90"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M0,0 H36 A26,26 0 0 1 36,52 V90 H22 V14 H14 V90 H0 Z M36,14 A12,12 0 0 1 36,38 Z"
        fill={color}
      />
    </svg>
  )
}
