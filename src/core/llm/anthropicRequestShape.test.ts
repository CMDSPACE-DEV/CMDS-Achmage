import type { MessageStreamEvent } from '@anthropic-ai/sdk/resources/messages'

import { RequestMessage } from '../../types/llm/request'

import { AnthropicProvider } from './anthropic'
import {
  anthropicThinkingStyle,
  buildAnthropicReasoningParams,
  currentToolLoopStart,
  rejectsAnthropicSampling,
} from './anthropicRequestShape'

describe('Anthropic reasoning parameters', () => {
  it('maps each Claude model to the thinking style its API accepts', () => {
    expect(anthropicThinkingStyle('claude-opus-5-5')).toBe('adaptive')
    expect(anthropicThinkingStyle('claude-sonnet-5-5')).toBe('adaptive')
    expect(anthropicThinkingStyle('claude-opus-5')).toBe('adaptive')
    expect(anthropicThinkingStyle('claude-opus-4-8')).toBe('adaptive')
    expect(anthropicThinkingStyle('claude-sonnet-4-6')).toBe('adaptive')
    expect(anthropicThinkingStyle('claude-fable-5-1')).toBe('always-on')
    expect(anthropicThinkingStyle('claude-haiku-4-5')).toBe('budget')
    expect(anthropicThinkingStyle('claude-sonnet-4-5')).toBe('budget')
  })

  it('sends adaptive thinking with an explicit effort and no sampling on 5.x', () => {
    expect(
      buildAnthropicReasoningParams({
        model: 'claude-opus-5-5',
        thinking: { enabled: true, budget_tokens: 8192, effort: 'xhigh' },
        temperature: 0.7,
        topP: 0.9,
      }),
    ).toEqual({
      thinking: { type: 'adaptive' },
      output_config: { effort: 'xhigh' },
      max_tokens: 16_000,
    })
    expect(
      buildAnthropicReasoningParams({
        model: 'claude-sonnet-5-5',
        thinking: { enabled: true, budget_tokens: 8192 },
      }).output_config,
    ).toEqual({ effort: 'high' })
  })

  it('lowers effort instead of disabling thinking on the 5.5 models', () => {
    for (const model of ['claude-opus-5-5', 'claude-sonnet-5-5']) {
      expect(
        buildAnthropicReasoningParams({
          model,
          thinking: { enabled: false, budget_tokens: 8192 },
        }),
      ).toEqual({ output_config: { effort: 'low' }, max_tokens: 16_000 })
      expect(buildAnthropicReasoningParams({ model }).thinking).toBeUndefined()
    }
  })

  it('disables thinking explicitly on Opus 5 and Sonnet 5, which think by default', () => {
    const off = { enabled: false, budget_tokens: 1024 }
    expect(
      buildAnthropicReasoningParams({ model: 'claude-sonnet-5', thinking: off })
        .thinking,
    ).toEqual({ type: 'disabled' })
    expect(
      buildAnthropicReasoningParams({ model: 'claude-opus-4-8', thinking: off })
        .thinking,
    ).toBeUndefined()
  })

  it('leaves the model default when no thinking setting is saved', () => {
    for (const model of [
      'claude-opus-5-5',
      'claude-sonnet-5',
      'claude-fable-5-1',
    ]) {
      expect(
        buildAnthropicReasoningParams({ model, temperature: 0.2 }),
      ).toEqual({ max_tokens: 16_000 })
    }
    expect(
      buildAnthropicReasoningParams({
        model: 'claude-sonnet-4-6',
        temperature: 0.2,
      }),
    ).toEqual({ max_tokens: 16_000, temperature: 0.2, top_p: undefined })
  })

  it('lowers Fable effort when thinking is turned off', () => {
    expect(
      buildAnthropicReasoningParams({
        model: 'claude-fable-5-1',
        thinking: { enabled: false, budget_tokens: 1024 },
      }).output_config,
    ).toEqual({ effort: 'low' })
  })

  it('omits the thinking parameter on Fable and keeps a configured effort', () => {
    expect(
      buildAnthropicReasoningParams({
        model: 'claude-fable-5-1',
        thinking: { enabled: true, budget_tokens: 8192, effort: 'max' },
        temperature: 1,
      }),
    ).toEqual({ output_config: { effort: 'max' }, max_tokens: 16_000 })
    expect(
      buildAnthropicReasoningParams({ model: 'claude-fable-5-1' }),
    ).toEqual({ max_tokens: 16_000 })
  })

  it('caps Claude 4.6 at high effort and still sends its sampling parameters', () => {
    expect(
      buildAnthropicReasoningParams({
        model: 'claude-sonnet-4-6',
        thinking: { enabled: true, budget_tokens: 8192, effort: 'max' },
        temperature: 0.5,
      }),
    ).toEqual({
      thinking: { type: 'adaptive' },
      output_config: { effort: 'high' },
      max_tokens: 16_000,
      temperature: 0.5,
      top_p: undefined,
    })
  })

  it('keeps the budget request shape for Haiku 4.5', () => {
    expect(
      buildAnthropicReasoningParams({
        model: 'claude-haiku-4-5',
        thinking: { enabled: true, budget_tokens: 4096 },
        temperature: 1,
      }),
    ).toEqual({
      thinking: { type: 'enabled', budget_tokens: 4096 },
      max_tokens: 4096 + 8192,
      temperature: 1,
      top_p: undefined,
    })
    expect(
      buildAnthropicReasoningParams({
        model: 'claude-haiku-4-5',
        maxTokens: 300,
      }).max_tokens,
    ).toBe(300)
  })

  it('knows which models reject sampling parameters', () => {
    expect(rejectsAnthropicSampling('claude-opus-4-7')).toBe(true)
    expect(rejectsAnthropicSampling('claude-sonnet-5-5')).toBe(true)
    expect(rejectsAnthropicSampling('claude-fable-5-1')).toBe(true)
    expect(rejectsAnthropicSampling('claude-sonnet-4-6')).toBe(false)
    expect(rejectsAnthropicSampling('claude-haiku-4-5')).toBe(false)
  })
})

describe('Anthropic tool loop detection', () => {
  const roles = (...values: string[]) => values.map((role) => ({ role }))

  it('finds the loop after the last user turn, past appended instructions', () => {
    // Retrieval appends a user instruction after the tool results.
    expect(
      currentToolLoopStart(
        roles('user', 'assistant', 'user', 'assistant', 'tool', 'user'),
      ),
    ).toBe(3)
    expect(
      currentToolLoopStart(
        roles('user', 'assistant', 'tool', 'assistant', 'tool'),
      ),
    ).toBe(1)
  })

  it('treats a new user turn or a final answer as no loop in progress', () => {
    expect(currentToolLoopStart(roles('user', 'assistant', 'user'))).toBe(3)
    expect(
      currentToolLoopStart(
        roles('user', 'assistant', 'tool', 'assistant', 'user', 'user'),
      ),
    ).toBe(6)
    expect(currentToolLoopStart([])).toBe(0)
  })
})

describe('Anthropic history replay', () => {
  const thinkingBlock = {
    type: 'thinking' as const,
    thinking: 'reasoning',
    signature: 'signed',
  }

  it('drops thinking from earlier turns and keeps the current tool loop', () => {
    const messages: RequestMessage[] = [
      { role: 'user', content: 'First question' },
      {
        role: 'assistant',
        content: 'First answer',
        providerMetadata: { anthropic: { thinkingBlocks: [thinkingBlock] } },
      },
      { role: 'user', content: 'Second question' },
      {
        role: 'assistant',
        content: '',
        tool_calls: [{ id: 'tool-1', name: 'search', arguments: '{}' }],
        providerMetadata: { anthropic: { thinkingBlocks: [thinkingBlock] } },
      },
      {
        role: 'tool',
        tool_call: { id: 'tool-1', name: 'search', arguments: '{}' },
        content: 'result',
      },
    ]

    // Retrieval appends an instruction after the tool results.
    const parsed = AnthropicProvider.parseRequestMessages([
      ...messages,
      { role: 'user', content: 'Reference the markdown blocks by line.' },
    ])

    expect(parsed[1]).toEqual({
      role: 'assistant',
      content: [{ type: 'text', text: 'First answer' }],
    })
    expect(parsed[3].content).toEqual(
      expect.arrayContaining([expect.objectContaining({ type: 'thinking' })]),
    )
    expect(messages[1]).toMatchObject({
      providerMetadata: { anthropic: { thinkingBlocks: [thinkingBlock] } },
    })
  })
})

describe('Anthropic refusals', () => {
  it('reports a streamed refusal as an error', async () => {
    async function* events(): AsyncIterable<MessageStreamEvent> {
      yield {
        type: 'message_start',
        message: {
          id: 'message-1',
          model: 'claude-opus-5-5',
          usage: { input_tokens: 5, output_tokens: 0 },
        },
      } as unknown as MessageStreamEvent
      yield {
        type: 'message_delta',
        delta: { stop_reason: 'refusal', stop_sequence: null },
        usage: { output_tokens: 0 },
      } as unknown as MessageStreamEvent
    }

    const consume = async () => {
      for await (const _chunk of AnthropicProvider.streamResponseGenerator(
        events(),
      )) {
        // Drain the stream.
      }
    }

    await expect(consume()).rejects.toThrow(
      'Claude declined this request (stop_reason: refusal)',
    )
  })
})
