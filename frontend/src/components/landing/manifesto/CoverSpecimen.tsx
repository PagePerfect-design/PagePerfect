/**
 * CoverSpecimen — the title-page right column.
 *
 * A real typeset interior page, rendered at full scale rather than the
 * miniaturised gallery scale of template-specimens.tsx. This IS the specimen
 * the marketing language promises: running head, chapter opener, drop-cap
 * body, baseline-grid leading, folio, and colophon footer.
 *
 * Self-contained, server-renderable, no images, no fonts beyond those already
 * loaded for the rest of the site. Decorative; aria-hidden inside via role=img
 * on the container so screen readers announce one summary instead of the body
 * text.
 */
export function CoverSpecimen() {
  return (
    <div
      role="img"
      aria-label="Typography specimen — interior book page set in Source Serif 4, 16 on 32, baseline grid visible."
      className="relative flex h-full min-h-[60vh] w-full flex-col bg-[#F9F8F4] px-[10%] py-[12%] md:min-h-0 md:px-[14%] md:py-[16%]"
    >
      {/* Running head — italic chapter title left, mono folio numeral right */}
      <div className="flex items-baseline justify-between font-body text-[12px] italic text-[#111111]/40">
        <span>On Typography</span>
        <span className="font-mono not-italic tracking-[0.2em]">— III —</span>
      </div>

      {/* Chapter opener block */}
      <div className="mt-16 text-center md:mt-24" aria-hidden="true">
        <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-[#111111]/40">
          Chapter Three
        </p>
        <h3 className="mt-4 font-body text-[28px] font-normal italic leading-tight text-[#111111] md:text-[32px]">
          On the Precision of the Line
        </h3>
        <div className="mx-auto mt-6 h-px w-12 bg-[#111111]/30" />
      </div>

      {/* Body — a single typeset paragraph with a real drop cap */}
      <div
        className="mt-12 font-body text-[15px] leading-8 text-[#111111]/85 md:mt-16 md:text-[16px]"
        aria-hidden="true"
      >
        <p className="indent-[1.5em] text-justify">
          <span className="float-left mr-3 mt-1 font-body text-[44px] font-semibold leading-[0.85] text-[#111111] md:text-[52px]">
            T
          </span>
          he morning light filtered through the library windows. She set the
          manuscript on the press and waited&thinsp;&mdash;&thinsp;fifty
          pages of justified prose, each line landing precisely on the
          baseline grid. This was the difference between a draft and a book.
        </p>
      </div>

      {/* Folio + colophon — sits at the bottom of the page */}
      <div className="mt-auto flex items-baseline justify-between border-t border-[#111111]/10 pt-6 font-mono text-[9px] uppercase tracking-[0.28em] text-[#111111]/40">
        <span>Set in Source Serif 4 · 16 / 32</span>
        <span>· 47 ·</span>
      </div>
    </div>
  )
}
