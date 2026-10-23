// Obsidian installs createEl/createDiv/createSpan as globals at runtime; jsdom
// does not. Provide the subset the source uses so jsdom tests run the real code.
type ElInfo = {
  cls?: string | string[]
  text?: string | DocumentFragment
  attr?: Record<string, string | number | boolean | null>
  parent?: Node
}

if (typeof document !== 'undefined') {
  const createEl = (tag: string, o?: ElInfo | string) => {
    const el = document.createElement(tag)
    const info = typeof o === 'string' ? { cls: o } : (o ?? {})
    if (info.cls) el.className = [info.cls].flat().join(' ')
    if (typeof info.text === 'string') el.textContent = info.text
    else if (info.text) el.append(info.text)
    for (const [key, value] of Object.entries(info.attr ?? {})) {
      if (value !== null) el.setAttribute(key, String(value))
    }
    info.parent?.appendChild(el)
    return el
  }
  Object.assign(globalThis, {
    createEl,
    createDiv: (o?: ElInfo | string) => createEl('div', o),
    createSpan: (o?: ElInfo | string) => createEl('span', o),
  })
}
