/** @jest-environment jsdom */

import '@testing-library/jest-dom'

import { act, fireEvent, render, screen } from '@testing-library/react'
import { SerializedEditorState } from 'lexical'

import { ChatUserMessage } from '../../types/chat'

import UserMessageItem from './UserMessageItem'

jest.mock('./chat-input/ChatUserInput', () => ({
  __esModule: true,
  default: () => null,
}))
jest.mock('./SimilaritySearchResults', () => ({
  __esModule: true,
  default: () => null,
}))

const text = (value: string) => ({
  detail: 0,
  format: 0,
  mode: 'normal',
  style: '',
  text: value,
  type: 'text',
  version: 1,
})

// A prompt as stored after sending: a mention node ("@name" text) followed by
// template-inserted text and a line break.
const content = {
  root: {
    children: [
      {
        children: [
          text('Summarize '),
          {
            ...text('@notes.md'),
            type: 'mention',
            mentionName: 'notes.md',
            mentionable: { type: 'file', file: 'notes.md' },
          },
          text(' using:'),
          { type: 'linebreak', version: 1 },
          text('Three bullet points.'),
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'paragraph',
        version: 1,
      },
    ],
    direction: 'ltr',
    format: '',
    indent: 0,
    type: 'root',
    version: 1,
  },
} as unknown as SerializedEditorState

const message = {
  role: 'user',
  id: 'user-1',
  content,
  promptContent: null,
  mentionables: [],
} as unknown as ChatUserMessage

describe('UserMessageItem copy button', () => {
  let writeText: jest.Mock

  beforeEach(() => {
    jest.useFakeTimers()
    writeText = jest.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    })
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  const renderItem = () =>
    render(
      <UserMessageItem
        message={message}
        chatUserInputRef={() => undefined}
        onSubmit={() => undefined}
        onFocus={() => undefined}
      />,
    )

  it('copies the readable prompt text and briefly shows a check', async () => {
    renderItem()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Copy message' }))
    })

    expect(writeText).toHaveBeenCalledWith(
      'Summarize @notes.md using:\nThree bullet points.',
    )
    expect(
      screen.getByRole('button', { name: 'Message copied' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Edit message' }),
    ).toBeInTheDocument()

    act(() => {
      jest.advanceTimersByTime(1500)
    })
    expect(
      screen.getByRole('button', { name: 'Copy message' }),
    ).toBeInTheDocument()
  })

  it('clears the pending reset timer on unmount', async () => {
    const { unmount } = renderItem()
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Copy message' }))
    })
    expect(jest.getTimerCount()).toBe(1)

    unmount()
    expect(jest.getTimerCount()).toBe(0)
  })
})
