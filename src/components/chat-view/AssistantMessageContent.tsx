import { Check, FilePenLine, LoaderCircle } from 'lucide-react'
import { Notice } from 'obsidian'
import React, { useMemo, useState } from 'react'

import { useApp } from '../../contexts/app-context'

import { ChatAssistantMessage } from '../../types/chat'
import {
  ParsedTagContent,
  parseTagContents,
} from '../../utils/chat/parse-tag-content'

import AssistantMessageReasoning from './AssistantMessageReasoning'
import {
  EditBlockCard,
  EditCardState,
  isOpKind,
  runEditBlock,
} from './EditBlockCard'
import MarkdownCodeComponent from './MarkdownCodeComponent'
import MarkdownReferenceBlock from './MarkdownReferenceBlock'
import { StableObsidianMarkdown } from './ObsidianMarkdown'

export default function AssistantMessageContent({
  content,
  isStreaming = false,
}: {
  content: ChatAssistantMessage['content']
  isStreaming?: boolean
}) {
  return (
    <AssistantTextRenderer isStreaming={isStreaming}>
      {content}
    </AssistantTextRenderer>
  )
}

const AssistantTextRenderer = React.memo(function AssistantTextRenderer({
  children,
  isStreaming,
}: {
  children: string
  isStreaming: boolean
}) {
  const blocks: ParsedTagContent[] = useMemo(
    () => parseTagContents(children),
    [children],
  )
  const app = useApp()
  const [cardStates, setCardStates] = useState<Record<number, EditCardState>>(
    {},
  )
  const [applyingAll, setApplyingAll] = useState(false)
  const editIndexes = blocks
    .map((block, index) => (block.type === 'achmage_edit' ? index : -1))
    .filter((index) => index >= 0)
  const pendingIndexes = editIndexes.filter((index) => {
    const block = blocks[index]
    return (
      block.type === 'achmage_edit' &&
      block.complete &&
      isOpKind(block.op) &&
      cardStates[index]?.kind !== 'applied'
    )
  })
  const setCardState = (index: number, state: EditCardState) =>
    setCardStates((prev) => ({ ...prev, [index]: state }))

  const applyAll = async () => {
    setApplyingAll(true)
    let applied = 0
    let failed = 0
    // Top to bottom: each edit re-locates its anchor in the current text, so
    // earlier insertions never shift later ones.
    for (const index of pendingIndexes) {
      const block = blocks[index]
      if (block.type !== 'achmage_edit') continue
      setCardState(index, { kind: 'busy' })
      const next = await runEditBlock(app, block)
      setCardState(index, next)
      if (next.kind === 'applied') applied += 1
      else failed += 1
    }
    setApplyingAll(false)
    new Notice(
      failed === 0
        ? `Applied ${applied} edit${applied === 1 ? '' : 's'}.`
        : `Applied ${applied}, ${failed} failed. Fix the failed cards individually.`,
    )
  }

  return (
    <>
      {editIndexes.length >= 2 && !isStreaming && (
        <div className="smtcmp-edit-apply-all">
          <span>
            {editIndexes.length} edits · {pendingIndexes.length} pending
          </span>
          <button
            disabled={applyingAll || pendingIndexes.length === 0}
            onClick={() => void applyAll()}
          >
            {applyingAll ? (
              <LoaderCircle size={13} className="smtcmp-spin" />
            ) : pendingIndexes.length === 0 ? (
              <Check size={13} />
            ) : (
              <FilePenLine size={13} />
            )}
            {pendingIndexes.length === 0
              ? 'All applied'
              : `Apply all (${pendingIndexes.length})`}
          </button>
        </div>
      )}
      {blocks.map((block, index) =>
        block.type === 'string' ? (
          <div key={index}>
            <StableObsidianMarkdown
              content={block.content}
              scale="sm"
              active={isStreaming && index === blocks.length - 1}
            />
          </div>
        ) : block.type === 'think' ? (
          <AssistantMessageReasoning key={index} reasoning={block.content} />
        ) : block.type === 'achmage_edit' ? (
          <EditBlockCard
            key={index}
            op={block.op}
            anchor={block.anchor}
            until={block.until}
            heading={block.heading}
            content={block.content}
            complete={block.complete && !isStreaming}
            state={cardStates[index]}
            onStateChange={(state) => setCardState(index, state)}
          />
        ) : block.startLine && block.endLine && block.filename ? (
          <MarkdownReferenceBlock
            key={index}
            filename={block.filename}
            startLine={block.startLine}
            endLine={block.endLine}
          />
        ) : (
          <MarkdownCodeComponent
            key={index}
            language={block.language}
            filename={block.filename}
            applyEnabled={!isStreaming}
          >
            {block.content}
          </MarkdownCodeComponent>
        ),
      )}
    </>
  )
})
