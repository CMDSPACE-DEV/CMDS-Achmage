export type ChatSkin = 'hallym-light' | 'cmds-dark' | 'obsidian'

export type ChatSkinMode = 'studio-console' | 'follow-obsidian'

/**
 * R-005 approved two owned skins that deliberately ignore the active Obsidian
 * theme. R-030 keeps those as the default and adds `follow-obsidian` as an
 * explicit opt-in that derives the shell tokens from the user's theme instead.
 *
 * An unknown or missing mode falls back to the owned skin so a corrupt or
 * partially migrated settings file never silently changes the appearance.
 */
export function resolveChatSkin(
  skinMode: ChatSkinMode | undefined,
  isDarkTheme: boolean,
): ChatSkin {
  if (skinMode === 'follow-obsidian') return 'obsidian'
  return isDarkTheme ? 'cmds-dark' : 'hallym-light'
}
