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

  it('inserts the new Fable and Astra entries into an existing catalog', () => {
    const result = migrateFrom29To30({
      version: 29,
      chatModels: [{ id: 'claude-sonnet-latest (plan)', model: 'sonnet' }],
    }) as { chatModels: { id: string; enable?: boolean }[] }

    const ids = result.chatModels.map((m) => m.id)
    expect(ids).toContain('claude-fable-latest (plan)')
    expect(ids).toContain('claude-fable-5.1')
    expect(ids).toContain('gpt-6-astra')
    expect(ids).toContain('gpt-6-astra (plan)')
    expect(ids).toContain('claude-sonnet-latest (plan)')
    expect(
      result.chatModels.find((m) => m.id === 'gpt-6-astra (plan)')?.enable,
    ).toBe(false)
  })

  it('never duplicates or overwrites an entry the user already has', () => {
    const userEntry = {
      id: 'claude-fable-5.1',
      model: 'claude-fable-5-1',
      enable: false,
    }
    const result = migrateFrom29To30({
      version: 29,
      chatModels: [userEntry],
    }) as { chatModels: { id: string; enable?: boolean }[] }

    const fableEntries = result.chatModels.filter(
      (m) => m.id === 'claude-fable-5.1',
    )
    expect(fableEntries).toHaveLength(1)
    expect(fableEntries[0].enable).toBe(false)
  })

  it('leaves a non-array chatModels value alone', () => {
    const result = migrateFrom29To30({ version: 29, chatModels: undefined })
    expect(result.chatModels).toBeUndefined()
  })

  it('does not throw when appearance is a non-object value', () => {
    const result = migrateFrom29To30({ version: 29, appearance: null })

    expect(result).toEqual({
      version: 30,
      appearance: { skinMode: 'studio-console' },
    })
  })
})
