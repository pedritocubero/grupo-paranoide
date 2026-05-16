'use client'
import { useField, useLocale } from '@payloadcms/ui'

type Section = {
  blockId: string
  translationStatus?: string
}

export function StaleSectionsWarning() {
  const { value: sections } = useField<Section[]>({ path: 'sections' })
  const { code: locale } = useLocale()

  if (locale !== 'en') return null

  const sectionsArray = Array.isArray(sections) ? sections : []
  const stale = sectionsArray.filter((s) => s.translationStatus === 'stale')
  if (stale.length === 0) return null

  return (
    <div
      style={{
        backgroundColor: '#fefce8',
        border: '1px solid #fde047',
        borderRadius: '6px',
        padding: '0.75rem 1rem',
        marginBottom: '1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        fontFamily: 'sans-serif',
        fontSize: '0.875rem',
        color: '#713f12',
      }}
    >
      <span style={{ fontSize: '1.1rem' }}>⚠️</span>
      <span>
        <strong>
          {stale.length} {stale.length === 1 ? 'sección necesita' : 'secciones necesitan'} retraducción.
        </strong>{' '}
        Pulsa «Traducir capítulo» para actualizarlas.
      </span>
    </div>
  )
}
