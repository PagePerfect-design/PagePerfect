'use client'

export default function TemplateNotes() {
  return (
    <details className="card p-4 mb-4">
      <summary className="flex cursor-pointer list-none items-center justify-between">
        <span className="font-semibold text-ens-midnight">Template notes</span>
        <span className="small-mono text-ens-gray-700">Click to expand</span>
      </summary>

      <div className="mt-3 text-sm leading-6 text-ens-midnight">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <span className="font-semibold">Classic Academic (Chicago)</span> — serif (Libertinus),
            indented paragraphs, classic section styling. Best for journal submissions,
            dissertations, and presses that expect Chicago-style citations.
          </li>
          <li>
            <span className="font-semibold">Modern Trade Paperback</span> — sans (Lato), space between
            paragraphs, left-aligned headings. Best for trade non-fiction, proofs, and general
            audience manuscripts.
          </li>
        </ul>
        <p className="mt-2 text-xs text-ens-gray-700">
          You can switch templates any time — the PDF recompiles automatically.
        </p>
      </div>
    </details>
  )
}
