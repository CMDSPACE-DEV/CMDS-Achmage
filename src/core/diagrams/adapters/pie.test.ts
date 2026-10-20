import { DiagramEditor, entities } from '../DiagramEditor'

import adapter from './pie'
test('pie exposes source ranges, edits semantic content and preserves untouched bytes', () => {
  const original = adapter.sample + '\n%% 보존할 설명'
  const editor = new DiagramEditor(
    { source: original, positions: {} },
    adapter,
    () => {},
  )
  const item = editor.items[0]
  expect(item).toBeDefined()
  editor.field(item.id, 0, adapter.editValue)
  expect(editor.state.source).not.toBe(original)
  expect(editor.state.source.endsWith('%% 보존할 설명')).toBe(true)
  editor.undo()
  expect(editor.state.source).toBe(original)
  editor.redo()
  expect(editor.state.source).not.toBe(original)
})
test('pie preserves identity for layout and supports insertion/removal history', () => {
  const editor = new DiagramEditor(
    { source: adapter.sample, positions: {} },
    adapter,
    () => {},
  )
  const id = editor.items[0].id
  editor.move(id, { x: 20, y: 40 })
  expect(editor.state.source).toBe(adapter.sample)
  expect(editor.state.positions[id]).toEqual({ x: 20, y: 40 })
  editor.add(0)
  expect(editor.state.source).not.toBe(adapter.sample)
  editor.undo()
  expect(editor.state.source).toBe(adapter.sample)
  editor.remove(id)
  expect(entities(editor.state.source, adapter).some((e) => e.id === id)).toBe(
    false,
  )
  editor.undo()
  expect(editor.state.source).toBe(adapter.sample)
})
