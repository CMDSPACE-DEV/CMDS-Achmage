import { $generateJSONFromSelectedNodes } from '@lexical/clipboard'
import { BaseSerializedNode } from '@lexical/clipboard/clipboard'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {
  $getSelection,
  COMMAND_PRIORITY_LOW,
  SELECTION_CHANGE_COMMAND,
} from 'lexical'
import { App } from 'obsidian'
import { CSSProperties, useCallback, useEffect, useRef, useState } from 'react'

import { CreateTemplateModal } from '../../../../modals/TemplateFormModal'

export default function CreateTemplatePopoverPlugin({
  app,
  anchorElement,
  contentEditableElement,
}: {
  app: App
  anchorElement: HTMLElement | null
  contentEditableElement: HTMLElement | null
}): JSX.Element | null {
  const [editor] = useLexicalComposerContext()

  const [popoverStyle, setPopoverStyle] = useState<CSSProperties | null>(null)
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)

  const popoverRef = useRef<HTMLButtonElement>(null)
  const isComposingRef = useRef(false)
  const hasSelectionIntentRef = useRef(false)

  const getSelectedSerializedNodes = useCallback(():
    | BaseSerializedNode[]
    | null => {
    if (!editor) return null
    let selectedNodes: BaseSerializedNode[] | null = null
    editor.getEditorState().read(() => {
      const selection = $getSelection()
      if (!selection) return
      selectedNodes = $generateJSONFromSelectedNodes(editor, selection).nodes
      if (selectedNodes.length === 0) return null
    })
    return selectedNodes
  }, [editor])

  const updatePopoverPosition = useCallback(() => {
    const input = contentEditableElement ?? editor.getRootElement()
    if (
      !anchorElement ||
      !input ||
      isComposingRef.current ||
      editor.isComposing() ||
      !hasSelectionIntentRef.current
    ) {
      setIsPopoverOpen(false)
      return
    }
    const nativeSelection = input.ownerDocument.getSelection()
    const range = nativeSelection?.rangeCount
      ? nativeSelection.getRangeAt(0)
      : null
    if (!range || range.collapsed) {
      setIsPopoverOpen(false)
      return
    }
    if (!input.contains(range.commonAncestorContainer)) {
      setIsPopoverOpen(false)
      return
    }
    const rects = Array.from(range.getClientRects())
    if (rects.length === 0) {
      setIsPopoverOpen(false)
      return
    }
    const anchorRect = anchorElement.getBoundingClientRect()
    const idealLeft = rects[rects.length - 1].right - anchorRect.left
    const paddingX = 8
    const paddingY = 4
    const minLeft = (popoverRef.current?.offsetWidth ?? 0) + paddingX
    const finalLeft = Math.max(minLeft, idealLeft)
    setPopoverStyle({
      top: rects[rects.length - 1].bottom - anchorRect.top + paddingY,
      left: finalLeft,
      transform: 'translate(-100%, 0)',
    })
    setIsPopoverOpen(true)
  }, [anchorElement, contentEditableElement, editor])

  useEffect(() => {
    const removeSelectionChangeListener = editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        updatePopoverPosition()
        return false
      },
      COMMAND_PRIORITY_LOW,
    )
    return () => {
      removeSelectionChangeListener()
    }
  }, [editor, updatePopoverPosition])

  useEffect(() => {
    // Update popover position when the content is cleared
    // (Selection change event doesn't fire in this case)
    if (!isPopoverOpen) return
    const removeTextContentChangeListener = editor.registerTextContentListener(
      () => {
        updatePopoverPosition()
      },
    )
    return () => {
      removeTextContentChangeListener()
    }
  }, [editor, isPopoverOpen, updatePopoverPosition])

  useEffect(() => {
    const input = contentEditableElement ?? editor.getRootElement()
    if (!input) return
    const doc = input.ownerDocument
    let dragging = false

    const hideForInput = () => {
      hasSelectionIntentRef.current = false
      setIsPopoverOpen(false)
    }
    const handleCompositionStart = () => {
      isComposingRef.current = true
      hideForInput()
    }
    const handleCompositionEnd = () => {
      isComposingRef.current = false
      // A committed IME range is still not an intentional selection.
      hideForInput()
    }
    const handlePointerDown = () => {
      dragging = true
      hideForInput()
    }
    const handlePointerUp = () => {
      if (!dragging) return
      dragging = false
      hasSelectionIntentRef.current = true
      updatePopoverPosition()
    }
    const handleKeyUp = (event: KeyboardEvent) => {
      const selecting =
        (event.shiftKey &&
          [
            'ArrowLeft',
            'ArrowRight',
            'ArrowUp',
            'ArrowDown',
            'Home',
            'End',
          ].includes(event.key)) ||
        ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'a')
      if (!selecting || event.isComposing) return
      hasSelectionIntentRef.current = true
      updatePopoverPosition()
    }

    input.addEventListener('compositionstart', handleCompositionStart)
    input.addEventListener('compositionend', handleCompositionEnd)
    input.addEventListener('beforeinput', hideForInput)
    input.addEventListener('pointerdown', handlePointerDown)
    doc.addEventListener('pointerup', handlePointerUp)
    input.addEventListener('keyup', handleKeyUp)
    input.addEventListener('scroll', updatePopoverPosition)
    doc.addEventListener('selectionchange', updatePopoverPosition)
    return () => {
      input.removeEventListener('compositionstart', handleCompositionStart)
      input.removeEventListener('compositionend', handleCompositionEnd)
      input.removeEventListener('beforeinput', hideForInput)
      input.removeEventListener('pointerdown', handlePointerDown)
      doc.removeEventListener('pointerup', handlePointerUp)
      input.removeEventListener('keyup', handleKeyUp)
      input.removeEventListener('scroll', updatePopoverPosition)
      doc.removeEventListener('selectionchange', updatePopoverPosition)
    }
  }, [contentEditableElement, editor, updatePopoverPosition])

  return (
    <button
      ref={popoverRef}
      style={{
        position: 'absolute',
        visibility: isPopoverOpen ? 'visible' : 'hidden',
        ...popoverStyle,
      }}
      onMouseDown={(event) => event.preventDefault()}
      onClick={() => {
        new CreateTemplateModal({
          app,
          selectedSerializedNodes: getSelectedSerializedNodes(),
        }).open()
      }}
    >
      Create template
    </button>
  )
}
