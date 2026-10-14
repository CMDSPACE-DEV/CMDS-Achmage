/**
 * Device-local consent for running Claude Plan with a Team or Enterprise
 * organization login (R-049).
 *
 * Consent lives outside synced vault settings on purpose: it is about the
 * Claude Code account signed in on this computer. A vault synced to a second
 * machine that is signed in to a different organization must not inherit it.
 */
export type NativeRuntimeConsentReader = {
  allowsClaudeOrganizationPlans(): boolean
}

export type NativeRuntimeConsentStore = {
  setClaudeOrganizationPlans(allowed: boolean): void
} & NativeRuntimeConsentReader

// Bump the version when the consent text changes materially, so that earlier
// consent is no longer treated as acceptance of the new terms.
const CLAUDE_ORGANIZATION_PLAN_CONSENT_KEY =
  'cmds-achmage:native-runtime-consent:claude-organization-plan'
const CLAUDE_ORGANIZATION_PLAN_CONSENT_VERSION = 'v1'

export class LocalNativeRuntimeConsentStore
  implements NativeRuntimeConsentStore
{
  allowsClaudeOrganizationPlans(): boolean {
    try {
      return (
        localStorage.getItem(CLAUDE_ORGANIZATION_PLAN_CONSENT_KEY) ===
        CLAUDE_ORGANIZATION_PLAN_CONSENT_VERSION
      )
    } catch {
      return false
    }
  }

  setClaudeOrganizationPlans(allowed: boolean): void {
    try {
      if (allowed) {
        localStorage.setItem(
          CLAUDE_ORGANIZATION_PLAN_CONSENT_KEY,
          CLAUDE_ORGANIZATION_PLAN_CONSENT_VERSION,
        )
      } else {
        localStorage.removeItem(CLAUDE_ORGANIZATION_PLAN_CONSENT_KEY)
      }
    } catch {
      // Without storage the consent cannot persist; the guard stays closed.
    }
  }
}

export const sharedNativeRuntimeConsentStore: NativeRuntimeConsentStore =
  new LocalNativeRuntimeConsentStore()
