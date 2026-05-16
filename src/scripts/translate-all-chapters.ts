/**
 * Traduce todos los capítulos al inglés usando la misma lógica que el botón
 * "Traducir al inglés" del admin de Payload.
 *
 * Ejecutar con:
 *   node --env-file=.env.local node_modules/.bin/tsx src/scripts/translate-all-chapters.ts
 *
 * Opciones:
 *   --force   Re-traduce capítulos que ya tienen traducción en inglés
 *   --slug=X  Traduce solo el capítulo con ese slug
 */

import { getPayload } from 'payload'
import config from '@payload-config'
import { translateLexicalSection, translateStrings } from '../lib/translate'
import type { SerializedEditorState } from 'lexical'

const BATCH_SIZE = 5
const FORCE = process.argv.includes('--force')
const ONLY_SLUG = process.argv.find(a => a.startsWith('--slug='))?.split('=')[1]

async function translateChapter(payload: Awaited<ReturnType<typeof getPayload>>, id: number | string, slug: string, glossary: { termEs: string; termEn: string; notes?: string | null }[]) {
  const chapter = await payload.findByID({
    collection: 'chapters',
    id,
    locale: 'es',
  })

  const sections = (chapter.sections ?? []) as Array<{
    id?: string
    blockId: string
    content?: SerializedEditorState | null
    translationStatus?: string
    sourceHash?: string
  }>

  const translatedSections: typeof sections = []
  for (let i = 0; i < sections.length; i += BATCH_SIZE) {
    const batch = sections.slice(i, i + BATCH_SIZE)
    process.stdout.write(`  secciones ${i + 1}–${Math.min(i + BATCH_SIZE, sections.length)}/${sections.length}...`)
    const results = await Promise.all(
      batch.map(async (section) => {
        const { id: _id, ...rest } = section
        if (!section.content) return rest
        try {
          const translatedContent = await translateLexicalSection(section.content, glossary)
          return { ...rest, content: translatedContent, translationStatus: 'auto' as const }
        } catch (err) {
          console.error(`\n    ✗ Error en sección ${section.blockId}:`, err)
          return rest
        }
      }),
    )
    translatedSections.push(...results)
    process.stdout.write(' ✓\n')
  }

  const titleEs = chapter.title as string
  const subtitleEs = chapter.subtitle as string | undefined
  const toTranslate = subtitleEs ? [titleEs, subtitleEs] : [titleEs]
  const [titleEn = titleEs, subtitleEn] = await translateStrings(toTranslate, glossary)

  await payload.update({
    collection: 'chapters',
    id,
    locale: 'en',
    data: {
      title: titleEn,
      ...(subtitleEs !== undefined ? { subtitle: subtitleEn ?? subtitleEs } : {}),
      sections: translatedSections,
    },
  })

  return translatedSections.length
}

async function run() {
  const payload = await getPayload({ config })

  const { docs: chapters } = await payload.find({
    collection: 'chapters',
    locale: 'es',
    sort: 'order',
    limit: 100,
  })

  const { docs: glossaryDocs } = await payload.find({
    collection: 'glossary-terms',
    limit: 200,
  })

  const glossary = glossaryDocs.map((t) => ({
    termEs: t.termEs as string,
    termEn: t.termEn as string,
    notes: t.notes as string | null | undefined,
  }))

  const toProcess = ONLY_SLUG
    ? chapters.filter(c => c.slug === ONLY_SLUG)
    : chapters

  if (toProcess.length === 0) {
    console.log('No se encontraron capítulos con ese slug.')
    process.exit(1)
  }

  console.log(`\nTraduciendo ${toProcess.length} capítulo(s)...\n`)

  let ok = 0
  let skipped = 0
  let errors = 0

  for (const chapter of toProcess) {
    const hasEn = await payload.findByID({
      collection: 'chapters',
      id: chapter.id,
      locale: 'en',
    }).then(c => !!(c.title && c.title !== chapter.title)).catch(() => false)

    if (hasEn && !FORCE) {
      console.log(`⏭  ${chapter.order}. ${chapter.title as string} — ya tiene inglés, saltando`)
      skipped++
      continue
    }

    console.log(`→  ${chapter.order}. ${chapter.title as string}`)
    try {
      const count = await translateChapter(payload, chapter.id, chapter.slug as string, glossary)
      console.log(`   ✓ ${count} secciones traducidas\n`)
      ok++
    } catch (err) {
      console.error(`   ✗ Error:`, err)
      errors++
    }
  }

  console.log(`\nListo: ${ok} traducidos, ${skipped} saltados, ${errors} errores.`)
  process.exit(errors > 0 ? 1 : 0)
}

run().catch((e) => { console.error(e); process.exit(1) })
