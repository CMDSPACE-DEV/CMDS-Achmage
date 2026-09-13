import { GeneratedImage } from '../image/image-generator'

type XaiImagesResponse = {
  data?: { b64_json?: string; url?: string }[]
}

/** Grok returns JPEG bytes; the adapter sniffs the real type anyway. */
export function extractXaiImage(response: XaiImagesResponse): GeneratedImage {
  const base64 = response.data?.find((item) => item.b64_json)?.b64_json
  if (!base64) {
    throw new Error('xAI returned no image data. Try rephrasing the prompt.')
  }
  return { base64 }
}
