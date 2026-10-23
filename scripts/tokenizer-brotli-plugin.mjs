import { pathToFileURL } from 'node:url'
import { brotliCompressSync, constants } from 'node:zlib'

// token.ts dynamically imports this module and caches its encoder. Preserve that
// boundary: esbuild initializes this data only when the first token call needs it.
export const tokenizerBrotliPlugin = {
  name: 'tokenizer-brotli',
  setup(build) {
    build.onLoad(
      { filter: /js-tiktoken[/\\]dist[/\\]ranks[/\\]cl100k_base\.js$/ },
      async ({ path }) => {
        const ranks = (await import(pathToFileURL(path).href)).default
        const packed = brotliCompressSync(Buffer.from(JSON.stringify(ranks)), {
          params: { [constants.BROTLI_PARAM_QUALITY]: 11 },
        })
        return {
          contents: `import { brotliDecompressSync } from 'node:zlib';
export default JSON.parse(brotliDecompressSync(Buffer.from(${JSON.stringify(packed.toString('base64'))}, 'base64')).toString('utf8'));`,
          loader: 'js',
        }
      },
    )
  },
}
