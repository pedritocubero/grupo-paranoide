export const SITE_URL = 'https://elgrupoparanoide.com'

export const SITE_DESCRIPTION = {
  es: 'El grupo paranoide: ensayo de Pedro Cubero Bros, de lectura libre y gratuita, con descarga en PDF.',
  en: 'The Paranoid Group: an essay by Pedro Cubero Bros, free to read online, with PDF download.',
} as const

export function localeOf(locale: string): 'es' | 'en' {
  return locale === 'en' ? 'en' : 'es'
}

// Marcas para buscadores: dirección principal de la página y su versión en el otro idioma.
// `path` es la ruta sin idioma, p. ej. '' (portada), '/capitulos' o '/capitulo/mi-capitulo'.
export function alternatesFor(locale: string, path: string) {
  return {
    canonical: `${SITE_URL}/${localeOf(locale)}${path}`,
    languages: {
      es: `${SITE_URL}/es${path}`,
      en: `${SITE_URL}/en${path}`,
      'x-default': `${SITE_URL}/${path ? 'es' : ''}${path}`,
    },
  }
}

export function openGraphFor(locale: string, title: string, path: string, description?: string) {
  const l = localeOf(locale)
  return {
    title,
    description: description ?? SITE_DESCRIPTION[l],
    url: `${SITE_URL}/${l}${path}`,
    siteName: l === 'en' ? 'The Paranoid Group' : 'El grupo paranoide',
    locale: l === 'en' ? 'en_US' : 'es_ES',
    alternateLocale: l === 'en' ? 'es_ES' : 'en_US',
    type: 'website' as const,
  }
}
