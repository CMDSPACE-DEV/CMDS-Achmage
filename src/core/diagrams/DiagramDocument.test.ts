import { App, TFile } from 'obsidian'

import {
  createDiagramDocument,
  newLayout,
  readDiagramDocument,
  saveDiagramDocument,
  updateDiagramDocument,
} from './DiagramDocument'

const source = 'flowchart LR\n A[한국어] --> B'
test('round trips source and coordinates without rewriting surrounding note bytes', () => {
  const layout = newLayout(source)
  layout.positions.A = { x: 12, y: 34 }
  const original =
    '---\ntags: [원본]\n---\n' +
    createDiagramDocument(source, layout) +
    '\n유지할 본문'
  const doc = readDiagramDocument(original)
  expect(doc.source).toBe(source)
  expect(doc.layout.positions.A).toEqual({ x: 12, y: 34 })
  const updated = updateDiagramDocument(
    doc,
    source.replace('한국어', '수정'),
    layout,
  )
  expect(updated.startsWith('---\ntags: [원본]\n---\n')).toBe(true)
  expect(updated.endsWith('\n유지할 본문')).toBe(true)
  expect(readDiagramDocument(updated).staleLayout).toBe(false)
})
test('detects stale layout and rejects unrelated notes', () => {
  const text = createDiagramDocument(source).replace('한국어', '외부수정')
  expect(readDiagramDocument(text).staleLayout).toBe(true)
  expect(() => readDiagramDocument('ordinary note')).toThrow()
  expect(() => createDiagramDocument('')).toThrow()
})
test('compares the snapshot inside the atomic vault operation', async () => {
  const snapshot = createDiagramDocument(source)
  const doc = readDiagramDocument(snapshot)
  const process = jest.fn(async (_file, transform: (text: string) => string) =>
    transform(snapshot + 'external'),
  )
  await expect(
    saveDiagramDocument(
      { vault: { process } } as unknown as App,
      {} as TFile,
      doc,
      source,
      doc.layout,
    ),
  ).rejects.toThrow('changed outside')
  expect(process).toHaveBeenCalledTimes(1)
})
