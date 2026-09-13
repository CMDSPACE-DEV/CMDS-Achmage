import { App, normalizePath } from 'obsidian'

export async function ensureVaultFolder(app: App, path: string): Promise<void> {
  if (!path || app.vault.getAbstractFileByPath(path)) return
  let current = ''
  for (const part of path.split('/')) {
    current = current ? `${current}/${part}` : part
    if (!app.vault.getAbstractFileByPath(current)) {
      await app.vault.createFolder(current)
    }
  }
}

export function sanitizeImageFilename(value: string): string {
  return value
    .replace(/[\\/:*?"<>|#^[\]]/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .replace(/[.\s-]+$/g, '')
}

/** Saves bytes under `folder/stem(-n).ext`, never overwriting. Returns the vault path. */
export async function saveImageToVault(
  app: App,
  folder: string,
  stem: string,
  extension: string,
  bytes: ArrayBuffer,
): Promise<string> {
  const normalizedFolder = normalizePath(folder)
  await ensureVaultFolder(app, normalizedFolder)
  const safeStem = sanitizeImageFilename(stem) || 'image'
  for (let index = 0; index < 10_000; index += 1) {
    const suffix = index === 0 ? '' : `-${index}`
    const candidate = normalizePath(
      `${normalizedFolder ? `${normalizedFolder}/` : ''}${safeStem}${suffix}.${extension}`,
    )
    if (!app.vault.getAbstractFileByPath(candidate)) {
      await app.vault.createBinary(candidate, bytes)
      return candidate
    }
  }
  throw new Error('Unable to allocate a unique image filename.')
}
