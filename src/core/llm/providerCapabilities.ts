import { ChatModel } from '../../types/chat-model.types'
import { isApiImageModel } from '../image/image-model-catalog'

import { getOpenAIPlanModelSpec } from './openaiPlanModels'

export type ProviderCapabilities = {
  plan: boolean
  tools: boolean
  reasoningEffort: boolean
  imageGeneration: boolean
  /** Image-only models: hidden from chat, inline, and apply pickers. */
  imageOnly: boolean
  outputTokenLimit: boolean
}

export function getProviderCapabilities(
  model: ChatModel,
): ProviderCapabilities {
  const plan = model.providerType.endsWith('-plan')
  const openAIPlan = model.providerType === 'openai-plan'
  const apiImageModel = isApiImageModel(model)

  return {
    plan,
    tools: true,
    reasoningEffort:
      model.providerType === 'openai-plan' ||
      model.providerType === 'openai' ||
      model.providerType === 'anthropic-plan' ||
      model.providerType === 'anthropic',
    imageGeneration:
      (openAIPlan &&
        getOpenAIPlanModelSpec(model.model)?.imageGeneration === true) ||
      apiImageModel,
    imageOnly: apiImageModel,
    // The private Codex endpoint currently rejects max_output_tokens.
    outputTokenLimit: !openAIPlan,
  }
}
