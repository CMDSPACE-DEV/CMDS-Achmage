import fs from 'fs'

const maxMainBytes = Math.floor(5 * 1024 * 1024)
const mainBytes = fs.statSync('main.js').size

if (mainBytes > maxMainBytes) {
  throw new Error(
    `main.js is ${mainBytes.toLocaleString()} bytes; the community-review budget is ${maxMainBytes.toLocaleString()} bytes.`,
  )
}

const metafile = JSON.parse(fs.readFileSync('meta.json', 'utf8'))
const bundleInputs = Object.keys(metafile.inputs)
const tokenizerInputs = bundleInputs.filter((path) =>
  path.includes('node_modules/js-tiktoken/'),
)
const forbiddenTokenizerInputs = tokenizerInputs.filter(
  (path) =>
    path.endsWith('/dist/index.js') ||
    (path.includes('/dist/ranks/') && !path.endsWith('/cl100k_base.js')),
)

if (forbiddenTokenizerInputs.length > 0) {
  throw new Error(
    `Unexpected tokenizer data entered the production bundle:\n${forbiddenTokenizerInputs.join(
      '\n',
    )}`,
  )
}

const nodeFetchInput = bundleInputs.find((path) =>
  path.includes('node_modules/node-fetch/'),
)
if (nodeFetchInput) {
  throw new Error(
    `node-fetch must not enter the production bundle (found ${nodeFetchInput}). Use Node http via desktopFetch.`,
  )
}

const langsmithInputs = bundleInputs.filter((path) =>
  path.includes('node_modules/langsmith/'),
)
if (langsmithInputs.length > 0) {
  throw new Error(
    `langsmith must be stubbed out of the production bundle:\n${langsmithInputs.join(
      '\n',
    )}`,
  )
}

const ajvCoreInputs = bundleInputs.filter((path) =>
  /(?:^|\/)node_modules\/ajv\/dist\/core\.js$/.test(path),
)
if (ajvCoreInputs.length > 1) {
  throw new Error(
    `Duplicate ajv copies entered the production bundle:\n${ajvCoreInputs.join(
      '\n',
    )}`,
  )
}

console.log(
  `Bundle budget passed: ${mainBytes.toLocaleString()} / ${maxMainBytes.toLocaleString()} bytes.`,
)
