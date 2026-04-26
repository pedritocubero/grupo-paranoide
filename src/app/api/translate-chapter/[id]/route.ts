import { getPayloadClient } from '@/lib/payload'
import { translateLexicalSection, translateStrings } from '@/lib/translate'
import type { SerializedEditorState } from 'lexical'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ id: string }> }

export async function POST(_req: Request, { params }: Params) {
  const { id } = await params

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })
  }

  const payload = await getPayloadClient()

  const chapter = await payload.findByID({
    collection: 'chapters',
    id,
    locale: 'es',
  })

  if (!chapter) {
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

  // Translate sections
  const sections = (chapter.sections ?? []) as Array<{
    id?: string
    blockId: string
    content?: SerializedEditorState | null
    translationStatus?: string
    sourceHash?: string
  }>

  const BATCH_SIZE = 5
  const translatedSections: typeof sections = []
  for (let i = 0; i < sections.length; i += BATCH_SIZE) {
    const batch = sections.slice(i, i + BATCH_SIZE)
    const results = await Promise.all(
      batch.map(async (section) => {
        const { id: _id, ...rest } = section
        if (!section.content) return rest
        try {
          const translatedContent = await translateLexicalSection(section.content, glossary)
          return { ...rest, content: translatedContent, translationStatus: 'auto' }
        } catch (err) {
          console.error(`Error translating section ${section.blockId}:`, err)
          return rest
        }
      }),
    )
    translatedSections.push(...results)
  }

  // Translate title and subtitle
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

  return NextResponse.json({ ok: true, sectionsTranslated: translatedSections.length })
}
