import SetEditorBodyAttr from './SetEditorBodyAttr'

/**
 * Editor layout — hides the site footer and locks viewport scroll.
 * Sets data-editor on <body> after mount (via SetEditorBodyAttr) so server and client match.
 * Wraps children in data-specimen so the editor inherits the warm paper theme from the marketing site.
 */
export default function EditorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <SetEditorBodyAttr />
      <main data-specimen="" className="fixed inset-0 bg-[#FDFCF8] text-[#111111]" role="main" aria-label="PagePerfect Editor">
        {children}
      </main>
    </>
  )
}
