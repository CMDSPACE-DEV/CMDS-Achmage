import type { Content, GenerateContentResponse } from '@google/genai'

import { GeneratedImage } from '../image/image-generator'

/** Generated images share the landscape format used for GPT Plan images. */
const IMAGE_ASPECT_RATIO = '3:2'
const IMAGE_SIZE_BY_QUALITY: Record<'low' | 'medium' | 'high', string> = {
  low: '1K',
  medium: '1K',
  high: '2K',
}

export function buildGeminiImageContents(prompt: string): Content[] {
  return [{ role: 'user', parts: [{ text: prompt }] }]
}

export function buildGeminiImageConfig(quality: 'low' | 'medium' | 'high') {
  return {
    responseModalities: ['TEXT', 'IMAGE'],
    imageConfig: {
      aspectRatio: IMAGE_ASPECT_RATIO,
      imageSize: IMAGE_SIZE_BY_QUALITY[quality],
    },
  }
}

export function extractGeminiImage(
  response: Pick<GenerateContentResponse, 'candidates'>,
): GeneratedImage {
  for (const candidate of response.candidates ?? []) {
    for (const part of candidate.content?.parts ?? []) {
      if (part.inlineData?.data) {
        return {
          base64: part.inlineData.data,
          mimeType: part.inlineData.mimeType,
        }
      }
    }
  }
  throw new Error('Gemini returned no image. Try rephrasing the prompt.')
}
