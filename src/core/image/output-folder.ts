import { SmartComposerSettings } from '../../settings/schema/setting.types'

/** Fallback when the setting is blank, so images never land in the vault root. */
export const DEFAULT_IMAGE_OUTPUT_FOLDER = 'Smart Composer/Generated Images'

export function resolveImageOutputFolder(
  settings: Pick<SmartComposerSettings, 'imageGeneration'>,
): string {
  const folder = settings.imageGeneration.outputFolder
    .trim()
    .replace(/^\/+|\/+$/g, '')
  return folder || DEFAULT_IMAGE_OUTPUT_FOLDER
}
