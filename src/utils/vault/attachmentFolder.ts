import type { App } from 'obsidian'

type VaultWithConfig = { getConfig?: (key: string) => unknown }

/**
 * Resolves Obsidian's own "Default location for new attachments" setting so the
 * plugin can save generated files where the user already keeps attachments
 * instead of inventing a folder of its own. Mirrors Obsidian's semantics:
 *   ''  or '/'      vault root
 *   './'            same folder as the source note
 *   './sub'         a subfolder next to the source note
 *   'some/path'     that vault-relative folder
 * Returns '' for the vault root. When a note-relative setting is used and no
 * source note is known, falls back to the vault root rather than guessing.
 */
export function resolveAttachmentFolder(app: App, sourcePath?: string): string {
  const raw = (app.vault as unknown as VaultWithConfig).getConfig?.(
    'attachmentFolderPath',
  )
  const value = typeof raw === 'string' ? raw.trim() : ''
  if (value === '' || value === '/') return ''
  if (value === './' || value === '.') return sourceDirectory(sourcePath)
  if (value.startsWith('./')) {
    const dir = sourceDirectory(sourcePath)
    const sub = value.slice(2).replace(/^\/+|\/+$/g, '')
    return dir ? `${dir}/${sub}` : sub
  }
  return value.replace(/^\/+|\/+$/g, '')
}

function sourceDirectory(sourcePath?: string): string {
  if (!sourcePath) return ''
  const index = sourcePath.lastIndexOf('/')
  return index > 0 ? sourcePath.slice(0, index) : ''
}
