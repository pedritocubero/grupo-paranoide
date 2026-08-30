import { getPayloadClient } from '@/lib/payload'
import { translateLexicalSection, translateStrings } from '@/lib/translate'
import type { SerializedEditorState } from 'lexical'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

type Params = { params: Promise<{ id: string }> }

type Section = {
  id?: string
  blockId: string
  content?: SerializedEditorState | null
  translationStatus?: string
  sourceHash?: string
}

export async function POST(req: Request, { params }: Params) {
  const { id } = await params

  // Optional cap on how many sections to translate in this invocation, so a
  // chapter that's too big to finish inside the platform's function time
  // limit can be translated across several calls instead of one.
  const url = new URL(req.url)
  const maxSectionsParam = url.searchParams.get('maxSections')
  const maxSections = maxSectionsParam ? parseInt(maxSectionsParam, 10) : Infinity

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
  let remaining = 0

  const resultSections: Section[] = []

  for (const section of sectionsEs) {
    const { id: _id, ...rest } = section
    const existingEn = enByBlockId.get(section.blockId)

    // Skip if a previous call in this incremental run already translated
    // this blockId (marked 'auto' by the code below). Note: sourceHash can't
    // be used for this comparison — the sections field's beforeChange hook in
    // Chapters.ts recomputes it from the actual content on every save, so the
    // English row's hash reflects the English text, not the Spanish source,
    // and will never equal the Spanish section's hash.
    const isAlreadyTranslated = existingEn?.content != null && existingEn?.translationStatus === 'auto'

    if (isAlreadyTranslated) {
      const { id: _enId, ...enRest } = existingEn!
      skipped++
      resultSections.push(enRest)
      continue
    }

    if (!section.content) {
      resultSections.push(rest)
      continue
    }

    if (translated >= maxSections) {
      // Left for a follow-up call: keep whatever English content already
      // exists (even if stale/missing) rather than losing the section.
      remaining++
      resultSections.push(existingEn ? (({ id: _enId, ...enRest }) => enRest)(existingEn) : rest)
      continue
    }

    try {
      const translatedContent = await translateLexicalSection(section.content, glossary)
      translated++
      resultSections.push({ ...rest, content: translatedContent, translationStatus: 'auto' })
    } catch (err) {
      console.error(`Error translating section ${section.blockId}:`, err)
      resultSections.push(rest)
    }
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

  return NextResponse.json({ ok: true, sectionsTranslated: translated, sectionsSkipped: skipped, sectionsRemaining: remaining })
}
