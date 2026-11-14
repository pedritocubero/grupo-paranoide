import { getPayloadClient } from '@/lib/payload'
import ChapterPageClient from '@/components/ChapterPageClient'
import type { Metadata } from 'next'
import { SITE_DESCRIPTION, alternatesFor, localeOf, openGraphFor } from '@/lib/seo'
import { notFound } from 'next/navigation'

export const revalidate = 3600

// Lista vacía: no se prepara nada al compilar; cada página se guarda en caché al primer acceso.
export function generateStaticParams() {
  return []
}

type Props = {
  params: Promise<{ locale: string; slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'chapters',
    locale: locale as 'es' | 'en',
    where: { slug: { equals: slug } },
    limit: 1,
    select: { title: true, subtitle: true, part: true },
  })
  const chapter = docs[0]
  if (!chapter) return {}
  const bookName =
    (chapter.part as string) === 'obstinaciones'
      ? locale === 'es'
        ? 'Obstinaciones'
        : 'Obstinacies'
      : locale === 'es'
        ? 'El grupo paranoide'
        : 'The Paranoid Group'
  const title = `${chapter.title as string} — ${bookName}`
  const subtitle = (chapter.subtitle as string | null | undefined) || undefined
  const description = subtitle ?? SITE_DESCRIPTION[localeOf(locale)]
  return {
    title,
    description,
    alternates: alternatesFor(locale, `/capitulo/${slug}`),
    openGraph: openGraphFor(locale, title, `/capitulo/${slug}`, description),
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

  const order = chapter.order as number
  // "El grupo paranoide" son las Partes I/II/III, numeradas de forma continua entre ellas.
  // "Obstinaciones" (y futuras secciones fuera del libro) tienen su propia numeración aparte,
  // así que el capítulo anterior/siguiente no debe cruzar de una a otra.
  const bookParts = (chapter.part as string) === 'obstinaciones' ? ['obstinaciones'] : ['I', 'II', 'III']

  const [{ docs: prevDocs }, { docs: nextDocs }] = await Promise.all([
    payload.find({
      collection: 'chapters',
      locale: locale as 'es' | 'en',
      where: { and: [{ order: { equals: order - 1 } }, { part: { in: bookParts } }] },
      limit: 1,
      depth: 0,
      select: { slug: true, title: true, order: true },
    }),
    payload.find({
      collection: 'chapters',
      locale: locale as 'es' | 'en',
      where: { and: [{ order: { equals: order + 1 } }, { part: { in: bookParts } }] },
      limit: 1,
      depth: 0,
      select: { slug: true, title: true, order: true },
    }),
  ])

  const prevChapter = prevDocs[0]
    ? { slug: prevDocs[0].slug as string, title: prevDocs[0].title as string, order: prevDocs[0].order as number }
    : null
  const nextChapter = nextDocs[0]
    ? { slug: nextDocs[0].slug as string, title: nextDocs[0].title as string, order: nextDocs[0].order as number }
    : null

  return (
    <ChapterPageClient
      initialData={{
        id: chapter.id,
        slug: chapter.slug as string,
        order: chapter.order as number,
        title: chapter.title as string,
        subtitle: chapter.subtitle as string | null | undefined,
        sections: chapter.sections as any,
        references: (chapter.references ?? []) as any,
      }}
      prevChapter={prevChapter}
      nextChapter={nextChapter}
      locale={locale}
    />
  )
}
