'use client'

import { useDocumentInfo } from '@payloadcms/ui'
import { useState } from 'react'

export function TranslateButton() {
  const { id } = useDocumentInfo()
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function handleTranslate() {
    if (!id) return
    setStatus('loading')
    setMessage('')
    try {
      const res = await fetch(`/api/translate-chapter/${id}`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        setStatus('error')
        setMessage(data.error ?? 'Error desconocido')
      } else {
        setStatus('done')
        setMessage(`Traducción completada — ${data.sectionsTranslated} secciones.`)
      }
    } catch {
      setStatus('error')
      setMessage('Error de red. Comprueba la conexión.')
    }
  }

  const buttonLabel = {
    idle: 'Traducir al inglés',
    loading: 'Traduciendo…',
    done: 'Traducción completada ✓',
    error: 'Reintentar',
  }[status]

  return (
    <div style={{ marginTop: '1rem', padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '6px' }}>
      <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.5rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Traducción automática
      </p>
      <p style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '0.75rem' }}>
        Genera la versión en inglés de este capítulo usando Claude. Sobreescribirá la traducción existente.
      </p>
      <button
        onClick={handleTranslate}
        disabled={status === 'loading'}
        style={{
          padding: '0.5rem 1rem',
          backgroundColor: status === 'error' ? '#fee2e2' : status === 'done' ? '#d1fae5' : '#1d4ed8',
          color: status === 'error' ? '#dc2626' : status === 'done' ? '#065f46' : '#ffffff',
          border: 'none',
          borderRadius: '4px',
          cursor: status === 'loading' ? 'not-allowed' : 'pointer',
          fontSize: '0.875rem',
          fontWeight: 500,
          opacity: status === 'loading' ? 0.7 : 1,
        }}
      >
        {buttonLabel}
      </button>
      {message && (
        <p style={{ fontSize: '0.8rem', marginTop: '0.5rem', color: status === 'error' ? '#dc2626' : '#065f46' }}>
          {message}
        </p>
      )}
    </div>
  )
}
