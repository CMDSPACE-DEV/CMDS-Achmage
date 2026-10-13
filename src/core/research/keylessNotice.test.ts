import { describeKeylessMode, getKeylessState } from './keylessNotice'
import { getResearchSource } from './ResearchSourceRegistry'

describe('getKeylessState', () => {
  it('marks Korean Law without an OC as using the operator key', () => {
    const state = getKeylessState(
      getResearchSource('korean-law'),
      true,
      () => false,
    )

    expect(state).toEqual({
      sourceName: 'Korean Law',
      enabled: true,
      hasOptionalCredential: true,
      hasOwnCredential: false,
      usesSharedOperatorKey: true,
    })
  })

  it('treats OpenAlex as a provider keyless budget, not a shared key', () => {
    const state = getKeylessState(
      getResearchSource('openalex'),
      true,
      () => false,
    )

    expect(state.hasOptionalCredential).toBe(true)
    expect(state.usesSharedOperatorKey).toBe(false)
  })

  it('reports an own credential once every optional field is stored', () => {
    const state = getKeylessState(
      getResearchSource('openalex'),
      true,
      (fieldId) => fieldId === 'api-key',
    )

    expect(state.hasOwnCredential).toBe(true)
  })

  it('reports no optional credential for a source that requires its key', () => {
    const state = getKeylessState(getResearchSource('naver'), true, () => false)

    expect(state.hasOptionalCredential).toBe(false)
    expect(state.hasOwnCredential).toBe(false)
  })
})

describe('describeKeylessMode', () => {
  const base = {
    sourceName: 'Source',
    enabled: true,
    hasOptionalCredential: true,
    hasOwnCredential: false,
    usesSharedOperatorKey: false,
  }

  it('warns when a borrowed operator key is in use', () => {
    expect(
      describeKeylessMode({ ...base, usesSharedOperatorKey: true })?.tone,
    ).toBe('warning')
  })

  it('only informs when the provider keyless budget applies', () => {
    expect(describeKeylessMode(base)?.tone).toBe('info')
  })

  it.each([
    ['the source is disabled', { enabled: false }],
    ['the user stored a credential', { hasOwnCredential: true }],
    ['the source has no optional credential', { hasOptionalCredential: false }],
  ])('shows nothing when %s', (_label, patch) => {
    expect(describeKeylessMode({ ...base, ...patch })).toBeNull()
  })
})
