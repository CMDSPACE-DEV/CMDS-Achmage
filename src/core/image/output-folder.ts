import { App } from 'obsidian'

import { SmartComposerSettings } from '../../settings/schema/setting.types'
import { resolveAttachmentFolder } from '../../utils/vault/attachmentFolder'

/**
 * Where generated images and text cards go. A blank setting means Obsidian's
 * own attachment folder (Settings -> Files and links), resolved the same way
 * PlanImageTaskAdapter does, so nothing ever lands in the vault root by
 * accident.
 */
export function resolveImageOutputFolder(
  app: App,
  settings: Pick<SmartComposerSettings, 'imageGeneration'>,
): string {
  const folder = settings.imageGeneration.outputFolder.trim()
  return folder || resolveAttachmentFolder(app)
}
