/** Trailing debounce with a bounded wait for continuous chat updates. */
export function debounce<A extends unknown[], R>(
  callback: (...args: A) => R,
  wait: number,
  { maxWait }: { maxWait: number },
): (...args: A) => R | undefined {
  let trailing: number | undefined
  let maximum: number | undefined
  let pending: A | undefined
  let result: R | undefined

  const invoke = () => {
    window.clearTimeout(trailing)
    window.clearTimeout(maximum)
    trailing = maximum = undefined
    if (pending) {
      const args = pending
      pending = undefined
      result = callback(...args)
    }
  }

  return (...args) => {
    pending = args
    window.clearTimeout(trailing)
    trailing = window.setTimeout(invoke, wait)
    maximum ??= window.setTimeout(invoke, maxWait)
    return result
  }
}
