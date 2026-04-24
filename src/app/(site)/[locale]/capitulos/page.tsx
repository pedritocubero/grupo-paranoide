import { getPayloadClient } from '@/lib/payload'
import type { Metadata } from 'next'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  return {
    title: locale === 'es' ? 'Capítulos — El grupo paranoide' : 'Chapters — El grupo paranoide',
  }
}

const PART_LABELS: Record<string, { es: string; en: string }> = {
  I: { es: 'Parte I', en: 'Part I' },
  II: { es: 'Parte II', en: 'Part II' },
  III: { es: 'Parte III', en: 'Part III' },
}

type Props = {
  params: Promise<{ locale: string }>
}

export default async function CapitulosPage({ params }: Props) {
  const { locale } = await params
  const payload = await getPayloadClient()

  const { docs: chapters } = await payload.find({
    collection: 'chapters',
    locale: locale as 'es' | 'en',
    sort: 'order',
    limit: 100,
  })

  const byPart = (['I', 'II', 'III'] as const).map((part) => ({
    part,
    label: PART_LABELS[part][locale as 'es' | 'en'] ?? PART_LABELS[part].es,
    chapters: chapters.filter((c) => c.part === part),
  }))

  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <div className="mb-16 text-center">
        <p className="font-sans text-xs tracking-widest uppercase text-stone-400 mb-4">
          Pedro Cubero Bros
        </p>
        <h1 className="font-serif text-4xl text-foreground leading-tight">
          El grupo paranoide
        </h1>
      </div>

      <div className="space-y-12">
        {byPart.map(({ part, label, chapters: partChapters }) => (
          <section key={part}>
            <h2 className="font-sans text-xs tracking-widest uppercase text-stone-400 mb-6 pb-3 border-b border-stone-100">
              {label}
            </h2>
            <ol className="space-y-4">
              {partChapters.map((chapter) => (
                <li key={chapter.id}>
                  <Link
                    href={`/${locale}/capitulo/${chapter.slug}`}
                    className="group flex items-baseline gap-4 hover:text-stone-600 transition-colors"
                  >
                    <span className="font-sans text-xs text-stone-300 w-5 shrink-0 text-right">
                      {chapter.order}
                    </span>
                    <div>
                      <span className="font-serif text-lg text-foreground group-hover:text-stone-600 transition-colors">
                        {chapter.title as string}
                      </span>
                      {chapter.subtitle && (
                        <p className="font-sans text-xs text-stone-400 mt-1 leading-relaxed">
                          {chapter.subtitle as string}
                        </p>
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>
    </div>
  )
}
