'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function LangSelector({ locale }: { locale: string }) {
  const pathname = usePathname()
  const otherLocale = locale === 'es' ? 'en' : 'es'
  const otherPath = pathname.replace(new RegExp(`^/${locale}(/|$)`), `/${otherLocale}$1`)

  return (
    <div className="flex gap-2 text-sm font-sans tracking-widest uppercase">
      <span className="font-semibold text-foreground">{locale}</span>
      <span className="opacity-30">/</span>
      <Link href={otherPath} className="opacity-40 hover:opacity-100 transition-opacity">
        {otherLocale}
      </Link>
    </div>
  )
}
