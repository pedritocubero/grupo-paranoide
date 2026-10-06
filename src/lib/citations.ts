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
