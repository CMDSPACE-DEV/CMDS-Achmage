import { parseFragment } from 'parse5'

export type ParsedTagContent =
  | { type: 'string'; content: string }
  | {
      type: 'smtcmp_block'
      content: string
      language?: string
      filename?: string
      startLine?: number
      endLine?: number
    }
  | {
      type: 'think'
      content: string
    }
  | {
      type: 'achmage_edit'
      op: string
      anchor?: string
      until?: string
      heading?: string
      content: string
      /** False while the closing tag has not streamed in yet. */
      complete: boolean
    }

/**
 * Parses text containing <smtcmp_block> and <think> tags into structured content
 */
export function parseTagContents(input: string): ParsedTagContent[] {
  const parsedResult: ParsedTagContent[] = []
  const fragment = parseFragment(input, {
    sourceCodeLocationInfo: true,
  })
  let lastEndOffset = 0
  for (const node of fragment.childNodes) {
    if (node.nodeName === 'smtcmp_block') {
      if (!node.sourceCodeLocation) {
        throw new Error('sourceCodeLocation is undefined')
      }
      const startOffset = node.sourceCodeLocation.startOffset
      const endOffset = node.sourceCodeLocation.endOffset
      if (startOffset > lastEndOffset) {
        parsedResult.push({
          type: 'string',
          content: input.slice(lastEndOffset, startOffset),
        })
      }

      const language = node.attrs.find(
        (attr) => attr.name === 'language',
      )?.value
      const filename = node.attrs.find(
        (attr) => attr.name === 'filename',
      )?.value
      const startLine = node.attrs.find(
        (attr) => attr.name === 'startline',
      )?.value
      const endLine = node.attrs.find((attr) => attr.name === 'endline')?.value

      const children = node.childNodes
      if (children.length === 0) {
        parsedResult.push({
          type: 'smtcmp_block',
          content: '',
          language,
          filename,
          startLine: startLine ? parseInt(startLine) : undefined,
          endLine: endLine ? parseInt(endLine) : undefined,
        })
      } else {
        const innerContentStartOffset =
          children[0].sourceCodeLocation?.startOffset
        const innerContentEndOffset =
          children[children.length - 1].sourceCodeLocation?.endOffset
        if (!innerContentStartOffset || !innerContentEndOffset) {
          throw new Error('sourceCodeLocation is undefined')
        }
        parsedResult.push({
          type: 'smtcmp_block',
          content: input.slice(innerContentStartOffset, innerContentEndOffset),
          language,
          filename,
          startLine: startLine ? parseInt(startLine) : undefined,
          endLine: endLine ? parseInt(endLine) : undefined,
        })
      }
      lastEndOffset = endOffset
    } else if (node.nodeName === 'achmage_edit') {
      if (!node.sourceCodeLocation) {
        throw new Error('sourceCodeLocation is undefined')
      }
      const startOffset = node.sourceCodeLocation.startOffset
      const endOffset = node.sourceCodeLocation.endOffset
      if (startOffset > lastEndOffset) {
        parsedResult.push({
          type: 'string',
          content: input.slice(lastEndOffset, startOffset),
        })
      }
      const op = node.attrs.find((attr) => attr.name === 'op')?.value ?? ''
      const readChild = (name: string): string | undefined => {
        const child = node.childNodes.find((c) => c.nodeName === name)
        if (!child || !('childNodes' in child)) return undefined
        const kids = child.childNodes
        if (kids.length === 0) return ''
        const s = kids[0].sourceCodeLocation?.startOffset
        const e = kids[kids.length - 1].sourceCodeLocation?.endOffset
        return s !== undefined && e !== undefined ? input.slice(s, e) : ''
      }
      parsedResult.push({
        type: 'achmage_edit',
        op,
        anchor: readChild('anchor')?.trim(),
        until: readChild('until')?.trim(),
        heading: readChild('heading')?.trim(),
        content: (readChild('content') ?? '').replace(/^\n|\n$/g, ''),
        complete: !!node.sourceCodeLocation.endTag,
      })
      lastEndOffset = endOffset
    } else if (node.nodeName === 'think') {
      if (!node.sourceCodeLocation) {
        throw new Error('sourceCodeLocation is undefined')
      }
      const startOffset = node.sourceCodeLocation.startOffset
      const endOffset = node.sourceCodeLocation.endOffset
      if (startOffset > lastEndOffset) {
        parsedResult.push({
          type: 'string',
          content: input.slice(lastEndOffset, startOffset),
        })
      }

      const children = node.childNodes
      if (children.length > 0) {
        const innerContentStartOffset =
          children[0].sourceCodeLocation?.startOffset
        const innerContentEndOffset =
          children[children.length - 1].sourceCodeLocation?.endOffset
        if (!innerContentStartOffset || !innerContentEndOffset) {
          throw new Error('sourceCodeLocation is undefined')
        }
        parsedResult.push({
          type: 'think',
          content: input.slice(innerContentStartOffset, innerContentEndOffset),
        })
      }
      lastEndOffset = endOffset
    }
  }
  if (lastEndOffset < input.length) {
    parsedResult.push({
      type: 'string',
      content: input.slice(lastEndOffset),
    })
  }

  /**
   * Remove a single leading/trailing newline from each block's content.
   *
   * Example input:
   * hello world
   * <smtcmp_block>
   * some content
   * </smtcmp_block>
   *
   * Becomes:
   * { type: 'string', content: 'hello world' }
   * { type: 'smtcmp_block', content: 'some content' }
   */
  parsedResult.forEach((block) => {
    block.content = block.content.replace(/^\n|\n$/g, '')
  })

  return parsedResult
}
