import { App, FileSystemAdapter } from 'obsidian'

import { SmartComposerSettings } from '../../settings/schema/setting.types'
import { ArtifactRecord } from '../../types/background-task'

import { readCmdsEagleLibraryProfiles } from './CmdsEagleBridge'
import { EagleClient, normalizeLibraryPath } from './eagle-client'
import { EagleDeliveryResult, deliverToEagle } from './image-delivery'

export type EagleArtifactMetadata = {
  eagleItemId: string
  eagleLibraryPath: string
  eagleDeeplink: string
  eagleMarkdown: string
}

export function readEagleArtifactMetadata(
  artifact: ArtifactRecord | undefined,
): EagleArtifactMetadata | null {
  const m = artifact?.metadata
  if (
    !m ||
    typeof m.eagleItemId !== 'string' ||
    typeof m.eagleMarkdown !== 'string'
  ) {
    return null
  }
  return {
    eagleItemId: m.eagleItemId,
    eagleLibraryPath: String(m.eagleLibraryPath ?? ''),
    eagleDeeplink: String(m.eagleDeeplink ?? `eagle://item/${m.eagleItemId}`),
    eagleMarkdown: m.eagleMarkdown,
  }
}

function stem(path: string): string {
  const name = path.slice(path.lastIndexOf('/') + 1)
  const dot = name.lastIndexOf('.')
  return dot > 0 ? name.slice(0, dot) : name
}

/**
 * Imports a saved image artifact into the configured Eagle library and returns
 * the artifact with the Eagle result recorded in its metadata. Used by the task
 * adapter (automatic destination) and by the task card (Send to Eagle button).
 */
export async function importArtifactToEagle({
  app,
  settings,
  artifact,
  annotation,
  onStatus,
}: {
  app: App
  settings: SmartComposerSettings
  artifact: ArtifactRecord
  annotation?: string
  onStatus?: (message: string) => void
}): Promise<{ artifact: ArtifactRecord; result: EagleDeliveryResult }> {
  if (!artifact.localPath) throw new Error('The image has no vault copy.')
  const adapter = app.vault.adapter
  if (!(adapter instanceof FileSystemAdapter)) {
    throw new Error('Eagle import needs a local file system vault.')
  }
  const target = settings.imageGeneration.eagle
  const profile = readCmdsEagleLibraryProfiles(app).find(
    (entry) =>
      target.libraryPath &&
      normalizeLibraryPath(entry.path) ===
        normalizeLibraryPath(target.libraryPath),
  )
  const result = await deliverToEagle(
    new EagleClient(target.apiBaseUrl),
    {
      absolutePath: adapter.getFullPath(artifact.localPath),
      name: stem(artifact.localPath),
      vaultEmbed: `![[${artifact.localPath}]]`,
      annotation,
      target,
      fallbackFolderId: profile?.defaultFolderId
        ? profile.defaultFolderId
        : undefined,
    },
    { onStatus },
  )
  return {
    result,
    artifact: {
      ...artifact,
      metadata: {
        ...artifact.metadata,
        eagleItemId: result.itemId,
        eagleLibraryPath: result.libraryPath,
        eagleDeeplink: result.deeplink,
        eagleMarkdown: result.markdown,
      },
    },
  }
}
