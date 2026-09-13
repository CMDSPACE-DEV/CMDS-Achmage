import { App, MarkdownView, TFile } from 'obsidian'

import { ApplyResult, EditOp, applyEditOp } from './edit-ops'
import {
  ParagraphPatch,
  applyParagraphPatch,
  computeParagraphPatch,
} from './paragraph-patch'

/**
 * Applies one edit to a note. If the note is open in an editor the change goes
 * through the editor (undoable, cursor kept); otherwise the file is rewritten
 * atomically with vault.process.
 */
function findOpenEditor(app: App, file: TFile) {
  return app.workspace
    .getLeavesOfType('markdown')
    .map((leaf) => leaf.view)
    .find(
      (v): v is MarkdownView =>
        v instanceof MarkdownView && v.file?.path === file.path,
    )?.editor
}

/** Paragraph-level patch of a whole/abbreviated block onto a note (R-042). */
export async function applyPatchToFile(
  app: App,
  file: TFile,
  proposed: string,
): Promise<Pick<ParagraphPatch, 'changed' | 'matched'>> {
  const editor = findOpenEditor(app, file)
  if (editor) {
    const current = editor.getValue()
    const patch = computeParagraphPatch(current, proposed)
    if (patch.changed === 0) return patch
    const { edits } = applyParagraphPatch(current, patch)
    // Bottom-up so earlier offsets stay valid.
    for (const edit of [...edits].sort((a, b) => b.from - a.from)) {
      editor.replaceRange(
        edit.insert,
        editor.offsetToPos(edit.from),
        editor.offsetToPos(edit.to),
      )
    }
    return patch
  }
  let outcome: Pick<ParagraphPatch, 'changed' | 'matched'> = {
    changed: 0,
    matched: 0,
  }
  await app.vault.process(file, (text) => {
    const patch = computeParagraphPatch(text, proposed)
    outcome = patch
    return patch.changed === 0 ? text : applyParagraphPatch(text, patch).text
  })
  return outcome
}

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
