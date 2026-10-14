import {
  App,
  PluginSettingTab,
  Setting,
  type SettingDefinitionItem,
} from 'obsidian'

import type SmartComposerPlugin from '../main'

import type { SettingTabRenderer } from './SettingTabRenderer'

// Search terms for Obsidian 1.13+ settings search: the React UI's tabs,
// section titles, and the settings people look for most.
const SETTINGS_SEARCH_ALIASES = [
  'Plan',
  'Research',
  'Writing',
  'MCP',
  'Advanced',
  'Plan runtimes',
  'Default models',
  'Research connections',
  'Prompt and tools',
  'Inline edit',
  'Document drafts',
  'Image generation',
  'Prompt templates',
  'Vault search',
  'Appearance',
  'MCP connections',
  'Providers',
  'Models',
  'Maintenance',
  'Chat model',
  'Inline edit model',
  'Embedding model',
  'Image model',
  'API key',
  'Claude',
  'Gemini',
  'OpenAI login',
  'Eagle library',
  'Image output folder',
  'Document draft folder',
  'Reset settings',
]

export class SmartComposerSettingTab extends PluginSettingTab {
  plugin: SmartComposerPlugin
  private renderer: SettingTabRenderer | null = null
  private rendererInitPromise: Promise<SettingTabRenderer> | null = null
  private displayGeneration = 0
  private visible = false

  constructor(app: App, plugin: SmartComposerPlugin) {
    super(app, plugin)
    this.plugin = plugin
  }

  // Obsidian 1.13+ renders this instead of display(): one row that hosts the
  // existing React UI, so the tab looks the same and is found by search.
  getSettingDefinitions(): SettingDefinitionItem[] {
    return [
      {
        name: 'CMDS Achmage',
        aliases: SETTINGS_SEARCH_ALIASES,
        render: (setting) => this.mountDeclarative(setting.settingEl),
      },
    ]
  }

  // Fallback for Obsidian < 1.13, which ignores getSettingDefinitions().
  display(): void {
    this.visible = true
    const generation = ++this.displayGeneration
    this.containerEl.empty()
    void this.getRenderer()
      .then((renderer) => {
        if (!this.visible || generation !== this.displayGeneration) return
        renderer.render()
      })
      .catch((error) => {
        console.error('Failed to render CMDS Achmage settings:', error)
        if (!this.visible || generation !== this.displayGeneration) return
        this.renderLoadFailure(error)
      })
  }

  hide(): void {
    this.visible = false
    this.displayGeneration += 1
    this.renderer?.hide()
  }

  private getRenderer(): Promise<SettingTabRenderer> {
    if (this.renderer) return Promise.resolve(this.renderer)
    if (!this.rendererInitPromise) {
      this.rendererInitPromise = import('./SettingTabRenderer')
        .then(({ createSettingTabRenderer }) => {
          const renderer = createSettingTabRenderer({
            app: this.app,
            containerEl: this.containerEl,
            plugin: this.plugin,
          })
          this.renderer = renderer
          return renderer
        })
        .catch((error) => {
          this.rendererInitPromise = null
          throw error
        })
    }
    return this.rendererInitPromise
  }

  private mountDeclarative(hostEl: HTMLElement): () => void {
    hostEl.empty()
    hostEl.addClass('smtcmp-settings-declarative-host')
    let renderer: SettingTabRenderer | null = null
    let disposed = false
    void import('./SettingTabRenderer')
      .then(({ createSettingTabRenderer }) => {
        if (disposed) return
        renderer = createSettingTabRenderer({
          app: this.app,
          containerEl: hostEl,
          plugin: this.plugin,
        })
        renderer.render()
      })
      .catch((error) => {
        console.error('Failed to render CMDS Achmage settings:', error)
        if (!disposed) this.renderLoadFailure(error, hostEl)
      })
    return () => {
      disposed = true
      renderer?.hide()
    }
  }

  private renderLoadFailure(
    error: unknown,
    targetEl: HTMLElement = this.containerEl,
  ): void {
    targetEl.empty()
    const wrapper = targetEl.createDiv({
      cls: 'smtcmp-settings-load-error',
    })
    new Setting(wrapper).setName('Could not load').setHeading()
    wrapper.createEl('p', {
      text: 'Disable and re-enable CMDS Achmage, then open Settings again. Your saved settings have not been deleted.',
    })
    const details = wrapper.createEl('details')
    details.createEl('summary', { text: 'Technical details' })
    details.createEl('pre', {
      text:
        error instanceof Error ? (error.stack ?? error.message) : String(error),
    })
  }
}
