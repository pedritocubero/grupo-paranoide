import type { CollectionConfig } from 'payload'

// Una fila por cada PDF descargado (libro entero o capítulo). Solo se escribe desde
// el servidor (src/lib/track-pdf.ts); desde fuera nadie puede crear ni leer filas.
export const PdfDownloads: CollectionConfig = {
  slug: 'pdf-downloads',
  labels: { singular: '📥 Descarga de PDF', plural: '📥 Descargas de PDF' },
  admin: {
    defaultColumns: ['kind', 'slug', 'locale', 'country', 'createdAt'],
  },
  access: {
    create: () => false,
    update: () => false,
    delete: ({ req }) => Boolean(req.user),
    read: ({ req }) => Boolean(req.user),
  },
  fields: [
    { name: 'kind', type: 'select', required: true, options: ['libro', 'capitulo'] },
    { name: 'slug', type: 'text', admin: { description: 'Capítulo descargado (vacío si es el libro entero)' } },
    { name: 'locale', type: 'text' },
    { name: 'country', type: 'text', admin: { description: 'País (según Vercel), sin guardar la IP' } },
    { name: 'userAgent', type: 'text', admin: { description: 'Navegador o robot, para filtrar rastreadores' } },
  ],
}
