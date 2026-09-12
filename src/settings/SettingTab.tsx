import {
  App,
  PluginSettingTab,
  Setting,
  type SettingDefinitionItem,
} from 'obsidian'

import type SmartComposerPlugin from '../main'

import type { SettingTabRenderer } from './SettingTabRenderer'

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

  display(): void {
    this.mountRenderer(this.containerEl)
  }

  /**
   * Obsidian 1.13+ renders from this list and skips {@link display}.
   * Keep display() as the fallback for older installers.
   */
  getSettingDefinitions(): SettingDefinitionItem[] {
    return [
      {
        name: 'General',
        desc: 'Chat, Plan, MCP, models, inline edit, and document editing.',
        aliases: [
          'chat',
          'model',
          'mcp',
          'plan',
          'claude',
          'openai',
          'gemini',
          'inline edit',
          'document edit',
          'rag',
          'template',
          'provider',
        ],
        render: (setting) => {
          setting.settingEl.empty()
          this.mountRenderer(setting.settingEl)
          return () => this.unmountRenderer()
        },
      },
    ]
  }

  hide(): void {
    this.unmountRenderer()
  }

  private mountRenderer(containerEl: HTMLElement): void {
    this.visible = true
    const generation = ++this.displayGeneration
    containerEl.empty()
    void this.getRenderer(containerEl)
      .then((renderer) => {
        if (!this.visible || generation !== this.displayGeneration) return
        renderer.render()
      })
      .catch((error) => {
        console.error('Failed to render Smart Composer settings:', error)
        if (!this.visible || generation !== this.displayGeneration) return
        this.renderLoadFailure(error)
      })
  }

  private unmountRenderer(): void {
    this.visible = false
    this.displayGeneration += 1
    this.renderer?.hide()
    this.renderer = null
    this.rendererInitPromise = null
  }

  private getRenderer(containerEl: HTMLElement): Promise<SettingTabRenderer> {
    if (this.renderer) return Promise.resolve(this.renderer)
    if (!this.rendererInitPromise) {
      this.rendererInitPromise = import('./SettingTabRenderer')
        .then(({ createSettingTabRenderer }) => {
          const renderer = createSettingTabRenderer({
            app: this.app,
            containerEl,
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

  private renderLoadFailure(error: unknown): void {
    this.containerEl.empty()
    const wrapper = this.containerEl.createDiv({
      cls: 'smtcmp-settings-load-error',
    })
    new Setting(wrapper).setName('Could not load').setHeading()
    wrapper.createEl('p', {
      text: 'Disable and re-enable this plugin, then open settings again. Your saved settings have not been deleted.',
    })
    const details = wrapper.createEl('details')
    details.createEl('summary', { text: 'Technical details' })
    details.createEl('pre', {
      text:
        error instanceof Error ? (error.stack ?? error.message) : String(error),
    })
  }
}
