import { ChatModel } from '../../types/chat-model.types'

export type GeneratedImage = {
  base64: string
  /** Declared by the provider when known; the adapter sniffs the bytes otherwise. */
  mimeType?: string
}

export type ImageGenerationOptions = {
  quality: 'low' | 'medium' | 'high'
  signal?: AbortSignal
  onProgress?: (phase: string, partialImageIndex?: number) => void
}

/** Implemented by providers that can render an image from a prompt (R-035). */
export type ImageGenerator = {
  generateImage(
    model: ChatModel,
    prompt: string,
    options: ImageGenerationOptions,
  ): Promise<GeneratedImage>
}

export function isImageGenerator(client: unknown): client is ImageGenerator {
  return (
    !!client &&
    typeof client === 'object' &&
    typeof (client as { generateImage?: unknown }).generateImage === 'function'
  )
}

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47]
const JPEG_SIGNATURE = [0xff, 0xd8, 0xff]
const WEBP_RIFF = [0x52, 0x49, 0x46, 0x46]
const WEBP_TAG = [0x57, 0x45, 0x42, 0x50]

function startsWith(bytes: Uint8Array, signature: number[], offset = 0) {
  return signature.every((value, index) => bytes[offset + index] === value)
}

/** Providers do not always declare the format (Grok returns JPEG), so read the magic bytes. */
export function sniffImageMimeType(buffer: ArrayBuffer): string | null {
  const bytes = new Uint8Array(buffer, 0, Math.min(buffer.byteLength, 12))
  if (startsWith(bytes, PNG_SIGNATURE)) return 'image/png'
  if (startsWith(bytes, JPEG_SIGNATURE)) return 'image/jpeg'
  if (startsWith(bytes, WEBP_RIFF) && startsWith(bytes, WEBP_TAG, 8)) {
    return 'image/webp'
  }
  return null
}

export const IMAGE_EXTENSION_BY_MIME: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
}
