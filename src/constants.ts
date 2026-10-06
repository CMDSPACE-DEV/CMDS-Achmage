import { ChatModel } from './types/chat-model.types'
import { EmbeddingModel } from './types/embedding-model.types'
import { LLMProvider, LLMProviderType } from './types/provider.types'

export const CHAT_VIEW_TYPE = 'smtcmp-chat-view'

export const PGLITE_DB_PATH = '.smtcmp_vector_db.tar.gz'

export const CODEX_CLIENT_ID = 'app_EMoamEEZ73f0CkXaXp7hrann'
export const CODEX_ISSUER = 'https://auth.openai.com'
export const CODEX_REDIRECT_PORT = 1455 // Other ports are blocked by OpenAI
export const CODEX_REDIRECT_URI = `http://localhost:${CODEX_REDIRECT_PORT}/auth/callback`
export const CODEX_AUTH_CLAIMS_URL = 'https://api.openai.com/auth'
export const CODEX_RESPONSES_ENDPOINT =
  'https://chatgpt.com/backend-api/codex/responses'

// Default model ids
export const DEFAULT_CHAT_MODEL_ID = 'claude-sonnet-5.5'
// gpt-4.1-mini is preferred over gpt-5-mini because gpt-5 models do not support
// predicted outputs, making them significantly slower for apply tasks.
export const DEFAULT_APPLY_MODEL_ID = 'gpt-4.1-mini'

// Recommended model ids
export const RECOMMENDED_MODELS_FOR_CHAT = ['claude-sonnet-5.5', 'gpt-6.1-sol']
export const RECOMMENDED_MODELS_FOR_APPLY = ['gpt-4.1-mini']
export const RECOMMENDED_MODELS_FOR_EMBEDDING = [
  'openai/text-embedding-3-small',
]

export const PLAN_PROVIDER_TYPES: readonly LLMProviderType[] = [
  'anthropic-plan',
  'openai-plan',
  'gemini-plan',
] as const
export const PROVIDER_TYPES_INFO = {
  'anthropic-plan': {
    label: 'Claude Plan',
    defaultProviderId: 'anthropic-plan',
    requireApiKey: false,
    requireBaseUrl: false,
    supportEmbedding: false,
    additionalSettings: [],
  },
  'openai-plan': {
    label: 'OpenAI Plan',
    defaultProviderId: 'openai-plan',
    requireApiKey: false,
    requireBaseUrl: false,
    supportEmbedding: false,
    additionalSettings: [],
  },
  'gemini-plan': {
    label: 'Gemini Plan',
    defaultProviderId: 'gemini-plan',
    requireApiKey: false,
    requireBaseUrl: false,
    supportEmbedding: false,
    additionalSettings: [],
  },
  anthropic: {
    label: 'Anthropic',
    defaultProviderId: 'anthropic',
    requireApiKey: true,
    requireBaseUrl: false,
    supportEmbedding: false,
    additionalSettings: [],
  },
  openai: {
    label: 'OpenAI',
    defaultProviderId: 'openai',
    requireApiKey: true,
    requireBaseUrl: false,
    supportEmbedding: true,
    additionalSettings: [],
  },
  gemini: {
    label: 'Gemini',
    defaultProviderId: 'gemini',
    requireApiKey: true,
    requireBaseUrl: false,
    supportEmbedding: true,
    additionalSettings: [],
  },
  xai: {
    label: 'xAI',
    defaultProviderId: 'xai',
    requireApiKey: true,
    requireBaseUrl: false,
    supportEmbedding: false,
    additionalSettings: [],
  },
  deepseek: {
    label: 'DeepSeek',
    defaultProviderId: 'deepseek',
    requireApiKey: true,
    requireBaseUrl: false,
    supportEmbedding: false,
    additionalSettings: [],
  },
  mistral: {
    label: 'Mistral',
    defaultProviderId: 'mistral',
    requireApiKey: true,
    requireBaseUrl: false,
    supportEmbedding: false,
    additionalSettings: [],
  },
  perplexity: {
    label: 'Perplexity',
    defaultProviderId: 'perplexity',
    requireApiKey: true,
    requireBaseUrl: false,
    supportEmbedding: false,
    additionalSettings: [],
  },
  openrouter: {
    label: 'OpenRouter',
    defaultProviderId: 'openrouter',
    requireApiKey: true,
    requireBaseUrl: false,
    supportEmbedding: false,
    additionalSettings: [],
  },
  ollama: {
    label: 'Ollama',
    defaultProviderId: 'ollama',
    requireApiKey: false,
    requireBaseUrl: false,
    supportEmbedding: true,
    additionalSettings: [],
  },
  'lm-studio': {
    label: 'LM Studio',
    defaultProviderId: 'lm-studio',
    requireApiKey: false,
    requireBaseUrl: false,
    supportEmbedding: true,
    additionalSettings: [],
  },
  'azure-openai': {
    label: 'Azure OpenAI',
    defaultProviderId: null, // no default provider for this type
    requireApiKey: true,
    requireBaseUrl: true,
    supportEmbedding: false,
    additionalSettings: [
      {
        label: 'Deployment',
        key: 'deployment',
        placeholder: 'Enter your deployment name',
        type: 'text',
        required: true,
      },
      {
        label: 'API Version',
        key: 'apiVersion',
        placeholder: 'Enter your API version',
        type: 'text',
        required: true,
      },
    ],
  },
  'openai-compatible': {
    label: 'OpenAI Compatible',
    defaultProviderId: null, // no default provider for this type
    requireApiKey: false,
    requireBaseUrl: true,
    supportEmbedding: true,
    additionalSettings: [
      {
        label: 'No Stainless Headers',
        key: 'noStainless',
        type: 'toggle',
        required: false,
        description:
          'Enable this if you encounter CORS errors related to Stainless headers (x-stainless-os, etc.)',
      },
    ],
  },
} as const satisfies Record<
  LLMProviderType,
  {
    label: string
    defaultProviderId: string | null
    requireApiKey: boolean
    requireBaseUrl: boolean
    supportEmbedding: boolean
    additionalSettings: {
      label: string
      key: string
      type: 'text' | 'toggle'
      placeholder?: string
      description?: string
      required?: boolean
    }[]
  }
>

/**
 * Important
 * 1. When adding new default provider, settings migration should be added
 * 2. If there's same provider id in user's settings, it's data should be overwritten by default provider
 */
export const DEFAULT_PROVIDERS: readonly LLMProvider[] = [
  {
    type: 'anthropic-plan',
    id: PROVIDER_TYPES_INFO['anthropic-plan'].defaultProviderId,
  },
  {
    type: 'openai-plan',
    id: PROVIDER_TYPES_INFO['openai-plan'].defaultProviderId,
  },
  {
    type: 'gemini-plan',
    id: PROVIDER_TYPES_INFO['gemini-plan'].defaultProviderId,
  },
  {
    type: 'anthropic',
    id: PROVIDER_TYPES_INFO.anthropic.defaultProviderId,
  },
  {
    type: 'openai',
    id: PROVIDER_TYPES_INFO.openai.defaultProviderId,
  },
  {
    type: 'gemini',
    id: PROVIDER_TYPES_INFO.gemini.defaultProviderId,
  },
  {
    type: 'xai',
    id: PROVIDER_TYPES_INFO.xai.defaultProviderId,
  },
  {
    type: 'deepseek',
    id: PROVIDER_TYPES_INFO.deepseek.defaultProviderId,
  },
  {
    type: 'mistral',
    id: PROVIDER_TYPES_INFO.mistral.defaultProviderId,
  },
  {
    type: 'perplexity',
    id: PROVIDER_TYPES_INFO.perplexity.defaultProviderId,
  },
  {
    type: 'openrouter',
    id: PROVIDER_TYPES_INFO.openrouter.defaultProviderId,
  },
  {
    type: 'ollama',
    id: PROVIDER_TYPES_INFO.ollama.defaultProviderId,
  },
  {
    type: 'lm-studio',
    id: PROVIDER_TYPES_INFO['lm-studio'].defaultProviderId,
  },
]

/**
 * Important
 * 1. When adding new default model, settings migration should be added
 * 2. If there's same model id in user's settings, it's data should be overwritten by default model
 */
export const DEFAULT_CHAT_MODELS: readonly ChatModel[] = [
  {
    providerType: 'anthropic-plan',
    providerId: PROVIDER_TYPES_INFO['anthropic-plan'].defaultProviderId,
    id: 'claude-opus-latest (plan)',
    model: 'opus',
    thinking: {
      enabled: true,
      mode: 'adaptive',
      effort: 'high',
      display: 'summarized',
    },
  },
  {
    providerType: 'anthropic-plan',
    providerId: PROVIDER_TYPES_INFO['anthropic-plan'].defaultProviderId,
    id: 'claude-default (plan)',
    model: 'default',
    thinking: {
      enabled: true,
      mode: 'adaptive',
      effort: 'high',
      display: 'summarized',
    },
  },
  {
    providerType: 'anthropic-plan',
    providerId: PROVIDER_TYPES_INFO['anthropic-plan'].defaultProviderId,
    id: 'claude-sonnet-latest (plan)',
    model: 'sonnet',
    thinking: {
      enabled: true,
      mode: 'adaptive',
      effort: 'high',
      display: 'summarized',
    },
  },
  {
    providerType: 'anthropic-plan',
    providerId: PROVIDER_TYPES_INFO['anthropic-plan'].defaultProviderId,
    id: 'claude-haiku-latest (plan)',
    model: 'haiku',
  },
  {
    providerType: 'anthropic-plan',
    providerId: PROVIDER_TYPES_INFO['anthropic-plan'].defaultProviderId,
    id: 'claude-fable-latest (plan)',
    model: 'fable',
    thinking: {
      enabled: true,
      mode: 'adaptive',
      effort: 'high',
      display: 'summarized',
    },
  },
  // Pinned versions; they need Claude Code 2.1.280 (5.5) or 2.1.257 (Fable 5.1).
  {
    providerType: 'anthropic-plan',
    providerId: PROVIDER_TYPES_INFO['anthropic-plan'].defaultProviderId,
    id: 'claude-opus-5.5 (plan)',
    model: 'claude-opus-5-5',
    thinking: {
      enabled: true,
      mode: 'adaptive',
      effort: 'high',
      display: 'summarized',
    },
  },
  {
    providerType: 'anthropic-plan',
    providerId: PROVIDER_TYPES_INFO['anthropic-plan'].defaultProviderId,
    id: 'claude-sonnet-5.5 (plan)',
    model: 'claude-sonnet-5-5',
    thinking: {
      enabled: true,
      mode: 'adaptive',
      effort: 'high',
      display: 'summarized',
    },
  },
  {
    providerType: 'anthropic-plan',
    providerId: PROVIDER_TYPES_INFO['anthropic-plan'].defaultProviderId,
    id: 'claude-fable-5.1 (plan)',
    model: 'claude-fable-5-1',
    thinking: {
      enabled: true,
      mode: 'adaptive',
      effort: 'high',
      display: 'summarized',
    },
  },
  {
    providerType: 'openai-plan',
    providerId: PROVIDER_TYPES_INFO['openai-plan'].defaultProviderId,
    id: 'gpt-6.1-sol (plan)',
    model: 'gpt-6.1-sol',
    reasoning: {
      reasoning_effort: 'medium',
    },
  },
  {
    providerType: 'openai-plan',
    providerId: PROVIDER_TYPES_INFO['openai-plan'].defaultProviderId,
    id: 'gpt-6-sol (plan)',
    model: 'gpt-6-sol',
    reasoning: {
      reasoning_effort: 'medium',
    },
  },
  {
    providerType: 'openai-plan',
    providerId: PROVIDER_TYPES_INFO['openai-plan'].defaultProviderId,
    id: 'gpt-6-luna (plan)',
    model: 'gpt-6-luna',
    reasoning: {
      reasoning_effort: 'medium',
    },
  },
  {
    providerType: 'openai-plan',
    providerId: PROVIDER_TYPES_INFO['openai-plan'].defaultProviderId,
    id: 'gpt-5.6-sol (plan)',
    model: 'gpt-5.6-sol',
    reasoning: {
      reasoning_effort: 'medium',
    },
  },
  {
    providerType: 'openai-plan',
    providerId: PROVIDER_TYPES_INFO['openai-plan'].defaultProviderId,
    id: 'gpt-5.6-terra (plan)',
    model: 'gpt-5.6-terra',
    reasoning: {
      reasoning_effort: 'low',
    },
  },
  {
    providerType: 'openai-plan',
    providerId: PROVIDER_TYPES_INFO['openai-plan'].defaultProviderId,
    id: 'gpt-5.6-luna (plan)',
    model: 'gpt-5.6-luna',
    reasoning: {
      reasoning_effort: 'none',
    },
  },
  // Antigravity model IDs carry the effort tier; `agy models` lists the rest.
  {
    providerType: 'gemini-plan',
    providerId: PROVIDER_TYPES_INFO['gemini-plan'].defaultProviderId,
    id: 'gemini-3.1-pro-high (plan)',
    model: 'gemini-3.1-pro-high',
  },
  {
    providerType: 'gemini-plan',
    providerId: PROVIDER_TYPES_INFO['gemini-plan'].defaultProviderId,
    id: 'gemini-3.8-flash-medium (plan)',
    model: 'gemini-3.8-flash-medium',
  },
  {
    providerType: 'openai-plan',
    providerId: PROVIDER_TYPES_INFO['openai-plan'].defaultProviderId,
    id: 'gpt-6-astra (plan)',
    model: 'gpt-6-astra',
    reasoning: {
      reasoning_effort: 'low',
    },
    enable: false,
  },
  {
    providerType: 'anthropic',
    providerId: PROVIDER_TYPES_INFO.anthropic.defaultProviderId,
    id: 'claude-opus-5.5',
    model: 'claude-opus-5-5',
    thinking: { enabled: true, budget_tokens: 8192, effort: 'high' },
  },
  {
    providerType: 'anthropic',
    providerId: PROVIDER_TYPES_INFO.anthropic.defaultProviderId,
    id: 'claude-sonnet-5.5',
    model: 'claude-sonnet-5-5',
    thinking: { enabled: true, budget_tokens: 8192, effort: 'high' },
  },
  {
    providerType: 'anthropic',
    providerId: PROVIDER_TYPES_INFO.anthropic.defaultProviderId,
    id: 'claude-fable-5.1',
    model: 'claude-fable-5-1',
    thinking: { enabled: true, budget_tokens: 8192, effort: 'high' },
  },
  {
    providerType: 'anthropic',
    providerId: PROVIDER_TYPES_INFO.anthropic.defaultProviderId,
    id: 'claude-opus-5',
    model: 'claude-opus-5',
    thinking: { enabled: true, budget_tokens: 8192, effort: 'high' },
  },
  {
    providerType: 'anthropic',
    providerId: PROVIDER_TYPES_INFO.anthropic.defaultProviderId,
    id: 'claude-sonnet-5',
    model: 'claude-sonnet-5',
    thinking: { enabled: true, budget_tokens: 8192, effort: 'high' },
  },
  {
    providerType: 'anthropic',
    providerId: PROVIDER_TYPES_INFO.anthropic.defaultProviderId,
    id: 'claude-opus-4.8',
    model: 'claude-opus-4-8',
  },
  {
    providerType: 'anthropic',
    providerId: PROVIDER_TYPES_INFO.anthropic.defaultProviderId,
    id: 'claude-sonnet-4.6',
    model: 'claude-sonnet-4-6',
  },
  {
    providerType: 'anthropic',
    providerId: PROVIDER_TYPES_INFO.anthropic.defaultProviderId,
    id: 'claude-haiku-4.5',
    model: 'claude-haiku-4-5',
  },
  {
    providerType: 'openai',
    providerId: PROVIDER_TYPES_INFO.openai.defaultProviderId,
    id: 'gpt-6.1-sol',
    model: 'gpt-6.1-sol',
  },
  {
    providerType: 'openai',
    providerId: PROVIDER_TYPES_INFO.openai.defaultProviderId,
    id: 'gpt-6-astra',
    model: 'gpt-6-astra',
  },
  {
    providerType: 'openai',
    providerId: PROVIDER_TYPES_INFO.openai.defaultProviderId,
    id: 'gpt-6-sol',
    model: 'gpt-6-sol',
  },
  {
    providerType: 'openai',
    providerId: PROVIDER_TYPES_INFO.openai.defaultProviderId,
    id: 'gpt-6-luna',
    model: 'gpt-6-luna',
  },
  {
    providerType: 'openai',
    providerId: PROVIDER_TYPES_INFO.openai.defaultProviderId,
    id: 'gpt-5.5',
    model: 'gpt-5.5',
  },
  {
    providerType: 'openai',
    providerId: PROVIDER_TYPES_INFO.openai.defaultProviderId,
    id: 'gpt-4.1-mini',
    model: 'gpt-4.1-mini',
  },
  {
    providerType: 'gemini',
    providerId: PROVIDER_TYPES_INFO.gemini.defaultProviderId,
    id: 'gemini-3.8-flash',
    model: 'gemini-3.8-flash',
  },
  {
    providerType: 'gemini',
    providerId: PROVIDER_TYPES_INFO.gemini.defaultProviderId,
    id: 'gemini-3.1-pro-preview',
    model: 'gemini-3.1-pro-preview',
  },
  {
    providerType: 'gemini',
    providerId: PROVIDER_TYPES_INFO.gemini.defaultProviderId,
    id: 'gemini-3.5-flash-lite',
    model: 'gemini-3.5-flash-lite',
  },
  {
    providerType: 'deepseek',
    providerId: PROVIDER_TYPES_INFO.deepseek.defaultProviderId,
    id: 'deepseek-flash',
    model: 'deepseek-flash',
  },
  {
    providerType: 'deepseek',
    providerId: PROVIDER_TYPES_INFO.deepseek.defaultProviderId,
    id: 'deepseek-v4-pro',
    model: 'deepseek-v4-pro',
  },
  {
    providerType: 'xai',
    providerId: PROVIDER_TYPES_INFO.xai.defaultProviderId,
    id: 'grok-4.7',
    model: 'grok-4.7',
  },
  {
    providerType: 'xai',
    providerId: PROVIDER_TYPES_INFO.xai.defaultProviderId,
    id: 'grok-4.3',
    model: 'grok-4.3',
  },
]

/**
 * Important
 * 1. When adding new default embedding model, settings migration should be added
 * 2. If there's same embedding model id in user's settings, it's data should be overwritten by default embedding model
 */
export const DEFAULT_EMBEDDING_MODELS: readonly EmbeddingModel[] = [
  {
    providerType: 'openai',
    providerId: PROVIDER_TYPES_INFO.openai.defaultProviderId,
    id: 'openai/text-embedding-3-small',
    model: 'text-embedding-3-small',
    dimension: 1536,
  },
  {
    providerType: 'openai',
    providerId: PROVIDER_TYPES_INFO.openai.defaultProviderId,
    id: 'openai/text-embedding-3-large',
    model: 'text-embedding-3-large',
    dimension: 3072,
  },
  {
    // text-embedding-004 shut down on 2026-01-14. Requested at 768 dimensions
    // to stay within the vector index limit (R-045).
    providerType: 'gemini',
    providerId: PROVIDER_TYPES_INFO.gemini.defaultProviderId,
    id: 'gemini/gemini-embedding-2',
    model: 'gemini-embedding-2',
    dimension: 768,
    outputDimension: 768,
  },
  {
    providerType: 'ollama',
    providerId: PROVIDER_TYPES_INFO.ollama.defaultProviderId,
    id: 'ollama/nomic-embed-text',
    model: 'nomic-embed-text',
    dimension: 768,
  },
  {
    providerType: 'ollama',
    providerId: PROVIDER_TYPES_INFO.ollama.defaultProviderId,
    id: 'ollama/mxbai-embed-large',
    model: 'mxbai-embed-large',
    dimension: 1024,
  },
  {
    providerType: 'ollama',
    providerId: PROVIDER_TYPES_INFO.ollama.defaultProviderId,
    id: 'ollama/bge-m3',
    model: 'bge-m3',
    dimension: 1024,
  },
]

// Pricing in dollars per million tokens (standard tier, checked 2026-10-01;
// sources in R-045). Long-context and off-peak rates are not modelled.
type ModelPricing = {
  input: number
  output: number
}

export const OPENAI_PRICES: Record<string, ModelPricing> = {
  'gpt-6.1-sol': { input: 2, output: 10 },
  'gpt-6-sol': { input: 2, output: 10 },
  'gpt-6-astra': { input: 10, output: 50 },
  'gpt-6-luna': { input: 0.1, output: 0.5 },
  'gpt-5.6-sol': { input: 4, output: 20 },
  'gpt-5.6-terra': { input: 2, output: 12 },
  'gpt-5.6-luna': { input: 0.2, output: 1.2 },
  'gpt-5.5': { input: 5, output: 30 },
  'gpt-5.2': { input: 1.75, output: 14 },
  'gpt-5.1': { input: 1.25, output: 10 },
  'gpt-5': { input: 1.25, output: 10 },
  'gpt-5-mini': { input: 0.25, output: 2 },
  'gpt-5-nano': { input: 0.05, output: 0.4 },
  'gpt-4.1': { input: 2.0, output: 8.0 },
  'gpt-4.1-mini': { input: 0.4, output: 1.6 },
  'gpt-4.1-nano': { input: 0.1, output: 0.4 },
  'gpt-4o': { input: 2.5, output: 10 },
  'gpt-4o-mini': { input: 0.15, output: 0.6 },
  o3: { input: 10, output: 40 },
  o1: { input: 15, output: 60 },
  'o4-mini': { input: 1.1, output: 4.4 },
  'o3-mini': { input: 1.1, output: 4.4 },
  'o1-mini': { input: 1.1, output: 4.4 },
}

export const ANTHROPIC_PRICES: Record<string, ModelPricing> = {
  'claude-opus-5-5': { input: 4, output: 20 },
  'claude-sonnet-5-5': { input: 2, output: 10 },
  'claude-fable-5-1': { input: 10, output: 50 },
  'claude-opus-5': { input: 5, output: 25 },
  'claude-sonnet-5': { input: 2, output: 10 },
  'claude-opus-4-8': { input: 5, output: 25 },
  'claude-sonnet-4-6': { input: 3, output: 15 },
  'claude-opus-4-5': { input: 5, output: 25 },
  'claude-opus-4-1': { input: 15, output: 75 },
  'claude-opus-4-0': { input: 15, output: 75 },
  'claude-sonnet-4-5': { input: 3, output: 15 },
  'claude-sonnet-4-0': { input: 3, output: 15 },
  'claude-3-5-sonnet-latest': { input: 3, output: 15 },
  'claude-3-7-sonnet-latest': { input: 3, output: 15 },
  'claude-haiku-4-5': { input: 1, output: 5 },
  'claude-3-5-haiku-latest': { input: 1, output: 5 },
}

// Prompts up to 200k tokens; Gemini 3.x Flash rises on 2027-01-01.
export const GEMINI_PRICES: Record<string, ModelPricing> = {
  'gemini-3.8-flash': { input: 0.75, output: 3.75 },
  'gemini-3.7-flash': { input: 0.75, output: 3.75 },
  'gemini-3.6-flash': { input: 0.75, output: 3.75 },
  'gemini-3.5-flash': { input: 1.5, output: 9 },
  'gemini-3.5-flash-lite': { input: 0.3, output: 2.5 },
  'gemini-3.1-flash-lite': { input: 0.25, output: 1.5 },
  'gemini-3.1-pro-preview': { input: 2, output: 12 },
  'gemini-3-flash-preview': { input: 0.5, output: 3 },
  'gemini-2.5-pro': { input: 1.25, output: 10 },
  'gemini-2.5-flash': { input: 0.3, output: 2.5 },
  'gemini-2.5-flash-lite': { input: 0.1, output: 0.4 },
}

// Prompts under 200k tokens.
export const XAI_PRICES: Record<string, ModelPricing> = {
  'grok-4.7': { input: 2, output: 6 },
  'grok-4.6': { input: 2, output: 6 },
  'grok-4.5': { input: 2, output: 6 },
  'grok-4.3': { input: 1.25, output: 2.5 },
}

// Peak-hour cache-miss rates; off-peak hours cost half.
export const DEEPSEEK_PRICES: Record<string, ModelPricing> = {
  'deepseek-flash': { input: 0.3, output: 1.2 },
  'deepseek-v4-pro': { input: 1.32, output: 3.96 },
}
