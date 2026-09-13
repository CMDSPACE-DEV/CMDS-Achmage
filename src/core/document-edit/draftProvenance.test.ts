import { stampDraftProvenance } from './draftProvenance'

const at = new Date('2026-09-12T03:04:05.000Z')

describe('stampDraftProvenance', () => {
  it('adds namespaced keys to existing frontmatter without touching other keys', () => {
    const out = stampDraftProvenance(
      '---\nauthor: "[[Someone]]"\ndate created: 2024-01-01\n---\nBody\n',
      { sourcePath: 'notes/Origin.md', modelId: 'm1', generatedAt: at },
    )
    expect(out).toBe(
      '---\nauthor: "[[Someone]]"\ndate created: 2024-01-01\nachmage-source: "[[Origin]]"\nachmage-generated: 2026-09-12T03:04:05.000Z\nachmage-model: "m1"\n---\nBody\n',
    )
  })

  it('creates a frontmatter block when the draft has none', () => {
    const out = stampDraftProvenance('Body', {
      sourcePath: 'Origin.md',
      generatedAt: at,
    })
    expect(out).toBe(
      '---\nachmage-source: "[[Origin]]"\nachmage-generated: 2026-09-12T03:04:05.000Z\n---\nBody',
    )
  })

  it('replaces stale achmage keys instead of duplicating them', () => {
    const once = stampDraftProvenance('---\ntitle: x\n---\nB', {
      sourcePath: 'A.md',
      generatedAt: at,
    })
    const twice = stampDraftProvenance(once, {
      sourcePath: 'A.md',
      generatedAt: at,
    })
    expect(twice).toBe(once)
    expect(twice.match(/achmage-source/g)).toHaveLength(1)
  })
})
