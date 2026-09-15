/** @jest-environment jsdom */

import '@testing-library/jest-dom'

import { act, fireEvent, render, screen } from '@testing-library/react'
import { App } from 'obsidian'

import CreateTemplatePopoverPlugin from './CreateTemplatePopoverPlugin'

let mockComposing = false
let mockInput: HTMLDivElement
const mockEditor = {
  isComposing: () => mockComposing,
  getRootElement: () => mockInput,
  registerCommand: jest.fn(() => () => undefined),
  registerTextContentListener: jest.fn(() => () => undefined),
}

jest.mock('@lexical/react/LexicalComposerContext', () => ({
  useLexicalComposerContext: () => [mockEditor],
}))
jest.mock('../../../../modals/TemplateFormModal', () => ({
  CreateTemplateModal: jest.fn(),
}))

function selectText() {
  const range = document.createRange()
  range.selectNodeContents(mockInput)
  const selection = document.getSelection()
  selection?.removeAllRanges()
  selection?.addRange(range)
  fireEvent(document, new Event('selectionchange'))
}

function setup(text: string) {
  const anchor = document.createElement('div')
  mockInput = document.createElement('div')
  mockInput.contentEditable = 'true'
  mockInput.textContent = text
  anchor.append(mockInput)
  document.body.append(anchor)
  const view = render(
    <CreateTemplatePopoverPlugin
      app={new App()}
      anchorElement={anchor}
      contentEditableElement={mockInput}
    />,
  )
  return {
    button: screen.getByText('Create template'),
    cleanup: () => {
      view.unmount()
      anchor.remove()
    },
  }
}

beforeEach(() => {
  mockComposing = false
  Range.prototype.getClientRects = jest.fn(
    () =>
      [
        { left: 10, right: 120, top: 10, bottom: 30, width: 110, height: 20 },
      ] as unknown as DOMRectList,
  )
})

it('does not mistake Korean IME composition or its committed range for a selection', () => {
  const { button, cleanup } = setup('한글 입력')
  mockComposing = true
  fireEvent.compositionStart(mockInput)
  act(selectText)
  expect(button).not.toBeVisible()
  mockComposing = false
  fireEvent.compositionEnd(mockInput)
  act(selectText)
  expect(button).not.toBeVisible()
  cleanup()
})

it.each(['한글 프롬프트', 'English prompt'])(
  'shows after dragging %s, then hides on new input',
  (text) => {
    const { button, cleanup } = setup(text)
    fireEvent.pointerDown(mockInput)
    act(selectText)
    expect(button).not.toBeVisible()
    fireEvent.pointerUp(document)
    expect(button).toBeVisible()
    fireEvent(mockInput, new InputEvent('beforeinput', { bubbles: true }))
    expect(button).not.toBeVisible()
    cleanup()
  },
)

it('supports keyboard selection without requiring a pointer drag', () => {
  const { button, cleanup } = setup('Keyboard selection')
  act(selectText)
  fireEvent.keyUp(mockInput, { key: 'ArrowLeft', shiftKey: true })
  expect(button).toBeVisible()
  act(() => {
    document.getSelection()?.collapseToEnd()
  })
  fireEvent(document, new Event('selectionchange'))
  expect(button).not.toBeVisible()
  cleanup()
})
