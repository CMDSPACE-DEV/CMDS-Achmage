// One-shot auto-fix config for Warning-tier rules that support --fix.
// Not used by CI. Run from the repository root:
//   ./tools/obsidian-review/node_modules/.bin/eslint --config tools/obsidian-review/fix-warnings.config.mjs --fix src
import obsidianmd from 'eslint-plugin-obsidianmd'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'

const recommended = obsidianmd.configs.recommended
const allOff = {}
for (const cfg of recommended) {
  if (!cfg.rules) continue
  for (const id of Object.keys(cfg.rules)) allOff[id] = 'off'
}

export default [
  ...recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    plugins: { 'react-hooks': reactHooks },
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: process.cwd(),
      },
    },
    linterOptions: { reportUnusedDisableDirectives: 'off' },
    rules: {
      ...allOff,
      'obsidianmd/prefer-window-timers': 'warn',
      'obsidianmd/no-global-this': 'warn',
      'obsidianmd/prefer-create-el': 'warn',
    },
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
