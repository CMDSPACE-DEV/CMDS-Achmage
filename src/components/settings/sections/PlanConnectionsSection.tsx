import {
  Building2,
  Check,
  CircleAlert,
  CircleMinus,
  Download,
  LogIn,
  RefreshCw,
  ShieldAlert,
  Terminal,
  Wrench,
} from 'lucide-react'
import { App, Notice, Platform } from 'obsidian'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { PROVIDER_TYPES_INFO } from '../../../constants'
import { useSettings } from '../../../contexts/settings-context'
import type {
  NativeRuntimeProvider,
  NativeRuntimeSnapshot,
  NativeRuntimeStatus,
} from '../../../core/llm/native/nativeRuntime.types'
import { NativeRuntimeService } from '../../../core/llm/native/NativeRuntimeService'
import type SmartComposerPlugin from '../../../main'
import type { ChatModel } from '../../../types/chat-model.types'
import type { LLMProvider } from '../../../types/provider.types'
import { ConfirmModal } from '../../modals/ConfirmModal'
import { ConnectOpenAIPlanModal } from '../modals/ConnectOpenAIPlanModal'
import { NativeRuntimeInstallModal } from '../modals/NativeRuntimeInstallModal'
import { NativeRuntimeLoginModal } from '../modals/NativeRuntimeLoginModal'
import { NativeRuntimeUpdateModal } from '../modals/NativeRuntimeUpdateModal'
import {
  CLAUDE_ORGANIZATION_CONSENT_MESSAGE,
  CLAUDE_ORGANIZATION_CONSENT_TITLE,
  hasAuthenticatedPolicyBlock,
  isClaudeOrganizationOptInRequired,
  isClaudeOrganizationSubscription,
} from '../nativeRuntimePolicy'

type PlanConnectionsSectionProps = {
  app: App
  plugin: SmartComposerPlugin
}

const OPENAI_PLAN_PROVIDER_ID = PROVIDER_TYPES_INFO['openai-plan']
  .defaultProviderId as string
const CLAUDE_INSTALL_URL = 'https://code.claude.com/docs/en/installation'

export function PlanConnectionsSection({
  app,
  plugin,
}: PlanConnectionsSectionProps) {
  const { settings } = useSettings()
  const runtimeService = useMemo(() => new NativeRuntimeService(), [])
  const settingsUpdateQueue = useRef<Promise<void>>(Promise.resolve())

  const openAIPlanProvider = settings.providers.find(
    (provider): provider is Extract<LLMProvider, { type: 'openai-plan' }> =>
      provider.id === OPENAI_PLAN_PROVIDER_ID &&
      provider.type === 'openai-plan',
  )
  const isOpenAIConnected = !!openAIPlanProvider?.oauth?.accessToken
  const [isSyncingOpenAIModels, setIsSyncingOpenAIModels] = useState(false)

  const refreshOpenAIModels = async () => {
    setIsSyncingOpenAIModels(true)
    try {
      // Lazy: the sync pulls in every provider SDK through the LLM manager.
      const { syncOpenAIPlanModels } = await import(
        '../../../core/llm/planModelSync'
      )
      const result = await syncOpenAIPlanModels({
        getSettings: () => plugin.settings,
        setSettings: (next) => plugin.setSettings(next),
      })
      if (result.status !== 'synced') {
        new Notice('OpenAI Plan이 연결되어 있지 않습니다.')
      } else if (result.added.length > 0) {
        new Notice(
          `새 모델 ${result.added.length}개 추가: ${result.added.map((model) => model.model).join(', ')}`,
        )
      } else {
        new Notice(
          `이미 최신입니다. 이 계정에서 쓸 수 있는 모델: ${result.available.join(', ')}`,
        )
      }
    } catch (error) {
      new Notice(
        `OpenAI Plan 모델 목록을 가져오지 못했습니다. ${error instanceof Error ? error.message : ''}`.trim(),
      )
    } finally {
      setIsSyncingOpenAIModels(false)
    }
  }

  const disconnectOpenAI = () => {
    new ConfirmModal(app, {
      title: 'Disconnect subscription',
      message: 'Disconnect OpenAI from CMDS Achmage?',
      ctaText: 'Disconnect',
      onConfirm: () => {
        const currentSettings = plugin.settings
        void plugin.setSettings({
          ...currentSettings,
          providers: currentSettings.providers.map((provider) => {
            if (
              provider.id !== OPENAI_PLAN_PROVIDER_ID ||
              provider.type !== 'openai-plan'
            ) {
              return provider
            }
            return { ...provider, oauth: undefined }
          }),
        })
      },
    }).open()
  }

  const applyDiagnostics = useCallback(
    (snapshot: NativeRuntimeSnapshot): Promise<void> => {
      settingsUpdateQueue.current = settingsUpdateQueue.current
        .catch(() => undefined)
        .then(async () => {
          if (snapshot.status !== 'ready') return
          const currentSettings = plugin.settings
          const nextModels = syncRuntimeModels(
            currentSettings.chatModels,
            snapshot,
          )
          if (nextModels === currentSettings.chatModels) return
          await plugin.setSettings({
            ...currentSettings,
            chatModels: nextModels,
          })
        })
      return settingsUpdateQueue.current
    },
    [plugin],
  )

  useEffect(() => {
    let mounted = true
    const diagnose = async (provider: NativeRuntimeProvider) => {
      const snapshot = await runtimeService.diagnose(provider)
      if (mounted) await applyDiagnostics(snapshot)
    }

    void Promise.allSettled([diagnose('claude'), diagnose('gemini')])
    return () => {
      mounted = false
    }
  }, [applyDiagnostics, runtimeService])

  return (
    <div className="smtcmp-settings-section">
      <div className="smtcmp-settings-desc">
        Claude와 Gemini 연결은 이 컴퓨터에 설치된 공식 CLI에 인증을 위임합니다.
        CMDS Achmage는 로그인 토큰을 저장하지 않으며, vault 접근은 Smart
        Composer가 검토한 도구로만 제한됩니다.
        <div className="smtcmp-settings-desc-warning">
          Claude Plan은 개인용 실험 기능입니다. Anthropic은 타사 제품에 API key
          인증 사용을 안내하며, 소비자 Plan 자격 증명 중계를 허용하지 않습니다.{' '}
          <a
            href="https://code.claude.com/docs/en/legal-and-compliance"
            target="_blank"
            rel="noopener noreferrer"
          >
            현재 정책 확인
          </a>
        </div>
        {!Platform.isDesktop && (
          <div className="smtcmp-settings-desc-warning">
            Plan runtime은 데스크톱에서만 사용할 수 있습니다. 기존 대화는
            모바일에서도 읽을 수 있습니다.
          </div>
        )}
      </div>

      <div className="smtcmp-plan-connection-grid">
        <NativeRuntimeCard
          app={app}
          provider="claude"
          title="Claude Plan"
          description="설치된 공식 Claude Code CLI를 직접 사용합니다. 모델은 Opus·Sonnet·Haiku·Fable 최신 alias나 Opus 5.5·Sonnet 5.5·Fable 5.1 고정 버전 중에서 고릅니다."
          service={runtimeService}
          onDiagnostics={applyDiagnostics}
          experimental
        />

        <div className="smtcmp-plan-connection-card">
          <div className="smtcmp-plan-connection-card-header">
            <div className="smtcmp-plan-connection-card-title">OpenAI Plan</div>
            <PlanConnectionStatusBadge
              status={isOpenAIConnected ? 'ready' : 'login-required'}
              connectedLabel="Connected"
              disconnectedLabel="Disconnected"
            />
          </div>

          <div className="smtcmp-plan-connection-card-desc">
            ChatGPT Plan의 Codex를 사용합니다. 기존 연결과 GPT Plan 이미지
            workflow는 변경되지 않습니다. 새 모델은 Obsidian을 시작할 때 이
            계정의 Codex 모델 목록에서 자동으로 추가됩니다.
            <br />
            <a
              href="https://chatgpt.com/codex/settings/usage"
              target="_blank"
              rel="noopener noreferrer"
            >
              Codex 사용량과 한도 확인
            </a>
          </div>

          <div className="smtcmp-plan-connection-card-actions">
            {!isOpenAIConnected ? (
              <button
                className="mod-cta"
                onClick={() => new ConnectOpenAIPlanModal(app, plugin).open()}
              >
                <LogIn size={15} />
                Connect
              </button>
            ) : (
              <>
                <button
                  disabled={isSyncingOpenAIModels}
                  onClick={() => void refreshOpenAIModels()}
                >
                  <RefreshCw
                    size={15}
                    className={
                      isSyncingOpenAIModels ? 'smtcmp-icon-spin' : undefined
                    }
                  />
                  모델 목록 새로 고침
                </button>
                <button onClick={disconnectOpenAI}>Disconnect</button>
              </>
            )}
          </div>
        </div>

        <NativeRuntimeCard
          app={app}
          provider="gemini"
          title="Gemini Plan"
          description="설치된 공식 Antigravity CLI를 사용합니다. 로그인과 모델 목록을 확인하며, 명시적인 API 키·Google Cloud 환경이 감지되면 요청을 차단합니다."
          service={runtimeService}
          onDiagnostics={applyDiagnostics}
          experimental
        />
      </div>
    </div>
  )
}

export function NativeRuntimeCard({
  app,
  provider,
  title,
  description,
  service,
  onDiagnostics,
  experimental = false,
}: {
  app: App
  provider: NativeRuntimeProvider
  title: string
  description: string
  service: NativeRuntimeService
  onDiagnostics: (snapshot: NativeRuntimeSnapshot) => void | Promise<void>
  experimental?: boolean
}) {
  const snapshot = useNativeRuntimeSnapshot(service, provider)
  const [customPath, setCustomPath] = useState(() =>
    service.getCustomPath(provider),
  )
  const [allowsOrganizationPlans, setAllowsOrganizationPlans] = useState(
    () => provider === 'claude' && service.allowsClaudeOrganizationPlans(),
  )
  const isDiagnosing = snapshot.phase === 'checking'
  const isInstalled = snapshot.installation === 'installed'
  const isAuthenticatedButBlocked = hasAuthenticatedPolicyBlock(snapshot)
  const needsOrganizationOptIn = isClaudeOrganizationOptInRequired(snapshot)

  const diagnose = async () => {
    if (isDiagnosing) return
    try {
      const result = await service.diagnose(provider)
      await onDiagnostics(result)
      new Notice(runtimeNotice(title, result))
    } catch (error) {
      new Notice(`${title} 진단 실패: ${toErrorMessage(error)}`)
    }
  }

  const allowOrganizationPlans = () => {
    new ConfirmModal(app, {
      title: CLAUDE_ORGANIZATION_CONSENT_TITLE,
      message: CLAUDE_ORGANIZATION_CONSENT_MESSAGE,
      ctaText: '이 컴퓨터에서 허용',
      onConfirm: () => {
        service.setClaudeOrganizationPlans(true)
        setAllowsOrganizationPlans(true)
        void diagnose()
      },
    }).open()
  }

  const revokeOrganizationPlans = () => {
    service.setClaudeOrganizationPlans(false)
    setAllowsOrganizationPlans(false)
    new Notice('Team/Enterprise 계정 허용을 해제했습니다.')
    void diagnose()
  }

  const openInstallWizard = () => {
    new NativeRuntimeInstallModal(app, {
      provider,
      title,
      service,
      onDiagnostics,
    }).open()
  }

  const openUpdateGuide = () => {
    const updateDecision = service.getUpdateDecision(provider)
    if (provider === 'gemini') {
      new NativeRuntimeUpdateModal(app, {
        service,
        onDiagnostics,
      }).open()
      return
    }

    if (!updateDecision.command) {
      new ConfirmModal(app, {
        title: 'Claude Code 업데이트 방법 확인',
        message: `${updateDecision.reason}\n\n${claudeUpdateHelp(snapshot)}\n\nCMDS Achmage는 설치 방법이 불명확할 때 임의의 updater를 실행하지 않습니다.`,
        ctaText: '공식 문서 열기',
        onConfirm: () => openExternal(CLAUDE_INSTALL_URL),
      }).open()
      return
    }

    new ConfirmModal(app, {
      title: 'Claude Code 업데이트',
      message: `${updateDecision.command} 명령을 실행하는 보이는 터미널을 엽니다. 완료 후 이 화면에서 다시 진단하세요.`,
      ctaText: '업데이트 터미널 열기',
      onConfirm: () => service.openUpdateTerminal(provider),
    }).open()
  }

  const openLogin = () => {
    new NativeRuntimeLoginModal(app, {
      provider,
      title,
      service,
      onDiagnostics,
    }).open()
  }

  const saveCustomPath = async () => {
    service.setCustomPath(provider, customPath)
    new Notice(
      customPath.trim()
        ? `${title} 실행 파일 경로를 이 컴퓨터에 저장했습니다.`
        : `${title} 실행 파일 경로 override를 지웠습니다.`,
    )
    await diagnose()
  }

  return (
    <div
      className="smtcmp-plan-connection-card"
      data-runtime-provider={provider}
      aria-busy={isDiagnosing}
    >
      <div className="smtcmp-plan-connection-card-header">
        <div className="smtcmp-plan-connection-card-title">
          {title}
          {experimental && (
            <span className="smtcmp-plan-runtime-experimental">
              Experimental
            </span>
          )}
        </div>
        <PlanConnectionStatusBadge
          status={snapshot.status}
          authenticatedButBlocked={isAuthenticatedButBlocked}
          organizationOptInRequired={needsOrganizationOptIn}
        />
      </div>

      <div className="smtcmp-plan-connection-card-desc">{description}</div>

      <div className="smtcmp-plan-runtime-meta" aria-live="polite">
        {snapshot.version && <span>Version {snapshot.version}</span>}
        {snapshot.models.length > 0 && (
          <span>{snapshot.models.length} models detected</span>
        )}
        {snapshot.discovery?.candidates.length ? (
          <span>
            {snapshot.discovery.candidates.length} installations found
          </span>
        ) : null}
      </div>

      {snapshot.error && !needsOrganizationOptIn && (
        <div
          className="smtcmp-plan-runtime-error"
          role="alert"
          title={snapshot.error}
        >
          {(snapshot.status === 'billing-blocked' ||
            snapshot.status === 'quota-unverified') && (
            <strong>
              {isAuthenticatedButBlocked
                ? '로그인 확인됨 · 요청 차단: '
                : '요청 차단: '}
            </strong>
          )}
          {snapshot.error}
        </div>
      )}

      {needsOrganizationOptIn && (
        <div
          className="smtcmp-plan-runtime-organization"
          role="status"
          data-runtime-notice="organization-opt-in"
        >
          <Building2 size={16} aria-hidden="true" />
          <div>
            <strong>Team/Enterprise 계정 · 허용 필요</strong>
            <span>
              조직 관리자가 적용한 Claude Code 설정이 이 플러그인의 요청에도
              적용될 수 있어, 이 컴퓨터에서 허용하기 전에는 요청을 보내지
              않습니다.
            </span>
            <button
              className="mod-cta"
              data-runtime-action="allow-organization"
              disabled={isDiagnosing || !Platform.isDesktop}
              onClick={allowOrganizationPlans}
            >
              Team/Enterprise 계정 허용…
            </button>
          </div>
        </div>
      )}

      {provider === 'claude' && allowsOrganizationPlans && (
        <div
          className="smtcmp-plan-runtime-organization is-allowed"
          role="status"
          data-runtime-notice="organization-allowed"
        >
          <Building2 size={16} aria-hidden="true" />
          <div>
            <strong>
              {isClaudeOrganizationSubscription(snapshot)
                ? 'Team/Enterprise 계정으로 연결됨'
                : 'Team/Enterprise 계정 허용됨'}
            </strong>
            <span>
              이 컴퓨터에서만 허용되어 있습니다. 조직이 관리하는 Claude Code
              설정이 요청에 적용될 수 있습니다.
            </span>
            <button
              data-runtime-action="revoke-organization"
              disabled={isDiagnosing}
              onClick={revokeOrganizationPlans}
            >
              허용 해제
            </button>
          </div>
        </div>
      )}

      {provider === 'gemini' && snapshot.status === 'ready' && (
        <div className="smtcmp-plan-runtime-success" role="status">
          <Check size={16} aria-hidden="true" />
          <div>
            <strong>연결 완료 · Gemini 사용 가능</strong>
            <span>
              Antigravity 로그인과 사용 가능한 모델 목록을 확인했습니다.
            </span>
            <small>
              할당량 유형은 Antigravity에서 관리하며 현재 CMDS Achmage에는
              표시되지 않습니다.
            </small>
          </div>
        </div>
      )}

      {snapshot.warning && snapshot.status !== 'ready' && (
        <div
          className="smtcmp-plan-runtime-warning"
          role="status"
          title={snapshot.warning}
        >
          {snapshot.warning}
        </div>
      )}

      {snapshot.models.length > 0 && (
        <details className="smtcmp-plan-runtime-models">
          <summary>Runtime model catalog</summary>
          <div className="smtcmp-plan-runtime-model-list">
            {snapshot.models.map((model) => (
              <div key={model.id}>
                <code>{model.id}</code>
                <span>{model.label}</span>
                {model.description && <small>{model.description}</small>}
              </div>
            ))}
          </div>
        </details>
      )}

      <div className="smtcmp-plan-connection-card-actions">
        <button
          className={snapshot.status === 'ready' ? undefined : 'mod-cta'}
          disabled={isDiagnosing || !Platform.isDesktop}
          onClick={() => void diagnose()}
        >
          <RefreshCw
            size={15}
            className={isDiagnosing ? 'smtcmp-icon-spin' : undefined}
          />
          {isDiagnosing ? 'Checking' : 'Diagnose'}
        </button>

        {snapshot.status === 'not-installed' && (
          <button
            data-runtime-action="install"
            disabled={!Platform.isDesktop}
            onClick={openInstallWizard}
          >
            <Download size={15} />
            설치 안내
          </button>
        )}

        {isInstalled && (
          <button disabled={!Platform.isDesktop} onClick={openLogin}>
            <Terminal size={15} />
            {snapshot.status === 'login-required' ? 'Sign in' : '로그인 관리'}
          </button>
        )}

        {isInstalled && (
          <button
            data-runtime-action="update"
            disabled={!Platform.isDesktop}
            onClick={openUpdateGuide}
          >
            <Wrench size={15} />
            {provider === 'gemini'
              ? '자동 업데이트 확인'
              : !isSafeClaudeUpdate(snapshot.update)
                ? '업데이트 안내'
                : 'Update'}
          </button>
        )}
      </div>

      <details className="smtcmp-plan-runtime-advanced">
        <summary>Advanced executable path</summary>
        <div className="smtcmp-plan-runtime-path-row">
          <input
            type="text"
            value={customPath}
            aria-label={`${title} 실행 파일 경로`}
            placeholder={
              provider === 'claude'
                ? 'Path to claude executable'
                : 'Path to agy executable'
            }
            onChange={(event) => setCustomPath(event.currentTarget.value)}
          />
          <button onClick={() => void saveCustomPath()}>Apply</button>
        </div>
        {snapshot.executablePath && (
          <div className="smtcmp-plan-runtime-detected-path">
            Detected: <code>{snapshot.executablePath}</code>
          </div>
        )}
        {snapshot.discovery?.ambiguous && (
          <div className="smtcmp-plan-runtime-warning" role="status">
            실행 파일이 여러 개 발견되었습니다. 채팅에 사용할 경로를 직접
            지정하기 전에는 updater를 자동 실행하지 않습니다.
          </div>
        )}
        <div className="smtcmp-plan-runtime-path-help">
          이 override는 동기화되는 vault 설정 밖에서 이 컴퓨터에만 저장됩니다.
        </div>
      </details>
    </div>
  )
}

function useNativeRuntimeSnapshot(
  service: NativeRuntimeService,
  provider: NativeRuntimeProvider,
): NativeRuntimeSnapshot {
  const [snapshot, setSnapshot] = useState(() => service.getSnapshot(provider))
  useEffect(() => service.subscribe(provider, setSnapshot), [provider, service])
  return snapshot
}

function PlanConnectionStatusBadge({
  status,
  connectedLabel,
  disconnectedLabel,
  authenticatedButBlocked = false,
  organizationOptInRequired = false,
}: {
  status: NativeRuntimeStatus
  connectedLabel?: string
  disconnectedLabel?: string
  authenticatedButBlocked?: boolean
  organizationOptInRequired?: boolean
}) {
  const config = organizationOptInRequired
    ? {
        icon: <Building2 size={14} />,
        label: '조직 계정 · 허용 필요',
        statusClass: 'smtcmp-mcp-server-status-badge--warning',
      }
    : statusConfig(
        status,
        connectedLabel,
        disconnectedLabel,
        authenticatedButBlocked,
      )

  return (
    <div
      className={`smtcmp-mcp-server-status-badge ${config.statusClass}`}
      role="status"
      aria-live="polite"
    >
      {config.icon}
      <div className="smtcmp-mcp-server-status-badge-label">{config.label}</div>
    </div>
  )
}

function statusConfig(
  status: NativeRuntimeStatus,
  connectedLabel = 'Ready',
  disconnectedLabel = 'Login required',
  authenticatedButBlocked = false,
) {
  switch (status) {
    case 'checking':
      return {
        icon: <RefreshCw size={14} className="smtcmp-icon-spin" />,
        label: 'Checking',
        statusClass: 'smtcmp-mcp-server-status-badge--warning',
      }
    case 'ready':
      return {
        icon: <Check size={16} />,
        label: connectedLabel,
        statusClass: 'smtcmp-mcp-server-status-badge--connected',
      }
    case 'billing-blocked':
      return {
        icon: <ShieldAlert size={14} />,
        label: authenticatedButBlocked
          ? '로그인 확인됨 · 요청 차단'
          : '요청 차단',
        statusClass: 'smtcmp-mcp-server-status-badge--error',
      }
    case 'quota-unverified':
      return {
        icon: <ShieldAlert size={14} />,
        label: authenticatedButBlocked
          ? '로그인 확인됨 · 요청 차단'
          : '요청 차단',
        statusClass: 'smtcmp-mcp-server-status-badge--warning',
      }
    case 'error':
      return {
        icon: <CircleAlert size={14} />,
        label: 'Runtime error',
        statusClass: 'smtcmp-mcp-server-status-badge--error',
      }
    case 'not-installed':
      return {
        icon: <CircleMinus size={14} />,
        label: 'Not installed',
        statusClass: 'smtcmp-mcp-server-status-badge--disconnected',
      }
    case 'login-required':
      return {
        icon: <LogIn size={14} />,
        label: disconnectedLabel,
        statusClass: 'smtcmp-mcp-server-status-badge--disconnected',
      }
  }
}

function syncRuntimeModels(
  chatModels: ChatModel[],
  snapshot: NativeRuntimeSnapshot,
): ChatModel[] {
  const providerType =
    snapshot.provider === 'claude'
      ? ('anthropic-plan' as const)
      : ('gemini-plan' as const)
  const providerId = providerType
  const next = [...chatModels]
  let changed = false

  for (const runtimeModel of snapshot.models) {
    const existingIndex = next.findIndex(
      (model) =>
        model.providerType === providerType && model.model === runtimeModel.id,
    )
    if (existingIndex !== -1) continue

    const stableAlias = runtimeModel.id.toLowerCase()
    if (
      providerType === 'anthropic-plan' &&
      ['default', 'opus', 'sonnet', 'haiku', 'fable'].includes(stableAlias)
    ) {
      continue
    }

    const id = uniqueModelId(
      next,
      `${runtimeModel.label || runtimeModel.id} (plan)`,
    )
    next.push({
      providerType,
      providerId,
      id,
      model: runtimeModel.id,
      enable: true,
    })
    changed = true
  }
  return changed ? next : chatModels
}

function uniqueModelId(models: ChatModel[], candidate: string): string {
  if (!models.some((model) => model.id === candidate)) return candidate
  let suffix = 2
  while (models.some((model) => model.id === `${candidate} ${suffix}`)) {
    suffix += 1
  }
  return `${candidate} ${suffix}`
}

function runtimeNotice(title: string, snapshot: NativeRuntimeSnapshot): string {
  if (isClaudeOrganizationOptInRequired(snapshot)) {
    return `${title}: Team/Enterprise 계정입니다. 카드의 'Team/Enterprise 계정 허용'으로 이 컴퓨터에서 사용을 허용할 수 있습니다.`
  }
  switch (snapshot.status) {
    case 'checking':
      return `${title} 확인을 시작했습니다.`
    case 'ready':
      return `${title} runtime을 사용할 수 있습니다.`
    case 'login-required':
      return `${title}이 설치되었습니다. 로그인 후 다시 확인하세요.`
    case 'billing-blocked':
      return `${title} 요청을 차단했습니다. 재로그인보다 표시된 API 또는 Cloud 과금 경로를 먼저 해제하세요.`
    case 'quota-unverified':
      return `${title} 로그인은 확인했지만 개인 Plan 할당량 출처를 확인할 수 없어 요청을 차단했습니다.`
    case 'not-installed':
      return `${title} runtime을 찾지 못했습니다.`
    case 'error':
      return `${title} runtime 진단에서 오류를 발견했습니다.`
  }
}

function isSafeClaudeUpdate(update: NativeRuntimeSnapshot['update']): boolean {
  return update === 'native' || update === 'winget' || update === 'homebrew'
}

function claudeUpdateHelp(snapshot: NativeRuntimeSnapshot): string {
  const path = snapshot.executablePath
    ? `선택된 실행 파일: ${snapshot.executablePath}`
    : '선택된 실행 파일 경로가 없습니다.'
  if (snapshot.update === 'ambiguous') {
    return `Claude Code 설치본이 여러 개이거나 package manager 근거가 충돌합니다. ${path}`
  }
  return `Claude Code 설치 방법을 안전하게 판별하지 못했습니다. ${path}`
}

function openExternal(url: string): void {
  const openedWindow = window.open(url, '_blank', 'noopener,noreferrer')
  if (openedWindow) openedWindow.opener = null
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
