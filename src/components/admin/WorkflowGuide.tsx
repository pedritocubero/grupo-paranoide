'use client'

import { useState } from 'react'

const steps = [
  {
    number: '1',
    title: 'Editar un capítulo',
    description: 'Ve a Chapters en el menú de la izquierda. Haz clic en el título del capítulo que quieras editar. Puedes modificar el texto directamente en cada sección.',
    tip: 'Para poner texto en azul: selecciónalo y haz clic en la "A" azul que aparece en la barra flotante.',
  },
  {
    number: '2',
    title: 'Ver cómo queda',
    description: 'Haz clic en el icono del ojo 👁 (arriba a la derecha dentro del capítulo) para abrir la vista previa en tiempo real. Guarda primero con el botón "Save".',
    tip: 'La vista previa se actualiza sola mientras editas.',
  },
  {
    number: '3',
    title: 'Traducir al inglés',
    description: 'Una vez terminada la edición en español, haz clic en el botón azul "Traducir al inglés" (encima de las secciones). Solo retraduce las secciones que hayas cambiado, el resto se conserva.',
    tip: 'Si ves un aviso amarillo ⚠️ en la versión inglesa, significa que hay secciones desactualizadas. Pulsa "Traducir" para ponerlas al día.',
  },
  {
    number: '4',
    title: 'Publicar',
    description: 'Baja hasta el campo "Publicado" y márcalo. Luego haz clic en "Save". El capítulo ya será visible en la web.',
    tip: 'Si dejas "Publicado" sin marcar, el capítulo no aparece en la web aunque esté guardado.',
  },
  {
    number: '5',
    title: 'Ver estadísticas',
    description: 'Haz clic en el botón "Ver Analytics" de arriba para ver cuántas personas han visitado la web, qué capítulos leen más y desde qué países.',
    tip: 'Las estadísticas se actualizan en tiempo real.',
  },
]

export function WorkflowGuide() {
  const [open, setOpen] = useState(false)

  return (
    <div style={{ marginBottom: '1.5rem', border: '1px solid #e5e7eb', borderRadius: '6px', overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
      >
        <p style={{ fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#374151', margin: 0 }}>
          Cómo trabajar
        </p>
        <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>{open ? '▲ cerrar' : '▼ ver instrucciones'}</span>
      </button>
      {open && <div style={{ padding: '0 1.25rem 1.25rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {steps.map((step) => (
            <div key={step.number} style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
              <div style={{ minWidth: '1.6rem', height: '1.6rem', borderRadius: '50%', backgroundColor: '#1d4ed8', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 }}>
                {step.number}
              </div>
              <div>
                <p style={{ fontWeight: 600, fontSize: '0.83rem', marginBottom: '0.2rem', color: '#111827' }}>{step.title}</p>
                <p style={{ fontSize: '0.78rem', color: '#4b5563', marginBottom: '0.2rem', lineHeight: 1.5 }}>{step.description}</p>
                <p style={{ fontSize: '0.75rem', color: '#6b7280', fontStyle: 'italic' }}>💡 {step.tip}</p>
              </div>
            </div>
          ))}
        </div>
      </div>}
    </div>
  )
}
