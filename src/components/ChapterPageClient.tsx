'use client'

import { useLivePreview } from '@payloadcms/live-preview-react'
import { RichText } from '@payloadcms/richtext-lexical/react'
import type { SerializedEditorState } from 'lexical'
import Link from 'next/link'
import { TableOfContents } from '@/components/TableOfContents'
import { extractHeadings } from '@/lib/headings'
import { useEffect, useRef, useState } from 'react'

type Section = {
  id?: string
  blockId: string
  content?: SerializedEditorState | null
}

type Chapter = {
  id: string | number
  slug: string
  order: number
  title: string
  subtitle?: string | null
  sections?: Section[]
}

type AdjacentChapter = { slug: string; title: string; order: number } | null

type Props = {
  initialData: Chapter
  locale: string
  prevChapter: AdjacentChapter
  nextChapter: AdjacentChapter
}

const navClass = 'font-sans text-xs tracking-widest uppercase text-stone-400 hover:text-stone-600 transition-colors'

export default function ChapterPageClient({ initialData, locale, prevChapter, nextChapter }: Props) {
  const { data } = useLivePreview<Chapter>({
    initialData,
    serverURL: process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:3000',
    depth: 2,
  })

  const sections = (data.sections ?? []) as Section[]
  const headings = extractHeadings(sections)
  const proseRef = useRef<HTMLDivElement>(null)
  const [showScrollTop, setShowScrollTop] = useState(false)

  useEffect(() => {
    const el = proseRef.current
    if (!el) return
    const seen = new Map<string, number>()
    el.querySelectorAll('h2, h3, h4').forEach((heading) => {
      const text = heading.textContent ?? ''
      const base = text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').slice(0, 80) || 'heading'
      const count = seen.get(base) ?? 0
      seen.set(base, count + 1)
      heading.id = count === 0 ? base : `${base}-${count}`
    })
  }, [sections])

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 500)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const chapterLabel = locale === 'es' ? 'Capítulo' : 'Chapter'
  const backLabel    = locale === 'es' ? '← Volver' : '← Back'
  const prevLabel    = locale === 'es' ? '← Anterior' : '← Previous'
  const nextLabel    = locale === 'es' ? 'Siguiente →' : 'Next →'
  const topLabel     = locale === 'es' ? '↑ Inicio' : '↑ Top'
  const pdfLabel     = locale === 'es' ? '↓ Descargar PDF' : '↓ Download PDF'

  return (
    <div className="flex items-start py-16">

      {/* Sidebar TOC — 80px desde el borde, 200px de ancho, 80px hasta el contenido */}
      <aside className="hidden md:block w-[200px] shrink-0 sticky top-24 self-start ml-[80px] mr-[80px]">
        {headings.length > 0 && <TableOfContents headings={headings} locale={locale} />}
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <article className="max-w-2xl pr-6">

          {/* Nav superior */}
          <header className="mb-12">
            <div className="flex items-center justify-between">
              <Link href={`/${locale}/capitulos`} className={navClass}>
                {backLabel}
              </Link>
              <div className="flex gap-6">
                {prevChapter && (
                  <Link href={`/${locale}/capitulo/${prevChapter.slug}`} className={navClass}>
                    {prevLabel}
                  </Link>
                )}
                {nextChapter && (
                  <Link href={`/${locale}/capitulo/${nextChapter.slug}`} className={navClass}>
                    {nextLabel}
                  </Link>
                )}
              </div>
            </div>

            <div className="mt-8">
              <span className="font-sans text-xs text-stone-300">
                {chapterLabel} {data.order}
              </span>
              <h1 className="font-serif text-4xl leading-tight mt-2 text-foreground">
                {data.title}
              </h1>
              {data.subtitle && (
                <p className="font-sans text-sm text-stone-500 mt-4 leading-relaxed">
                  {data.subtitle}
                </p>
              )}
              <a
                href={`/${locale}/capitulo/${data.slug}/pdf`}
                className={`inline-block mt-6 ${navClass}`}
              >
                {pdfLabel}
              </a>
            </div>
          </header>

          {/* Contenido */}
          <div className="prose" ref={proseRef}>
            {sections.map((section) => (
              <div key={section.blockId} className="section">
                {section.content ? <RichText data={section.content} /> : null}
              </div>
            ))}
          </div>

          {/* Nav inferior */}
          <nav className="mt-20 pt-8 border-t border-stone-100 flex items-center justify-between">
            {prevChapter ? (
              <Link href={`/${locale}/capitulo/${prevChapter.slug}`} className={navClass}>
                ← {prevChapter.title}
              </Link>
            ) : (
              <span />
            )}
            {nextChapter ? (
              <Link href={`/${locale}/capitulo/${nextChapter.slug}`} className={navClass}>
                {nextChapter.title} →
              </Link>
            ) : (
              <span />
            )}
          </nav>

        </article>
      </div>

      {/* Botón volver arriba */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-8 right-8 font-sans text-xs tracking-widest uppercase text-stone-400 hover:text-stone-600 transition-colors bg-white border border-stone-200 rounded-full px-4 py-2 shadow-sm"
        >
          {topLabel}
        </button>
      )}
    </div>
  )
}
