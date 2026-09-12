import { debounce } from './debounce'

describe('debounce', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('invokes after wait following the last call', () => {
    const fn = jest.fn()
    const debounced = debounce(fn, 300)
    debounced('a')
    debounced('b')
    jest.advanceTimersByTime(299)
    expect(fn).not.toHaveBeenCalled()
    jest.advanceTimersByTime(1)
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith('b')
  })

  it('invokes by maxWait even while calls continue', () => {
    const fn = jest.fn()
    const debounced = debounce(fn, 300, { maxWait: 1000 })
    debounced('a')
    for (let i = 0; i < 9; i += 1) {
      jest.advanceTimersByTime(100)
      debounced(`x${i}`)
    }
    expect(fn).not.toHaveBeenCalled()
    jest.advanceTimersByTime(100)
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith('x8')
  })

  it('cancel prevents a pending invocation', () => {
    const fn = jest.fn()
    const debounced = debounce(fn, 300)
    debounced('a')
    debounced.cancel()
    jest.advanceTimersByTime(300)
    expect(fn).not.toHaveBeenCalled()
  })
})
