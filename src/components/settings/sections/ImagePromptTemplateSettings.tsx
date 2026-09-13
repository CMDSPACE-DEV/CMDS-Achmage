import { useSettings } from '../../../contexts/settings-context'
import {
  DEFAULT_IMAGE_PROMPT_TEMPLATES,
  ImagePromptTemplate,
  newImagePromptTemplateId,
} from '../../../core/image/image-prompt-templates'
import { getProviderCapabilities } from '../../../core/llm/providerCapabilities'
import { ObsidianButton } from '../../common/ObsidianButton'
import { ObsidianDropdown } from '../../common/ObsidianDropdown'
import { ObsidianSetting } from '../../common/ObsidianSetting'
import { ObsidianTextArea } from '../../common/ObsidianTextArea'
import { ObsidianTextInput } from '../../common/ObsidianTextInput'

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
