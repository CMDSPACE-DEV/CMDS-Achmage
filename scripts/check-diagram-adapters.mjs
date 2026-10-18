import { build } from 'esbuild'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
const outfile = path.resolve('node_modules/.cache/diagram-contract.cjs')
fs.mkdirSync(path.dirname(outfile), { recursive: true })
await build({ entryPoints: ['scripts/check-diagram-adapters.ts'], bundle: true, platform: 'node', target: 'node20', outfile })
const result = spawnSync(process.execPath, [outfile], { stdio: 'inherit' })
if (result.error) throw result.error
process.exitCode = result.status ?? 1
