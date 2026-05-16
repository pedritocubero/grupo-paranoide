'use client'
import { useDocumentInfo, useField, useLocale } from '@payloadcms/ui'
import { useState } from 'react'

const options = [
  { value: 'auto', label: '🤖 Traducción automática' },
  { value: 'manual', label: '✅ Revisada manualmente' },
  { value: 'stale', label: '⚠️ Desactualizada (retraducir)' },
]

export function TranslationStatusField({ path }: { path?: string }) {
  const { code: locale } = useLocale()
  const { id } = useDocumentInfo()
  const { value, setValue } = useField<string>({ path: path ?? 'translationStatus' })
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  if (locale !== 'en') return null

  const status = value ?? 'auto'

  async function handleTranslate() {
    if (!id) return
    setLoading(true)
    try {
      const res = await fetch(`/api/translate-chapter/${id}`, { method: 'POST' })
      if (res.ok) {
        setDone(true)
        setValue('auto')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ marginBottom: '0.75rem' }}>
      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.25rem' }}>
        Estado de la traducción
      </label>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
        <select
          value={status}
          onChange={(e) => setValue(e.target.value)}
          style={{
            padding: '0.375rem 0.5rem',
            border: '1px solid var(--theme-elevation-200)',
            borderRadius: '4px',
            fontSize: '0.875rem',
            backgroundColor: 'var(--theme-bg)',
            color: 'var(--theme-text)',
            cursor: 'pointer',
          }}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {status === 'stale' && !done && (
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
            {loading ? 'Traduciendo…' : '⚠️ Traducir sección'}
          </button>
        )}

        {done && (
          <span style={{ fontSize: '0.75rem', color: '#065f46' }}>
            ✓ Traducida — guarda y recarga para ver
          </span>
        )}
      </div>
      <p style={{ fontSize: '0.75rem', color: 'var(--theme-elevation-500)', marginTop: '0.25rem', marginBottom: 0 }}>
        Se actualiza automáticamente al traducir. Marca como "Revisada" si lo has corregido a mano.
      </p>
    </div>
  )
}
