import { SmartComposerSettings } from '../../settings/schema/setting.types'

const MAX_SOURCE_CHARS = 12_000

const BRIEF_SYSTEM_PROMPT = [
  'You write briefs for an image generation model.',
  'Given note text, describe ONE image that captures its core idea: subject, composition, setting, mood, lighting, palette hints.',
  'Write in the language of the note. 60 to 120 words, one paragraph, no headings, no bullet points, no quotation marks.',
  'Do not ask for text, letters, logos, or captions inside the image unless the note is about typography.',
  'Return only the brief.',
].join(' ')

export function stripFrontmatter(text: string): string {
  return text.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '').trim()
}

/** Short selections are briefs already; long text goes through the model. */
export function needsBriefSynthesis(text: string): boolean {
  const clean = stripFrontmatter(text)
  return clean.length > 400 || clean.split(/\n/).length > 6
}

/** Asks the chat model to turn note text into a single image brief (R-036). */
export async function writeImageBriefFromText({
  settings,
  setSettings,
  text,
  title,
  signal,
}: {
  settings: SmartComposerSettings
  setSettings: (next: SmartComposerSettings) => void | Promise<void>
  text: string
  title?: string
  signal?: AbortSignal
}): Promise<string> {
  const { getChatModelClient } = await import('../llm/manager')
  const { providerClient, model } = getChatModelClient({
    modelId: settings.chatModelId,
    settings,
    setSettings,
  })
  const body = stripFrontmatter(text).slice(0, MAX_SOURCE_CHARS)
  const response = await providerClient.generateResponse(
    model,
    {
      model: model.model,
      messages: [
        { role: 'system', content: BRIEF_SYSTEM_PROMPT },
        {
          role: 'user',
          content: `${title ? `Title: ${title}\n\n` : ''}${body}`,
        },
      ],
    },
    { signal },
  )
  const brief = response.choices[0]?.message?.content
  if (typeof brief !== 'string' || !brief.trim()) {
    throw new Error('The model returned no brief for this note.')
  }
  return brief.trim().replace(/^["“]|["”]$/g, '')
}
