import { Check, CopyIcon, Eye, FilePenLine } from 'lucide-react'
import { Notice, TFile } from 'obsidian'
import { PropsWithChildren, useMemo, useState } from 'react'

import { useApp } from '../../contexts/app-context'
import { useDarkModeContext } from '../../contexts/dark-mode-context'
import { applyPatchToFile } from '../../core/note-edit/apply-to-vault'
import { openMarkdownFile } from '../../utils/obsidian'

import { ObsidianMarkdown } from './ObsidianMarkdown'
import { MemoizedSyntaxHighlighterWrapper } from './SyntaxHighlighterWrapper'

export default function MarkdownCodeComponent({
  language,
  filename,
  applyEnabled = true,
  children,
}: PropsWithChildren<{
  language?: string
  filename?: string
  /** False while the message is still streaming. */
  applyEnabled?: boolean
}>) {
  const app = useApp()
  const { isDarkMode } = useDarkModeContext()

  const [isPreviewMode, setIsPreviewMode] = useState(true)
  const [copied, setCopied] = useState(false)
  const [applyState, setApplyState] = useState<
    'idle' | 'busy' | 'applied' | 'nothing'
  >('idle')

  // Markdown blocks that echo the active note can be applied paragraph by
  // paragraph (R-042): only differing paragraphs change, frontmatter stays.
  const activeFile = app.workspace.getActiveFile()
  const isMarkdownBlock =
    !language || language === 'markdown' || language === 'md'
  const targetFile =
    isMarkdownBlock && activeFile instanceof TFile
      ? filename && filename !== activeFile.path
        ? (app.vault.getAbstractFileByPath(filename) ?? activeFile)
        : activeFile
      : null

  const handleApplyChanges = async () => {
    if (!(targetFile instanceof TFile)) return
    setApplyState('busy')
    try {
      const outcome = await applyPatchToFile(app, targetFile, String(children))
      if (outcome.changed === 0) {
        setApplyState('nothing')
        new Notice('No paragraph differs from the note.')
        return
      }
      if (outcome.matched === 0) {
        new Notice(
          `No paragraph matched; appended ${outcome.changed} block(s) at the end of ${targetFile.basename}.`,
        )
      }
      setApplyState('applied')
    } catch (error) {
      setApplyState('idle')
      new Notice(
        `Apply failed: ${error instanceof Error ? error.message : String(error)}`,
      )
    }
  }

  const wrapLines = useMemo(() => {
    return !language || ['markdown'].includes(language)
  }, [language])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(String(children))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  const handleOpenFile = () => {
    if (filename) {
      openMarkdownFile(app, filename)
    }
  }

  return (
    <div className="smtcmp-code-block">
      <div className="smtcmp-code-block-header">
        {filename && (
          <div
            className="smtcmp-code-block-header-filename"
            onClick={handleOpenFile}
          >
            {filename}
          </div>
        )}
        <div className="smtcmp-code-block-header-button-container">
          {targetFile instanceof TFile && (
            <button
              className="clickable-icon smtcmp-code-block-header-button smtcmp-code-block-apply"
              disabled={!applyEnabled || applyState === 'busy'}
              title={`Apply the paragraphs that differ to ${targetFile.basename}; frontmatter and unchanged paragraphs stay as they are.`}
              onClick={() => void handleApplyChanges()}
            >
              {applyState === 'applied' ? (
                <>
                  <Check size={10} />
                  <span>Applied</span>
                </>
              ) : (
                <>
                  <FilePenLine size={10} />
                  <span>
                    {applyState === 'nothing'
                      ? 'No changes'
                      : `Apply changes to ${targetFile.basename}`}
                  </span>
                </>
              )}
            </button>
          )}
          <button
            className="clickable-icon smtcmp-code-block-header-button"
            onClick={() => {
              setIsPreviewMode(!isPreviewMode)
            }}
          >
            <Eye size={12} />
            {isPreviewMode ? 'View Raw Text' : 'View Formatted'}
          </button>
          <button
            className="clickable-icon smtcmp-code-block-header-button"
            onClick={() => {
              handleCopy()
            }}
          >
            {copied ? (
              <>
                <Check size={10} />
                <span>Copied</span>
              </>
            ) : (
              <>
                <CopyIcon size={10} />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>
      {isPreviewMode ? (
        <div className="smtcmp-code-block-obsidian-markdown">
          <ObsidianMarkdown content={String(children)} scale="sm" />
        </div>
      ) : (
        <MemoizedSyntaxHighlighterWrapper
          isDarkMode={isDarkMode}
          language={language}
          hasFilename={!!filename}
          wrapLines={wrapLines}
        >
          {String(children)}
        </MemoizedSyntaxHighlighterWrapper>
      )}
      <div className="smtcmp-code-block-footer">
        <div className="smtcmp-code-block-header-button-container">
          <button
            className="clickable-icon smtcmp-code-block-header-button"
            onClick={() => {
              handleCopy()
            }}
          >
            {copied ? (
              <>
                <Check size={10} />
                <span>Copied</span>
              </>
            ) : (
              <>
                <CopyIcon size={10} />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
