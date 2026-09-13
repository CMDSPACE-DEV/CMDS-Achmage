import {
  Brain,
  Check,
  CircleAlert,
  LoaderCircle,
  PenLine,
  Plug,
  Wrench,
} from 'lucide-react'
import { useEffect, useState } from 'react'

import {
  ResponseProgress,
  formatElapsed,
} from '../../utils/chat/responseProgress'

const PHASE_LABEL: Record<ResponseProgress['phase'], string> = {
  connecting: 'Connecting',
  thinking: 'Thinking',
  tool: 'Calling tools',
  writing: 'Writing',
}

/**
 * Live status while a reply is generated (R-043): what the model is doing,
 * for how long, and roughly how many tokens it has produced. Disappears when
 * the turn settles; the final numbers stay in the message's info popover.
 */
export function ResponseProgressIndicator({
  progress,
}: {
  progress: ResponseProgress
}) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  const total = formatElapsed(now - progress.startedAt)
  const phaseFor = formatElapsed(now - progress.phaseSince)
  const reasoningTokens = progress.reasoningTokensEstimate
  const outputTokens =
    progress.usage?.completion_tokens ?? progress.outputTokensEstimate
  const exact = !!progress.usage
  const Icon =
    progress.phase === 'thinking'
      ? Brain
      : progress.phase === 'tool'
        ? Wrench
        : progress.phase === 'writing'
          ? PenLine
          : Plug

  return (
    <div
      className="smtcmp-response-progress"
      role="status"
      aria-live="polite"
      data-phase={progress.phase}
    >
      <div className="smtcmp-response-progress__row">
        <Icon size={13} className="smtcmp-response-progress__icon" />
        <span className="smtcmp-response-progress__phase">
          {PHASE_LABEL[progress.phase]}
          {progress.phase !== 'connecting' && ` · ${phaseFor}`}
        </span>
        <span className="smtcmp-response-progress__dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span className="smtcmp-response-progress__meta">
          {progress.modelId} · {total}
          {progress.turns > 1 ? ` · turn ${progress.turns}` : ''}
        </span>
      </div>
      {(progress.reasoningChars > 0 || progress.contentChars > 0) && (
        <div className="smtcmp-response-progress__row smtcmp-response-progress__tokens">
          {progress.reasoningChars > 0 && (
            <span title="Reasoning tokens (estimated from streamed text)">
              reasoning ~{reasoningTokens.toLocaleString()}
            </span>
          )}
          <span
            title={
              exact
                ? 'Completion tokens reported by the provider'
                : 'Output tokens (estimated from streamed text)'
            }
          >
            output {exact ? '' : '~'}
            {outputTokens.toLocaleString()}
          </span>
          {exact && progress.usage && (
            <span title="Prompt tokens reported by the provider">
              prompt {progress.usage.prompt_tokens.toLocaleString()}
            </span>
          )}
        </div>
      )}
      {progress.tools.length > 0 && (
        <div className="smtcmp-response-progress__row smtcmp-response-progress__tools">
          {progress.tools.map((tool, index) => (
            <span
              key={`${tool.name}-${index}`}
              className="smtcmp-response-progress__tool"
              data-status={tool.status}
            >
              {tool.status === 'done' ? (
                <Check size={11} />
              ) : tool.status === 'error' ? (
                <CircleAlert size={11} />
              ) : (
                <LoaderCircle size={11} className="smtcmp-spin" />
              )}
              {tool.name}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
