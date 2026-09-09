#!/usr/bin/env node
// Obsidian community-review Error gate. Run from the REPOSITORY ROOT:
//
//   node tools/obsidian-review/check.mjs
//
// Exits non-zero if a review-failing "Error"-tier finding is present, OR if the
// tooling itself fails to run (bad config, missing manifest). Same binary the CI
// job uses — see docs/obsidian-community-review.md.
import { existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))

// The plugin reads the plugin name from ./manifest.json in the CWD to enforce the
// settings-heading rules. Running from the wrong directory would silently disable
// that rule, so fail loudly instead.
if (!existsSync('manifest.json')) {
  console.error(
    'obsidian-review gate: must run from the repository root — manifest.json not ' +
      'found in the current directory.',
  )
  process.exit(1)
}

const eslintBin = join(
  here,
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'eslint.cmd' : 'eslint',
)

const result = spawnSync(
  eslintBin,
  ['--config', join(here, 'eslint.config.mjs'), 'src'],
  { stdio: 'inherit' },
)

if (result.error) {
  console.error('obsidian-review gate: failed to run ESLint —', result.error.message)
  process.exit(1)
}

process.exit(result.status ?? 1)
