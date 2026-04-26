import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import type { SerializedEditorState } from 'lexical'
import React from 'react'

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
  coverWebsite: {
    fontFamily: 'Helvetica',
    fontSize: 7,
    color: '#aaaaaa',
    marginBottom: 80,
    textAlign: 'center',
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
  quote: {
    marginLeft: 24,
    marginRight: 24,
    marginBottom: 8,
    fontFamily: 'Times-Italic',
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
})

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

      return (
        <Text key={i} style={fontFamily ? { fontFamily } : undefined}>
          {text}
        </Text>
      )
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

function renderBlock(node: LexicalNode, key: string): React.ReactNode {
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
        tag === 'h1' ? styles.heading1 : tag === 'h2' ? styles.heading2 : styles.heading3
      return (
        <View key={key} style={style}>
          <Text>{renderInline(node.children ?? [])}</Text>
        </View>
      )
    }

    case 'quote':
      return (
        <View key={key} style={styles.quote}>
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
  return (root.children ?? []).map((child, i) => renderBlock(child, String(i)))
}

type Chapter = {
  title: unknown
  subtitle?: unknown
  order: unknown
  sections?: Array<{
    blockId: string
    content?: SerializedEditorState | null
  }>
}

export function ChapterDocument({
  chapter,
  locale,
}: {
  chapter: Chapter
  locale: string
}) {
  const chapterLabel = locale === 'es' ? 'Capítulo' : 'Chapter'
  const sections = chapter.sections ?? []

  return (
    <Document
      title={chapter.title as string}
      author="Pedro Cubero Bros"
      subject="El grupo paranoide"
      language={locale}
    >
      {/* Cover page */}
      <Page size="A4" style={styles.coverPage}>
        <View style={styles.coverInner}>
          <Text style={styles.coverWebsite}>ELGRUPOPARANOIDE.COM</Text>
          <Text style={styles.coverBookTitle}>El grupo paranoide</Text>
          <Text style={styles.coverChapterNum}>
            {chapterLabel} {chapter.order as number}
          </Text>
          <Text style={styles.coverTitle}>{chapter.title as string}</Text>
          {chapter.subtitle ? (
            <Text style={styles.coverSubtitle}>{chapter.subtitle as string}</Text>
          ) : null}
          <Text style={styles.coverAuthor}>PEDRO CUBERO BROS</Text>
        </View>
      </Page>

      {/* Content pages — react-pdf paginates automatically */}
      <Page size="A4" style={styles.page}>
        {sections.map((section) =>
          section.content ? renderLexical(section.content) : null,
        )}
        <Text style={styles.footer} fixed>
          elgrupoparanoide.com
        </Text>
      </Page>
    </Document>
  )
}
