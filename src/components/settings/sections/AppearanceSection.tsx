import { useSettings } from '../../../contexts/settings-context'
import { ObsidianDropdown } from '../../common/ObsidianDropdown'
import { ObsidianSetting } from '../../common/ObsidianSetting'

const SKIN_MODE_OPTIONS: Record<string, string> = {
  'follow-obsidian': 'Follow Obsidian theme (default)',
  'studio-console': 'Operator Console / Conversation Studio',
}

export function AppearanceSection() {
  const { settings, setSettings } = useSettings()

  return (
    <div className="smtcmp-settings-section">
      <div className="smtcmp-settings-header">Appearance</div>

      <ObsidianSetting
        name="Chat skin"
        desc="Applies to the Chat pane and the Inline edit panel. By default both derive their colors from your active Obsidian theme. Operator Console / Conversation Studio switches to the plugin's own skins instead (CMDS-styled in dark mode, Hallym-styled in light mode). Spacing and type scale stay fixed; adjust those with the Style Settings plugin."
      >
        <ObsidianDropdown
          value={settings.appearance?.skinMode ?? 'follow-obsidian'}
          options={SKIN_MODE_OPTIONS}
          onChange={async (value: string) => {
            await setSettings({
              ...settings,
              appearance: {
                ...settings.appearance,
                skinMode:
                  value === 'studio-console'
                    ? 'studio-console'
                    : 'follow-obsidian',
              },
            })
          }}
        />
      </ObsidianSetting>

      <ObsidianSetting
        name="What the accent color touches"
        desc="Send button, composer focus ring, user message bubble, the accent bar on assistant replies, links and headings inside replies, and selected states in pickers. When following your theme this is your theme's accent; the owned skins use CMDS Pink (dark) and Hallym Blue (light). Override it, corner radius, UI text size, and line height in the Style Settings plugin under the CMDS Achmage section."
      />
    </div>
  )
}
