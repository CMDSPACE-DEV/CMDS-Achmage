import { sanitizeHTMLToDom } from 'obsidian'
import type { Mounted } from 'pele'

/** Owns one preview. Source edits never write to the vault. */
export class PelePreview {
  private mounted: Mounted | undefined
  private generation = 0
  private disposed = false

  constructor(
    private readonly element: HTMLElement,
    private readonly reportError: (message: string) => void,
  ) {}

  async show(source: string): Promise<void> {
    if (this.disposed) return
    const generation = ++this.generation
    this.mounted?.destroy()
    this.mounted = undefined
    this.element.replaceChildren()
    this.reportError('')
    if (!source.trim()) return
    if (source.length > 50_000) {
      this.reportError(
        'Diagram source exceeds the 50,000 character preview limit.',
      )
      return
    }
    try {
      const { mount } = await import('pele')
      if (this.disposed || generation !== this.generation) return
      this.mounted = mount(this.element, source, {
        sanitize: sanitizeHTMLToDom,
        links: false,
        images: false,
        limit: 50_000,
        outputLimit: 2_000_000,
        maxEdges: 500,
        zoom: { always: true, controls: true },
        onError: (error: unknown) => {
          if (!this.disposed && generation === this.generation) {
            this.reportError(
              error instanceof Error
                ? error.message
                : 'Unable to render this diagram.',
            )
          }
        },
      })
    } catch (error) {
      if (!this.disposed && generation === this.generation) {
        this.reportError(
          error instanceof Error
            ? error.message
            : 'Unable to load the diagram preview.',
        )
      }
    }
  }

  destroy(): void {
    this.disposed = true
    this.generation++
    this.mounted?.destroy()
    this.mounted = undefined
    this.element.replaceChildren()
  }
}
