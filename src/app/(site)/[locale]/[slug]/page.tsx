import { getPayloadClient } from '@/lib/payload'
import { RichText } from '@payloadcms/richtext-lexical/react'
import type { SerializedEditorState } from 'lexical'
import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

type Props = {
  params: Promise<{ locale: string; slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'pages',
    locale: locale as 'es' | 'en',
    where: { slug: { equals: slug } },
    limit: 1,
  })
  const page = docs[0]
  if (!page) return {}
  return { title: `${page.title as string} — Pedro Cubero Bros` }
}

export default async function PageRoute({ params }: Props) {
  const { locale, slug } = await params
  const payload = await getPayloadClient()

  const { docs } = await payload.find({
    collection: 'pages',
    locale: locale as 'es' | 'en',
    where: { slug: { equals: slug } },
    limit: 1,
  })

  const page = docs[0]
  if (!page) notFound()

  const raw = page.imageUrl as string | null | undefined
  const imageUrl =
    raw && (raw.startsWith('/') || raw.startsWith('http://') || raw.startsWith('https://'))
      ? raw
      : null

  // Layout de dos columnas cuando hay foto (ej: Sobre mí)
  if (imageUrl) {
    return (
      <article className="max-w-5xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Columna izquierda: título + texto */}
          <div className="md:col-span-2">
            <h1 className="font-serif text-5xl leading-tight text-foreground mb-10">
              {page.title as string}
            </h1>
            <div className="prose">
              {page.content ? (
                <RichText data={page.content as SerializedEditorState} />
              ) : null}
            </div>
          </div>
          {/* Columna derecha: foto */}
          <div className="md:col-span-1">
            <div className="relative w-full aspect-[3/4] overflow-hidden rounded-sm bg-stone-100">
              <Image
                src={imageUrl}
                alt={page.title as string}
                fill
                className="object-cover object-top"
                priority
              />
            </div>
          </div>
        </div>
      </article>
    )
  }

  // Layout estándar sin foto
  return (
    <article className="max-w-2xl mx-auto px-6 py-16">
      <header className="mb-12">
        <h1 className="font-serif text-4xl leading-tight text-foreground">
          {page.title as string}
        </h1>
      </header>
      <div className="prose">
        {page.content ? (
          <RichText data={page.content as SerializedEditorState} />
        ) : null}
      </div>
    </article>
  )
}
