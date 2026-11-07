import assert from 'node:assert/strict'
import { parse, render, detectType } from 'pele'
import { diagramAdapters } from '../src/core/diagrams/adapters'
import { DiagramEditor, entities } from '../src/core/diagrams/DiagramEditor'

const results: { type: string; checks: number }[] = []
const failures: string[] = []
const semanticJson = (source: string) => JSON.stringify(parse(source), (_key, value: unknown) =>
  value instanceof Map ? [...value.entries()] : value instanceof Set ? [...value] : value)
for (const adapter of diagramAdapters) {
  try {
    const original = adapter.sample
    assert.equal(detectType(original), adapter.id)
    parse(original)
    assert.match(render(original, { links: false, images: false }).svg, /<svg/)
    const items = entities(original, adapter)
    assert.ok(items.length > 0, 'sample must expose editable semantic fields')
    const editor = new DiagramEditor({ source: original, positions: {} }, adapter, (source) => { parse(source) })
    const first = editor.items[0]
    const value = (adapter as typeof adapter & { editValue: string }).editValue
    const beforeModel = semanticJson(original)
    editor.field(first.id, 0, value)
    assert.notEqual(editor.state.source, original)
    assert.notEqual(semanticJson(editor.state.source), beforeModel)
    render(editor.state.source, { links: false, images: false })
    editor.undo()
    assert.equal(editor.state.source, original)
    editor.redo()
    assert.notEqual(editor.state.source, original)
    editor.undo()
    editor.move(first.id, { x: 30, y: 40 })
    assert.equal(editor.state.source, original)
    assert.deepEqual(editor.state.positions[first.id], { x: 30, y: 40 })
    editor.undo()
    assert.deepEqual(editor.state.positions, {})
    for (let i = 0; i < adapter.additions.length; i++) {
      const insertion = new DiagramEditor({ source: original, positions: {} }, adapter, (source) => { parse(source) })
      insertion.add(i)
      assert.notEqual(insertion.state.source, original)
      render(insertion.state.source, { links: false, images: false })
      insertion.undo()
      assert.equal(insertion.state.source, original)
    }
    results.push({ type: adapter.id, checks: 11 + adapter.additions.length * 3 })
  } catch (error) {
    failures.push(adapter.id + ': ' + (error instanceof Error ? error.message : String(error)))
  }
}
console.log(JSON.stringify({ results, failures }, null, 2))
if (failures.length) process.exitCode = 1
