import type { SerializedEditorState } from 'lexical'

// Cita guardada como párrafo normal (empieza por comillas y acaba en referencia "(2)"):
// se trata como cita (blockquote) para que lleve su estilo y su epígrafe se le pegue.
export function quoteCitationParagraphs(content: SerializedEditorState): SerializedEditorState {
  const root = content.root as unknown as { children?: Array<Record<string, any>> }
  const children = (root.children ?? []).map((node) => {
    if (node.type !== 'paragraph') return node
    const text = (node.children ?? []).map((c: Record<string, any>) => c.text ?? '').join('').trim()
    const isCitation = /^[“"«]/.test(text) && /\(\d+([,–-]\s*\d+)*\)\.?$/.test(text)
    return isCitation ? { ...node, type: 'quote' } : node
  })
  return { ...content, root: { ...content.root, children } } as SerializedEditorState
}

// Epígrafe pegado a una cita ("Freud. Carácter anal."): la web le quita el punto final
// (ChapterPageClient); los PDF usan esto para que se vea igual.
export function stripTrailingPeriod<T extends { children?: Array<Record<string, any>> }>(node: T): T {
  const children = [...(node.children ?? [])]
  for (let i = children.length - 1; i >= 0; i--) {
    const child = children[i]
    if (typeof child.text === 'string') {
      if (child.text.length === 0) continue
      children[i] = { ...child, text: child.text.replace(/\.$/, '') }
      break
    }
    if (child.children) {
      children[i] = stripTrailingPeriod(child)
      break
    }
  }
  return { ...node, children }
}

// Citas sin comillas (norma de la RAE), igual que la web: se quita la comilla de apertura y
// la de cierre (que puede ir antes de la referencia "(n)"). Las comillas interiores se
// conservan. El texto guardado no cambia; solo lo que se dibuja en el PDF.
export function stripQuoteMarks<T extends { children?: Array<Record<string, any>> }>(node: T): T {
  const copy = (n: Record<string, any>): Record<string, any> =>
    n.children ? { ...n, children: n.children.map(copy) } : { ...n }
  const root = copy(node) as T
  const leaves: Array<Record<string, any>> = []
  const collect = (n: Record<string, any>) => {
    if (typeof n.text === 'string') leaves.push(n)
    else (n.children ?? []).forEach(collect)
  }
  collect(root)
  const full = leaves.map((l) => l.text as string).join('')
  const removeAt = (pos: number) => {
    let offset = 0
    for (const l of leaves) {
      const len = (l.text as string).length
      if (pos < offset + len) {
        const s = l.text as string
        l.text = s.slice(0, pos - offset) + s.slice(pos - offset + 1)
        return
      }
      offset += len
    }
  }
  const close = /[”"»](?=\s*(?:\(\d+(?:[,–-]\s*\d+)*\))?[.,;:]?\s*$)/.exec(full)
  const open = /^\s*[“"«]/.exec(full)
  if (close && (!open || close.index > open.index + open[0].length - 1)) removeAt(close.index)
  if (open) removeAt(open[0].length - 1)
  return root
}
