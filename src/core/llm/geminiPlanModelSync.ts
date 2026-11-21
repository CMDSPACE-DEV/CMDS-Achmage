import type { SmartComposerSettings } from '../../settings/schema/setting.types'
import type { ChatModel } from '../../types/chat-model.types'

import { NativeRuntimeService } from './native/NativeRuntimeService'
import { syncRuntimeModels } from './native/runtimeModelSync'

type SettingsAccess = {
  getSettings: () => SmartComposerSettings
  setSettings: (settings: SmartComposerSettings) => Promise<void>
}

export type GeminiPlanModelSyncResult =
  | { status: 'not-configured' | 'unavailable' }
  | { status: 'synced'; added: ChatModel[]; available: string[] }

/** Add only models returned by this device's authenticated Antigravity runtime. */
export async function syncGeminiPlanModels(
  access: SettingsAccess,
  service: Pick<NativeRuntimeService, 'diagnose'> = new NativeRuntimeService(),
  signal?: AbortSignal,
): Promise<GeminiPlanModelSyncResult> {
  const hasProvider = (settings: SmartComposerSettings) =>
    settings.providers.some(
      (provider) =>
        provider.id === 'gemini-plan' && provider.type === 'gemini-plan',
    )
  if (!hasProvider(access.getSettings())) return { status: 'not-configured' }
  if (signal?.aborted) return { status: 'unavailable' }

  const snapshot = await service.diagnose('gemini', signal)
  if (snapshot.status !== 'ready' || signal?.aborted)
    return { status: 'unavailable' }

  // The user or another sync may have changed settings during diagnosis.
  const latest = access.getSettings()
  if (!hasProvider(latest)) return { status: 'not-configured' }
  const chatModels = syncRuntimeModels(latest.chatModels, snapshot)
  const added = chatModels.filter((model) => !latest.chatModels.includes(model))
  if (added.length > 0) await access.setSettings({ ...latest, chatModels })
  return {
    status: 'synced',
    added,
    available: snapshot.models.map((model) => model.id),
  }
}
