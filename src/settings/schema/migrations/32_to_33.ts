import { SettingMigration } from '../setting.types'

type ModelData = Record<string, unknown> & {
  id?: string
  providerType?: string
  model?: string
}

const ADAPTIVE_HIGH = {
  enabled: true,
  mode: 'adaptive',
  effort: 'high',
  display: 'summarized',
}

/**
 * Model catalog refresh of 2026-10 (R-050, written as R-045 on the
 * contributor branch and renumbered because 1.3.0 had already shipped R-045).
 * Sources and dates are in the report; this migration only moves stored data.
 *
 * It runs after the 1.3.0 refresh (31 -> 32, R-044). Every step is keyed by id
 * and provider type, so entries 32 already inserted are left alone.
 */
const NEW_CHAT_MODELS: ModelData[] = [
  {
    providerType: 'anthropic-plan',
    providerId: 'anthropic-plan',
    id: 'claude-opus-5.5 (plan)',
    model: 'claude-opus-5-5',
    thinking: ADAPTIVE_HIGH,
  },
  {
    providerType: 'anthropic-plan',
    providerId: 'anthropic-plan',
    id: 'claude-sonnet-5.5 (plan)',
    model: 'claude-sonnet-5-5',
    thinking: ADAPTIVE_HIGH,
  },
  {
    providerType: 'anthropic-plan',
    providerId: 'anthropic-plan',
    id: 'claude-fable-5.1 (plan)',
    model: 'claude-fable-5-1',
    thinking: ADAPTIVE_HIGH,
  },
  {
    providerType: 'openai-plan',
    providerId: 'openai-plan',
    id: 'gpt-6.1-sol (plan)',
    model: 'gpt-6.1-sol',
    reasoning: { reasoning_effort: 'medium' },
  },
  {
    providerType: 'openai-plan',
    providerId: 'openai-plan',
    id: 'gpt-6-sol (plan)',
    model: 'gpt-6-sol',
    reasoning: { reasoning_effort: 'medium' },
  },
  {
    providerType: 'openai-plan',
    providerId: 'openai-plan',
    id: 'gpt-6-luna (plan)',
    model: 'gpt-6-luna',
    reasoning: { reasoning_effort: 'medium' },
  },
  {
    providerType: 'gemini-plan',
    providerId: 'gemini-plan',
    id: 'gemini-3.1-pro-high (plan)',
    model: 'gemini-3.1-pro-high',
  },
  {
    providerType: 'gemini-plan',
    providerId: 'gemini-plan',
    id: 'gemini-3.8-flash-medium (plan)',
    model: 'gemini-3.8-flash-medium',
  },
  // Like the Plan entries, the 5.x API entries ship with adaptive thinking on.
  ...apiModels('anthropic', [
    ['claude-opus-5.5', 'claude-opus-5-5'],
    ['claude-sonnet-5.5', 'claude-sonnet-5-5'],
    ['claude-opus-5', 'claude-opus-5'],
    ['claude-sonnet-5', 'claude-sonnet-5'],
  ]).map((model) => ({
    ...model,
    thinking: { enabled: true, budget_tokens: 8192, effort: 'high' },
  })),
  ...apiModels('openai', [
    ['gpt-6.1-sol', 'gpt-6.1-sol'],
    ['gpt-6-sol', 'gpt-6-sol'],
    ['gpt-6-luna', 'gpt-6-luna'],
  ]),
  ...apiModels('gemini', [
    ['gemini-3.8-flash', 'gemini-3.8-flash'],
    ['gemini-3.1-pro-preview', 'gemini-3.1-pro-preview'],
    ['gemini-3.5-flash-lite', 'gemini-3.5-flash-lite'],
  ]),
  ...apiModels('deepseek', [
    ['deepseek-flash', 'deepseek-flash'],
    ['deepseek-v4-pro', 'deepseek-v4-pro'],
  ]),
  ...apiModels('xai', [
    ['grok-4.7', 'grok-4.7'],
    ['grok-4.3', 'grok-4.3'],
  ]),
]

/**
 * Built-in entries that no longer work, mapped to their successors. Matched
 * on id and provider type, so a user's own model with the same id is kept.
 */
const RETIRED_CHAT_MODELS: Record<
  string,
  { providerType: string; successor: string }
> = {
  // Both ran the family alias before 33; the alias entries keep that model
  // and work with any Claude Code version.
  'claude-opus-4.8 (plan)': {
    providerType: 'anthropic-plan',
    successor: 'claude-opus-latest (plan)',
  },
  'claude-sonnet-5 (plan)': {
    providerType: 'anthropic-plan',
    successor: 'claude-sonnet-latest (plan)',
  },
  // Antigravity has no such model IDs.
  'gemini-3-pro-preview (plan)': {
    providerType: 'gemini-plan',
    successor: 'gemini-3.1-pro-high (plan)',
  },
  'gemini-3-flash-preview (plan)': {
    providerType: 'gemini-plan',
    successor: 'gemini-3.8-flash-medium (plan)',
  },
  // Shut down 2026-03-09.
  'gemini-3-pro-preview': {
    providerType: 'gemini',
    successor: 'gemini-3.1-pro-preview',
  },
  // Shuts down 2026-10-23.
  'o4-mini': { providerType: 'openai', successor: 'gpt-6-luna' },
  // Retired 2026-05-15; xAI routes both slugs to Grok 4.3.
  'grok-4-1-fast': { providerType: 'xai', successor: 'grok-4.3' },
  'grok-4-1-fast-non-reasoning': { providerType: 'xai', successor: 'grok-4.3' },
  // Retired 2026-07-24; both ran DeepSeek V4 Flash.
  'deepseek-chat': { providerType: 'deepseek', successor: 'deepseek-flash' },
  'deepseek-reasoner': {
    providerType: 'deepseek',
    successor: 'deepseek-flash',
  },
}

// The pinned entries this migration inserts. Every other Claude Plan entry
// with a full model ID ran the family alias before 33 and keeps doing so.
const INSERTED_PINNED_CLAUDE_PLAN_MODELS: Record<string, string> = {
  'claude-opus-5.5 (plan)': 'claude-opus-5-5',
  'claude-sonnet-5.5 (plan)': 'claude-sonnet-5-5',
  'claude-fable-5.1 (plan)': 'claude-fable-5-1',
}

// Efforts each known Codex model accepts. Older dialogs let any model save
// `minimal` or `none`; unsupported values become `low`, the closest level.
// GPT-6 follows the Codex catalog's supported_reasoning_levels, which lists no
// `none` for any GPT-6 model (R-044 E-08, rechecked 2026-10-14).
const GPT_PLAN_SUPPORTED_EFFORTS: Record<string, readonly string[]> = {
  'gpt-6.1-sol': ['low', 'medium', 'high', 'xhigh', 'max'],
  'gpt-6-astra': ['low', 'medium', 'high', 'xhigh', 'max'],
  'gpt-6-sol': ['low', 'medium', 'high', 'xhigh', 'max'],
  'gpt-6-luna': ['low', 'medium', 'high', 'xhigh', 'max'],
  'gpt-5.6-sol': ['none', 'low', 'medium', 'high', 'xhigh', 'max'],
  'gpt-5.6-terra': ['none', 'low', 'medium', 'high', 'xhigh', 'max'],
  'gpt-5.6-luna': ['none', 'low', 'medium', 'high', 'xhigh', 'max'],
}

const RETIRED_EMBEDDING_MODEL_ID = 'gemini/text-embedding-004'
const GEMINI_EMBEDDING_MODEL: ModelData = {
  providerType: 'gemini',
  providerId: 'gemini',
  id: 'gemini/gemini-embedding-2',
  model: 'gemini-embedding-2',
  dimension: 768,
  outputDimension: 768,
}

export const migrateFrom32To33: SettingMigration['migrate'] = (data) => {
  const chatModels = Array.isArray(data.chatModels)
    ? migrateChatModels(data.chatModels)
    : data.chatModels
  const knownIds = new Set(
    (Array.isArray(chatModels) ? chatModels : [])
      .filter(isRecord)
      .map((model) => model.id),
  )
  // Only selections whose model was removed move; a user's own model that
  // shares a retired id stays selected.
  const remap = (value: unknown): unknown => {
    if (typeof value !== 'string' || knownIds.has(value)) return value
    const successor = RETIRED_CHAT_MODELS[value]?.successor
    return successor && knownIds.has(successor) ? successor : value
  }

  const embeddingModels = Array.isArray(data.embeddingModels)
    ? migrateEmbeddingModels(data.embeddingModels)
    : data.embeddingModels
  const embeddingReplaced =
    Array.isArray(embeddingModels) &&
    embeddingModels.some(
      (model) => isRecord(model) && model.id === GEMINI_EMBEDDING_MODEL.id,
    )

  return {
    ...data,
    chatModels,
    chatModelId: remap(data.chatModelId),
    inlineEdit: remapField(data.inlineEdit, remap),
    imageGeneration: remapField(data.imageGeneration, remap),
    imageAnalysis: remapField(data.imageAnalysis, remap),
    embeddingModels,
    embeddingModelId:
      data.embeddingModelId === RETIRED_EMBEDDING_MODEL_ID && embeddingReplaced
        ? GEMINI_EMBEDDING_MODEL.id
        : data.embeddingModelId,
    version: 33,
  }
}

function migrateChatModels(values: unknown[]): unknown[] {
  const result = values.map((value) =>
    isRecord(value) ? migrateStoredModel(value) : value,
  )
  const existingIds = new Set(result.filter(isRecord).map((model) => model.id))
  for (const model of NEW_CHAT_MODELS) {
    if (existingIds.has(model.id)) continue
    // Next to the last model of the same provider type, else at the end.
    const lastOfType = findLastIndex(
      result,
      (value) => isRecord(value) && value.providerType === model.providerType,
    )
    result.splice(lastOfType + 1 || result.length, 0, cloneModel(model))
    existingIds.add(model.id)
  }
  // A retired entry goes only when its successor is there to take its place
  // (a user may have deleted the alias entries); otherwise it stays, with its
  // model already folded above.
  return result.filter((value) => {
    const retired = retiredBuiltIn(value)
    return !retired || !existingIds.has(retired.successor)
  })
}

function migrateStoredModel(model: ModelData): ModelData {
  // Before 33 every full Claude ID ran the family alias; keep that behavior.
  if (
    model.providerType === 'anthropic-plan' &&
    typeof model.model === 'string' &&
    /^claude-/i.test(model.model) &&
    INSERTED_PINNED_CLAUDE_PLAN_MODELS[model.id ?? ''] !== model.model
  ) {
    const alias = claudeFamilyAlias(model.model)
    return alias ? { ...model, model: alias } : model
  }
  if (model.providerType === 'openai-plan') {
    return migrateGptPlanEffort(model)
  }
  // Gemini 2.5 Flash Image shuts down 2026-10-02.
  if (
    model.providerType === 'gemini' &&
    model.model === 'gemini-2.5-flash-image'
  ) {
    return { ...model, model: 'gemini-3.1-flash-image' }
  }
  return model
}

function migrateGptPlanEffort(model: ModelData): ModelData {
  const supported =
    typeof model.model === 'string'
      ? GPT_PLAN_SUPPORTED_EFFORTS[model.model]
      : undefined
  const reasoning = isRecord(model.reasoning) ? model.reasoning : undefined
  const effort = reasoning?.reasoning_effort
  if (!supported || typeof effort !== 'string' || supported.includes(effort)) {
    return model
  }
  return { ...model, reasoning: { ...reasoning, reasoning_effort: 'low' } }
}

function claudeFamilyAlias(model: string): string | undefined {
  if (/fable/i.test(model)) return 'fable'
  if (/opus/i.test(model)) return 'opus'
  if (/sonnet/i.test(model)) return 'sonnet'
  if (/haiku/i.test(model)) return 'haiku'
  return undefined
}

function retiredBuiltIn(
  value: unknown,
): { providerType: string; successor: string } | undefined {
  if (!isRecord(value) || typeof value.id !== 'string') return undefined
  const retired = RETIRED_CHAT_MODELS[value.id]
  return retired?.providerType === value.providerType ? retired : undefined
}

function migrateEmbeddingModels(values: unknown[]): unknown[] {
  const retiredIndex = values.findIndex(
    (value) => isRecord(value) && value.id === RETIRED_EMBEDDING_MODEL_ID,
  )
  if (retiredIndex === -1) return values
  const withoutRetired = values.filter((_, index) => index !== retiredIndex)
  if (
    withoutRetired.some(
      (value) => isRecord(value) && value.id === GEMINI_EMBEDDING_MODEL.id,
    )
  ) {
    return withoutRetired
  }
  const result = [...withoutRetired]
  result.splice(retiredIndex, 0, { ...GEMINI_EMBEDDING_MODEL })
  return result
}

function remapField(
  value: unknown,
  remap: (modelId: unknown) => unknown,
): unknown {
  if (!isRecord(value) || !('modelId' in value)) return value
  return { ...value, modelId: remap(value.modelId) }
}

function apiModels(
  providerType: string,
  entries: [id: string, model: string][],
): ModelData[] {
  return entries.map(([id, model]) => ({
    providerType,
    providerId: providerType,
    id,
    model,
  }))
}

function cloneModel(model: ModelData): ModelData {
  return JSON.parse(JSON.stringify(model)) as ModelData
}

function findLastIndex<T>(
  values: T[],
  predicate: (value: T) => boolean,
): number {
  for (let index = values.length - 1; index >= 0; index -= 1) {
    if (predicate(values[index])) return index
  }
  return -1
}

function isRecord(value: unknown): value is ModelData {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
