import { readFileSync } from 'fs'
import { resolve } from 'path'

// Style Settings 1.0.9 parses @settings comments with js-yaml 4.
const yaml: { load: (source: string) => unknown } =
  jest.requireActual('js-yaml')

type SettingsManifest = {
  name: string
  id: string
  settings: { id: string; description?: string }[]
}

describe('Style Settings stylesheet manifest', () => {
  it('parses every @settings block and keeps the appearance controls available', () => {
    const css = readFileSync(resolve(__dirname, '../../styles.css'), 'utf8')
    const blocks = [...css.matchAll(/\/\*\s*@settings\s*\n([\s\S]*?)\*\//g)]

    expect(blocks).toHaveLength(1)
    for (const block of blocks) {
      const manifest = yaml.load(block[1] ?? '') as SettingsManifest
      expect(manifest).toMatchObject({
        name: 'CMDS Achmage',
        id: 'cmds-achmage',
      })
      expect(manifest.settings).toHaveLength(11)
      expect(new Set(manifest.settings.map((setting) => setting.id)).size).toBe(
        manifest.settings.length,
      )
      expect(manifest.settings[0]?.description).toContain(
        'draws itself: the Chat side panel',
      )
      expect(manifest.settings[0]?.description).not.toMatch(/\n$/)
    }
  })
})
