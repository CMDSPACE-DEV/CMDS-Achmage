/**
 * Renders selected text as a typographic image card (R-037): no model call,
 * deterministic, CMDS-styled. Used for quotes, key sentences, and SNS cards.
 */
export const TEXT_CARD_STYLES = ['cmds-dark', 'cmds-light', 'plain'] as const
export type TextCardStyle = (typeof TEXT_CARD_STYLES)[number]

export const TEXT_CARD_STYLE_LABELS: Record<TextCardStyle, string> = {
  'cmds-dark': 'CMDS dark (pink accent bar)',
  'cmds-light': 'CMDS light (green accent bar)',
  plain: 'Plain (white, no accent)',
}

export type TextCardOptions = {
  style: TextCardStyle
  /** Canvas width in pixels; height follows the text. */
  width: number
  /** Small caption at the bottom (note title, author). Empty hides it. */
  caption?: string
  /** Bottom-right brand mark. */
  brand?: string
  fontFamily?: string
}

export const DEFAULT_TEXT_CARD: Required<
  Pick<TextCardOptions, 'style' | 'width' | 'brand'>
> = {
  style: 'cmds-dark',
  width: 1200,
  brand: 'CMDSPACE',
}

type Palette = {
  background: string
  text: string
  muted: string
  accent: string
}

const PALETTES: Record<TextCardStyle, Palette> = {
  'cmds-dark': {
    background: '#0f1115',
    text: '#f2f2f2',
    muted: '#9aa0a6',
    accent: '#e985a2',
  },
  'cmds-light': {
    background: '#f7f9fc',
    text: '#0b1220',
    muted: '#5b6472',
    accent: '#00b5ad',
  },
  plain: {
    background: '#ffffff',
    text: '#111111',
    muted: '#777777',
    accent: 'transparent',
  },
}

/** Greedy word wrap that also breaks long CJK runs by character. */
export function wrapCardText(
  measure: (text: string) => number,
  text: string,
  maxWidth: number,
): string[] {
  const lines: string[] = []
  for (const paragraph of text.replace(/\r\n/g, '\n').split('\n')) {
    if (!paragraph.trim()) {
      lines.push('')
      continue
    }
    const tokens = paragraph.match(/\S+\s*|\s+/g) ?? [paragraph]
    let current = ''
    const push = () => {
      if (current.trim()) lines.push(current.trimEnd())
      current = ''
    }
    for (const token of tokens) {
      if (measure(current + token) <= maxWidth) {
        current += token
        continue
      }
      if (current) push()
      if (measure(token) <= maxWidth) {
        current = token
        continue
      }
      for (const char of token) {
        if (measure(current + char) > maxWidth && current) push()
        current += char
      }
    }
    push()
  }
  while (lines.length && lines[lines.length - 1] === '') lines.pop()
  return lines
}

function pickFontSize(length: number): number {
  if (length <= 80) return 56
  if (length <= 200) return 44
  if (length <= 400) return 36
  if (length <= 800) return 30
  return 26
}

export async function renderTextCard(
  doc: Document,
  text: string,
  options: TextCardOptions,
): Promise<ArrayBuffer> {
  const palette = PALETTES[options.style]
  const width = Math.max(600, Math.round(options.width))
  const padding = Math.round(width * 0.08)
  const fontFamily =
    options.fontFamily ??
    'Pretendard, "Apple SD Gothic Neo", Inter, "Segoe UI", system-ui, sans-serif'
  const body = text.trim()
  const fontSize = pickFontSize(body.length)
  const lineHeight = Math.round(fontSize * 1.5)

  const measureCanvas = doc.createElement('canvas')
  const measureCtx = measureCanvas.getContext('2d')
  if (!measureCtx) throw new Error('Canvas 2D context is unavailable.')
  measureCtx.font = `500 ${fontSize}px ${fontFamily}`
  const maxTextWidth =
    width - padding * 2 - (palette.accent === 'transparent' ? 0 : 28)
  const lines = wrapCardText(
    (t) => measureCtx.measureText(t).width,
    body,
    maxTextWidth,
  )

  const captionSize = Math.round(fontSize * 0.42)
  const footerHeight = options.caption || options.brand ? captionSize * 3 : 0
  const height =
    padding * 2 + Math.max(1, lines.length) * lineHeight + footerHeight

  const canvas = doc.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context is unavailable.')

  ctx.fillStyle = palette.background
  ctx.fillRect(0, 0, width, height)

  let textX = padding
  if (palette.accent !== 'transparent') {
    ctx.fillStyle = palette.accent
    ctx.fillRect(padding, padding, 6, Math.max(1, lines.length) * lineHeight)
    textX = padding + 28
  }

  ctx.fillStyle = palette.text
  ctx.font = `500 ${fontSize}px ${fontFamily}`
  ctx.textBaseline = 'top'
  lines.forEach((line, index) => {
    ctx.fillText(
      line,
      textX,
      padding + index * lineHeight + (lineHeight - fontSize) / 2,
    )
  })

  if (footerHeight) {
    ctx.font = `400 ${captionSize}px ${fontFamily}`
    ctx.fillStyle = palette.muted
    const footerY = height - padding * 0.6 - captionSize
    if (options.caption) ctx.fillText(options.caption, padding, footerY)
    if (options.brand) {
      const brandWidth = ctx.measureText(options.brand).width
      ctx.fillText(options.brand, width - padding - brandWidth, footerY)
    }
  }

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/png'),
  )
  if (!blob) throw new Error('Could not encode the text card as PNG.')
  return blob.arrayBuffer()
}
