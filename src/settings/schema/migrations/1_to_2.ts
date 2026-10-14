import { SettingMigration } from '../setting.types'

// Migration-local types (frozen at v2 state to avoid breaking changes when main types change)
type V2LLMProvider = {
  type: string
  id: string
  baseUrl?: string
  apiKey?: string
}
type V2ChatModel = {
  providerType: string
  providerId: string
  id: string
  model: string
  streamingDisabled?: boolean
}
type V2EmbeddingModel = {
  providerType: string
  providerId: string
  id: string
  model: string
  dimension?: number
}

type V1OllamaModel = { baseUrl: string; model: string }
type V1OpenAICompatibleModel = V1OllamaModel & { apiKey: string }

// Frozen output shape of the former v1 schema (which was used only as a type).
type SmartComposerSettingsV1 = {
  version: 1
  openAIApiKey: string
  anthropicApiKey: string
  geminiApiKey: string
  groqApiKey: string
  chatModelId: string
  ollamaChatModel: V1OllamaModel
  openAICompatibleChatModel: V1OpenAICompatibleModel
  applyModelId: string
  ollamaApplyModel: V1OllamaModel
  openAICompatibleApplyModel: V1OpenAICompatibleModel
  embeddingModelId: string
  ollamaEmbeddingModel: V1OllamaModel
  systemPrompt: string
  ragOptions: {
    chunkSize: number
    thresholdTokens: number
    minSimilarity: number
    limit: number
    excludePatterns: string[]
    includePatterns: string[]
  }
}

/**
 * V2 constants
 */

export const V2_PROVIDER_TYPES_INFO = {
  openai: {
    label: 'OpenAI',
    defaultProviderId: 'openai',
    requireBaseUrl: false,
    supportEmbedding: true,
  },
  anthropic: {
    label: 'Anthropic',
    defaultProviderId: 'anthropic',
    requireBaseUrl: false,
    supportEmbedding: false,
  },
  gemini: {
    label: 'Gemini',
    defaultProviderId: 'gemini',
    requireBaseUrl: false,
    supportEmbedding: true,
  },
  groq: {
    label: 'Groq',
    defaultProviderId: 'groq',
    requireBaseUrl: false,
    supportEmbedding: false,
  },
  openrouter: {
    label: 'OpenRouter',
    defaultProviderId: 'openrouter',
    requireBaseUrl: false,
    supportEmbedding: false,
  },
  ollama: {
    label: 'Ollama',
    defaultProviderId: 'ollama',
    requireBaseUrl: false,
    supportEmbedding: true,
  },
  'lm-studio': {
    label: 'LM Studio',
    defaultProviderId: null,
    requireBaseUrl: false,
    supportEmbedding: true,
  },
  deepseek: {
    label: 'DeepSeek',
    defaultProviderId: null,
    requireBaseUrl: false,
    supportEmbedding: true,
  },
  'azure-openai': {
    label: 'Azure OpenAI',
    defaultProviderId: null, // no default provider for this type
    requireBaseUrl: true,
    supportEmbedding: false,
  },
  'openai-compatible': {
    label: 'OpenAI Compatible',
    defaultProviderId: null, // no default provider for this type
    requireBaseUrl: true,
    supportEmbedding: false,
  },
} as const

export const V2_DEFAULT_PROVIDERS: readonly V2LLMProvider[] = [
  {
    type: 'openai',
    id: V2_PROVIDER_TYPES_INFO.openai.defaultProviderId,
  },
  {
    type: 'anthropic',
    id: V2_PROVIDER_TYPES_INFO.anthropic.defaultProviderId,
  },
  {
    type: 'gemini',
    id: V2_PROVIDER_TYPES_INFO.gemini.defaultProviderId,
  },
  {
    type: 'groq',
    id: V2_PROVIDER_TYPES_INFO.groq.defaultProviderId,
  },
  {
    type: 'openrouter',
    id: V2_PROVIDER_TYPES_INFO.openrouter.defaultProviderId,
  },
  {
    type: 'ollama',
    id: V2_PROVIDER_TYPES_INFO.ollama.defaultProviderId,
  },
]

export const V2_DEFAULT_CHAT_MODELS: readonly V2ChatModel[] = [
  {
    providerType: 'anthropic',
    providerId: V2_PROVIDER_TYPES_INFO.anthropic.defaultProviderId,
    id: 'claude-3.5-sonnet',
    model: 'claude-3-5-sonnet-latest',
  },
  {
    providerType: 'openai',
    providerId: V2_PROVIDER_TYPES_INFO.openai.defaultProviderId,
    id: 'gpt-4o',
    model: 'gpt-4o',
  },
  {
    providerType: 'openai',
    providerId: V2_PROVIDER_TYPES_INFO.openai.defaultProviderId,
    id: 'gpt-4o-mini',
    model: 'gpt-4o-mini',
  },
  {
    providerType: 'gemini',
    providerId: V2_PROVIDER_TYPES_INFO.gemini.defaultProviderId,
    id: 'gemini-1.5-pro',
    model: 'gemini-1.5-pro',
  },
  {
    providerType: 'gemini',
    providerId: V2_PROVIDER_TYPES_INFO.gemini.defaultProviderId,
    id: 'gemini-2.0-flash',
    model: 'gemini-2.0-flash-exp',
  },
  {
    providerType: 'gemini',
    providerId: V2_PROVIDER_TYPES_INFO.gemini.defaultProviderId,
    id: 'gemini-2.0-flash-thinking',
    model: 'gemini-2.0-flash-thinking-exp',
  },
  {
    providerType: 'gemini',
    providerId: V2_PROVIDER_TYPES_INFO.gemini.defaultProviderId,
    id: 'gemini-exp-1206',
    model: 'gemini-exp-1206',
  },
  {
    providerType: 'groq',
    providerId: V2_PROVIDER_TYPES_INFO.groq.defaultProviderId,
    id: 'groq/llama-3.1-70b',
    model: 'llama-3.1-70b-versatile',
  },
  {
    providerType: 'openai',
    providerId: V2_PROVIDER_TYPES_INFO.openai.defaultProviderId,
    id: 'o1',
    model: 'o1',
    streamingDisabled: true, // currently, o1 API doesn't support streaming
  },
  {
    providerType: 'anthropic',
    providerId: V2_PROVIDER_TYPES_INFO.anthropic.defaultProviderId,
    id: 'claude-3.5-haiku',
    model: 'claude-3-5-haiku-latest',
  },
  {
    providerType: 'gemini',
    providerId: V2_PROVIDER_TYPES_INFO.gemini.defaultProviderId,
    id: 'gemini-1.5-flash',
    model: 'gemini-1.5-flash',
  },
  {
    providerType: 'groq',
    providerId: V2_PROVIDER_TYPES_INFO.groq.defaultProviderId,
    id: 'groq/llama-3.1-8b',
    model: 'llama-3.1-8b-instant',
  },
]

export const V2_DEFAULT_EMBEDDING_MODELS: readonly V2EmbeddingModel[] = [
  {
    providerType: 'openai',
    providerId: V2_PROVIDER_TYPES_INFO.openai.defaultProviderId,
    id: 'openai/text-embedding-3-small',
    model: 'text-embedding-3-small',
    dimension: 1536,
  },
  {
    providerType: 'openai',
    providerId: V2_PROVIDER_TYPES_INFO.openai.defaultProviderId,
    id: 'openai/text-embedding-3-large',
    model: 'text-embedding-3-large',
    dimension: 3072,
  },
  {
    providerType: 'gemini',
    providerId: V2_PROVIDER_TYPES_INFO.gemini.defaultProviderId,
    id: 'gemini/text-embedding-004',
    model: 'text-embedding-004',
    dimension: 768,
  },
  {
    providerType: 'ollama',
    providerId: V2_PROVIDER_TYPES_INFO.ollama.defaultProviderId,
    id: 'ollama/nomic-embed-text',
    model: 'nomic-embed-text',
    dimension: 768,
  },
  {
    providerType: 'ollama',
    providerId: V2_PROVIDER_TYPES_INFO.ollama.defaultProviderId,
    id: 'ollama/mxbai-embed-large',
    model: 'mxbai-embed-large',
    dimension: 1024,
  },
  {
    providerType: 'ollama',
    providerId: V2_PROVIDER_TYPES_INFO.ollama.defaultProviderId,
    id: 'ollama/bge-m3',
    model: 'bge-m3',
    dimension: 1024,
  },
]

export const migrateFrom1To2: SettingMigration['migrate'] = (
  data: SmartComposerSettingsV1,
) => {
  const providers: V2LLMProvider[] = [...V2_DEFAULT_PROVIDERS]
  const chatModels: V2ChatModel[] = [...V2_DEFAULT_CHAT_MODELS]

  // Map old model IDs to new model IDs
  const MODEL_ID_MAP: Record<string, string> = {
    // Anthropic models
    'anthropic/claude-3.5-sonnet-latest': 'claude-3.5-sonnet',
    'anthropic/claude-3.5-haiku': 'claude-3.5-haiku',

    // OpenAI models
    'openai/gpt-4o': 'gpt-4o',
    'openai/gpt-4o-mini': 'gpt-4o-mini',
    'openai/o1': 'o1',

    // Gemini models
    'gemini/gemini-1.5-pro': 'gemini-1.5-pro',
    'gemini/gemini-2.0-flash': 'gemini-2.0-flash',
    'gemini/gemini-2.0-flash-thinking': 'gemini-2.0-flash-thinking',
    'gemini/gemini-exp-1206': 'gemini-exp-1206',
    'gemini/gemini-1.5-flash': 'gemini-1.5-flash',

    // Groq models
    'groq/llama-3.1-70b-versatile': 'gpt-4o', // fallback to gpt-4o because groq/llama-3.1-70b is not in the default models
    'groq/llama-3.1-8b-instant': 'gpt-4o-mini', // fallback to gpt-4o-mini because groq/llama-3.1-8b is not in the default models
  }

  let chatModelId =
    MODEL_ID_MAP[data.chatModelId] ?? V2_DEFAULT_CHAT_MODELS[0].id
  let applyModelId =
    MODEL_ID_MAP[data.applyModelId] ??
    V2_DEFAULT_CHAT_MODELS.find((v) => v.id === 'gpt-4o-mini')?.id ??
    V2_DEFAULT_CHAT_MODELS[0].id

  /**
   * handle Ollama migration
   */
  let ollamaCustomProviderCount = 0
  const defaultOllamaBaseUrl =
    data.ollamaEmbeddingModel.baseUrl || // embedding model takes precedence
    data.ollamaChatModel.baseUrl ||
    data.ollamaApplyModel.baseUrl ||
    ''
  const ollamaProvider = providers.find((v) => v.type === 'ollama')
  if (ollamaProvider) {
    // ollamaProvider shouldn't be falsy, but just in case
    ollamaProvider.baseUrl = defaultOllamaBaseUrl
  }

  let ollamaChatProviderId
  if (
    data.ollamaChatModel.baseUrl &&
    data.ollamaChatModel.baseUrl !== defaultOllamaBaseUrl
  ) {
    ollamaChatProviderId = `ollama-${ollamaCustomProviderCount + 1}`
    providers.push({
      type: 'ollama',
      id: ollamaChatProviderId,
      baseUrl: data.ollamaChatModel.baseUrl,
    })
    ollamaCustomProviderCount += 1
  } else {
    ollamaChatProviderId = V2_PROVIDER_TYPES_INFO.ollama.defaultProviderId
  }
  if (data.ollamaChatModel.model) {
    const ollamaChatModelId = `${ollamaChatProviderId}/${data.ollamaChatModel.model}`
    chatModels.push({
      providerType: 'ollama',
      providerId: ollamaChatProviderId,
      id: ollamaChatModelId,
      model: data.ollamaChatModel.model,
    })
    if (data.chatModelId === 'ollama') {
      chatModelId = ollamaChatModelId
    }
  }

  const existingSameOllamaProviderForApplyModel = providers.find(
    (v) => v.type === 'ollama' && v.baseUrl === data.ollamaApplyModel.baseUrl,
  )

  let ollamaApplyProviderId: string
  if (
    !existingSameOllamaProviderForApplyModel &&
    data.ollamaApplyModel.baseUrl
  ) {
    ollamaApplyProviderId = `ollama-${ollamaCustomProviderCount + 1}`
    providers.push({
      type: 'ollama',
      id: ollamaApplyProviderId,
      baseUrl: data.ollamaApplyModel.baseUrl,
    })
    ollamaCustomProviderCount += 1
  } else {
    ollamaApplyProviderId =
      existingSameOllamaProviderForApplyModel?.id ??
      V2_PROVIDER_TYPES_INFO.ollama.defaultProviderId
  }
  if (data.ollamaApplyModel.model) {
    const existingSameChatModelForApplyModel = chatModels.find(
      (v) =>
        v.providerType === 'ollama' &&
        v.providerId === ollamaApplyProviderId &&
        v.model === data.ollamaApplyModel.model,
    )

    let ollamaApplyModelId
    if (existingSameChatModelForApplyModel) {
      ollamaApplyModelId = existingSameChatModelForApplyModel.id
    } else {
      ollamaApplyModelId = `${ollamaApplyProviderId}/${data.ollamaApplyModel.model}`
      chatModels.push({
        providerType: 'ollama',
        providerId: ollamaApplyProviderId,
        id: ollamaApplyModelId,
        model: data.ollamaApplyModel.model,
      })
    }
    if (data.applyModelId === 'ollama') {
      applyModelId = ollamaApplyModelId
    }
  }

  /**
   * handle OpenAI Compatible migration
   */
  let openAICompatibleCustomProviderCount = 0
  if (data.openAICompatibleChatModel.baseUrl) {
    const customProviderId = `custom-${openAICompatibleCustomProviderCount + 1}`
    providers.push({
      type: 'openai-compatible',
      id: customProviderId,
      baseUrl: data.openAICompatibleChatModel.baseUrl,
      apiKey: data.openAICompatibleChatModel.apiKey,
    })
    if (data.openAICompatibleChatModel.model) {
      const customChatModelId = `${customProviderId}/${data.openAICompatibleChatModel.model}`
      chatModels.push({
        providerType: 'openai-compatible',
        providerId: customProviderId,
        id: customChatModelId,
        model: data.openAICompatibleChatModel.model,
      })
      if (data.chatModelId === 'openai-compatible') {
        chatModelId = customChatModelId
      }
    }
    openAICompatibleCustomProviderCount += 1
  }
  if (data.openAICompatibleApplyModel.baseUrl) {
    const existingSameProvider = providers.find(
      (v) =>
        v.type === 'openai-compatible' &&
        v.baseUrl === data.openAICompatibleApplyModel.baseUrl &&
        v.apiKey === data.openAICompatibleApplyModel.apiKey,
    )

    let customProviderId: string
    if (existingSameProvider) {
      // if the same provider is already exists, don't create a new one
      customProviderId = existingSameProvider.id
    } else {
      customProviderId = `custom-${openAICompatibleCustomProviderCount + 1}`
      providers.push({
        type: 'openai-compatible',
        id: customProviderId,
        baseUrl: data.openAICompatibleApplyModel.baseUrl,
        apiKey: data.openAICompatibleApplyModel.apiKey,
      })
    }

    if (data.openAICompatibleApplyModel.model) {
      const existingSameChatModel = chatModels.find(
        (v) =>
          v.providerType === 'openai-compatible' &&
          v.providerId === customProviderId &&
          v.model === data.openAICompatibleApplyModel.model,
      )

      let customApplyModelId
      if (existingSameChatModel) {
        customApplyModelId = existingSameChatModel.id
      } else {
        customApplyModelId = `${customProviderId}/${data.openAICompatibleApplyModel.model}`
        chatModels.push({
          providerType: 'openai-compatible',
          providerId: customProviderId,
          id: customApplyModelId,
          model: data.openAICompatibleApplyModel.model,
        })
      }
      if (data.applyModelId === 'openai-compatible') {
        applyModelId = customApplyModelId
      }
    }
    openAICompatibleCustomProviderCount += 1
  }

  /**
   * Migrate API keys to providers
   */
  // Find and update each provider with their corresponding API key
  for (const provider of providers) {
    switch (provider.type) {
      case 'openai':
        if ('openAIApiKey' in data && typeof data.openAIApiKey === 'string') {
          provider.apiKey = data.openAIApiKey
        }
        break
      case 'anthropic':
        if (
          'anthropicApiKey' in data &&
          typeof data.anthropicApiKey === 'string'
        ) {
          provider.apiKey = data.anthropicApiKey
        }
        break
      case 'gemini':
        if ('geminiApiKey' in data && typeof data.geminiApiKey === 'string') {
          provider.apiKey = data.geminiApiKey
        }
        break
      case 'groq':
        if ('groqApiKey' in data && typeof data.groqApiKey === 'string') {
          provider.apiKey = data.groqApiKey
        }
        break
    }
  }

  return {
    version: 2,
    providers,
    chatModels,
    embeddingModels: [...V2_DEFAULT_EMBEDDING_MODELS],
    chatModelId,
    applyModelId,
    embeddingModelId: data.embeddingModelId,
    systemPrompt: data.systemPrompt,
    ragOptions: data.ragOptions,
  }
}
