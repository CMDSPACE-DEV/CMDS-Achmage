export type ChatSkin = 'hallym-light' | 'cmds-dark' | 'obsidian'

/**
 * Base skin: which surfaces, borders, and text colors the pane is built from.
 *
 * - `follow-obsidian` (default): every color comes from the active theme.
 * - `studio-console`: the owned dual skin from R-005, picked by the theme's
 *   light/dark state (Hallym Conversation Studio / CMDS AI Operator Console).
 * - `operator-console`: the dark owned skin regardless of theme.
 * - `conversation-studio`: the light owned skin regardless of theme.
 */
export const SKIN_MODES = [
  'follow-obsidian',
  'studio-console',
  'operator-console',
  'conversation-studio',
] as const
export type ChatSkinMode = (typeof SKIN_MODES)[number]

/**
 * Accent preset: the color used for the send button, focus ring, user
 * bubble, accent bar, links and headings (owned skins), and the pulse glow.
 * `skin` keeps whatever the base skin provides (the theme accent when
 * following Obsidian). Style Settings `--ach-ss-accent` still wins on top.
 */
export const ACCENT_PRESETS = [
  'skin',
  'cmds-pink',
  'neon-lime',
  'hallym-blue',
  'signal-teal',
  'graphite',
] as const
export type AccentPreset = (typeof ACCENT_PRESETS)[number]

/**
 * Glow level scales every blur-type shadow the plugin draws (focus halo,
 * pending pulse, streaming tail, primary button). `skin` keeps the base
 * skin's own level. Style Settings `--ach-ss-glow` still wins on top.
 */
export const GLOW_LEVELS = ['skin', 'off', 'soft', 'neon'] as const
export type GlowLevel = (typeof GLOW_LEVELS)[number]

export type Appearance = {
  skinMode: ChatSkinMode
  accentPreset: AccentPreset
  glow: GlowLevel
}

export const DEFAULT_APPEARANCE: Appearance = {
  skinMode: 'follow-obsidian',
  accentPreset: 'skin',
  glow: 'skin',
}

/**
 * Named combinations exposed as a single "Preset" dropdown. The advanced
 * dropdowns edit the three axes directly; when the result matches none of
 * these the preset reads `custom`.
 *
 * `neon-lime-console` is the original inline-edit look (lime `#b6ff00` on the
 * dark console with the teal secondary and a strong glow) that #12 replaced
 * with the accent-driven version. It stays available by choice, not by default.
 */
export const APPEARANCE_PRESETS = {
  'follow-obsidian': {
    label: 'Follow Obsidian theme (default)',
    appearance: {
      skinMode: 'follow-obsidian',
      accentPreset: 'skin',
      glow: 'skin',
    },
  },
  'studio-console': {
    label: 'CMDS Studio / Console (auto light and dark)',
    appearance: {
      skinMode: 'studio-console',
      accentPreset: 'skin',
      glow: 'skin',
    },
  },
  'operator-console': {
    label: 'CMDS Operator Console (dark, CMDS Pink)',
    appearance: {
      skinMode: 'operator-console',
      accentPreset: 'cmds-pink',
      glow: 'soft',
    },
  },
  'neon-lime-console': {
    label: 'Neon Lime Console (dark, the original inline look)',
    appearance: {
      skinMode: 'operator-console',
      accentPreset: 'neon-lime',
      glow: 'neon',
    },
  },
  'conversation-studio': {
    label: 'Hallym Conversation Studio (light, Hallym Blue)',
    appearance: {
      skinMode: 'conversation-studio',
      accentPreset: 'hallym-blue',
      glow: 'soft',
    },
  },
  'theme-neon': {
    label: 'Theme colors with neon glow',
    appearance: {
      skinMode: 'follow-obsidian',
      accentPreset: 'skin',
      glow: 'neon',
    },
  },
} as const satisfies Record<string, { label: string; appearance: Appearance }>

export type AppearancePresetId = keyof typeof APPEARANCE_PRESETS

export function matchAppearancePreset(
  appearance: Appearance,
): AppearancePresetId | 'custom' {
  for (const [id, preset] of Object.entries(APPEARANCE_PRESETS)) {
    const p = preset.appearance
    if (
      p.skinMode === appearance.skinMode &&
      p.accentPreset === appearance.accentPreset &&
      p.glow === appearance.glow
    ) {
      return id as AppearancePresetId
    }
  }
  return 'custom'
}

export function normalizeAppearance(
  value: Partial<Appearance> | undefined,
): Appearance {
  return {
    skinMode: isSkinMode(value?.skinMode)
      ? value.skinMode
      : DEFAULT_APPEARANCE.skinMode,
    accentPreset: isAccentPreset(value?.accentPreset)
      ? value.accentPreset
      : DEFAULT_APPEARANCE.accentPreset,
    glow: isGlowLevel(value?.glow) ? value.glow : DEFAULT_APPEARANCE.glow,
  }
}

function isSkinMode(v: unknown): v is ChatSkinMode {
  return typeof v === 'string' && (SKIN_MODES as readonly string[]).includes(v)
}
function isAccentPreset(v: unknown): v is AccentPreset {
  return (
    typeof v === 'string' && (ACCENT_PRESETS as readonly string[]).includes(v)
  )
}
function isGlowLevel(v: unknown): v is GlowLevel {
  return typeof v === 'string' && (GLOW_LEVELS as readonly string[]).includes(v)
}

/**
 * The plugin mirrors the appearance onto <body> so surfaces that have no
 * settings handle (the inline edit widget lives inside a CodeMirror
 * decoration and a Shadow DOM) can resolve the same skin as the chat pane,
 * and can react live through the MutationObserver they already run for the
 * theme-dark class.
 */
export const SKIN_MODE_BODY_ATTR = 'data-ach-skin-mode'
export const ACCENT_BODY_ATTR = 'data-ach-accent'
export const GLOW_BODY_ATTR = 'data-ach-glow'
export const APPEARANCE_BODY_ATTRS = [
  SKIN_MODE_BODY_ATTR,
  ACCENT_BODY_ATTR,
  GLOW_BODY_ATTR,
] as const

type AttrWriter = { setAttribute: (name: string, value: string) => void }
type AttrReader = { getAttribute: (name: string) => string | null }
type AttrRemover = { removeAttribute: (name: string) => void }

export function applyAppearanceToBody(
  body: AttrWriter,
  appearance: Partial<Appearance> | undefined,
): void {
  const a = normalizeAppearance(appearance)
  body.setAttribute(SKIN_MODE_BODY_ATTR, a.skinMode)
  body.setAttribute(ACCENT_BODY_ATTR, a.accentPreset)
  body.setAttribute(GLOW_BODY_ATTR, a.glow)
}

/** @deprecated use applyAppearanceToBody; kept for callers that only know the mode */
export function applySkinModeToBody(
  body: AttrWriter,
  skinMode: ChatSkinMode | undefined,
): void {
  applyAppearanceToBody(body, { skinMode })
}

export function clearSkinModeFromBody(body: AttrRemover): void {
  for (const attr of APPEARANCE_BODY_ATTRS) body.removeAttribute(attr)
}

export function readSkinModeFromBody(
  body: AttrReader,
): ChatSkinMode | undefined {
  const value = body.getAttribute(SKIN_MODE_BODY_ATTR)
  return isSkinMode(value) ? value : undefined
}

export function readAppearanceFromBody(body: AttrReader): Appearance {
  return normalizeAppearance({
    skinMode: body.getAttribute(SKIN_MODE_BODY_ATTR) as ChatSkinMode,
    accentPreset: body.getAttribute(ACCENT_BODY_ATTR) as AccentPreset,
    glow: body.getAttribute(GLOW_BODY_ATTR) as GlowLevel,
  })
}

/**
 * The chat pane follows the user's Obsidian theme by default (R-030). The two
 * owned skins from R-005 (Hallym Conversation Studio / CMDS AI Operator
 * Console) are available as opt-ins: theme-switched (`studio-console`) or
 * pinned (`operator-console`, `conversation-studio`).
 *
 * An unknown or missing mode resolves to the theme-following skin: nobody's
 * brand colors are forced on a vault unless the user chose them.
 */
export function resolveChatSkin(
  skinMode: ChatSkinMode | undefined,
  isDarkTheme: boolean,
): ChatSkin {
  switch (skinMode) {
    case 'studio-console':
      return isDarkTheme ? 'cmds-dark' : 'hallym-light'
    case 'operator-console':
      return 'cmds-dark'
    case 'conversation-studio':
      return 'hallym-light'
    default:
      return 'obsidian'
  }
}

/** Data attributes a plugin-owned surface carries so the stylesheet can pick tokens. */
export function resolveSurfaceAttributes(
  appearance: Partial<Appearance> | undefined,
  isDarkTheme: boolean,
): { skin: ChatSkin; accent: AccentPreset; glow: GlowLevel } {
  const a = normalizeAppearance(appearance)
  return {
    skin: resolveChatSkin(a.skinMode, isDarkTheme),
    accent: a.accentPreset,
    glow: a.glow,
  }
}
