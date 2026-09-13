import type { App } from 'obsidian'

import { getUserIgnoreFilters, isUserIgnored } from './userIgnore'

describe('userIgnore', () => {
  it('reads the excluded-files list and ignores non-string entries', () => {
    const app = {
      vault: { getConfig: () => ['90. Settings', 42, '/^_/'] },
    } as unknown as App
    expect(getUserIgnoreFilters(app)).toEqual(['90. Settings', '/^_/'])
  })

  it('returns an empty list when the config is missing', () => {
    expect(getUserIgnoreFilters({ vault: {} } as unknown as App)).toEqual([])
  })

  it('matches path prefixes on folder boundaries only', () => {
    const f = ['90. Settings']
    expect(isUserIgnored('90. Settings/x.md', f)).toBe(true)
    expect(isUserIgnored('90. Settings', f)).toBe(true)
    expect(isUserIgnored('90. Settings-old/x.md', f)).toBe(false)
    expect(isUserIgnored('notes/90. Settings/x.md', f)).toBe(false)
  })

  it('supports /regex/ entries and tolerates invalid ones', () => {
    expect(isUserIgnored('_drafts/a.md', ['/^_/'])).toBe(true)
    expect(isUserIgnored('a.md', ['/^_/'])).toBe(false)
    expect(isUserIgnored('a.md', ['/(/'])).toBe(false)
  })
})
