'use client'

import { createClientFeature } from '@payloadcms/richtext-lexical/client'
import { $getSelection, $isRangeSelection, $isTextNode } from 'lexical'

const BLUE = '#1d4ed8'

function BlueTextIcon() {
  return <span style={{ color: BLUE, fontWeight: 800, fontFamily: 'serif', fontSize: '1em' }}>A</span>
}

export const BlueTextFeatureClient = createClientFeature({
  toolbarInline: {
    groups: [
      {
        type: 'buttons',
        key: 'blueTextGroup',
        items: [
          {
            ChildComponent: BlueTextIcon,
            isActive: () => false,
            key: 'blueText',
            label: 'Texto azul',
            onSelect: ({ editor }) => {
              editor.update(() => {
                const selection = $getSelection()
                if (!$isRangeSelection(selection)) return
                selection.getNodes().forEach(node => {
                  if ($isTextNode(node)) {
                    const style = node.getStyle()
                    if (style.includes('color:')) {
                      node.setStyle(style.replace(/color:[^;]+;?\s*/g, '').trim())
                    } else {
                      node.setStyle((style ? style + ' ' : '') + `color: ${BLUE};`)
                    }
                  }
                })
              })
            },
          },
        ],
      },
    ],
  },
})
