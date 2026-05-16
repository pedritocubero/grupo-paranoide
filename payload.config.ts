import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { fileURLToPath } from 'url'

import { Users } from './src/collections/Users'
import { Chapters } from './src/collections/Chapters'
import { GlossaryTerms } from './src/collections/GlossaryTerms'
import { Pages } from './src/collections/Pages'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    components: {
      beforeDashboard: [
        '@/components/admin/AnalyticsLink#AnalyticsLink',
        '@/components/admin/DownloadBookButton#DownloadBookButton',
        '@/components/admin/WorkflowGuide#WorkflowGuide',
      ],
    },
    livePreview: {
      url: ({ data, collectionConfig, locale }) => {
        const base = process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:3000'
        const loc = (locale as unknown as string) ?? 'es'
        if (collectionConfig?.slug === 'chapters') {
          return `${base}/${loc}/capitulo/${data.slug}`
        }
        if (collectionConfig?.slug === 'pages') {
          return `${base}/${loc}/${data.slug}`
        }
        return base
      },
      collections: ['chapters', 'pages'],
      breakpoints: [
        { label: 'Desktop', name: 'desktop', width: 1440, height: 900 },
        { label: 'Móvil', name: 'mobile', width: 390, height: 844 },
      ],
    },
  },
  collections: [Users, Chapters, GlossaryTerms, Pages],
  editor: lexicalEditor(),
  i18n: {
    translations: {
      en: { general: { locale: 'Language' } },
      es: { general: { locale: 'Idioma' } },
    },
  },
  localization: {
    locales: ['es', 'en'],
    defaultLocale: 'es',
    fallback: true,
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL,
    },
    // Crea/actualiza tablas automáticamente al arrancar (equivale a prisma db push)
    // Cambiar a migraciones explícitas cuando el esquema esté estable
    push: true,
  }),
  secret: process.env.PAYLOAD_SECRET ?? 'fallback-secret-change-in-production',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
