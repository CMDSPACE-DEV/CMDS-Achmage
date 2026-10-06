import { App, FileSystemAdapter } from 'obsidian'

type CmdsUploadResult = {
  success: boolean
  publicUrl?: string
  error?: string
}

type CmdsCloudProvider = {
  upload(
    filePath: string,
    filename: string,
    mimeType: string,
  ): Promise<CmdsUploadResult>
}

type CmdsEagleRuntime = {
  getActiveCloudProvider?: () => CmdsCloudProvider | null
}

type AppWithPlugins = App & {
  plugins?: {
    plugins?: Record<string, unknown>
  }
}

export async function uploadWithCmdsEagle(
  app: App,
  vaultPath: string,
  mimeType: string,
): Promise<string> {
  const runtime = (app as AppWithPlugins).plugins?.plugins?.['cmds-eagle'] as
    | CmdsEagleRuntime
    | undefined
  if (!runtime) {
    throw new Error('CMDS Eagle is not installed or enabled.')
  }
  // Eagle 1.8.x retains the cloud API introduced in 1.7.x. Check the
  // integration capability rather than rejecting compatible version updates.
  if (typeof runtime.getActiveCloudProvider !== 'function') {
    throw new Error('CMDS Eagle does not expose a compatible cloud upload API.')
  }
  const provider = runtime.getActiveCloudProvider()
  if (!provider || typeof provider.upload !== 'function') {
    throw new Error('CMDS Eagle has no active cloud provider.')
  }
  if (!(app.vault.adapter instanceof FileSystemAdapter)) {
    throw new Error('CMDS Eagle upload is available on desktop vaults only.')
  }
  const filename = vaultPath.split('/').at(-1) ?? 'generated-image.png'
  const result = await provider.upload(
    app.vault.adapter.getFullPath(vaultPath),
    filename,
    mimeType,
  )
  if (!result.success || !result.publicUrl) {
    throw new Error(result.error ?? 'CMDS Eagle upload failed.')
  }
  return result.publicUrl
}

export type CmdsEagleLibraryProfile = {
  path: string
  name: string
  defaultFolderId: string
  defaultFolderPath: string
}

type CmdsEagleSettingsRuntime = {
  settings?: {
    eagleApiBaseUrl?: string
    libraries?: unknown
    defaultLibraryPath?: string
    libraryTargetMode?: string
  }
}

/**
 * CMDS Eagle remembers every library the user targeted, with a per-library
 * default folder. Reading those profiles lets the image settings offer the
 * same choices instead of asking the user to paste library paths twice.
 * Returns an empty list when the plugin is absent.
 */
export function readCmdsEagleLibraryProfiles(
  app: App,
): CmdsEagleLibraryProfile[] {
  const runtime = (app as AppWithPlugins).plugins?.plugins?.['cmds-eagle'] as
    | CmdsEagleSettingsRuntime
    | undefined
  const raw = runtime?.settings?.libraries
  if (!Array.isArray(raw)) return []
  return raw
    .filter(
      (entry): entry is Record<string, unknown> =>
        !!entry && typeof entry === 'object',
    )
    .map((entry) => ({
      path: typeof entry.path === 'string' ? entry.path : '',
      name: typeof entry.name === 'string' ? entry.name : '',
      defaultFolderId:
        typeof entry.defaultFolderId === 'string' ? entry.defaultFolderId : '',
      defaultFolderPath:
        typeof entry.defaultFolderPath === 'string'
          ? entry.defaultFolderPath
          : '',
    }))
    .filter((profile) => profile.path.length > 0)
}

/** CMDS Eagle's own API base URL and default library, when the plugin is installed. */
export function readCmdsEagleDefaults(app: App): {
  apiBaseUrl?: string
  defaultLibraryPath?: string
} {
  const runtime = (app as AppWithPlugins).plugins?.plugins?.['cmds-eagle'] as
    | CmdsEagleSettingsRuntime
    | undefined
  return {
    apiBaseUrl: runtime?.settings?.eagleApiBaseUrl,
    defaultLibraryPath: runtime?.settings?.defaultLibraryPath,
  }
}

export function isCmdsEagleInstalled(app: App): boolean {
  return !!(app as AppWithPlugins).plugins?.plugins?.['cmds-eagle']
}
