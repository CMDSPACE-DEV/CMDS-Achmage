import { Adapter, DiagramEditor, entities } from './DiagramEditor'
const adapter: Adapter = {
  id: 'test',
  title: 'Test',
  sample: 'graph\n A[Hello]\n B[World]',
  rules: [
    {
      name: 'node',
      pattern: '^(\\s*)(\\w+)(\\[)([^\\]]+)(\\])$',
      keyGroup: 2,
      fields: [{ group: 4, label: 'Label' }],
    },
  ],
  additions: [{ label: 'node', source: ' $id[New]' }],
  limitations: '',
}
const validate = (text: string) => {
  if (text.includes('INVALID')) throw new Error('Invalid syntax')
}
test('changes a field without losing comments or unknown statements and supports history', () => {
  const source = adapter.sample + '\n%% 한국어 comment\nunknown untouched'
  const editor = new DiagramEditor({ source, positions: {} }, adapter, validate)
  const id = editor.items[0].id
  editor.field(id, 0, '수정')
  expect(editor.state.source).toContain('A[수정]')
  expect(editor.state.source).toContain('%% 한국어 comment\nunknown untouched')
  editor.undo()
  expect(editor.state.source).toBe(source)
  editor.redo()
  expect(editor.state.source).toContain('수정')
  expect(() => editor.field(id, 0, 'INVALID')).toThrow()
  expect(editor.state.source).not.toContain('INVALID')
})
test('commits a pointer result once, preserves layout through undo, and rejects nonfinite values', () => {
  const editor = new DiagramEditor(
    { source: adapter.sample, positions: {} },
    adapter,
    validate,
  )
  const id = editor.items[0].id
  editor.move(id, { x: 30, y: 40 })
  expect(editor.state.positions[id]).toEqual({ x: 30, y: 40 })
  editor.undo()
  expect(editor.state.positions).toEqual({})
  editor.redo()
  expect(editor.state.positions[id].x).toBe(30)
  expect(() => editor.move(id, { x: NaN, y: 0 })).toThrow()
})
test('reorders, inserts and removes statements while preserving their identity', () => {
  const editor = new DiagramEditor(
    { source: adapter.sample, positions: {} },
    adapter,
    validate,
  )
  const id = editor.items[0].id
  editor.reorder(id, 1)
  expect(editor.items[1].id).toBe(id)
  editor.add(0)
  expect(editor.items).toHaveLength(3)
  editor.remove(id)
  expect(editor.items).toHaveLength(2)
  expect(entities(editor.state.source, adapter).map((e) => e.id)).not.toContain(
    id,
  )
})
