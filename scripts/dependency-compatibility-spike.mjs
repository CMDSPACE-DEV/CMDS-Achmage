import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { createRequire } from 'node:module'
import path from 'node:path'

const require = createRequire(path.resolve(process.argv[2] ?? '.', 'package.json'))
// The production callers use createDocuments directly, never Runnable tracing.
// Fail if even inherited tracing configuration or network is reached.
process.env.LANGCHAIN_TRACING_V2 = 'true'
process.env.LANGCHAIN_TRACING = 'true'
process.env.LANGSMITH_TRACING = 'true'
const { CallbackManager } = require('@langchain/core/callbacks/manager')
CallbackManager.configure = () => { throw new Error('Unexpected tracing callback') }
globalThis.fetch = () => { throw new Error('Unexpected network') }
const { RecursiveCharacterTextSplitter } = require('langchain/text_splitter')
const { PGlite } = require('@electric-sql/pglite')
const { drizzle } = require('drizzle-orm/pglite')
const { sql } = require('drizzle-orm')
const { pgTable, text, integer } = require('drizzle-orm/pg-core')
const { v4, v5, validate } = require('uuid')
const refractor = require('refractor')

const samples = [
  '# Heading\n\nA short paragraph.\n\n## Next\n\nMore text.',
  '# 한글 문서\n\n안녕하세요. '.repeat(25),
  '```typescript\nconst x = 42\n```\n\n| a | b |\n|---|---|\n| c | d |\n'.repeat(9),
  'word '.repeat(240),
  '',
]
const chunks = []
for (const chunkSize of [50, 200, 1000]) {
  for (const sample of samples) {
    const splitter = RecursiveCharacterTextSplitter.fromLanguage('markdown', { chunkSize, chunkOverlap: 10 })
    chunks.push(await splitter.createDocuments([sample]))
  }
}
const chunkHash = createHash('sha256').update(JSON.stringify(chunks)).digest('hex')
assert(validate(v4()))
assert.equal(v5('CMDS migration fixture', v5.DNS), '651fedf6-e1ed-56d5-b93c-3204cd38f159')
const languages = refractor.listLanguages()
for (const language of ['typescript', 'python', 'markdown', 'sql', 'bash']) {
  assert(languages.includes(language))
  assert(refractor.highlight('const value = 42;', language).length > 0)
}
const db = new PGlite()
try {
  await db.exec('CREATE TABLE items (id INTEGER PRIMARY KEY, content TEXT NOT NULL)')
  const table = pgTable('items', { id: integer('id').primaryKey(), content: text('content').notNull() })
  const orm = drizzle(db)
  await orm.insert(table).values({ id: 1, content: '한글 quote \' text' })
  assert.deepEqual(await orm.select().from(table), [{ id: 1, content: '한글 quote \' text' }])
  await orm.update(table).set({ content: 'updated' })
  assert.equal((await orm.select().from(table))[0].content, 'updated')
  await orm.delete(table)
  assert.equal((await orm.select().from(table)).length, 0)
  // Security patch: quoted identifiers remain one identifier, not SQL syntax.
  if (!process.argv.includes('--baseline')) {
    const query = orm.select().from(sql`${sql.identifier('items"; DROP TABLE items; --')}`).toSQL()
    assert(query.sql.includes('"items""; DROP TABLE items; --"'))
  }
} finally { await db.close() }
console.log(JSON.stringify({ chunkHash, cases: chunks.length, languages: languages.length, databaseCrud: 'pass', uuid: 'pass' }))
