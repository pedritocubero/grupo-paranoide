/**
 * Seed the GlossaryTerms collection with the book's key terminology.
 * Run once with: npx tsx src/scripts/seed-glossary.ts
 * (The dev server must be running on localhost:3000)
 */

const TERMS = [
  { termEs: 'conducta paranoide', termEn: 'paranoid behavior', notes: 'Never "paranoid conduct"' },
  { termEs: 'grupo de contagio paranoide', termEn: 'paranoid contagion group', notes: 'Abbreviation: PCG (GCP in Spanish)' },
  { termEs: 'apiñamiento', termEn: 'huddling', notes: 'Never "crowding" — author\'s specific term' },
  { termEs: 'paranoidización', termEn: 'paranoidization', notes: 'Author\'s neologism — keep it' },
  { termEs: 'hipersociabilidad', termEn: 'hypersociability', notes: '' },
  { termEs: 'piramidalismo', termEn: 'pyramidalism', notes: '' },
  { termEs: 'sectas', termEn: 'cults', notes: 'Standard anthropological term' },
  { termEs: 'cultos de crisis', termEn: 'crisis cults', notes: 'Standard anthropological term' },
]

async function main() {
  for (const term of TERMS) {
    const res = await fetch('http://localhost:3000/api/glossary-terms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(term),
    })
    const data = await res.json()
    if (res.ok) {
      console.log(`✓ ${term.termEs} → ${term.termEn}`)
    } else {
      console.error(`✗ ${term.termEs}:`, data)
    }
  }
}

main().catch(console.error)
