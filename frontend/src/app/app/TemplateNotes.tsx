'use client'

export default function TemplateNotes() {
  return (
    <details className="card p-4 mb-4">
      <summary className="flex cursor-pointer list-none items-center justify-between">
        <span className="font-semibold text-ens-midnight">Template notes</span>
        <span className="small-mono text-ens-gray-700">Click to expand</span>
      </summary>

      <div className="mt-3 text-sm leading-6 text-ens-midnight">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold text-ens-midnight mb-2">🎼 Academic & Scholarly</h4>
            <ul className="list-disc space-y-1 pl-5 text-xs">
              <li><span className="font-semibold">Symphony Layout</span> — Classic academic design with harmonious typography</li>
              <li><span className="font-semibold">Chronicle Grid</span> — Editorial-style layout with multi-column grid</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-ens-midnight mb-2">🖼️ Trade & Commercial</h4>
            <ul className="list-disc space-y-1 pl-5 text-xs">
              <li><span className="font-semibold">Exhibit Frame</span> — Modern trade design with clean lines</li>
              <li><span className="font-semibold">Corporate Matrix</span> — Structured business layout</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-ens-midnight mb-2">🎨 Creative & Experimental</h4>
            <ul className="list-disc space-y-1 pl-5 text-xs">
              <li><span className="font-semibold">Avant-Garde Canvas</span> — Experimental design with creative freedom</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-ens-midnight mb-2">📚 Legacy Templates</h4>
            <ul className="list-disc space-y-1 pl-5 text-xs">
              <li><span className="font-semibold">Classic Academic (Chicago)</span> — Traditional academic style</li>
              <li><span className="font-semibold">Modern Trade Paperback</span> — Contemporary trade book design</li>
            </ul>
          </div>
        </div>
        <p className="mt-3 text-xs text-ens-gray-700">
          All templates use Müller-Brockmann&apos;s grid system principles for professional typography and spacing.
        </p>
      </div>
    </details>
  )
}
