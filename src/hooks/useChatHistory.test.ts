/** @jest-environment jsdom */

import { act, renderHook } from '@testing-library/react'
import { Notice } from 'obsidian'

import { useChatHistory } from './useChatHistory'

jest.mock('obsidian', () => ({ Notice: jest.fn() }))
// ts-jest has no esModuleInterop; expose the real CJS debounce as a default.
jest.mock('lodash.debounce', () => ({
  __esModule: true,
  default: jest.requireActual('lodash.debounce'),
}))
jest.mock('lodash.isequal', () => ({
  __esModule: true,
  default: jest.requireActual('lodash.isequal'),
}))

const chatManager = {
  listChats: jest.fn(async () => []),
  findById: jest.fn(async () => null),
  createChat: jest.fn(async () => {
    throw new Error('disk full')
  }),
  updateChat: jest.fn(),
}
jest.mock('../contexts/app-context', () => ({ useApp: () => ({}) }))
jest.mock('./useJsonManagers', () => ({ useChatManager: () => chatManager }))

describe('useChatHistory', () => {
  beforeEach(() => jest.useFakeTimers())
  afterEach(() => jest.useRealTimers())

  it('shows the save-failure Notice once, when the debounced save fails', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation()
    const { result } = renderHook(() => useChatHistory())

    await act(async () => {
      void result.current.createOrUpdateConversation('chat-1', [])
      void result.current.createOrUpdateConversation('chat-1', [])
      await jest.advanceTimersByTimeAsync(1000)
    })
    await act(async () => {
      void result.current.createOrUpdateConversation('chat-1', [])
      await Promise.resolve()
    })

    expect(chatManager.createChat).toHaveBeenCalledTimes(1)
    expect(Notice).toHaveBeenCalledTimes(1)
    expect(Notice).toHaveBeenCalledWith('Failed to save chat history')
    expect(consoleError).toHaveBeenCalledWith(
      'Failed to save chat history',
      expect.any(Error),
    )
    consoleError.mockRestore()
  })
})
