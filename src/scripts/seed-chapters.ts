/**
 * Script de seed: crea los 24 capítulos del libro en la base de datos.
 * Ejecutar con: npx tsx src/scripts/seed-chapters.ts
 *
 * Solo crea los capítulos si no existen ya (comprueba por slug).
 */

import { getPayload } from 'payload'
import config from '@payload-config'

const chapters = [
  // PARTE I
  { order: 1, part: 'I', slug: 'individuo-paranoide', title: 'El individuo paranoide' },
  { order: 2, part: 'I', slug: 'paranoia-social', title: 'La paranoia social' },
  { order: 3, part: 'I', slug: 'mecanismos-proyeccion', title: 'Los mecanismos de proyección' },
  { order: 4, part: 'I', slug: 'enemigo-necesario', title: 'El enemigo necesario' },
  { order: 5, part: 'I', slug: 'conducta-paranoide', title: 'La conducta paranoide' },
  { order: 6, part: 'I', slug: 'paranoidizacion', title: 'La paranoidización' },
  { order: 7, part: 'I', slug: 'hipersociabilidad', title: 'La hipersociabilidad' },
  { order: 8, part: 'I', slug: 'folie-a-deux', title: 'Folie à deux, folie à famille' },
  // PARTE II
  { order: 9, part: 'II', slug: 'grupo-paranoide', title: 'El grupo paranoide' },
  { order: 10, part: 'II', slug: 'gcp-estructura', title: 'Estructura del grupo de contagio paranoide' },
  { order: 11, part: 'II', slug: 'lider-paranoide', title: 'El líder paranoide' },
  { order: 12, part: 'II', slug: 'apiñamiento', title: 'El apiñamiento' },
  { order: 13, part: 'II', slug: 'piramidalismo', title: 'El piramidalismo' },
  { order: 14, part: 'II', slug: 'rituales-cohesion', title: 'Los rituales de cohesión' },
  { order: 15, part: 'II', slug: 'lenguaje-paranoide', title: 'El lenguaje paranoide' },
  { order: 16, part: 'II', slug: 'memoria-colectiva', title: 'La memoria colectiva distorsionada' },
  // PARTE III
  { order: 17, part: 'III', slug: 'sectas-cultos', title: 'Sectas y cultos de crisis' },
  { order: 18, part: 'III', slug: 'sokagakkai', title: 'Sokagakkai: un caso de estudio' },
  { order: 19, part: 'III', slug: 'politica-paranoide', title: 'La política paranoide' },
  { order: 20, part: 'III', slug: 'nacion-paranoide', title: 'La nación paranoide' },
  { order: 21, part: 'III', slug: 'medios-paranoia', title: 'Los medios y la paranoia colectiva' },
  { order: 22, part: 'III', slug: 'internet-contagio', title: 'Internet como vector de contagio' },
  { order: 23, part: 'III', slug: 'salida-grupo', title: 'La salida del grupo paranoide' },
  { order: 24, part: 'III', slug: 'conclusion', title: 'Conclusión: vivir entre paranoides' },
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
