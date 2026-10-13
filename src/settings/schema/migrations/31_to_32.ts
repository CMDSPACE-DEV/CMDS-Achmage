import { SettingMigration } from '../setting.types'

const SHUT_DOWN_GEMINI_MODEL = 'gemini-3-pro-preview'
const GEMINI_PRO_REPLACEMENT_ID = 'gemini-3.1-pro-preview'

/**
 * 2026-09-30 catalog refresh (R-044).
 *
 * - Upserts the current API flagships. `DEFAULT_CHAT_MODELS` only seeds fresh
 *   installs, so an existing vault needs this insert (the 27_to_28 / 29_to_30
 *   pattern). Insert-if-absent: a user's own entry or `enable` choice wins.
 * - `gemini-3-pro-preview` is shut down on the Gemini API. API entries using it
 *   are disabled (kept for old chat metadata) and any selection pointing at
 *   one moves to `gemini-3.1-pro-preview`, so chat does not fail on send.
 *
 * Plan entries are deliberately not added here. Claude Plan follows the CLI's
 * stable aliases (`opus` already resolves to the newest Opus), Gemini Plan
 * syncs from `agy models`, and OpenAI Plan now syncs from the account's Codex
 * catalog at startup. A static Plan entry would pre-empt those syncs.
 */
const NEW_CHAT_MODELS: Record<string, unknown>[] = [
  {
    providerType: 'anthropic',
    providerId: 'anthropic',
    id: 'claude-opus-5.5',
    model: 'claude-opus-5-5',
  },
  {
    providerType: 'anthropic',
    providerId: 'anthropic',
    id: 'claude-sonnet-5.5',
    model: 'claude-sonnet-5-5',
  },
  {
    providerType: 'anthropic',
    providerId: 'anthropic',
    id: 'claude-haiku-5.5',
    model: 'claude-haiku-5-5',
  },
  {
    providerType: 'openai',
    providerId: 'openai',
    id: 'gpt-6.1-sol',
    model: 'gpt-6.1-sol',
  },
  {
    providerType: 'openai',
    providerId: 'openai',
    id: 'gpt-6-luna',
    model: 'gpt-6-luna',
  },
  {
    providerType: 'gemini',
    providerId: 'gemini',
    id: GEMINI_PRO_REPLACEMENT_ID,
    model: GEMINI_PRO_REPLACEMENT_ID,
  },
  {
    providerType: 'gemini',
    providerId: 'gemini',
    id: 'gemini-3.8-flash',
    model: 'gemini-3.8-flash',
  },
  {
    providerType: 'gemini',
    providerId: 'gemini',
    id: 'gemini-3.5-flash-lite',
    model: 'gemini-3.5-flash-lite',
  },
]

export const migrateFrom31To32: SettingMigration['migrate'] = (data) => {
  if (!Array.isArray(data.chatModels)) {
    return { ...data, version: 32 }
  }

  const retiredIds = new Set(
    data.chatModels
      .filter(isRecord)
      .filter(isShutDownGeminiApiModel)
      .map((model) => model.id)
      .filter((id): id is string => typeof id === 'string'),
  )
  const chatModels = insertMissingModels(
    (data.chatModels as unknown[]).map((model) =>
      isRecord(model) && isShutDownGeminiApiModel(model)
        ? { ...model, enable: false }
        : model,
    ),
  )
  const remap = (value: unknown) =>
    typeof value === 'string' && retiredIds.has(value)
      ? GEMINI_PRO_REPLACEMENT_ID
      : value

  return {
    ...data,
    chatModels,
    chatModelId: remap(data.chatModelId),
    inlineEdit: isRecord(data.inlineEdit)
      ? { ...data.inlineEdit, modelId: remap(data.inlineEdit.modelId) }
      : data.inlineEdit,
    imageAnalysis: isRecord(data.imageAnalysis)
      ? { ...data.imageAnalysis, modelId: remap(data.imageAnalysis.modelId) }
      : data.imageAnalysis,
    version: 32,
  }
}

function isShutDownGeminiApiModel(model: Record<string, unknown>): boolean {
  return (
    model.providerType === 'gemini' && model.model === SHUT_DOWN_GEMINI_MODEL
  )
}

function insertMissingModels(values: unknown[]): unknown[] {
  const existingIds = new Set(
    values
      .filter(isRecord)
      .map((value) => value.id)
      .filter((id): id is string => typeof id === 'string'),
  )
  const additions = NEW_CHAT_MODELS.filter(
    (model) => !existingIds.has(model.id as string),
  )
  return additions.length === 0 ? values : [...additions, ...values]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
