import { SettingMigration } from '../setting.types'

/**
 * `appearance.skinMode` was introduced in 19_to_20 as a single-value literal
 * (`'follow-obsidian'`) that no renderer ever read: the chat shell always
 * picked the owned dual skin from the `theme-dark` body class. The field is
 * now a real choice, so the stored literal has to be remapped to the mode that
 * users actually saw.
 *
 * Every existing vault was rendering the owned skin regardless of the stored
 * value, so the behavior-preserving migration is `'follow-obsidian'` ->
 * `'studio-console'`. Opting into theme following stays an explicit user
 * action rather than something an upgrade silently turns on.
 */
export const migrateFrom29To30: SettingMigration['migrate'] = (data) => {
  const appearance =
    typeof data.appearance === 'object' && data.appearance !== null
      ? (data.appearance as Record<string, unknown>)
      : {}

  return {
    ...data,
    appearance: {
      ...appearance,
      skinMode: 'studio-console',
    },
    version: 30,
  }
}
