'use client'

import { useState } from 'react'

export function DownloadBookButton() {
  const [status, setStatus] = useState<'idle' | 'loading'>('idle')

  const handleDownload = async (locale: 'es' | 'en') => {
    setStatus('loading')
    try {
      const res = await fetch(`/api/libro-pdf?locale=${locale}`)
      if (!res.ok) throw new Error('Error generando el PDF')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `el-grupo-paranoide-${locale}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error(err)
      alert('Error generando el PDF. Inténtalo de nuevo.')
    } finally {
      setStatus('idle')
    }
  }

  return (
    <div style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem', border: '1px solid #e5e7eb', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div>
        <p style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.2rem' }}>Descargar libro completo</p>
        <p style={{ fontSize: '0.78rem', color: '#6b7280' }}>
          {status === 'loading' ? 'Generando PDF, puede tardar unos segundos…' : 'Descarga todos los capítulos en un solo PDF'}
        </p>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
        <button
          onClick={() => handleDownload('es')}
          disabled={status === 'loading'}
          style={{ padding: '0.45rem 0.9rem', backgroundColor: status === 'loading' ? '#e5e7eb' : '#111827', color: status === 'loading' ? '#9ca3af' : '#fff', borderRadius: '4px', fontSize: '0.82rem', fontWeight: 500, border: 'none', cursor: status === 'loading' ? 'not-allowed' : 'pointer' }}
        >
          ES
        </button>
        <button
          onClick={() => handleDownload('en')}
          disabled={status === 'loading'}
          style={{ padding: '0.45rem 0.9rem', backgroundColor: status === 'loading' ? '#e5e7eb' : '#111827', color: status === 'loading' ? '#9ca3af' : '#fff', borderRadius: '4px', fontSize: '0.82rem', fontWeight: 500, border: 'none', cursor: status === 'loading' ? 'not-allowed' : 'pointer' }}
        >
          EN
        </button>
      </div>
    </div>
  )
}
