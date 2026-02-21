import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Tracking & Telemetry — PagePerfect',
  description:
    'The complete inventory of cookies and telemetry used by PagePerfect. No advertising trackers. No cross-site identifiers.',
}

/* ─── Cookie inventory row ─── */

function CookieRow({
  name,
  type,
  duration,
  purpose,
}: {
  name: string
  type: 'Essential' | 'Functional'
  duration: string
  purpose: string
}) {
  return (
    <tr className="border-b border-[#111111]/20">
      <td className="py-4 pr-4 align-top font-mono text-[13px] font-semibold text-[#000000]">
        {name}
      </td>
      <td className="py-4 pr-4 align-top">
        <span className="inline-block border border-[#111111] px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-[#111111]">
          {type}
        </span>
      </td>
      <td className="py-4 pr-4 align-top font-mono text-[13px] text-[#333333]">
        {duration}
      </td>
      <td className="py-4 align-top font-body text-[14px] leading-relaxed text-[#000000]">
        {purpose}
      </td>
    </tr>
  )
}

/* ─── Two-column clause component ─── */

function Clause({
  number,
  promise,
  legal,
}: {
  number: string
  promise: React.ReactNode
  legal: React.ReactNode
}) {
  return (
    <div className="grid grid-cols-1 gap-6 border-b border-[#111111] py-10 md:grid-cols-[1fr_2fr] md:gap-12">
      <div>
        <p className="mb-2 font-mono text-[0.625rem] uppercase tracking-[0.15em] text-[#111111]/50">
          {number} — Plain English
        </p>
        <div className="font-display text-[15px] font-bold leading-snug text-[#000000]">
          {promise}
        </div>
      </div>
      <div>
        <p className="mb-2 font-mono text-[0.625rem] uppercase tracking-[0.15em] text-[#111111]/50">
          Legal Clause
        </p>
        <div className="font-body text-[15px] leading-relaxed text-[#000000]" style={{ textAlign: 'left' }}>
          {legal}
        </div>
      </div>
    </div>
  )
}

export default function CookiesPage() {
  return (
    <main id="main">
      {/* Header */}
      <section className="border-b-2 border-[#111111] py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-6 md:px-8">
          <p className="mb-3 font-mono text-[0.625rem] uppercase tracking-[0.15em] text-[#111111]/50">
            Legal — Effective 21 February 2026
          </p>
          <h1
            className="font-display text-h1 font-extrabold tracking-tighter text-[#111111]"
            style={{ lineHeight: 0.95 }}
          >
            Tracking &amp; Telemetry
          </h1>
          <div className="mt-8 border-l-4 border-[#111111] pl-6">
            <p className="font-body text-base leading-relaxed text-[#000000]">
              <strong>PagePerfect</strong> is engineered and operated by <strong>eazyaccess ltd</strong>.
              This document is the complete inventory of every cookie and telemetry signal
              this site deploys.
            </p>
          </div>
          <p className="mt-6 max-w-3xl font-body text-base leading-relaxed text-[#333333]">
            We run essential cookies to keep you logged in and functional telemetry to see
            if our engine is crashing. We do not run third-party advertising trackers.
            The full table is below.
          </p>
        </div>
      </section>

      {/* Cookie inventory table */}
      <section className="py-12 md:py-16">
        <div className="mx-auto max-w-7xl px-6 md:px-8">
          <p className="mb-6 font-mono text-[0.625rem] uppercase tracking-[0.15em] text-[#111111]/50">
            Complete Cookie Inventory
          </p>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-[#111111]">
                  <th className="pb-3 pr-4 text-left font-mono text-[10px] uppercase tracking-[0.15em] text-[#111111]">
                    Cookie
                  </th>
                  <th className="pb-3 pr-4 text-left font-mono text-[10px] uppercase tracking-[0.15em] text-[#111111]">
                    Type
                  </th>
                  <th className="pb-3 pr-4 text-left font-mono text-[10px] uppercase tracking-[0.15em] text-[#111111]">
                    Duration
                  </th>
                  <th className="pb-3 text-left font-mono text-[10px] uppercase tracking-[0.15em] text-[#111111]">
                    Purpose
                  </th>
                </tr>
              </thead>
              <tbody>
                <CookieRow
                  name="pb_auth"
                  type="Essential"
                  duration="14 days"
                  purpose="PocketBase session authentication token. Keeps you logged in across browser sessions. Contains a JWT with your user ID and expiration timestamp. No personal data beyond authentication state."
                />
                <CookieRow
                  name="pp-prefs-v1"
                  type="Functional"
                  duration="Persistent"
                  purpose="Editor preferences stored in localStorage (not a cookie, but disclosed for transparency). Stores: selected template, page size, margin preset, editor theme preference. No personal data. Cleared when you clear browser storage."
                />
                <CookieRow
                  name="pp-cookie-consent"
                  type="Essential"
                  duration="365 days"
                  purpose="Records whether you have acknowledged the cookie notice. Stores only 'accepted' or 'dismissed'. No tracking data."
                />
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-[#111111]">
                  <td colSpan={4} className="pt-4 font-mono text-[11px] text-[#333333]">
                    Total: 3 items. Zero advertising trackers. Zero third-party analytics scripts.
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </section>

      {/* Clauses */}
      <section className="border-t border-[#111111] py-12 md:py-16">
        <div className="mx-auto max-w-7xl px-6 md:px-8">
          <Clause
            number="01"
            promise={
              <>
                No advertising trackers. Period.<br /><br />
                We do not run Google Analytics, Facebook Pixel, Hotjar, or any third-party
                tracker that profiles you across the web.
              </>
            }
            legal={
              <>
                <strong>01. Third-Party Tracking.</strong> PagePerfect does not deploy third-party
                advertising cookies, tracking pixels, retargeting tags, or cross-site identifiers
                of any kind. No data is transmitted to Google Analytics, Meta/Facebook, Hotjar,
                Mixpanel, Amplitude, or any comparable analytics or advertising platform.
                eazyaccess ltd does not participate in any real-time bidding, data marketplace,
                or audience-sharing arrangement.
              </>
            }
          />

          <Clause
            number="02"
            promise={
              <>
                Telemetry means &ldquo;is the engine broken?&rdquo;<br /><br />
                We measure: compilation success rates, error types, and page load performance.
                We do not measure what you write.
              </>
            }
            legal={
              <>
                <strong>02. Functional Telemetry.</strong> eazyaccess ltd collects server-side
                telemetry for operational monitoring: HTTP request logs (method, path, status code,
                response time — logged via Morgan middleware), compilation success/failure rates,
                error classification codes, and infrastructure health metrics. Client-side
                performance data (page load timing, connection latency) is collected via the{' '}
                <Link href="/status" className="underline underline-offset-2 hover:text-[#FF3333]">
                  Status
                </Link>{' '}
                page diagnostics when explicitly initiated by the user. No telemetry system
                accesses, reads, or transmits manuscript content.
              </>
            }
          />

          <Clause
            number="03"
            promise={
              <>
                You can delete all cookies right now.<br /><br />
                Clear your browser cookies for pageperfect.studio. You will be logged
                out and your editor preferences will reset. That is all that happens.
              </>
            }
            legal={
              <>
                <strong>03. Cookie Management &amp; Deletion.</strong> Users may delete all
                PagePerfect cookies at any time via their browser settings. Deletion of the
                <code className="mx-1 bg-[#f5f5f0] px-1.5 py-0.5 font-mono text-[13px]">pb_auth</code>
                cookie will terminate the active session, requiring re-authentication. Deletion
                of localStorage data will reset editor preferences to defaults. No service
                degradation occurs beyond the loss of session state and preferences. Users may
                also use their browser&rsquo;s &ldquo;incognito&rdquo; or &ldquo;private
                browsing&rdquo; mode, which discards all cookies upon window close.
              </>
            }
          />

          <Clause
            number="04"
            promise={
              <>
                No cookie walls. No dark patterns.<br /><br />
                You can use PagePerfect without accepting non-essential cookies.
                The authentication cookie is strictly necessary and exempt from consent
                under ePrivacy regulations.
              </>
            }
            legal={
              <>
                <strong>04. Consent &amp; ePrivacy Compliance.</strong> The
                <code className="mx-1 bg-[#f5f5f0] px-1.5 py-0.5 font-mono text-[13px]">pb_auth</code>
                session cookie is classified as &ldquo;strictly necessary&rdquo; under Article 5(3)
                of the ePrivacy Directive (2002/58/EC as amended by 2009/136/EC) and is exempt
                from consent requirements. The
                <code className="mx-1 bg-[#f5f5f0] px-1.5 py-0.5 font-mono text-[13px]">pp-prefs-v1</code>
                localStorage entry is classified as functional and is disclosed in the cookie
                banner. No service functionality is gated behind cookie consent beyond
                authentication.
              </>
            }
          />
        </div>
      </section>

      {/* Footer note */}
      <section className="border-t-2 border-[#111111] py-12">
        <div className="mx-auto max-w-7xl px-6 md:px-8">
          <p className="font-mono text-[0.625rem] uppercase tracking-[0.15em] text-[#111111]/50">
            Document version 1.0 — 21 February 2026
          </p>
          <p className="mt-3 font-body text-sm leading-relaxed text-[#333333]">
            If we add any new cookie or telemetry signal, this page is updated and users
            are notified per the amendment process in our{' '}
            <Link href="/privacy" className="underline underline-offset-2 hover:text-[#FF3333]">
              Data &amp; Privacy
            </Link>{' '}
            policy.
          </p>
        </div>
      </section>
    </main>
  )
}
