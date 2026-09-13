import { migrateFrom30To31 } from './30_to_31'

describe('migrateFrom30To31', () => {
  it('moves the pre-rebrand defaults and leaves user values alone', () => {
    expect(
      migrateFrom30To31({
        version: 30,
        documentEditing: {
          destinationFolder: 'Smart Composer/Document Drafts',
        },
        imageGeneration: { outputFolder: 'Smart Composer/Generated Images' },
      }),
    ).toEqual({
      version: 31,
      documentEditing: { destinationFolder: 'CMDS Achmage/Document Drafts' },
      imageGeneration: { outputFolder: '' },
    })
    expect(
      migrateFrom30To31({
        version: 30,
        documentEditing: { destinationFolder: 'My/Drafts' },
        imageGeneration: { outputFolder: 'My/Images' },
      }),
    ).toEqual({
      version: 31,
      documentEditing: { destinationFolder: 'My/Drafts' },
      imageGeneration: { outputFolder: 'My/Images' },
    })
  })

  it('tolerates missing sections', () => {
    expect(migrateFrom30To31({ version: 30 })).toEqual({
      version: 31,
      documentEditing: undefined,
      imageGeneration: undefined,
    })
  })
})
