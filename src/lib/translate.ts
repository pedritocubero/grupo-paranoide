import Anthropic from '@anthropic-ai/sdk'
import type { SerializedEditorState } from 'lexical'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

interface GlossaryEntry {
  termEs: string
  termEn: string
  notes?: string | null
}

// Loose type for Lexical tree traversal — avoids fighting with SerializedLexicalNode's strict base type
type LexicalNode = {
  type: string
  text?: string
  children?: LexicalNode[]
  [key: string]: unknown
}

function collectTexts(node: LexicalNode): string[] {
  if (node.type === 'text' && typeof node.text === 'string') {
    return [node.text]
  }
  if (Array.isArray(node.children)) {
    return node.children.flatMap((child) => collectTexts(child))
  }
  return []
}

function applyTranslations(node: LexicalNode, translations: string[], counter: { i: number }): LexicalNode {
  if (node.type === 'text') {
    const translated = translations[counter.i] ?? node.text ?? ''
    counter.i++
    return { ...node, text: translated }
  }
  if (Array.isArray(node.children)) {
    return {
      ...node,
      children: node.children.map((child) => applyTranslations(child, translations, counter)),
    }
  }
  return { ...node }
}

function buildGlossaryBlock(terms: GlossaryEntry[]): string {
  if (terms.length === 0) return ''
  const lines = terms.map((t) => {
    const note = t.notes ? ` — ${t.notes}` : ''
    return `  "${t.termEs}" → "${t.termEn}"${note}`
  })
  return `\nGlossary (always use these exact translations):\n${lines.join('\n')}\n`
}

export async function translateStrings(
  texts: string[],
  glossary: GlossaryEntry[] = [],
): Promise<string[]> {
  if (texts.length === 0) return []
  const glossaryBlock = buildGlossaryBlock(glossary)
  const prompt = `Translate these Spanish texts to English. Return ONLY a JSON array with ${texts.length} string(s). No explanations or markdown.${glossaryBlock}
Input: ${JSON.stringify(texts)}`

  const message = await client.messages.create({
    model: process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6',
    max_tokens: 512,
    messages: [{ role: 'user', content: prompt }],
  })

  const raw = (message.content[0] as { type: string; text: string }).text.trim()
  const jsonMatch = raw.match(/\[[\s\S]*\]/)
  if (!jsonMatch) return texts
  const translated: string[] = JSON.parse(jsonMatch[0])
  return Array.isArray(translated) ? translated : texts
}

export async function translateLexicalSection(
  content: SerializedEditorState,
  glossary: GlossaryEntry[],
): Promise<SerializedEditorState> {
  const rootNode = content.root as unknown as LexicalNode

  const texts = collectTexts(rootNode)
  if (texts.filter((t) => t.trim().length > 0).length === 0) return content

  const glossaryBlock = buildGlossaryBlock(glossary)

  const prompt = `You are a literary translator. Translate the following Spanish texts to English.
Rules:
- Return ONLY a JSON array of translated strings, in the same order as the input.
- Preserve all punctuation, spacing, and special characters exactly.
- Do not merge or split items — the output array must have exactly ${texts.length} elements.
- Do not add explanations or markdown.${glossaryBlock}
Input JSON array:
${JSON.stringify(texts)}`

  const message = await client.messages.create({
    model: process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  })

  const raw = (message.content[0] as { type: string; text: string }).text.trim()
  const jsonMatch = raw.match(/\[[\s\S]*\]/)
  if (!jsonMatch) throw new Error(`Claude returned unexpected format: ${raw.slice(0, 200)}`)

  const translated: string[] = JSON.parse(jsonMatch[0])
  if (!Array.isArray(translated) || translated.length !== texts.length) {
    throw new Error(`Translation length mismatch: expected ${texts.length}, got ${translated.length}`)
  }

  const newRoot = applyTranslations(rootNode, translated, { i: 0 })
  return { ...content, root: newRoot as SerializedEditorState['root'] }
}
