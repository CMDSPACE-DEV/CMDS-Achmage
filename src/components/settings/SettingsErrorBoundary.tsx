import { Component, ReactNode } from 'react'

type Props = { label: string; children: ReactNode }
type State = { error: Error | null }

/**
 * Keeps one failing settings section from unmounting the whole tab. The
 * section's error is shown in place so the other sections stay usable.
 */
export class SettingsErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error): void {
    console.error(
      `[CMDS Achmage] settings section "${this.props.label}" failed`,
      error,
    )
  }

  render(): ReactNode {
    if (this.state.error) {
      return (
        <div className="smtcmp-settings-section smtcmp-settings-section--error">
          <div className="smtcmp-settings-header">{this.props.label}</div>
          <p>
            This section could not be rendered: {this.state.error.message}.
            Reload the plugin or report the issue with the developer console
            output.
          </p>
        </div>
      )
    }
    return this.props.children
  }
}
