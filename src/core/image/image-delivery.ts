import { EagleClient, normalizeLibraryPath } from './eagle-client'
import {
  EagleItemSummary,
  buildEagleMarkdown,
  buildEagleOriginalPath,
} from './eagle-paths'
import { EagleTarget, parseEagleTags } from './image-destination'

export type EagleDeliveryInput = {
  /** Absolute file system path of the saved vault copy. */
  absolutePath: string
  /** Item name inside Eagle (file stem). */
  name: string
  /** `![[vault/path.png]]` for the vault-embed link style. */
  vaultEmbed: string
  /** Stored as the Eagle item annotation (the generation prompt). */
  annotation?: string
  target: EagleTarget
  /** Folder to use when `target.folderId` is empty (e.g. a CMDS Eagle profile default). */
  fallbackFolderId?: string
}

export type EagleDeliveryResult = {
  itemId: string
  item: EagleItemSummary
  libraryPath: string
  originalPath: string
  deeplink: string
  markdown: string
  /** True when Eagle was switched to another library for the import. */
  switchedLibrary: boolean
  /** Non-fatal problems, e.g. Eagle stayed on the target library afterwards. */
  warnings: string[]
}

export type EagleDeliveryHooks = {
  /** Switch Eagle back to the library the user had open (default true). */
  restoreLibrary?: boolean
  onStatus?: (message: string) => void
}

/**
 * Imports the saved vault copy into the target Eagle library and returns the
 * markdown the note should carry. Throws on any failure; the caller keeps the
 * vault copy in that case, so an Eagle problem never loses the image.
 */
export async function deliverToEagle(
  client: EagleClient,
  input: EagleDeliveryInput,
  hooks: EagleDeliveryHooks = {},
): Promise<EagleDeliveryResult> {
  if (!(await client.isRunning())) {
    throw new Error('Eagle is not running or its API is unreachable.')
  }
  const active = await client.getActiveLibrary()
  if (!active) throw new Error('Eagle did not report an open library.')

  const requested = input.target.libraryPath.trim()
  const targetPath = requested || active.path
  const mustSwitch =
    normalizeLibraryPath(targetPath) !== normalizeLibraryPath(active.path)

  if (mustSwitch) {
    hooks.onStatus?.(`Switching Eagle to ${targetPath}`)
    const switched = await client.switchLibrary(targetPath)
    if (!switched.success) {
      throw new Error(switched.error ?? 'Eagle library switch failed.')
    }
  }

  const warnings: string[] = []
  try {
    hooks.onStatus?.('Importing into Eagle')
    const folderId = input.target.folderId
      ? input.target.folderId
      : input.fallbackFolderId
    const itemId = await client.addFromPath({
      path: input.absolutePath,
      name: input.name,
      annotation: input.annotation,
      tags: parseEagleTags(input.target.tags),
      folderId,
    })
    const item = await client.waitForItem(itemId)
    const originalPath = buildEagleOriginalPath(targetPath, item)
    return {
      itemId,
      item,
      libraryPath: targetPath,
      originalPath,
      deeplink: `eagle://item/${item.id}`,
      markdown: buildEagleMarkdown({
        style: input.target.linkStyle,
        item,
        originalPath,
        vaultEmbed: input.vaultEmbed,
      }),
      switchedLibrary: mustSwitch,
      warnings,
    }
  } finally {
    if (mustSwitch && hooks.restoreLibrary !== false) {
      hooks.onStatus?.(`Restoring Eagle library ${active.name}`)
      const restored = await client.switchLibrary(active.path)
      if (!restored.success) {
        warnings.push(
          `Eagle stayed on ${targetPath}: ${restored.error ?? 'switch back failed'}.`,
        )
      }
    }
  }
}
