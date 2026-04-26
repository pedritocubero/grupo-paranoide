import { ChapterDocument } from '@/lib/chapter-pdf'
import { getPayloadClient } from '@/lib/payload'
import { renderToBuffer } from '@react-pdf/renderer'
import type { DocumentProps } from '@react-pdf/renderer'
import { createElement } from 'react'
import type { ReactElement } from 'react'
import type { SerializedEditorState } from 'lexical'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ locale: string; slug: string }> },
) {
  const { locale, slug } = await params
  const payload = await getPayloadClient()

  const { docs } = await payload.find({
    collection: 'chapters',
    locale: locale as 'es' | 'en',
    where: { slug: { equals: slug } },
    limit: 1,
  })

  const chapter = docs[0]
  if (!chapter) {
    return new Response('Chapter not found', { status: 404 })
  }

  const sections = (chapter.sections ?? []) as Array<{
    blockId: string
    content?: SerializedEditorState | null
  }>

  const chapterData = {
    title: chapter.title,
    subtitle: chapter.subtitle,
    order: chapter.order,
    sections,
  }

  let pdfBuffer: Buffer
  try {
    pdfBuffer = await renderToBuffer(
      createElement(ChapterDocument, { chapter: chapterData, locale }) as ReactElement<DocumentProps>,
    )
  } catch (err) {
    const msg = err instanceof Error ? err.stack ?? err.message : String(err)
    console.error('[PDF] renderToBuffer failed:', msg)
    console.error('[PDF] sections count:', sections.length)
    console.error('[PDF] first section sample:', JSON.stringify(sections[0]?.content?.root?.children?.[0])?.slice(0, 300))
    return new Response(`PDF generation failed: ${msg}`, { status: 500 })
  }

  const filename = `${slug}-${locale}.pdf`

  return new Response(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}
