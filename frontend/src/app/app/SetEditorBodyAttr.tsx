'use client'

import { useEffect } from 'react'

/**
 * Sets data-editor on <body> after mount so server and first client render match (avoids hydration warning).
 * Cleanup removes it when leaving the editor.
 */
export default function SetEditorBodyAttr() {
  useEffect(() => {
    document.body.setAttribute('data-editor', 'true')
    return () => document.body.removeAttribute('data-editor')
  }, [])
  return null
}
