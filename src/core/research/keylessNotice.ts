import type { ResearchSourceDefinition } from './ResearchSourceRegistry'

export type KeylessNoticeTone = 'info' | 'warning'

export type KeylessNotice = {
  tone: KeylessNoticeTone
  /** Short badge text shown on the collapsed card. */
  label: string
  /** One sentence shown as the badge tooltip and in the expanded card. */
  detail: string
}

export type KeylessState = {
  sourceName: string
  enabled: boolean
  /** The source has an optional credential the user could add (R-045). */
  hasOptionalCredential: boolean
  /** Every optional credential field has a value on this device. */
  hasOwnCredential: boolean
  /**
   * Without the user's credential, requests use a third party's key and quota
   * (Korean Law MCP). False means the provider's own keyless budget applies
   * (OpenAlex, PubMed).
   */
  usesSharedOperatorKey: boolean
}

export function getKeylessState(
  definition: ResearchSourceDefinition,
  enabled: boolean,
  hasSecret: (fieldId: string) => boolean,
): KeylessState {
  const optionalFields = definition.secretFields.filter(
    (field) => !field.required,
  )
  return {
    sourceName: definition.shortName,
    enabled,
    hasOptionalCredential: optionalFields.length > 0,
    hasOwnCredential:
      optionalFields.length > 0 &&
      optionalFields.every((field) => hasSecret(field.id)),
    usesSharedOperatorKey: Boolean(
      definition.thirdPartyOperator && definition.mcpPreset?.secretQueryParam,
    ),
  }
}

/**
 * Decide what a research card says when a source runs without the user's
 * own credential. Return null to show nothing.
 *
 * Only a borrowed third-party key warrants a warning: other users can exhaust
 * it. A provider's own keyless budget is informational.
 */
export function describeKeylessMode(state: KeylessState): KeylessNotice | null {
  if (!state.enabled || !state.hasOptionalCredential) return null
  if (state.hasOwnCredential) return null
  if (state.usesSharedOperatorKey) {
    return {
      tone: 'warning',
      label: 'Shared quota',
      detail: `${state.sourceName} is using the operator's shared key, which every keyless user draws on and which can return "retry later". Add your own credential to use your own quota.`,
    }
  }
  return {
    tone: 'info',
    label: 'Keyless',
    detail: `${state.sourceName} is using its free keyless allowance. A free API key raises the limit.`,
  }
}
