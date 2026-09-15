/** @jest-environment jsdom */

import '@testing-library/jest-dom'

import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { App, Notice } from 'obsidian'
import type { ReactNode } from 'react'

import { TemplateFormComponentWrapper } from './TemplateFormModal'

jest.mock('react', () => {
  const react = jest.requireActual<typeof import('react')>('react')
  return { ...react, default: react }
})

jest.mock('obsidian', () => ({
  App: class {},
  Notice: jest.fn(),
  Platform: { isMacOS: true },
}))
jest.mock('../common/ReactModal', () => ({ ReactModal: class {} }))
jest.mock('../common/ObsidianSetting', () => ({
  ObsidianSetting: ({ children }: { children?: ReactNode }) => (
    <div>{children}</div>
  ),
}))
jest.mock('../common/ObsidianButton', () => ({
  ObsidianButton: ({
    text,
    onClick,
    disabled,
  }: {
    text: string
    onClick: () => void
    disabled?: boolean
  }) => (
    <button onClick={onClick} disabled={disabled}>
      {text}
    </button>
  ),
}))
jest.mock('../common/ObsidianTextInput', () => ({
  ObsidianTextInput: ({
    value,
    onChange,
  }: {
    value: string
    onChange: (value: string) => void
  }) => (
    <input
      aria-label="Name"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  ),
}))
jest.mock('../../utils/fuzzy-search', () => ({
  fuzzySearch: () => [],
  fuzzySearchWithConnections: () => [],
}))
const mockCreateTemplate = jest.fn().mockResolvedValue({})
const mockUpdateTemplate = jest.fn().mockResolvedValue({})
const mockFindById = jest.fn()
jest.mock('../../database/json/template/TemplateManager', () => ({
  TemplateManager: jest.fn().mockImplementation(() => ({
    createTemplate: mockCreateTemplate,
    updateTemplate: mockUpdateTemplate,
    findById: mockFindById,
    searchTemplates: jest.fn().mockResolvedValue([]),
  })),
}))

const nodes = [
  {
    type: 'paragraph',
    version: 1,
    format: '',
    indent: 0,
    direction: null,
    children: [
      {
        type: 'text',
        version: 1,
        text: 'Reusable prompt',
        format: 0,
        detail: 0,
        mode: 'normal',
        style: '',
      },
    ],
  },
]

describe('standalone template form', () => {
  beforeEach(() => jest.clearAllMocks())

  it('renders without chat settings and saves selected content', async () => {
    const onSubmit = jest.fn()
    const onClose = jest.fn()
    render(
      <TemplateFormComponentWrapper
        app={new App()}
        selectedSerializedNodes={nodes}
        onSubmit={onSubmit}
        onClose={onClose}
      />,
    )
    await screen.findByText('Reusable prompt')
    fireEvent.keyDown(screen.getByRole('textbox', { name: '' }), {
      key: 'Enter',
    })
    expect(mockCreateTemplate).not.toHaveBeenCalled()
    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: '  my-template  ' },
    })
    fireEvent.click(screen.getByText('Save'))
    await waitFor(() =>
      expect(mockCreateTemplate).toHaveBeenCalledWith({
        name: 'my-template',
        content: { nodes: expect.any(Array) },
      }),
    )
    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('rejects an empty editor instead of saving an empty paragraph', async () => {
    render(<TemplateFormComponentWrapper app={new App()} onClose={jest.fn()} />)
    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'empty' },
    })
    fireEvent.click(screen.getByText('Save'))
    await waitFor(() =>
      expect(Notice).toHaveBeenCalledWith(
        'Please enter a content for your template',
      ),
    )
    expect(mockCreateTemplate).not.toHaveBeenCalled()
  })

  it('loads and updates an existing template', async () => {
    mockFindById.mockResolvedValue({ name: 'existing', content: { nodes } })
    render(
      <TemplateFormComponentWrapper
        app={new App()}
        templateId="existing-id"
        onClose={jest.fn()}
      />,
    )
    await screen.findByText('Reusable prompt')
    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'renamed-template' },
    })
    fireEvent.click(screen.getByText('Save'))
    await waitFor(() =>
      expect(mockUpdateTemplate).toHaveBeenCalledWith('existing-id', {
        name: 'renamed-template',
        content: { nodes: expect.any(Array) },
      }),
    )
    expect(mockCreateTemplate).not.toHaveBeenCalled()
  })
})
