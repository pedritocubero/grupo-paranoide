import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Lenguas cuyos hablantes leen español sin problema (se les muestra la versión en español).
const SPANISH_READERS = new Set(['es', 'ca', 'gl', 'eu'])

// Elige 'es' o 'en' según el idioma del navegador: gana el primero de la lista
// de preferencias que sea español (o afín) o inglés. Sin cabecera, español.
function pickLocale(header: string | null): 'es' | 'en' {
  if (!header) return 'es'
  const tags = header
    .split(',')
    .map((part, index) => {
      const [tag, ...params] = part.trim().split(';')
      const q = params.find((p) => p.trim().startsWith('q='))
      return { lang: tag.trim().toLowerCase().split('-')[0], q: q ? parseFloat(q.trim().slice(2)) : 1, index }
    })
    .filter((t) => t.lang && !Number.isNaN(t.q) && t.q > 0)
    .sort((a, b) => b.q - a.q || a.index - b.index)
  for (const { lang } of tags) {
    if (SPANISH_READERS.has(lang)) return 'es'
    if (lang === 'en') return 'en'
  }
  return 'en'
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname === '/') {
    const locale = pickLocale(request.headers.get('accept-language'))
    const url = request.nextUrl.clone()
    url.pathname = `/${locale}`
    const redirect = NextResponse.redirect(url, 307)
    redirect.headers.set('Vary', 'Accept-Language')
    return redirect
  }

  const response = NextResponse.next()
  response.headers.set('x-current-path', pathname)
  return response
}

export const config = {
  matcher: ['/((?!_next|api|admin|favicon).*)'],
}
