import { EagleLinkStyle } from './image-destination'

export type EagleItemSummary = { id: string; name: string; ext: string }

/** Eagle stores each original at `<library>/images/<id>.info/<name>.<ext>`. */
export function buildEagleOriginalPath(
  libraryPath: string,
  item: EagleItemSummary,
): string {
  const root = libraryPath.replace(/[\\/]+$/, '')
  return `${root}/images/${item.id}.info/${item.name}.${item.ext}`
}

export function pathToFileUrl(absolutePath: string): string {
  const normalized = absolutePath.replace(/\\/g, '/')
  const withRoot = normalized.startsWith('/') ? normalized : `/${normalized}`
  return `file://${encodeURI(withRoot)}`
}

export function buildEagleDeeplink(itemId: string): string {
  return `eagle://item/${itemId}`
}

export function libraryNameFromPath(libraryPath: string): string {
  const match = libraryPath.match(/([^/\\]+)\.library[/\\]?$/i)
  return match ? match[1] : (libraryPath.split(/[/\\]/).pop() ?? libraryPath)
}

/** Markdown the note gets for an image that now lives in Eagle. */
export function buildEagleMarkdown({
  style,
  item,
  originalPath,
  vaultEmbed,
}: {
  style: EagleLinkStyle
  item: EagleItemSummary
  originalPath: string
  /** `![[path]]` for the vault copy; required for the vault-embed style. */
  vaultEmbed: string
}): string {
  const alt = item.name.replace(/[[\]]/g, ' ')
  const deeplink = buildEagleDeeplink(item.id)
  switch (style) {
    case 'original-file':
      return `[![${alt}](${pathToFileUrl(originalPath)})](${deeplink})`
    case 'deeplink':
      return `[${alt} (Eagle)](${deeplink})`
    default:
      return vaultEmbed
  }
}
