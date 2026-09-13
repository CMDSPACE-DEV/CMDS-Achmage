import { Check, CircleAlert, FilePenLine, LoaderCircle } from 'lucide-react'
import { Notice, TFile } from 'obsidian'
import { useState } from 'react'

import { useApp } from '../../contexts/app-context'
import { applyEditToFile } from '../../core/note-edit/apply-to-vault'
import { EditOp, EditOpKind } from '../../core/note-edit/edit-ops'
import { insertMarkdownIntoOpenView } from '../../utils/obsidian/markdownInsertion'

import { ObsidianMarkdown } from './ObsidianMarkdown'

const OP_LABELS: Record<EditOpKind, string> = {
  replace: 'Replace',
  'insert-after': 'Insert after',
  'insert-before': 'Insert before',
  'append-section': 'Append to section',
}

function isOpKind(value: string): value is EditOpKind {
  return value in OP_LABELS
}

/**
 * One achmage_edit operation as a card with a single Apply button (R-041).
 * Apply is pure string work against the active note; no model call.
 */
export function EditBlockCard({
  op,
  anchor,
  until,
  heading,
  content,
  complete,
}: {
  op: string
  anchor?: string
  until?: string
  heading?: string
  content: string
  complete: boolean
}) {
  const app = useApp()
  const [state, setState] = useState<
    | { kind: 'idle' }
    | { kind: 'busy' }
    | { kind: 'applied'; file: string }
    | { kind: 'failed'; reason: string }
  >({ kind: 'idle' })
  const target = app.workspace.getActiveFile()
  const validOp = isOpKind(op)
  const where = heading ?? anchor ?? ''

  const apply = async () => {
    if (!validOp) return
    const file = app.workspace.getActiveFile()
    if (!(file instanceof TFile)) {
      new Notice('Open the note you want to edit first.')
      return
    }
    setState({ kind: 'busy' })
    const editOp: EditOp = { op, anchor, until, heading, content }
    const result = await applyEditToFile(app, file, editOp)
    if (result.status === 'applied') {
      setState({ kind: 'applied', file: file.basename })
      return
    }
    setState({ kind: 'failed', reason: result.reason })
    new Notice(result.reason)
  }

  const insertAtCursor = () => {
    if (insertMarkdownIntoOpenView(app, `\n${content.trim()}\n`)) {
      setState({ kind: 'applied', file: target?.basename ?? 'note' })
    } else {
      new Notice('Open a Markdown note to insert into.')
    }
  }

  return (
    <div className="smtcmp-edit-card" data-state={state.kind}>
      <div className="smtcmp-edit-card__header">
        <FilePenLine size={13} />
        <span className="smtcmp-edit-card__op">
          {validOp ? OP_LABELS[op] : `Unknown op "${op}"`}
        </span>
        {where && (
          <span className="smtcmp-edit-card__anchor" title={where}>
            {heading ? `§ ${where}` : `“${where}”`}
            {until ? ` … “${until}”` : ''}
          </span>
        )}
      </div>
      <div className="smtcmp-edit-card__content">
        <ObsidianMarkdown content={content} scale="sm" />
      </div>
      <div className="smtcmp-edit-card__actions">
        {state.kind === 'applied' ? (
          <span className="smtcmp-edit-card__status">
            <Check size={13} /> Applied to {state.file}
          </span>
        ) : state.kind === 'failed' ? (
          <>
            <span className="smtcmp-edit-card__status smtcmp-edit-card__status--error">
              <CircleAlert size={13} /> {state.reason}
            </span>
            <button onClick={insertAtCursor}>Insert at cursor instead</button>
            <button onClick={() => void apply()}>Retry</button>
          </>
        ) : (
          <button
            className="smtcmp-edit-card__apply"
            disabled={!complete || !validOp || state.kind === 'busy'}
            onClick={() => void apply()}
          >
            {state.kind === 'busy' ? (
              <LoaderCircle size={13} className="smtcmp-spin" />
            ) : (
              <Check size={13} />
            )}
            {complete
              ? `Apply${target ? ` to ${target.basename}` : ''}`
              : 'Waiting for the full edit…'}
          </button>
        )}
      </div>
    </div>
  )
}
