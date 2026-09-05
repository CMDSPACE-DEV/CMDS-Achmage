import { resolveChatSkin } from './chatSkin'

describe('resolveChatSkin', () => {
  it('keeps the owned dual skin by default (R-005)', () => {
    expect(resolveChatSkin('studio-console', true)).toBe('cmds-dark')
    expect(resolveChatSkin('studio-console', false)).toBe('hallym-light')
  })

  it('uses the theme-following skin when the user opts in (R-030)', () => {
    expect(resolveChatSkin('follow-obsidian', true)).toBe('obsidian')
    expect(resolveChatSkin('follow-obsidian', false)).toBe('obsidian')
  })

  it('falls back to the owned skin when the mode is missing', () => {
    expect(resolveChatSkin(undefined, true)).toBe('cmds-dark')
    expect(resolveChatSkin(undefined, false)).toBe('hallym-light')
  })
})
