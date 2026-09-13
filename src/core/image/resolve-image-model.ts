import { SmartComposerSettings } from '../../settings/schema/setting.types'
import { ChatModel } from '../../types/chat-model.types'
import { getProviderCapabilities } from '../llm/providerCapabilities'

export type ImageModelResolution = {
  model: ChatModel | null
  usedChatModelFallback: boolean
  reason?: string
}

type ImageModelSettings = Pick<
  SmartComposerSettings,
  'chatModels' | 'chatModelId' | 'imageGeneration'
>

export function canGenerateImages(
  model: ChatModel | undefined,
): model is ChatModel {
  return (
    !!model &&
    (model.enable ?? true) &&
    getProviderCapabilities(model).imageGeneration
  )
}

/** Prefers the configured image model; falls back to the chat model only when it qualifies. */
export function resolveImageGenerationModel(
  settings: ImageModelSettings,
): ImageModelResolution {
  const configured = settings.chatModels.find(
    (model) => model.id === settings.imageGeneration.modelId,
  )
  if (canGenerateImages(configured)) {
    return { model: configured, usedChatModelFallback: false }
  }
  const chatModel = settings.chatModels.find(
    (model) => model.id === settings.chatModelId,
  )
  if (canGenerateImages(chatModel)) {
    return { model: chatModel, usedChatModelFallback: true }
  }
  return {
    model: null,
    usedChatModelFallback: false,
    reason: `Image model "${settings.imageGeneration.modelId}" is disabled or cannot generate images.`,
  }
}
