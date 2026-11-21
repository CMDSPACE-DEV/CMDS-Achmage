import type { SmartComposerSettings } from '../../settings/schema/setting.types'
import { parseSmartComposerSettings } from '../../settings/schema/settings'

import { JsonGetter } from './modelDiscovery'
import { syncOpenAIPlanModels } from './planModelSync'

function connectedSettings(): SmartComposerSettings {
  const settings = parseSmartComposerSettings({})
  return {
    ...settings,
    providers: settings.providers.map((provider) =>
      provider.type === 'openai-plan'
        ? {
            ...provider,
            oauth: {
              accessToken: 'access',
              refreshToken: 'refresh',
              expiresAt: Date.now() + 3_600_000,
              accountId: 'account',
            },
          }
        : provider,
    ),
  }
}

function harness(initial: SmartComposerSettings) {
  let current = initial
  const setSettings = jest.fn(async (next: SmartComposerSettings) => {
    current = next
  })
  return {
    access: { getSettings: () => current, setSettings },
    setSettings,
    current: () => current,
  }
}

describe('syncOpenAIPlanModels', () => {
  it('discovers version-gated GPT-6.2 models while preserving existing choices', async () => {
    // openai/codex rust-v0.171.0 models.json, blob 56e0f43cb66259e3b8d5a59d8ff12f41e1c8be06.
    // Both GPT-6.2 models require client 0.166.0; Terra requires 0.153.0.
    const models = [
      ['gpt-6.2-sol', '0.166.0'],
      ['gpt-6.2-astra', '0.166.0'],
      ['gpt-6.1-terra', '0.153.0'],
    ] as const
    const getJson: JsonGetter = async (url) => {
      const clientVersion =
        new URL(url).searchParams.get('client_version') ?? '0'
      return {
        models: models
          .filter(
            ([, minimum]) =>
              clientVersion.localeCompare(minimum, 'en', { numeric: true }) >=
              0,
          )
          .map(([slug]) => ({
            slug,
            visibility: 'list',
            default_reasoning_level: 'low',
          })),
      }
    }
    const initial = connectedSettings()
    initial.chatModelId = 'gpt-5.6-sol (plan)'
    const terra: (typeof initial.chatModels)[number] = {
      providerType: 'openai-plan',
      providerId: 'openai-plan',
      id: 'My Terra',
      model: 'gpt-6.1-terra',
      enable: false,
      reasoning: { reasoning_effort: 'high' },
    }
    initial.chatModels.push(terra)
    const { access, current, setSettings } = harness(initial)

    const result = await syncOpenAIPlanModels(access, getJson)

    expect(result).toMatchObject({
      status: 'synced',
      available: models.map(([slug]) => slug),
    })
    if (result.status !== 'synced') throw new Error('Expected a synced catalog')
    expect(result.added.map((model) => model.model)).toEqual([
      'gpt-6.2-sol',
      'gpt-6.2-astra',
    ])
    expect(
      result.added.every(
        (model) =>
          model.enable &&
          model.providerType === 'openai-plan' &&
          model.reasoning?.reasoning_effort === 'low',
      ),
    ).toBe(true)
    expect(current().chatModels.find((model) => model.id === terra.id)).toBe(
      terra,
    )
    expect(current().chatModelId).toBe(initial.chatModelId)

    await syncOpenAIPlanModels(access, getJson)
    expect(setSettings).toHaveBeenCalledTimes(1)
  })

  it('does nothing when OpenAI Plan is not connected', async () => {
    const getJson = jest.fn<ReturnType<JsonGetter>, Parameters<JsonGetter>>()
    const { access, setSettings } = harness(parseSmartComposerSettings({}))

    await expect(syncOpenAIPlanModels(access, getJson)).resolves.toEqual({
      status: 'not-connected',
    })
    expect(getJson).not.toHaveBeenCalled()
    expect(setSettings).not.toHaveBeenCalled()
  })

  it('adds account models with the stored bearer and account headers', async () => {
    const getJson = jest.fn<ReturnType<JsonGetter>, Parameters<JsonGetter>>(
      async () => ({
        models: [
          { slug: 'gpt-5.6-sol', visibility: 'list' },
          {
            slug: 'gpt-6.1-sol',
            display_name: 'GPT-6.1-Sol',
            visibility: 'list',
            default_reasoning_level: 'low',
          },
        ],
      }),
    )
    const { access, setSettings, current } = harness(connectedSettings())

    const result = await syncOpenAIPlanModels(access, getJson)

    expect(getJson.mock.calls[0][1]).toEqual({
      authorization: 'Bearer access',
      'ChatGPT-Account-Id': 'account',
    })
    expect(result).toMatchObject({
      status: 'synced',
      available: ['gpt-5.6-sol', 'gpt-6.1-sol'],
    })
    expect(setSettings).toHaveBeenCalledTimes(1)
    expect(
      current().chatModels.find(
        (model) =>
          model.providerType === 'openai-plan' && model.model === 'gpt-6.1-sol',
      ),
    ).toMatchObject({ id: 'gpt-6.1-sol (plan)', enable: true })
  })

  it('does not write settings when the catalog has nothing new', async () => {
    const getJson: JsonGetter = async () => ({
      models: [{ slug: 'gpt-5.6-sol', visibility: 'list' }],
    })
    const { access, setSettings } = harness(connectedSettings())

    await syncOpenAIPlanModels(access, getJson)

    expect(setSettings).not.toHaveBeenCalled()
  })
})
