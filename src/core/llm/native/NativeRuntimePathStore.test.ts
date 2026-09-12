import { NativeRuntimePathStore } from './NativeRuntimePathStore'

describe('NativeRuntimePathStore', () => {
  it('reads and writes through App local storage', () => {
    const data = new Map<string, unknown>()
    const store = new NativeRuntimePathStore()
    store.bind({
      loadLocalStorage: (key: string) => data.get(key) ?? null,
      saveLocalStorage: (key: string, value: unknown | null) => {
        if (value === null) data.delete(key)
        else data.set(key, value)
      },
    } as never)

    expect(store.get('claude')).toBeUndefined()
    store.set('claude', '  /custom/claude  ')
    expect(store.get('claude')).toBe('/custom/claude')
    store.set('claude', '   ')
    expect(store.get('claude')).toBeUndefined()
  })

  it('is a no-op before bind', () => {
    const store = new NativeRuntimePathStore()
    expect(store.get('claude')).toBeUndefined()
    store.set('claude', '/custom/claude')
    expect(store.get('claude')).toBeUndefined()
  })
})
