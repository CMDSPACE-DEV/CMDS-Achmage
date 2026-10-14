import type { App } from 'obsidian'

import { NativeRuntimeProvider } from './nativeRuntime.types'

const STORAGE_PREFIX = 'native-runtime-path'
// Pre-1.4 builds wrote the path to raw localStorage under this key.
const LEGACY_STORAGE_PREFIX = 'smart-composer:native-runtime-path'

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
      const stored: unknown = app.loadLocalStorage(key)
      const current = typeof stored === 'string' && stored ? stored : undefined

      // One-time move of the legacy raw key. App#loadLocalStorage prefixes
      // keys per vault, so the old key can only be read through the raw API.
      const legacyKey = `${LEGACY_STORAGE_PREFIX}:${provider}`
      const legacy = window.localStorage.getItem(legacyKey)
      if (legacy === null) return current
      window.localStorage.removeItem(legacyKey)
      if (current) return current
      const migrated = legacy.trim()
      if (!migrated) return undefined
      app.saveLocalStorage(key, migrated)
      return migrated
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
    } catch {
      // A custom path is an optional device-local convenience.
    }
  }
}
