/** @jest-environment jsdom */

import { isDeepStrictEqual } from 'util'

import { debounce } from './debounce'

describe('chat persistence helpers', () => {
  beforeEach(() => jest.useFakeTimers())
  afterEach(() => jest.useRealTimers())

  it('saves only the latest arguments after 300ms quiet', () => {
    const save = jest.fn()
    const debounced = debounce(save, 300, { maxWait: 1000 })
    debounced('first')
    jest.advanceTimersByTime(200)
    debounced('latest')
    jest.advanceTimersByTime(299)
    expect(save).not.toHaveBeenCalled()
    jest.advanceTimersByTime(1)
    expect(save.mock.calls).toEqual([['latest']])
  })

  it('saves ongoing edits at 1000ms and starts a fresh window', () => {
    const save = jest.fn()
    const debounced = debounce(save, 300, { maxWait: 1000 })
    for (let i = 0; i < 5; i++) {
      debounced(i)
      jest.advanceTimersByTime(200)
    }
    expect(save.mock.calls).toEqual([[4]])
    debounced(5)
    jest.advanceTimersByTime(300)
    expect(save.mock.calls).toEqual([[4], [5]])
  })

  it('returns the last async invocation result as lodash did', () => {
    const result = Promise.resolve()
    const debounced = debounce(() => result, 300, { maxWait: 1000 })
    expect(debounced()).toBeUndefined()
    jest.advanceTimersByTime(300)
    expect(debounced()).toBe(result)
  })

  it('compares serialized messages structurally without key-order sensitivity', () => {
    const before = [
      {
        role: 'assistant',
        content: '한글',
        metadata: { a: 1, b: [null, true] },
      },
    ]
    const reordered = [
      {
        metadata: { b: [null, true], a: 1 },
        content: '한글',
        role: 'assistant',
      },
    ]
    expect(isDeepStrictEqual(before, reordered)).toBe(true)
    expect(
      isDeepStrictEqual(before, [{ ...before[0], content: 'changed' }]),
    ).toBe(false)
    expect(isDeepStrictEqual([{ content: undefined }], [{}])).toBe(false)
    expect(isDeepStrictEqual([1, 2], [2, 1])).toBe(false)
  })
})
