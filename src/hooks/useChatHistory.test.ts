/** @jest-environment jsdom */

import { act, renderHook } from '@testing-library/react'
import { Notice } from 'obsidian'

import { useChatHistory } from './useChatHistory'

jest.mock('obsidian', () => ({ Notice: jest.fn() }))

const chatManager = {
  listChats: jest.fn(async () => []),
  findById: jest.fn(async () => null),
  createChat: jest.fn(async (): Promise<void> => {
    throw new Error('disk full')
  }),
  updateChat: jest.fn(),
}
jest.mock('../contexts/app-context', () => ({ useApp: () => ({}) }))
jest.mock('./useJsonManagers', () => ({ useChatManager: () => chatManager }))

describe('useChatHistory', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })
  afterEach(() => jest.useRealTimers())

  it('saves the latest call only after 300ms of quiet', async () => {
    chatManager.createChat.mockResolvedValueOnce(undefined)
    const { result } = renderHook(() => useChatHistory())
    await act(async () => {
      void result.current.createOrUpdateConversation('first', [])
      await jest.advanceTimersByTimeAsync(200)
      void result.current.createOrUpdateConversation('latest', [])
      await jest.advanceTimersByTimeAsync(299)
    })
    expect(chatManager.createChat).not.toHaveBeenCalled()
    await act(async () => {
      await jest.advanceTimersByTimeAsync(1)
    })
    expect(chatManager.createChat).toHaveBeenCalledTimes(1)
    expect(chatManager.createChat).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'latest', messages: [] }),
    )
    expect(Notice).not.toHaveBeenCalled()
  })

  it('persists continuous changes at the 1000ms limit, then saves a fresh burst', async () => {
    chatManager.createChat
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined)
    const { result } = renderHook(() => useChatHistory())
    await act(async () => {
      for (let i = 0; i < 5; i++) {
        void result.current.createOrUpdateConversation(`chat-${i}`, [])
        await jest.advanceTimersByTimeAsync(200)
      }
    })
    expect(chatManager.createChat).toHaveBeenCalledTimes(1)
    expect(chatManager.createChat).toHaveBeenLastCalledWith(
      expect.objectContaining({ id: 'chat-4' }),
    )
    await act(async () => {
      void result.current.createOrUpdateConversation('after-limit', [])
      await jest.advanceTimersByTimeAsync(300)
    })
    expect(chatManager.createChat).toHaveBeenCalledTimes(2)
    expect(chatManager.createChat).toHaveBeenLastCalledWith(
      expect.objectContaining({ id: 'after-limit' }),
    )
    expect(Notice).not.toHaveBeenCalled()
  })

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
