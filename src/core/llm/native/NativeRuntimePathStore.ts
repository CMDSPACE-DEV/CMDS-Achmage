import type { App } from 'obsidian'

import { NativeRuntimeProvider } from './nativeRuntime.types'

const STORAGE_PREFIX = 'native-runtime-path'
// Pre-1.4 builds wrote the path to raw localStorage under this key.
const LEGACY_STORAGE_PREFIX = 'smart-composer:native-runtime-path'
const MIGRATED_PREFIX = 'native-runtime-path-migrated'

let boundApp: App | null = null

/** Called once from plugin onload; resolvers create stores without an App. */
export function bindNativeRuntimePathStore(app: App): void {
  boundApp = app
}

export class NativeRuntimePathStore {
  constructor(private readonly app: App | null = null) {}

  get(provider: NativeRuntimeProvider): string | undefined {
    const app = this.app ?? boundApp
    if (!app) return undefined
    try {
      const key = `${STORAGE_PREFIX}:${provider}`
      this.migrateLegacyPath(app, provider)
      const stored: unknown = app.loadLocalStorage(key)
      return typeof stored === 'string' && stored ? stored : undefined
    } catch {
      return undefined
    }
  }

  set(provider: NativeRuntimeProvider, executablePath: string): void {
    const app = this.app ?? boundApp
    if (!app) return
    try {
      app.saveLocalStorage(
        `${STORAGE_PREFIX}:${provider}`,
        executablePath.trim() || null,
      )
      // An explicit choice in this vault, including clearing, ends migration.
      app.saveLocalStorage(`${MIGRATED_PREFIX}:${provider}`, true)
    } catch {
      // A custom path is an optional device-local convenience.
    }
  }

  // Copies the legacy device-wide path into this vault once. The legacy raw
  // key is kept so every other vault on the device can migrate it too; the
  // per-vault marker stops a path cleared here from coming back. The App API
  // prefixes keys per vault, so the legacy key needs the raw API.
  private migrateLegacyPath(app: App, provider: NativeRuntimeProvider): void {
    const markerKey = `${MIGRATED_PREFIX}:${provider}`
    if (app.loadLocalStorage(markerKey)) return
    const key = `${STORAGE_PREFIX}:${provider}`
    const legacy = window.localStorage
      .getItem(`${LEGACY_STORAGE_PREFIX}:${provider}`)
      ?.trim()
    if (legacy && !app.loadLocalStorage(key)) {
      app.saveLocalStorage(key, legacy)
    }
    app.saveLocalStorage(markerKey, true)
  }
}
