import { Modal, Notice, Setting } from 'obsidian'

import {
  ImageGenerationSubmission,
  ImagePurpose,
} from '../../core/image/image-request'
import { ReferenceImageInput } from '../../core/image/reference-image-store'
import { resolveImageGenerationModel } from '../../core/image/resolve-image-model'
import { getProviderCapabilities } from '../../core/llm/providerCapabilities'
import { readClipboardImage } from '../../core/vision/imageToMarkdown'
import type SmartComposerPlugin from '../../main'
import { MAX_IMAGE_BATCH_COUNT } from '../../utils/chat/imageIntent'

import { VaultImageSuggestModal } from './VaultImageSuggestModal'

export type GenerateImageModalOptions = {
  brief?: string
  templateId?: string
  referenceImages?: ReferenceImageInput[]
  targetFilePath?: string
  origin?: ImageGenerationSubmission['origin']
  title?: string
}

/**
 * One place to start an image job outside the chat composer (R-036):
 * text → image, note → image (pre-filled brief), image → image (references).
 * Submits through the chat view so the job lands in the same queue and cards.
 */
export class GenerateImageModal extends Modal {
  private brief: string
  private templateId: string
  private count = 1
  private modelId: string
  private referenceImages: ReferenceImageInput[]
  private referencesEl: HTMLElement | null = null

  constructor(
    private readonly plugin: SmartComposerPlugin,
    private readonly options: GenerateImageModalOptions = {},
  ) {
    super(plugin.app)
    this.brief = options.brief ?? ''
    const purpose: ImagePurpose =
      options.origin && options.origin !== 'modal' ? options.origin : 'text'
    this.templateId =
      options.templateId ??
      plugin.settings.imageGeneration.templateByPurpose[purpose] ??
      ''
    this.referenceImages = [...(options.referenceImages ?? [])]
    this.modelId = resolveImageGenerationModel(plugin.settings).model?.id ?? ''
  }

  onOpen(): void {
    const settings = this.plugin.settings
    this.titleEl.setText(this.options.title ?? 'Generate image')
    this.contentEl.empty()
    this.contentEl.addClass('smtcmp-generate-image-modal')

    new Setting(this.contentEl)
      .setName('Brief')
      .setDesc(
        'What the image should show. A template below is prepended; keep style rules there and the subject here.',
      )
      .addTextArea((area) => {
        area.setValue(this.brief).onChange((value) => {
          this.brief = value
        })
        area.inputEl.rows = 6
        area.inputEl.addClass('smtcmp-generate-image-modal__brief')
      })

    new Setting(this.contentEl).setName('Template').addDropdown((dropdown) => {
      dropdown.addOption('', 'No template')
      for (const template of settings.imageGeneration.promptTemplates) {
        dropdown.addOption(template.id, template.name)
      }
      dropdown.setValue(this.templateId).onChange((value) => {
        this.templateId = value
      })
    })

    new Setting(this.contentEl)
      .setName('Model')
      .setDesc('(plan) = subscription; others use the provider API key.')
      .addDropdown((dropdown) => {
        const models = settings.chatModels.filter(
          (model) =>
            (model.enable ?? true) &&
            getProviderCapabilities(model).imageGeneration,
        )
        for (const model of models) {
          dropdown.addOption(
            model.id,
            `${model.id} · ${getProviderCapabilities(model).plan ? 'Plan' : 'API key'}`,
          )
        }
        if (!models.some((model) => model.id === this.modelId)) {
          this.modelId = models[0]?.id ?? ''
        }
        dropdown.setValue(this.modelId).onChange((value) => {
          this.modelId = value
        })
      })

    new Setting(this.contentEl)
      .setName('Images')
      .setDesc('Variations of the same brief, queued as separate tasks.')
      .addDropdown((dropdown) => {
        for (let n = 1; n <= Math.min(4, MAX_IMAGE_BATCH_COUNT); n += 1) {
          dropdown.addOption(String(n), String(n))
        }
        dropdown.setValue(String(this.count)).onChange((value) => {
          this.count = Number.parseInt(value, 10) || 1
        })
      })

    const references = new Setting(this.contentEl)
      .setName('Reference images (image to image)')
      .setDesc(
        'GPT Plan and Gemini image models use them as the starting point; grok-imagine is text-to-image only.',
      )
    references.addButton((button) =>
      button.setButtonText('From clipboard').onClick(async () => {
        const image = await readClipboardImage()
        if (!image) {
          new Notice('No image on the clipboard.')
          return
        }
        this.addReference({
          name: `clipboard-${this.referenceImages.length + 1}.png`,
          mimeType: image.mimeType,
          data: image.dataUrl,
        })
      }),
    )
    references.addButton((button) =>
      button.setButtonText('From vault…').onClick(() => {
        new VaultImageSuggestModal(this.app, (image) =>
          this.addReference(image),
        ).open()
      }),
    )
    this.referencesEl = this.contentEl.createDiv({
      cls: 'smtcmp-generate-image-modal__references',
    })
    this.renderReferences()

    new Setting(this.contentEl).addButton((button) =>
      button
        .setButtonText('Generate')
        .setCta()
        .onClick(() => void this.submit()),
    )
  }

  onClose(): void {
    this.contentEl.empty()
  }

  private addReference(image: ReferenceImageInput): void {
    this.referenceImages.push(image)
    this.renderReferences()
  }

  private renderReferences(): void {
    const el = this.referencesEl
    if (!el) return
    el.empty()
    if (this.referenceImages.length === 0) {
      el.createSpan({
        cls: 'smtcmp-generate-image-modal__empty',
        text: 'No reference images.',
      })
      return
    }
    for (const [index, image] of this.referenceImages.entries()) {
      const item = el.createDiv({ cls: 'smtcmp-generate-image-modal__ref' })
      const img = item.createEl('img')
      img.src = image.data
      img.alt = image.name
      item.createSpan({ text: image.name })
      const remove = item.createEl('button', { text: 'Remove' })
      remove.addEventListener('click', () => {
        this.referenceImages.splice(index, 1)
        this.renderReferences()
      })
    }
  }

  private async submit(): Promise<void> {
    if (!this.brief.trim()) {
      new Notice('Write a brief for the image first.')
      return
    }
    if (!this.modelId) {
      new Notice(
        'No image-capable model is available. Add one under Settings → Image model.',
      )
      return
    }
    await this.plugin.generateImage({
      brief: this.brief,
      templateId: this.templateId || undefined,
      count: this.count,
      modelId: this.modelId,
      referenceImages: this.referenceImages,
      targetFilePath:
        this.options.targetFilePath ?? this.app.workspace.getActiveFile()?.path,
      origin: this.options.origin ?? 'modal',
    })
    this.close()
  }
}
