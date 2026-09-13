import {
  buildImageStructurePrompt,
  buildImageStructureUserContent,
  resolveImageAnalysisModelId,
  unwrapMarkdownFence,
} from './imageToMarkdown'

describe('imageToMarkdown helpers', () => {
  it('builds mode-specific prompts and image content parts', () => {
    expect(buildImageStructurePrompt('table')).toContain('Markdown table')
    expect(buildImageStructurePrompt('diagram')).toContain('mermaid')
    const parts = buildImageStructureUserContent(
      'data:image/png;base64,AAA',
      'list',
      'Meeting notes',
    )
    expect(parts[0]).toEqual({
      type: 'text',
      text: 'Convert this image into markdown list.\n\nContext from the note: Meeting notes',
    })
    expect(parts[1]).toEqual({
      type: 'image_url',
      image_url: { url: 'data:image/png;base64,AAA' },
    })
  })

  it('unwraps a single outer markdown fence only', () => {
    expect(unwrapMarkdownFence('```markdown\n- a\n- b\n```')).toBe('- a\n- b')
    expect(unwrapMarkdownFence('```mermaid\nflowchart TD\n```')).toBe(
      '```mermaid\nflowchart TD\n```',
    )
    expect(unwrapMarkdownFence('  plain  ')).toBe('plain')
  })

  it('uses the configured analysis model only when it exists and is enabled', () => {
    const settings = {
      chatModelId: 'chat',
      chatModels: [
        { id: 'chat', enable: true },
        { id: 'vision', enable: true },
        { id: 'off', enable: false },
      ],
      imageAnalysis: { modelId: 'vision' },
    } as never
    expect(resolveImageAnalysisModelId(settings)).toBe('vision')
    expect(
      resolveImageAnalysisModelId({
        ...(settings as object),
        imageAnalysis: { modelId: 'off' },
      } as never),
    ).toBe('chat')
    expect(
      resolveImageAnalysisModelId({
        ...(settings as object),
        imageAnalysis: { modelId: null },
      } as never),
    ).toBe('chat')
  })
})
