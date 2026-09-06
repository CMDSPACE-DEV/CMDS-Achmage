export type ChatSkin = 'hallym-light' | 'cmds-dark' | 'obsidian'

export type ChatSkinMode = 'studio-console' | 'follow-obsidian'

/**
 * The plugin mirrors the chosen skin mode onto <body> so surfaces that have no
 * settings handle (the inline edit widget lives inside a CodeMirror
 * decoration and a Shadow DOM) can resolve the same skin as the chat pane,
 * and can react live through the MutationObserver they already run for the
 * theme-dark class.
 */
export const SKIN_MODE_BODY_ATTR = 'data-ach-skin-mode'

export function applySkinModeToBody(
  body: { setAttribute: (name: string, value: string) => void },
  skinMode: ChatSkinMode | undefined,
): void {
  body.setAttribute(SKIN_MODE_BODY_ATTR, skinMode ?? 'follow-obsidian')
}

export function clearSkinModeFromBody(body: {
  removeAttribute: (name: string) => void
}): void {
  body.removeAttribute(SKIN_MODE_BODY_ATTR)
}

export function readSkinModeFromBody(body: {
  getAttribute: (name: string) => string | null
}): ChatSkinMode | undefined {
  const value = body.getAttribute(SKIN_MODE_BODY_ATTR)
  return value === 'studio-console' || value === 'follow-obsidian'
    ? value
    : undefined
}

/**
 * The chat pane follows the user's Obsidian theme by default (R-030). The two
 * owned skins from R-005 (Hallym Conversation Studio / CMDS AI Operator
 * Console) remain available as an explicit opt-in via `studio-console`.
 *
 * An unknown or missing mode resolves to the theme-following skin: nobody's
 * brand colors are forced on a vault unless the user chose them.
 */
export function resolveChatSkin(
  skinMode: ChatSkinMode | undefined,
  isDarkTheme: boolean,
): ChatSkin {
  if (skinMode === 'studio-console') {
    return isDarkTheme ? 'cmds-dark' : 'hallym-light'
  }
  return 'obsidian'
}
