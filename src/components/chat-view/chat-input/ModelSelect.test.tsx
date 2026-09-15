/** @jest-environment jsdom */

import '@testing-library/jest-dom'

import { fireEvent, render, screen } from '@testing-library/react'

import { DialogContainerProvider } from '../../../contexts/dialog-container-context'

import { ModelSelect } from './ModelSelect'

const mockSetSettings = jest.fn()
const mockSettings = {
  chatModelId: 'a-very-long-model-name (plan)',
  chatModels: [
    { id: 'a-very-long-model-name (plan)' },
    { id: 'another-model' },
    { id: 'disabled-model', enable: false },
    { id: 'image-only-model', imageOnly: true },
  ],
}

jest.mock('../../../contexts/settings-context', () => ({
  useSettings: () => ({
    settings: mockSettings,
    setSettings: mockSetSettings,
  }),
}))

jest.mock('../../../core/llm/providerCapabilities', () => ({
  getProviderCapabilities: (model: { imageOnly?: boolean }) => ({
    imageOnly: model.imageOnly ?? false,
  }),
}))

describe('ModelSelect', () => {
  beforeEach(() => {
    mockSetSettings.mockClear()
    HTMLElement.prototype.scrollIntoView = jest.fn()
  })

  it('portals outside the clipping leaf and preserves keyboard selection', async () => {
    const leaf = document.createElement('div')
    document.body.appendChild(leaf)
    const view = render(
      <DialogContainerProvider container={leaf}>
        <ModelSelect />
      </DialogContainerProvider>,
      { container: leaf },
    )

    const trigger = screen.getByRole('button')
    expect(trigger).toHaveAttribute('title', mockSettings.chatModelId)
    fireEvent.keyDown(trigger, { key: 'ArrowDown' })

    const menu = await screen.findByRole('menu')
    expect(leaf).not.toContainElement(menu)
    expect(document.body).toContainElement(menu)
    expect(menu).toHaveClass('smtcmp-model-select-popover')
    expect(screen.getAllByRole('menuitem')).toHaveLength(2)
    expect(screen.queryByText('disabled-model')).not.toBeInTheDocument()
    expect(screen.queryByText('image-only-model')).not.toBeInTheDocument()

    fireEvent.keyDown(screen.getByRole('menuitem', { name: 'another-model' }), {
      key: 'Enter',
    })
    expect(mockSetSettings).toHaveBeenCalledWith({
      ...mockSettings,
      chatModelId: 'another-model',
    })
    view.unmount()
    leaf.remove()
  })
})
