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

export default async function HeroLayout({ children, params }: Props) {
  const { locale } = await params

  return (
    <div className="min-h-screen bg-stone-900">
      <header className="absolute top-0 left-0 right-0 z-10">
        <nav className="w-full px-10 h-16 flex items-center justify-between gap-8">
          <Link
            href="/"
            className="font-serif text-2xl text-white hover:text-amber-50 transition-colors shrink-0"
          >
            Pedro Cubero Bros
          </Link>
          <div className="flex items-center gap-8">
            {NAV_LINKS.map(({ href, es, en }) => (
              <Link
                key={href}
                href={`/${locale}${href}`}
                className="font-sans text-[11px] tracking-widest uppercase text-white/95 hover:text-white transition-colors hidden md:block"
              >
                {locale === 'en' ? en : es}
              </Link>
            ))}
            <LangSelector locale={locale} light />
          </div>
        </nav>
      </header>
      {children}
    </div>
  )
}
