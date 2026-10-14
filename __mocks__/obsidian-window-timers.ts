// Node tests have no Obsidian window. Alias it to the global object so window
// timers stay under Jest fake timers and tests can reach Node globals (fetch,
// DOMParser) through window; jsdom tests retain their real window object.
if (typeof window === 'undefined') {
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: globalThis,
  })
}
