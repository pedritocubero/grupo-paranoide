import { getPayloadClient } from '@/lib/payload'
import { translateLexicalSection, translateStrings } from '@/lib/translate'
import type { SerializedEditorState } from 'lexical'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ id: string }> }

type Section = {
  id?: string
  blockId: string
  content?: SerializedEditorState | null
  translationStatus?: string
  sourceHash?: string
}

export async function POST(_req: Request, { params }: Params) {
  const { id } = await params

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })
  }

  const payload = await getPayloadClient()

  const [chapterEs, chapterEn] = await Promise.all([
    payload.findByID({ collection: 'chapters', id, locale: 'es' }),
    payload.findByID({ collection: 'chapters', id, locale: 'en' }),
  ])

  if (!chapterEs) {
    return NextResponse.json({ error: 'Chapter not found' }, { status: 404 })
  }

  const { docs: glossaryDocs } = await payload.find({
    collection: 'glossary-terms',
    limit: 200,
  })

  const glossary = glossaryDocs.map((t) => ({
    termEs: t.termEs as string,
    termEn: t.termEn as string,
    notes: t.notes as string | null | undefined,
  }))

  const sectionsEs = (chapterEs.sections ?? []) as Section[]
  const sectionsEn = (chapterEn?.sections ?? []) as Section[]

  // Build a map of existing English sections by blockId
  const enByBlockId = new Map(sectionsEn.map((s) => [s.blockId, s]))

  let translated = 0
  let skipped = 0

  const BATCH_SIZE = 5
  const resultSections: Section[] = []

  for (let i = 0; i < sectionsEs.length; i += BATCH_SIZE) {
    const batch = sectionsEs.slice(i, i + BATCH_SIZE)
    const results = await Promise.all(
      batch.map(async (section) => {
        const { id: _id, ...rest } = section
        const existingEn = enByBlockId.get(section.blockId)

        // Skip if already translated and sourceHash matches (content hasn't changed since last translation)
        const hashUnchanged = existingEn?.sourceHash === section.sourceHash
        const isAlreadyTranslated =
          section.translationStatus !== 'stale' && existingEn?.content != null && hashUnchanged

        if (isAlreadyTranslated) {
          const { id: _enId, ...enRest } = existingEn!
          skipped++
          return enRest
        }

        if (!section.content) return rest

        try {
          const translatedContent = await translateLexicalSection(section.content, glossary)
          translated++
          return { ...rest, content: translatedContent, translationStatus: 'auto' }
        } catch (err) {
          console.error(`Error translating section ${section.blockId}:`, err)
          return rest
        }
      }),
    )
    resultSections.push(...results)
  }

  // Translate title/subtitle only if not already done
  const titleEs = chapterEs.title as string
  const subtitleEs = chapterEs.subtitle as string | undefined
  const existingTitleEn = chapterEn?.title as string | undefined
  const existingSubtitleEn = chapterEn?.subtitle as string | undefined

  const needsTitleTranslation = !existingTitleEn || existingTitleEn === titleEs
  const needsSubtitleTranslation = !!subtitleEs && (!existingSubtitleEn || existingSubtitleEn === subtitleEs)

  let finalTitleEn = existingTitleEn ?? titleEs
  let finalSubtitleEn = existingSubtitleEn ?? subtitleEs

  if (needsTitleTranslation || needsSubtitleTranslation) {
    const toTranslate = [
      ...(needsTitleTranslation ? [titleEs] : []),
      ...(needsSubtitleTranslation && subtitleEs ? [subtitleEs] : []),
    ]
    const translations = await translateStrings(toTranslate, glossary)
    let idx = 0
    if (needsTitleTranslation) finalTitleEn = translations[idx++] ?? titleEs
    if (needsSubtitleTranslation) finalSubtitleEn = translations[idx++] ?? subtitleEs
  }

  await payload.update({
    collection: 'chapters',
    id,
    locale: 'en',
    data: {
      title: finalTitleEn,
      ...(subtitleEs !== undefined ? { subtitle: finalSubtitleEn ?? subtitleEs } : {}),
      sections: resultSections,
    },
  })

  return NextResponse.json({ ok: true, sectionsTranslated: translated, sectionsSkipped: skipped })
}
