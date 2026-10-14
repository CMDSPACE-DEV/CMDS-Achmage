// Obsidian installs its DOM helpers on every window, popouts included, but its
// typings declare them only as globals. Typing them on Window lets
// `el.doc.win.createDiv()` build in the owner window's document.
interface Window {
  createEl: typeof createEl
  createDiv: typeof createDiv
  createSpan: typeof createSpan
  createSvg: typeof createSvg
  createFragment: typeof createFragment
}
