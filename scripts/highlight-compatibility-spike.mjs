import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { createRequire } from 'node:module'
import path from 'node:path'
const baseline = createRequire(path.resolve(process.argv[2], 'package.json'))
const candidate = createRequire(path.resolve('package.json'))
const samples = [
  '// comment\nconst x = "<tag>&한글"; function f(a) { return a + 42; }\nclass C extends D {}',
  '# comment\ndef greet(name):\n    return f"Hello {name}"\nprint(greet("world"))',
  '<!doctype html><div id="x" class="a">&amp; text</div>\n.a { color: red; margin: 2px; }',
  '# Heading\n**bold** [link](https://example.test)\n```js\nlet x = 1;\n```',
  'SELECT "name", COUNT(*) FROM users WHERE id = 1; -- comment\n{"name":true,"value":[1,null]}',
  '#!/bin/sh\necho "$HOME" | cat\nkey: value\nlist:\n  - item\n[section]\nkey=value',
  'public class Test { static void Main() { Console.WriteLine("ok"); } }\n#include <stdio.h>\nint main() { return 0; }',
  'fn main() { let mut x = vec![1,2]; }\npackage main\nfunc main() { fmt.Println("ok") }\n\\begin{document} $x^2$ \\end{document}',
].join('\n\n')
const left = baseline('refractor'), right = candidate('refractor')
assert.deepEqual(left.listLanguages(), right.listLanguages())
const languages = right.listLanguages()
const hash = createHash('sha256')
for (const language of languages) {
  const before = JSON.stringify(left.highlight(samples, language))
  const after = JSON.stringify(right.highlight(samples, language))
  assert.equal(after, before, `${language}: AST changed`)
  hash.update(language + after)
}
const React = candidate('react')
const render = candidate('react-dom/server').renderToStaticMarkup
const oldComponent = baseline('react-syntax-highlighter/dist/cjs/prism').default
const newComponent = candidate('react-syntax-highlighter/dist/cjs/prism').default
for (const language of oldComponent.supportedLanguages) {
  const props = { language, children: samples }
  assert.equal(render(React.createElement(newComponent, props)), render(React.createElement(oldComponent, props)), `${language}: HTML changed`)
}
console.log(JSON.stringify({ astLanguagesAndAliases: languages.length, renderedLanguages: oldComponent.supportedLanguages.length, corpusBytes: Buffer.byteLength(samples), hash: hash.digest('hex'), exactMatch: true }))
