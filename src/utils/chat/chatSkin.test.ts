import {
  SKIN_MODE_BODY_ATTR,
  applySkinModeToBody,
  clearSkinModeFromBody,
  readSkinModeFromBody,
  resolveChatSkin,
} from './chatSkin'

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

describe('skin mode body mirror', () => {
  const makeBody = () => {
    const attrs = new Map<string, string>()
    return {
      setAttribute: (n: string, v: string) => void attrs.set(n, v),
      removeAttribute: (n: string) => void attrs.delete(n),
      getAttribute: (n: string) => attrs.get(n) ?? null,
    }
  }

  it('writes the mode and reads it back', () => {
    const body = makeBody()
    applySkinModeToBody(body, 'studio-console')
    expect(body.getAttribute(SKIN_MODE_BODY_ATTR)).toBe('studio-console')
    expect(readSkinModeFromBody(body)).toBe('studio-console')
  })

  it('mirrors an undefined mode as the default', () => {
    const body = makeBody()
    applySkinModeToBody(body, undefined)
    expect(readSkinModeFromBody(body)).toBe('follow-obsidian')
  })

  it('ignores unknown values and clears cleanly', () => {
    const body = makeBody()
    body.setAttribute(SKIN_MODE_BODY_ATTR, 'neon')
    expect(readSkinModeFromBody(body)).toBeUndefined()
    clearSkinModeFromBody(body)
    expect(body.getAttribute(SKIN_MODE_BODY_ATTR)).toBeNull()
  })
})
