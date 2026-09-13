import { applyParagraphPatch, computeParagraphPatch } from './paragraph-patch'

const NOTE = `---
title: t
---
# 제목

## 배경
첫 문단이다.

둘째 문단이다.

## 결론
마지막 문단이다.
`

describe('computeParagraphPatch', () => {
  it('replaces only the changed paragraph in a full rewrite', () => {
    const proposed = NOTE.replace(
      '둘째 문단이다.',
      '둘째 문단을 고쳤다.',
    ).replace(/^---[\s\S]*?---\n/, '')
    const patch = computeParagraphPatch(NOTE, proposed)
    expect(patch.changed).toBe(1)
    const { text } = applyParagraphPatch(NOTE, patch)
    expect(text).toContain('title: t')
    expect(text).toContain('첫 문단이다.\n\n둘째 문단을 고쳤다.\n\n## 결론')
  })
  it('inserts new paragraphs from an abbreviated block with placeholders', () => {
    const proposed = `## 배경
첫 문단이다.

새로 넣은 문단.

<!-- ... existing content ... -->
## 결론
마지막 문단이다.

덧붙인 결론.`
    const patch = computeParagraphPatch(NOTE, proposed)
    expect(patch.hunks.map((h) => h.kind)).toEqual(['insert', 'insert'])
    const { text } = applyParagraphPatch(NOTE, patch)
    expect(text).toContain('첫 문단이다.\n\n새로 넣은 문단.\n\n둘째 문단이다.')
    expect(text).toContain('마지막 문단이다.\n\n덧붙인 결론.\n')
    expect(text).not.toMatch(/\n{3,}/)
  })
  it('deletes a paragraph dropped between two matches', () => {
    const proposed = `# 제목

## 배경
첫 문단이다.

## 결론
마지막 문단이다.`
    const patch = computeParagraphPatch(NOTE, proposed)
    expect(patch.hunks.map((h) => h.kind)).toEqual(['delete'])
    const { text } = applyParagraphPatch(NOTE, patch)
    expect(text).toContain('첫 문단이다.\n\n## 결론')
  })
  it('appends when nothing matches', () => {
    const patch = computeParagraphPatch(NOTE, '완전히 새로운 문단.')
    expect(patch.matched).toBe(0)
    expect(
      applyParagraphPatch(NOTE, patch)
        .text.trimEnd()
        .endsWith('완전히 새로운 문단.'),
    ).toBe(true)
  })
})
