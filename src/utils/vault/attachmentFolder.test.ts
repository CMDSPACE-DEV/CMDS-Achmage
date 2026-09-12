import type { App } from 'obsidian'

import { resolveAttachmentFolder } from './attachmentFolder'

const appWith = (value: unknown): App =>
  ({ vault: { getConfig: () => value } }) as unknown as App

describe('resolveAttachmentFolder', () => {
  it('treats an unset or root setting as the vault root', () => {
    expect(resolveAttachmentFolder(appWith(undefined))).toBe('')
    expect(resolveAttachmentFolder(appWith(''))).toBe('')
    expect(resolveAttachmentFolder(appWith('/'))).toBe('')
  })

  it('returns a plain vault-relative folder without surrounding slashes', () => {
    expect(
      resolveAttachmentFolder(appWith('80. References/81. Attachment')),
    ).toBe('80. References/81. Attachment')
    expect(resolveAttachmentFolder(appWith('/assets/'))).toBe('assets')
  })

  it('resolves note-relative settings against the source note', () => {
    expect(resolveAttachmentFolder(appWith('./'), 'notes/a/b.md')).toBe(
      'notes/a',
    )
    expect(resolveAttachmentFolder(appWith('./img'), 'notes/a/b.md')).toBe(
      'notes/a/img',
    )
  })

  it('falls back to the vault root when note-relative but no source is known', () => {
    expect(resolveAttachmentFolder(appWith('./'))).toBe('')
    expect(resolveAttachmentFolder(appWith('./img'))).toBe('img')
  })

  it('tolerates a vault without getConfig', () => {
    expect(resolveAttachmentFolder({ vault: {} } as unknown as App)).toBe('')
  })
})
