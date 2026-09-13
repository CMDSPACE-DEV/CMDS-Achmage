import { ReferenceImageInput } from './reference-image-store'

/** Entry points that can carry their own default prompt template (R-037). */
export const IMAGE_PURPOSES = [
  'composer',
  'text',
  'selection',
  'note',
  'clipboard',
] as const
export type ImagePurpose = (typeof IMAGE_PURPOSES)[number]

export const DEFAULT_TEMPLATE_BY_PURPOSE: Record<ImagePurpose, string> = {
  composer: '',
  text: '',
  selection: '',
  note: 'cmds-illustration',
  clipboard: '',
}

export const IMAGE_PURPOSE_LABELS: Record<ImagePurpose, string> = {
  composer: 'Chat composer image mode',
  text: 'Generate image (text to image)…',
  selection: 'Generate image from selection',
  note: 'Generate image from current note',
  clipboard: 'Generate image from clipboard image (image to image)',
}

/**
 * One image generation job as submitted from any entry point (composer image
 * mode, the Generate image modal, editor menu, commands). The chat view turns
 * it into background tasks so every route shares the same queue, task cards,
 * and destinations (R-036).
 */
export type ImageGenerationSubmission = {
  /** The user's brief; a template may be prepended by `templateId`. */
  brief: string
  templateId?: string
  /** 1..MAX_IMAGE_BATCH_COUNT; batches become variations of the same brief. */
  count: number
  /** Image-capable model id; omitted = Settings → Image model resolution. */
  modelId?: string
  /** Image-to-image references; providers that cannot use them reject the job. */
  referenceImages: ReferenceImageInput[]
  /** Note the result should be inserted into; defaults to the active file. */
  targetFilePath?: string
  /** Where the job came from, for the task card. */
  origin?: ImagePurpose | 'modal'
}
