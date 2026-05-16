import type { SerializedEditorState, SerializedLexicalNode } from 'lexical'

export type Heading = {
  tag: 'h2' | 'h3' | 'h4'
  text: string
  id: string
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 80)
}

function textFromChildren(children: SerializedLexicalNode[]): string {
  return children
    .map((c: any) => (c.text ?? textFromChildren(c.children ?? [])))
    .join('')
}

export function extractHeadings(
  sections: { content?: SerializedEditorState | null }[],
): Heading[] {
  const headings: Heading[] = []
  const seen = new Map<string, number>()

  for (const section of sections) {
    const nodes = section.content?.root?.children ?? []
    for (const node of nodes as any[]) {
      if (node.type !== 'heading') continue
      const tag = node.tag as string
      if (tag !== 'h2' && tag !== 'h3' && tag !== 'h4') continue
      const text = textFromChildren(node.children ?? [])
      if (!text.trim()) continue
      const base = slugify(text) || 'heading'
      const count = seen.get(base) ?? 0
      seen.set(base, count + 1)
      const id = count === 0 ? base : `${base}-${count}`
      headings.push({ tag: tag as Heading['tag'], text, id })
    }
  }
  return headings
}
