import { createHash } from 'crypto'

export type Field = { group: number; label: string; numeric?: boolean }
export type Rule = {
  name: string
  pattern: string
  fields: Field[]
  keyGroup?: number
}
export type Adapter = {
  id: string
  title: string
  sample: string
  rules: Rule[]
  additions: { label: string; source: string }[]
  limitations: string
}
export type Entity = {
  id: string
  kind: string
  start: number
  end: number
  raw: string
  fields: {
    label: string
    value: string
    from: number
    to: number
    numeric: boolean
  }[]
}
export type Position = { x: number; y: number }
export type EditorState = {
  source: string
  positions: Record<string, Position>
}

function hash(value: string): string {
  return createHash('sha256').update(value).digest('hex').slice(0, 16)
}
/** Rules capture every byte in ordered, non-nested groups. Unknown lines are untouched. */
export function entities(source: string, adapter: Adapter): Entity[] {
  const found: Entity[] = []
  const occurrences = new Map<string, number>()
  let start = 0
  for (const line of source.split('\n')) {
    const raw = line.replace(/\r$/, '')
    for (const rule of adapter.rules) {
      const match = new RegExp(rule.pattern).exec(raw)
      if (!match) continue
      if (match[0] !== raw || match.slice(1).join('') !== raw)
        throw new Error('Adapter must capture every source byte: ' + rule.name)
      // offset of capture 1 is zero, subsequent offsets are sums of previous captures.
      const fieldOffset = (group: number) =>
        match.slice(1, group).join('').length
      const key =
        rule.name + ':' + (rule.keyGroup ? match[rule.keyGroup] : hash(raw))
      const occurrence = occurrences.get(key) ?? 0
      occurrences.set(key, occurrence + 1)
      found.push({
        id: key + ':' + String(occurrence),
        kind: rule.name,
        start,
        end: start + raw.length,
        raw,
        fields: rule.fields.map((field) => ({
          label: field.label,
          value: match[field.group],
          from: start + fieldOffset(field.group),
          to: start + fieldOffset(field.group) + match[field.group].length,
          numeric: field.numeric ?? false,
        })),
      })
      break
    }
    start += line.length + 1
  }
  return found
}

function copy(state: EditorState): EditorState {
  return {
    source: state.source,
    positions: Object.fromEntries(
      Object.entries(state.positions).map(([key, value]) => [
        key,
        { ...value },
      ]),
    ),
  }
}
export class DiagramEditor {
  private history: EditorState[]
  private index = 0
  constructor(
    state: EditorState,
    readonly adapter: Adapter,
    private readonly validate: (source: string) => void,
  ) {
    validate(state.source)
    this.history = [copy(state)]
  }
  get state(): EditorState {
    return copy(this.history[this.index])
  }
  get items(): Entity[] {
    return entities(this.state.source, this.adapter)
  }
  get canUndo(): boolean {
    return this.index > 0
  }
  get canRedo(): boolean {
    return this.index < this.history.length - 1
  }
  undo(): void {
    if (this.canUndo) this.index--
  }
  redo(): void {
    if (this.canRedo) this.index++
  }
  private commit(next: EditorState): void {
    if (next.source.length > 50_000)
      throw new Error('Diagram source is too large.')
    this.validate(next.source)
    if (JSON.stringify(next) === JSON.stringify(this.history[this.index]))
      return
    this.history = this.history.slice(0, this.index + 1)
    this.history.push(copy(next))
    if (this.history.length > 101) this.history.shift()
    this.index = this.history.length - 1
  }
  setSource(source: string): void {
    const state = this.state
    const ids = new Set(entities(source, this.adapter).map((e) => e.id))
    this.commit({
      source,
      positions: Object.fromEntries(
        Object.entries(state.positions).filter(([id]) => ids.has(id)),
      ),
    })
  }
  field(id: string, fieldIndex: number, value: string): void {
    const items = this.items
    const itemIndex = items.findIndex((e) => e.id === id)
    const entity = items[itemIndex]
    const field = entity?.fields[fieldIndex]
    if (!field || /[\r\n]/.test(value)) throw new Error('Invalid field edit.')
    if (field.numeric && (!value.trim() || !Number.isFinite(Number(value))))
      throw new Error('Enter a finite number.')
    const state = this.state
    const source =
      state.source.slice(0, field.from) + value + state.source.slice(field.to)
    const after = entities(source, this.adapter)
    if (after.length !== items.length || after[itemIndex]?.kind !== entity.kind)
      throw new Error(
        'This edit changes the statement structure. Use source editing.',
      )
    const positions = { ...state.positions }
    if (positions[id] && after[itemIndex].id !== id) {
      positions[after[itemIndex].id] = positions[id]
      delete positions[id]
    }
    this.commit({ source, positions })
  }
  move(id: string, position: Position): void {
    if (
      !this.items.some((e) => e.id === id) ||
      !Number.isFinite(position.x) ||
      !Number.isFinite(position.y)
    )
      throw new Error('Invalid position.')
    this.commit({
      ...this.state,
      positions: {
        ...this.state.positions,
        [id]: {
          x: Math.max(0, Math.min(4000, position.x)),
          y: Math.max(0, Math.min(4000, position.y)),
        },
      },
    })
  }
  remove(id: string): void {
    const item = this.items.find((e) => e.id === id)
    if (!item) return
    const { source } = this.state
    let end = item.end
    if (source[end] === '\r') end++
    if (source[end] === '\n') end++
    this.setSource(source.slice(0, item.start) + source.slice(end))
  }
  add(index: number): void {
    const template = this.adapter.additions[index]
    if (!template) throw new Error('Unknown insertion.')
    let serial = 1
    while (this.state.source.includes('item' + String(serial))) serial++
    this.setSource(
      this.state.source.trimEnd() +
        '\n' +
        template.source.replace(/\$id/g, 'item' + String(serial)) +
        '\n',
    )
  }
  reorder(id: string, direction: -1 | 1): void {
    const state = this.state
    const lines = state.source.split('\n')
    const item = this.items.find((e) => e.id === id)
    if (!item) return
    const row = state.source.slice(0, item.start).split('\n').length - 1
    const other = row + direction
    if (
      other < 1 ||
      other >= lines.length ||
      !lines[other].trim() ||
      lines[other].trim().startsWith('%%')
    )
      return
    const next = [...lines]
    ;[next[row], next[other]] = [next[other], next[row]]
    this.setSource(next.join('\n'))
  }
  indent(id: string, amount: number): void {
    const state = this.state
    const item = this.items.find((e) => e.id === id)
    if (!item) return
    const lines = state.source.split('\n')
    const row = state.source.slice(0, item.start).split('\n').length - 1
    const level = lines[row].match(/^\s*/)?.[0].length ?? 0
    let end = row + 1
    while (
      end < lines.length &&
      (lines[end].match(/^\s*/)?.[0].length ?? 0) > level
    )
      end++
    for (let i = row; i < end; i++) {
      lines[i] = amount > 0 ? '  ' + lines[i] : lines[i].replace(/^ {1,2}/, '')
    }
    this.setSource(lines.join('\n'))
  }
}
