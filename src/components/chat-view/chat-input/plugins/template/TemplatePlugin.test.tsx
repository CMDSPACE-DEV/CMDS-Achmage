/** @jest-environment jsdom */

import '@testing-library/jest-dom'

import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { EditorRefPlugin } from '@lexical/react/LexicalEditorRefPlugin'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { act, render, screen } from '@testing-library/react'
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  COMMAND_PRIORITY_LOW,
  KEY_ENTER_COMMAND,
  LexicalEditor,
} from 'lexical'
import { createRef } from 'react'

import type { Template } from '../../../../../database/json/template/types'

import TemplatePlugin from './TemplatePlugin'

const mockSearchTemplates = jest.fn()
const mockManager = { searchTemplates: mockSearchTemplates }
jest.mock('../../../../../hooks/useJsonManagers', () => ({
  useTemplateManager: () => mockManager,
}))

beforeAll(() => {
  const rect = {
    x: 30,
    y: 30,
    left: 30,
    top: 30,
    right: 40,
    bottom: 50,
    width: 10,
    height: 20,
    toJSON: () => ({}),
  }
  Range.prototype.getBoundingClientRect = () => rect
  Range.prototype.getClientRects = () => [rect] as unknown as DOMRectList
  HTMLElement.prototype.setCssStyles = function (styles) {
    Object.assign(this.style, styles)
  }
  HTMLElement.prototype.scrollIntoView = jest.fn()
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
})

it('shows loading immediately, blocks premature Enter, and reports an empty result', async () => {
  let resolveSearch: (templates: Template[]) => void = () => undefined
  mockSearchTemplates.mockReturnValue(
    new Promise<Template[]>((resolve) => {
      resolveSearch = resolve
    }),
  )
  const editorRef = createRef<LexicalEditor>()
  const view = render(
    <LexicalComposer
      initialConfig={{
        namespace: 'template-test',
        onError: (error) => {
          throw error
        },
      }}
    >
      <RichTextPlugin
        contentEditable={<ContentEditable />}
        ErrorBoundary={LexicalErrorBoundary}
      />
      <EditorRefPlugin editorRef={editorRef} />
      <TemplatePlugin />
    </LexicalComposer>,
  )
  const editor = editorRef.current
  if (!editor) throw new Error('Editor did not mount')
  const send = jest.fn(() => true)
  const removeSend = editor.registerCommand(
    KEY_ENTER_COMMAND,
    send,
    COMMAND_PRIORITY_LOW,
  )
  await act(async () => {
    editor.update(
      () => {
        const text = $createTextNode('/')
        $getRoot().clear().append($createParagraphNode().append(text))
        text.selectEnd()
      },
      { discrete: true },
    )
  })
  expect(await screen.findByRole('status')).toHaveTextContent(
    'Loading templates...',
  )
  act(() => {
    editor.dispatchCommand(
      KEY_ENTER_COMMAND,
      new KeyboardEvent('keydown', { key: 'Enter' }),
    )
  })
  expect(send).not.toHaveBeenCalled()
  await act(async () => {
    resolveSearch([])
  })
  expect(screen.getByRole('status')).toHaveTextContent('No matching templates')
  removeSend()
  view.unmount()
})
