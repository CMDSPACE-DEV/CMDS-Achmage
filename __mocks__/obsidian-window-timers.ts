// Node tests have no Obsidian window. Forward timer lookups so Jest fake timers
// still control them; jsdom tests retain their real window object.
if (typeof window === 'undefined') {
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      get setTimeout() {
        return globalThis.setTimeout
      },
      get clearTimeout() {
        return globalThis.clearTimeout
      },
    },
  })
}
