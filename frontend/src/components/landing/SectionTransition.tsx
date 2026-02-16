/**
 * Gradient blend strip between dark ↔ light sections.
 * Renders a 96–120px tall gradient that smoothly transitions
 * between void (dark) and warm paper (light) backgrounds.
 */
export function SectionTransition({ to }: { to: 'light' | 'dark' }) {
  return (
    <div
      aria-hidden
      className={`relative h-24 md:h-30 ${
        to === 'light'
          ? 'bg-gradient-to-b from-[#050507] to-[#f7f6f3]'
          : 'bg-gradient-to-b from-[#f7f6f3] to-[#050507]'
      }`}
    />
  )
}
