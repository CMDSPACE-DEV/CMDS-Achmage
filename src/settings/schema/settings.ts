import { mergeImageModelCatalog } from '../../core/image/image-model-catalog'

import { SETTINGS_SCHEMA_VERSION, SETTING_MIGRATIONS } from './migrations'
import {
  SmartComposerSettings,
  smartComposerSettingsSchema,
} from './setting.types'

/**
 * True when there is nothing to migrate. On a fresh install Obsidian's
 * `loadData()` resolves to `null` because `data.json` does not exist yet.
 */
function isFreshInstall(data: unknown): boolean {
  return (
    data === null ||
    typeof data !== 'object' ||
    Array.isArray(data) ||
    Object.keys(data).length === 0
  )
}

function migrateSettings(data: unknown): Record<string, unknown> {
  // Start a fresh install at the current schema and let the schema defaults
  // fill it in. Running the v0 chain on `{}` reads fields that only pre-1.0
  // settings had, and the resulting TypeError used to be logged on every
  // first launch before falling back to the same defaults (R-065).
  if (isFreshInstall(data)) {
    return { version: SETTINGS_SCHEMA_VERSION }
  }

  let currentData = { ...(data as Record<string, unknown>) }
  let currentVersion = (currentData.version as number) ?? 0

  for (const migration of SETTING_MIGRATIONS) {
    if (
      currentVersion >= migration.fromVersion &&
      currentVersion < migration.toVersion &&
      migration.toVersion <= SETTINGS_SCHEMA_VERSION
    ) {
      currentData = migration.migrate(currentData)
      currentVersion = migration.toVersion
    }
  }

  return currentData
}

export function parseSmartComposerSettings(
  data: unknown,
): SmartComposerSettings {
  try {
    const migratedData = migrateSettings(data)
    return smartComposerSettingsSchema.parse({
      ...migratedData,
      chatModels: mergeImageModelCatalog(migratedData.chatModels),
    })
  } catch (error) {
    console.warn('Invalid settings provided, using defaults:', error)
    return smartComposerSettingsSchema.parse({})
  }
}
