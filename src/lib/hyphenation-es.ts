// Separación silábica del español para los PDF (react-pdf usa por defecto reglas del inglés,
// que parten "riguroso" como "rig-uroso").

const STRONG = 'aeoáéóàèò'
const WEAK = 'iuüïy'
const ACCENTED_WEAK = 'íú'
const VOWELS = STRONG + WEAK + ACCENTED_WEAK

// Grupos de consonantes que no se separan (pr, bl, ...) y dígrafos que cuentan como una sola.
const INSEPARABLE = new Set(['pr', 'br', 'tr', 'dr', 'cr', 'gr', 'fr', 'kr', 'pl', 'bl', 'cl', 'gl', 'fl', 'kl'])
const DIGRAPHS = new Set(['ch', 'll', 'rr'])

const isVowel = (c: string) => VOWELS.includes(c)

// Vocales que forman un solo núcleo (diptongo/triptongo) no se separan; hiato sí.
function splitsBetweenVowels(a: string, b: string): boolean {
  const aStrong = STRONG.includes(a) || ACCENTED_WEAK.includes(a)
  const bStrong = STRONG.includes(b) || ACCENTED_WEAK.includes(b)
  return aStrong && bStrong
}

function syllabifyLower(word: string): number[] {
  // Devuelve los índices (en `word`) donde se puede cortar.
  const chars = Array.from(word)
  const n = chars.length

  // Marca "u" muda tras q, y tras g ante e/i: pertenece a la consonante, no es vocal.
  const silentU = new Set<number>()
  for (let i = 1; i < n - 1; i++) {
    if (chars[i] === 'u' && (chars[i - 1] === 'q' || (chars[i - 1] === 'g' && 'eiéí'.includes(chars[i + 1])))) {
      silentU.add(i)
    }
  }
  const vowelAt = (i: number) => {
    const c = chars[i]
    if (silentU.has(i)) return false
    // "y" es vocal solo al final de palabra o si no va seguida de vocal
    if (c === 'y') return i === n - 1 || !isVowel(chars[i + 1])
    return isVowel(c)
  }

  // Núcleos vocálicos: [inicio, fin) de cada grupo que no se separa.
  const nuclei: Array<[number, number]> = []
  let i = 0
  while (i < n) {
    if (!vowelAt(i)) {
      i++
      continue
    }
    let j = i + 1
    while (j < n && vowelAt(j) && !splitsBetweenVowels(chars[j - 1], chars[j])) j++
    nuclei.push([i, j])
    i = j
  }

  const cuts: number[] = []
  for (let k = 0; k < nuclei.length - 1; k++) {
    const endPrev = nuclei[k][1]
    const startNext = nuclei[k + 1][0]
    // Consonantes entre dos núcleos, agrupando dígrafos.
    const cons: Array<[number, number]> = [] // [inicio, fin) de cada "consonante"
    let p = endPrev
    while (p < startNext) {
      const pair = chars[p] + (chars[p + 1] ?? '')
      if (p + 1 < startNext && DIGRAPHS.has(pair)) {
        cons.push([p, p + 2])
        p += 2
      } else if (silentU.has(p + 1) && p + 1 < startNext) {
        cons.push([p, p + 2]) // qu, gu
        p += 2
      } else {
        cons.push([p, p + 1])
        p += 1
      }
    }
    const text = (c: [number, number]) => chars.slice(c[0], c[1]).join('')
    let cut: number
    if (cons.length === 0) {
      cut = endPrev // hiato: vocal | vocal
    } else if (cons.length === 1) {
      cut = cons[0][0]
    } else if (cons.length === 2) {
      cut = INSEPARABLE.has(text(cons[0]) + text(cons[1])) ? cons[0][0] : cons[1][0]
    } else {
      const last2 = text(cons[cons.length - 2]) + text(cons[cons.length - 1])
      cut = INSEPARABLE.has(last2) ? cons[cons.length - 2][0] : cons[cons.length - 1][0]
    }
    cuts.push(cut)
  }
  return cuts
}

export function hyphenateEs(word: string): string[] {
  const lead = word.match(/^[^\p{L}]*/u)![0]
  const tail = word.match(/[^\p{L}]*$/u)![0]
  const core = word.slice(lead.length, word.length - tail.length)
  // Solo palabras sueltas de letras; con cifras, guiones o apóstrofos internos no se parte.
  if (core.length < 4 || !/^\p{L}+$/u.test(core)) return [word]

  const lower = core.toLowerCase()
  // Nunca dejar una sola letra suelta al principio o al final de línea.
  const cuts = syllabifyLower(lower).filter((c) => c >= 2 && c <= core.length - 2)
  if (cuts.length === 0) return [word]

  const parts: string[] = []
  let prev = 0
  for (const c of cuts) {
    parts.push(core.slice(prev, c))
    prev = c
  }
  parts.push(core.slice(prev))
  parts[0] = lead + parts[0]
  parts[parts.length - 1] += tail
  return parts
}
