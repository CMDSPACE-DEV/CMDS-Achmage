import {
  App,
  arrayBufferToBase64,
  base64ToArrayBuffer,
  normalizePath,
} from 'obsidian'

import { parseImageDataUrl } from '../../utils/llm/image'

const ROOT_DIR = '.smtcmp_json_db'
export const REFERENCE_IMAGE_DIR = `${ROOT_DIR}/references`
const DEFAULT_EXTENSION = 'png'
const DEFAULT_MIME_TYPE = 'image/png'
const EXTENSION_BY_MIME: Readonly<Record<string, string>> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
}
const MIME_BY_EXTENSION: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(EXTENSION_BY_MIME).map(([mime, ext]) => [ext, mime]),
)

export type ReferenceImageInput = {
  name: string
  mimeType: string
  /** Data URL (`data:image/png;base64,…`). */
  data: string
}

/** Writes reference images once per batch so task payloads only carry paths (R-036). */
export async function storeReferenceImages({
  app,
  images,
  batchId,
}: {
  app: App
  images: ReferenceImageInput[]
  batchId: string
}): Promise<string[]> {
  if (images.length === 0) return []
  const adapter = app.vault.adapter
  await ensureDirectory(app, ROOT_DIR)
  await ensureDirectory(app, REFERENCE_IMAGE_DIR)
  const paths: string[] = []
  for (const [index, image] of images.entries()) {
    const { mimeType, base64Data } = parseImageDataUrl(image.data)
    const extension = EXTENSION_BY_MIME[mimeType] ?? DEFAULT_EXTENSION
    const path = normalizePath(
      `${REFERENCE_IMAGE_DIR}/${batchId}-${index}.${extension}`,
    )
    await adapter.writeBinary(path, base64ToArrayBuffer(base64Data))
    paths.push(path)
  }
  return paths
}

export function loadReferenceImageDataUrls({
  app,
  paths,
}: {
  app: App
  paths: string[]
}): Promise<string[]> {
  return Promise.all(
    paths.map(async (path) => {
      const extension = path.split('.').pop() ?? ''
      const mimeType = MIME_BY_EXTENSION[extension] ?? DEFAULT_MIME_TYPE
      const bytes = await app.vault.adapter.readBinary(path)
      return `data:${mimeType};base64,${arrayBufferToBase64(bytes)}`
    }),
  )
}

export function readReferenceImagePaths(
  input: Record<string, unknown>,
): string[] {
  const raw = input.referenceImagePaths
  return Array.isArray(raw)
    ? raw.filter((path): path is string => typeof path === 'string')
    : []
}

async function ensureDirectory(app: App, path: string): Promise<void> {
  const normalized = normalizePath(path)
  if (!(await app.vault.adapter.exists(normalized))) {
    await app.vault.adapter.mkdir(normalized)
  }
}
