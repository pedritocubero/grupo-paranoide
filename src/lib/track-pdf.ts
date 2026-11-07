import { after } from 'next/server'
import { getPayloadClient } from '@/lib/payload'

// Anota una descarga de PDF. Va en segundo plano (after) para no retrasar la
// respuesta, y cualquier fallo se ignora: el lector siempre recibe su PDF.
export function trackPdfDownload(
  req: Request,
  data: { kind: 'libro' | 'capitulo'; slug?: string; locale: string },
) {
  const country = req.headers.get('x-vercel-ip-country') ?? undefined
  const userAgent = req.headers.get('user-agent')?.slice(0, 200) ?? undefined
  after(async () => {
    try {
      const payload = await getPayloadClient()
      await payload.create({
        collection: 'pdf-downloads',
        data: { ...data, country, userAgent },
      })
    } catch (err) {
      console.error('[PDF] no se pudo anotar la descarga:', err instanceof Error ? err.message : err)
    }
  })
}
