import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { performance } from 'node:perf_hooks'
import { pathToFileURL } from 'node:url'
import esbuild from 'esbuild'
import { tokenizerBrotliPlugin } from './tokenizer-brotli-plugin.mjs'

const require = createRequire(import.meta.url)
const directory = mkdtempSync(path.join(tmpdir(), 'achmage-tokenizer-'))
const zlib = require('node:zlib')
const originalDecode = zlib.brotliDecompressSync
let decodes = 0
let decodeMs = 0
try {
  const output = path.join(directory, 'token.cjs')
  await esbuild.build({
    entryPoints: ['src/utils/llm/token.ts'],
    outfile: output,
    bundle: true,
    format: 'cjs',
    platform: 'browser',
    target: 'es2020',
    minify: true,
    external: ['node:zlib'],
    plugins: [tokenizerBrotliPlugin],
  })
  zlib.brotliDecompressSync = (...args) => {
    decodes++
    const start = performance.now()
    const result = originalDecode(...args)
    decodeMs += performance.now() - start
    return result
  }
  const { encodeTokenIds, tokenCount } = require(output)
  assert.equal(decodes, 0, 'Decompression must not run at module load')
  const original = require('js-tiktoken').getEncoding('cl100k_base')
  const corpus = [
    '',
    'CMDS Achmage keeps exact token semantics.',
    '옵시디언 폴더 전체를 정독하고 핵심 연결점을 정리해줘.',
    '# Heading\n\n- one\n- two\n\n```ts\nconst value = 42\n```',
    'Emoji and mixed Unicode: 🚀 🧠 café 한글 日本語',
    '긴 문장 '.repeat(2000),
  ]
  await Promise.all(corpus.map(async (text) => {
    const ids = original.encode(text)
    assert.deepEqual(await encodeTokenIds(text), ids)
    assert.equal(await tokenCount(text), ids.length)
  }))
  assert.equal(decodes, 1, 'Concurrent and repeated calls must share one decode')
  zlib.brotliDecompressSync = originalDecode

  const ranksPath = path.resolve('node_modules/js-tiktoken/dist/ranks/cl100k_base.js')
  const ranksOutput = path.join(directory, 'ranks.cjs')
  await esbuild.build({
    entryPoints: [ranksPath],
    outfile: ranksOutput,
    bundle: true,
    format: 'cjs',
    platform: 'node',
    minify: true,
    plugins: [tokenizerBrotliPlugin],
  })
  const ranks = (await import(pathToFileURL(ranksPath).href)).default
  assert.equal(JSON.stringify(require(ranksOutput).default), JSON.stringify(ranks))
  console.log(JSON.stringify({ rankDataExact: true, tokenIdCorpusPassed: corpus.length,
    decodesAtModuleLoad: 0, decodesAfterCalls: decodes, decodeMs }))
} finally {
  zlib.brotliDecompressSync = originalDecode
  rmSync(directory, { recursive: true, force: true })
}
