import type { Metadata } from 'next'
import Link from 'next/link'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { ARTICLES } from '../articles'

type Props = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  return ARTICLES.map((a) => ({ slug: a.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const article = ARTICLES.find((a) => a.slug === slug)
  if (!article) return {}

  const seo = article.seo
  const title = seo?.metaTitle
    ? `${seo.metaTitle} — PagePerfect Journal`
    : `${article.title} — PagePerfect Journal`
  const description = seo?.metaDescription || article.description

  return {
    title,
    description,
    keywords: seo
      ? [seo.primaryKeyword, ...seo.secondaryKeywords]
      : undefined,
    openGraph: {
      title: seo?.metaTitle || article.title,
      description,
      type: 'article',
      publishedTime: article.date,
      authors: ['PagePerfect Editorial'],
      section: article.category,
    },
  }
}

function estimateWordCount(article: (typeof ARTICLES)[number]): number {
  const allText = [
    article.hook,
    ...article.sections.flatMap((s) => s.paragraphs),
    ...article.conclusion.paragraphs,
  ].join(' ')
  return Math.round(allText.split(/\s+/).length)
}

function JsonLd({ article, nonce }: { article: (typeof ARTICLES)[number]; nonce: string }) {
  const seo = article.seo
  const wordCount = estimateWordCount(article)

  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': seo?.schemaType || 'TechArticle',
    headline: article.title,
    description: seo?.metaDescription || article.description,
    datePublished: article.date,
    author: {
      '@type': 'Organization',
      name: 'PagePerfect',
      url: 'https://pageperfect.studio',
    },
    publisher: {
      '@type': 'Organization',
      name: 'PagePerfect',
      url: 'https://pageperfect.studio',
      logo: {
        '@type': 'ImageObject',
        url: 'https://pageperfect.studio/favicon.ico',
      },
    },
    articleSection: article.category,
    wordCount,
    inLanguage: 'en-GB',
    ...(seo && {
      keywords: [seo.primaryKeyword, ...seo.secondaryKeywords].join(', '),
      proficiencyLevel: seo.proficiencyLevel,
      audience: seo.audience.map((a) => ({
        '@type': 'Audience',
        audienceType: a,
      })),
      about: seo.editorialPillar,
    }),
  }

  return (
    <script
      type="application/ld+json"
      nonce={nonce}
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-[0.625rem] uppercase tracking-[0.15em] text-[#111111]/50 mb-3">
      {children}
    </p>
  )
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params
  const nonce = (await headers()).get('x-nonce') ?? ''
  const index = ARTICLES.findIndex((a) => a.slug === slug)
  if (index === -1) notFound()

  const article = ARTICLES[index]
  const prev = index > 0 ? ARTICLES[index - 1] : null
  const next = index < ARTICLES.length - 1 ? ARTICLES[index + 1] : null

  return (
    <>
      <JsonLd article={article} nonce={nonce} />
      <main id="main">
        <article className="py-12 md:py-20">
          <div className="mx-auto max-w-3xl px-6 md:px-8">
            {/* Header */}
            <header className="journal-header">
              <div className="flex items-center gap-3 mb-4">
                <Link
                  href="/journal"
                  className="font-mono text-[0.625rem] uppercase tracking-[0.15em] text-[#111111]/50 transition-colors hover:text-[#111]"
                >
                  &larr; Journal
                </Link>
                <span className="font-mono text-[0.625rem] text-[#111111]/20">/</span>
                <span className="font-mono text-[0.625rem] uppercase tracking-[0.15em] text-[#111111]/50">
                  {String(index + 1).padStart(2, '0')} / {String(ARTICLES.length).padStart(2, '0')}
                </span>
              </div>

              <SectionLabel>{article.category}</SectionLabel>
              <h1 className="journal-title">{article.title}</h1>

              <div className="journal-meta mt-4">
                <time dateTime={article.date}>
                  {new Date(article.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </time>
                <span className="mx-2">·</span>
                <span>{article.readTime}</span>
                <span className="mx-2">·</span>
                <span>PagePerfect Editorial</span>
              </div>
            </header>

            {/* Article body */}
            <div className="journal-article">
              {/* Hook — with drop cap */}
              <p className="journal-drop-cap">{article.hook}</p>

              {/* Sections */}
              {article.sections.map((section, i) => (
                <section key={i}>
                  <h2 className="journal-subhead">{section.heading}</h2>
                  {section.paragraphs.map((p, j) => (
                    <p key={j}>{p}</p>
                  ))}
                </section>
              ))}

              {/* Conclusion */}
              <div className="journal-conclusion">
                <h2 className="journal-subhead">{article.conclusion.heading}</h2>
                {article.conclusion.paragraphs.map((p, j) => (
                  <p key={j}>{p}</p>
                ))}
              </div>
            </div>

            {/* Navigation */}
            <nav className="mt-16 border-t-2 border-[#111111] pt-8" aria-label="Article navigation">
              <div className="grid grid-cols-2 gap-8">
                <div>
                  {prev && (
                    <Link href={`/journal/${prev.slug}`} className="group block">
                      <span className="font-mono text-[0.5625rem] uppercase tracking-[0.15em] text-[#111111]/50">
                        &larr; Previous
                      </span>
                      <p className="mt-1 font-display text-[0.875rem] font-semibold text-[#333333] transition-colors group-hover:text-[#111] leading-tight">
                        {prev.title}
                      </p>
                    </Link>
                  )}
                </div>
                <div className="text-right">
                  {next && (
                    <Link href={`/journal/${next.slug}`} className="group block">
                      <span className="font-mono text-[0.5625rem] uppercase tracking-[0.15em] text-[#111111]/50">
                        Next &rarr;
                      </span>
                      <p className="mt-1 font-display text-[0.875rem] font-semibold text-[#333333] transition-colors group-hover:text-[#111] leading-tight">
                        {next.title}
                      </p>
                    </Link>
                  )}
                </div>
              </div>
            </nav>

            {/* CTA */}
            <div className="mt-12 border border-[#e5e5e0] bg-[#f5f5f0] p-8">
              <p className="font-mono text-[0.625rem] uppercase tracking-[0.15em] text-[#111111]/50 mb-3">
                Put this into practice
              </p>
              <p className="font-display text-lg font-bold text-[#111]">
                Every principle above is built into PagePerfect.
              </p>
              <p className="mt-2 max-w-md font-body text-sm text-[#4a4a4a]">
                Baseline grids, proportional type scales, and 15 professionally engineered
                templates. Preview for free, export KDP-ready PDFs from $19.99.
              </p>
              <div className="mt-5 flex items-center gap-4">
                <Link
                  href="/app"
                  className="inline-block border border-[#FF3333] bg-[#FF3333] px-8 py-2.5 font-mono text-[10px] uppercase tracking-[0.1em] text-white transition-all duration-200 ease-pp hover:bg-[#E52222] hover:border-[#E52222]"
                >
                  Open the Editor &rarr;
                </Link>
                <Link
                  href="/docs"
                  className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#111111]/50 transition-colors hover:text-[#111111]"
                >
                  Read the docs
                </Link>
              </div>
            </div>
          </div>
        </article>
      </main>
    </>
  )
}
