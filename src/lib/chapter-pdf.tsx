import { Document, Font, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import type { SerializedEditorState } from 'lexical'
import path from 'path'
import React from 'react'
import { extractHeadings } from '@/lib/headings'

// Evita que una palabra del título de portada se corte con un guion al final de línea.
const noHyphenation = (word: string) => [word]

// Las fuentes Times estándar del PDF no incluyen flechas ni operadores
// matemáticos (ver SYMBOL_CHAR más abajo); esta fuente sí los tiene.
Font.register({
  family: 'Symbols',
  src: path.join(process.cwd(), 'public', 'fonts', 'NotoSansMath-symbols.ttf'),
})

type LexicalNode = {
  type: string
  text?: string
  format?: number
  tag?: string
  listType?: string
  children?: LexicalNode[]
  [key: string]: unknown
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 72,
    paddingBottom: 90,
    paddingLeft: 72,
    paddingRight: 72,
    fontFamily: 'Times-Roman',
    fontSize: 11,
    lineHeight: 1.7,
    color: '#1a1a1a',
  },
  coverPage: {
    paddingTop: 72,
    paddingBottom: 72,
    paddingLeft: 72,
    paddingRight: 72,
    fontFamily: 'Times-Roman',
    fontSize: 11,
    color: '#1a1a1a',
  },
  coverInner: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverBookTitle: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: '#888888',
    marginBottom: 20,
    textAlign: 'center',
  },
  coverChapterNum: {
    fontFamily: 'Helvetica',
    fontSize: 8,
    color: '#bbbbbb',
    marginBottom: 10,
    textAlign: 'center',
  },
  coverTitle: {
    fontFamily: 'Times-Bold',
    fontSize: 28,
    textAlign: 'center',
    color: '#111111',
    marginBottom: 16,
    lineHeight: 1.3,
  },
  coverSubtitle: {
    fontFamily: 'Times-Italic',
    fontSize: 10,
    textAlign: 'center',
    color: '#666666',
    marginBottom: 80,
  },
  tocPage: {
    paddingTop: 72,
    paddingBottom: 90,
    paddingLeft: 72,
    paddingRight: 72,
    fontFamily: 'Times-Roman',
    fontSize: 11,
    color: '#1a1a1a',
  },
  tocTitle: {
    fontFamily: 'Helvetica',
    fontSize: 7,
    letterSpacing: 2,
    color: '#aaaaaa',
    marginBottom: 32,
  },
  tocH2: {
    fontFamily: 'Times-Roman',
    fontSize: 11,
    marginBottom: 8,
    marginTop: 6,
  },
  tocH3: {
    fontFamily: 'Times-Roman',
    fontSize: 10,
    marginLeft: 16,
    marginBottom: 4,
    color: '#444444',
  },
  tocH4: {
    fontFamily: 'Times-Italic',
    fontSize: 9,
    marginLeft: 32,
    marginBottom: 3,
    color: '#666666',
  },
  coverAuthor: {
    fontFamily: 'Helvetica',
    fontSize: 8,
    color: '#999999',
    textAlign: 'center',
  },
  paragraph: {
    marginBottom: 8,
  },
  heading1: {
    fontFamily: 'Times-Bold',
    fontSize: 18,
    marginTop: 28,
    marginBottom: 12,
    lineHeight: 1.3,
  },
  heading2: {
    fontFamily: 'Times-Bold',
    fontSize: 14,
    marginTop: 22,
    marginBottom: 8,
    lineHeight: 1.3,
  },
  heading3: {
    fontFamily: 'Times-Bold',
    fontSize: 12,
    marginTop: 16,
    marginBottom: 6,
    lineHeight: 1.3,
  },
  heading4: {
    fontFamily: 'Times-Italic',
    fontSize: 11,
    marginTop: 12,
    marginBottom: 8,
    lineHeight: 1.3,
  },
  quote: {
    marginLeft: 24,
    marginRight: 24,
    marginBottom: 8,
  },
  listView: {
    marginBottom: 8,
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  listBullet: {
    width: 16,
    flexShrink: 0,
  },
  listContent: {
    flex: 1,
  },
  table: {
    marginTop: 8,
    marginBottom: 12,
  },
  tableRow: {
    flexDirection: 'row',
  },
  tableCell: {
    flex: 1,
    borderStyle: 'solid',
    borderWidth: 0.5,
    borderColor: '#cccccc',
    paddingVertical: 3,
    paddingHorizontal: 4,
  },
  tableCellFirst: {
    flex: 4,
  },
  tableCellText: {
    fontFamily: 'Helvetica',
    fontSize: 6.5,
    lineHeight: 1.3,
    textAlign: 'center',
  },
  tableCellTextFirst: {
    textAlign: 'left',
  },
  tableCellHeader: {
    backgroundColor: '#f5f5f4',
  },
  tableCellHeaderText: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 6.5,
    lineHeight: 1.3,
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 72,
    right: 72,
    textAlign: 'center',
    fontFamily: 'Helvetica',
    fontSize: 7,
    color: '#bbbbbb',
  },
  pageNumber: {
    position: 'absolute',
    bottom: 24,
    left: 72,
    right: 72,
    textAlign: 'center',
    fontFamily: 'Helvetica',
    fontSize: 8,
    color: '#999999',
  },
})

// Flechas (→ ⇒ ...) y operadores matemáticos (≈ ≠ ...): las fuentes Times de
// PDF (WinAnsi) no tienen esos glifos y los corrompen en silencio. La fuente
// estándar "Symbol" sí los soporta, así que esos caracteres sueltos se pintan
// con esa fuente y el resto del texto sigue con la fuente normal.
const SYMBOL_CHAR = /[←-⇿∀-⋿]/

function renderTextWithSymbols(text: string, key: string, fontFamily?: string): React.ReactNode {
  if (!SYMBOL_CHAR.test(text)) {
    return (
      <Text key={key} style={fontFamily ? { fontFamily } : undefined}>
        {text}
      </Text>
    )
  }
  const parts = text.split(new RegExp(`(${SYMBOL_CHAR.source})`))
  return (
    <Text key={key} style={fontFamily ? { fontFamily } : undefined}>
      {parts.map((part, i) =>
        SYMBOL_CHAR.test(part) ? (
          <Text key={i} style={{ fontFamily: 'Symbols' }}>
            {part}
          </Text>
        ) : (
          part
        ),
      )}
    </Text>
  )
}

function renderInline(children: LexicalNode[]): React.ReactNode {
  return children.map((node, i) => {
    if (node.type === 'text') {
      const text = node.text ?? ''
      const format = (node.format as number) ?? 0
      const isBold = (format & 1) !== 0
      const isItalic = (format & 2) !== 0

      let fontFamily: string | undefined
      if (isBold && isItalic) fontFamily = 'Times-BoldItalic'
      else if (isBold) fontFamily = 'Times-Bold'
      else if (isItalic) fontFamily = 'Times-Italic'

      return renderTextWithSymbols(text, String(i), fontFamily)
    }

    if (node.type === 'linebreak') {
      return <Text key={i}>{'\n'}</Text>
    }

    if (node.children && node.children.length > 0) {
      return <Text key={i}>{renderInline(node.children)}</Text>
    }

    return null
  })
}

function renderBlock(
  node: LexicalNode,
  key: string,
  extraStyle?: Record<string, unknown>,
): React.ReactNode {
  switch (node.type) {
    case 'paragraph': {
      const children = node.children ?? []
      if (children.length === 0) return <View key={key} style={{ marginBottom: 8 }} />
      return (
        <View key={key} style={styles.paragraph}>
          <Text>{renderInline(children)}</Text>
        </View>
      )
    }

    case 'heading': {
      const tag = (node.tag as string) ?? 'h2'
      const style =
        tag === 'h1' ? styles.heading1 : tag === 'h2' ? styles.heading2 : tag === 'h3' ? styles.heading3 : styles.heading4
      return (
        <View key={key} style={{ ...style, ...extraStyle }}>
          <Text>{renderInline(node.children ?? [])}</Text>
        </View>
      )
    }

    case 'quote':
      return (
        <View key={key} style={{ ...styles.quote, ...extraStyle }}>
          <Text>{renderInline(node.children ?? [])}</Text>
        </View>
      )

    case 'list': {
      const isOrdered = node.listType === 'number'
      return (
        <View key={key} style={styles.listView}>
          {(node.children ?? []).map((item, i) => (
            <View key={i} style={styles.listItem}>
              <Text style={styles.listBullet}>{isOrdered ? `${i + 1}.` : '•'}</Text>
              <Text style={styles.listContent}>{renderInline(item.children ?? [])}</Text>
            </View>
          ))}
        </View>
      )
    }

    case 'table': {
      const rows = node.children ?? []
      return (
        <View key={key} style={styles.table} wrap={false}>
          {rows.map((row, ri) => (
            <View key={ri} style={styles.tableRow}>
              {(row.children ?? []).map((cell, ci) => {
                const isHeader = ((cell.headerState as number) ?? 0) > 0
                return (
                  <View
                    key={ci}
                    style={{
                      ...styles.tableCell,
                      ...(ci === 0 ? styles.tableCellFirst : {}),
                      ...(isHeader ? styles.tableCellHeader : {}),
                    }}
                  >
                    <Text
                      style={{
                        ...(isHeader ? styles.tableCellHeaderText : styles.tableCellText),
                        ...(ci === 0 ? styles.tableCellTextFirst : {}),
                      }}
                    >
                      {renderInline(cell.children ?? [])}
                    </Text>
                  </View>
                )
              })}
            </View>
          ))}
        </View>
      )
    }

    default:
      if (node.children && node.children.length > 0) {
        return (
          <View key={key} style={styles.paragraph}>
            <Text>{renderInline(node.children)}</Text>
          </View>
        )
      }
      return null
  }
}

function renderLexical(content: SerializedEditorState): React.ReactNode[] {
  const root = content.root as unknown as LexicalNode
  const children = root.children ?? []
  return children.map((child, i) => renderBlock(child, String(i), blockExtraStyle(child, children[i + 1])))
}

// Epígrafe (h4) justo antes de una cita: se alinea con su sangría y se pega a ella.
// Párrafos consecutivos de una misma cita larga: sin hueco extra entre ellos.
function blockExtraStyle(node: LexicalNode, next?: LexicalNode): Record<string, unknown> | undefined {
  if (node.type === 'heading' && node.tag === 'h4' && next?.type === 'quote') {
    return { marginLeft: 24, marginBottom: 0 }
  }
  if (node.type === 'quote' && next?.type === 'quote') {
    return { marginBottom: 0 }
  }
  return undefined
}

type Reference = { num: number; text: string }

type Chapter = {
  title: unknown
  subtitle?: unknown
  order: unknown
  part?: unknown
  sections?: Array<{
    blockId: string
    content?: SerializedEditorState | null
  }>
  references?: Reference[]
}

const BOOK_TITLES: Record<string, { es: string; en: string }> = {
  obstinaciones: { es: 'Obstinaciones', en: 'Obstinaciones' },
}

export function ChapterDocument({
  chapter,
  locale,
}: {
  chapter: Chapter
  locale: string
}) {
  const bookTitle =
    BOOK_TITLES[chapter.part as string]?.[locale as 'es' | 'en'] ?? 'El grupo paranoide'
  const chapterLabel = locale === 'es' ? 'Capítulo' : 'Chapter'
  const tocLabel = locale === 'es' ? 'ÍNDICE' : 'CONTENTS'
  const refsLabel = locale === 'es' ? 'REFERENCIAS' : 'REFERENCES'
  const sections = chapter.sections ?? []
  const references = chapter.references ?? []
  const headings = extractHeadings(sections)

  return (
    <Document
      title={chapter.title as string}
      author="Pedro Cubero Bros"
      subject={bookTitle}
      language={locale}
    >
      {/* Cover page */}
      <Page size="A4" style={styles.coverPage}>
        <View style={styles.coverInner}>
          <Text style={styles.coverBookTitle}>{bookTitle}</Text>
          <Text style={styles.coverChapterNum}>
            {chapterLabel} {chapter.order as number}
          </Text>
          <Text style={styles.coverTitle} hyphenationCallback={noHyphenation}>
            {chapter.title as string}
          </Text>
          {chapter.subtitle ? (
            <Text style={styles.coverSubtitle}>{chapter.subtitle as string}</Text>
          ) : null}
          <Text style={styles.coverAuthor}>PEDRO CUBERO BROS</Text>
        </View>
      </Page>

      {/* TOC page — only if there are headings */}
      {headings.length > 0 && (
        <Page size="A4" style={styles.tocPage}>
          <Text style={styles.tocTitle}>{tocLabel}</Text>
          {headings.map((h, i) => (
            <Text
              key={i}
              style={h.tag === 'h2' ? styles.tocH2 : h.tag === 'h3' ? styles.tocH3 : styles.tocH4}
            >
              {h.text}
            </Text>
          ))}
          <Text
            style={styles.pageNumber}
            fixed
            render={({ pageNumber }) => String(pageNumber)}
          />
        </Page>
      )}

      {/* Content pages — react-pdf paginates automatically */}
      <Page size="A4" style={styles.page}>
        {sections.map((section) =>
          section.content ? renderLexical(section.content) : null,
        )}
        {references.length > 0 && (
          <View break style={{ marginTop: 32, paddingTop: 16, borderTop: '1px solid #e0e0e0' }}>
            <Text style={{ fontFamily: 'Helvetica', fontSize: 7, letterSpacing: 2, color: '#aaaaaa', marginBottom: 16 }}>
              {refsLabel}
            </Text>
            {references.map((ref) => (
              <View key={ref.num} style={{ flexDirection: 'row', marginBottom: 6 }}>
                <Text style={{ fontFamily: 'Times-Roman', fontSize: 9, color: '#555555', width: 20, flexShrink: 0 }}>
                  {ref.num}.
                </Text>
                <Text style={{ fontFamily: 'Times-Roman', fontSize: 9, color: '#555555', flex: 1, lineHeight: 1.5 }}>
                  {ref.text}
                </Text>
              </View>
            ))}
          </View>
        )}
        <Text style={styles.footer} fixed>
          elgrupoparanoide.com
        </Text>
        <Text
          style={styles.pageNumber}
          fixed
          render={({ pageNumber }) => String(pageNumber)}
        />
      </Page>
    </Document>
  )
}
