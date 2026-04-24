import type { CollectionConfig } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import crypto from 'crypto'

export const Chapters: CollectionConfig = {
  slug: 'chapters',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['order', 'title', 'part', 'published'],
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
    {
      name: 'sections',
      type: 'array',
      label: 'Secciones',
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
          name: 'content',
          type: 'richText',
          editor: lexicalEditor({}),
          localized: true,
          label: 'Contenido',
        },
        {
          name: 'translationStatus',
          type: 'select',
          options: [
            { label: 'Traducción automática', value: 'auto' },
            { label: 'Revisada manualmente', value: 'manual' },
            { label: 'Desactualizada (retraducir)', value: 'stale' },
          ],
          defaultValue: 'stale',
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
          async ({ value, previousValue, siblingData }) => {
            // Recalcular sourceHash cuando cambia el contenido en ES
            if (!value) return value
            return value.map((section: any, index: number) => {
              const prev = previousValue?.[index]
              const contentStr = JSON.stringify(section.content ?? '')
              const newHash = crypto
                .createHash('sha256')
                .update(contentStr)
                .digest('hex')
              // Si no hay hash previo o el contenido cambió, actualizar hash
              if (!section.sourceHash || section.sourceHash !== newHash) {
                return { ...section, sourceHash: newHash }
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
    {
      name: 'translateActions',
      type: 'ui',
      admin: {
        components: {
          Field: '@/components/admin/TranslateButton#TranslateButton',
        },
      },
    },
  ],
}
