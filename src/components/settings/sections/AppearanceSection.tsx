import { useSettings } from '../../../contexts/settings-context'
import { ObsidianDropdown } from '../../common/ObsidianDropdown'
import { ObsidianSetting } from '../../common/ObsidianSetting'

const SKIN_MODE_OPTIONS: Record<string, string> = {
  'studio-console': 'Operator Console / Conversation Studio (default)',
  'follow-obsidian': 'Follow Obsidian theme',
}

export function AppearanceSection() {
  const { settings, setSettings } = useSettings()

  return (
    <div className="smtcmp-settings-section">
      <div className="smtcmp-settings-header">Appearance</div>

      <ObsidianSetting
        name="Chat skin"
        desc="The chat pane ships with its own dark and light skins. Switch to Follow Obsidian theme to derive the chat colors from your active theme instead. Spacing and type scale stay fixed; adjust those with the Style Settings plugin."
      >
        <ObsidianDropdown
          value={settings.appearance?.skinMode ?? 'studio-console'}
          options={SKIN_MODE_OPTIONS}
          onChange={async (value: string) => {
            await setSettings({
              ...settings,
              appearance: {
                ...settings.appearance,
                skinMode:
                  value === 'follow-obsidian'
                    ? 'follow-obsidian'
                    : 'studio-console',
              },
            })
          }}
        />
      </ObsidianSetting>
    </div>
  )
}
