import type { MetadataRoute } from 'next'
import { getPayloadClient } from '@/lib/payload'
import { SITE_URL } from '@/lib/seo'

export const revalidate = 3600

// Páginas fijas que se ofrecen en los dos idiomas.
const STATIC_PATHS = ['', '/capitulos', '/obstinaciones', '/sobre-mi']

function entry(path: string): MetadataRoute.Sitemap {
  const languages = { es: `${SITE_URL}/es${path}`, en: `${SITE_URL}/en${path}` }
  return (['es', 'en'] as const).map((l) => ({
    url: `${SITE_URL}/${l}${path}`,
    alternates: { languages },
  }))
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'chapters',
    limit: 200,
    depth: 0,
    select: { slug: true },
  })
  return [
    ...STATIC_PATHS.flatMap(entry),
    ...docs.flatMap((c) => entry(`/capitulo/${c.slug as string}`)),
  ]
}
