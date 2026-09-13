import { parseTagContents } from './parse-tag-content'

describe('parseTagContents achmage_edit', () => {
  it('parses op, anchor, until, heading and content', () => {
    const input = `Here you go.
<achmage_edit op="insert-after">
<anchor>첫걸음이라고 주장한다.</anchor>
<content>
\`\`\`mermaid
flowchart LR
  A --> B
\`\`\`
</content>
</achmage_edit>
<achmage_edit op="append-section">
<heading>## 결론</heading>
<content>마무리.</content>
</achmage_edit>`
    const blocks = parseTagContents(input)
    const edits = blocks.filter((b) => b.type === 'achmage_edit')
    expect(edits).toHaveLength(2)
    expect(edits[0]).toMatchObject({
      op: 'insert-after',
      anchor: '첫걸음이라고 주장한다.',
      complete: true,
    })
    expect(edits[0].type === 'achmage_edit' && edits[0].content).toBe(
      '```mermaid\nflowchart LR\n  A --> B\n```',
    )
    expect(edits[1]).toMatchObject({
      op: 'append-section',
      heading: '## 결론',
      content: '마무리.',
    })
  })
  it('marks a streaming block incomplete', () => {
    const blocks = parseTagContents(
      '<achmage_edit op="replace">\n<anchor>abc</anchor>\n<content>partial',
    )
    const edit = blocks.find((b) => b.type === 'achmage_edit')
    expect(edit).toMatchObject({ complete: false })
  })
})
