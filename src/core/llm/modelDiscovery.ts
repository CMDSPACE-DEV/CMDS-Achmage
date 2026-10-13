import type { ChatModel } from '../../types/chat-model.types'
import { GPT_5_6_EFFORTS, Gpt56Effort } from '../../types/chat-model.types'

/**
 * Runtime model discovery. The bundled catalog in `constants.ts` only changes
 * with a plugin release, and a community release can trail a vendor launch by
 * days. These helpers ask the vendor which models the user's own credentials
 * can reach right now, so a new model is selectable without waiting for us.
 * See R-044.
 */

export type JsonGetter = (
  url: string,
  headers: Record<string, string>,
) => Promise<unknown>

export type DiscoveredModel = {
  /** Exact id sent to the vendor. */
  id: string
  label: string
  /** Codex catalog only: the backend's default effort for this model. */
  defaultEffort?: Gpt56Effort
}

export type DiscoverableApiProviderType = 'anthropic' | 'openai' | 'gemini'

/**
 * The ChatGPT-account Codex backend serves the same catalog Codex CLI reads.
 * Verified against openai/codex `codex-rs/codex-api/src/endpoint/models.rs`
 * and `codex-rs/protocol/src/openai_models.rs` (see R-044).
 */
export const CODEX_MODELS_ENDPOINT =
  'https://chatgpt.com/backend-api/codex/models'

/**
 * The backend hides models whose `minimal_client_version` is newer than the
 * version a client reports, which is how R-030 saw "requires a newer version
 * of Codex" for Astra. Report the newest released Codex version; the
 * scheduled catalog watch flags this constant when a newer release exists.
 */
export const CODEX_CATALOG_CLIENT_VERSION = '0.162.1'

const EFFORT_SET = new Set<string>(GPT_5_6_EFFORTS)

export async function fetchCodexPlanModels(
  authHeaders: Record<string, string>,
  getJson: JsonGetter,
): Promise<DiscoveredModel[]> {
  const url = `${CODEX_MODELS_ENDPOINT}?client_version=${CODEX_CATALOG_CLIENT_VERSION}`
  return parseCodexModels(await getJson(url, authHeaders))
}

/** Only picker-visible models; hidden and internal slugs stay out. */
export function parseCodexModels(body: unknown): DiscoveredModel[] {
  if (!isRecord(body) || !Array.isArray(body.models)) {
    throw new Error('Codex model catalog response had no models array.')
  }
  const models: DiscoveredModel[] = []
  for (const entry of body.models) {
    if (!isRecord(entry) || typeof entry.slug !== 'string') continue
    if (entry.visibility !== 'list') continue
    const defaultEffort =
      typeof entry.default_reasoning_level === 'string' &&
      EFFORT_SET.has(entry.default_reasoning_level)
        ? (entry.default_reasoning_level as Gpt56Effort)
        : undefined
    models.push({
      id: entry.slug,
      label:
        typeof entry.display_name === 'string'
          ? entry.display_name
          : entry.slug,
      defaultEffort,
    })
  }
  return models
}

export async function fetchApiProviderModels(
  providerType: DiscoverableApiProviderType,
  apiKey: string,
  getJson: JsonGetter,
  baseUrl?: string,
): Promise<DiscoveredModel[]> {
  switch (providerType) {
    case 'anthropic': {
      const base = trimBase(baseUrl) ?? 'https://api.anthropic.com'
      const body = await getJson(`${base}/v1/models?limit=1000`, {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      })
      return listOf(body, 'data').flatMap((entry) =>
        typeof entry.id === 'string' && isChatCandidate('anthropic', entry.id)
          ? [{ id: entry.id, label: stringOr(entry.display_name, entry.id) }]
          : [],
      )
    }
    case 'openai': {
      const base = trimBase(baseUrl) ?? 'https://api.openai.com/v1'
      const body = await getJson(`${base}/models`, {
        authorization: `Bearer ${apiKey}`,
      })
      return listOf(body, 'data').flatMap((entry) =>
        typeof entry.id === 'string' && isChatCandidate('openai', entry.id)
          ? [{ id: entry.id, label: entry.id }]
          : [],
      )
    }
    case 'gemini': {
      // The key travels in a header, never in the URL, so it cannot land in
      // proxy or request logs.
      const body = await getJson(
        'https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000',
        { 'x-goog-api-key': apiKey },
      )
      return listOf(body, 'models').flatMap((entry) => {
        if (typeof entry.name !== 'string') return []
        const id = entry.name.replace(/^models\//, '')
        const methods = Array.isArray(entry.supportedGenerationMethods)
          ? entry.supportedGenerationMethods
          : []
        if (!methods.includes('generateContent')) return []
        if (!isChatCandidate('gemini', id)) return []
        return [{ id, label: stringOr(entry.displayName, id) }]
      })
    }
  }
}

/**
 * Vendor lists mix chat models with embeddings, speech, image, and dated
 * snapshots. Keep only what the chat picker can actually drive.
 */
export function isChatCandidate(
  providerType: DiscoverableApiProviderType,
  id: string,
): boolean {
  const lower = id.toLowerCase()
  switch (providerType) {
    case 'anthropic':
      return lower.startsWith('claude-')
    case 'openai':
      return (
        /^(gpt-|o\d)/.test(lower) &&
        !/(embedding|tts|whisper|transcribe|audio|realtime|live|image|dall-e|moderation|search|codex|instruct|cyber)/.test(
          lower,
        ) &&
        // Dated snapshots duplicate their alias (gpt-5.5-2026-04-10).
        !/-\d{4}-\d{2}-\d{2}$/.test(lower)
      )
    case 'gemini':
      return (
        lower.startsWith('gemini-') &&
        !/(embedding|tts|image|live|native-audio|transcribe|computer-use|customtools|robotics)/.test(
          lower,
        )
      )
  }
}

/**
 * Append discovered models the user does not have yet. Existing entries are
 * matched by the vendor id, not by our display id, and are never modified:
 * a model the user disabled or re-labelled stays exactly as they left it.
 */
export function mergeDiscoveredModels(
  chatModels: ChatModel[],
  providerType: 'openai-plan' | DiscoverableApiProviderType,
  providerId: string,
  discovered: DiscoveredModel[],
): { chatModels: ChatModel[]; added: ChatModel[] } {
  const next = [...chatModels]
  const added: ChatModel[] = []
  for (const model of discovered) {
    const exists = next.some(
      (existing) =>
        existing.providerId === providerId && existing.model === model.id,
    )
    if (exists) continue
    const id = uniqueModelId(
      next,
      providerType === 'openai-plan' ? `${model.id} (plan)` : model.id,
    )
    const entry: ChatModel =
      providerType === 'openai-plan'
        ? {
            providerType,
            providerId,
            id,
            model: model.id,
            enable: true,
            ...(model.defaultEffort
              ? { reasoning: { reasoning_effort: model.defaultEffort } }
              : {}),
          }
        : { providerType, providerId, id, model: model.id, enable: true }
    next.push(entry)
    added.push(entry)
  }
  return { chatModels: added.length > 0 ? next : chatModels, added }
}

function uniqueModelId(models: ChatModel[], candidate: string): string {
  if (!models.some((model) => model.id === candidate)) return candidate
  let suffix = 2
  while (models.some((model) => model.id === `${candidate} ${suffix}`)) {
    suffix += 1
  }
  return `${candidate} ${suffix}`
}

function listOf(body: unknown, key: string): Record<string, unknown>[] {
  if (!isRecord(body) || !Array.isArray(body[key])) {
    throw new Error(`Model list response had no "${key}" array.`)
  }
  return (body[key] as unknown[]).filter(isRecord)
}

function trimBase(baseUrl: string | undefined): string | undefined {
  const trimmed = baseUrl?.trim().replace(/\/+$/, '')
  return trimmed ? trimmed : undefined
}

function stringOr(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value : fallback
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
