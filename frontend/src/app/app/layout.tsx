/**
 * Editor layout — hides the site footer and locks viewport scroll.
 * Sets data-editor on <body> via inline script so globals.css can
 * target it (hides footer, prevents scroll).
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
      {children}
    </>
  )
}
