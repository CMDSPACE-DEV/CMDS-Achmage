import { App, FileSystemAdapter } from 'obsidian'

import { uploadWithCmdsEagle } from './CmdsEagleBridge'

jest.mock('obsidian', () => ({
  ...jest.requireActual<Record<string, unknown>>('obsidian'),
  FileSystemAdapter: class {},
}))

const vaultPath = 'images/한글 image.png'
const absolutePath = 'C:/vault/images/한글 image.png'
const publicUrl = 'https://images.example.test/generated.png'

function makeApp(runtime?: unknown, desktop = true): App {
  const adapter = desktop ? Object.create(FileSystemAdapter.prototype) : {}
  adapter.getFullPath = jest.fn().mockReturnValue(absolutePath)
  return {
    plugins: { plugins: runtime ? { 'cmds-eagle': runtime } : {} },
    vault: { adapter },
  } as unknown as App
}

function makeRuntime(version: string | undefined = '1.8.4') {
  const provider = {
    upload: jest.fn().mockResolvedValue({ success: true, publicUrl }),
  }
  const runtime = {
    manifest: { version },
    getActiveCloudProvider: jest.fn().mockReturnValue(provider),
  }
  return { runtime, provider }
}

describe('uploadWithCmdsEagle', () => {
  it.each(['1.7.0', '1.8.4', '2.0.0'])(
    'uses the compatible cloud API regardless of version (%s)',
    async (version) => {
      const { runtime, provider } = makeRuntime(version)
      const app = makeApp(runtime)

      await expect(
        uploadWithCmdsEagle(app, vaultPath, 'image/png'),
      ).resolves.toBe(publicUrl)
      expect(provider.upload).toHaveBeenCalledTimes(1)
      expect(provider.upload).toHaveBeenCalledWith(
        absolutePath,
        '한글 image.png',
        'image/png',
      )
      expect(runtime.getActiveCloudProvider.mock.contexts[0]).toBe(runtime)
      expect(provider.upload.mock.contexts[0]).toBe(provider)
    },
  )

  it('does not require version metadata when the cloud API is available', async () => {
    const { runtime } = makeRuntime()
    const app = makeApp({
      getActiveCloudProvider: runtime.getActiveCloudProvider,
    })
    await expect(
      uploadWithCmdsEagle(app, vaultPath, 'image/png'),
    ).resolves.toBe(publicUrl)
  })

  it('reports an absent or disabled plugin accurately', async () => {
    await expect(
      uploadWithCmdsEagle(makeApp(), vaultPath, 'image/png'),
    ).rejects.toThrow('CMDS Eagle is not installed or enabled.')
  })

  it.each([undefined, 'not callable'])(
    'distinguishes a missing cloud API from an absent plugin (%s)',
    async (getActiveCloudProvider) => {
      await expect(
        uploadWithCmdsEagle(
          makeApp({ manifest: { version: '1.8.4' }, getActiveCloudProvider }),
          vaultPath,
          'image/png',
        ),
      ).rejects.toThrow(
        'CMDS Eagle does not expose a compatible cloud upload API.',
      )
    },
  )

  it.each([null, { upload: 'not callable' }])(
    'rejects an unavailable cloud provider',
    async (provider) => {
      const { runtime } = makeRuntime()
      runtime.getActiveCloudProvider.mockReturnValue(provider)
      await expect(
        uploadWithCmdsEagle(makeApp(runtime), vaultPath, 'image/png'),
      ).rejects.toThrow('CMDS Eagle has no active cloud provider.')
    },
  )

  it('does not upload from a non-desktop adapter', async () => {
    const { runtime, provider } = makeRuntime()
    await expect(
      uploadWithCmdsEagle(makeApp(runtime, false), vaultPath, 'image/png'),
    ).rejects.toThrow('CMDS Eagle upload is available on desktop vaults only.')
    expect(provider.upload).not.toHaveBeenCalled()
  })

  it('preserves the cloud provider error', async () => {
    const { runtime, provider } = makeRuntime()
    provider.upload.mockResolvedValue({
      success: false,
      error: 'R2 not configured',
    })
    await expect(
      uploadWithCmdsEagle(makeApp(runtime), vaultPath, 'image/png'),
    ).rejects.toThrow('R2 not configured')
  })

  it('does not accept a success result without a public URL', async () => {
    const { runtime, provider } = makeRuntime()
    provider.upload.mockResolvedValue({ success: true })
    await expect(
      uploadWithCmdsEagle(makeApp(runtime), vaultPath, 'image/png'),
    ).rejects.toThrow('CMDS Eagle upload failed.')
  })
})
