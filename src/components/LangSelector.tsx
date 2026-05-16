import Link from 'next/link'

export default function LangSelector({
  locale,
  light = false,
}: {
  locale: string
  light?: boolean
}) {
  const otherLocale = locale === 'es' ? 'en' : 'es'

  const active = light ? 'text-white font-semibold' : 'font-semibold text-foreground'
  const inactive = light
    ? 'text-white/50 hover:text-white transition-colors'
    : 'opacity-40 hover:opacity-100 transition-opacity'

  return (
    <div className="flex gap-2 text-sm font-sans tracking-widest uppercase">
      <span className={active}>{locale}</span>
      <span className={light ? 'text-white/30' : 'opacity-30'}>/</span>
      <Link href={`/${otherLocale}`} className={inactive}>
        {otherLocale}
      </Link>
    </div>
  )
}
