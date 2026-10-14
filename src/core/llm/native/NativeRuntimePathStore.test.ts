import type { App } from 'obsidian'

import { NativeRuntimePathStore } from './NativeRuntimePathStore'

const LEGACY_KEY = 'smart-composer:native-runtime-path:claude'
const KEY = 'native-runtime-path:claude'

function setup(raw: Record<string, string>, vault: Record<string, unknown>) {
  const rawStore = new Map(Object.entries(raw))
  const vaultStore = new Map(Object.entries(vault))
  ;(globalThis as { window?: unknown }).window = {
    localStorage: {
      getItem: (key: string) => rawStore.get(key) ?? null,
      removeItem: (key: string) => rawStore.delete(key),
    },
  }
  const app = {
    loadLocalStorage: (key: string) => vaultStore.get(key) ?? null,
    saveLocalStorage: (key: string, data: unknown) => {
      if (data === null) vaultStore.delete(key)
      else vaultStore.set(key, data)
    },
  } as unknown as App
  return { store: new NativeRuntimePathStore(app), rawStore, vaultStore }
}

afterEach(() => {
  delete (globalThis as { window?: unknown }).window
})

describe('NativeRuntimePathStore', () => {
  it('moves a legacy raw path into vault local storage once', () => {
    const { store, rawStore, vaultStore } = setup(
      { [LEGACY_KEY]: '/opt/claude' },
      {},
    )

    expect(store.get('claude')).toBe('/opt/claude')
    expect(vaultStore.get(KEY)).toBe('/opt/claude')
    expect(rawStore.has(LEGACY_KEY)).toBe(false)
    expect(store.get('claude')).toBe('/opt/claude')
  })

  it('keeps the vault value when both keys exist and drops the legacy key', () => {
    const { store, rawStore, vaultStore } = setup(
      { [LEGACY_KEY]: '/old/claude' },
      { [KEY]: '/new/claude' },
    )

    expect(store.get('claude')).toBe('/new/claude')
    expect(vaultStore.get(KEY)).toBe('/new/claude')
    expect(rawStore.has(LEGACY_KEY)).toBe(false)
  })

  it('stores and clears the path through App local storage', () => {
    const { store, vaultStore } = setup({}, {})

    store.set('claude', '  /usr/local/bin/claude  ')
    expect(vaultStore.get(KEY)).toBe('/usr/local/bin/claude')

    store.set('claude', '   ')
    expect(vaultStore.has(KEY)).toBe(false)
    expect(store.get('claude')).toBeUndefined()
  })
})
