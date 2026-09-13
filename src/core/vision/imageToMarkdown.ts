import { Notice } from 'obsidian'

import { SmartComposerSettings } from '../../settings/schema/setting.types'
import { ContentPart } from '../../types/llm/request'

/**
 * Turn a screenshot or pasted image into Markdown the note can keep (R-035).
 * `auto` lets the model pick the structure that fits the image.
 */
export const IMAGE_STRUCTURE_MODES = [
  'auto',
  'list',
  'table',
  'diagram',
] as const
export type ImageStructureMode = (typeof IMAGE_STRUCTURE_MODES)[number]

export const IMAGE_STRUCTURE_LABELS: Record<ImageStructureMode, string> = {
  auto: 'Markdown (auto structure)',
  list: 'Markdown list',
  table: 'Markdown table',
  diagram: 'Mermaid diagram',
}

const COMMON_RULES = [
  'You convert images into Markdown for an Obsidian note.',
  'Transcribe faithfully: keep the original language of any text in the image, keep numbers exact, do not invent content that is not visible.',
  'Return only the Markdown. No preamble, no explanation, no code fence around the whole answer unless the format itself requires one.',
].join(' ')

const MODE_RULES: Record<ImageStructureMode, string> = {
  auto: 'Choose the structure that best preserves the image: a nested list for outlines and slides, a table for tabular data, a Mermaid flowchart or sequence diagram for boxes-and-arrows, headings plus paragraphs for prose. You may combine them.',
  list: 'Produce a nested Markdown bullet list. Preserve hierarchy with indentation. Use bold for labels or headings found in the image.',
  table:
    'Produce a Markdown table. First row is the header. If the image has several tables, output each with a short bold caption above it. Merge nothing; keep every cell.',
  diagram:
    'Produce a Mermaid diagram inside a ```mermaid code fence. Use flowchart TD (or LR when the image is wider than tall) for boxes and arrows, sequenceDiagram for lanes with messages, mindmap for radial layouts. Keep node labels short and quote labels that contain special characters.',
}

export function buildImageStructurePrompt(mode: ImageStructureMode): string {
  return `${COMMON_RULES}\n\n${MODE_RULES[mode]}`
}

export function buildImageStructureUserContent(
  dataUrl: string,
  mode: ImageStructureMode,
  hint?: string,
): ContentPart[] {
  const ask =
    mode === 'auto'
      ? 'Convert this image into Markdown.'
      : `Convert this image into ${IMAGE_STRUCTURE_LABELS[mode].toLowerCase()}.`
  return [
    {
      type: 'text',
      text: hint ? `${ask}\n\nContext from the note: ${hint}` : ask,
    },
    { type: 'image_url', image_url: { url: dataUrl } },
  ]
}

/** Strips a single outer code fence that models sometimes add around plain Markdown. */
export function unwrapMarkdownFence(text: string): string {
  const trimmed = text.trim()
  const match = trimmed.match(/^```(?:markdown|md)?\s*\n([\s\S]*?)\n```$/)
  return match ? match[1].trim() : trimmed
}

export type ClipboardImage = { dataUrl: string; mimeType: string }

/** Reads the first image on the system clipboard, or null when there is none. */
export async function readClipboardImage(): Promise<ClipboardImage | null> {
  const clipboard = (globalThis as { navigator?: Navigator }).navigator
    ?.clipboard
  if (!clipboard || typeof clipboard.read !== 'function') return null
  let items: ClipboardItem[]
  try {
    items = await clipboard.read()
  } catch {
    return null
  }
  for (const item of items) {
    const type = item.types.find((t) => t.startsWith('image/'))
    if (!type) continue
    const blob = await item.getType(type)
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = () =>
        reject(new Error('Could not read clipboard image.'))
      reader.readAsDataURL(blob)
    })
    return { dataUrl, mimeType: type }
  }
  return null
}

export function resolveImageAnalysisModelId(
  settings: SmartComposerSettings,
): string {
  const configured = settings.imageAnalysis?.modelId
  if (
    configured &&
    settings.chatModels.some((m) => m.id === configured && (m.enable ?? true))
  ) {
    return configured
  }
  return settings.chatModelId
}

export async function convertImageToMarkdown({
  settings,
  setSettings,
  image,
  mode,
  hint,
  signal,
}: {
  settings: SmartComposerSettings
  setSettings: (next: SmartComposerSettings) => void | Promise<void>
  image: ClipboardImage
  mode: ImageStructureMode
  hint?: string
  signal?: AbortSignal
}): Promise<string> {
  const { getChatModelClient } = await import('../llm/manager')
  const { providerClient, model } = getChatModelClient({
    modelId: resolveImageAnalysisModelId(settings),
    settings,
    setSettings,
  })
  const response = await providerClient.generateResponse(
    model,
    {
      model: model.model,
      messages: [
        { role: 'system', content: buildImageStructurePrompt(mode) },
        {
          role: 'user',
          content: buildImageStructureUserContent(image.dataUrl, mode, hint),
        },
      ],
    },
    { signal },
  )
  const text = response.choices[0]?.message?.content
  if (typeof text !== 'string' || !text.trim()) {
    new Notice('The model returned no text for this image.')
    throw new Error('Empty vision response.')
  }
  return unwrapMarkdownFence(text)
}
