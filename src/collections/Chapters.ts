import type { CollectionConfig } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { BlueTextFeature } from '@/lib/lexical/BlueTextFeature'
import crypto from 'crypto'

export const Chapters: CollectionConfig = {
  slug: 'chapters',
  labels: { singular: '📖 Capítulo', plural: '📖 Capítulos' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'order', 'part', 'published'],
  },
  hooks: {
    afterChange: [
      async ({ doc, req }) => {
        // Prevent re-entry from the nested EN update below
        if ((req.context as any)?.syncingStaleToEn) return doc
        const locale = (req as any)?.locale
        if (locale !== 'es') return doc

        const esSections = (doc.sections ?? []) as any[]
        const staleBlockIds = new Set(
          esSections.filter((s: any) => s.translationStatus === 'stale').map((s: any) => s.blockId),
        )
        if (staleBlockIds.size === 0) return doc

        const payload = req.payload
        const chapterEn = await payload.findByID({
          collection: 'chapters',
          id: doc.id,
          locale: 'en',
          req,
        })
        if (!chapterEn?.sections) return doc

        const enSections = chapterEn.sections as any[]
        const needsUpdate = enSections.some(
          (s: any) => staleBlockIds.has(s.blockId) && s.translationStatus !== 'stale',
        )
        if (!needsUpdate) return doc

        const updated = enSections.map((s: any) =>
          staleBlockIds.has(s.blockId) ? { ...s, translationStatus: 'stale' } : s,
        )

        req.context = { ...(req.context ?? {}), syncingStaleToEn: true }
        await payload.update({
          collection: 'chapters',
          id: doc.id,
          locale: 'en',
          data: { sections: updated },
          req,
        })

        return doc
      },
    ],
  },
  fields: [
    {
      type: 'collapsible',
      label: 'Metadatos del capítulo',
      admin: {
        initCollapsed: true,
      },
      fields: [
        {
          name: 'slug',
          type: 'text',
          required: true,
          unique: true,
          admin: {
            description: 'Identificador único del capítulo, ej: individuo-paranoide',
          },
        },
        {
          name: 'order',
          type: 'number',
          required: true,
          admin: {
            description: 'Orden del capítulo (1-24)',
          },
        },
        {
          name: 'part',
          type: 'select',
          required: true,
          options: [
            { label: 'Parte I', value: 'I' },
            { label: 'Parte II', value: 'II' },
            { label: 'Parte III', value: 'III' },
          ],
        },
        {
          name: 'title',
          type: 'text',
          required: true,
          localized: true,
          label: 'Título',
        },
        {
          name: 'subtitle',
          type: 'text',
          localized: true,
          label: 'Subtítulo / Epígrafe',
        },
      ],
    },
    {
      name: 'translateActions',
      type: 'ui',
      admin: {
        components: {
          Field: '@/components/admin/TranslateButton#TranslateButton',
        },
      },
    },
    {
      name: 'staleSectionsWarning',
      type: 'ui',
      admin: {
        components: {
          Field: '@/components/admin/StaleSectionsWarning#StaleSectionsWarning',
        },
      },
    },
    {
      name: 'addSectionTop',
      type: 'ui',
      admin: {
        components: {
          Field: '@/components/admin/AddSectionTopButton#AddSectionTopButton',
        },
      },
    },
    {
      name: 'sections',
      type: 'array',
      label: 'Secciones',
      localized: true,
      fields: [
        {
          name: 'blockId',
          type: 'text',
          required: true,
          admin: {
            description: 'ID estable de la sección. No modificar una vez creado.',
          },
        },
        {
          name: 'translationStatus',
          type: 'select',
          label: 'Estado de la traducción',
          options: [
            { label: '🤖 Traducción automática', value: 'auto' },
            { label: '✅ Revisada manualmente', value: 'manual' },
            { label: '⚠️ Desactualizada (retraducir)', value: 'stale' },
          ],
          defaultValue: 'stale',
          admin: {
            components: {
              Field: '@/components/admin/TranslationStatusField#TranslationStatusField',
            },
          },
        },
        {
          name: 'content',
          type: 'richText',
          editor: lexicalEditor({ features: ({ defaultFeatures }) => [...defaultFeatures, BlueTextFeature()] }),
          label: 'Contenido',
        },
        {
          name: 'sourceHash',
          type: 'text',
          admin: {
            hidden: true,
          },
        },
      ],
      hooks: {
        beforeChange: [
          async ({ value, req }) => {
            if (!value) return value
            const isEs = (req as any)?.locale === 'es'
            return value.map((section: any) => {
              const contentStr = JSON.stringify(section.content ?? '')
              const newHash = crypto.createHash('sha256').update(contentStr).digest('hex')
              const hashChanged = !section.sourceHash || section.sourceHash !== newHash
              if (hashChanged) {
                return {
                  ...section,
                  sourceHash: newHash,
                  ...(isEs ? { translationStatus: 'stale' } : {}),
                }
              }
              return section
            })
          },
        ],
      },
    },
    {
      name: 'published',
      type: 'checkbox',
      localized: true,
      defaultValue: false,
      label: 'Publicado',
    },
  ],
}
