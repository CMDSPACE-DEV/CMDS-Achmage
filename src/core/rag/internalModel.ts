import { ChatModel } from '../../types/chat-model.types'
import { getOpenAIPlanModelSpec } from '../llm/openaiPlanModels'

/** Returns a copy suitable for deterministic, low-token internal RAG calls. */
export function getInternalRagModel(model: ChatModel): ChatModel {
  const planSpec =
    model.providerType === 'openai-plan'
      ? getOpenAIPlanModelSpec(model.model)
      : undefined
  if (model.providerType === 'openai-plan' && planSpec) {
    return {
      ...model,
      reasoning: {
        reasoning_effort: planSpec.internalEffort,
      },
    }
  }

  if (model.providerType === 'anthropic-plan') {
    const adaptive =
      model.thinking?.mode === 'adaptive' ? model.thinking : undefined
    return {
      ...model,
      thinking: {
        enabled: false,
        mode: 'adaptive',
        effort: adaptive?.effort ?? 'high',
        display: adaptive?.display ?? 'summarized',
      },
    }
  }

  if (model.providerType === 'anthropic') {
    return {
      ...model,
      thinking: {
        enabled: false,
        budget_tokens: model.thinking?.budget_tokens ?? 1024,
      },
    }
  }

  if ('thinking' in model) {
    return { ...model, thinking: undefined }
  }
  if ('reasoning' in model) {
    return { ...model, reasoning: undefined }
  }
  return model
}

/** Only authentication failure prevents a useful local retrieval fallback. */
export function shouldSurfacePlanRequestError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false
  }
  const status = 'status' in error ? error.status : undefined
  return status === 401
}

export function describePlanRequestError(error: unknown): string {
  if (!error || typeof error !== 'object') {
    return 'Plan retrieval failed; local ranking was used.'
  }
  const status = 'status' in error ? String(error.status) : ''
  const suffix = status ? ` (HTTP ${status})` : ''
  return `Plan retrieval failed${suffix}; local ranking was used.`
}
