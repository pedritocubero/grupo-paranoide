'use client'

import type { Heading } from '@/lib/headings'
import { useEffect, useRef, useState } from 'react'

type Props = {
  headings: Heading[]
  locale: string
}

export function TableOfContents({ headings, locale }: Props) {
  const [activeId, setActiveId] = useState<string>('')
  const observerRef = useRef<IntersectionObserver | null>(null)
  const navRef = useRef<HTMLElement | null>(null)
  const hoveringRef = useRef(false)

  useEffect(() => {
    observerRef.current?.disconnect()
    const els = headings
      .map((h) => document.getElementById(h.id))
      .filter(Boolean) as HTMLElement[]

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting)
        if (visible.length > 0) setActiveId(visible[0].target.id)
      },
      { rootMargin: '-10% 0px -80% 0px' },
    )
    els.forEach((el) => observerRef.current!.observe(el))
    return () => observerRef.current?.disconnect()
  }, [headings])

  // Al cambiar de apartado, el índice (solo él, no la página) se desplaza para dejar
  // el apartado activo en su centro. Si el lector tiene el ratón sobre el índice, no se
  // mueve, para no arrebatárselo mientras lo recorre.
  useEffect(() => {
    const nav = navRef.current
    if (!nav || !activeId || hoveringRef.current) return
    const link = nav.querySelector<HTMLElement>(`a[href="#${CSS.escape(activeId)}"]`)
    if (!link) return
    const navBox = nav.getBoundingClientRect()
    const linkBox = link.getBoundingClientRect()
    const top = nav.scrollTop + (linkBox.top - navBox.top) - nav.clientHeight / 2 + linkBox.height / 2
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    nav.scrollTo({ top: Math.max(0, top), behavior: reduce ? 'auto' : 'smooth' })
  }, [activeId])

  if (headings.length === 0) return null

  const label = locale === 'es' ? 'En este capítulo' : 'In this chapter'
  const backLabel = locale === 'es' ? '← Volver al libro' : '← Back to book'
  const backHref = `/${locale}/capitulos`

  return (
    <nav
      ref={navRef}
      aria-label={label}
      className="max-h-[calc(100vh-8rem)] overflow-y-auto"
      onMouseEnter={() => { hoveringRef.current = true }}
      onMouseLeave={() => { hoveringRef.current = false }}
    >
      <a
        href={backHref}
        className="block font-sans text-[0.65rem] tracking-widest uppercase text-stone-400 hover:text-stone-600 transition-colors mb-4"
      >
        {backLabel}
      </a>
      <p className="font-sans text-[0.65rem] tracking-widest uppercase text-stone-400 mb-4">
        {label}
      </p>
      <ul className="space-y-1">
        {headings.map((h) => {
          const isActive = activeId === h.id
          const indent = h.tag === 'h3' ? 'pl-3' : h.tag === 'h4' ? 'pl-6' : ''
          return (
            <li key={h.id} className={indent}>
              <a
                href={`#${h.id}`}
                className={[
                  'block font-sans text-xs leading-snug transition-colors py-0.5 border-l-2 pl-2 -ml-2.5',
                  h.tag === 'h2' ? 'font-semibold' : 'font-normal',
                  isActive
                    ? 'text-blue-700 border-blue-700'
                    : 'text-stone-400 border-transparent hover:text-stone-600',
                ].join(' ')}
              >
                {h.text}
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
