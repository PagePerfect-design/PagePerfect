/**
 * Editor layout — hides the site footer and locks viewport scroll.
 * Sets data-editor on <body> and wraps children in data-specimen
 * so the editor inherits the warm paper theme from the marketing site.
 */
export default function EditorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: `document.body.setAttribute('data-editor','true')`,
        }}
      />
      <div data-specimen="" className="fixed inset-0 bg-[#FDFCF8] text-[#111111]">
        {children}
      </div>
    </>
  )
}
