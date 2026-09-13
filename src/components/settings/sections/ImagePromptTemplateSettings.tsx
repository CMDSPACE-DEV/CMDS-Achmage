import { useSettings } from '../../../contexts/settings-context'
import {
  DEFAULT_IMAGE_PROMPT_TEMPLATES,
  ImagePromptTemplate,
  newImagePromptTemplateId,
} from '../../../core/image/image-prompt-templates'
import {
  IMAGE_PURPOSES,
  IMAGE_PURPOSE_LABELS,
} from '../../../core/image/image-request'
import {
  TEXT_CARD_STYLES,
  TEXT_CARD_STYLE_LABELS,
  TextCardStyle,
} from '../../../core/image/text-card'
import { getProviderCapabilities } from '../../../core/llm/providerCapabilities'
import { ObsidianButton } from '../../common/ObsidianButton'
import { ObsidianDropdown } from '../../common/ObsidianDropdown'
import { ObsidianSetting } from '../../common/ObsidianSetting'
import { ObsidianTextArea } from '../../common/ObsidianTextArea'
import { ObsidianTextInput } from '../../common/ObsidianTextInput'
import { ObsidianToggle } from '../../common/ObsidianToggle'

/** Image prompt template slots and the clipboard-image analysis model (R-035). */
export function ImagePromptTemplateSettings() {
  const { settings, setSettings } = useSettings()
  const templates = settings.imageGeneration.promptTemplates

  const saveTemplates = async (next: ImagePromptTemplate[]) => {
    await setSettings({
      ...settings,
      imageGeneration: { ...settings.imageGeneration, promptTemplates: next },
    })
  }
  const update = (id: string, patch: Partial<ImagePromptTemplate>) =>
    saveTemplates(
      templates.map((template) =>
        template.id === id ? { ...template, ...patch } : template,
      ),
    )

  return (
    <>
      <ObsidianSetting
        name="Image prompt templates"
        desc="Slots offered in the composer's image mode. The chosen template is prepended to your brief, so write the style, palette, and format rules here and keep the subject in the chat. Add your own or reset to the CMDS defaults."
      >
        <ObsidianButton
          text="Add template"
          onClick={() =>
            void saveTemplates([
              ...templates,
              {
                id: newImagePromptTemplateId(),
                name: `Template ${templates.length + 1}`,
                prompt: '',
              },
            ])
          }
        />
        <ObsidianButton
          text="Reset to defaults"
          onClick={() => void saveTemplates(DEFAULT_IMAGE_PROMPT_TEMPLATES)}
        />
      </ObsidianSetting>

      {templates.map((template) => (
        <div key={template.id} className="smtcmp-settings-template-slot">
          <ObsidianSetting name="Name">
            <ObsidianTextInput
              value={template.name}
              onChange={(value) => void update(template.id, { name: value })}
            />
            <ObsidianButton
              text="Remove"
              warning
              onClick={() =>
                void saveTemplates(
                  templates.filter((t) => t.id !== template.id),
                )
              }
            />
          </ObsidianSetting>
          <ObsidianSetting name="Prompt" desc="Prepended to the brief.">
            <ObsidianTextArea
              value={template.prompt}
              placeholder="Style, palette, composition, format rules…"
              onChange={(value) => void update(template.id, { prompt: value })}
            />
          </ObsidianSetting>
        </div>
      ))}

      <ObsidianSetting
        name="Default template per purpose"
        desc="Each entry point can start with its own template. The modal and the composer pre-select it; you can still change it per job."
      />
      {IMAGE_PURPOSES.map((purpose) => (
        <ObsidianSetting key={purpose} name={IMAGE_PURPOSE_LABELS[purpose]}>
          <ObsidianDropdown
            value={settings.imageGeneration.templateByPurpose[purpose]}
            options={{
              '': 'No template',
              ...Object.fromEntries(templates.map((t) => [t.id, t.name])),
            }}
            onChange={async (value) => {
              await setSettings({
                ...settings,
                imageGeneration: {
                  ...settings.imageGeneration,
                  templateByPurpose: {
                    ...settings.imageGeneration.templateByPurpose,
                    [purpose]: value,
                  },
                },
              })
            }}
          />
        </ObsidianSetting>
      ))}

      <ObsidianSetting
        name="Copy generated images to the clipboard"
        desc="Right after an image is saved it is also placed on the system clipboard, ready to paste anywhere. The task card keeps a Copy image button either way."
      >
        <ObsidianToggle
          value={settings.imageGeneration.copyToClipboard}
          onChange={async (value) => {
            await setSettings({
              ...settings,
              imageGeneration: {
                ...settings.imageGeneration,
                copyToClipboard: value,
              },
            })
          }}
        />
      </ObsidianSetting>

      <ObsidianSetting
        name="Text card style"
        desc="'Render selection as image card' draws the selected text itself as a PNG (no model call), saves it to the image output folder, copies it to the clipboard, and can insert the embed."
      >
        <ObsidianDropdown
          value={settings.imageGeneration.textCard.style}
          options={Object.fromEntries(
            TEXT_CARD_STYLES.map((s) => [s, TEXT_CARD_STYLE_LABELS[s]]),
          )}
          onChange={async (value) => {
            await setSettings({
              ...settings,
              imageGeneration: {
                ...settings.imageGeneration,
                textCard: {
                  ...settings.imageGeneration.textCard,
                  style: value as TextCardStyle,
                },
              },
            })
          }}
        />
      </ObsidianSetting>
      <ObsidianSetting
        name="Text card width and brand"
        desc="Width in pixels (600–4000); the brand mark sits bottom-right, empty hides it."
      >
        <ObsidianTextInput
          value={String(settings.imageGeneration.textCard.width)}
          type="number"
          onChange={async (value) => {
            const width = Number.parseInt(value, 10)
            if (!Number.isFinite(width) || width < 600 || width > 4000) return
            await setSettings({
              ...settings,
              imageGeneration: {
                ...settings.imageGeneration,
                textCard: { ...settings.imageGeneration.textCard, width },
              },
            })
          }}
        />
        <ObsidianTextInput
          value={settings.imageGeneration.textCard.brand}
          placeholder="CMDSPACE"
          onChange={async (value) => {
            await setSettings({
              ...settings,
              imageGeneration: {
                ...settings.imageGeneration,
                textCard: {
                  ...settings.imageGeneration.textCard,
                  brand: value,
                },
              },
            })
          }}
        />
      </ObsidianSetting>
      <ObsidianSetting
        name="Insert the text card embed into the note"
        desc="Off keeps the file and clipboard copy only."
      >
        <ObsidianToggle
          value={settings.imageGeneration.textCard.insertEmbed}
          onChange={async (value) => {
            await setSettings({
              ...settings,
              imageGeneration: {
                ...settings.imageGeneration,
                textCard: {
                  ...settings.imageGeneration.textCard,
                  insertEmbed: value,
                },
              },
            })
          }}
        />
      </ObsidianSetting>

      <ObsidianSetting
        name="Clipboard image analysis model"
        desc="Used by the 'Convert clipboard image to Markdown' commands. Needs a model that accepts images. Inherit uses the chat model."
      >
        <ObsidianDropdown
          value={settings.imageAnalysis.modelId ?? ''}
          options={{
            '': 'Inherit the chat model',
            ...Object.fromEntries(
              settings.chatModels
                .filter(({ enable }) => enable ?? true)
                .filter((model) => !getProviderCapabilities(model).imageOnly)
                .map((model) => [model.id, model.id]),
            ),
          }}
          onChange={async (value) => {
            await setSettings({
              ...settings,
              imageAnalysis: { modelId: value || null },
            })
          }}
        />
      </ObsidianSetting>
    </>
  )
}
