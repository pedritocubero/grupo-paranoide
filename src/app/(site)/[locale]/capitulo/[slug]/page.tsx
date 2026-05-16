import { getPayloadClient } from '@/lib/payload'
import ChapterPageClient from '@/components/ChapterPageClient'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

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

  const order = chapter.order as number

  const [{ docs: prevDocs }, { docs: nextDocs }] = await Promise.all([
    payload.find({
      collection: 'chapters',
      locale: locale as 'es' | 'en',
      where: { order: { equals: order - 1 } },
      limit: 1,
      depth: 0,
    }),
    payload.find({
      collection: 'chapters',
      locale: locale as 'es' | 'en',
      where: { order: { equals: order + 1 } },
      limit: 1,
      depth: 0,
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
      }}
      prevChapter={prevChapter}
      nextChapter={nextChapter}
      locale={locale}
    />
  )
}
