import { ChevronRight } from 'lucide-react'
import { ReactNode } from 'react'

export type SettingsGroupProps = {
  /** Short noun phrase naming what this group configures. */
  title: string
  /** One line saying what changes if you open it. Shown next to the title. */
  description: string
  /** Open on first render. Use for the group a tab is mainly about. */
  defaultOpen?: boolean
  children: ReactNode
}

/**
 * One collapsible block of settings.
 *
 * A tab that renders every control at once scrolls for pages and gives no clue
 * which stretch of it does what. Grouping turns each tab into a short list of
 * labelled rows that open to reveal only the controls asked for.
 *
 * Built on <details> so the open state is the browser's, keyboard and screen
 * reader behaviour come for free, and in-page search still finds closed text.
 */
export function SettingsGroup({
  title,
  description,
  defaultOpen = false,
  children,
}: SettingsGroupProps) {
  return (
    <details className="smtcmp-settings-group" open={defaultOpen}>
      <summary className="smtcmp-settings-group__summary">
        <ChevronRight className="smtcmp-settings-group__chevron" size={16} />
        <div className="smtcmp-settings-group__text">
          <div className="smtcmp-settings-group__title">{title}</div>
          <div className="smtcmp-settings-group__desc">{description}</div>
        </div>
      </summary>
      <div className="smtcmp-settings-group__body">{children}</div>
    </details>
  )
}
