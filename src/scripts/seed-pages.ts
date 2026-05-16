/**
 * Seed: crea las páginas auxiliares (sobre-mi, obstinaciones, depresion).
 * Ejecutar con: npx tsx src/scripts/seed-pages.ts
 *
 * Solo crea las páginas si no existen ya (comprueba por slug).
 */

import { getPayload } from 'payload'
import config from '@payload-config'

// Construye un nodo de párrafo de Lexical a partir de texto plano
function para(text: string) {
  return {
    type: 'paragraph' as const,
    version: 1,
    format: '' as const,
    indent: 0,
    direction: 'ltr' as const,
    children: [
      { type: 'text', version: 1, text, format: 0, detail: 0, mode: 'normal' as const, style: '' },
    ],
  }
}

function lexical(paragraphs: string[]) {
  return {
    root: {
      type: 'root' as const,
      version: 1,
      format: '' as const,
      indent: 0,
      direction: 'ltr' as const,
      children: paragraphs.map(para),
    },
  }
}

const pages = [
  {
    slug: 'sobre-mi',
    title: 'Sobre mí',
    content: lexical([
      'Nací el año 1960 en Sabadell (Barcelona).',
      'Obtuve la Licenciatura en Medicina y Cirugía por la Universidad Autónoma de Barcelona.',
      'Realicé la formación MIR de Psiquiatría en el Hospital General Universitario Gregorio Marañón (antiguo Provincial), de Madrid.',
      'Casi en su totalidad, mi vida profesional —clínica y docencia— ha transcurrido vinculada al Hospital Universitario Doce de Octubre, en el distrito madrileño de Usera.',
      'En la actualidad desarrollo la actividad clínica en el Centro de Salud Mental de Villaverde (adscrito a dicho hospital) y en UNINPSI (Unidad Clínica de Psicología), perteneciente a la Universidad Pontificia de Comillas.',
      'Durante años colaboré con la asociación barcelonesa AIS (Asesoramiento e Información en Socioadicciones). Inicialmente, dicha entidad se interesaba en el problema de los grupos sectarios o de manipulación. Posteriormente amplió su actividad a las bandas juveniles y a las llamadas dependencias conductuales.',
      'Mi curiosidad se ha dirigido prioritariamente a dos patologías: la paranoia y la histeria. He defendido insistentemente la tesis de que la paranoia es un fenómeno contagioso, que afecta no sólo a los individuos, sino también a los grupos.',
      'A finales del s. XIX la histeria empezó a subdividirse en entidades clínicas cada vez más delimitadas y homogéneas, y este proceso de fragmentación ha llevado a su desaparición de la Psiquiatría oficial actual. La han sustituido un buen número de diagnósticos que se identifican con mayor facilidad, pero que son artificiosos. La histeria existe, los médicos la han diagnosticado al menos desde la Antigüedad griega, y su liquidación es un error.',
      'En esta página web no pretendo más que dejar constancia de aquellas áreas a las que he dedicado más horas de estudio y reflexión. Quizá pueda aportar mi granito de arena al avance del conocimiento científico.',
    ]),
  },
  {
    slug: 'obstinaciones',
    title: 'Obstinaciones',
    content: lexical([
      'De la personalidad obsesiva a la obstinada',
      '[Enlace pendiente — añade el enlace desde el panel de administración]',
    ]),
  },
  {
    slug: 'depresion',
    title: 'Depresión',
    content: lexical([
      '1. Etología de la depresión',
      '2. Culpa y complejo dualista',
      '3. Universalidad del complejo dualista',
      '4. Sociobiología. Conducta afiliativa. Orangutanes',
      '5. Varios patrones sociobiológicos en Primates',
      '6. Colonias de gatas, parejas de lobos y bandas del Paleolítico',
      '7. El complejo bondadoso',
      '8. Selección natural',
      '9. Divagaciones finales',
      '[Enlaces pendientes — añade los enlaces desde el panel de administración]',
    ]),
  },
]

async function seed() {
  const payload = await getPayload({ config })

  let created = 0
  let skipped = 0

  for (const page of pages) {
    const existing = await payload.find({
      collection: 'pages',
      where: { slug: { equals: page.slug } },
      limit: 1,
    })

    if (existing.totalDocs > 0) {
      console.log(`⏭  Saltando "${page.title}" (ya existe)`)
      skipped++
      continue
    }

    await payload.create({
      collection: 'pages',
      data: {
        slug: page.slug,
        title: page.title,
        content: page.content,
      },
    })

    console.log(`✓  Creada: ${page.title}`)
    created++
  }

  console.log(`\nSeed completado: ${created} creadas, ${skipped} saltadas.`)
  process.exit(0)
}

seed().catch((err) => {
  console.error('Error en seed:', err)
  process.exit(1)
})
