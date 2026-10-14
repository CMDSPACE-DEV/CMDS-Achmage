import { GPT_5_6_EFFORTS, Gpt56Effort } from '../../types/chat-model.types'

/**
 * What each OpenAI Plan (Codex) model accepts. Efforts follow the OpenAI model
 * pages; image generation is enabled only where the hosted image_generation
 * tool was verified on this connection (R-001). See R-050.
 */
export type OpenAIPlanModelSpec = {
  efforts: readonly Gpt56Effort[]
  /** Used when the chat model has no effort configured. */
  defaultEffort: Gpt56Effort
  /** Cheapest supported effort, for internal retrieval and rerank calls. */
  internalEffort: Gpt56Effort
  imageGeneration: boolean
}

const ALL_EFFORTS = GPT_5_6_EFFORTS
// No GPT-6 model lists `none` in the Codex catalog's supported_reasoning_levels
// (R-044 E-08, rechecked 2026-10-14), which is what Plan requests go through.
const EFFORTS_WITHOUT_NONE = GPT_5_6_EFFORTS.filter(
  (effort) => effort !== 'none',
)

const OPENAI_PLAN_MODEL_SPECS: Readonly<Record<string, OpenAIPlanModelSpec>> = {
  'gpt-6.1-sol': {
    efforts: EFFORTS_WITHOUT_NONE,
    defaultEffort: 'medium',
    internalEffort: 'low',
    imageGeneration: false,
  },
  'gpt-6-sol': {
    efforts: EFFORTS_WITHOUT_NONE,
    defaultEffort: 'medium',
    internalEffort: 'low',
    imageGeneration: false,
  },
  'gpt-6-astra': {
    efforts: EFFORTS_WITHOUT_NONE,
    defaultEffort: 'low',
    internalEffort: 'low',
    imageGeneration: false,
  },
  'gpt-6-luna': {
    efforts: EFFORTS_WITHOUT_NONE,
    defaultEffort: 'medium',
    internalEffort: 'low',
    imageGeneration: false,
  },
  'gpt-5.6-sol': {
    efforts: ALL_EFFORTS,
    defaultEffort: 'medium',
    internalEffort: 'none',
    imageGeneration: true,
  },
  'gpt-5.6-terra': {
    efforts: ALL_EFFORTS,
    defaultEffort: 'low',
    internalEffort: 'none',
    imageGeneration: true,
  },
  'gpt-5.6-luna': {
    efforts: ALL_EFFORTS,
    defaultEffort: 'none',
    internalEffort: 'none',
    imageGeneration: true,
  },
}

// Models the startup Codex catalog sync adds before this table knows them
// (R-044) get their family's conservative defaults instead of no controls.
const GPT_6_FAMILY_SPEC: OpenAIPlanModelSpec = {
  efforts: EFFORTS_WITHOUT_NONE,
  defaultEffort: 'medium',
  internalEffort: 'low',
  imageGeneration: false,
}

const GPT_5_6_FAMILY_SPEC: OpenAIPlanModelSpec = {
  efforts: ALL_EFFORTS,
  defaultEffort: 'medium',
  internalEffort: 'none',
  imageGeneration: false,
}

export function getOpenAIPlanModelSpec(
  model: string,
): OpenAIPlanModelSpec | undefined {
  if (Object.prototype.hasOwnProperty.call(OPENAI_PLAN_MODEL_SPECS, model)) {
    return OPENAI_PLAN_MODEL_SPECS[model]
  }
  if (/^gpt-6(?:\.\d+)?-[a-z]+$/.test(model)) return GPT_6_FAMILY_SPEC
  if (/^gpt-5\.6-[a-z]+$/.test(model)) return GPT_5_6_FAMILY_SPEC
  return undefined
}

/**
 * Returns the effort to send: the configured one when the model accepts it,
 * the model default when none is configured. Unknown models pass through so
 * a user-added Codex model keeps working.
 */
export function normalizeOpenAIPlanEffort(
  model: string,
  effort: string | undefined,
): Gpt56Effort | undefined {
  const spec = getOpenAIPlanModelSpec(model)
  if (!effort) {
    return spec?.defaultEffort
  }
  if (!spec) {
    return effort as Gpt56Effort
  }
  if (!spec.efforts.includes(effort as Gpt56Effort)) {
    throw new Error(
      `Unsupported reasoning effort "${effort}" for ${model}. Expected one of: ${spec.efforts.join(', ')}.`,
    )
  }
  return effort as Gpt56Effort
}
