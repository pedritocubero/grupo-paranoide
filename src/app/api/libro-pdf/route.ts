import { getPayloadClient } from '@/lib/payload'
import { renderToBuffer } from '@react-pdf/renderer'
import type { DocumentProps } from '@react-pdf/renderer'
import { createElement } from 'react'
import type { ReactElement } from 'react'
import type { SerializedEditorState } from 'lexical'
import { BookDocument } from '@/lib/book-pdf'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const locale = (searchParams.get('locale') ?? 'es') as 'es' | 'en'

  const payload = await getPayloadClient()

  const { docs: chapters } = await payload.find({
    collection: 'chapters',
    locale,
    sort: 'order',
    limit: 100,
  })

  const chaptersData = chapters.map((chapter) => ({
    title: chapter.title as string,
    subtitle: chapter.subtitle as string | undefined,
    order: chapter.order as number,
    sections: (chapter.sections ?? []) as Array<{
      blockId: string
      content?: SerializedEditorState | null
    }>,
  }))

  let pdfBuffer: Buffer
  try {
    pdfBuffer = await renderToBuffer(
      createElement(BookDocument, { chapters: chaptersData, locale }) as ReactElement<DocumentProps>,
    )
  } catch (err) {
    const msg = err instanceof Error ? err.stack ?? err.message : String(err)
    console.error('[PDF libro] renderToBuffer failed:', msg)
    return new Response(`PDF generation failed: ${msg}`, { status: 500 })
  }

  const filename = `el-grupo-paranoide-${locale}.pdf`

  return new Response(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}
