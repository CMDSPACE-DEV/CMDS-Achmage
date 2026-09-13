import { Editor, MarkdownView, Notice, Plugin } from 'obsidian'

import { ChatView } from './ChatView'
import type { ChatProps } from './components/chat-view/Chat'
import { GenerateImageModal } from './components/modals/GenerateImageModal'
import { InstallerUpdateRequiredModal } from './components/modals/InstallerUpdateRequiredModal'
import { CHAT_VIEW_TYPE } from './constants'
import { ConversationRunManager } from './core/conversation/ConversationRunManager'
import { copyImageToClipboard } from './core/image/clipboard-image'
import {
  needsBriefSynthesis,
  stripFrontmatter,
  writeImageBriefFromText,
} from './core/image/image-brief'
import type { ImageGenerationSubmission } from './core/image/image-request'
import { saveImageToVault } from './core/image/save-image'
import { renderTextCard } from './core/image/text-card'
import type { InlineEditController } from './core/inline/InlineEditController'
import type { McpManager } from './core/mcp/mcpManager'
import {
  McpSecretStore,
  migrateLegacyMcpSecrets,
} from './core/mcp/McpSecretStore'
import type { RAGEngine } from './core/rag/ragEngine'
import type { ResearchManager } from './core/research/ResearchManager'
import {
  ResearchSecretStore,
  migrateLegacyResearchSecrets,
} from './core/research/ResearchSecretStore'
import { BackgroundTaskManager } from './core/tasks/BackgroundTaskManager'
import { LazyBackgroundTaskAdapter } from './core/tasks/LazyBackgroundTaskAdapter'
import {
  IMAGE_STRUCTURE_LABELS,
  IMAGE_STRUCTURE_MODES,
  ImageStructureMode,
  convertImageToMarkdown,
  readClipboardImage,
} from './core/vision/imageToMarkdown'
import type { DatabaseManager } from './database/DatabaseManager'
import { PGLiteAbortedException } from './database/exception'
import {
  SmartComposerSettings,
  smartComposerSettingsSchema,
} from './settings/schema/setting.types'
import { parseSmartComposerSettings } from './settings/schema/settings'
import { SmartComposerSettingTab } from './settings/SettingTab'
import {
  applyAppearanceToBody,
  clearSkinModeFromBody,
} from './utils/chat/chatSkin'
import { getMentionableBlockData } from './utils/obsidian'
import { SettingsSaveQueue } from './utils/settingsSaveQueue'

export default class SmartComposerPlugin extends Plugin {
  settings: SmartComposerSettings
  initialChatProps?: ChatProps
  settingsChangeListeners: ((newSettings: SmartComposerSettings) => void)[] = []
  mcpManager: McpManager | null = null
  researchManager: ResearchManager | null = null
  dbManager: DatabaseManager | null = null
  ragEngine: RAGEngine | null = null
  backgroundTaskManager: BackgroundTaskManager | null = null
  inlineEditController: InlineEditController | null = null
  conversationRunManager: ConversationRunManager | null = null
  private dbManagerInitPromise: Promise<DatabaseManager> | null = null
  private ragEngineInitPromise: Promise<RAGEngine> | null = null
  private mcpManagerInitPromise: Promise<McpManager> | null = null
  private researchManagerInitPromise: Promise<ResearchManager> | null = null
  private inlineEditControllerInitPromise: Promise<InlineEditController> | null =
    null
  private settingsSaveQueue: SettingsSaveQueue<SmartComposerSettings> | null =
    null
  private timeoutIds: ReturnType<typeof setTimeout>[] = [] // Use ReturnType instead of number
  private unloading = false

  async onload() {
    markPerformance('smart-composer:onload:start')
    this.unloading = false
    await this.loadSettings()
    const taskManager = new BackgroundTaskManager(this.app)
    this.backgroundTaskManager = taskManager
    await taskManager.initialize()
    this.register(
      taskManager.registerAdapter(
        new LazyBackgroundTaskAdapter('image-generation', async () => {
          const { PlanImageTaskAdapter } = await import(
            './core/image/PlanImageTaskAdapter'
          )
          return new PlanImageTaskAdapter(
            this.app,
            taskManager,
            () => this.settings,
            (settings) => this.setSettings(settings),
          )
        }),
      ),
    )
    this.register(
      taskManager.registerAdapter(
        new LazyBackgroundTaskAdapter('mcp-tool-call', async () => {
          const { McpToolTaskAdapter } = await import(
            './core/mcp/McpToolTaskAdapter'
          )
          return new McpToolTaskAdapter(this)
        }),
      ),
    )
    this.register(
      taskManager.registerAdapter(
        new LazyBackgroundTaskAdapter('artifact-draft', async () => {
          const { ArtifactTaskAdapter } = await import(
            './core/artifacts/ArtifactTaskAdapter'
          )
          return new ArtifactTaskAdapter(this)
        }),
      ),
    )
    this.register(
      taskManager.registerAdapter(
        new LazyBackgroundTaskAdapter(
          'document-edit',
          async () => {
            const { DocumentEditTaskAdapter } = await import(
              './core/document-edit/DocumentEditTaskAdapter'
            )
            return new DocumentEditTaskAdapter(this, taskManager)
          },
          () => this.settings.documentEditing.concurrency,
        ),
      ),
    )
    this.conversationRunManager = new ConversationRunManager(this.app)

    this.registerView(CHAT_VIEW_TYPE, (leaf) => new ChatView(leaf, this))

    // Mirror the appearance (skin, accent preset, glow) onto <body> for
    // surfaces without a settings handle (the inline edit Shadow DOM widget).
    // See utils/chat/chatSkin.ts.
    applyAppearanceToBody(document.body, this.settings.appearance)
    this.register(
      this.addSettingsChangeListener((settings) =>
        applyAppearanceToBody(document.body, settings.appearance),
      ),
    )

    // This creates an icon in the left ribbon.
    this.addRibbonIcon('wand-sparkles', 'Open CMDS Achmage chat', () =>
      this.openChatView(),
    )

    // This adds a simple command that can be triggered anywhere
    this.addCommand({
      id: 'open-new-chat',
      name: 'Open chat',
      callback: () => this.openChatView(true),
    })

    this.addCommand({
      id: 'add-selection-to-chat',
      name: 'Add selection to chat',
      editorCallback: (editor: Editor, view: MarkdownView) => {
        this.addSelectionToChat(editor, view)
      },
    })

    this.addCommand({
      id: 'inline-edit',
      name: 'Inline edit selection',
      hotkeys: [{ modifiers: ['Mod', 'Shift'], key: 'k' }],
      editorCallback: (editor: Editor, view: MarkdownView) => {
        void this.openInlineEdit(editor, view)
      },
    })

    this.addCommand({
      id: 'generate-image',
      name: 'Generate image (text to image)…',
      callback: () => new GenerateImageModal(this).open(),
    })

    this.addCommand({
      id: 'generate-image-from-selection',
      name: 'Generate image from selection',
      editorCallback: (editor: Editor, view: MarkdownView) => {
        void this.openImageFromText(editor.getSelection(), view, 'selection')
      },
    })

    this.addCommand({
      id: 'generate-image-from-note',
      name: 'Generate image from current note',
      editorCallback: (editor: Editor, view: MarkdownView) => {
        void this.openImageFromText(editor.getValue(), view, 'note')
      },
    })

    this.addCommand({
      id: 'render-selection-as-image-card',
      name: 'Render selection as image card (text as image)',
      editorCallback: (editor: Editor, view: MarkdownView) => {
        void this.renderSelectionAsImageCard(editor, view)
      },
    })

    this.addCommand({
      id: 'generate-image-from-clipboard',
      name: 'Generate image from clipboard image (image to image)…',
      callback: async () => {
        const image = await readClipboardImage()
        if (!image) {
          new Notice('No image on the clipboard. Copy an image first.')
          return
        }
        new GenerateImageModal(this, {
          title: 'Generate image from clipboard image',
          referenceImages: [
            {
              name: 'clipboard.png',
              mimeType: image.mimeType,
              data: image.dataUrl,
            },
          ],
          origin: 'clipboard',
        }).open()
      },
    })

    for (const structureMode of IMAGE_STRUCTURE_MODES) {
      this.addCommand({
        id: `clipboard-image-to-${structureMode}`,
        name: `Convert clipboard image to ${IMAGE_STRUCTURE_LABELS[structureMode]}`,
        editorCallback: (editor: Editor) => {
          void this.convertClipboardImage(editor, structureMode)
        },
      })
    }

    this.addCommand({
      id: 'review-document-edit-jobs',
      name: 'Review document edit jobs',
      callback: () => {
        void import('./core/document-edit/DocumentEditReviewModal').then(
          ({ DocumentEditJobsModal }) => {
            new DocumentEditJobsModal(this).open()
          },
        )
      },
    })

    this.registerEvent(
      this.app.workspace.on('editor-menu', (menu, editor, info) => {
        if (!(info instanceof MarkdownView)) return
        menu.addItem((item) => {
          item
            .setTitle('CMDS Achmage: Inline edit')
            .setIcon('wand-sparkles')
            .setSection('action')
            .onClick(() => {
              void this.openInlineEdit(editor, info)
            })
        })
        const selection = editor.getSelection()
        if (selection) {
          menu.addItem((item) => {
            item
              .setTitle('CMDS Achmage: Render selection as image card')
              .setIcon('image-plus')
              .setSection('action')
              .onClick(() => {
                void this.renderSelectionAsImageCard(editor, info)
              })
          })
        }
        menu.addItem((item) => {
          item
            .setTitle(
              selection
                ? 'CMDS Achmage: Generate image from selection'
                : 'CMDS Achmage: Generate image from note',
            )
            .setIcon('image')
            .setSection('action')
            .onClick(() => {
              void this.openImageFromText(
                selection || editor.getValue(),
                info,
                selection ? 'selection' : 'note',
              )
            })
        })
      }),
    )

    this.addCommand({
      id: 'rebuild-vault-index',
      name: 'Rebuild entire vault index',
      callback: async () => {
        const notice = new Notice('Rebuilding vault index...', 0)
        try {
          const ragEngine = await this.getRAGEngine()
          await ragEngine.updateVaultIndex(
            { reindexAll: true },
            (queryProgress) => {
              if (queryProgress.type === 'indexing') {
                const { completedChunks, totalChunks } =
                  queryProgress.indexProgress
                notice.setMessage(
                  `Indexing chunks: ${completedChunks} / ${totalChunks}${
                    queryProgress.indexProgress.waitingForRateLimit
                      ? '\n(waiting for rate limit to reset)'
                      : ''
                  }`,
                )
              }
            },
          )
          notice.setMessage('Rebuilding vault index complete')
        } catch (error) {
          console.error(error)
          notice.setMessage('Rebuilding vault index failed')
        } finally {
          this.registerTimeout(() => {
            notice.hide()
          }, 1000)
        }
      },
    })

    this.addCommand({
      id: 'update-vault-index',
      name: 'Update index for modified files',
      callback: async () => {
        const notice = new Notice('Updating vault index...', 0)
        try {
          const ragEngine = await this.getRAGEngine()
          await ragEngine.updateVaultIndex(
            { reindexAll: false },
            (queryProgress) => {
              if (queryProgress.type === 'indexing') {
                const { completedChunks, totalChunks } =
                  queryProgress.indexProgress
                notice.setMessage(
                  `Indexing chunks: ${completedChunks} / ${totalChunks}${
                    queryProgress.indexProgress.waitingForRateLimit
                      ? '\n(waiting for rate limit to reset)'
                      : ''
                  }`,
                )
              }
            },
          )
          notice.setMessage('Vault index updated')
        } catch (error) {
          console.error(error)
          notice.setMessage('Vault index update failed')
        } finally {
          this.registerTimeout(() => {
            notice.hide()
          }, 1000)
        }
      },
    })

    // This adds a settings tab so the user can configure various aspects of the plugin
    this.addSettingTab(new SmartComposerSettingTab(this.app, this))

    void this.migrateToJsonStorage()
    markPerformance('smart-composer:onload:end')
    measurePerformance(
      'smart-composer:onload',
      'smart-composer:onload:start',
      'smart-composer:onload:end',
    )
  }

  onunload() {
    this.unloading = true
    clearSkinModeFromBody(document.body)
    void this.backgroundTaskManager?.cleanup()
    this.backgroundTaskManager = null
    this.inlineEditController?.cleanup()
    this.inlineEditController = null
    this.conversationRunManager = null
    // clear all timers
    this.timeoutIds.forEach((id) => clearTimeout(id))
    this.timeoutIds = []

    // RagEngine cleanup
    this.ragEngine?.cleanup()
    this.ragEngine = null

    // Promise cleanup
    this.dbManagerInitPromise = null
    this.ragEngineInitPromise = null
    this.mcpManagerInitPromise = null
    this.researchManagerInitPromise = null
    this.inlineEditControllerInitPromise = null

    // DatabaseManager cleanup
    this.dbManager?.cleanup()
    this.dbManager = null

    // McpManager cleanup
    this.mcpManager?.cleanup()
    this.mcpManager = null
    this.researchManager?.cleanup()
    this.researchManager = null
  }

  async loadSettings() {
    const parsedSettings = parseSmartComposerSettings(await this.loadData())
    const secretMigration = migrateLegacyMcpSecrets(
      parsedSettings,
      new McpSecretStore(this.app),
    )
    const researchSecretMigration = migrateLegacyResearchSecrets(
      secretMigration.settings,
      new ResearchSecretStore(this.app),
    )
    this.settings = researchSecretMigration.settings
    await this.saveData(this.settings) // Save updated settings
    this.settingsSaveQueue = new SettingsSaveQueue(this.settings)
  }

  async setSettings(newSettings: SmartComposerSettings) {
    const validationResult = smartComposerSettingsSchema.safeParse(newSettings)

    if (!validationResult.success) {
      new Notice(`Invalid settings:
${validationResult.error.issues.map((v) => v.message).join('\n')}`)
      return
    }

    const previousSettings = this.settings
    this.settings = newSettings
    this.ragEngine?.setSettings(newSettings)
    this.settingsChangeListeners.forEach((listener) => listener(newSettings))

    const settingsSaveQueue =
      this.settingsSaveQueue ?? new SettingsSaveQueue(previousSettings)
    this.settingsSaveQueue = settingsSaveQueue
    const saveOperation = settingsSaveQueue.enqueue(newSettings, (settings) =>
      this.saveData(settings),
    )

    try {
      await saveOperation
    } catch (error) {
      if (this.settings === newSettings) {
        const persistedSettings = settingsSaveQueue.persistedValue
        this.settings = persistedSettings
        this.ragEngine?.setSettings(persistedSettings)
        this.settingsChangeListeners.forEach((listener) =>
          listener(persistedSettings),
        )
      }
      throw error
    }
  }

  addSettingsChangeListener(
    listener: (newSettings: SmartComposerSettings) => void,
  ) {
    this.settingsChangeListeners.push(listener)
    return () => {
      this.settingsChangeListeners = this.settingsChangeListeners.filter(
        (l) => l !== listener,
      )
    }
  }

  async openChatView(openNewChat = false) {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView)
    const editor = view?.editor
    if (!view || !editor) {
      this.activateChatView(undefined, openNewChat)
      return
    }
    const selectedBlockData = await getMentionableBlockData(editor, view)
    this.activateChatView(
      {
        selectedBlock: selectedBlockData ?? undefined,
      },
      openNewChat,
    )
  }

  async activateChatView(chatProps?: ChatProps, openNewChat = false) {
    // chatProps is consumed in ChatView.tsx
    this.initialChatProps = chatProps

    const leaf = this.app.workspace.getLeavesOfType(CHAT_VIEW_TYPE)[0]

    await (leaf ?? this.app.workspace.getRightLeaf(false))?.setViewState({
      type: CHAT_VIEW_TYPE,
      active: true,
    })

    if (openNewChat && leaf && leaf.view instanceof ChatView) {
      leaf.view.openNewChat(chatProps?.selectedBlock)
    }

    this.app.workspace.revealLeaf(
      this.app.workspace.getLeavesOfType(CHAT_VIEW_TYPE)[0],
    )
  }

  /** Route every image job through the chat view's queue (R-036). */
  async generateImage(submission: ImageGenerationSubmission): Promise<void> {
    const leaves = this.app.workspace.getLeavesOfType(CHAT_VIEW_TYPE)
    if (leaves.length === 0 || !(leaves[0].view instanceof ChatView)) {
      await this.activateChatView()
    }
    const leaf = this.app.workspace.getLeavesOfType(CHAT_VIEW_TYPE)[0]
    if (!leaf || !(leaf.view instanceof ChatView)) {
      new Notice('Could not open the chat pane for the image queue.')
      return
    }
    await this.app.workspace.revealLeaf(leaf)
    leaf.view.generateImage(submission)
  }

  /**
   * Selected text → PNG card (R-037): drawn locally, saved to the image output
   * folder, copied to the clipboard, optionally embedded after the selection.
   */
  async renderSelectionAsImageCard(editor: Editor, view: MarkdownView) {
    const text = editor.getSelection().trim()
    if (!text) {
      new Notice('Select the text you want on the card first.')
      return
    }
    const { textCard, outputFolder } = this.settings.imageGeneration
    try {
      const bytes = await renderTextCard(view.containerEl.ownerDocument, text, {
        style: textCard.style,
        width: textCard.width,
        brand: textCard.brand,
        caption: view.file?.basename,
      })
      const path = await saveImageToVault(
        this.app,
        outputFolder,
        `card-${text.slice(0, 40)}`,
        'png',
        bytes,
      )
      const copied = copyImageToClipboard(bytes)
      if (textCard.insertEmbed) {
        const end = editor.getCursor('to')
        editor.replaceRange(`\n![[${path}]]\n`, end)
      }
      new Notice(
        `Text card saved to ${path}${copied ? ' and copied to the clipboard' : ''}`,
      )
    } catch (error) {
      new Notice(
        `Text card failed: ${error instanceof Error ? error.message : String(error)}`,
      )
    }
  }

  /**
   * Note / selection → image: short text is the brief itself, long text is
   * condensed into a brief by the chat model, then the modal opens for review.
   */
  async openImageFromText(
    text: string,
    view: MarkdownView,
    origin: 'selection' | 'note',
  ): Promise<void> {
    const source = stripFrontmatter(text)
    if (!source) {
      new Notice('Nothing to work from: the selection or note is empty.')
      return
    }
    let brief = source
    if (needsBriefSynthesis(source)) {
      const notice = new Notice('Writing an image brief from the note…', 0)
      try {
        brief = await writeImageBriefFromText({
          settings: this.settings,
          setSettings: (next) => this.setSettings(next),
          text: source,
          title: view.file?.basename,
        })
      } catch (error) {
        notice.hide()
        new Notice(
          `Could not write a brief: ${error instanceof Error ? error.message : String(error)}`,
        )
        return
      }
      notice.hide()
    }
    new GenerateImageModal(this, {
      title:
        origin === 'note'
          ? `Generate image from “${view.file?.basename ?? 'note'}”`
          : 'Generate image from selection',
      brief,
      targetFilePath: view.file?.path,
      origin,
    }).open()
  }

  /**
   * Clipboard image → Markdown at the cursor (R-035). The image never touches
   * the vault; only the resulting Markdown is inserted.
   */
  async convertClipboardImage(editor: Editor, mode: ImageStructureMode) {
    const image = await readClipboardImage()
    if (!image) {
      new Notice(
        'No image on the clipboard. Copy a screenshot or an image first.',
      )
      return
    }
    const notice = new Notice(
      `Reading the image as ${IMAGE_STRUCTURE_LABELS[mode]}…`,
      0,
    )
    try {
      const cursorLine = editor.getLine(editor.getCursor().line).trim()
      const markdown = await convertImageToMarkdown({
        settings: this.settings,
        setSettings: (next) => this.setSettings(next),
        image,
        mode,
        hint: cursorLine || undefined,
      })
      const selection = editor.getSelection()
      const block = `${markdown}\n`
      if (selection) editor.replaceSelection(block)
      else editor.replaceRange(block, editor.getCursor())
      notice.hide()
      new Notice('Inserted Markdown from the clipboard image.')
    } catch (error) {
      notice.hide()
      new Notice(
        `Image conversion failed: ${error instanceof Error ? error.message : String(error)}`,
      )
    }
  }

  async addSelectionToChat(editor: Editor, view: MarkdownView) {
    const data = await getMentionableBlockData(editor, view)
    if (!data) return

    const leaves = this.app.workspace.getLeavesOfType(CHAT_VIEW_TYPE)
    if (leaves.length === 0 || !(leaves[0].view instanceof ChatView)) {
      await this.activateChatView({
        selectedBlock: data,
      })
      return
    }

    // bring leaf to foreground (uncollapse sidebar if it's collapsed)
    await this.app.workspace.revealLeaf(leaves[0])

    const chatView = leaves[0].view
    chatView.addSelectionToChat(data)
    chatView.focusMessage()
  }

  async getDbManager(): Promise<DatabaseManager> {
    if (this.dbManager) {
      return this.dbManager
    }

    if (!this.dbManagerInitPromise) {
      this.dbManagerInitPromise = (async () => {
        try {
          const { DatabaseManager } = await import('./database/DatabaseManager')
          this.dbManager = await DatabaseManager.create(this.app)
          return this.dbManager
        } catch (error) {
          this.dbManagerInitPromise = null
          if (error instanceof PGLiteAbortedException) {
            new InstallerUpdateRequiredModal(this.app).open()
          }
          throw error
        }
      })()
    }

    // if initialization is running, wait for it to complete instead of creating a new initialization promise
    return this.dbManagerInitPromise
  }

  async getRAGEngine(): Promise<RAGEngine> {
    if (this.ragEngine) {
      return this.ragEngine
    }

    if (!this.ragEngineInitPromise) {
      this.ragEngineInitPromise = (async () => {
        try {
          const { RAGEngine } = await import('./core/rag/ragEngine')
          const dbManager = await this.getDbManager()
          this.ragEngine = new RAGEngine(
            this.app,
            this.settings,
            dbManager.getVectorManager(),
          )
          return this.ragEngine
        } catch (error) {
          this.ragEngineInitPromise = null
          throw error
        }
      })()
    }

    return this.ragEngineInitPromise
  }

  async getMcpManager(): Promise<McpManager> {
    if (this.mcpManager) {
      return this.mcpManager
    }

    if (!this.mcpManagerInitPromise) {
      this.mcpManagerInitPromise = (async () => {
        const { McpManager } = await import('./core/mcp/mcpManager')
        const manager = new McpManager({
          app: this.app,
          settings: this.settings,
          setSettings: (settings) => this.setSettings(settings),
          registerSettingsListener: (
            listener: (settings: SmartComposerSettings) => void,
          ) => this.addSettingsChangeListener(listener),
        })
        await manager.initialize()
        if (this.unloading) {
          manager.cleanup()
          throw new Error('CMDS Achmage unloaded during MCP initialization.')
        }
        this.mcpManager = manager
        return manager
      })().catch((error) => {
        this.mcpManagerInitPromise = null
        this.mcpManager = null
        throw error
      })
    }

    return this.mcpManagerInitPromise
  }

  async getResearchManager(): Promise<ResearchManager> {
    if (this.researchManager) return this.researchManager
    if (!this.researchManagerInitPromise) {
      this.researchManagerInitPromise = import(
        './core/research/ResearchManager'
      )
        .then(({ ResearchManager }) => {
          const manager = new ResearchManager({
            app: this.app,
            settings: this.settings,
            setSettings: (settings) => this.setSettings(settings),
            registerSettingsListener: (
              listener: (settings: SmartComposerSettings) => void,
            ) => this.addSettingsChangeListener(listener),
          })
          if (this.unloading) {
            manager.cleanup()
            throw new Error(
              'CMDS Achmage unloaded during research initialization.',
            )
          }
          this.researchManager = manager
          return manager
        })
        .catch((error) => {
          this.researchManagerInitPromise = null
          this.researchManager = null
          throw error
        })
    }
    return this.researchManagerInitPromise
  }

  private registerTimeout(callback: () => void, timeout: number): void {
    const timeoutId = setTimeout(callback, timeout)
    this.timeoutIds.push(timeoutId)
  }

  private async migrateToJsonStorage() {
    try {
      const { migrateToJsonDatabaseIfNeeded } = await import(
        './database/json/migrateToJsonDatabase'
      )
      await migrateToJsonDatabaseIfNeeded(
        this.app,
        () => this.getDbManager(),
        async () => {
          await this.reloadChatView()
          console.log('Migration to JSON storage completed successfully')
        },
      )
    } catch (error) {
      console.error('Failed to migrate to JSON storage:', error)
      new Notice(
        'Failed to migrate to JSON storage. Please check the console for details.',
      )
    }
  }

  private async reloadChatView() {
    const leaves = this.app.workspace.getLeavesOfType(CHAT_VIEW_TYPE)
    if (leaves.length === 0 || !(leaves[0].view instanceof ChatView)) {
      return
    }
    new Notice('Reloading "smart-composer" due to migration', 1000)
    leaves[0].detach()
    await this.activateChatView()
  }

  private async openInlineEdit(
    editor: Editor,
    view: MarkdownView,
  ): Promise<void> {
    try {
      const controller = await this.getInlineEditController()
      if (!this.unloading) {
        controller.open(editor, view)
      }
    } catch (error) {
      if (this.unloading) return
      console.error('Failed to initialize inline edit:', error)
      new Notice('CMDS Achmage inline edit could not be initialized.')
    }
  }

  private getInlineEditController(): Promise<InlineEditController> {
    if (this.inlineEditController) {
      return Promise.resolve(this.inlineEditController)
    }
    if (!this.inlineEditControllerInitPromise) {
      this.inlineEditControllerInitPromise = import(
        './core/inline/InlineEditController'
      )
        .then(({ InlineEditController }) => {
          const controller = new InlineEditController(this)
          if (this.unloading) {
            controller.cleanup()
            throw new Error(
              'CMDS Achmage unloaded during inline edit initialization.',
            )
          }
          this.inlineEditController = controller
          return controller
        })
        .catch((error) => {
          this.inlineEditControllerInitPromise = null
          throw error
        })
    }
    return this.inlineEditControllerInitPromise
  }
}

function markPerformance(name: string): void {
  try {
    globalThis.performance?.mark(name)
  } catch {
    // Performance Timeline instrumentation must never affect plugin behavior.
  }
}

function measurePerformance(
  name: string,
  startMark: string,
  endMark: string,
): void {
  try {
    globalThis.performance?.measure(name, startMark, endMark)
  } catch {
    // Performance Timeline instrumentation must never affect plugin behavior.
  }
}
