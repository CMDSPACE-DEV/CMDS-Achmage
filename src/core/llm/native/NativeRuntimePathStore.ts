import type { App } from 'obsidian'

import { NativeRuntimeProvider } from './nativeRuntime.types'

const STORAGE_PREFIX = 'smart-composer:native-runtime-path'

export class NativeRuntimePathStore {
  private app: App | null = null

  bind(app: App): void {
    this.app = app
  }

  get(provider: NativeRuntimeProvider): string | undefined {
    if (!this.app) return undefined
    try {
      const value: unknown = this.app.loadLocalStorage(
        `${STORAGE_PREFIX}:${provider}`,
      )
      return typeof value === 'string' && value.trim() ? value : undefined
    } catch {
      return undefined
    }
  }

  set(provider: NativeRuntimeProvider, executablePath: string): void {
    if (!this.app) return
    try {
      const key = `${STORAGE_PREFIX}:${provider}`
      const normalized = executablePath.trim()
      this.app.saveLocalStorage(key, normalized || null)
    } catch {
      // A custom path is an optional device-local convenience.
    }
  }
}

export const sharedNativeRuntimePathStore = new NativeRuntimePathStore()
