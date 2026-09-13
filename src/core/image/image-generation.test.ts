import { extractGeminiImage } from '../llm/geminiImage'
import { getProviderCapabilities } from '../llm/providerCapabilities'
import { extractXaiImage } from '../llm/xaiImage'

import {
  IMAGE_EXTENSION_BY_MIME,
  isImageGenerator,
  sniffImageMimeType,
} from './image-generator'
import {
  API_IMAGE_MODEL_CATALOG,
  isApiImageModel,
  mergeImageModelCatalog,
} from './image-model-catalog'
import {
  DEFAULT_IMAGE_PROMPT_TEMPLATES,
  applyImagePromptTemplate,
  findImagePromptTemplate,
} from './image-prompt-templates'
import { resolveImageGenerationModel } from './resolve-image-model'

const planModel = {
  providerType: 'openai-plan' as const,
  providerId: 'openai-plan',
  id: 'gpt-5.6-sol (plan)',
  model: 'gpt-5.6-sol',
}
const geminiImage = API_IMAGE_MODEL_CATALOG[0]
const chatOnly = {
  providerType: 'anthropic' as const,
  providerId: 'anthropic',
  id: 'claude-fable-5.1',
  model: 'claude-fable-5-1',
}

describe('image model catalog and capabilities', () => {
  it('marks API image models as image-only generators', () => {
    expect(isApiImageModel(geminiImage)).toBe(true)
    expect(getProviderCapabilities(geminiImage)).toMatchObject({
      imageGeneration: true,
      imageOnly: true,
      plan: false,
    })
    expect(getProviderCapabilities(planModel)).toMatchObject({
      imageGeneration: true,
      imageOnly: false,
      plan: true,
    })
    expect(getProviderCapabilities(chatOnly).imageGeneration).toBe(false)
  })

  it('merges missing catalog models without touching existing entries', () => {
    const merged = mergeImageModelCatalog([
      { ...geminiImage, enable: false },
      chatOnly,
    ]) as { id: string; enable?: boolean }[]
    expect(merged.map((m) => m.id)).toEqual([
      geminiImage.id,
      chatOnly.id,
      ...API_IMAGE_MODEL_CATALOG.slice(1).map((m) => m.id),
    ])
    expect(merged[0].enable).toBe(false)
    expect(mergeImageModelCatalog('nope')).toBe('nope')
  })
})

describe('resolveImageGenerationModel', () => {
  const base = { chatModels: [planModel, geminiImage, chatOnly] }
  it('prefers the configured image model', () => {
    expect(
      resolveImageGenerationModel({
        ...base,
        chatModelId: chatOnly.id,
        imageGeneration: { modelId: geminiImage.id } as never,
      }),
    ).toMatchObject({ model: geminiImage, usedChatModelFallback: false })
  })
  it('falls back to a capable chat model, else reports why', () => {
    expect(
      resolveImageGenerationModel({
        ...base,
        chatModelId: planModel.id,
        imageGeneration: { modelId: '' } as never,
      }),
    ).toMatchObject({ model: planModel, usedChatModelFallback: true })
    expect(
      resolveImageGenerationModel({
        ...base,
        chatModelId: chatOnly.id,
        imageGeneration: { modelId: '' } as never,
      }).model,
    ).toBeNull()
  })
})

describe('generated image helpers', () => {
  it('sniffs png, jpeg, webp and maps extensions', () => {
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 0, 0, 0, 0, 0])
    const jpg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0])
    const webp = new Uint8Array([
      0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50,
    ])
    expect(sniffImageMimeType(png.buffer)).toBe('image/png')
    expect(sniffImageMimeType(jpg.buffer)).toBe('image/jpeg')
    expect(sniffImageMimeType(webp.buffer)).toBe('image/webp')
    expect(sniffImageMimeType(new Uint8Array([1, 2, 3]).buffer)).toBeNull()
    expect(IMAGE_EXTENSION_BY_MIME['image/jpeg']).toBe('jpg')
  })
  it('detects generators and extracts provider payloads', () => {
    expect(isImageGenerator({ generateImage: () => undefined })).toBe(true)
    expect(isImageGenerator({})).toBe(false)
    expect(
      extractGeminiImage({
        candidates: [
          {
            content: {
              parts: [
                { text: 'here' },
                { inlineData: { data: 'AAA', mimeType: 'image/png' } },
              ],
            },
          },
        ],
      }),
    ).toEqual({ base64: 'AAA', mimeType: 'image/png' })
    expect(() => extractGeminiImage({ candidates: [] })).toThrow('no image')
    expect(
      extractXaiImage({ data: [{ url: 'x' }, { b64_json: 'BBB' }] }),
    ).toEqual({
      base64: 'BBB',
    })
    expect(() => extractXaiImage({ data: [] })).toThrow('no image data')
  })
})

describe('image prompt templates', () => {
  it('prepends the template and keeps the brief last', () => {
    const template = findImagePromptTemplate(
      DEFAULT_IMAGE_PROMPT_TEMPLATES,
      'infographic',
    )
    expect(template?.name).toBe('Infographic')
    const prompt = applyImagePromptTemplate(
      '  quarterly revenue by region ',
      template,
    )
    expect(prompt.startsWith('Flat infographic')).toBe(true)
    expect(prompt.endsWith('quarterly revenue by region')).toBe(true)
    expect(applyImagePromptTemplate('a cat', undefined)).toBe('a cat')
    expect(
      applyImagePromptTemplate('a cat', { id: 'x', name: 'x', prompt: '  ' }),
    ).toBe('a cat')
    expect(
      findImagePromptTemplate(DEFAULT_IMAGE_PROMPT_TEMPLATES, ''),
    ).toBeUndefined()
  })
})
