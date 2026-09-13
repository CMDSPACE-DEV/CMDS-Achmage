import {
  ACCENT_BODY_ATTR,
  APPEARANCE_PRESETS,
  GLOW_BODY_ATTR,
  SKIN_MODE_BODY_ATTR,
  applyAppearanceToBody,
  applySkinModeToBody,
  clearSkinModeFromBody,
  matchAppearancePreset,
  normalizeAppearance,
  readAppearanceFromBody,
  readSkinModeFromBody,
  resolveChatSkin,
  resolveSurfaceAttributes,
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

  it('pins an owned skin regardless of the theme (R-033)', () => {
    expect(resolveChatSkin('operator-console', false)).toBe('cmds-dark')
    expect(resolveChatSkin('conversation-studio', true)).toBe('hallym-light')
  })

  it('falls back to the theme-following skin when the mode is missing', () => {
    expect(resolveChatSkin(undefined, true)).toBe('obsidian')
    expect(resolveChatSkin(undefined, false)).toBe('obsidian')
  })
})

describe('appearance presets', () => {
  it('round-trips every preset through the matcher', () => {
    for (const [id, preset] of Object.entries(APPEARANCE_PRESETS)) {
      expect(matchAppearancePreset(preset.appearance)).toBe(id)
    }
  })

  it('reports custom for a combination no preset owns', () => {
    expect(
      matchAppearancePreset({
        skinMode: 'follow-obsidian',
        accentPreset: 'neon-lime',
        glow: 'off',
      }),
    ).toBe('custom')
  })

  it('keeps the original neon inline look reachable', () => {
    expect(APPEARANCE_PRESETS['neon-lime-console'].appearance).toEqual({
      skinMode: 'operator-console',
      accentPreset: 'neon-lime',
      glow: 'neon',
    })
  })

  it('normalizes unknown values to the defaults axis by axis', () => {
    expect(
      normalizeAppearance({
        skinMode: 'studio-console',
        accentPreset: 'lava' as never,
        glow: undefined,
      }),
    ).toEqual({
      skinMode: 'studio-console',
      accentPreset: 'skin',
      glow: 'skin',
    })
    expect(normalizeAppearance(undefined)).toEqual({
      skinMode: 'follow-obsidian',
      accentPreset: 'skin',
      glow: 'skin',
    })
  })

  it('derives surface attributes from appearance and theme', () => {
    expect(
      resolveSurfaceAttributes(
        { skinMode: 'studio-console', accentPreset: 'neon-lime', glow: 'neon' },
        true,
      ),
    ).toEqual({ skin: 'cmds-dark', accent: 'neon-lime', glow: 'neon' })
    expect(resolveSurfaceAttributes(undefined, false)).toEqual({
      skin: 'obsidian',
      accent: 'skin',
      glow: 'skin',
    })
  })
})

describe('appearance body mirror', () => {
  const makeBody = () => {
    const attrs = new Map<string, string>()
    return {
      setAttribute: (n: string, v: string) => void attrs.set(n, v),
      removeAttribute: (n: string) => void attrs.delete(n),
      getAttribute: (n: string) => attrs.get(n) ?? null,
    }
  }

  it('writes all three axes and reads them back', () => {
    const body = makeBody()
    applyAppearanceToBody(body, {
      skinMode: 'operator-console',
      accentPreset: 'neon-lime',
      glow: 'neon',
    })
    expect(body.getAttribute(SKIN_MODE_BODY_ATTR)).toBe('operator-console')
    expect(body.getAttribute(ACCENT_BODY_ATTR)).toBe('neon-lime')
    expect(body.getAttribute(GLOW_BODY_ATTR)).toBe('neon')
    expect(readAppearanceFromBody(body)).toEqual({
      skinMode: 'operator-console',
      accentPreset: 'neon-lime',
      glow: 'neon',
    })
    expect(readSkinModeFromBody(body)).toBe('operator-console')
  })

  it('mirrors an undefined appearance as the defaults', () => {
    const body = makeBody()
    applyAppearanceToBody(body, undefined)
    expect(readAppearanceFromBody(body)).toEqual({
      skinMode: 'follow-obsidian',
      accentPreset: 'skin',
      glow: 'skin',
    })
  })

  it('keeps the mode-only writer working for old callers', () => {
    const body = makeBody()
    applySkinModeToBody(body, 'studio-console')
    expect(readSkinModeFromBody(body)).toBe('studio-console')
    expect(body.getAttribute(GLOW_BODY_ATTR)).toBe('skin')
  })

  it('ignores unknown values and clears every attribute', () => {
    const body = makeBody()
    body.setAttribute(SKIN_MODE_BODY_ATTR, 'neon')
    body.setAttribute(ACCENT_BODY_ATTR, 'lava')
    expect(readSkinModeFromBody(body)).toBeUndefined()
    expect(readAppearanceFromBody(body).accentPreset).toBe('skin')
    clearSkinModeFromBody(body)
    expect(body.getAttribute(SKIN_MODE_BODY_ATTR)).toBeNull()
    expect(body.getAttribute(ACCENT_BODY_ATTR)).toBeNull()
    expect(body.getAttribute(GLOW_BODY_ATTR)).toBeNull()
  })
})
