import type { App, Setting, SettingDefinitionRender } from 'obsidian'

import type SmartComposerPlugin from '../main'

import { SmartComposerSettingTab } from './SettingTab'
import { createSettingTabRenderer } from './SettingTabRenderer'

jest.mock('obsidian', () => ({
  PluginSettingTab: class {
    containerEl = {}
    constructor(public app: unknown) {}
  },
  Setting: jest.fn(),
}))

const renderer = { render: jest.fn(), hide: jest.fn() }
jest.mock('./SettingTabRenderer', () => ({
  createSettingTabRenderer: jest.fn(() => renderer),
}))

const flush = () => new Promise((resolve) => window.setTimeout(resolve, 0))

function renderDefinition() {
  const tab = new SmartComposerSettingTab({} as App, {} as SmartComposerPlugin)
  const [definition] = tab.getSettingDefinitions() as SettingDefinitionRender[]
  const settingEl = { empty: jest.fn(), addClass: jest.fn() }
  const cleanup = definition.render(
    { settingEl } as unknown as Setting,
    {} as never,
  ) as () => void
  return { definition, settingEl, cleanup }
}

beforeEach(() => jest.clearAllMocks())

describe('SmartComposerSettingTab declarative settings', () => {
  it('exposes one searchable row that mounts the React UI once and unmounts on cleanup', async () => {
    const { definition, settingEl, cleanup } = renderDefinition()
    await flush()

    expect(definition.aliases).toEqual(
      expect.arrayContaining(['Plan', 'Chat model', 'MCP']),
    )
    expect(settingEl.addClass).toHaveBeenCalledWith(
      'smtcmp-settings-declarative-host',
    )
    expect(createSettingTabRenderer).toHaveBeenCalledTimes(1)
    expect(createSettingTabRenderer).toHaveBeenCalledWith(
      expect.objectContaining({ containerEl: settingEl }),
    )
    expect(renderer.render).toHaveBeenCalledTimes(1)

    cleanup()
    expect(renderer.hide).toHaveBeenCalledTimes(1)
  })

  it('does not mount when cleaned up before the renderer loads', async () => {
    const { cleanup } = renderDefinition()
    cleanup()
    await flush()

    expect(createSettingTabRenderer).not.toHaveBeenCalled()
    expect(renderer.render).not.toHaveBeenCalled()
  })
})
