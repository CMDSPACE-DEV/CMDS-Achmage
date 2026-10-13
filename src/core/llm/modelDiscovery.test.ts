import type { ChatModel } from '../../types/chat-model.types'

import {
  CODEX_CATALOG_CLIENT_VERSION,
  CODEX_MODELS_ENDPOINT,
  JsonGetter,
  fetchApiProviderModels,
  fetchCodexPlanModels,
  isChatCandidate,
  mergeDiscoveredModels,
  parseCodexModels,
} from './modelDiscovery'

// Shape taken from openai/codex `codex-rs/models-manager/models.json` at
// 7219fd7 (2026-09-30), trimmed to the fields the parser reads.
const CODEX_CATALOG = {
  models: [
    {
      slug: 'gpt-6.1-sol',
      display_name: 'GPT-6.1-Sol',
      visibility: 'list',
      default_reasoning_level: 'low',
    },
    {
      slug: 'gpt-6-astra',
      display_name: 'GPT-6-Astra',
      visibility: 'list',
      default_reasoning_level: 'low',
    },
    {
      slug: 'gpt-6-luna',
      display_name: 'GPT-6-Luna',
      visibility: 'list',
      default_reasoning_level: 'medium',
    },
    {
      slug: 'gpt-daybreak-red-latest',
      display_name: 'Daybreak Red',
      visibility: 'hide',
    },
    {
      slug: 'future-model',
      visibility: 'list',
      default_reasoning_level: 'ultra',
    },
  ],
}

describe('Codex Plan catalog', () => {
  it('requests the account catalog with the current client version', async () => {
    const getJson = jest.fn<ReturnType<JsonGetter>, Parameters<JsonGetter>>(
      async () => CODEX_CATALOG,
    )
    await fetchCodexPlanModels({ authorization: 'Bearer t' }, getJson)

    expect(getJson).toHaveBeenCalledWith(
      `${CODEX_MODELS_ENDPOINT}?client_version=${CODEX_CATALOG_CLIENT_VERSION}`,
      { authorization: 'Bearer t' },
    )
  })

  it('keeps only picker-visible models and drops unknown efforts', () => {
    expect(parseCodexModels(CODEX_CATALOG)).toEqual([
      { id: 'gpt-6.1-sol', label: 'GPT-6.1-Sol', defaultEffort: 'low' },
      { id: 'gpt-6-astra', label: 'GPT-6-Astra', defaultEffort: 'low' },
      { id: 'gpt-6-luna', label: 'GPT-6-Luna', defaultEffort: 'medium' },
      { id: 'future-model', label: 'future-model', defaultEffort: undefined },
    ])
  })

  it('fails loudly on an unexpected response shape', () => {
    expect(() => parseCodexModels({ data: [] })).toThrow('no models array')
  })
})

describe('mergeDiscoveredModels', () => {
  const existing: ChatModel[] = [
    {
      providerType: 'openai-plan',
      providerId: 'openai-plan',
      id: 'gpt-6-astra (plan)',
      model: 'gpt-6-astra',
      enable: false,
    },
  ]

  it('adds missing Plan models enabled with their default effort', () => {
    const { chatModels, added } = mergeDiscoveredModels(
      existing,
      'openai-plan',
      'openai-plan',
      parseCodexModels(CODEX_CATALOG),
    )

    expect(added.map((model) => model.id)).toEqual([
      'gpt-6.1-sol (plan)',
      'gpt-6-luna (plan)',
      'future-model (plan)',
    ])
    expect(added[0]).toEqual({
      providerType: 'openai-plan',
      providerId: 'openai-plan',
      id: 'gpt-6.1-sol (plan)',
      model: 'gpt-6.1-sol',
      enable: true,
      reasoning: { reasoning_effort: 'low' },
    })
    // A model the user disabled stays disabled.
    expect(chatModels[0]).toBe(existing[0])
  })

  it('returns the same array when nothing is new', () => {
    const result = mergeDiscoveredModels(
      existing,
      'openai-plan',
      'openai-plan',
      [{ id: 'gpt-6-astra', label: 'GPT-6-Astra' }],
    )
    expect(result.chatModels).toBe(existing)
    expect(result.added).toEqual([])
  })

  it('never reuses a display id that is already taken', () => {
    const taken: ChatModel[] = [
      {
        providerType: 'openai',
        providerId: 'my-proxy',
        id: 'gpt-6-luna',
        model: 'something-else',
      },
    ]
    const { added } = mergeDiscoveredModels(taken, 'openai', 'openai', [
      { id: 'gpt-6-luna', label: 'gpt-6-luna' },
    ])
    expect(added[0].id).toBe('gpt-6-luna 2')
  })
})

describe('API provider discovery', () => {
  it('filters OpenAI to chat models and skips dated snapshots', async () => {
    const getJson: JsonGetter = async () => ({
      data: [
        { id: 'gpt-6.1-sol' },
        { id: 'gpt-6.1-sol-2026-09-29' },
        { id: 'text-embedding-3-large' },
        { id: 'gpt-realtime-mini' },
        { id: 'gpt-image-2' },
        { id: 'o5-mini' },
        { id: 'dall-e-3' },
      ],
    })
    const models = await fetchApiProviderModels('openai', 'sk-test', getJson)
    expect(models.map((model) => model.id)).toEqual(['gpt-6.1-sol', 'o5-mini'])
  })

  it('sends the Gemini key in a header, not the URL', async () => {
    const getJson = jest.fn<ReturnType<JsonGetter>, Parameters<JsonGetter>>(
      async () => ({
        models: [
          {
            name: 'models/gemini-3.8-flash',
            displayName: 'Gemini 3.8 Flash',
            supportedGenerationMethods: ['generateContent'],
          },
          {
            name: 'models/gemini-embedding-002',
            supportedGenerationMethods: ['embedContent'],
          },
        ],
      }),
    )
    const models = await fetchApiProviderModels('gemini', 'g-key', getJson)

    expect(models).toEqual([
      { id: 'gemini-3.8-flash', label: 'Gemini 3.8 Flash' },
    ])
    const [url, headers] = getJson.mock.calls[0]
    expect(url).not.toContain('g-key')
    expect(headers).toEqual({ 'x-goog-api-key': 'g-key' })
  })

  it('reads Anthropic display names and honors a custom base URL', async () => {
    const getJson = jest.fn<ReturnType<JsonGetter>, Parameters<JsonGetter>>(
      async () => ({
        data: [{ id: 'claude-opus-5-5', display_name: 'Claude Opus 5.5' }],
      }),
    )
    const models = await fetchApiProviderModels(
      'anthropic',
      'a-key',
      getJson,
      'https://proxy.example/',
    )

    expect(models).toEqual([
      { id: 'claude-opus-5-5', label: 'Claude Opus 5.5' },
    ])
    expect(getJson.mock.calls[0][0]).toBe(
      'https://proxy.example/v1/models?limit=1000',
    )
  })

  it.each([
    ['gemini', 'gemini-3.1-pro-preview-customtools', false],
    ['gemini', 'gemini-3.8-live', false],
    ['gemini', 'gemini-3.1-pro-preview', true],
    ['anthropic', 'claude-sonnet-5-5', true],
    ['openai', 'gpt-5.6-cyber', false],
  ] as const)('%s %s chat candidate: %s', (provider, id, expected) => {
    expect(isChatCandidate(provider, id)).toBe(expected)
  })
})
