import type { ChatModel } from '../../../types/chat-model.types'

import type { NativeRuntimeSnapshot } from './nativeRuntime.types'

export function syncRuntimeModels(
  chatModels: ChatModel[],
  snapshot: NativeRuntimeSnapshot,
): ChatModel[] {
  const providerType =
    snapshot.provider === 'claude'
      ? ('anthropic-plan' as const)
      : ('gemini-plan' as const)
  const providerId = providerType
  const next = [...chatModels]
  let changed = false

  for (const runtimeModel of snapshot.models) {
    const existingIndex = next.findIndex(
      (model) =>
        model.providerType === providerType && model.model === runtimeModel.id,
    )
    if (existingIndex !== -1) continue

    const stableAlias = runtimeModel.id.toLowerCase()
    if (
      providerType === 'anthropic-plan' &&
      ['default', 'opus', 'sonnet', 'haiku'].includes(stableAlias)
    ) {
      continue
    }

    const id = uniqueModelId(
      next,
      `${runtimeModel.label || runtimeModel.id} (plan)`,
    )
    next.push({
      providerType,
      providerId,
      id,
      model: runtimeModel.id,
      enable: true,
    })
    changed = true
  }
  return changed ? next : chatModels
}

function uniqueModelId(models: ChatModel[], candidate: string): string {
  if (!models.some((model) => model.id === candidate)) return candidate
  let suffix = 2
  while (models.some((model) => model.id === `${candidate} ${suffix}`)) {
    suffix += 1
  }
  return `${candidate} ${suffix}`
}
