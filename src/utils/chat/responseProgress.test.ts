import { ChatMessage } from '../../types/chat'
import { ToolCallResponseStatus } from '../../types/tool-call.types'

import {
  deriveResponseProgress,
  estimateTokens,
  formatElapsed,
  startResponseProgress,
} from './responseProgress'

describe('responseProgress', () => {
  it('estimates tokens differently for Latin and CJK text', () => {
    expect(estimateTokens('a'.repeat(400))).toBe(100)
    expect(estimateTokens('가'.repeat(150))).toBe(100)
    expect(estimateTokens('')).toBe(0)
  })

  it('moves connecting → thinking → writing and tracks phase timing', () => {
    let p = startResponseProgress('claude', 1000)
    p = deriveResponseProgress(
      p,
      [{ role: 'assistant', id: 'a', content: '', reasoning: 'hmm' }],
      2000,
    )
    expect(p.phase).toBe('thinking')
    expect(p.phaseSince).toBe(2000)
    p = deriveResponseProgress(
      p,
      [{ role: 'assistant', id: 'a', content: 'Hello', reasoning: 'hmm' }],
      3000,
    )
    expect(p.phase).toBe('writing')
    expect(p.phaseSince).toBe(3000)
    p = deriveResponseProgress(
      p,
      [{ role: 'assistant', id: 'a', content: 'Hello', reasoning: 'hmm' }],
      4000,
    )
    expect(p.phase).toBe('writing')
    expect(p.phaseSince).toBe(3000)
  })

  it('reports pending and finished tool calls', () => {
    const p0 = startResponseProgress('gpt', 0)
    const requested: ChatMessage[] = [
      {
        role: 'assistant',
        id: 'a',
        content: '',
        toolCallRequests: [{ id: 't1', name: 'search' }],
      },
    ]
    const p1 = deriveResponseProgress(p0, requested, 10)
    expect(p1.phase).toBe('tool')
    expect(p1.tools).toEqual([{ name: 'search', status: 'pending' }])
    const answered: ChatMessage[] = [
      ...requested,
      {
        role: 'tool',
        id: 'tm',
        toolCalls: [
          {
            request: { id: 't1', name: 'search' },
            response: {
              status: ToolCallResponseStatus.Success,
              data: { type: 'text', text: 'ok' },
            } as never,
          },
        ],
      },
    ]
    const p2 = deriveResponseProgress(p1, answered, 20)
    expect(p2.tools).toEqual([{ name: 'search', status: 'done' }])
    expect(p2.phase).toBe('thinking')
  })

  it('formats elapsed time', () => {
    expect(formatElapsed(4200)).toBe('4s')
    expect(formatElapsed(65_000)).toBe('1m 05s')
  })
})
