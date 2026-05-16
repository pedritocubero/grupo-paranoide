import type { CollectionConfig } from 'payload'

export const GlossaryTerms: CollectionConfig = {
  slug: 'glossary-terms',
  labels: { singular: '📝 Término', plural: '📝 Glosario' },
  admin: {
    useAsTitle: 'termEs',
    defaultColumns: ['termEs', 'termEn', 'notes'],
    group: 'Contenido',
  },
  fields: [
    {
      name: 'termEs',
      type: 'text',
      required: true,
      label: 'Término en español',
    },
    {
      name: 'termEn',
      type: 'text',
      required: true,
      label: 'Traducción al inglés',
    },
    {
      name: 'notes',
      type: 'textarea',
      label: 'Notas para el traductor',
      admin: {
        description: 'Contexto o instrucciones específicas para este término.',
      },
    },
  ],
}
