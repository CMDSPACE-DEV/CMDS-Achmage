import { AbstractInputSuggest, App, TFolder } from 'obsidian'

/**
 * Vault folder autocompletion for plain text inputs (R-036). Typing filters
 * the folder list; picking one writes the path and fires an `input` event so
 * the surrounding TextComponent / React state sees the change.
 */
export class FolderSuggest extends AbstractInputSuggest<TFolder> {
  constructor(
    app: App,
    private readonly inputEl: HTMLInputElement,
  ) {
    super(app, inputEl)
  }

  getSuggestions(query: string): TFolder[] {
    const needle = query.toLowerCase().trim()
    const folders = this.app.vault
      .getAllLoadedFiles()
      .filter((file): file is TFolder => file instanceof TFolder)
      .filter((folder) => !folder.isRoot())
    const matched = needle
      ? folders.filter((folder) => folder.path.toLowerCase().includes(needle))
      : folders
    return matched
      .sort((a, b) => {
        const aStarts = a.path.toLowerCase().startsWith(needle) ? 0 : 1
        const bStarts = b.path.toLowerCase().startsWith(needle) ? 0 : 1
        return aStarts - bStarts || a.path.localeCompare(b.path)
      })
      .slice(0, 50)
  }

  renderSuggestion(folder: TFolder, el: HTMLElement): void {
    el.setText(folder.path)
  }

  selectSuggestion(folder: TFolder): void {
    this.setValue(folder.path)
    this.inputEl.dispatchEvent(new Event('input', { bubbles: true }))
    this.close()
  }
}
