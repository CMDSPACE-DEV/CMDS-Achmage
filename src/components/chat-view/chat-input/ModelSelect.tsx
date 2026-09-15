import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'

import { useDialogContainer } from '../../../contexts/dialog-container-context'
import { useSettings } from '../../../contexts/settings-context'
import { getProviderCapabilities } from '../../../core/llm/providerCapabilities'

export function ModelSelect() {
  const dialogContainer = useDialogContainer()
  const { settings, setSettings } = useSettings()
  const [isOpen, setIsOpen] = useState(false)
  return (
    <DropdownMenu.Root open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenu.Trigger
        className="smtcmp-chat-input-model-select"
        title={settings.chatModelId}
      >
        <div className="smtcmp-chat-input-model-select__model-name">
          {settings.chatModelId}
        </div>
        <div className="smtcmp-chat-input-model-select__icon">
          {isOpen ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
        </div>
      </DropdownMenu.Trigger>

      {/* Escape the workspace leaf's paint containment, including in popouts. */}
      <DropdownMenu.Portal container={dialogContainer.ownerDocument.body}>
        <DropdownMenu.Content
          className="smtcmp-popover smtcmp-model-select-popover"
          side="top"
          align="start"
          sideOffset={5}
          collisionPadding={8}
        >
          <ul>
            {settings.chatModels
              .filter(({ enable }) => enable ?? true)
              .filter((model) => !getProviderCapabilities(model).imageOnly)
              .map((chatModelOption) => (
                <DropdownMenu.Item
                  key={chatModelOption.id}
                  onSelect={() => {
                    setSettings({
                      ...settings,
                      chatModelId: chatModelOption.id,
                    })
                  }}
                  asChild
                >
                  <li>
                    <span className="smtcmp-model-select-popover__label">
                      {chatModelOption.id}
                    </span>
                  </li>
                </DropdownMenu.Item>
              ))}
          </ul>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
