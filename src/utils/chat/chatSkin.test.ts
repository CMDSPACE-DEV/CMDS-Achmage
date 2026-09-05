import { resolveChatSkin } from './chatSkin'

describe('resolveChatSkin', () => {
  it('follows the Obsidian theme by default (R-030)', () => {
    expect(resolveChatSkin('follow-obsidian', true)).toBe('obsidian')
    expect(resolveChatSkin('follow-obsidian', false)).toBe('obsidian')
  })

  it('resolves the owned dual skin only when the user opts in (R-005)', () => {
    expect(resolveChatSkin('studio-console', true)).toBe('cmds-dark')
    expect(resolveChatSkin('studio-console', false)).toBe('hallym-light')
  })

  it('falls back to the theme-following skin when the mode is missing', () => {
    expect(resolveChatSkin(undefined, true)).toBe('obsidian')
    expect(resolveChatSkin(undefined, false)).toBe('obsidian')
  })
})
