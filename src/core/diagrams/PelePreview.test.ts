/** @jest-environment jsdom */
import { sanitizeHTMLToDom } from 'obsidian'
import { mount } from 'pele'

import { PelePreview } from './PelePreview'

jest.mock('obsidian', () => ({
  sanitizeHTMLToDom: jest.fn(() => document.createDocumentFragment()),
}))
jest.mock('pele', () => ({ mount: jest.fn() }))

describe('Pele preview lifecycle', () => {
  const destroy = jest.fn()
  const mountMock = jest.mocked(mount)
  beforeEach(() => {
    jest.clearAllMocks()
    mountMock.mockReturnValue({
      destroy,
      result: undefined,
      source: '',
      error: undefined,
      zoom: undefined,
      update: jest.fn(),
      refresh: jest.fn(),
    })
  })

  it('passes the host sanitizer and bounded, non-network rendering options', async () => {
    const host = document.createElement('div')
    const error = jest.fn()
    const preview = new PelePreview(host, error)
    await preview.show('flowchart LR\n A[한국어] --> B')
    expect(mountMock).toHaveBeenCalledWith(
      host,
      'flowchart LR\n A[한국어] --> B',
      expect.objectContaining({
        sanitize: sanitizeHTMLToDom,
        links: false,
        images: false,
        maxEdges: 500,
        zoom: { always: true, controls: true },
      }),
    )
    preview.destroy()
    expect(destroy).toHaveBeenCalledTimes(1)
    await preview.show('flowchart LR\n A --> C')
    expect(mountMock).toHaveBeenCalledTimes(1)
  })

  it('ignores superseded requests and requests closed during lazy loading', async () => {
    const preview = new PelePreview(document.createElement('div'), jest.fn())
    const old = preview.show('flowchart LR\n A --> B')
    const latest = preview.show('flowchart LR\n C --> D')
    await Promise.all([old, latest])
    expect(mountMock).toHaveBeenCalledTimes(1)
    expect(mountMock.mock.calls[0][1]).toContain('C --> D')
    const pending = preview.show('flowchart LR\n E --> F')
    preview.destroy()
    await pending
    expect(mountMock).toHaveBeenCalledTimes(1)
  })

  it('reports parse failures, clears replaced content, and rejects oversized input', async () => {
    const host = document.createElement('div')
    const error = jest.fn()
    const preview = new PelePreview(host, error)
    await preview.show('flowchart LR\n A --> B')
    host.append(document.createElement('svg'))
    await preview.show('x'.repeat(50_001))
    expect(host.childNodes).toHaveLength(0)
    expect(destroy).toHaveBeenCalledTimes(1)
    expect(error).toHaveBeenLastCalledWith(expect.stringContaining('50,000'))
    mountMock.mockImplementationOnce(() => {
      throw new Error('<script>invalid source</script>')
    })
    await preview.show('invalid')
    expect(error).toHaveBeenLastCalledWith('<script>invalid source</script>')
    expect(host.childNodes).toHaveLength(0)
    await preview.show('')
    expect(error).toHaveBeenLastCalledWith('')
  })
})
