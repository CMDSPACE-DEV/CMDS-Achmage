import { $generateNodesFromSerializedNodes } from '@lexical/clipboard'
import { $insertNodes, SerializedLexicalNode, TextNode } from 'lexical'

import type { MenuTextMatch } from '../shared/LexicalMenu'

export function matchTemplateTrigger(text: string): MenuTextMatch | null {
  // Template names may contain spaces, hyphens, dots, and non-Latin text.
  const match = /(^|\s|\()(\/([^/\n]{0,100}))$/.exec(text)
  if (!match) return null
  return {
    leadOffset: match.index + match[1].length,
    matchingString: match[3],
    replaceableString: match[2],
  }
}

export function $insertTemplate(
  serializedNodes: SerializedLexicalNode[],
  queryNode: TextNode | null,
): void {
  if (!queryNode || serializedNodes.length === 0) return
  const nodes = $generateNodesFromSerializedNodes(serializedNodes)
  // Replace the slash query through the selection so block nodes are merged
  // correctly instead of inserting paragraphs inside another paragraph.
  queryNode.select(0, queryNode.getTextContentSize())
  $insertNodes(nodes)
}
