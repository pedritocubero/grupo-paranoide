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

// Group top-level nodes (paragraphs, headings, tables, quotes...) into chunks
// bounded by size, so a single very long section (e.g. one packed with many
// tables) is translated as several smaller requests instead of one huge call
// that can outrun the model's output limit and the platform's function
// duration limit. Never splits inside a single top-level node.
const MAX_CHUNK_CHARS = 5000

function chunkTopLevelNodes(nodes: LexicalNode[]): LexicalNode[][] {
  const chunks: LexicalNode[][] = []
  let current: LexicalNode[] = []
  let currentSize = 0

  for (const node of nodes) {
    const size = JSON.stringify(node).length
    if (current.length > 0 && currentSize + size > MAX_CHUNK_CHARS) {
      chunks.push(current)
      current = []
      currentSize = 0
    }
    current.push(node)
    currentSize += size
  }
  if (current.length > 0) chunks.push(current)

  return chunks
}

async function requestMarkedTranslation(
  marked: string,
  count: number,
  glossaryBlock: string,
): Promise<string[] | null> {
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
  return parseMarkedTranslations(raw, count)
}

function collectPlainText(node: LexicalNode): string {
  if (node.type === 'text') return node.text ?? ''
  if (Array.isArray(node.children)) return node.children.map(collectPlainText).join('')
  return ''
}

// Last-resort path for a single node whose per-run text markers the model
// can't reliably reproduce (e.g. a quotation split into several styled runs
// around one highlighted word). Translates the node's full text as one
// block and puts it in the first text child, dropping the inline
// formatting boundaries between runs — better than losing the section.
async function degradeTranslateSingleNode(node: LexicalNode, glossaryBlock: string): Promise<LexicalNode> {
  const plainText = collectPlainText(node)
  if (!plainText.trim() || !Array.isArray(node.children)) return node

  const firstText = node.children.find((c) => c.type === 'text')
  if (!firstText) return node

  const translations = await requestMarkedTranslation(`【0】${plainText}【/0】`, 1, glossaryBlock)
  const translatedText = translations ? translations[0] : plainText

  return {
    ...node,
    children: [{ ...firstText, text: translatedText }],
  }
}

async function translateNodeChunk(
  chunk: LexicalNode[],
  chunkRootTemplate: LexicalNode,
  glossaryBlock: string,
): Promise<LexicalNode[]> {
  const chunkRoot: LexicalNode = { ...chunkRootTemplate, children: chunk }
  const { marked, count } = buildMarkedString(chunkRoot)

  if (count === 0) return chunk

  for (let attempt = 0; attempt < 3; attempt++) {
    const translations = await requestMarkedTranslation(marked, count, glossaryBlock)
    if (translations) {
      const newChunkRoot = applyTranslations(chunkRoot, translations, { i: 0 })
      return newChunkRoot.children as LexicalNode[]
    }
  }

  // The group of nodes consistently confuses the marker-based translation
  // (usually one node with an odd run structure). Retry node-by-node so a
  // single problem node doesn't take its neighbors down with it.
  if (chunk.length > 1) {
    const results: LexicalNode[] = []
    for (const node of chunk) {
      results.push(...(await translateNodeChunk([node], chunkRootTemplate, glossaryBlock)))
    }
    return results
  }

  console.error(`Falling back to plain-text translation for a node that failed marker matching 3 times.`)
  return [await degradeTranslateSingleNode(chunk[0], glossaryBlock)]
}

export async function translateLexicalSection(
  content: SerializedEditorState,
  glossary: GlossaryEntry[],
): Promise<SerializedEditorState> {
  const root = content.root as unknown as LexicalNode
  const children = root.children ?? []
  const glossaryBlock = buildGlossaryBlock(glossary)
  const chunks = chunkTopLevelNodes(children)

  const translatedChunks: LexicalNode[][] = []
  const CONCURRENCY = 12
  for (let i = 0; i < chunks.length; i += CONCURRENCY) {
    const batch = chunks.slice(i, i + CONCURRENCY)
    const results = await Promise.all(
      batch.map((chunk) => translateNodeChunk(chunk, root, glossaryBlock)),
    )
    translatedChunks.push(...results)
  }

  const translatedChildren = translatedChunks.flat()
  return { ...content, root: { ...root, children: translatedChildren } as SerializedEditorState['root'] }
}
