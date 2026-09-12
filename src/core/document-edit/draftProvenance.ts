export type DraftProvenance = {
  sourcePath: string
  modelId?: string
  generatedAt?: Date
}

/**
 * A draft is a derivative of a note the user wrote, and with
 * preserveFrontmatter on it carries that note's frontmatter verbatim. Whatever
 * the user's schema uses for authorship or dates is theirs to decide, so this
 * does not rewrite any existing key. It only adds plugin-namespaced keys that
 * record where the draft came from, so a later reader (human or agent) can
 * tell a generated draft from an original.
 */
export function stampDraftProvenance(
  content: string,
  provenance: DraftProvenance,
): string {
  const sourceName =
    provenance.sourcePath.split('/').pop()?.replace(/\.md$/i, '') ?? ''
  const lines = [
    `achmage-source: "[[${sourceName}]]"`,
    `achmage-generated: ${(provenance.generatedAt ?? new Date()).toISOString()}`,
  ]
  if (provenance.modelId) lines.push(`achmage-model: "${provenance.modelId}"`)
  const block = lines.join('\n')

  const match = /^---\r?\n([\s\S]*?)\r?\n---(\r?\n|$)/.exec(content)
  if (match) {
    const body = match[1]
      .replace(/^achmage-[a-z]+:.*$/gm, '')
      .replace(/\n+$/, '')
    const rest = content.slice(match[0].length)
    return `---\n${body ? `${body}\n` : ''}${block}\n---\n${rest}`
  }
  return `---\n${block}\n---\n${content}`
}
