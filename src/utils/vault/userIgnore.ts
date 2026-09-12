import type { App } from 'obsidian'

type VaultWithConfig = { getConfig?: (key: string) => unknown }

/**
 * Obsidian's Settings -> Files and links -> "Excluded files" list. Entries are
 * either a vault-relative path prefix or a /regex/. Obsidian hides matches from
 * search, graph, and link suggestions; the plugin should not feed them to a
 * model either unless the user opts out.
 */
export function getUserIgnoreFilters(app: App): string[] {
  const raw = (app.vault as unknown as VaultWithConfig).getConfig?.(
    'userIgnoreFilters',
  )
  return Array.isArray(raw)
    ? raw.filter((entry): entry is string => typeof entry === 'string')
    : []
}

export function isUserIgnored(path: string, filters: string[]): boolean {
  return filters.some((filter) => {
    const trimmed = filter.trim()
    if (!trimmed) return false
    const regex = /^\/(.+)\/$/.exec(trimmed)
    if (regex) {
      try {
        return new RegExp(regex[1]).test(path)
      } catch {
        return false
      }
    }
    const prefix = trimmed.replace(/\/+$/, '')
    return path === prefix || path.startsWith(`${prefix}/`)
  })
}
