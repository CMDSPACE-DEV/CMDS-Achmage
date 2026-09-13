import {
  EagleClient,
  EagleTransport,
  flattenEagleFolders,
  normalizeLibraryPath,
} from './eagle-client'

function client(
  handler: (url: string, body?: Record<string, unknown>) => unknown,
): EagleClient {
  const transport: EagleTransport = async ({ url, body }) => ({
    status: 200,
    json: handler(url.replace('http://eagle', ''), body),
  })
  let clock = 0
  return new EagleClient(
    'http://eagle',
    transport,
    async (ms) => {
      clock += ms
    },
    () => clock,
  )
}

describe('EagleClient', () => {
  it('reports running only when the application answers success', async () => {
    expect(
      await client(() => ({ status: 'success', data: {} })).isRunning(),
    ).toBe(true)
    expect(await client(() => ({ status: 'error' })).isRunning()).toBe(false)
  })

  it('posts addFromPath with only the fields that are set', async () => {
    const calls: Record<string, unknown>[] = []
    const eagle = client((url, body) => {
      if (url === '/api/item/addFromPath' && body) calls.push(body)
      return { status: 'success', data: 'ID1' }
    })
    await expect(
      eagle.addFromPath({
        path: '/v/a.png',
        name: 'a',
        annotation: 'cat',
        tags: ['cmds-achmage'],
        folderId: 'F1',
      }),
    ).resolves.toBe('ID1')
    await eagle.addFromPath({ path: '/v/b.png', name: 'b', tags: [] })
    expect(calls).toEqual([
      {
        path: '/v/a.png',
        name: 'a',
        annotation: 'cat',
        tags: ['cmds-achmage'],
        folderId: 'F1',
      },
      { path: '/v/b.png', name: 'b' },
    ])
  })

  it('surfaces Eagle error messages from addFromPath', async () => {
    await expect(
      client(() => ({ status: 'error', message: 'bad path' })).addFromPath({
        path: '/x',
        name: 'x',
      }),
    ).rejects.toThrow('bad path')
  })

  it('polls item info until the item exists', async () => {
    let attempts = 0
    const eagle = client((url) => {
      if (!url.startsWith('/api/item/info')) return {}
      attempts += 1
      return attempts < 3
        ? { status: 'error' }
        : { status: 'success', data: { id: 'ID1', name: 'a', ext: 'png' } }
    })
    await expect(eagle.waitForItem('ID1')).resolves.toEqual({
      id: 'ID1',
      name: 'a',
      ext: 'png',
    })
    expect(attempts).toBe(3)
  })

  it('reads the active library from either response shape', async () => {
    await expect(
      client(() => ({
        status: 'success',
        data: { library: { path: '/x/Lib.library', name: 'Lib' } },
      })).getActiveLibrary(),
    ).resolves.toEqual({ path: '/x/Lib.library', name: 'Lib' })
    await expect(
      client(() => ({
        status: 'success',
        data: { library: '/x/Other.library' },
      })).getActiveLibrary(),
    ).resolves.toEqual({ path: '/x/Other.library', name: 'Other' })
  })

  it('lists history and flattened folders', async () => {
    const eagle = client((url) => {
      if (url === '/api/library/history') {
        return { status: 'success', data: ['/a.library', '/b.library'] }
      }
      if (url === '/api/folder/list') {
        return {
          status: 'success',
          data: [
            { id: '1', name: 'Inbox', children: [] },
            {
              id: '2',
              name: 'Projects',
              children: [{ id: '3', name: 'Jazz', children: [] }],
            },
          ],
        }
      }
      return {}
    })
    await expect(eagle.listLibraryHistory()).resolves.toEqual([
      '/a.library',
      '/b.library',
    ])
    await expect(eagle.listFolders()).resolves.toEqual([
      { id: '1', name: 'Inbox', path: 'Inbox', depth: 0 },
      { id: '2', name: 'Projects', path: 'Projects', depth: 0 },
      { id: '3', name: 'Jazz', path: 'Projects/Jazz', depth: 1 },
    ])
  })

  it('switches libraries by polling until the target reports open', async () => {
    let active = '/a.library'
    let pending: string | null = null
    let infoCalls = 0
    const eagle = client((url, body) => {
      if (url === '/api/library/switch') {
        pending = String(body?.libraryPath)
        return { status: 'success' }
      }
      if (url === '/api/library/info') {
        infoCalls += 1
        // 1st call: pre-switch check. 2nd: API down mid-switch. 3rd: still old. 4th: open.
        if (infoCalls === 2) throw new Error('ECONNREFUSED')
        if (infoCalls >= 4 && pending) active = pending
        return { status: 'success', data: { library: { path: active } } }
      }
      return {}
    })
    const result = await eagle.switchLibrary('/b.library')
    expect(result.success).toBe(true)
    expect(result.activePath).toBe('/b.library')
  })

  it('is a no-op when the target library is already open', async () => {
    let switches = 0
    const eagle = client((url) => {
      if (url === '/api/library/switch') switches += 1
      return { status: 'success', data: { library: { path: '/a.library/' } } }
    })
    await expect(eagle.switchLibrary('/a.library')).resolves.toMatchObject({
      success: true,
    })
    expect(switches).toBe(0)
  })

  it('normalizes library paths for comparison', () => {
    expect(normalizeLibraryPath('C:\\Libs\\A.library\\')).toBe(
      'C:/Libs/A.library',
    )
    expect(flattenEagleFolders([])).toEqual([])
  })
})
