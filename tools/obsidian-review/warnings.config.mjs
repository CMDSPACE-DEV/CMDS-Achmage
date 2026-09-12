// Warning/Recommendation-tier community-review findings.
// Not used by CI. Run from the repository root:
//   ./tools/obsidian-review/node_modules/.bin/eslint --config tools/obsidian-review/warnings.config.mjs src
// Also lint package.json (informational; do not edit it from this pass):
//   ./tools/obsidian-review/node_modules/.bin/eslint --config tools/obsidian-review/warnings.config.mjs package.json
import obsidianmd from 'eslint-plugin-obsidianmd'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'

const recommended = obsidianmd.configs.recommended

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
    rules: {
      ...reactHooks.configs.recommended.rules,
      // TypeScript already checks undefined identifiers; recommended leaves
      // no-undef on. Turning it off is the standard type-aware overlay.
      'no-undef': 'off',
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
