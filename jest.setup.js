/**
 * Obsidian plugin code uses `window.setTimeout` / `window.clearTimeout`.
 * Jest's default environment is Node, which has no `window`. Alias it to the
 * Node global so those APIs (and Jest fake timers) work in tests.
 */
if (typeof globalThis.window === 'undefined') {
  Object.defineProperty(globalThis, 'window', {
    value: globalThis,
    writable: true,
    configurable: true,
  })
}
