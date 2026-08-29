import Link from 'next/link'

type ChapterListItem = {
  slug: string
  title: string
  subtitle?: string | null
  order: number
}

export function ChapterIndexList({
  chapters,
  locale,
}: {
  chapters: ChapterListItem[]
  locale: string
}) {
  return (
    <ol className="space-y-4">
      {chapters.map((chapter) => (
        <li key={chapter.slug}>
          <div className="flex items-baseline gap-4">
            <span className="font-sans text-xs text-stone-300 w-5 shrink-0 text-right">
              {chapter.order}
            </span>
            <div className="flex-1 flex items-baseline justify-between gap-4">
              <Link
                href={`/${locale}/capitulo/${chapter.slug}`}
                className="font-serif text-lg text-foreground hover:text-stone-500 transition-colors"
              >
                {chapter.title}
              </Link>
              <div className="flex items-center gap-3 shrink-0">
                <Link
                  href={`/${locale}/capitulo/${chapter.slug}`}
                  className="font-sans text-[11px] tracking-widest uppercase text-stone-400 hover:text-stone-700 transition-colors"
                >
                  {locale === 'en' ? 'Read' : 'Leer'}
                </Link>
                <a
                  href={`/${locale}/capitulo/${chapter.slug}/pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-sans text-[11px] tracking-widest uppercase text-stone-400 hover:text-stone-700 transition-colors"
                >
                  PDF
                </a>
              </div>
              {chapter.subtitle && (
                <p className="font-sans text-xs text-stone-400 mt-1 leading-relaxed">
                  {chapter.subtitle}
                </p>
              )}
            </div>
          </div>
        </li>
      ))}
    </ol>
  )
}
