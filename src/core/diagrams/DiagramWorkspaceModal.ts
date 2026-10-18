import { Modal, Notice, TFile } from 'obsidian'
import { detectType, parse } from 'pele'

import type SmartComposerPlugin from '../../main'

import { diagramAdapters } from './adapters'
import {
  DiagramProposal,
  acceptProposal,
  proposeWithCurrentModel,
} from './DiagramAi'
import {
  DiagramDocument,
  createDiagramFile,
  newLayout,
  readDiagramDocument,
  saveDiagramDocument,
} from './DiagramDocument'
import { DiagramEditor, Position } from './DiagramEditor'
import { PelePreview } from './PelePreview'

export class DiagramWorkspaceModal extends Modal {
  private editor: DiagramEditor | undefined
  private preview: PelePreview | undefined
  private request: AbortController | undefined
  private proposal: DiagramProposal | undefined
  private doc: DiagramDocument | undefined
  private layout = newLayout('')
  private closed = false
  private saving = false
  private message = ''
  private selected = ''
  private filename = 'Diagram'
  private prompt = ''
  private sourceDraft = ''
  constructor(
    private readonly plugin: SmartComposerPlugin,
    private file?: TFile,
  ) {
    super(plugin.app)
  }
  onOpen(): void {
    this.closed = false
    this.setTitle('Diagram editor')
    void this.initialize().catch((error: unknown) => this.fail(error))
  }
  private async initialize(): Promise<void> {
    let source =
      diagramAdapters[0]?.sample ?? 'flowchart LR\n A[Start] --> B[Finish]'
    if (this.file) {
      this.doc = readDiagramDocument(await this.app.vault.read(this.file))
      source = this.doc.source
      this.layout = this.doc.layout
      if (this.doc.staleLayout)
        this.message =
          'Source changed outside the editor. Old positions are not applied; saving reconciles the layout.'
    }
    if (this.closed) return
    this.load(source, this.doc?.staleLayout ? {} : this.layout.positions)
    this.paint()
  }
  private load(source: string, positions: Record<string, Position> = {}): void {
    const type = detectType(source)
    const adapter = diagramAdapters.find((entry) => entry.id === type) ?? {
      id: type ?? 'unknown',
      title: type ?? 'Diagram',
      sample: source,
      rules: [],
      additions: [],
      limitations:
        'No visual adapter is installed for this syntax. Source preview remains available.',
    }
    this.editor = new DiagramEditor({ source, positions }, adapter, (text) => {
      if (detectType(text) !== type)
        throw new Error('Use a new document to change diagram types.')
      parse(text, { limit: 50_000, maxEdges: 500 })
    })
    this.sourceDraft = source
  }
  private fail(error: unknown): void {
    if (this.closed) return
    this.message = error instanceof Error ? error.message : String(error)
    this.paint()
  }
  private act(action: () => void): void {
    try {
      action()
      this.message = ''
      this.sourceDraft = this.editor?.state.source ?? ''
      this.paint()
    } catch (error) {
      this.fail(error)
    }
  }
  private button(
    parent: HTMLElement,
    label: string,
    action: () => void,
    disabled = false,
  ): HTMLButtonElement {
    const button = parent.createEl('button', { text: label })
    button.disabled = disabled
    button.addEventListener('click', action)
    return button
  }
  private paint(): void {
    if (this.closed) return
    if (!this.editor) {
      this.contentEl.empty()
      this.contentEl.createEl('p', {
        text: this.message || 'Loading diagram…',
        attr: { role: 'status' },
      })
      return
    }
    const restoreFocus =
      this.contentEl.ownerDocument.activeElement?.getAttribute(
        'data-diagram-handle',
      )
    this.preview?.destroy()
    this.contentEl.empty()
    this.contentEl.addClass('smtcmp-diagram-editor')
    const editor = this.editor
    const state = editor.state
    this.contentEl.createEl('p', {
      text: this.message,
      attr: { role: 'status' },
    })
    this.contentEl.createEl('p', { text: editor.adapter.limitations })
    const toolbar = this.contentEl.createDiv({ cls: 'smtcmp-diagram-toolbar' })
    if (!this.file) {
      const types = toolbar.createEl('select', {
        attr: { 'aria-label': 'Diagram type' },
      })
      diagramAdapters.forEach((adapter) => {
        types.createEl('option', { text: adapter.title, value: adapter.id })
      })
      types.value = editor.adapter.id
      this.button(toolbar, 'Load sample (replaces unsaved diagram)', () => {
        const chosen = diagramAdapters.find(
          (adapter) => adapter.id === types.value,
        )
        if (chosen)
          this.act(() => {
            this.load(chosen.sample)
            this.proposal = undefined
          })
      })
    }
    this.button(
      toolbar,
      'Undo',
      () => this.act(() => editor.undo()),
      !editor.canUndo,
    )
    this.button(
      toolbar,
      'Redo',
      () => this.act(() => editor.redo()),
      !editor.canRedo,
    )
    if (!this.file) {
      const name = toolbar.createEl('input', {
        attr: { 'aria-label': 'Diagram filename' },
      })
      name.value = this.filename
      name.addEventListener('input', () => {
        this.filename = name.value
      })
    }
    this.button(
      toolbar,
      this.file ? 'Save changes' : 'Save new diagram',
      () => {
        void this.save()
      },
      this.saving,
    )
    const source = this.contentEl.createEl('textarea', {
      attr: { 'aria-label': 'Mermaid source', spellcheck: 'false' },
    })
    source.value = this.sourceDraft
    source.addEventListener('input', () => {
      this.sourceDraft = source.value
    })
    this.button(this.contentEl, 'Apply source and preview', () =>
      this.act(() => editor.setSource(this.sourceDraft)),
    )
    const ai = this.contentEl.createDiv({ cls: 'smtcmp-diagram-toolbar' })
    const prompt = ai.createEl('input', {
      attr: {
        'aria-label': 'AI diagram request',
        placeholder: 'Describe a diagram or revision',
      },
    })
    prompt.value = this.prompt
    prompt.addEventListener('input', () => {
      this.prompt = prompt.value
    })
    this.button(
      ai,
      'Generate proposal',
      () => {
        void this.generate()
      },
      !!this.request,
    )
    if (this.request)
      this.button(ai, 'Cancel generation', () => {
        this.request?.abort()
        this.request = undefined
        this.paint()
      })
    if (this.proposal) {
      this.contentEl.createEl('pre', { text: this.proposal.source })
      this.button(ai, 'Accept proposal', () =>
        this.act(() => {
          if (!this.proposal) return
          const next = acceptProposal(this.proposal, editor.state.source)
          if (!this.file && detectType(next) !== editor.adapter.id)
            this.load(next)
          else editor.setSource(next)
          this.proposal = undefined
        }),
      )
      this.button(ai, 'Discard proposal', () => {
        this.proposal = undefined
        this.paint()
      })
    }
    const insert = this.contentEl.createDiv({ cls: 'smtcmp-diagram-toolbar' })
    editor.adapter.additions.forEach((addition, index) =>
      this.button(insert, 'Add ' + addition.label, () =>
        this.act(() => editor.add(index)),
      ),
    )
    this.contentEl.createEl('p', {
      text: 'Authoring board: drag a card or use arrow keys to move it. Fields change Mermaid content; card positions are saved separately from Pele automatic layout.',
    })
    const board = this.contentEl.createDiv({ cls: 'smtcmp-diagram-board' })
    editor.items.forEach((item, index) => {
      const position = state.positions[item.id] ?? {
        x: (index % 3) * 255,
        y: Math.floor(index / 3) * 360,
      }
      const card = board.createDiv({ cls: 'smtcmp-diagram-card' })
      card.dataset.selected = String(this.selected === item.id)
      const place = (point: Position) => {
        card.style.setProperty('--diagram-x', String(point.x) + 'px')
        card.style.setProperty('--diagram-y', String(point.y) + 'px')
      }
      place(position)
      const handle = card.createEl('button', {
        text: item.kind,
        attr: { 'aria-label': 'Move ' + item.kind },
      })
      handle.setAttribute('data-diagram-handle', item.id)
      if (restoreFocus === item.id) handle.focus()
      handle.addEventListener('focus', () => {
        this.selected = item.id
      })
      let gesture:
        | { pointer: number; x: number; y: number; next: Position }
        | undefined
      const cancel = () => {
        if (!gesture) return
        const pointer = gesture.pointer
        gesture = undefined
        if (handle.hasPointerCapture(pointer))
          handle.releasePointerCapture(pointer)
        place(position)
      }
      handle.addEventListener('pointerdown', (event) => {
        if (event.button !== 0) return
        this.selected = item.id
        gesture = {
          pointer: event.pointerId,
          x: event.clientX,
          y: event.clientY,
          next: position,
        }
        handle.setPointerCapture(event.pointerId)
      })
      handle.addEventListener('pointermove', (event) => {
        if (!gesture || gesture.pointer !== event.pointerId) return
        gesture.next = {
          x: Math.max(0, position.x + event.clientX - gesture.x),
          y: Math.max(0, position.y + event.clientY - gesture.y),
        }
        place(gesture.next)
      })
      handle.addEventListener('pointerup', () => {
        if (!gesture) return
        const next = gesture.next
        cancel()
        this.act(() => editor.move(item.id, next))
      })
      handle.addEventListener('pointercancel', cancel)
      handle.addEventListener('lostpointercapture', cancel)
      handle.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
          event.preventDefault()
          event.stopPropagation()
          cancel()
          return
        }
        const offset: Record<string, Position> = {
          ArrowLeft: { x: -10, y: 0 },
          ArrowRight: { x: 10, y: 0 },
          ArrowUp: { x: 0, y: -10 },
          ArrowDown: { x: 0, y: 10 },
        }
        const delta = offset[event.key]
        if (!delta) return
        event.preventDefault()
        this.act(() =>
          editor.move(item.id, {
            x: position.x + delta.x,
            y: position.y + delta.y,
          }),
        )
      })
      item.fields.forEach((field, fieldIndex) => {
        const label = card.createEl('label', { text: field.label })
        const input = label.createEl('input', {
          type: field.numeric ? 'number' : 'text',
        })
        input.value = field.value
        input.addEventListener('change', () =>
          this.act(() => editor.field(item.id, fieldIndex, input.value)),
        )
        const values = field.numeric
          ? [Number(field.value)]
          : field.label === 'Values' &&
              /^\s*-?\d+(?:\.\d+)?(?:\s*,\s*-?\d+(?:\.\d+)?)*\s*$/.test(
                field.value,
              )
            ? field.value.split(',').map(Number)
            : []
        values.forEach((value, valueIndex) => {
          const slider = label.createEl('input', {
            type: 'range',
            attr: { 'aria-label': field.label + ' ' + String(valueIndex + 1) },
          })
          const bounded = ['X', 'Y', 'Visibility', 'Evolution'].includes(
            field.label,
          )
          slider.min = bounded ? '0' : String(Math.min(0, value * 2))
          slider.max = bounded ? '1' : String(Math.max(10, value * 2))
          slider.step =
            field.label.includes('bit') || field.label === 'Score' ? '1' : '0.1'
          slider.value = String(value)
          slider.addEventListener('change', () => {
            const next = [...values]
            next[valueIndex] = Number(slider.value)
            this.act(() => editor.field(item.id, fieldIndex, next.join(', ')))
          })
        })
      })
      this.button(card, 'Earlier', () =>
        this.act(() => editor.reorder(item.id, -1)),
      )
      this.button(card, 'Later', () =>
        this.act(() => editor.reorder(item.id, 1)),
      )
      this.button(card, 'Indent', () =>
        this.act(() => editor.indent(item.id, 2)),
      )
      this.button(card, 'Outdent', () =>
        this.act(() => editor.indent(item.id, -2)),
      )
      this.button(card, 'Remove statement', () =>
        this.act(() => editor.remove(item.id)),
      )
    })
    const canvas = this.contentEl.createDiv({ cls: 'smtcmp-pele-canvas' })
    this.preview = new PelePreview(canvas, (message) => {
      if (message && !this.closed) new Notice(message)
    })
    void this.preview.show(this.proposal?.source ?? state.source)
  }
  private async generate(): Promise<void> {
    if (!this.editor || this.request) return
    const controller = new AbortController()
    this.request = controller
    const source = this.editor.state.source
    this.paint()
    try {
      const proposal = await proposeWithCurrentModel(
        this.plugin,
        this.prompt,
        source,
        controller.signal,
      )
      if (!this.closed && this.request === controller) this.proposal = proposal
    } catch (error) {
      if (!controller.signal.aborted && !this.closed)
        this.message = error instanceof Error ? error.message : String(error)
    } finally {
      if (this.request === controller) this.request = undefined
      this.paint()
    }
  }
  private async save(): Promise<void> {
    if (!this.editor || this.saving) return
    if (this.sourceDraft !== this.editor.state.source) {
      this.message = 'Apply or undo your source text changes before saving.'
      this.paint()
      return
    }
    this.saving = true
    const state = this.editor.state
    const layout = { ...this.layout, positions: state.positions }
    this.paint()
    try {
      if (this.file && this.doc) {
        const snapshot = await saveDiagramDocument(
          this.app,
          this.file,
          this.doc,
          state.source,
          layout,
        )
        this.doc = readDiagramDocument(snapshot)
      } else {
        this.file = await createDiagramFile(
          this.app,
          this.plugin.settings.artifacts.outputFolder,
          this.filename,
          state.source,
          layout,
        )
        this.doc = readDiagramDocument(await this.app.vault.read(this.file))
      }
      this.layout = this.doc.layout
      this.message = 'Saved ' + this.file.path
    } catch (error) {
      this.message = error instanceof Error ? error.message : String(error)
    } finally {
      this.saving = false
      this.paint()
    }
  }
  onClose(): void {
    this.closed = true
    this.request?.abort()
    this.request = undefined
    this.preview?.destroy()
    this.contentEl.empty()
  }
}
