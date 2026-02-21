import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Data & Privacy — PagePerfect',
  description:
    'How PagePerfect handles your manuscripts, your data, and your trust. Plain English on the left. Legal clause on the right.',
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

export default function PrivacyPage() {
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
            Data &amp; Privacy
          </h1>
          <div className="mt-8 border-l-4 border-[#111111] pl-6">
            <p className="font-body text-base leading-relaxed text-[#000000]">
              <strong>PagePerfect</strong> is engineered and operated by <strong>eazyaccess ltd</strong>.
              This document outlines the objective terms of our relationship and the mechanical
              handling of your data.
            </p>
          </div>
          <p className="mt-6 max-w-3xl font-body text-base leading-relaxed text-[#333333]">
            Authors trust us with unpublished work. We treat that trust as an engineering
            constraint, not a marketing promise. Below: every data operation described in
            plain English on the left, binding legal language on the right.
          </p>
        </div>
      </section>

      {/* Clauses */}
      <section className="py-12 md:py-16">
        <div className="mx-auto max-w-7xl px-6 md:px-8">
          <Clause
            number="01"
            promise={
              <>
                We do not save your book.<br /><br />
                Your manuscript is sent to our servers, compiled into a PDF, and immediately
                deleted. We do not read it. We do not store it. We do not use it to train AI.
              </>
            }
            legal={
              <>
                <strong>01. Transient Data Processing.</strong> Upon submission via the
                &ldquo;Compile&rdquo; function, user-provided text files (.txt, .md, .docx) are
                held in temporary server memory solely for the duration of the LuaLaTeX compilation
                process. Upon successful generation of the output file (.pdf) or upon compilation
                failure, the source material is permanently purged from active systems via
                filesystem deletion of the temporary directory. No copy, cache, backup, or
                derivative of the manuscript content is retained beyond the compilation session.
                eazyaccess ltd does not perform any content analysis, machine learning training,
                or natural language processing on user manuscripts.
              </>
            }
          />

          <Clause
            number="02"
            promise={
              <>
                Your account stores the minimum.<br /><br />
                Email, display name, and which tier you pay for. That&rsquo;s the entire record.
                We do not profile you. We do not sell your data.
              </>
            }
            legal={
              <>
                <strong>02. Account Data.</strong> Upon registration, the following personal data is
                collected and stored in our self-hosted PocketBase database: email address, display
                name (optional, user-provided), authentication method (email/password or OAuth
                provider token), subscription tier (Drafter, Publisher, or Studio), and Stripe
                customer/subscription identifiers for paying users. No additional personal data is
                collected, inferred, or purchased from third-party data brokers. eazyaccess ltd does
                not sell, rent, license, or otherwise commercialise user personal data to any third
                party under any circumstances.
              </>
            }
          />

          <Clause
            number="03"
            promise={
              <>
                Payments go through Stripe. We never see your card number.<br /><br />
                Stripe is a PCI-DSS Level 1 processor. Your card details exist only on
                their infrastructure.
              </>
            }
            legal={
              <>
                <strong>03. Payment Processing.</strong> All financial transactions are processed
                by Stripe, Inc., a PCI-DSS Level 1 certified payment processor. Card numbers,
                CVVs, and banking credentials are transmitted directly from the user&rsquo;s
                browser to Stripe&rsquo;s infrastructure via Stripe.js and are never received by,
                transmitted through, or stored on eazyaccess ltd servers. eazyaccess ltd receives
                only: a payment confirmation token, the associated Stripe customer ID, and
                subscription status. Stripe&rsquo;s privacy policy governs the handling of payment
                data on their systems.
              </>
            }
          />

          <Clause
            number="04"
            promise={
              <>
                OAuth means we don&rsquo;t store your password from Google or GitHub.<br /><br />
                If you sign in via OAuth, we receive your email and display name.
                We never receive or store your provider password.
              </>
            }
            legal={
              <>
                <strong>04. Third-Party Authentication.</strong> Users may authenticate via
                Google OAuth 2.0 or GitHub OAuth. Upon successful authentication, eazyaccess ltd
                receives: email address, display name, and a provider-scoped access token. We do
                not request, receive, or store the user&rsquo;s password from any OAuth provider.
                Token scope is limited to profile identification. Users may revoke PagePerfect&rsquo;s
                access at any time via their Google or GitHub account settings.
              </>
            }
          />

          <Clause
            number="05"
            promise={
              <>
                Your compile history is a counter, not a surveillance log.<br /><br />
                We record which template and page size you used, whether it succeeded, and how
                long it took. We do not record the content of your manuscript.
              </>
            }
            legal={
              <>
                <strong>05. Compilation Metadata.</strong> For each compilation request, the
                following non-content metadata is recorded: user ID (if authenticated), template
                identifier, page size identifier, compilation status (success/failure), compilation
                duration in milliseconds, and error classification (if applicable). This metadata
                is used solely for service reliability monitoring, rate limiting, and aggregate
                usage analytics. No manuscript content, titles, headings, or textual fragments
                are included in compilation metadata records.
              </>
            }
          />

          <Clause
            number="06"
            promise={
              <>
                Your data lives on our own server. Not on a shared cloud.<br /><br />
                PocketBase runs on a Digital Ocean droplet we control. Your data is not
                in a multi-tenant SaaS database.
              </>
            }
            legal={
              <>
                <strong>06. Data Hosting &amp; Infrastructure.</strong> User account data is stored
                in a self-hosted PocketBase instance running on a dedicated Digital Ocean virtual
                machine managed by eazyaccess ltd via the Coolify deployment platform. The database
                engine is SQLite, operating within a single-tenant environment. The backend
                compilation service runs in an isolated Docker container on the same infrastructure.
                No user data is stored on third-party SaaS platforms beyond the payment processing
                described in Section 03.
              </>
            }
          />

          <Clause
            number="07"
            promise={
              <>
                You can delete your account and everything goes with it.<br /><br />
                Request deletion and we purge your account, compile history, and Stripe
                association. There is nothing left.
              </>
            }
            legal={
              <>
                <strong>07. Data Deletion &amp; Portability.</strong> Users may request complete
                account deletion by contacting privacy@pageperfect.studio. Upon verified request,
                eazyaccess ltd will permanently delete: the user record, all associated compilation
                metadata, and the Stripe customer association (note: Stripe retains its own records
                per their data retention policy and applicable financial regulations). Deletion is
                executed within 30 calendar days of verified request. Users may export their account
                data in JSON format prior to deletion upon request.
              </>
            }
          />

          <Clause
            number="08"
            promise={
              <>
                We use functional cookies only.<br /><br />
                One cookie keeps you logged in. We run telemetry to monitor uptime.
                No advertising trackers. No third-party analytics.
              </>
            }
            legal={
              <>
                <strong>08. Cookies &amp; Telemetry.</strong> PagePerfect uses strictly necessary
                cookies for session authentication (PocketBase auth token). Functional telemetry
                is collected for service reliability monitoring (error rates, compilation success
                rates, page load performance). No third-party advertising cookies, tracking pixels,
                or cross-site identifiers are deployed. See our{' '}
                <a href="/cookies" className="underline underline-offset-2 hover:text-[#FF3333]">
                  Tracking &amp; Telemetry
                </a>{' '}
                page for the complete cookie inventory.
              </>
            }
          />

          <Clause
            number="09"
            promise={
              <>
                If we change this policy, we tell you directly.<br /><br />
                No silent updates buried in a changelog. Material changes trigger an email
                to every registered user, 30 days before they take effect.
              </>
            }
            legal={
              <>
                <strong>09. Policy Amendments.</strong> eazyaccess ltd reserves the right to amend
                this policy. Material changes — defined as any modification affecting the collection,
                processing, sharing, or retention of personal data — will be communicated to all
                registered users via the email address on file no fewer than 30 calendar days
                before the effective date. The &ldquo;Effective&rdquo; date at the top of this document
                reflects the date of the most recent revision. Continued use of the service after
                the effective date constitutes acceptance of the amended terms.
              </>
            }
          />

          <Clause
            number="10"
            promise={
              <>
                eazyaccess ltd is the legal entity responsible.<br /><br />
                Registered in England and Wales. For any data inquiry, contact
                privacy@pageperfect.studio.
              </>
            }
            legal={
              <>
                <strong>10. Data Controller.</strong> The data controller for all personal data
                processed under this policy is eazyaccess ltd, a company registered in England
                and Wales. For all data protection inquiries, subject access requests, or
                complaints, contact: privacy@pageperfect.studio. If you believe your data
                protection rights have not been adequately addressed, you have the right to lodge
                a complaint with the Information Commissioner&rsquo;s Office (ICO) at ico.org.uk.
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
            This policy is written in plain English because we believe clarity is a legal
            obligation, not a design choice. If any clause is unclear, email
            privacy@pageperfect.studio and we will explain it.
          </p>
        </div>
      </section>
    </main>
  )
}
