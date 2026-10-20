/** New general diagram requests use Pele; explicit legacy requests retain their route. */
export function matchDiagramRequest(text: string): string | null {
  const command = text.match(/^\/(?:diagram|pele|mermaid)\b\s*/i)
  if (command) return text.slice(command[0].length).trim()
  if (/excalidraw|엑스칼리드로/i.test(text)) return null
  const topic = /diagram|mermaid|pele|다이어그램|머메이드|순서도|마인드맵/i
  const intent = /만들|생성|그려|작성|create|build|make|draw|generate/i
  return topic.test(text) && intent.test(text) ? text.trim() : null
}
