import { createHash } from 'crypto'

import { App, TFile, normalizePath } from 'obsidian'
import { v4 as uuid } from 'uuid'
import { z } from 'zod'

const layoutSchema = z.object({
  version: z.literal(1),
  documentId: z.string().uuid(),
  sourceHash: z.string(),
  positions: z.record(
    z.object({ x: z.number().finite(), y: z.number().finite() }),
  ),
})
export type DiagramLayout = z.infer<typeof layoutSchema>
export type DiagramDocument = {
  source: string
  layout: DiagramLayout
  snapshot: string
  sourceRange: [number, number]
  layoutRange: [number, number]
  staleLayout: boolean
}
export function sourceHash(source: string): string {
  return createHash('sha256').update(source).digest('hex')
}
export function newLayout(source: string): DiagramLayout {
  return {
    version: 1,
    documentId: uuid(),
    sourceHash: sourceHash(source),
    positions: {},
  }
}
function safeSource(source: string): void {
  if (
    !source.trim() ||
    source.length > 50_000 ||
    /^\s*(?:`{3}|~{3})/m.test(source)
  ) {
    throw new Error(
      'Enter a non-empty diagram without Markdown fences (maximum 50,000 characters).',
    )
  }
}
export function createDiagramDocument(
  source: string,
  layout = newLayout(source),
): string {
  safeSource(source)
  const metadata = layoutSchema.parse({
    ...layout,
    sourceHash: sourceHash(source),
  })
  return [
    '# Diagram',
    '',
    '```mermaid',
    source,
    '```',
    '',
    '```achmage-diagram-layout',
    JSON.stringify(metadata, null, 2),
    '```',
    '',
  ].join('\n')
}
export function readDiagramDocument(snapshot: string): DiagramDocument {
  const blocks = [
    ...snapshot.matchAll(
      /^```(mermaid|achmage-diagram-layout)\r?\n([\s\S]*?)^```[ \t]*(?=\r?$)/gm,
    ),
  ]
  const diagrams = blocks.filter((b) => b[1] === 'mermaid')
  const layouts = blocks.filter((b) => b[1] === 'achmage-diagram-layout')
  if (diagrams.length !== 1 || layouts.length !== 1) {
    throw new Error(
      'Open a CMDS diagram document containing exactly one diagram and layout block.',
    )
  }
  const range = (block: RegExpMatchArray): [number, number] => {
    const start = (block.index ?? 0) + block[0].indexOf('\n') + 1
    return [start, start + block[2].length]
  }
  const source = diagrams[0][2].replace(/\r?\n$/, '')
  safeSource(source)
  const layout = layoutSchema.parse(JSON.parse(layouts[0][2]))
  return {
    source,
    layout,
    snapshot,
    sourceRange: range(diagrams[0]),
    layoutRange: range(layouts[0]),
    staleLayout: layout.sourceHash !== sourceHash(source),
  }
}
export function updateDiagramDocument(
  doc: DiagramDocument,
  source: string,
  layout: DiagramLayout,
): string {
  safeSource(source)
  const eol = doc.snapshot.includes('\r\n') ? '\r\n' : '\n'
  const metadata = layoutSchema.parse({
    ...layout,
    sourceHash: sourceHash(source),
  })
  const changes = [
    { range: doc.sourceRange, text: source + eol },
    {
      range: doc.layoutRange,
      text: JSON.stringify(metadata, null, 2).replace(/\n/g, eol) + eol,
    },
  ].sort((a, b) => b.range[0] - a.range[0])
  return changes.reduce(
    (text, change) =>
      text.slice(0, change.range[0]) +
      change.text +
      text.slice(change.range[1]),
    doc.snapshot,
  )
}
export async function saveDiagramDocument(
  app: App,
  file: TFile,
  doc: DiagramDocument,
  source: string,
  layout: DiagramLayout,
): Promise<string> {
  const next = updateDiagramDocument(doc, source, layout)
  await app.vault.process(file, (current) => {
    if (current !== doc.snapshot)
      throw new Error(
        'The file changed outside this editor. Reopen it before saving.',
      )
    return next
  })
  return next
}
export async function createDiagramFile(
  app: App,
  folder: string,
  name: string,
  source: string,
  layout?: DiagramLayout,
): Promise<TFile> {
  const base = name.trim().replace(/\.md$/i, '')
  if (
    !base ||
    /[\\/:*?"<>|]/.test(base) ||
    [...base].some((character) => character.charCodeAt(0) < 32) ||
    base === '.' ||
    base === '..' ||
    /[. ]$/.test(base)
  ) {
    throw new Error('Enter a filename without a path or reserved characters.')
  }
  if (/^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(base))
    throw new Error('Reserved filename.')
  const directory = folder.trim().replace(/^\/+|\/+$/g, '')
  if (directory.split(/[\\/]/).some((part) => part === '..' || part === '.'))
    throw new Error('Invalid output folder.')
  const path = normalizePath((directory ? directory + '/' : '') + base + '.md')
  const segments = directory ? directory.split('/') : []
  for (let i = 1; i <= segments.length; i++) {
    const parent = segments.slice(0, i).join('/')
    if (!app.vault.getAbstractFileByPath(parent))
      await app.vault.createFolder(parent)
  }
  // Vault.create refuses collisions; never overwrite a file or Excalidraw document.
  return app.vault.create(path, createDiagramDocument(source, layout))
}
