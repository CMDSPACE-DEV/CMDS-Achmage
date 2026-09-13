import { ReferenceImageInput } from './reference-image-store'

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
  origin?: 'composer' | 'modal' | 'note' | 'selection' | 'clipboard'
}
