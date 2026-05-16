import type { CollectionConfig } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'

export const Pages: CollectionConfig = {
  slug: 'pages',
  labels: { singular: '📄 Página', plural: '📄 Páginas' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug'],
  },
  fields: [
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'Identificador único de la página, ej: sobre-mi',
      },
    },
    {
      name: 'imageUrl',
      type: 'text',
      label: 'URL de la imagen de cabecera',
      admin: {
        description: 'Pega aquí la URL de la foto que quieres mostrar arriba de la página',
      },
    },
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
      label: 'Título',
    },
    {
      name: 'content',
      type: 'richText',
      editor: lexicalEditor({}),
      localized: true,
      label: 'Contenido',
    },
  ],
}
