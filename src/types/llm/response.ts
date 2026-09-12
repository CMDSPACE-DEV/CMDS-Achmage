// These types are based on the OpenRouter API specification
// https://openrouter.ai/docs/api-reference/overview#responses

import { LLMProviderMetadata } from './provider-metadata'

export type LLMResponseBase = {
  id: string
  created?: number
  model: string
  system_fingerprint?: string
  usage?: ResponseUsage
}

/**
 * OpenAI marks `system_fingerprint` deprecated on SDK types, but the field is
 * still on the wire. Read it without touching the typed property so
 * `@typescript-eslint/no-deprecated` stays clean (disabling that rule is
 * Error-tier forbidden).
 */
export function readSystemFingerprint(payload: unknown): string | undefined {
  if (payload === null || typeof payload !== 'object') return undefined
  const value: unknown = Reflect.get(payload, 'system_fingerprint')
  return typeof value === 'string' ? value : undefined
}

export type LLMResponseNonStreaming = LLMResponseBase & {
  choices: NonStreamingChoice[]
  object: 'chat.completion'
}

export type LLMResponseStreaming = LLMResponseBase & {
  choices: StreamingChoice[]
  object: 'chat.completion.chunk'
}

export type LLMResponse = LLMResponseNonStreaming | LLMResponseStreaming

export type ResponseUsage = {
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
}

export type ResponseProviderMetadata = LLMProviderMetadata

type NonStreamingChoice = {
  finish_reason: string | null // Depends on the model. Ex: 'stop' | 'length' | 'content_filter' | 'tool_calls' | 'function_call'
  message: {
    content: string | null
    reasoning?: string | null
    role: string
    annotations?: Annotation[]
    tool_calls?: ToolCall[]
    providerMetadata?: ResponseProviderMetadata
  }
  error?: Error
}

type StreamingChoice = {
  finish_reason: string | null
  delta: {
    content?: string | null
    reasoning?: string | null
    role?: string
    annotations?: Annotation[]
    tool_calls?: ToolCallDelta[]
    providerMetadata?: ResponseProviderMetadata
  }
  error?: Error
}

// Following annotation schema from OpenAI: https://platform.openai.com/docs/guides/tools-web-search#output-and-citations
export type Annotation = {
  type: 'url_citation'
  url_citation: {
    url: string
    title?: string
    start_index?: number
    end_index?: number
  }
}

type Error = {
  code: number // See "Error Handling" section
  message: string
}

export type ToolCall = {
  id?: string
  type: 'function'
  function: {
    arguments?: string
    name: string
  }
}

export type ToolCallDelta = {
  index: number
  id?: string
  type?: 'function'
  function?: {
    arguments?: string
    name?: string
  }
}
