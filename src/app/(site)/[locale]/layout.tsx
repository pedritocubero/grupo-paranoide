import Link from 'next/link'
import LangSelector from '@/components/LangSelector'

type Props = {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params

  return (
    <>
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-stone-100">
        <nav className="max-w-2xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link
            href={`/${locale}/capitulos`}
            className="font-sans text-sm tracking-wide text-foreground hover:opacity-70 transition-opacity"
          >
            El grupo paranoide
          </Link>
          <LangSelector locale={locale} />
        </nav>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-stone-100 mt-24">
        <div className="max-w-2xl mx-auto px-6 py-8 text-center text-xs text-stone-400 font-sans">
          Pedro Cubero Bros
        </div>
      </footer>
    </>
  )
}
