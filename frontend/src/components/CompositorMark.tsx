/**
 * CompositorMark — The PagePerfect PP monogram
 *
 * Renders the master PP mark directly from the canonical PNG
 * (Gemini_Generated_Image). No SVG trace — the exact source image.
 */

import Image from 'next/image'

export default function CompositorMark({
  size = 28,
  className = '',
}: {
  size?: number
  color?: string
  className?: string
}) {
  const w = Math.round(size * 91 / 104)
  return (
    <Image
      src="/pp-mark.png"
      alt="PagePerfect"
      width={w}
      height={size}
      className={className}
      priority
    />
  )
}
