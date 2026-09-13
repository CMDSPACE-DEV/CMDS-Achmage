import { useSettings } from '../../../contexts/settings-context'
import {
  APPEARANCE_PRESETS,
  type AccentPreset,
  type Appearance,
  type AppearancePresetId,
  type ChatSkinMode,
  type GlowLevel,
  matchAppearancePreset,
  normalizeAppearance,
} from '../../../utils/chat/chatSkin'
import { ObsidianDropdown } from '../../common/ObsidianDropdown'
import { ObsidianSetting } from '../../common/ObsidianSetting'

const PRESET_OPTIONS: Record<string, string> = {
  ...Object.fromEntries(
    Object.entries(APPEARANCE_PRESETS).map(([id, p]) => [id, p.label]),
  ),
  custom: 'Custom (set the three options below)',
}

const SKIN_MODE_OPTIONS: Record<ChatSkinMode, string> = {
  'follow-obsidian': 'Follow Obsidian theme',
  'studio-console':
    'CMDS skins, switched by theme (dark: Operator Console, light: Conversation Studio)',
  'operator-console': 'CMDS Operator Console (always dark)',
  'conversation-studio': 'Hallym Conversation Studio (always light)',
}

const ACCENT_OPTIONS: Record<AccentPreset, string> = {
  skin: 'Skin default (theme accent when following Obsidian)',
  'cmds-pink': 'CMDS Pink (#E985A2)',
  'neon-lime': 'Neon Lime (#B6FF00, the original inline look)',
  'hallym-blue': 'Hallym Blue (#0066B3)',
  'signal-teal': 'Signal Teal (#00B5AD)',
  graphite: 'Graphite (neutral gray)',
}

const GLOW_OPTIONS: Record<GlowLevel, string> = {
  skin: 'Skin default',
  off: 'Off (flat, no halos)',
  soft: 'Soft',
  neon: 'Neon (strong halos on focus, send, and pending states)',
}

export function AppearanceSection() {
  const { settings, setSettings } = useSettings()
  const appearance = normalizeAppearance(settings.appearance)
  const presetId = matchAppearancePreset(appearance)

  const save = async (next: Partial<Appearance>) => {
    await setSettings({
      ...settings,
      appearance: { ...appearance, ...next },
    })
  }

  return (
    <div className="smtcmp-settings-section">
      <div className="smtcmp-settings-header">Appearance</div>

      <ObsidianSetting
        name="Preset"
        desc="One-click looks for the Chat pane and the Inline edit panel. Picking a preset sets the three options below; changing any of them afterwards turns the preset into Custom. The plugin never restyles the editor, other panes, or other plugins."
      >
        <ObsidianDropdown
          value={presetId}
          options={PRESET_OPTIONS}
          onChange={async (value: string) => {
            if (value === 'custom' || !(value in APPEARANCE_PRESETS)) return
            await save(
              APPEARANCE_PRESETS[value as AppearancePresetId].appearance,
            )
          }}
        />
      </ObsidianSetting>

      <ObsidianSetting
        name="Base skin"
        desc="Where surfaces, borders, and text colors come from. Follow Obsidian theme inherits everything from your active theme. The CMDS skins are the plugin's own: Operator Console (dark) and Conversation Studio (light), either switched by your theme or pinned."
      >
        <ObsidianDropdown
          value={appearance.skinMode}
          options={SKIN_MODE_OPTIONS}
          onChange={(value: string) =>
            save({ skinMode: value as ChatSkinMode })
          }
        />
      </ObsidianSetting>

      <ObsidianSetting
        name="Accent"
        desc="Send button, composer focus ring, user message bubble, the accent bar on assistant replies, selected states in pickers, and headings inside the CMDS skins. Skin default keeps the base skin's own accent."
      >
        <ObsidianDropdown
          value={appearance.accentPreset}
          options={ACCENT_OPTIONS}
          onChange={(value: string) =>
            save({ accentPreset: value as AccentPreset })
          }
        />
      </ObsidianSetting>

      <ObsidianSetting
        name="Glow"
        desc="Strength of the soft halos: composer focus, send button, pending pulse, streaming tail. Off removes them entirely; Neon is the original console look."
      >
        <ObsidianDropdown
          value={appearance.glow}
          options={GLOW_OPTIONS}
          onChange={(value: string) => save({ glow: value as GlowLevel })}
        />
      </ObsidianSetting>

      <ObsidianSetting
        name="Fine tuning"
        desc="Exact colors and sizes live in the Style Settings plugin under the CMDS Achmage section: accent color, text on accent, heading color, motion color, glow strength as a number, corner radius, UI text sizes, and message line height. Those values apply on top of whatever preset is active."
      />
    </div>
  )
}
