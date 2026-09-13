import { SettingMigration } from '../setting.types'

const OLD_DRAFT_FOLDER = 'Smart Composer/Document Drafts'
const NEW_DRAFT_FOLDER = 'CMDS Achmage/Document Drafts'
const OLD_IMAGE_FOLDER = 'Smart Composer/Generated Images'

/**
 * Community-release defaults. Only values that still equal the pre-rebrand
 * defaults are moved; anything the user typed is left alone.
 *
 * - Draft folder: renamed for the product name.
 * - Image folder: the old default becomes '' which means "use Obsidian's own
 *   attachment folder", so generated images stop creating a top-level folder
 *   the user never asked for.
 * - artifacts.outputFolder and ragOptions.respectObsidianExcludedFiles are new
 *   and take their schema defaults.
 */
export const migrateFrom30To31: SettingMigration['migrate'] = (data) => {
  const documentEditing = isRecord(data.documentEditing)
    ? {
        ...data.documentEditing,
        destinationFolder:
          data.documentEditing.destinationFolder === OLD_DRAFT_FOLDER
            ? NEW_DRAFT_FOLDER
            : data.documentEditing.destinationFolder,
      }
    : data.documentEditing
  const imageGeneration = isRecord(data.imageGeneration)
    ? {
        ...data.imageGeneration,
        outputFolder:
          data.imageGeneration.outputFolder === OLD_IMAGE_FOLDER
            ? ''
            : data.imageGeneration.outputFolder,
      }
    : data.imageGeneration
  return { ...data, documentEditing, imageGeneration, version: 31 }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
