import Image from 'next/image'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'El grupo paranoide — Pedro Cubero Bros',
}

type Props = {
  params: Promise<{ locale: string }>
}

export default async function LandingPage({ params }: Props) {
  const { locale } = await params
  const isEn = locale === 'en'

  return (
    <>
      {/* Sección 1 — Hero principal con lémur */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <Image
          src="/lemur1.jpg"
          alt="El grupo paranoide"
          fill
          className="object-cover object-top"
          priority
        />
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative z-10 text-center text-white px-6">
          <h1 className="font-serif text-6xl md:text-7xl leading-tight">
            {isEn ? 'The Paranoid Group' : 'El grupo paranoide'}
          </h1>
        </div>
      </section>

      {/* Sección 2 — Contacto */}
      <section className="py-24 flex items-center justify-center bg-white">
        <a
          href="mailto:pedrocubero@icloud.com"
          className="font-sans text-sm tracking-widest text-stone-500 hover:text-stone-800 transition-colors border-b border-stone-300 hover:border-stone-600 pb-0.5"
        >
          pedrocubero@icloud.com
        </a>
      </section>
    </>
  )
}
