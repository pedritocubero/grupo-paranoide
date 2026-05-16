import Link from 'next/link'
import LangSelector from '@/components/LangSelector'

type Props = {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

const NAV_LINKS = [
  { href: '/capitulos', es: 'El grupo paranoide', en: 'The Paranoid Group' },
  { href: '/obstinaciones', es: 'Obstinaciones', en: 'Obsessions' },
  { href: '/depresion', es: 'Depresión', en: 'Depression' },
  { href: '/sobre-mi', es: 'Sobre mí', en: 'About me' },
]

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params

  return (
    <>
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-stone-100">
        <nav className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between gap-8">
          <Link
            href="/"
            className="font-sans text-sm text-stone-500 hover:text-foreground transition-colors shrink-0"
          >
            Pedro Cubero Bros
          </Link>
          <div className="flex items-center gap-6">
            {NAV_LINKS.map(({ href, es, en }) => (
              <Link
                key={href}
                href={`/${locale}${href}`}
                className="font-sans text-sm text-stone-600 hover:text-foreground transition-colors hidden md:block"
              >
                {locale === 'en' ? en : es}
              </Link>
            ))}
            <LangSelector locale={locale} />
          </div>
        </nav>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-stone-100 mt-24">
        <div className="max-w-2xl mx-auto px-6 py-8 text-center font-sans text-xs text-stone-400 space-y-1">
          <p>Pedro Cubero Bros · {new Date().getFullYear()}</p>
          <p>
            <a
              href="mailto:pedrocubero@icloud.com"
              className="hover:text-stone-600 transition-colors"
            >
              pedrocubero@icloud.com
            </a>
          </p>
        </div>
      </footer>
    </>
  )
}
