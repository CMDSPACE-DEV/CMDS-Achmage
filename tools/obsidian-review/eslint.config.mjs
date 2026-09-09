// Obsidian community-review gate — see docs/obsidian-community-review.md.
//
// Runs the Obsidian reviewer's own plugin (eslint-plugin-obsidianmd) but enables
// ONLY the rule IDs that the community-review bot classifies as "Error" (the tier
// that actually fails the review). Everything else is turned off, so ESLint's exit
// code is the gate: non-zero iff a real review-failing Error is present (or the
// tooling itself failed). Warning-class findings (no-console, prefer-create-el,
// popout timers, floating promises, …) are NOT gated here — they are tracked
// separately and never fail the community review.
//
// Must run with the repo root as CWD: the plugin reads the plugin name from
// ./manifest.json to enforce the settings-heading rules.

import obsidianmd from 'eslint-plugin-obsidianmd'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'

// The curated Error tier. Seeded from the plugin's own error-severity rows and
// calibrated against the findings the bot actually failed CMDS Achmage on
// (1.0.0–1.0.2). Extend this list when a release report surfaces a NEW Error rule.
const GATE_RULES = {
  // Undescribed / restricted / unlimited eslint-disable directives (1.0.0, 1.0.1).
  'eslint-comments/require-description': 'error',
  'eslint-comments/no-restricted-disable': 'error',
  'eslint-comments/no-unlimited-disable': 'error',
  // iOS-unsupported lookbehind regex (1.0.0).
  'obsidianmd/regex-lookbehind': 'error',
  // Direct element.style assignment (1.0.0).
  'obsidianmd/no-static-styles-assignment': 'error',
  // Raw <h2> settings heading instead of Setting().setHeading() (1.0.0).
  'obsidianmd/settings-tab/no-manual-html-headings': 'error',
  // Settings heading containing "settings" or the plugin name (1.0.2).
  'obsidianmd/settings-tab/no-problematic-settings-headings': 'error',
}

// Every rule the recommended config touches, forced off — so only GATE_RULES speak.
const recommended = obsidianmd.configs.recommended
const allOff = {}
for (const cfg of recommended) {
  if (!cfg.rules) continue
  for (const id of Object.keys(cfg.rules)) allOff[id] = 'off'
}

export default [
  // Register plugins + parser from the plugin's recommended config…
  ...recommended,
  // …then neutralise everything and turn the gate rules back on. Parse
  // syntactically only (no type-aware program) so the gate needs neither the
  // project's node_modules nor a slow projectService pass.
  {
    files: ['**/*.ts', '**/*.tsx'],
    // react-hooks is registered (rule left off) only so the source's
    // `// eslint-disable-next-line react-hooks/exhaustive-deps` comments resolve
    // to a known rule instead of erroring as "definition not found".
    plugins: { 'react-hooks': reactHooks },
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: { project: false, projectService: false },
    },
    // The source carries `// eslint-disable` comments for rules this gate config
    // does not load; without this they would surface as "unused directive" /
    // "rule not found" noise. The gate cares only about GATE_RULES firing.
    linterOptions: { reportUnusedDisableDirectives: 'off' },
    rules: { ...allOff, ...GATE_RULES },
  },
  {
    ignores: [
      '**/*.test.ts',
      '**/*.test.tsx',
      '__mocks__/**',
      'tools/**',
      'main.js',
    ],
  },
]
