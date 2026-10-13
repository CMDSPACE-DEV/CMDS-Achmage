import { migrateFrom31To32 } from './31_to_32'

describe('migrateFrom31To32', () => {
  it('inserts the current API flagships once and keeps user entries untouched', () => {
    const userOpus = {
      providerType: 'anthropic',
      providerId: 'anthropic',
      id: 'claude-opus-5.5',
      model: 'claude-opus-5-5',
      enable: false,
    }
    const result = migrateFrom31To32({
      version: 31,
      chatModels: [userOpus],
    })
    const chatModels = result.chatModels as Record<string, unknown>[]

    expect(result.version).toBe(32)
    expect(
      chatModels.filter((model) => model.id === 'claude-opus-5.5'),
    ).toEqual([userOpus])
    expect(chatModels.map((model) => model.id)).toEqual(
      expect.arrayContaining([
        'claude-sonnet-5.5',
        'gpt-6.1-sol',
        'gpt-6-luna',
        'gemini-3.1-pro-preview',
        'gemini-3.8-flash',
        'gemini-3.5-flash-lite',
      ]),
    )
    expect(migrateFrom31To32(result).chatModels).toEqual(chatModels)
  })

  it('disables the shut-down Gemini API model and moves selections off it', () => {
    const result = migrateFrom31To32({
      version: 31,
      chatModels: [
        {
          providerType: 'gemini',
          providerId: 'gemini',
          id: 'gemini-3-pro-preview',
          model: 'gemini-3-pro-preview',
        },
        {
          providerType: 'gemini-plan',
          providerId: 'gemini-plan',
          id: 'gemini-3-pro-preview (plan)',
          model: 'gemini-3-pro-preview',
          enable: false,
        },
      ],
      chatModelId: 'gemini-3-pro-preview',
      inlineEdit: { modelId: 'gemini-3-pro-preview' },
      imageAnalysis: { modelId: 'gemini-3-pro-preview (plan)' },
    })
    const chatModels = result.chatModels as Record<string, unknown>[]

    expect(
      chatModels.find((model) => model.id === 'gemini-3-pro-preview'),
    ).toMatchObject({ enable: false })
    expect(result.chatModelId).toBe('gemini-3.1-pro-preview')
    expect(result.inlineEdit).toEqual({ modelId: 'gemini-3.1-pro-preview' })
    // The Plan entry is runtime-owned (agy models) and left alone.
    expect(result.imageAnalysis).toEqual({
      modelId: 'gemini-3-pro-preview (plan)',
    })
  })

  it('does not add static OpenAI Plan entries that would pre-empt the runtime sync', () => {
    const result = migrateFrom31To32({ version: 31, chatModels: [] })
    const chatModels = result.chatModels as Record<string, unknown>[]

    expect(
      chatModels.filter((model) =>
        String(model.providerType).endsWith('-plan'),
      ),
    ).toEqual([])
  })

  it('only bumps the version when chat models are missing', () => {
    expect(migrateFrom31To32({ version: 31 })).toEqual({ version: 32 })
  })
})
