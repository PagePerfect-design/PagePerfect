import { Suspense } from 'react'
import CompileShell from './CompileShell'

export const metadata = {
  title: 'PagePerfect — Editor',
  description: 'Paste your text, pick a template, get a print-ready PDF.',
}

export default function AppPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          <span className="text-sm text-text-tertiary">Loading editor...</span>
        </div>
      </div>
    }>
      <CompileShell />
    </Suspense>
  )
}
