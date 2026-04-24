/**
 * Script de seed: crea los 24 capítulos del libro en la base de datos.
 * Ejecutar con: npx tsx src/scripts/seed-chapters.ts
 *
 * Solo crea los capítulos si no existen ya (comprueba por slug).
 */

import { getPayload } from 'payload'
import config from '@payload-config'

const chapters = [
  // PARTE I — Qué es el GCP
  { order: 1, part: 'I', slug: 'individuo-paranoide', title: 'El individuo paranoide' },
  { order: 2, part: 'I', slug: 'dimension-social', title: 'Dimensión social de la conducta paranoide' },
  { order: 3, part: 'I', slug: 'folie-a-deux-contagio', title: 'Folie à deux y contagio' },
  { order: 4, part: 'I', slug: 'grupo-contagio-paranoide', title: 'El grupo de contagio paranoide' },
  // PARTE II — Qué GCP existen
  { order: 5, part: 'II', slug: 'microgrupo-paranoide', title: 'Microgrupo paranoide' },
  { order: 6, part: 'II', slug: 'asociacion-paranoide', title: 'Asociación paranoide' },
  { order: 7, part: 'II', slug: 'sociedad-paranoide', title: 'Sociedad paranoide' },
  { order: 8, part: 'II', slug: 'guerra-guerreros', title: 'La guerra y los guerreros' },
  // PARTE III — Cómo funcionan
  { order: 9, part: 'III', slug: 'enemigos-peligros', title: 'Enemigos y Peligros' },
  { order: 10, part: 'III', slug: 'enemistad', title: 'Enemistad' },
  { order: 11, part: 'III', slug: 'salvacion', title: 'Salvación' },
  { order: 12, part: 'III', slug: 'superioridad', title: 'Superioridad' },
  { order: 13, part: 'III', slug: 'centralidad', title: 'Centralidad' },
  { order: 14, part: 'III', slug: 'estilo-cognitivo', title: 'Estilo Cognitivo' },
  { order: 15, part: 'III', slug: 'cohesion', title: 'Cohesión' },
  { order: 16, part: 'III', slug: 'aislamiento', title: 'Aislamiento' },
  { order: 17, part: 'III', slug: 'uniformizacion', title: 'Uniformización' },
  { order: 18, part: 'III', slug: 'ambicion', title: 'Ambición' },
  { order: 19, part: 'III', slug: 'pie-de-guerra', title: 'Pie de Guerra' },
  { order: 20, part: 'III', slug: 'jerarquizacion', title: 'Jerarquización' },
  { order: 21, part: 'III', slug: 'relacion', title: 'Relación' },
  { order: 22, part: 'III', slug: 'muerte', title: 'Muerte' },
  { order: 23, part: 'III', slug: 'bienestar', title: 'Bienestar' },
  { order: 24, part: 'III', slug: 'carisma-revelacion', title: 'Carisma y revelación' },
  { order: 25, part: 'III', slug: 'personalidad-obsesiva-obstinada', title: 'De la personalidad obsesiva a la obstinada' },
] as const

async function seed() {
  const payload = await getPayload({ config })

  let created = 0
  let skipped = 0

  for (const chapter of chapters) {
    const existing = await payload.find({
      collection: 'chapters',
      where: { slug: { equals: chapter.slug } },
      limit: 1,
    })

    if (existing.totalDocs > 0) {
      console.log(`⏭  Saltando "${chapter.title}" (ya existe)`)
      skipped++
      continue
    }

    await payload.create({
      collection: 'chapters',
      data: {
        slug: chapter.slug,
        order: chapter.order,
        part: chapter.part,
        title: chapter.title,
        published: false,
      },
    })

    console.log(`✓  Creado: [${chapter.part}] ${chapter.order}. ${chapter.title}`)
    created++
  }

  console.log(`\nSeed completado: ${created} creados, ${skipped} saltados.`)
  process.exit(0)
}

seed().catch((err) => {
  console.error('Error en seed:', err)
  process.exit(1)
})
