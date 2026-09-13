import { Notice } from 'obsidian'
import { useMemo, useState } from 'react'

import { useApp } from '../../../contexts/app-context'
import { useSettings } from '../../../contexts/settings-context'
import {
  isCmdsEagleInstalled,
  readCmdsEagleLibraryProfiles,
} from '../../../core/image/CmdsEagleBridge'
import {
  EagleClient,
  EagleFolderSummary,
  normalizeLibraryPath,
} from '../../../core/image/eagle-client'
import { libraryNameFromPath } from '../../../core/image/eagle-paths'
import {
  EAGLE_LINK_STYLES,
  EAGLE_LINK_STYLE_LABELS,
  EagleLinkStyle,
  EagleTarget,
  IMAGE_DESTINATIONS,
  IMAGE_DESTINATION_LABELS,
  ImageDestination,
} from '../../../core/image/image-destination'
import { ObsidianButton } from '../../common/ObsidianButton'
import { ObsidianDropdown } from '../../common/ObsidianDropdown'
import { ObsidianSetting } from '../../common/ObsidianSetting'
import { ObsidianTextInput } from '../../common/ObsidianTextInput'
import { ObsidianToggle } from '../../common/ObsidianToggle'

const ACTIVE_LIBRARY = ''

/**
 * Where generated images go and how the note links to them (R-034). Library
 * and folder lists come from Eagle's local API; CMDS Eagle's remembered
 * libraries are merged in when that plugin is installed.
 */
export function ImageDestinationSettings() {
  const app = useApp()
  const { settings, setSettings } = useSettings()
  const target = settings.imageGeneration.eagle
  const destination = settings.imageGeneration.destination
  const cmdsEagle = isCmdsEagleInstalled(app)

  const profiles = useMemo(() => readCmdsEagleLibraryProfiles(app), [app])
  const [history, setHistory] = useState<string[]>([])
  const [folders, setFolders] = useState<EagleFolderSummary[]>([])
  const [busy, setBusy] = useState(false)

  const saveTarget = async (next: Partial<EagleTarget>) => {
    await setSettings({
      ...settings,
      imageGeneration: {
        ...settings.imageGeneration,
        eagle: { ...target, ...next },
      },
    })
  }

  const libraryOptions = useMemo(() => {
    const options: Record<string, string> = {
      [ACTIVE_LIBRARY]: "Eagle's currently open library",
    }
    const seen = new Set<string>()
    for (const profile of profiles) {
      seen.add(normalizeLibraryPath(profile.path))
      options[profile.path] =
        `${profile.name || libraryNameFromPath(profile.path)}${
          profile.defaultFolderPath
            ? ` · default folder ${profile.defaultFolderPath}`
            : ''
        } (CMDS Eagle)`
    }
    for (const path of history) {
      if (seen.has(normalizeLibraryPath(path))) continue
      seen.add(normalizeLibraryPath(path))
      options[path] = libraryNameFromPath(path)
    }
    if (target.libraryPath && !(target.libraryPath in options)) {
      options[target.libraryPath] =
        `${libraryNameFromPath(target.libraryPath)} (saved)`
    }
    return options
  }, [profiles, history, target.libraryPath])

  const folderOptions = useMemo(() => {
    const options: Record<string, string> = {
      '': target.libraryPath
        ? 'Library root (or the CMDS Eagle profile default)'
        : 'Library root',
    }
    for (const folder of folders) {
      options[folder.id] = `${'  '.repeat(folder.depth)}${folder.path}`
    }
    if (target.folderId && !(target.folderId in options)) {
      options[target.folderId] =
        `${target.folderPath || target.folderId} (saved)`
    }
    return options
  }, [folders, target.folderId, target.folderPath, target.libraryPath])

  const refreshLibraries = async () => {
    setBusy(true)
    try {
      const client = new EagleClient(target.apiBaseUrl)
      if (!(await client.isRunning())) {
        new Notice('Eagle is not running or its API is unreachable.')
        return
      }
      setHistory(await client.listLibraryHistory())
    } finally {
      setBusy(false)
    }
  }

  /** Lists folders of the target library, switching Eagle there and back if needed. */
  const refreshFolders = async () => {
    setBusy(true)
    try {
      const client = new EagleClient(target.apiBaseUrl)
      if (!(await client.isRunning())) {
        new Notice('Eagle is not running or its API is unreachable.')
        return
      }
      const active = await client.getActiveLibrary()
      const wanted = target.libraryPath
        ? target.libraryPath
        : (active?.path ?? '')
      const mustSwitch =
        !!active &&
        !!wanted &&
        normalizeLibraryPath(active.path) !== normalizeLibraryPath(wanted)
      if (mustSwitch) {
        const switched = await client.switchLibrary(wanted)
        if (!switched.success) {
          new Notice(switched.error ?? 'Eagle library switch failed.')
          return
        }
      }
      try {
        setFolders(await client.listFolders())
      } finally {
        if (mustSwitch && active) await client.switchLibrary(active.path)
      }
    } finally {
      setBusy(false)
    }
  }

  const showEagle = destination === 'eagle' || destination === 'ask'

  return (
    <>
      <ObsidianSetting
        name="Image destination"
        desc={`Where a generated image goes after it is saved to the output folder. ${
          cmdsEagle
            ? 'CMDS Eagle is installed: its remembered libraries appear in the library list and its active cloud provider handles the cloud option.'
            : 'Install the CMDS Eagle plugin to reuse its library profiles and cloud upload.'
        }`}
      >
        <ObsidianDropdown
          value={destination}
          options={Object.fromEntries(
            IMAGE_DESTINATIONS.map((value) => [
              value,
              IMAGE_DESTINATION_LABELS[value],
            ]),
          )}
          onChange={async (value) => {
            await setSettings({
              ...settings,
              imageGeneration: {
                ...settings.imageGeneration,
                destination: value as ImageDestination,
              },
            })
          }}
        />
      </ObsidianSetting>

      {showEagle && (
        <>
          <ObsidianSetting
            name="Eagle API URL"
            desc="Eagle's local API. Eagle must be running for imports, library and folder lists."
          >
            <ObsidianTextInput
              value={target.apiBaseUrl}
              placeholder="http://localhost:41595"
              onChange={(value) =>
                void saveTarget({
                  apiBaseUrl: value.trim().replace(/\/+$/, ''),
                })
              }
            />
          </ObsidianSetting>

          <ObsidianSetting
            name="Eagle library"
            desc="Which library receives the image. Eagle opens one library at a time, so a different library is switched to for the import and switched back afterwards. Refresh lists the libraries Eagle has opened before."
          >
            <ObsidianButton
              text={busy ? 'Loading…' : 'Refresh'}
              disabled={busy}
              onClick={() => void refreshLibraries()}
            />
            <ObsidianDropdown
              value={target.libraryPath}
              options={libraryOptions}
              onChange={(value) =>
                void saveTarget({
                  libraryPath: value,
                  folderId: '',
                  folderPath: '',
                })
              }
            />
          </ObsidianSetting>

          <ObsidianSetting
            name="Eagle folder"
            desc="Folder inside the chosen library. Refresh reads the folder tree from Eagle (switching libraries if needed). Leave it on the root to use the CMDS Eagle profile default for that library."
          >
            <ObsidianButton
              text={busy ? 'Loading…' : 'Refresh'}
              disabled={busy}
              onClick={() => void refreshFolders()}
            />
            <ObsidianDropdown
              value={target.folderId}
              options={folderOptions}
              onChange={(value) =>
                void saveTarget({
                  folderId: value,
                  folderPath:
                    folders.find((folder) => folder.id === value)?.path ?? '',
                })
              }
            />
          </ObsidianSetting>

          <ObsidianSetting
            name="Note link style"
            desc="What the note receives once the image is in Eagle."
          >
            <ObsidianDropdown
              value={target.linkStyle}
              options={Object.fromEntries(
                EAGLE_LINK_STYLES.map((value) => [
                  value,
                  EAGLE_LINK_STYLE_LABELS[value],
                ]),
              )}
              onChange={(value) =>
                void saveTarget({ linkStyle: value as EagleLinkStyle })
              }
            />
          </ObsidianSetting>

          <ObsidianSetting
            name="Remove the vault copy after inserting an Eagle link"
            desc="Only applies to the file and deep-link styles. The vault embed style keeps the local file by definition."
          >
            <ObsidianToggle
              value={target.removeVaultCopy}
              onChange={(value) => void saveTarget({ removeVaultCopy: value })}
            />
          </ObsidianSetting>

          <ObsidianSetting
            name="Eagle tags"
            desc="Comma-separated tags added to every imported image. The generation prompt is stored as the item annotation."
          >
            <ObsidianTextInput
              value={target.tags}
              placeholder="cmds-achmage, illustration"
              onChange={(value) => void saveTarget({ tags: value })}
            />
          </ObsidianSetting>
        </>
      )}
    </>
  )
}
