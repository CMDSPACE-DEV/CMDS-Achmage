/** @jest-environment jsdom */
import { EditorView } from '@codemirror/view'
import { App } from 'obsidian'

import { InlineEditWidget } from './InlineEditController'

// The DOM suite never invokes retrieval; avoid initializing its Node-only
// tracing dependency in jsdom.
jest.mock('langchain/text_splitter', () => ({
  RecursiveCharacterTextSplitter: jest.fn(),
}))

type Session = ConstructorParameters<typeof InlineEditWidget>[0]

function session(overrides: Partial<Session> = {}): Session {
  return {
    app: {} as App,
    id: 'test',
    from: 0,
    to: 4,
    insertAt: 4,
    ignoredInsertions: [],
    original: '원문',
    snapshot: '원문',
    filePath: 'note.md',
    targetLabel: 'Selection',
    status: 'preview',
    mode: 'replace',
    replacement: '수정된 원문',
    references: [],
    researchOptions: [],
    referenceScope: 'auto',
    referenceWarnings: [],
    referenceSources: [],
    getDraft: jest.fn(),
    updateDraft: jest.fn(),
    submit: jest.fn(),
    accept: jest.fn(),
    close: jest.fn(),
    renderMarkdown: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  }
}

function mount(doc: Document, state: Session) {
  Object.defineProperty(doc, 'win', {
    configurable: true,
    value: {
      createEl: (tag: string) => doc.createElement(tag),
      createDiv: () => doc.createElement('div'),
      createSpan: () => doc.createElement('span'),
    },
  })
  const widget = new InlineEditWidget(state)
  const host = widget.toDOM({ dom: doc.body } as EditorView)
  doc.body.append(host)
  return { widget, host }
}

describe('inline edit stylesheet integration', () => {
  afterEach(() => document.body.replaceChildren())

  it('mounts accessible preview and working actions in the stylesheet document', () => {
    const state = session()
    const { widget, host } = mount(document, state)
    expect(host.shadowRoot).toBeNull()
    expect(host.querySelector('style')).toBeNull()
    expect(host.querySelector('section')?.getAttribute('aria-label')).toBe(
      'CMDS Achmage inline edit',
    )
    const accept = Array.from(host.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Accept'),
    )
    accept?.click()
    expect(state.accept).toHaveBeenCalledTimes(1)
    host.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(state.close).toHaveBeenCalledTimes(1)
    widget.destroy()
  })

  it('uses the editor document when the editor is in another window', () => {
    const popout = document.implementation.createHTMLDocument('popout')
    const { widget, host } = mount(popout, session())
    expect(host.ownerDocument).toBe(popout)
    expect(host.querySelector('section')?.ownerDocument).toBe(popout)
    expect(host.querySelector('style')).toBeNull()
    widget.destroy()
  })

  it('updates appearance attributes and disconnects the observer on destroy', async () => {
    const { widget, host } = mount(document, session())
    const initial = host.dataset.skin
    document.body.setAttribute('data-ach-skin-mode', 'studio-console')
    document.body.classList.add('theme-dark')
    await Promise.resolve()
    expect(host.dataset.skin).toBe('cmds-dark')
    widget.destroy()
    document.body.classList.remove('theme-dark')
    document.body.removeAttribute('data-ach-skin-mode')
    await Promise.resolve()
    expect(host.dataset.skin).toBe('cmds-dark')
    expect(initial).toBeDefined()
  })
})
