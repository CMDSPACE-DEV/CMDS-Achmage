import { App } from 'obsidian'
import { useState } from 'react'

import SmartComposerPlugin from '../../main'

import { AppearanceSection } from './sections/AppearanceSection'
import { ChatSection } from './sections/ChatSection'
import { EtcSection } from './sections/EtcSection'
import { McpSection } from './sections/McpSection'
import { ModelsSection } from './sections/ModelsSection'
import { PlanConnectionsSection } from './sections/PlanConnectionsSection'
import { ProvidersSection } from './sections/ProvidersSection'
import { RAGSection } from './sections/RAGSection'
import { ResearchSection } from './sections/ResearchSection'
import { TemplateSection } from './sections/TemplateSection'
import { SettingsErrorBoundary } from './SettingsErrorBoundary'
import { SettingsGroup } from './SettingsGroup'

type SettingsTabRootProps = {
  app: App
  plugin: SmartComposerPlugin
}

export function SettingsTabRoot({ app, plugin }: SettingsTabRootProps) {
  const [activeTab, setActiveTab] = useState<SettingsPage>('plan')

  return (
    <div className="smtcmp-settings-root">
      {/* No aria-label here: Obsidian renders aria-label as a hover tooltip. */}
      <div className="smtcmp-settings-tabbar">
        {/*
          Covers the scroller's top padding, through which content would
          otherwise be seen sliding above the pinned bar. A real element rather
          than a pseudo-element so it can be asserted on.
        */}
        <span className="smtcmp-settings-tabbar__scrim" aria-hidden="true" />
        <nav className="smtcmp-settings-tabs" role="tablist">
          {SETTINGS_PAGES.map((page) => (
            <button
              key={page.id}
              id={`smtcmp-settings-tab-${page.id}`}
              type="button"
              role="tab"
              aria-selected={activeTab === page.id}
              className="smtcmp-settings-tab"
              data-active={activeTab === page.id}
              onClick={() => setActiveTab(page.id)}
            >
              {page.label}
            </button>
          ))}
        </nav>
      </div>

      <div
        className="smtcmp-settings-page"
        role="tabpanel"
        aria-labelledby={`smtcmp-settings-tab-${activeTab}`}
      >
        {activeTab === 'plan' && (
          <>
            <SettingsGroup
              title="Plan runtimes"
              description="Sign in to Claude, ChatGPT, or Gemini through their own CLI instead of an API key."
              defaultOpen
            >
              <PlanConnectionsSection app={app} plugin={plugin} />
            </SettingsGroup>
            <SettingsGroup
              title="Default models"
              description="Which model answers chat, inline edits, and Apply."
            >
              <ChatSection mode="models" />
            </SettingsGroup>
          </>
        )}

        {activeTab === 'research' && (
          <SettingsGroup
            title="Research connections"
            description="Keys for the literature and public-data sources the research tools can query."
            defaultOpen
          >
            <ResearchSection plugin={plugin} />
          </SettingsGroup>
        )}

        {activeTab === 'writing' && (
          <>
            <SettingsGroup
              title="Prompt and tools"
              description="System prompt, the CMDS Obsidian editing rules, and how many tool rounds a reply may take."
              defaultOpen
            >
              <SettingsErrorBoundary label="Prompt and tools">
                <ChatSection mode="writing" app={app} />
              </SettingsErrorBoundary>
            </SettingsGroup>
            <SettingsGroup
              title="Inline edit"
              description="How much surrounding text the inline editor reads, and how large edits are handled."
            >
              <SettingsErrorBoundary label="Inline edit">
                <ChatSection mode="inline" />
              </SettingsErrorBoundary>
            </SettingsGroup>
            <SettingsGroup
              title="Document drafts"
              description="Where whole-document rewrites are saved, and how they are chunked."
            >
              <SettingsErrorBoundary label="Document drafts">
                <ChatSection mode="document" app={app} />
              </SettingsErrorBoundary>
            </SettingsGroup>
            <SettingsGroup
              title="Image generation"
              description="Image model, output folders, quality, delivery to Eagle, and prompt templates."
            >
              <SettingsErrorBoundary label="Image generation">
                <ChatSection mode="images" app={app} />
              </SettingsErrorBoundary>
            </SettingsGroup>
            <SettingsGroup
              title="Prompt templates"
              description="Reusable prompts you can insert into the composer."
            >
              <SettingsErrorBoundary label="Templates">
                <TemplateSection app={app} />
              </SettingsErrorBoundary>
            </SettingsGroup>
            <SettingsGroup
              title="Vault search"
              description="How notes are retrieved and how much of them reaches the model."
            >
              <SettingsErrorBoundary label="Vault search">
                <RAGSection app={app} plugin={plugin} />
              </SettingsErrorBoundary>
            </SettingsGroup>
            <SettingsGroup
              title="Appearance"
              description="Colour, accent, and glow of the chat and inline panels."
            >
              <SettingsErrorBoundary label="Appearance">
                <AppearanceSection />
              </SettingsErrorBoundary>
            </SettingsGroup>
          </>
        )}

        {activeTab === 'mcp' && (
          <SettingsGroup
            title="MCP connections"
            description="External tool servers the assistant may call, and their credentials."
            defaultOpen
          >
            <McpSection app={app} plugin={plugin} />
          </SettingsGroup>
        )}

        {activeTab === 'advanced' && (
          <>
            <SettingsGroup
              title="Providers"
              description="API keys and base URLs for each model provider."
              defaultOpen
            >
              <ProvidersSection app={app} plugin={plugin} />
            </SettingsGroup>
            <SettingsGroup
              title="Models"
              description="Add, remove, or edit the model entries you can choose from."
            >
              <ModelsSection app={app} plugin={plugin} />
            </SettingsGroup>
            <SettingsGroup
              title="Maintenance"
              description="Database rebuilds, diagnostics, and other rarely used actions."
            >
              <EtcSection app={app} plugin={plugin} />
            </SettingsGroup>
          </>
        )}
      </div>

      <footer className="smtcmp-settings-footer">
        <div className="smtcmp-settings-footer__version">
          {plugin.manifest.name} v{plugin.manifest.version}
        </div>
        <div className="smtcmp-settings-footer__links">
          CMDSPACE{' '}
          <a href="https://class.cmdspace.kr/" rel="noreferrer">
            Education
          </a>
          {' · '}
          <a href="https://www.youtube.com/@cmdspace" rel="noreferrer">
            YouTube
          </a>
          {' · '}
          <a
            href="https://github.com/CMDSPACE-DEV/CMDS-Achmage"
            rel="noreferrer"
          >
            GitHub
          </a>
        </div>
      </footer>
    </div>
  )
}

type SettingsPage = 'plan' | 'research' | 'writing' | 'mcp' | 'advanced'

const SETTINGS_PAGES: { id: SettingsPage; label: string }[] = [
  { id: 'plan', label: 'Plan' },
  { id: 'research', label: 'Research' },
  { id: 'writing', label: 'Writing' },
  { id: 'mcp', label: 'MCP' },
  { id: 'advanced', label: 'Advanced' },
]
