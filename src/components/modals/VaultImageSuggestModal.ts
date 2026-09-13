import { App, FuzzySuggestModal, TFile, arrayBufferToBase64 } from 'obsidian'

import { ReferenceImageInput } from '../../core/image/reference-image-store'

const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'webp', 'gif'])
const MIME_BY_EXTENSION: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
}

/** Picks an image file from the vault and returns it as a reference image. */
export class VaultImageSuggestModal extends FuzzySuggestModal<TFile> {
  constructor(
    app: App,
    private readonly onPick: (image: ReferenceImageInput) => void,
  ) {
    super(app)
    this.setPlaceholder('Pick an image from the vault…')
  }

  getItems(): TFile[] {
    return this.app.vault
      .getFiles()
      .filter((file) => IMAGE_EXTENSIONS.has(file.extension.toLowerCase()))
      .sort((a, b) => b.stat.mtime - a.stat.mtime)
  }

  getItemText(file: TFile): string {
    return file.path
  }

  onChooseItem(file: TFile): void {
    void (async () => {
      const bytes = await this.app.vault.readBinary(file)
      const mimeType =
        MIME_BY_EXTENSION[file.extension.toLowerCase()] ?? 'image/png'
      this.onPick({
        name: file.name,
        mimeType,
        data: `data:${mimeType};base64,${arrayBufferToBase64(bytes)}`,
      })
    })()
  }
}

export async function readVaultImageAsReference(
  app: App,
  file: TFile,
): Promise<ReferenceImageInput> {
  const bytes = await app.vault.readBinary(file)
  const mimeType =
    MIME_BY_EXTENSION[file.extension.toLowerCase()] ?? 'image/png'
  return {
    name: file.name,
    mimeType,
    data: `data:${mimeType};base64,${arrayBufferToBase64(bytes)}`,
  }
}
