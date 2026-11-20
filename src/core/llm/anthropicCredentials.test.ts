import Anthropic from '@anthropic-ai/sdk'

import { ChatModel } from '../../types/chat-model.types'

import { AnthropicProvider } from './anthropic'
import { LLMAPIKeyNotSetException } from './exception'

// R-065: with `apiKey: undefined` the SDK starts its credential-file chain in
// the constructor, and Obsidian's renderer blocks the chain's
// `import('node:path')` as a CORS request.
describe('AnthropicProvider without an API key', () => {
  const model = {
    providerType: 'anthropic',
    providerId: 'anthropic',
    id: 'claude-test',
    model: 'claude-test',
  } as ChatModel
  const request = { model: 'claude-test', messages: [] }
  const originalEnvKey = process.env.ANTHROPIC_API_KEY

  afterEach(() => {
    jest.restoreAllMocks()
    if (originalEnvKey === undefined) {
      delete process.env.ANTHROPIC_API_KEY
    } else {
      process.env.ANTHROPIC_API_KEY = originalEnvKey
    }
  })

  it('does not start the SDK credential-file chain', () => {
    const resolveDefaultCredentials = jest.spyOn(
      Anthropic.prototype as unknown as {
        _resolveDefaultCredentials: () => Promise<void>
      },
      '_resolveDefaultCredentials',
    )

    new AnthropicProvider({ type: 'anthropic', id: 'anthropic' })

    expect(resolveDefaultCredentials).not.toHaveBeenCalled()
  })

  it('reports the missing key instead of using ANTHROPIC_API_KEY', async () => {
    process.env.ANTHROPIC_API_KEY = 'env-key-must-not-be-used'
    const provider = new AnthropicProvider({
      type: 'anthropic',
      id: 'anthropic',
    })

    await expect(
      provider.generateResponse(model, request),
    ).rejects.toBeInstanceOf(LLMAPIKeyNotSetException)
    await expect(
      provider.streamResponse(model, { ...request, stream: true }),
    ).rejects.toBeInstanceOf(LLMAPIKeyNotSetException)
  })
})
