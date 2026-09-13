import { EagleClient, EagleTransport } from './eagle-client'
import {
  buildEagleMarkdown,
  buildEagleOriginalPath,
  libraryNameFromPath,
  pathToFileUrl,
} from './eagle-paths'
import { deliverToEagle } from './image-delivery'
import { DEFAULT_EAGLE_TARGET, parseEagleTags } from './image-destination'

function fakeEagle(options: { active: string; failSwitch?: boolean }) {
  let active = options.active
  const calls: { url: string; body?: Record<string, unknown> }[] = []
  const transport: EagleTransport = async ({ url, body }) => {
    const path = url.replace('http://eagle', '')
    calls.push({ url: path, body })
    if (path === '/api/application/info')
      return { status: 200, json: { status: 'success' } }
    if (path === '/api/library/info') {
      return {
        status: 200,
        json: {
          status: 'success',
          data: { library: { path: active, name: 'L' } },
        },
      }
    }
    if (path === '/api/library/switch') {
      if (!options.failSwitch) active = String(body?.libraryPath)
      return { status: 200, json: { status: 'success' } }
    }
    if (path === '/api/item/addFromPath')
      return { status: 200, json: { status: 'success', data: 'ITEM' } }
    if (path.startsWith('/api/item/info')) {
      return {
        status: 200,
        json: {
          status: 'success',
          data: { id: 'ITEM', name: 'cat', ext: 'png' },
        },
      }
    }
    return { status: 200, json: {} }
  }
  let clock = 0
  const client = new EagleClient(
    'http://eagle',
    transport,
    async (ms) => {
      clock += ms
    },
    () => clock,
  )
  return { client, calls, activePath: () => active }
}

describe('deliverToEagle', () => {
  it('imports into the open library and returns the vault embed by default', async () => {
    const eagle = fakeEagle({ active: '/a.library' })
    const result = await deliverToEagle(eagle.client, {
      absolutePath: '/vault/img/cat.png',
      name: 'cat',
      vaultEmbed: '![[img/cat.png]]',
      annotation: 'a cat',
      target: { ...DEFAULT_EAGLE_TARGET },
    })
    expect(result).toMatchObject({
      itemId: 'ITEM',
      libraryPath: '/a.library',
      markdown: '![[img/cat.png]]',
      deeplink: 'eagle://item/ITEM',
      switchedLibrary: false,
    })
    const add = eagle.calls.find((c) => c.url === '/api/item/addFromPath')
    expect(add?.body).toEqual({
      path: '/vault/img/cat.png',
      name: 'cat',
      annotation: 'a cat',
      tags: ['cmds-achmage'],
    })
    expect(eagle.calls.some((c) => c.url === '/api/library/switch')).toBe(false)
  })

  it('switches to the target library, uses the folder, and restores afterwards', async () => {
    const eagle = fakeEagle({ active: '/a.library' })
    const statuses: string[] = []
    const result = await deliverToEagle(
      eagle.client,
      {
        absolutePath: '/vault/img/cat.png',
        name: 'cat',
        vaultEmbed: '![[img/cat.png]]',
        target: {
          ...DEFAULT_EAGLE_TARGET,
          libraryPath: '/b.library',
          folderId: 'F9',
          linkStyle: 'original-file',
        },
      },
      { onStatus: (m) => statuses.push(m) },
    )
    expect(result.switchedLibrary).toBe(true)
    expect(result.libraryPath).toBe('/b.library')
    expect(result.markdown).toBe(
      '[![cat](file:///b.library/images/ITEM.info/cat.png)](eagle://item/ITEM)',
    )
    const add = eagle.calls.find((c) => c.url === '/api/item/addFromPath')
    expect(add?.body?.folderId).toBe('F9')
    const switches = eagle.calls
      .filter((c) => c.url === '/api/library/switch')
      .map((c) => c.body?.libraryPath)
    expect(switches).toEqual(['/b.library', '/a.library'])
    expect(eagle.activePath()).toBe('/a.library')
    expect(statuses[0]).toContain('Switching Eagle')
  })

  it('falls back to the profile folder when no folder is configured', async () => {
    const eagle = fakeEagle({ active: '/a.library' })
    await deliverToEagle(eagle.client, {
      absolutePath: '/v/x.png',
      name: 'x',
      vaultEmbed: '![[x.png]]',
      target: { ...DEFAULT_EAGLE_TARGET, tags: '' },
      fallbackFolderId: 'PROFILE',
    })
    const add = eagle.calls.find((c) => c.url === '/api/item/addFromPath')
    expect(add?.body).toEqual({
      path: '/v/x.png',
      name: 'x',
      folderId: 'PROFILE',
    })
  })

  it('throws when the library switch never completes', async () => {
    const eagle = fakeEagle({ active: '/a.library', failSwitch: true })
    await expect(
      deliverToEagle(eagle.client, {
        absolutePath: '/v/x.png',
        name: 'x',
        vaultEmbed: '![[x.png]]',
        target: { ...DEFAULT_EAGLE_TARGET, libraryPath: '/b.library' },
      }),
    ).rejects.toThrow('did not open')
  })
})

describe('eagle paths', () => {
  it('builds original paths, file urls, names, and link styles', () => {
    const item = { id: 'ID', name: 'a [b]', ext: 'png' }
    expect(buildEagleOriginalPath('/L.library/', item)).toBe(
      '/L.library/images/ID.info/a [b].png',
    )
    expect(pathToFileUrl('/Users/x/My Lib.library/a.png')).toBe(
      'file:///Users/x/My%20Lib.library/a.png',
    )
    expect(libraryNameFromPath('/x/CMDS Design Library.library')).toBe(
      'CMDS Design Library',
    )
    expect(
      buildEagleMarkdown({
        style: 'deeplink',
        item,
        originalPath: '/p',
        vaultEmbed: '![[v]]',
      }),
    ).toBe('[a  b  (Eagle)](eagle://item/ID)')
    expect(parseEagleTags(' a, b ,, ')).toEqual(['a', 'b'])
  })
})
