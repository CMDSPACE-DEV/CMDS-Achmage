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
            slug: 'gpt-6.2-nova',
            display_name: 'GPT-6.2-Nova',
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
      available: ['gpt-5.6-sol', 'gpt-6.2-nova'],
    })
    expect(setSettings).toHaveBeenCalledTimes(1)
    expect(
      current().chatModels.find(
        (model) =>
          model.providerType === 'openai-plan' &&
          model.model === 'gpt-6.2-nova',
      ),
    ).toMatchObject({ id: 'gpt-6.2-nova (plan)', enable: true })
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
