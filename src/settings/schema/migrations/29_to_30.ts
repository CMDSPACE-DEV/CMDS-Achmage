import { SettingMigration } from '../setting.types'

/**
 * `appearance.skinMode` was introduced in 19_to_20 as a single-value literal
 * (`'follow-obsidian'`) that no renderer ever read: the chat shell always
 * picked the owned dual skin from the `theme-dark` body class. As of 30 the
 * field is a real choice and the renderer honors it, so the stored literal is
 * kept verbatim: every upgraded vault starts following its own theme, which is
 * what the settings file has claimed all along and is the product decision
 * recorded in R-030. The owned dual skin stays available as an opt-in.
 *
 * This migration upserts the Fable and Astra catalog entries. Adding
 * them to DEFAULT_CHAT_MODELS only affects fresh installs: an existing vault
 * keeps its own stored `chatModels` array, so new models are invisible there
 * unless a migration inserts them. This mirrors `27_to_28`.
 */
const NEW_CHAT_MODELS: Record<string, unknown>[] = [
  {
    providerType: 'anthropic-plan',
    providerId: 'anthropic-plan',
    id: 'claude-fable-latest (plan)',
    model: 'fable',
    thinking: {
      enabled: true,
      mode: 'adaptive',
      effort: 'high',
      display: 'summarized',
    },
  },
  {
    providerType: 'openai-plan',
    providerId: 'openai-plan',
    id: 'gpt-6-astra (plan)',
    model: 'gpt-6-astra',
    // The installed Codex CLI rejects this model until it is upgraded, so it
    // ships disabled like `claude-sonnet-5 (plan)`. See R-030.
    enable: false,
  },
  {
    providerType: 'anthropic',
    providerId: 'anthropic',
    id: 'claude-fable-5.1',
    model: 'claude-fable-5-1',
  },
  {
    providerType: 'openai',
    providerId: 'openai',
    id: 'gpt-6-astra',
    model: 'gpt-6-astra',
  },
]

export const migrateFrom29To30: SettingMigration['migrate'] = (data) => {
  const appearance =
    typeof data.appearance === 'object' && data.appearance !== null
      ? (data.appearance as Record<string, unknown>)
      : {}

  return {
    ...data,
    appearance: {
      ...appearance,
      skinMode:
        appearance.skinMode === 'studio-console'
          ? 'studio-console'
          : 'follow-obsidian',
    },
    chatModels: Array.isArray(data.chatModels)
      ? insertMissingModels(data.chatModels)
      : data.chatModels,
    version: 30,
  }
}

/**
 * Insert-if-absent rather than merge: a user who already added one of these
 * ids by hand, or who disabled it, keeps their own entry untouched.
 */
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
