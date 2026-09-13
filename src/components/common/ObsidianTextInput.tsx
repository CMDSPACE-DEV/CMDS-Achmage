import { App, TextComponent } from 'obsidian'
import { useEffect, useRef, useState } from 'react'

import { FolderSuggest } from './FolderSuggest'
import { useObsidianSetting } from './ObsidianSetting'

type ObsidianTextInputProps = {
  value: string
  placeholder?: string
  onChange: (value: string) => void
  type?: 'text' | 'number' | 'password'
  /** Attach vault folder autocompletion; needs the app for the folder list. */
  folderSuggest?: App
}

export function ObsidianTextInput({
  value,
  placeholder,
  onChange,
  type,
  folderSuggest,
}: ObsidianTextInputProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { setting } = useObsidianSetting()
  const [textComponent, setTextComponent] = useState<TextComponent | null>(null)
  const onChangeRef = useRef(onChange)

  useEffect(() => {
    if (setting) {
      let newTextComponent: TextComponent | null = null
      setting.addText((component) => {
        newTextComponent = component
      })
      setTextComponent(newTextComponent)

      return () => {
        newTextComponent?.inputEl.remove()
      }
    } else if (containerRef.current) {
      const newTextComponent = new TextComponent(containerRef.current)
      setTextComponent(newTextComponent)

      return () => {
        newTextComponent?.inputEl.remove()
      }
    }
  }, [setting])

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    if (!textComponent) return
    textComponent.onChange((v) => onChangeRef.current(v))
  }, [textComponent])

  useEffect(() => {
    if (!textComponent || !folderSuggest) return
    const suggest = new FolderSuggest(folderSuggest, textComponent.inputEl)
    return () => suggest.close()
  }, [textComponent, folderSuggest])

  useEffect(() => {
    if (!textComponent) return
    textComponent.setValue(value)
    if (placeholder) textComponent.setPlaceholder(placeholder)
    if (type) textComponent.inputEl.type = type
  }, [textComponent, value, placeholder, type])

  return <div ref={containerRef} />
}
