import { ChatModel } from '../../types/chat-model.types'
import {
  LLMOptions,
  LLMRequestNonStreaming,
  LLMRequestStreaming,
} from '../../types/llm/request'
import {
  LLMResponseNonStreaming,
  LLMResponseStreaming,
} from '../../types/llm/response'
import { LLMProvider } from '../../types/provider.types'
import { postStream } from '../../utils/llm/httpTransport'
import { parseJsonSseStream } from '../../utils/llm/sse'

import { BaseLLMProvider } from './base'
import { extractCodexAccountId, refreshCodexAccessToken } from './codexAuth'
import { CodexMessageAdapter, CodexRequestError } from './codexMessageAdapter'
import {
  LLMAPIKeyInvalidException,
  LLMAPIKeyNotSetException,
} from './exception'
import {
  DiscoveredModel,
  JsonGetter,
  fetchCodexPlanModels,
} from './modelDiscovery'
import { normalizeOpenAIPlanEffort } from './openaiPlanModels'

export type { Gpt56Effort } from '../../types/chat-model.types'

const OAUTH_REFRESH_SKEW_MS = 60_000
const CODEX_RESPONSES_ENDPOINT =
  'https://chatgpt.com/backend-api/codex/responses'

type CodexImageStreamEvent = {
  type: string
  partial_image_index?: number
  item?: {
    type?: string
    result?: string
  }
  response?: {
    output?: {
      type?: string
      result?: string
    }[]
  }
}

export type PlanImageResult = {
  base64: string
  mimeType: 'image/png'
}

type CodexImageContentPart =
  | { type: 'input_text'; text: string }
  | { type: 'input_image'; image_url: string; detail: 'auto' }

/** Reference images first, then the brief — the order the Responses API expects. */
export function buildCodexImageContent(
  prompt: string,
  referenceImages: string[],
): CodexImageContentPart[] {
  return [
    ...referenceImages.map(
      (url): CodexImageContentPart => ({
        type: 'input_image',
        image_url: url,
        detail: 'auto',
      }),
    ),
    { type: 'input_text', text: prompt },
  ]
}

export class OpenAICodexProvider extends BaseLLMProvider<
  Extract<LLMProvider, { type: 'openai-plan' }>
> {
  private adapter: CodexMessageAdapter
  private onProviderUpdate?: (
    providerId: string,
    update: Partial<LLMProvider>,
  ) => void | Promise<void>
  private imageEndpoint: string
  private fetchFn?: typeof fetch

  constructor(
    provider: Extract<LLMProvider, { type: 'openai-plan' }>,
    onProviderUpdate?: (
      providerId: string,
      update: Partial<LLMProvider>,
    ) => void | Promise<void>,
    transport: {
      endpoint?: string
      fetchFn?: typeof fetch
    } = {},
  ) {
    super(provider)
    this.imageEndpoint = transport.endpoint ?? CODEX_RESPONSES_ENDPOINT
    this.fetchFn = transport.fetchFn
    this.adapter = new CodexMessageAdapter({
      endpoint: this.imageEndpoint,
      fetchFn: this.fetchFn,
    })
    this.onProviderUpdate = onProviderUpdate
  }

  async generateResponse(
    model: ChatModel,
    request: LLMRequestNonStreaming,
    options?: LLMOptions,
  ): Promise<LLMResponseNonStreaming> {
    if (model.providerType !== 'openai-plan') {
      throw new Error('Model is not an OpenAI Codex model')
    }

    const normalizedRequest = this.normalizeRequest(model, request)
    return this.withAuthRetry((authHeaders) =>
      this.adapter.generateResponse(normalizedRequest, options, authHeaders),
    )
  }

  async streamResponse(
    model: ChatModel,
    request: LLMRequestStreaming,
    options?: LLMOptions,
  ): Promise<AsyncIterable<LLMResponseStreaming>> {
    if (model.providerType !== 'openai-plan') {
      throw new Error('Model is not an OpenAI Codex model')
    }

    const normalizedRequest = this.normalizeRequest(model, request)
    return this.withAuthRetry((authHeaders) =>
      this.adapter.streamResponse(normalizedRequest, options, authHeaders),
    )
  }

  async getEmbedding(
    _model: string,
    _text: string,
    _options?: { dimensions?: number },
  ): Promise<number[]> {
    throw new Error(
      `Provider ${this.provider.id} does not support embeddings. Please use a different provider.`,
    )
  }

  async generateImage(
    model: ChatModel,
    prompt: string,
    options: {
      quality: 'low' | 'medium' | 'high'
      referenceImages?: string[]
      signal?: AbortSignal
      onProgress?: (phase: string, partialImageIndex?: number) => void
    },
  ): Promise<PlanImageResult> {
    if (model.providerType !== 'openai-plan') {
      throw new Error('Native image generation requires a GPT Plan model.')
    }
    return this.withAuthRetry(async (authHeaders) => {
      const stream = await postStream(
        this.imageEndpoint,
        {
          model: model.model,
          input: [
            {
              role: 'user',
              content: buildCodexImageContent(
                prompt,
                options.referenceImages ?? [],
              ),
            },
          ],
          instructions: 'Use the image generation tool exactly once.',
          store: false,
          stream: true,
          include: ['reasoning.encrypted_content'],
          reasoning: {
            effort: normalizeOpenAIPlanEffort(
              model.model,
              model.reasoning?.reasoning_effort,
            ),
          },
          tools: [
            {
              type: 'image_generation',
              quality: options.quality,
              size: '1536x1024',
              output_format: 'png',
            },
          ],
          tool_choice: { type: 'image_generation' },
        },
        {
          headers: authHeaders,
          signal: options.signal,
          fetchFn: this.fetchFn,
        },
      )

      let result: string | undefined
      for await (const event of parseJsonSseStream<CodexImageStreamEvent>(
        stream,
      )) {
        if (event.type === 'response.image_generation_call.in_progress') {
          options.onProgress?.('generating')
        } else if (event.type === 'response.image_generation_call.generating') {
          options.onProgress?.('rendering')
        } else if (
          event.type === 'response.image_generation_call.partial_image'
        ) {
          options.onProgress?.('receiving', event.partial_image_index)
        }
        if (event.item?.type === 'image_generation_call' && event.item.result) {
          result = event.item.result
        }
        if (event.type === 'response.completed') {
          result =
            event.response?.output?.find(
              (item) => item.type === 'image_generation_call' && item.result,
            )?.result ?? result
        }
      }
      if (!result) {
        throw new Error('Plan image generation completed without an image.')
      }
      return { base64: result, mimeType: 'image/png' }
    })
  }

  /**
   * Models this ChatGPT account can use through Codex right now. Shares the
   * token refresh and single 401 retry with chat requests.
   */
  async listPlanModels(getJson: JsonGetter): Promise<DiscoveredModel[]> {
    return this.withAuthRetry((headers) =>
      fetchCodexPlanModels(headers, getJson),
    )
  }

  private async withAuthRetry<T>(
    request: (headers: Record<string, string>) => Promise<T>,
  ): Promise<T> {
    const authHeaders = await this.getAuthHeaders()
    try {
      return await request(authHeaders)
    } catch (error) {
      const status =
        error instanceof CodexRequestError
          ? error.status
          : typeof error === 'object' &&
              error !== null &&
              'status' in error &&
              typeof error.status === 'number'
            ? error.status
            : undefined
      if (status !== 401) {
        throw error
      }

      // A request can race token expiry even with the proactive skew. Refresh
      // once and only once; other statuses must surface without a fallback.
      const refreshedHeaders = await this.getAuthHeaders(true)
      return request(refreshedHeaders)
    }
  }

  private async getAuthHeaders(
    forceRefresh = false,
  ): Promise<Record<string, string>> {
    if (!this.provider.oauth?.refreshToken) {
      throw new LLMAPIKeyNotSetException(
        `Provider ${this.provider.id} OAuth credentials are missing. Please log in.`,
      )
    }

    if (
      forceRefresh ||
      !this.provider.oauth.accessToken ||
      this.provider.oauth.expiresAt <= Date.now() + OAUTH_REFRESH_SKEW_MS
    ) {
      try {
        const tokens = await refreshCodexAccessToken(
          this.provider.oauth.refreshToken,
        )
        const accountId = extractCodexAccountId(tokens)
        const updatedOauth = {
          accessToken: tokens.access_token,
          refreshToken:
            tokens.refresh_token ?? this.provider.oauth.refreshToken,
          expiresAt: Date.now() + (tokens.expires_in ?? 3600) * 1000,
          accountId: accountId ?? this.provider.oauth.accountId,
        }
        this.provider.oauth = updatedOauth
        await this.onProviderUpdate?.(this.provider.id, {
          oauth: updatedOauth,
        })
      } catch (error) {
        throw new LLMAPIKeyInvalidException(
          'OpenAI Codex OAuth token refresh failed. Please log in again.',
          error instanceof Error ? error : undefined,
        )
      }
    }

    const headers: Record<string, string> = {
      authorization: `Bearer ${this.provider.oauth.accessToken}`,
    }

    if (this.provider.oauth.accountId) {
      headers['ChatGPT-Account-Id'] = this.provider.oauth.accountId
    }

    return headers
  }

  private normalizeRequest<
    T extends LLMRequestNonStreaming | LLMRequestStreaming,
  >(model: Extract<ChatModel, { providerType: 'openai-plan' }>, request: T): T {
    const reasoningEffort = normalizeOpenAIPlanEffort(
      model.model,
      model.reasoning?.reasoning_effort,
    )
    const reasoningSummary = model.reasoning?.reasoning_summary
    return {
      ...request,
      // The selected ChatModel is authoritative. Callers often reuse a request
      // object across providers, so accepting request.model here can silently send
      // a Plan request to the wrong Codex tier.
      model: model.model,
      reasoning_effort: reasoningEffort,
      reasoning_summary:
        reasoningEffort !== 'none' && reasoningSummary
          ? reasoningSummary
          : undefined,
      // The installed SDK type predates the `max` effort. The adapter narrows
      // a local wire type without requiring a broad SDK upgrade.
    }
  }
}
