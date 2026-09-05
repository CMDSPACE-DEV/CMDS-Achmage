import { migrateFrom29To30 } from './29_to_30'

describe('migrateFrom29To30', () => {
  it('remaps the never-read follow-obsidian literal to the skin users actually saw', () => {
    const input = {
      version: 29,
      appearance: { skinMode: 'follow-obsidian' },
      chatModelId: 'claude-sonnet-latest (plan)',
    }

    const result = migrateFrom29To30(input)

    expect(result).toEqual({
      version: 30,
      appearance: { skinMode: 'studio-console' },
      chatModelId: 'claude-sonnet-latest (plan)',
    })
  })

  it('adds the appearance object when it is missing entirely', () => {
    const result = migrateFrom29To30({ version: 29 })

    expect(result).toEqual({
      version: 30,
      appearance: { skinMode: 'studio-console' },
    })
  })

  it('keeps unrelated appearance keys and other settings untouched', () => {
    const result = migrateFrom29To30({
      version: 29,
      appearance: { skinMode: 'follow-obsidian', somethingElse: 42 },
      providers: [{ type: 'anthropic', id: 'anthropic' }],
    })

    expect(result).toEqual({
      version: 30,
      appearance: { skinMode: 'studio-console', somethingElse: 42 },
      providers: [{ type: 'anthropic', id: 'anthropic' }],
    })
  })

  it('does not throw when appearance is a non-object value', () => {
    const result = migrateFrom29To30({ version: 29, appearance: null })

    expect(result).toEqual({
      version: 30,
      appearance: { skinMode: 'studio-console' },
    })
  })
})
