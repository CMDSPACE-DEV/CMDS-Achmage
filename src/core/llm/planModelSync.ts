import { PROVIDER_TYPES_INFO } from '../../constants'
import type { SmartComposerSettings } from '../../settings/schema/setting.types'
import type { ChatModel } from '../../types/chat-model.types'

import { getProviderClient } from './manager'
import { JsonGetter, mergeDiscoveredModels } from './modelDiscovery'
import { obsidianJsonGetter } from './obsidianJsonGetter'
import { OpenAICodexProvider } from './openaiCodexProvider'

const OPENAI_PLAN_PROVIDER_ID = PROVIDER_TYPES_INFO['openai-plan']
  .defaultProviderId as string

type SettingsAccess = {
  getSettings: () => SmartComposerSettings
  setSettings: (settings: SmartComposerSettings) => Promise<void>
}

export type PlanModelSyncResult =
  | { status: 'not-connected' }
  | { status: 'synced'; added: ChatModel[]; available: string[] }

/**
 * Pull the account's Codex catalog and add any model the picker lacks.
 * Claude Plan and Gemini Plan already track their runtimes (stable CLI aliases
 * and `agy models`); this closes the same gap for OpenAI Plan.
 */
export async function syncOpenAIPlanModels(
  access: SettingsAccess,
  getJson: JsonGetter = obsidianJsonGetter,
): Promise<PlanModelSyncResult> {
  const settings = access.getSettings()
  const provider = settings.providers.find(
    (item) =>
      item.id === OPENAI_PLAN_PROVIDER_ID && item.type === 'openai-plan',
  )
  if (!provider || provider.type !== 'openai-plan' || !provider.oauth) {
    return { status: 'not-connected' }
  }

  const client = getProviderClient({
    providerId: OPENAI_PLAN_PROVIDER_ID,
    settings,
    setSettings: access.setSettings,
  })
  if (!(client instanceof OpenAICodexProvider)) {
    return { status: 'not-connected' }
  }
  const discovered = await client.listPlanModels(getJson)

  // Merge against the settings as they are now: a token refresh or a user
  // edit may have landed while the request was in flight.
  const latest = access.getSettings()
  const { chatModels, added } = mergeDiscoveredModels(
    latest.chatModels,
    'openai-plan',
    OPENAI_PLAN_PROVIDER_ID,
    discovered,
  )
  if (added.length > 0) {
    await access.setSettings({ ...latest, chatModels })
  }
  return {
    status: 'synced',
    added,
    available: discovered.map((model) => model.id),
  }
}
