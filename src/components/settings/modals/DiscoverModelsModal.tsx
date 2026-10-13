import { App, Notice } from 'obsidian'
import { useEffect, useState } from 'react'

import {
  DiscoverableApiProviderType,
  DiscoveredModel,
  fetchApiProviderModels,
  mergeDiscoveredModels,
} from '../../../core/llm/modelDiscovery'
import { obsidianJsonGetter } from '../../../core/llm/obsidianJsonGetter'
import SmartComposerPlugin from '../../../main'
import { ReactModal } from '../../common/ReactModal'

type DiscoverModelsModalProps = {
  plugin: SmartComposerPlugin
  onClose: () => void
}

type ProviderResult = {
  providerId: string
  providerType: DiscoverableApiProviderType
  state: 'loading' | 'done' | 'error'
  models: DiscoveredModel[]
  error?: string
}

const DISCOVERABLE: readonly DiscoverableApiProviderType[] = [
  'anthropic',
  'openai',
  'gemini',
]

/**
 * Lists models the user's own API keys can reach that the picker does not
 * have yet. Nothing is added until the user ticks it. See R-044.
 */
export class DiscoverModelsModal extends ReactModal<DiscoverModelsModalProps> {
  constructor(app: App, plugin: SmartComposerPlugin) {
    super({
      app,
      Component: DiscoverModelsModalComponent,
      props: { plugin },
      options: { title: '새 모델 확인' },
    })
  }
}

function DiscoverModelsModalComponent({
  plugin,
  onClose,
}: DiscoverModelsModalProps) {
  const [results, setResults] = useState<ProviderResult[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())

  useEffect(() => {
    let cancelled = false
    const providers = plugin.settings.providers.filter(
      (provider) =>
        (DISCOVERABLE as readonly string[]).includes(provider.type) &&
        !!provider.apiKey?.trim(),
    )
    setResults(
      providers.map((provider) => ({
        providerId: provider.id,
        providerType: provider.type as DiscoverableApiProviderType,
        state: 'loading',
        models: [],
      })),
    )

    providers.forEach((provider) => {
      const providerType = provider.type as DiscoverableApiProviderType
      fetchApiProviderModels(
        providerType,
        provider.apiKey ?? '',
        obsidianJsonGetter,
        provider.baseUrl,
      )
        .then((models) => {
          const registered = new Set(
            plugin.settings.chatModels
              .filter((model) => model.providerId === provider.id)
              .map((model) => model.model),
          )
          return models.filter((model) => !registered.has(model.id))
        })
        .then(
          (models) => update(provider.id, { state: 'done', models }),
          (error: unknown) =>
            update(provider.id, {
              state: 'error',
              error: error instanceof Error ? error.message : String(error),
            }),
        )
    })

    function update(providerId: string, patch: Partial<ProviderResult>) {
      if (cancelled) return
      setResults((current) =>
        current.map((result) =>
          result.providerId === providerId ? { ...result, ...patch } : result,
        ),
      )
    }
    return () => {
      cancelled = true
    }
  }, [plugin])

  const key = (providerId: string, modelId: string) =>
    `${providerId}\u0000${modelId}`

  const toggle = (value: string) => {
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(value)) next.delete(value)
      else next.add(value)
      return next
    })
  }

  const addSelected = async () => {
    let chatModels = plugin.settings.chatModels
    let count = 0
    for (const result of results) {
      const picked = result.models.filter((model) =>
        selected.has(key(result.providerId, model.id)),
      )
      if (picked.length === 0) continue
      const merged = mergeDiscoveredModels(
        chatModels,
        result.providerType,
        result.providerId,
        picked,
      )
      chatModels = merged.chatModels
      count += merged.added.length
    }
    if (count > 0) {
      await plugin.setSettings({ ...plugin.settings, chatModels })
      new Notice(`모델 ${count}개를 추가했습니다.`)
    }
    onClose()
  }

  if (results.length === 0) {
    return (
      <div className="smtcmp-settings-desc">
        API key가 설정된 Anthropic, OpenAI, Gemini provider가 없습니다. Plan
        모델은 Plan 연결 카드에서 자동으로 동기화됩니다.
      </div>
    )
  }

  return (
    <div className="smtcmp-discover-models">
      <div className="smtcmp-settings-desc">
        내 API key로 호출할 수 있지만 아직 목록에 없는 채팅 모델입니다. 추가할
        모델을 선택하세요.
      </div>
      {results.map((result) => (
        <section key={result.providerId}>
          <div className="smtcmp-settings-sub-header">{result.providerId}</div>
          {result.state === 'loading' && (
            <div className="smtcmp-settings-desc">확인 중…</div>
          )}
          {result.state === 'error' && (
            <div className="smtcmp-settings-desc-warning" role="status">
              {result.error}
            </div>
          )}
          {result.state === 'done' && result.models.length === 0 && (
            <div className="smtcmp-settings-desc">새 모델이 없습니다.</div>
          )}
          {result.models.map((model) => {
            const value = key(result.providerId, model.id)
            return (
              <label key={model.id} className="smtcmp-discover-models-row">
                <input
                  type="checkbox"
                  checked={selected.has(value)}
                  onChange={() => toggle(value)}
                />
                <code>{model.id}</code>
                {model.label !== model.id && <span>{model.label}</span>}
              </label>
            )
          })}
        </section>
      ))}
      <div className="modal-button-container">
        <button
          className="mod-cta"
          disabled={selected.size === 0}
          onClick={() => void addSelected()}
        >
          선택한 모델 추가
        </button>
        <button onClick={onClose}>닫기</button>
      </div>
    </div>
  )
}
