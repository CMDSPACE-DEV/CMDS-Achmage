import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import clsx from 'clsx'
import {
  COMMAND_PRIORITY_HIGH,
  COMMAND_PRIORITY_NORMAL,
  KEY_ENTER_COMMAND,
  TextNode,
} from 'lexical'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'

import { Template } from '../../../../../database/json/template/types'
import { useTemplateManager } from '../../../../../hooks/useJsonManagers'
import { MenuOption } from '../shared/LexicalMenu'
import { LexicalTypeaheadMenuPlugin } from '../typeahead-menu/LexicalTypeaheadMenuPlugin'

import { $insertTemplate, matchTemplateTrigger } from './template-insertion'

class TemplateTypeaheadOption extends MenuOption {
  name: string
  template: Template

  constructor(name: string, template: Template) {
    super(name)
    this.name = name
    this.template = template
  }
}

function TemplateMenuItem({
  index,
  isSelected,
  onClick,
  onMouseEnter,
  option,
}: {
  index: number
  isSelected: boolean
  onClick: () => void
  onMouseEnter: () => void
  option: TemplateTypeaheadOption
}) {
  return (
    <li
      key={option.key}
      tabIndex={-1}
      className={clsx('item', isSelected && 'selected')}
      ref={(el) => option.setRefElement(el)}
      role="option"
      aria-selected={isSelected}
      id={`typeahead-item-${index}`}
      onMouseEnter={onMouseEnter}
      onClick={onClick}
    >
      <div className="smtcmp-template-menu-item">
        <div className="text">{option.name}</div>
      </div>
    </li>
  )
}

export default function TemplatePlugin() {
  const [editor] = useLexicalComposerContext()
  const templateManager = useTemplateManager()

  const [queryString, setQueryString] = useState<string | null>(null)
  const [searchResults, setSearchResults] = useState<Template[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchFailed, setSearchFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    setSearchResults([])
    setSearchFailed(false)
    setIsLoading(queryString != null)
    if (queryString == null) return
    void templateManager.searchTemplates(queryString).then(
      (results) => {
        if (!cancelled) {
          setSearchResults(results)
          setIsLoading(false)
        }
      },
      (error: unknown) => {
        if (!cancelled) {
          console.error('Failed to search templates:', error)
          setSearchFailed(true)
          setIsLoading(false)
        }
      },
    )
    return () => {
      cancelled = true
    }
  }, [queryString, templateManager])

  useEffect(() => {
    if (queryString == null || !isLoading) return
    // Enter should not send a half-resolved slash command as a chat message.
    return editor.registerCommand(
      KEY_ENTER_COMMAND,
      (event) => {
        if (editor.isComposing() || event?.isComposing) return false
        event?.preventDefault()
        return true
      },
      COMMAND_PRIORITY_HIGH,
    )
  }, [editor, isLoading, queryString])

  const options = useMemo(
    () =>
      searchResults.map(
        (result) => new TemplateTypeaheadOption(result.name, result),
      ),
    [searchResults],
  )

  const onSelectOption = useCallback(
    (
      selectedOption: TemplateTypeaheadOption,
      nodeToRemove: TextNode | null,
      closeMenu: () => void,
    ) => {
      editor.update(() => {
        $insertTemplate(selectedOption.template.content.nodes, nodeToRemove)
        closeMenu()
      })
    },
    [editor],
  )

  return (
    <LexicalTypeaheadMenuPlugin<TemplateTypeaheadOption>
      onQueryChange={setQueryString}
      onSelectOption={onSelectOption}
      triggerFn={matchTemplateTrigger}
      options={options}
      commandPriority={COMMAND_PRIORITY_NORMAL}
      menuRenderFn={(
        anchorElementRef,
        { selectedIndex, selectOptionAndCleanUp, setHighlightedIndex },
      ) =>
        anchorElementRef.current && queryString !== null
          ? createPortal(
              <div
                className="smtcmp-popover"
                style={{
                  position: 'fixed',
                }}
              >
                <ul>
                  {options.length === 0 && (
                    <li role="presentation">
                      <span role="status">
                        {isLoading
                          ? 'Loading templates...'
                          : searchFailed
                            ? 'Could not load templates. Reopen / to retry.'
                            : 'No matching templates. Save one in Prompt templates.'}
                      </span>
                    </li>
                  )}
                  {options.map((option, i: number) => (
                    <TemplateMenuItem
                      index={i}
                      isSelected={selectedIndex === i}
                      onClick={() => {
                        setHighlightedIndex(i)
                        selectOptionAndCleanUp(option)
                      }}
                      onMouseEnter={() => {
                        setHighlightedIndex(i)
                      }}
                      key={option.key}
                      option={option}
                    />
                  ))}
                </ul>
              </div>,
              anchorElementRef.current,
            )
          : null
      }
    />
  )
}
