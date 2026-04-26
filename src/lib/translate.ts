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

type LexicalNode = {
  type: string
  text?: string
  children?: LexicalNode[]
  [key: string]: unknown
}

// Build a string with 【i】text【/i】 markers around every text node.
// Returns the marked string and the total number of text nodes found.
function buildMarkedString(root: LexicalNode): { marked: string; count: number } {
  let i = 0

  function walk(node: LexicalNode): string {
    if (node.type === 'text') {
      const marker = `【${i}】${node.text ?? ''}【/${i}】`
      i++
      return marker
    }
    if (Array.isArray(node.children)) {
      const inner = node.children.map(walk).join('')
      const isBlock = ['paragraph', 'heading', 'quote', 'listitem', 'list'].includes(node.type)
      return isBlock ? inner + '\n' : inner
    }
    return ''
  }

  const marked = (root.children ?? []).map(walk).join('')
  return { marked, count: i }
}

// Extract the translated text for each marker index from Claude's response.
function parseMarkedTranslations(raw: string, count: number): string[] | null {
  const results: string[] = []
  for (let i = 0; i < count; i++) {
    const match = raw.match(new RegExp(`【${i}】([\\s\\S]*?)【\\/${i}】`))
    if (!match) return null
    results.push(match[1])
  }
  return results
}

// Apply translated strings back to the tree, replacing text node contents.
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

function parseTaggedTranslations(raw: string, expected: number): string[] | null {
  const matches = [...raw.matchAll(/<T>([\s\S]*?)<\/T>/g)]
  if (matches.length !== expected) return null
  return matches.map((m) => m[1])
}

export async function translateStrings(
  texts: string[],
  glossary: GlossaryEntry[] = [],
): Promise<string[]> {
  if (texts.length === 0) return []
  const glossaryBlock = buildGlossaryBlock(glossary)
  const prompt = `Translate these Spanish texts to English. Return ONLY ${texts.length} translation(s) wrapped in <T>...</T> tags, one per line. No explanations.${glossaryBlock}
Input: ${JSON.stringify(texts)}`

  const message = await client.messages.create({
    model: process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6',
    max_tokens: 512,
    messages: [{ role: 'user', content: prompt }],
  })

  const raw = (message.content[0] as { type: string; text: string }).text.trim()
  const translated = parseTaggedTranslations(raw, texts.length)
  return translated ?? texts
}

export async function translateLexicalSection(
  content: SerializedEditorState,
  glossary: GlossaryEntry[],
): Promise<SerializedEditorState> {
  const root = content.root as unknown as LexicalNode
  const { marked, count } = buildMarkedString(root)

  if (count === 0) return content

  const glossaryBlock = buildGlossaryBlock(glossary)
  const prompt = `You are a literary translator. Translate the Spanish text to English.
The text contains numbered markers 【0】…【/0】, 【1】…【/1】, etc.
Return the COMPLETE text with ALL ${count} markers preserved exactly as-is.
Only translate the content between the markers — never modify the markers themselves.${glossaryBlock}

Text to translate:
${marked}`

  const message = await client.messages.create({
    model: process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6',
    max_tokens: 8192,
    messages: [{ role: 'user', content: prompt }],
  })

  const raw = (message.content[0] as { type: string; text: string }).text.trim()
  const translations = parseMarkedTranslations(raw, count)

  if (!translations) {
    throw new Error(
      `Marker mismatch: expected ${count} markers. Response: ${raw.slice(0, 300)}`,
    )
  }

  const newRoot = applyTranslations(root, translations, { i: 0 })
  return { ...content, root: newRoot as SerializedEditorState['root'] }
}
