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

type ChapterData = {
  title: string
  subtitle?: string
  order: number
  sections: Array<{ blockId: string; content?: SerializedEditorState | null }>
}

const styles = StyleSheet.create({
  bookCoverPage: {
    paddingTop: 72, paddingBottom: 72, paddingLeft: 72, paddingRight: 72,
    fontFamily: 'Times-Roman', fontSize: 11, color: '#1a1a1a',
  },
  bookCoverInner: {
    flex: 1, flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
  },
  bookCoverWebsite: {
    fontFamily: 'Helvetica', fontSize: 7, color: '#aaaaaa', marginBottom: 80, textAlign: 'center',
  },
  bookCoverTitle: {
    fontFamily: 'Times-Bold', fontSize: 36, textAlign: 'center', color: '#111111',
    marginBottom: 24, lineHeight: 1.3,
  },
  bookCoverAuthor: {
    fontFamily: 'Helvetica', fontSize: 10, color: '#999999', textAlign: 'center',
  },
  chapterCoverPage: {
    paddingTop: 72, paddingBottom: 72, paddingLeft: 72, paddingRight: 72,
    fontFamily: 'Times-Roman', fontSize: 11, color: '#1a1a1a',
  },
  chapterCoverInner: {
    flex: 1, flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
  },
  chapterNum: {
    fontFamily: 'Helvetica', fontSize: 8, color: '#bbbbbb', marginBottom: 10, textAlign: 'center',
  },
  chapterTitle: {
    fontFamily: 'Times-Bold', fontSize: 24, textAlign: 'center', color: '#111111',
    marginBottom: 16, lineHeight: 1.3,
  },
  chapterSubtitle: {
    fontFamily: 'Times-Italic', fontSize: 10, textAlign: 'center', color: '#666666',
  },
  page: {
    paddingTop: 72, paddingBottom: 90, paddingLeft: 72, paddingRight: 72,
    fontFamily: 'Times-Roman', fontSize: 11, lineHeight: 1.7, color: '#1a1a1a',
  },
  paragraph: { marginBottom: 8 },
  heading2: { fontFamily: 'Times-Bold', fontSize: 14, marginTop: 22, marginBottom: 8, lineHeight: 1.3 },
  heading3: { fontFamily: 'Times-Bold', fontSize: 12, marginTop: 16, marginBottom: 6, lineHeight: 1.3 },
  heading4: { fontFamily: 'Times-Italic', fontSize: 11, marginTop: 12, marginBottom: 4, lineHeight: 1.3 },
  quote: { marginLeft: 24, marginRight: 24, marginBottom: 8, fontFamily: 'Times-Italic' },
  listView: { marginBottom: 8 },
  listItem: { flexDirection: 'row', marginBottom: 4 },
  listBullet: { width: 16, flexShrink: 0 },
  listContent: { flex: 1 },
  footer: {
    position: 'absolute', bottom: 40, left: 72, right: 72,
    textAlign: 'center', fontFamily: 'Helvetica', fontSize: 7, color: '#bbbbbb',
  },
})

function renderInline(children: LexicalNode[]): React.ReactNode {
  return children.map((node, i) => {
    if (node.type === 'text') {
      const format = (node.format as number) ?? 0
      const isBold = (format & 1) !== 0
      const isItalic = (format & 2) !== 0
      let fontFamily: string | undefined
      if (isBold && isItalic) fontFamily = 'Times-BoldItalic'
      else if (isBold) fontFamily = 'Times-Bold'
      else if (isItalic) fontFamily = 'Times-Italic'
      return <Text key={i} style={fontFamily ? { fontFamily } : undefined}>{node.text ?? ''}</Text>
    }
    if (node.type === 'linebreak') return <Text key={i}>{'\n'}</Text>
    if (node.children?.length) return <Text key={i}>{renderInline(node.children)}</Text>
    return null
  })
}

function renderBlock(node: LexicalNode, key: string): React.ReactNode {
  switch (node.type) {
    case 'paragraph': {
      const children = node.children ?? []
      if (!children.length) return <View key={key} style={{ marginBottom: 8 }} />
      return <View key={key} style={styles.paragraph}><Text>{renderInline(children)}</Text></View>
    }
    case 'heading': {
      const tag = (node.tag as string) ?? 'h2'
      const style = tag === 'h2' ? styles.heading2 : tag === 'h3' ? styles.heading3 : styles.heading4
      return <View key={key} style={style}><Text>{renderInline(node.children ?? [])}</Text></View>
    }
    case 'quote':
      return <View key={key} style={styles.quote}><Text>{renderInline(node.children ?? [])}</Text></View>
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
      if (node.children?.length) {
        return <View key={key} style={styles.paragraph}><Text>{renderInline(node.children)}</Text></View>
      }
      return null
  }
}

function renderLexical(content: SerializedEditorState): React.ReactNode[] {
  const root = content.root as unknown as LexicalNode
  return (root.children ?? []).map((child, i) => renderBlock(child, String(i)))
}

export function BookDocument({ chapters, locale }: { chapters: ChapterData[]; locale: string }) {
  const chapterLabel = locale === 'es' ? 'Capítulo' : 'Chapter'

  return (
    <Document title="El grupo paranoide" author="Pedro Cubero Bros" language={locale}>
      {/* Portada del libro */}
      <Page size="A4" style={styles.bookCoverPage}>
        <View style={styles.bookCoverInner}>
          <Text style={styles.bookCoverWebsite}>ELGRUPOPARANOIDE.COM</Text>
          <Text style={styles.bookCoverTitle}>El grupo paranoide</Text>
          <Text style={styles.bookCoverAuthor}>PEDRO CUBERO BROS</Text>
        </View>
      </Page>

      {/* Un bloque por capítulo: portadilla + contenido */}
      {chapters.map((chapter) => (
        <React.Fragment key={chapter.order}>
          {/* Portadilla del capítulo */}
          <Page size="A4" style={styles.chapterCoverPage}>
            <View style={styles.chapterCoverInner}>
              <Text style={styles.chapterNum}>{chapterLabel} {chapter.order}</Text>
              <Text style={styles.chapterTitle}>{chapter.title}</Text>
              {chapter.subtitle ? (
                <Text style={styles.chapterSubtitle}>{chapter.subtitle}</Text>
              ) : null}
            </View>
          </Page>

          {/* Contenido del capítulo */}
          <Page size="A4" style={styles.page}>
            {chapter.sections.map((section) =>
              section.content ? renderLexical(section.content) : null,
            )}
            <Text style={styles.footer} fixed>
              El grupo paranoide · Pedro Cubero Bros · elgrupoparanoide.com
            </Text>
          </Page>
        </React.Fragment>
      ))}
    </Document>
  )
}
