export type ChatSkin = 'hallym-light' | 'cmds-dark' | 'obsidian'

export type ChatSkinMode = 'studio-console' | 'follow-obsidian'

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
