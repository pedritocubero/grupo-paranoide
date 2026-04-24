import { getPayloadClient } from '@/lib/payload'
import { RichText } from '@payloadcms/richtext-lexical/react'
import type { SerializedEditorState } from 'lexical'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

type Props = {
  params: Promise<{ locale: string; slug: string }>
}

export async function generateStaticParams() {
  try {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({ collection: 'chapters', limit: 100 })
    return ['es', 'en'].flatMap((locale) =>
      docs.map((chapter) => ({ locale, slug: chapter.slug as string })),
    )
  } catch {
    return []
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'chapters',
    locale: locale as 'es' | 'en',
    where: { slug: { equals: slug } },
    limit: 1,
  })
  const chapter = docs[0]
  if (!chapter) return {}
  return {
    title: `${chapter.title as string} — El grupo paranoide`,
  }
}

export default async function CapituloPage({ params }: Props) {
  const { locale, slug } = await params
  const payload = await getPayloadClient()

  const { docs } = await payload.find({
    collection: 'chapters',
    locale: locale as 'es' | 'en',
    where: { slug: { equals: slug } },
    limit: 1,
  })

  const chapter = docs[0]
  if (!chapter) notFound()

  const sections = (chapter.sections ?? []) as Array<{
    id?: string
    blockId: string
    content?: SerializedEditorState | null
  }>

  return (
    <article className="max-w-2xl mx-auto px-6 py-16">
      <header className="mb-12">
        <Link
          href={`/${locale}/capitulos`}
          className="font-sans text-xs tracking-widest uppercase text-stone-400 hover:text-stone-600 transition-colors"
        >
          ← {locale === 'es' ? 'Índice' : 'Contents'}
        </Link>
        <div className="mt-8">
          <span className="font-sans text-xs text-stone-300">
            {locale === 'es' ? 'Capítulo' : 'Chapter'} {chapter.order as number}
          </span>
          <h1 className="font-serif text-4xl leading-tight mt-2 text-foreground">
            {chapter.title as string}
          </h1>
          {chapter.subtitle && (
            <p className="font-sans text-sm text-stone-500 mt-4 leading-relaxed">
              {chapter.subtitle as string}
            </p>
          )}
        </div>
      </header>

      <div className="prose">
        {sections.map((section) => (
          <div key={section.blockId} className="section">
            {section.content ? (
              <RichText data={section.content} />
            ) : null}
          </div>
        ))}
      </div>

      <nav className="mt-20 pt-8 border-t border-stone-100">
        <Link
          href={`/${locale}/capitulos`}
          className="font-sans text-xs tracking-widest uppercase text-stone-400 hover:text-stone-600 transition-colors"
        >
          ← {locale === 'es' ? 'Todos los capítulos' : 'All chapters'}
        </Link>
      </nav>
    </article>
  )
}
