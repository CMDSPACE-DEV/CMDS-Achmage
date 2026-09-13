import { App, Notice } from 'obsidian'

import { SmartComposerSettings } from '../../settings/schema/setting.types'
import { enqueueImageGenerationBatch } from '../../utils/chat/imageBatch'
import {
  ImageGenerationRequest,
  MAX_IMAGE_BATCH_COUNT,
} from '../../utils/chat/imageIntent'
import { BackgroundTaskManager } from '../tasks/BackgroundTaskManager'

import {
  composeImagePrompt,
  findImagePromptTemplate,
} from './image-prompt-templates'
import { ImageGenerationSubmission } from './image-request'
import { storeReferenceImages } from './reference-image-store'
import { resolveImageGenerationModel } from './resolve-image-model'

export type QueueImageJobResult = { queued: number; taskIds: string[] }

/**
 * The one image queue entry (R-036/R-040). Composer, modal, commands, editor
 * menu, and the inline panel all end here: model resolution, template +
 * always-on rules, reference storage, and batching happen in one place.
 */
export async function queueImageJob({
  app,
  settings,
  taskManager,
  request,
  sourcePrompt,
  conversationId,
  originMessageId,
  submission,
}: {
  app: App
  settings: SmartComposerSettings
  taskManager: BackgroundTaskManager | null | undefined
  request: ImageGenerationRequest
  sourcePrompt: string
  conversationId: string
  originMessageId: string
  submission: Omit<ImageGenerationSubmission, 'brief' | 'count'>
}): Promise<QueueImageJobResult> {
  if (!taskManager) {
    new Notice('Background tasks are not ready yet. Try again in a moment.')
    return { queued: 0, taskIds: [] }
  }
  const imageModel = submission.modelId
    ? settings.chatModels.find((model) => model.id === submission.modelId)
    : resolveImageGenerationModel(settings).model
  if (!imageModel) {
    new Notice(
      'No image-capable model is available. Pick one under Settings → Image model.',
    )
    return { queued: 0, taskIds: [] }
  }
  const template = findImagePromptTemplate(
    settings.imageGeneration.promptTemplates,
    submission.templateId,
  )
  const templated: ImageGenerationRequest = {
    ...request,
    prompt: composeImagePrompt({
      brief: request.prompt,
      template,
      globalInstructions: settings.imageGeneration.globalInstructions,
    }),
  }
  if (templated.requestedCount > MAX_IMAGE_BATCH_COUNT) {
    new Notice(
      `A maximum of ${MAX_IMAGE_BATCH_COUNT} images can be queued at once. Queuing ${MAX_IMAGE_BATCH_COUNT}.`,
    )
  }
  let referenceImagePaths: string[] = []
  try {
    referenceImagePaths = await storeReferenceImages({
      app,
      images: submission.referenceImages,
      batchId: originMessageId,
    })
  } catch (error) {
    new Notice(
      `Reference images could not be saved: ${
        error instanceof Error ? error.message : String(error)
      }`,
    )
    return { queued: 0, taskIds: [] }
  }
  const result = await enqueueImageGenerationBatch(taskManager, templated, {
    conversationId,
    originMessageId,
    sourcePrompt,
    modelId: imageModel.id,
    targetFilePath:
      submission.targetFilePath ?? app.workspace.getActiveFile()?.path,
    referenceImagePaths,
    origin: submission.origin,
  })
  if (result.error) {
    new Notice(
      `Queued ${result.queuedCount} of ${result.total} images. ${
        result.error instanceof Error
          ? result.error.message
          : String(result.error)
      }`,
    )
  }
  return { queued: result.queuedCount, taskIds: result.taskIds }
}
