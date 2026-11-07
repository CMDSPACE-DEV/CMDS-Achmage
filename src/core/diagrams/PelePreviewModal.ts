import { App, Modal } from 'obsidian'

import { PelePreview } from './PelePreview'

export class PelePreviewModal extends Modal {
  private preview: PelePreview | undefined

  constructor(app: App) {
    super(app)
  }

  onOpen(): void {
    this.setTitle('Preview a diagram')
    const { contentEl } = this
    contentEl.addClass('smtcmp-pele-preview')
    contentEl.createEl('p', {
      text: 'Enter Mermaid source and preview it with Pele. This preview does not save a file.',
    })
    const source = contentEl.createEl('textarea', {
      attr: { 'aria-label': 'Mermaid source', spellcheck: 'false' },
    })
    source.value = 'flowchart LR\n  A[Idea] --> B[Diagram]'
    const render = contentEl.createEl('button', { text: 'Preview' })
    const error = contentEl.createEl('p', { attr: { role: 'status' } })
    const canvas = contentEl.createDiv({
      cls: 'smtcmp-pele-canvas',
      attr: { 'aria-label': 'Diagram preview' },
    })
    this.preview = new PelePreview(canvas, (message) => {
      error.textContent = message
    })
    render.addEventListener('click', () => {
      void this.preview?.show(source.value)
    })
    void this.preview.show(source.value)
  }

  onClose(): void {
    this.preview?.destroy()
    this.preview = undefined
    this.contentEl.empty()
  }
}
