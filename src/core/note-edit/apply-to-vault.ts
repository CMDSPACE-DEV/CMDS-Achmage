import { App, MarkdownView, TFile } from 'obsidian'

import { ApplyResult, EditOp, applyEditOp } from './edit-ops'

/**
 * Applies one edit to a note. If the note is open in an editor the change goes
 * through the editor (undoable, cursor kept); otherwise the file is rewritten
 * atomically with vault.process.
 */
export async function applyEditToFile(
  app: App,
  file: TFile,
  op: EditOp,
): Promise<ApplyResult> {
  const view = app.workspace
    .getLeavesOfType('markdown')
    .map((leaf) => leaf.view)
    .find(
      (v): v is MarkdownView =>
        v instanceof MarkdownView && v.file?.path === file.path,
    )
  if (view) {
    const editor = view.editor
    const result = applyEditOp(editor.getValue(), op)
    if (result.status !== 'applied') return result
    const insert = result.text.slice(
      result.from,
      result.from + result.insertedLength,
    )
    editor.replaceRange(
      insert,
      editor.offsetToPos(result.from),
      editor.offsetToPos(result.to),
    )
    return result
  }
  let outcome: ApplyResult = { status: 'failed', reason: 'File unchanged.' }
  await app.vault.process(file, (text) => {
    outcome = applyEditOp(text, op)
    return outcome.status === 'applied' ? outcome.text : text
  })
  return outcome
}
