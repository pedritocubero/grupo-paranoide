'use client'
import { useDocumentInfo, useField, useLocale } from '@payloadcms/ui'
import { useState } from 'react'

export function TranslateSectionButton({ path }: { path?: string }) {
  const { id } = useDocumentInfo()
  const { code: locale } = useLocale()

  // path llega como "sections.0.translateSection"; derivamos la ruta del campo hermano
  const statusPath = path
    ? path.replace(/\.[^.]+$/, '.translationStatus')
    : 'translationStatus'
  const { value: status } = useField<string>({ path: statusPath })
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  if (locale !== 'en') return null
  if (status !== 'stale') return null

  async function handleTranslate() {
    if (!id) return
    setLoading(true)
    try {
      const res = await fetch(`/api/translate-chapter/${id}`, { method: 'POST' })
      if (res.ok) setDone(true)
    } catch {
      // el botón de capítulo sirve de fallback
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <span style={{ fontSize: '0.75rem', color: '#065f46' }}>
        ✓ Traducción actualizada — guarda y recarga para ver
      </span>
    )
  }

  return (
    <button
      type="button"
      onClick={handleTranslate}
      disabled={loading}
      style={{
        padding: '0.25rem 0.6rem',
        backgroundColor: '#fef9c3',
        color: '#713f12',
        border: '1px solid #fde047',
        borderRadius: '4px',
        cursor: loading ? 'not-allowed' : 'pointer',
        fontSize: '0.75rem',
        fontWeight: 500,
        opacity: loading ? 0.6 : 1,
      }}
    >
      {loading ? 'Traduciendo…' : '⚠️ Traducir sección desactualizada'}
    </button>
  )
}
