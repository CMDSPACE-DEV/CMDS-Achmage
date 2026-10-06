import { migrateFrom31To32 } from './31_to_32'

type Model = Record<string, unknown> & { id: string; providerType: string }

function ids(models: unknown): string[] {
  return (models as Model[]).map((model) => model.id)
}

function find(models: unknown, id: string): Model | undefined {
  return (models as Model[]).find((model) => model.id === id)
}

const V31_MODELS: Model[] = [
  {
    providerType: 'anthropic-plan',
    providerId: 'anthropic-plan',
    id: 'claude-opus-latest (plan)',
    model: 'opus',
  },
  {
    providerType: 'anthropic-plan',
    providerId: 'anthropic-plan',
    id: 'claude-sonnet-latest (plan)',
    model: 'sonnet',
  },
  {
    providerType: 'anthropic-plan',
    providerId: 'anthropic-plan',
    id: 'claude-opus-4.8 (plan)',
    model: 'claude-opus-4-8',
    enable: false,
  },
  {
    providerType: 'anthropic-plan',
    providerId: 'anthropic-plan',
    id: 'claude-sonnet-5 (plan)',
    model: 'claude-sonnet-5',
    enable: false,
  },
  {
    providerType: 'openai-plan',
    providerId: 'openai-plan',
    id: 'gpt-5.6-sol (plan)',
    model: 'gpt-5.6-sol',
  },
  {
    providerType: 'gemini-plan',
    providerId: 'gemini-plan',
    id: 'gemini-3-pro-preview (plan)',
    model: 'gemini-3-pro-preview',
    enable: false,
  },
  {
    providerType: 'openai',
    providerId: 'openai',
    id: 'o4-mini',
    model: 'o4-mini',
  },
  {
    providerType: 'gemini',
    providerId: 'gemini',
    id: 'gemini-3-pro-preview',
    model: 'gemini-3-pro-preview',
  },
  {
    providerType: 'xai',
    providerId: 'xai',
    id: 'grok-4-1-fast',
    model: 'grok-4-1-fast',
  },
  {
    providerType: 'deepseek',
    providerId: 'deepseek',
    id: 'deepseek-chat',
    model: 'deepseek-chat',
  },
]

describe('migrateFrom31To32', () => {
  it('replaces retired built-in models and points selections at their successors', () => {
    const result = migrateFrom31To32({
      version: 31,
      chatModels: V31_MODELS,
      chatModelId: 'claude-sonnet-5 (plan)',
      inlineEdit: { modelId: 'o4-mini', contextCharacters: 4000 },
      imageAnalysis: { modelId: 'gemini-3-pro-preview' },
      imageGeneration: { modelId: 'gpt-5.6-sol (plan)', quality: 'high' },
    })

    expect(result.version).toBe(32)
    for (const retired of [
      'claude-opus-4.8 (plan)',
      'claude-sonnet-5 (plan)',
      'gemini-3-pro-preview (plan)',
      'o4-mini',
      'gemini-3-pro-preview',
      'grok-4-1-fast',
      'deepseek-chat',
    ]) {
      expect(ids(result.chatModels)).not.toContain(retired)
    }
    // The removed entries ran the family alias; the alias entries keep it.
    expect(result.chatModelId).toBe('claude-sonnet-latest (plan)')
    expect(result.inlineEdit).toEqual({
      modelId: 'gpt-6-luna',
      contextCharacters: 4000,
    })
    expect(result.imageAnalysis).toEqual({ modelId: 'gemini-3.1-pro-preview' })
    expect(result.imageGeneration).toEqual({
      modelId: 'gpt-5.6-sol (plan)',
      quality: 'high',
    })
  })

  it('inserts the new models next to their provider type without duplicates', () => {
    const result = migrateFrom31To32({
      version: 31,
      chatModels: [
        ...V31_MODELS,
        {
          providerType: 'openai-plan',
          providerId: 'openai-plan',
          id: 'gpt-6.1-sol (plan)',
          model: 'gpt-6.1-sol',
          enable: false,
        },
      ],
    })
    const order = ids(result.chatModels)

    expect(order.slice(0, 5)).toEqual([
      'claude-opus-latest (plan)',
      'claude-sonnet-latest (plan)',
      'claude-opus-5.5 (plan)',
      'claude-sonnet-5.5 (plan)',
      'claude-fable-5.1 (plan)',
    ])
    expect(order.filter((id) => id === 'gpt-6.1-sol (plan)')).toHaveLength(1)
    // A user's own entry keeps its settings.
    expect(find(result.chatModels, 'gpt-6.1-sol (plan)')?.enable).toBe(false)
    for (const added of [
      'gemini-3.1-pro-high (plan)',
      'gemini-3.8-flash-medium (plan)',
      'claude-sonnet-5.5',
      'gpt-6.1-sol',
      'gemini-3.8-flash',
      'deepseek-flash',
      'grok-4.3',
    ]) {
      expect(order).toContain(added)
    }
  })

  it('keeps a retired Claude Plan entry, folded, when its alias entry is gone', () => {
    const result = migrateFrom31To32({
      version: 31,
      chatModels: V31_MODELS.filter(
        (model) => model.id !== 'claude-sonnet-latest (plan)',
      ),
      chatModelId: 'claude-sonnet-5 (plan)',
    })

    expect(find(result.chatModels, 'claude-sonnet-5 (plan)')?.model).toBe(
      'sonnet',
    )
    expect(result.chatModelId).toBe('claude-sonnet-5 (plan)')
  })

  it('keeps the alias behavior of custom Claude Plan entries', () => {
    const result = migrateFrom31To32({
      version: 31,
      chatModels: [
        {
          providerType: 'anthropic-plan',
          providerId: 'anthropic-plan',
          id: 'my sonnet',
          model: 'claude-sonnet-4-6',
        },
        {
          providerType: 'anthropic-plan',
          providerId: 'anthropic-plan',
          id: 'my pinned opus',
          model: 'claude-opus-5-5',
        },
      ],
    })

    expect(find(result.chatModels, 'my sonnet')?.model).toBe('sonnet')
    // Even an exact pinned ID ran the alias before 32.
    expect(find(result.chatModels, 'my pinned opus')?.model).toBe('opus')
    // The pinned built-ins this migration inserts stay pinned.
    expect(find(result.chatModels, 'claude-opus-5.5 (plan)')?.model).toBe(
      'claude-opus-5-5',
    )
  })

  it('leaves a custom model that only shares a retired id', () => {
    const custom = {
      providerType: 'openai-compatible',
      providerId: 'my-gateway',
      id: 'o4-mini',
      model: 'o4-mini',
    }
    const result = migrateFrom31To32({
      version: 31,
      chatModels: [custom],
      chatModelId: 'o4-mini',
    })

    expect(find(result.chatModels, 'o4-mini')).toEqual(custom)
    // The selected model still exists, so the selection stays.
    expect(result.chatModelId).toBe('o4-mini')
  })

  it('replaces GPT Plan efforts the model does not accept', () => {
    const plan = (id: string, model: string, effort: string) => ({
      providerType: 'openai-plan',
      providerId: 'openai-plan',
      id,
      model,
      reasoning: { reasoning_effort: effort, reasoning_summary: 'auto' },
    })
    const result = migrateFrom31To32({
      version: 31,
      chatModels: [
        plan('gpt-6-astra (plan)', 'gpt-6-astra', 'none'),
        plan('my sol', 'gpt-6.1-sol', 'minimal'),
        plan('gpt-5.6-luna (plan)', 'gpt-5.6-luna', 'none'),
        plan('custom codex', 'gpt-7-preview', 'minimal'),
      ],
    })

    expect(find(result.chatModels, 'gpt-6-astra (plan)')?.reasoning).toEqual({
      reasoning_effort: 'low',
      reasoning_summary: 'auto',
    })
    expect(find(result.chatModels, 'my sol')?.reasoning).toMatchObject({
      reasoning_effort: 'low',
    })
    expect(
      find(result.chatModels, 'gpt-5.6-luna (plan)')?.reasoning,
    ).toMatchObject({ reasoning_effort: 'none' })
    expect(find(result.chatModels, 'custom codex')?.reasoning).toMatchObject({
      reasoning_effort: 'minimal',
    })
  })

  it('moves Gemini 2.5 Flash Image entries to Gemini 3.1 Flash Image', () => {
    const result = migrateFrom31To32({
      version: 31,
      chatModels: [
        {
          providerType: 'gemini',
          providerId: 'gemini',
          id: 'my-image',
          model: 'gemini-2.5-flash-image',
        },
      ],
    })

    expect(find(result.chatModels, 'my-image')?.model).toBe(
      'gemini-3.1-flash-image',
    )
  })

  it('replaces the shut-down Gemini embedding model', () => {
    const result = migrateFrom31To32({
      version: 31,
      embeddingModels: [
        {
          providerType: 'openai',
          providerId: 'openai',
          id: 'openai/text-embedding-3-small',
          model: 'text-embedding-3-small',
          dimension: 1536,
        },
        {
          providerType: 'gemini',
          providerId: 'gemini',
          id: 'gemini/text-embedding-004',
          model: 'text-embedding-004',
          dimension: 768,
        },
      ],
      embeddingModelId: 'gemini/text-embedding-004',
    })

    expect(ids(result.embeddingModels)).toEqual([
      'openai/text-embedding-3-small',
      'gemini/gemini-embedding-2',
    ])
    expect(
      find(result.embeddingModels, 'gemini/gemini-embedding-2'),
    ).toMatchObject({
      model: 'gemini-embedding-2',
      dimension: 768,
      outputDimension: 768,
    })
    expect(result.embeddingModelId).toBe('gemini/gemini-embedding-2')
  })

  it('is stable when run again and tolerates missing sections', () => {
    const once = migrateFrom31To32({ version: 31, chatModels: V31_MODELS })
    const twice = migrateFrom31To32({ ...once, version: 31 })

    expect(twice).toEqual(once)
    expect(migrateFrom31To32({ version: 31 })).toMatchObject({ version: 32 })
  })
})
