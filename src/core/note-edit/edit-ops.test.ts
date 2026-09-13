import {
  applyEditOp,
  findSection,
  locateAnchor,
  normalizeForMatch,
} from './edit-ops'

const NOTE = `# Title

## 현대사회와 감정의 억압
현대인들은 가부장제와 물질만능주의가 만들어낸 억압적 구조 속에서 자신의 감정을 제대로 인식하지 못하고 살아간다. 강신주는 감정을 이해하고 회복하는 것이 자아를 찾고 삶의 주인이 되는 첫걸음이라고 주장한다.

두 번째 문단이다.

## 감정의 긍정과 자아 회복
강신주는 감정의 억압이 아닌 긍정을 통해 진정한 자아를 회복할 수 있다고 주장한다.
`

describe('locateAnchor', () => {
  it('finds exact text', () => {
    const r = locateAnchor(NOTE, '두 번째 문단이다.')
    expect(r.status).toBe('found')
    if (r.status === 'found')
      expect(NOTE.slice(r.match.from, r.match.to)).toBe('두 번째 문단이다.')
  })
  it('tolerates whitespace and curly quotes', () => {
    const r = locateAnchor('He said “hi”  there.', 'He said "hi" there.')
    expect(r.status).toBe('found')
    if (r.status === 'found') expect(r.match.method).toBe('normalized')
  })
  it('falls back to fuzzy matching for small paraphrases', () => {
    const r = locateAnchor(NOTE, '두 번째 문단입니다.')
    expect(r.status).toBe('found')
    if (r.status === 'found') expect(r.match.method).toBe('fuzzy')
  })
  it('reports ambiguity instead of guessing', () => {
    const r = locateAnchor(NOTE, '강신주는')
    expect(r.status).toBe('ambiguous')
  })
  it('reports not found', () => {
    expect(
      locateAnchor(NOTE, 'completely unrelated english sentence here').status,
    ).toBe('not-found')
  })
})

describe('applyEditOp', () => {
  it('inserts after the anchor paragraph', () => {
    const r = applyEditOp(NOTE, {
      op: 'insert-after',
      anchor: '첫걸음이라고 주장한다.',
      content: '```mermaid\nflowchart LR\n  A --> B\n```',
    })
    expect(r.status).toBe('applied')
    if (r.status === 'applied') {
      expect(r.text).toContain(
        '주장한다.\n\n```mermaid\nflowchart LR\n  A --> B\n```\n\n두 번째 문단이다.',
      )
      expect(r.text).not.toMatch(/\n{3,}/)
    }
  })
  it('inserts before the anchor paragraph', () => {
    const r = applyEditOp(NOTE, {
      op: 'insert-before',
      anchor: '두 번째 문단이다.',
      content: '> 인용',
    })
    expect(r.status).toBe('applied')
    if (r.status === 'applied')
      expect(r.text).toContain('\n\n> 인용\n\n두 번째 문단이다.')
  })
  it('replaces a range with until', () => {
    const r = applyEditOp(NOTE, {
      op: 'replace',
      anchor: '두 번째',
      until: '문단이다.',
      content: '바뀐 문단.',
    })
    expect(r.status).toBe('applied')
    if (r.status === 'applied')
      expect(r.text).toContain('바뀐 문단.\n\n## 감정의')
  })
  it('appends to a section by heading', () => {
    const r = applyEditOp(NOTE, {
      op: 'append-section',
      heading: '## 현대사회와 감정의 억압',
      content: '추가 문장.',
    })
    expect(r.status).toBe('applied')
    if (r.status === 'applied')
      expect(r.text).toContain(
        '두 번째 문단이다.\n\n추가 문장.\n\n## 감정의 긍정과 자아 회복',
      )
    expect(findSection(NOTE, '감정의 긍정과 자아 회복')?.bodyTo).toBe(
      NOTE.length,
    )
  })
  it('fails clearly when the anchor is missing or ambiguous', () => {
    expect(
      applyEditOp(NOTE, {
        op: 'replace',
        anchor: 'nope nope nope',
        content: 'x',
      }).status,
    ).toBe('failed')
    const amb = applyEditOp(NOTE, {
      op: 'insert-after',
      anchor: '강신주는',
      content: 'x',
    })
    expect(amb.status).toBe('failed')
    if (amb.status === 'failed')
      expect(amb.candidates?.length).toBeGreaterThan(1)
  })
  it('normalizes without losing index mapping', () => {
    const { value, map } = normalizeForMatch('a  b\n\tc')
    expect(value).toBe('a b c')
    expect(map).toEqual([0, 1, 3, 4, 6])
  })
})
