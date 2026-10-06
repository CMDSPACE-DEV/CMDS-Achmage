import type {
  NativeRuntimeProvider,
  NativeRuntimeSnapshot,
  RuntimeAuthDecisionCode,
} from '../../core/llm/native/nativeRuntime.types'

/**
 * Shared reading of a policy-blocked runtime snapshot for the Plan card and
 * the install and login modals, so their wording cannot drift apart again.
 */

// Codes that are only produced after `claude auth status` parsed a signed-in
// account. Environment and managed-setting blocks do not confirm a login.
const AUTHENTICATED_CLAUDE_BLOCK_CODES = new Set<RuntimeAuthDecisionCode>([
  'billing-marker',
  'subscription-unknown',
  'organization-opt-in-required',
])

// Decisions built without a code (older fixtures and callers) are recognized
// by their evidence strings.
const AUTHENTICATED_CLAUDE_BLOCK_EVIDENCE = new Set([
  'auth metadata contains a non-subscription billing marker',
  'subscription provenance is incomplete or unknown',
])

export const CLAUDE_ORGANIZATION_CONSENT_TITLE = 'Team/Enterprise 계정 허용'

export const CLAUDE_ORGANIZATION_CONSENT_MESSAGE = [
  '이 컴퓨터의 Claude Code가 Team 또는 Enterprise 조직 계정으로 로그인되어 있습니다. 허용하면 CMDS Achmage가 이 계정으로 Claude Plan 요청을 보냅니다.',
  '',
  '허용하기 전에 확인하세요.',
  '• 조직 관리자가 적용한 Claude Code 설정(hooks, 환경 변수, 권한, 텔레메트리, MCP 서버 등)이 이 플러그인의 요청에도 적용될 수 있습니다. CMDS Achmage는 그 내용을 읽을 수 없습니다.',
  '• 사용량은 조직 좌석과 조직의 추가 사용량 정책을 따릅니다. 예를 들어 Team Standard 좌석에서는 Fable 모델이 사용량 크레딧으로만 동작합니다.',
  '• 조직의 데이터 보존·감사 정책이 요청에 담긴 vault 내용에도 적용될 수 있습니다.',
  '• Claude Plan 연결은 개인 사용을 위한 실험 기능이며 Anthropic의 공식 연동이 아닙니다.',
  '',
  'API 키·게이트웨이·클라우드 과금 경로가 감지되면 허용 여부와 관계없이 계속 차단합니다. 이 설정은 동기화되는 vault 설정이 아니라 이 컴퓨터에만 저장되며, Plan 연결에서 언제든 해제할 수 있습니다.',
].join('\n')

export function isClaudeOrganizationOptInRequired(
  snapshot: NativeRuntimeSnapshot,
): boolean {
  return (
    snapshot.provider === 'claude' &&
    snapshot.status === 'billing-blocked' &&
    snapshot.authDecision?.code === 'organization-opt-in-required'
  )
}

export function isClaudeOrganizationSubscription(
  snapshot: NativeRuntimeSnapshot,
): boolean {
  return (
    snapshot.provider === 'claude' &&
    snapshot.status === 'ready' &&
    snapshot.authDecision?.code === 'organization-subscription'
  )
}

export function hasAuthenticatedPolicyBlock(
  snapshot: NativeRuntimeSnapshot,
): boolean {
  if (
    snapshot.status !== 'billing-blocked' &&
    snapshot.status !== 'quota-unverified'
  ) {
    return false
  }
  const decision = snapshot.authDecision
  const evidence = decision?.evidence ?? []
  if (snapshot.provider === 'gemini') {
    return snapshot.catalog === 'ready' && evidence.length > 0
  }
  if (decision?.code) return AUTHENTICATED_CLAUDE_BLOCK_CODES.has(decision.code)
  return evidence.some((item) => AUTHENTICATED_CLAUDE_BLOCK_EVIDENCE.has(item))
}

export function policyBlockMessage(
  provider: NativeRuntimeProvider,
  snapshot: NativeRuntimeSnapshot,
): string {
  if (isClaudeOrganizationOptInRequired(snapshot)) {
    return "Claude Team/Enterprise 계정 로그인은 확인했습니다. 조직 관리자가 적용한 Claude Code 설정이 이 요청에도 적용될 수 있어, 이 컴퓨터에서 직접 허용하기 전에는 요청을 보내지 않습니다. Plan 연결의 'Team/Enterprise 계정 허용'에서 사용을 허용할 수 있습니다."
  }
  const detail = snapshot.error ?? snapshot.warning
  const loginState = hasAuthenticatedPolicyBlock(snapshot)
    ? `${provider === 'claude' ? 'Claude' : 'Antigravity'} 로그인은 확인했습니다. `
    : ''
  const boundary =
    snapshot.status === 'quota-unverified'
      ? '개인 Plan 할당량 출처를 확인할 수 없어 요청을 차단했습니다.'
      : 'API, Cloud 또는 다른 과금 정책이 우선할 수 있어 요청을 차단했습니다.'
  return `${loginState}${boundary}${detail ? ` ${detail}` : ''} 재로그인만으로 해제되는 상태가 아닙니다. 표시된 과금 경로나 환경 설정을 먼저 확인하세요.`
}
