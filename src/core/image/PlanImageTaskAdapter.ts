import { App, Platform, base64ToArrayBuffer, normalizePath } from 'obsidian'
import { v4 as uuidv4 } from 'uuid'

import { SmartComposerSettings } from '../../settings/schema/setting.types'
import {
  ArtifactRecord,
  BackgroundTaskAdapter,
  BackgroundTaskRecord,
  BackgroundTaskRunContext,
  BackgroundTaskRunResult,
} from '../../types/background-task'
import { BackgroundTaskManager } from '../tasks/BackgroundTaskManager'

import { copyImageToClipboard } from './clipboard-image'
import { uploadWithCmdsEagle } from './CmdsEagleBridge'
import { importArtifactToEagle } from './eagle-artifact'
import {
  IMAGE_EXTENSION_BY_MIME,
  isImageGenerator,
  sniffImageMimeType,
} from './image-generator'
import { resolveImageOutputFolder } from './output-folder'
import {
  loadReferenceImageDataUrls,
  readReferenceImagePaths,
} from './reference-image-store'
import { resolveImageGenerationModel } from './resolve-image-model'

export class PlanImageTaskAdapter implements BackgroundTaskAdapter {
  readonly kind = 'image-generation' as const

  constructor(
    private readonly app: App,
    private readonly taskManager: BackgroundTaskManager,
    private readonly getSettings: () => SmartComposerSettings,
    private readonly setSettings: (
      settings: SmartComposerSettings,
    ) => void | Promise<void>,
  ) {}

  async run(
    task: BackgroundTaskRecord,
    context: BackgroundTaskRunContext,
  ): Promise<BackgroundTaskRunResult> {
    if (!Platform.isDesktop) {
      throw new Error(
        'Plan image generation currently requires Obsidian desktop.',
      )
    }
    const prompt =
      typeof task.input.prompt === 'string' ? task.input.prompt.trim() : ''
    if (!prompt) throw new Error('Image prompt is empty.')

    const settings = this.getSettings()
    const requestedModelId =
      typeof task.input.modelId === 'string'
        ? task.input.modelId
        : (resolveImageGenerationModel(settings).model?.id ??
          settings.imageGeneration.modelId)
    const { getChatModelClient } = await import('../llm/manager')
    const { providerClient, model } = getChatModelClient({
      modelId: requestedModelId,
      settings,
      setSettings: this.setSettings,
    })
    if (!isImageGenerator(providerClient)) {
      throw new Error(`Model "${model.id}" cannot generate images.`)
    }

    await context.updateProgress({
      phase: 'preparing',
      message: `Preparing image request (${model.id})`,
    })
    const referenceImages = await loadReferenceImageDataUrls({
      app: this.app,
      paths: readReferenceImagePaths(task.input),
    })
    const generated = await providerClient.generateImage(model, prompt, {
      quality: settings.imageGeneration.quality,
      referenceImages,
      signal: context.signal,
      onProgress: (phase, partialImageIndex) => {
        void context.updateProgress({
          phase,
          current: partialImageIndex,
          message:
            phase === 'receiving'
              ? 'Receiving image preview'
              : 'Generating image',
        })
      },
    })

    await context.updateProgress({
      phase: 'saving',
      message: 'Saving recoverable local image',
    })
    const bytes = base64ToArrayBuffer(generated.base64)
    const mimeType =
      sniffImageMimeType(bytes) ?? generated.mimeType ?? 'image/png'
    const dimensions = readPngDimensions(bytes)
    const folder = normalizePath(resolveImageOutputFolder(settings))
    await ensureFolder(this.app, folder)
    // Name the file after the user's own brief, not the composed prompt
    // (template + rules), so files stay recognisable in the folder.
    const briefForName =
      typeof task.input.batchBasePrompt === 'string'
        ? task.input.batchBasePrompt
        : typeof task.input.sourcePrompt === 'string'
          ? task.input.sourcePrompt
          : prompt
    const filename = `${Date.now()}-${
      sanitizeFilename(briefForName.split('\n')[0].slice(0, 48)) ||
      'generated-image'
    }.${IMAGE_EXTENSION_BY_MIME[mimeType] ?? 'png'}`
    const path = await getAvailablePath(this.app, folder, filename)
    await this.app.vault.createBinary(path, bytes)

    const artifact: ArtifactRecord = {
      schemaVersion: 1,
      id: uuidv4(),
      taskId: task.id,
      kind: 'image',
      createdAt: Date.now(),
      localPath: path,
      mimeType,
      byteSize: bytes.byteLength,
      width: dimensions?.width,
      height: dimensions?.height,
      checksum: await sha256(bytes),
    }
    await this.taskManager.saveArtifact(artifact)
    const copied =
      settings.imageGeneration.copyToClipboard && copyImageToClipboard(bytes)
    const delivered = await this.preDeliver(artifact, prompt, context)
    await context.updateProgress({
      phase: 'awaiting-destination',
      message: `${delivered ?? 'Image ready · choose a destination'}${
        copied ? ' · copied to clipboard' : ''
      }`,
    })
    return {
      status: 'awaiting-destination',
      artifactIds: [artifact.id],
    }
  }

  /**
   * Runs the configured destination (R-034) right after the vault copy exists.
   * Eagle and cloud hand-offs are recorded on the artifact so the task card can
   * insert the resulting link; the card still decides what goes into the note.
   * Any failure keeps the vault copy and is reported in the progress message.
   */
  private async preDeliver(
    artifact: ArtifactRecord,
    prompt: string,
    context: BackgroundTaskRunContext,
  ): Promise<string | null> {
    const settings = this.getSettings()
    const destination = settings.imageGeneration.destination
    if (!artifact.localPath || !artifact.mimeType) return null
    try {
      if (destination === 'eagle') {
        const { artifact: updated } = await importArtifactToEagle({
          app: this.app,
          settings,
          artifact,
          annotation: prompt,
          onStatus: (message) =>
            void context.updateProgress({ phase: 'delivering', message }),
        })
        await this.taskManager.saveArtifact(updated)
        return 'Imported into Eagle · insert the link'
      }
      if (destination === 'cloud') {
        await context.updateProgress({
          phase: 'delivering',
          message: 'Uploading through CMDS Eagle',
        })
        const url = await uploadWithCmdsEagle(
          this.app,
          artifact.localPath,
          artifact.mimeType,
        )
        await this.taskManager.saveArtifact({ ...artifact, remoteUrl: url })
        return 'Uploaded to cloud · insert the link'
      }
      return null
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      return `${destination === 'eagle' ? 'Eagle import' : 'Cloud upload'} failed · local image preserved (${message})`
    }
  }
}

export function readPngDimensions(
  buffer: ArrayBuffer,
): { width: number; height: number } | null {
  if (buffer.byteLength < 24) return null
  const bytes = new Uint8Array(buffer, 0, 24)
  const signature = [137, 80, 78, 71, 13, 10, 26, 10]
  if (signature.some((value, index) => bytes[index] !== value)) return null
  const view = new DataView(buffer)
  return {
    width: view.getUint32(16, false),
    height: view.getUint32(20, false),
  }
}

async function ensureFolder(app: App, path: string): Promise<void> {
  if (!path || app.vault.getAbstractFileByPath(path)) return
  const parts = path.split('/')
  let current = ''
  for (const part of parts) {
    current = current ? `${current}/${part}` : part
    if (!app.vault.getAbstractFileByPath(current)) {
      await app.vault.createFolder(current)
    }
  }
}

async function getAvailablePath(
  app: App,
  folder: string,
  filename: string,
): Promise<string> {
  const dot = filename.lastIndexOf('.')
  const stem = dot >= 0 ? filename.slice(0, dot) : filename
  const extension = dot >= 0 ? filename.slice(dot) : ''
  for (let index = 0; index < Number.MAX_SAFE_INTEGER; index += 1) {
    const suffix = index === 0 ? '' : `-${index}`
    const candidate = normalizePath(`${folder}/${stem}${suffix}${extension}`)
    if (!app.vault.getAbstractFileByPath(candidate)) return candidate
  }
  throw new Error('Unable to allocate a unique image filename.')
}

function sanitizeFilename(value: string): string {
  return value
    .replace(/[\\/:*?"<>|#^[\]]/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

async function sha256(buffer: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', buffer)
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}
