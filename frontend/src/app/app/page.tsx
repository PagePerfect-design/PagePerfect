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
        <div role="status" aria-live="polite" className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#111111]/20 border-t-[#111111]" />
          <span className="text-sm text-[#555555]">Loading editor...</span>
        </div>
      </div>
    }>
      <CompileShell />
    </Suspense>
  )
}
