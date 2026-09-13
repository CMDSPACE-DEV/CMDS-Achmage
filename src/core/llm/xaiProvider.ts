import OpenAI from 'openai'

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
import {
  GeneratedImage,
  ImageGenerationOptions,
} from '../image/image-generator'

import { BaseLLMProvider } from './base'
import { LLMAPIKeyNotSetException } from './exception'
import { OpenAIMessageAdapter } from './openaiMessageAdapter'
import { extractXaiImage } from './xaiImage'

export class XaiProvider extends BaseLLMProvider<
  Extract<LLMProvider, { type: 'xai' }>
> {
  private adapter: OpenAIMessageAdapter
  private client: OpenAI

  constructor(provider: Extract<LLMProvider, { type: 'xai' }>) {
    super(provider)
    this.adapter = new OpenAIMessageAdapter()
    this.client = new OpenAI({
      apiKey: provider.apiKey ?? '',
      baseURL: provider.baseUrl
        ? provider.baseUrl.replace(/\/+$/, '')
        : 'https://api.x.ai/v1',
      dangerouslyAllowBrowser: true,
    })
  }

  async generateResponse(
    model: ChatModel,
    request: LLMRequestNonStreaming,
    options?: LLMOptions,
  ): Promise<LLMResponseNonStreaming> {
    if (model.providerType !== 'xai') {
      throw new Error('Model is not an xAI model')
    }

    return this.adapter.generateResponse(this.client, request, options)
  }

  async streamResponse(
    model: ChatModel,
    request: LLMRequestStreaming,
    options?: LLMOptions,
  ): Promise<AsyncIterable<LLMResponseStreaming>> {
    if (model.providerType !== 'xai') {
      throw new Error('Model is not an xAI model')
    }

    return this.adapter.streamResponse(this.client, request, options)
  }

  /** Text-to-image through xAI's Images endpoint (API key; Grok has no Plan route). */
  async generateImage(
    model: ChatModel,
    prompt: string,
    options: ImageGenerationOptions,
  ): Promise<GeneratedImage> {
    if (model.providerType !== 'xai') {
      throw new Error('Model is not an xAI model')
    }
    if (!this.provider.apiKey) {
      throw new LLMAPIKeyNotSetException(
        `Provider ${String(this.provider.id)} API key is missing. Please set it in settings menu.`,
      )
    }
    options.onProgress?.('generating')
    const response = await this.client.images.generate(
      {
        model: model.model,
        prompt,
        n: 1,
        response_format: 'b64_json',
      },
      { signal: options.signal },
    )
    return extractXaiImage(response)
  }

  async getEmbedding(
    _model: string,
    _text: string,
    _options?: { dimensions?: number },
  ): Promise<number[]> {
    throw new Error(
      `Provider ${String(this.provider.id)} does not support embeddings. Please use a different provider.`,
    )
  }
}
