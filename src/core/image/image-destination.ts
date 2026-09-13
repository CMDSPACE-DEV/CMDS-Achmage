/**
 * Where a generated image goes once it is saved in the vault (R-034).
 *
 * - `ask` (default): the task card offers Keep / Insert embed / Send to Eagle / CMDS R2.
 * - `vault`: keep the file in the output folder; the card offers insert only.
 * - `eagle`: import into the configured Eagle library right after saving.
 * - `cloud`: upload through the CMDS Eagle plugin's active cloud provider (R2).
 */
export const IMAGE_DESTINATIONS = ['ask', 'vault', 'eagle', 'cloud'] as const
export type ImageDestination = (typeof IMAGE_DESTINATIONS)[number]

export const IMAGE_DESTINATION_LABELS: Record<ImageDestination, string> = {
  ask: 'Ask on every image (task card buttons)',
  vault: 'Keep in the vault folder',
  eagle: 'Send to Eagle library',
  cloud: 'Upload to cloud via CMDS Eagle (R2)',
}

/** How the note references an image that lives in Eagle. */
export const EAGLE_LINK_STYLES = [
  'vault-embed',
  'original-file',
  'deeplink',
] as const
export type EagleLinkStyle = (typeof EAGLE_LINK_STYLES)[number]

export const EAGLE_LINK_STYLE_LABELS: Record<EagleLinkStyle, string> = {
  'vault-embed': 'Vault embed (keeps the local copy, Eagle holds a duplicate)',
  'original-file': 'Eagle original file (file:// image, click opens in Eagle)',
  deeplink: 'Eagle deep link only (eagle://item/…)',
}

export const DEFAULT_EAGLE_API_BASE_URL = 'http://localhost:41595'

export type EagleTarget = {
  apiBaseUrl: string
  /** Absolute `.library` path. Empty = whatever Eagle has open. */
  libraryPath: string
  /** Folder id inside the target library. Empty = library root (or the CMDS Eagle profile default). */
  folderId: string
  /** Human-readable folder path kept next to the id for the settings UI. */
  folderPath: string
  linkStyle: EagleLinkStyle
  /** Trash the vault copy once Eagle confirms the import (never for vault-embed). */
  removeVaultCopy: boolean
  /** Comma-separated tags attached to every import. */
  tags: string
}

export const DEFAULT_EAGLE_TARGET: EagleTarget = {
  apiBaseUrl: DEFAULT_EAGLE_API_BASE_URL,
  libraryPath: '',
  folderId: '',
  folderPath: '',
  linkStyle: 'vault-embed',
  removeVaultCopy: false,
  tags: 'cmds-achmage',
}

export function parseEagleTags(value: string): string[] {
  return value
    .split(',')
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0)
}

export function isImageDestination(value: unknown): value is ImageDestination {
  return (
    typeof value === 'string' &&
    (IMAGE_DESTINATIONS as readonly string[]).includes(value)
  )
}
