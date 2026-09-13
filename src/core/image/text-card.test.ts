import { wrapCardText } from './text-card'

describe('wrapCardText', () => {
  const measure = (t: string) => t.length * 10
  it('wraps on words within the width and keeps paragraphs', () => {
    expect(wrapCardText(measure, 'one two three four', 80)).toEqual([
      'one two',
      'three',
      'four',
    ])
    expect(wrapCardText(measure, 'a\n\nb', 100)).toEqual(['a', '', 'b'])
  })
  it('breaks long unbroken runs by character', () => {
    expect(wrapCardText(measure, '가나다라마바사아자차', 50)).toEqual([
      '가나다라마',
      '바사아자차',
    ])
  })
})
