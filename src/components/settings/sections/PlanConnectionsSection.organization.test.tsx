/** @jest-environment jsdom */

const mockConfirmModalOptions: { onConfirm: () => void; message: string }[] = []

jest.mock('obsidian', () => ({
  App: class {},
  Modal: class {},
  Notice: class {},
  Platform: { isDesktop: true },
  normalizePath: (value: string) => value,
}))

jest.mock('../../modals/ConfirmModal', () => ({
  ConfirmModal: class {
    constructor(
      _app: unknown,
      options: { onConfirm: () => void; message: string },
    ) {
      mockConfirmModalOptions.push(options)
    }
    open() {
      return undefined
    }
  },
}))

jest.mock('../modals/ConnectOpenAIPlanModal', () => ({
  ConnectOpenAIPlanModal: class {},
}))

jest.mock('../../../contexts/settings-context', () => ({
  useSettings: jest.fn(),
}))

import '@testing-library/jest-dom'

import { act, fireEvent, render, screen } from '@testing-library/react'
import type { App } from 'obsidian'

import type { NativeRuntimeSnapshot } from '../../../core/llm/native/nativeRuntime.types'
import type { NativeRuntimeService } from '../../../core/llm/native/NativeRuntimeService'

import { NativeRuntimeCard } from './PlanConnectionsSection'

const installed: NativeRuntimeSnapshot = {
  provider: 'claude',
  status: 'billing-blocked',
  phase: 'settled',
  installation: 'installed',
  authentication: 'billing-blocked',
  catalog: 'ready',
  update: 'native',
  models: [],
}

const optInRequired: NativeRuntimeSnapshot = {
  ...installed,
  authDecision: {
    status: 'billing-blocked',
    allowed: false,
    reason:
      'Claude Code is signed in with a Team or Enterprise organization account.',
    evidence: ['subscriptionType=team', 'organization plan requires opt-in'],
    code: 'organization-opt-in-required',
  },
  error:
    'Claude Code is signed in with a Team or Enterprise organization account.',
}

const organizationReady: NativeRuntimeSnapshot = {
  ...installed,
  status: 'ready',
  authentication: 'subscription',
  authDecision: {
    status: 'subscription',
    allowed: true,
    reason: 'Team/Enterprise login allowed on this computer.',
    evidence: ['subscriptionType=team'],
    code: 'organization-subscription',
  },
  error: undefined,
}

describe('Claude Plan card Team/Enterprise opt-in (R-049)', () => {
  beforeEach(() => {
    mockConfirmModalOptions.length = 0
  })

  it('explains the organization block and allows it after confirmation', () => {
    const service = fakeService(optInRequired, false)
    const { container } = render(card(service))

    const cardElement = container.querySelector(
      '[data-runtime-provider="claude"]',
    )
    expect(cardElement).toHaveTextContent('조직 계정 · 허용 필요')
    expect(cardElement).not.toHaveTextContent('API, Cloud')
    expect(
      container.querySelector('[data-runtime-notice="organization-opt-in"]'),
    ).toBeInTheDocument()

    fireEvent.click(
      screen.getByRole('button', { name: 'Team/Enterprise 계정 허용…' }),
    )
    expect(mockConfirmModalOptions).toHaveLength(1)
    expect(mockConfirmModalOptions[0]?.message).toMatch(/hooks/)
    expect(service.setClaudeOrganizationPlans).not.toHaveBeenCalled()

    act(() => {
      mockConfirmModalOptions[0]?.onConfirm()
    })

    expect(service.setClaudeOrganizationPlans).toHaveBeenCalledWith(true)
    expect(service.diagnose).toHaveBeenCalledWith('claude')
  })

  it('shows the device-local allowance and lets the user revoke it', () => {
    const service = fakeService(organizationReady, true)
    const { container } = render(card(service))

    expect(
      container.querySelector('[data-runtime-notice="organization-allowed"]'),
    ).toHaveTextContent('Team/Enterprise 계정으로 연결됨')

    fireEvent.click(screen.getByRole('button', { name: '허용 해제' }))

    expect(service.setClaudeOrganizationPlans).toHaveBeenCalledWith(false)
    expect(service.diagnose).toHaveBeenCalledWith('claude')
  })

  it('does not offer the organization opt-in to a personal billing block', () => {
    const service = fakeService(
      {
        ...installed,
        authDecision: {
          status: 'billing-blocked',
          allowed: false,
          reason: 'A non-subscription billing path takes precedence.',
          evidence: [
            'auth metadata contains a non-subscription billing marker',
          ],
          code: 'billing-marker',
        },
        error: 'A non-subscription billing path takes precedence.',
      },
      false,
    )
    const { container } = render(card(service))

    expect(
      container.querySelector('[data-runtime-provider="claude"]'),
    ).toHaveTextContent('로그인 확인됨 · 요청 차단')
    expect(
      screen.queryByRole('button', { name: 'Team/Enterprise 계정 허용…' }),
    ).not.toBeInTheDocument()
  })
})

function card(service: NativeRuntimeService) {
  return (
    <NativeRuntimeCard
      app={{} as App}
      provider="claude"
      title="Claude Plan"
      description="Test runtime"
      service={service}
      onDiagnostics={() => undefined}
    />
  )
}

function fakeService(
  snapshot: NativeRuntimeSnapshot,
  allowsOrganizationPlans: boolean,
) {
  return {
    getSnapshot: () => snapshot,
    subscribe: () => () => undefined,
    diagnose: jest.fn(async () => snapshot),
    getCustomPath: () => '',
    setCustomPath: jest.fn(),
    allowsClaudeOrganizationPlans: () => allowsOrganizationPlans,
    setClaudeOrganizationPlans: jest.fn(),
    getUpdateDecision: jest.fn(),
    openLoginTerminal: jest.fn(),
    openUpdateTerminal: jest.fn(),
  } as unknown as NativeRuntimeService & {
    diagnose: jest.Mock
    setClaudeOrganizationPlans: jest.Mock
  }
}
