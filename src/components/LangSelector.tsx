'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function LangSelector({
  locale,
  light = false,
}: {
  locale: string
  light?: boolean
}) {
  const otherLocale = locale === 'es' ? 'en' : 'es'
  // Misma página en el otro idioma: se cambia solo el primer tramo de la dirección.
  const pathname = usePathname() ?? `/${locale}`
  const target = pathname.startsWith(`/${locale}`)
    ? `/${otherLocale}${pathname.slice(locale.length + 1)}`
    : `/${otherLocale}`

  const active = light ? 'text-white font-semibold' : 'font-semibold text-foreground'
  const inactive = light
    ? 'text-white/50 hover:text-white transition-colors'
    : 'opacity-40 hover:opacity-100 transition-opacity'

  return (
    <div className="flex gap-2 text-sm font-sans tracking-widest uppercase">
      <span className={active}>{locale}</span>
      <span className={light ? 'text-white/30' : 'opacity-30'}>/</span>
      <Link href={target} className={inactive}>
        {otherLocale}
      </Link>
    </div>
  )
}
