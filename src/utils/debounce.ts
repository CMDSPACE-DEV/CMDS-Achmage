type Debounced<T extends (...args: never[]) => unknown> = ((
  ...args: Parameters<T>
) => void) & {
  cancel: () => void
}

export function debounce<T extends (...args: never[]) => unknown>(
  fn: T,
  wait: number,
  options?: { maxWait?: number },
): Debounced<T> {
  let timeoutId: number | undefined
  let maxTimeoutId: number | undefined
  let lastArgs: Parameters<T> | undefined
  let maxWaitStartedAt: number | undefined

  const invoke = () => {
    const args = lastArgs
    lastArgs = undefined
    maxWaitStartedAt = undefined
    if (timeoutId !== undefined) {
      window.clearTimeout(timeoutId)
      timeoutId = undefined
    }
    if (maxTimeoutId !== undefined) {
      window.clearTimeout(maxTimeoutId)
      maxTimeoutId = undefined
    }
    if (args) void fn(...args)
  }

  const debounced = ((...args: Parameters<T>) => {
    lastArgs = args
    if (timeoutId !== undefined) window.clearTimeout(timeoutId)
    timeoutId = window.setTimeout(invoke, wait)

    if (options?.maxWait !== undefined && maxWaitStartedAt === undefined) {
      maxWaitStartedAt = Date.now()
      maxTimeoutId = window.setTimeout(invoke, options.maxWait)
    }
  }) as Debounced<T>

  debounced.cancel = () => {
    if (timeoutId !== undefined) window.clearTimeout(timeoutId)
    if (maxTimeoutId !== undefined) window.clearTimeout(maxTimeoutId)
    timeoutId = undefined
    maxTimeoutId = undefined
    lastArgs = undefined
    maxWaitStartedAt = undefined
  }

  return debounced
}
