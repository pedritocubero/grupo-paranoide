'use client'

export function AnalyticsLink() {
  return (
    <div style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem', border: '1px solid #e5e7eb', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div>
        <p style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.2rem' }}>Estadísticas de visitas</p>
        <p style={{ fontSize: '0.78rem', color: '#6b7280' }}>Visitantes, páginas más leídas, países y dispositivos</p>
      </div>
      <a
        href="https://vercel.com/pedritocuberos-projects/grupo-paranoide/analytics"
        target="_blank"
        rel="noopener noreferrer"
        style={{ padding: '0.45rem 1rem', backgroundColor: '#000', color: '#fff', borderRadius: '4px', fontSize: '0.82rem', fontWeight: 500, textDecoration: 'none', whiteSpace: 'nowrap' }}
      >
        Ver Analytics →
      </a>
    </div>
  )
}
