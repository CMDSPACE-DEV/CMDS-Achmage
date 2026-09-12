export function getDocumentLineRange(metadata: unknown): {
  startLine: number
  endLine: number
} {
  const loc =
    metadata && typeof metadata === 'object' && 'loc' in metadata
      ? metadata.loc
      : undefined
  const lines =
    loc && typeof loc === 'object' && 'lines' in loc ? loc.lines : undefined
  const from =
    lines && typeof lines === 'object' && 'from' in lines
      ? lines.from
      : undefined
  const to =
    lines && typeof lines === 'object' && 'to' in lines ? lines.to : undefined
  const startLine = typeof from === 'number' ? from : 1
  const endLine = typeof to === 'number' ? to : startLine
  return { startLine, endLine }
}
