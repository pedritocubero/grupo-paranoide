'use client'

import { useField } from '@payloadcms/ui'

type Section = {
  blockId: string
  content?: unknown
  translationStatus?: string
  sourceHash?: string
}

export function AddSectionTopButton() {
  const { value, setValue } = useField<Section[]>({ path: 'sections' })

  const handleAdd = () => {
    const newSection: Section = {
      blockId: `section-${Date.now()}`,
      content: undefined,
      translationStatus: 'stale',
    }
    setValue([newSection, ...(value ?? [])])
  }

  return (
    <div style={{ marginBottom: '0.5rem', marginTop: '1rem' }}>
      <button
        type="button"
        onClick={handleAdd}
        style={{
          padding: '0.5rem 1rem',
          backgroundColor: '#ffffff',
          color: '#374151',
          border: '1px solid #d1d5db',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '0.875rem',
          fontWeight: 500,
        }}
      >
        + Añadir sección al inicio
      </button>
    </div>
  )
}
