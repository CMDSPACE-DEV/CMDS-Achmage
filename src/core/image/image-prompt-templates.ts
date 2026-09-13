/**
 * Prompt templates for image mode (R-035). A template is prepended to the
 * user's brief; the brief itself stays the last paragraph so batch counts and
 * follow-up phrasing keep parsing the same way.
 */
export type ImagePromptTemplate = {
  id: string
  name: string
  prompt: string
}

export const NO_IMAGE_TEMPLATE = ''

export const DEFAULT_IMAGE_PROMPT_TEMPLATES: ImagePromptTemplate[] = [
  {
    id: 'cmds-illustration',
    name: 'CMDS illustration',
    prompt:
      'Editorial illustration in the CMDSPACE style: clean vector shapes, generous negative space, two-tone palette of CMDS green (#00B5AD) and CMDS pink (#E985A2) on an off-white background, subtle paper grain, no text, no logos, no watermark. Landscape composition suitable for a slide or a note header.',
  },
  {
    id: 'infographic',
    name: 'Infographic',
    prompt:
      'Flat infographic with a clear visual hierarchy: a single headline area, three to five labeled sections with simple icons, consistent stroke width, muted background, high contrast labels in a clean sans-serif. Keep every label short and legible; no decorative text, no watermark.',
  },
  {
    id: 'diagram',
    name: 'Concept diagram',
    prompt:
      'Minimal concept diagram: boxes and arrows on a plain background, monochrome line work with one accent color, evenly spaced nodes, short labels only, no shadows, no gradients, no watermark. Designed to be read at small size inside a note.',
  },
  {
    id: 'icon-set',
    name: 'Icon set',
    prompt:
      'A set of six matching flat icons arranged in a 3x2 grid on a white background, uniform line weight, rounded corners, single accent color, no text, no watermark.',
  },
  {
    id: 'photo',
    name: 'Photorealistic',
    prompt:
      'Photorealistic image, natural lighting, shallow depth of field, 35mm lens look, true-to-life colors, no text, no watermark.',
  },
]

export function findImagePromptTemplate(
  templates: ImagePromptTemplate[],
  id: string | undefined,
): ImagePromptTemplate | undefined {
  if (!id) return undefined
  return templates.find((template) => template.id === id)
}

/** Template first, brief last, separated by a blank line. */
export function applyImagePromptTemplate(
  brief: string,
  template: ImagePromptTemplate | undefined,
): string {
  const body = brief.trim()
  if (!template?.prompt.trim()) return body
  return `${template.prompt.trim()}\n\n${body}`
}

export function newImagePromptTemplateId(): string {
  return `tpl-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
}
