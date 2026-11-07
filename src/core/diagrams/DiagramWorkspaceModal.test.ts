/** @jest-environment jsdom */
import type SmartComposerPlugin from '../../main'

import { DiagramWorkspaceModal } from './DiagramWorkspaceModal'

jest.mock('obsidian', () => ({
  Modal: class {
    contentEl = document.createElement('div')
    constructor(public app: unknown) {}
    setTitle() {}
  },
  Notice: jest.fn(),
  normalizePath: (value: string) => value,
}))
jest.mock('pele', () => ({
  detectType: () => 'flowchart',
  parse: jest.fn(),
}))
jest.mock('./adapters', () => ({
  diagramAdapters: [
    {
      id: 'flowchart',
      title: 'Flowchart',
      sample: 'flowchart LR\n A[Start]',
      rules: [
        {
          name: 'node',
          pattern: '^(\\s*)(\\w+)(\\[)([^\\]]+)(\\])$',
          keyGroup: 2,
          fields: [{ group: 4, label: 'Label' }],
        },
      ],
      additions: [],
      limitations: 'Test fixture',
    },
  ],
}))
jest.mock('./PelePreview', () => ({
  PelePreview: class {
    show = jest.fn()
    destroy = jest.fn()
  },
}))

beforeAll(() => {
  Object.assign(HTMLElement.prototype, {
    createEl(
      this: HTMLElement,
      tag: string,
      options: Record<string, unknown> = {},
    ) {
      const element = document.createElement(tag)
      if (typeof options.text === 'string') element.textContent = options.text
      if (typeof options.cls === 'string') element.className = options.cls
      if (typeof options.type === 'string')
        element.setAttribute('type', options.type)
      if (typeof options.value === 'string')
        element.setAttribute('value', options.value)
      for (const [key, value] of Object.entries(
        (options.attr ?? {}) as Record<string, string>,
      ))
        element.setAttribute(key, value)
      this.append(element)
      return element
    },
    createDiv(this: HTMLElement, options: Record<string, unknown>) {
      return this.createEl('div', options)
    },
    empty(this: HTMLElement) {
      this.replaceChildren()
    },
    addClass(this: HTMLElement, value: string) {
      this.classList.add(value)
    },
    setPointerCapture() {},
    releasePointerCapture() {},
    hasPointerCapture() {
      return true
    },
  })
})
function open() {
  const modal = new DiagramWorkspaceModal({
    app: {},
    settings: { artifacts: { outputFolder: '' } },
  } as unknown as SmartComposerPlugin)
  document.body.append(modal.contentEl)
  modal.onOpen()
  return modal
}
function click(modal: DiagramWorkspaceModal, text: string) {
  Array.from(modal.contentEl.querySelectorAll('button'))
    .find((button) => button.textContent === text)
    ?.click()
}
function pointer(element: HTMLElement, type: string, x: number, y: number) {
  const event = new Event(type)
  Object.assign(event, { pointerId: 1, clientX: x, clientY: y, button: 0 })
  element.dispatchEvent(event)
}
afterEach(() => document.body.replaceChildren())
test('field editing updates source and undo restores it', () => {
  const modal = open()
  const original = modal.contentEl.querySelector('textarea')?.value
  const input = modal.contentEl.querySelector<HTMLInputElement>(
    '.smtcmp-diagram-card input',
  )!
  input.value = '변경'
  input.dispatchEvent(new Event('change'))
  expect(modal.contentEl.querySelector('textarea')?.value).toContain('변경')
  click(modal, 'Undo')
  expect(modal.contentEl.querySelector('textarea')?.value).toBe(original)
  modal.onClose()
  expect(modal.contentEl.childNodes).toHaveLength(0)
})
test('pointer cancel rolls back; pointer up commits one undo step; keyboard moves', () => {
  const modal = open()
  let handle = modal.contentEl.querySelector<HTMLElement>(
    '[data-diagram-handle]',
  )!
  pointer(handle, 'pointerdown', 0, 0)
  pointer(handle, 'pointermove', 25, 30)
  pointer(handle, 'pointercancel', 25, 30)
  expect(handle.parentElement?.style.getPropertyValue('--diagram-x')).toBe(
    '0px',
  )
  pointer(handle, 'pointerdown', 0, 0)
  pointer(handle, 'pointermove', 25, 30)
  pointer(handle, 'pointerup', 25, 30)
  expect(
    modal.contentEl
      .querySelector<HTMLElement>('.smtcmp-diagram-card')
      ?.style.getPropertyValue('--diagram-x'),
  ).toBe('25px')
  click(modal, 'Undo')
  expect(
    modal.contentEl
      .querySelector<HTMLElement>('.smtcmp-diagram-card')
      ?.style.getPropertyValue('--diagram-x'),
  ).toBe('0px')
  handle = modal.contentEl.querySelector<HTMLElement>('[data-diagram-handle]')!
  handle.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }))
  expect(
    modal.contentEl
      .querySelector<HTMLElement>('.smtcmp-diagram-card')
      ?.style.getPropertyValue('--diagram-x'),
  ).toBe('10px')
  modal.onClose()
})
