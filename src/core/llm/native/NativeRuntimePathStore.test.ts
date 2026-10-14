import type { App } from 'obsidian'

import { NativeRuntimePathStore } from './NativeRuntimePathStore'

const LEGACY_KEY = 'smart-composer:native-runtime-path:claude'
const KEY = 'native-runtime-path:claude'

let rawStore: Map<string, string>

function useRawStorage(raw: Record<string, string>) {
  rawStore = new Map(Object.entries(raw))
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: { getItem: (key: string) => rawStore.get(key) ?? null },
  })
}

// One vault's App local storage; a new store instance stands in for a reload.
function vault(initial: Record<string, unknown> = {}) {
  const data = new Map(Object.entries(initial))
  const app = {
    loadLocalStorage: (key: string) => data.get(key) ?? null,
    saveLocalStorage: (key: string, value: unknown) => {
      if (value === null) data.delete(key)
      else data.set(key, value)
    },
  } as unknown as App
  return { data, open: () => new NativeRuntimePathStore(app) }
}

afterEach(() => {
  Reflect.deleteProperty(window, 'localStorage')
})

describe('NativeRuntimePathStore', () => {
  it('migrates the legacy path into every vault and keeps the legacy key', () => {
    useRawStorage({ [LEGACY_KEY]: '/opt/claude' })
    const a = vault()
    const b = vault()

    expect(a.open().get('claude')).toBe('/opt/claude')
    expect(b.open().get('claude')).toBe('/opt/claude')
    expect(a.data.get(KEY)).toBe('/opt/claude')
    expect(b.data.get(KEY)).toBe('/opt/claude')
    expect(rawStore.get(LEGACY_KEY)).toBe('/opt/claude')
  })

  it('keeps a path cleared in one vault cleared after reload', () => {
    useRawStorage({ [LEGACY_KEY]: '/opt/claude' })
    const a = vault()
    const b = vault()
    a.open().get('claude')

    a.open().set('claude', '')

    expect(a.open().get('claude')).toBeUndefined()
    expect(b.open().get('claude')).toBe('/opt/claude')
  })

  it('does not import the legacy path after clearing before the first read', () => {
    useRawStorage({ [LEGACY_KEY]: '/opt/claude' })
    const a = vault()

    a.open().set('claude', '')

    expect(a.open().get('claude')).toBeUndefined()
  })

  it('keeps the vault value when both keys exist', () => {
    useRawStorage({ [LEGACY_KEY]: '/old/claude' })
    const a = vault({ [KEY]: '/new/claude' })

    expect(a.open().get('claude')).toBe('/new/claude')
    expect(a.data.get(KEY)).toBe('/new/claude')
  })

  it('stores a trimmed path through App local storage', () => {
    useRawStorage({})
    const a = vault()

    a.open().set('claude', '  /usr/local/bin/claude  ')

    expect(a.data.get(KEY)).toBe('/usr/local/bin/claude')
    expect(a.open().get('claude')).toBe('/usr/local/bin/claude')
  })
})
