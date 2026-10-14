import { getFullMatchOffset } from './LexicalMenu'

// The pre-#21 implementation, kept here to pin that slice() preserves the
// exact semantics of the deprecated substr() calls it replaced.
function legacyGetFullMatchOffset(
  documentText: string,
  entryText: string,
  offset: number,
): number {
  let triggerOffset = offset
  for (let i = triggerOffset; i <= entryText.length; i++) {
    // Deliberately the deprecated API: this is the reference behavior.
    if (documentText.substr(-i) === entryText.substr(0, i)) {
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
