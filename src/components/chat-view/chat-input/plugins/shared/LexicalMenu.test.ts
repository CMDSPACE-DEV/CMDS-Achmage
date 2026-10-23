import { getFullMatchOffset } from './LexicalMenu'

// The pre-#21 implementation, kept here to pin that slice() preserves the
// exact semantics of the deprecated substr() calls it replaced. substr() is
// spelled out per its spec (a negative start counts from the end, clamped at
// 0; -0 is not negative, so substr(-0) is the whole string) so the reference
// stays independent of slice().
function legacySubstr(text: string, start: number, length?: number): string {
  const from = start < 0 ? Math.max(text.length + start, 0) : start
  return length === undefined
    ? text.substring(from)
    : text.substring(from, from + length)
}

function legacyGetFullMatchOffset(
  documentText: string,
  entryText: string,
  offset: number,
): number {
  let triggerOffset = offset
  for (let i = triggerOffset; i <= entryText.length; i++) {
    if (legacySubstr(documentText, -i) === legacySubstr(entryText, 0, i)) {
      triggerOffset = i
    }
  }
  return triggerOffset
}

describe('getFullMatchOffset', () => {
  it('extends the match over text the user already typed', () => {
    expect(getFullMatchOffset('see @Proj', 'Project notes', 3)).toBe(4)
    expect(getFullMatchOffset('see @Project n', 'Project notes', 3)).toBe(9)
  })

  it('keeps the offset when nothing longer matches', () => {
    expect(getFullMatchOffset('abc', 'xyz', 2)).toBe(2)
  })

  it('handles a zero offset and an entry longer than the document', () => {
    expect(getFullMatchOffset('', 'abc', 0)).toBe(0)
    expect(getFullMatchOffset('ab', 'ab', 0)).toBe(2)
    expect(getFullMatchOffset('b', 'abc', 0)).toBe(0)
  })

  it('matches the legacy substr implementation on every small input', () => {
    const texts = ['', 'a', 'ab', 'ba', 'aba', 'abab', 'xab', '한글a', 'a b']
    for (const documentText of texts) {
      for (const entryText of texts) {
        for (let offset = 0; offset <= entryText.length + 1; offset++) {
          expect(getFullMatchOffset(documentText, entryText, offset)).toBe(
            legacyGetFullMatchOffset(documentText, entryText, offset),
          )
        }
      }
    }
  })
})
