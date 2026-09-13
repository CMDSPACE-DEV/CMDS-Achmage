import { normalizeForMatch } from './edit-ops'

/**
 * Paragraph-level patching for whole-document or abbreviated blocks (R-042):
 * the model's block is aligned to the note paragraph by paragraph (LCS on
 * normalized text) and only the differing paragraphs are replaced, inserted,
 * or deleted. `<!-- ... existing content ... -->` placeholders split the
 * block into chunks; note paragraphs in a placeholder gap are kept.
 */
export type Hunk = {
  from: number
  to: number
  insert: string
  kind: 'replace' | 'insert' | 'delete'
}

export type ParagraphPatch = {
  hunks: Hunk[]
  matched: number
  changed: number
  /** Note paragraphs considered (frontmatter excluded). */
  total: number
}

type Para = { from: number; to: number; text: string; key: string }

const PLACEHOLDER = /^<!--\s*\.{3}.*?\.{3}\s*-->$|^\.{3}$|^…$/

export function stripFrontmatterRange(text: string): number {
  const m = text.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/)
  return m ? m[0].length : 0
}

/**
 * Splits into paragraphs at blank lines, keeps fenced code blocks whole, and
 * treats heading lines and placeholder lines as paragraphs of their own so a
 * heading glued to its first sentence still aligns line by line.
 */
function paragraphsOf(text: string, base = 0): Para[] {
  const result: Para[] = []
  const lines = text.split('\n')
  let offset = 0
  let start = -1
  let end = -1
  let inFence = false
  const flush = () => {
    if (start < 0) return
    const raw = text.slice(start, end)
    const value = raw.trim()
    if (value) {
      const lead = raw.length - raw.trimStart().length
      result.push({
        from: base + start + lead,
        to: base + start + lead + value.length,
        text: value,
        key: normalizeForMatch(value).value.toLowerCase(),
      })
    }
    start = -1
    end = -1
  }
  for (const line of lines) {
    const lineStart = offset
    const lineEnd = offset + line.length
    offset = lineEnd + 1
    const trimmed = line.trim()
    const isFence = /^(```|~~~)/.test(trimmed)
    if (inFence) {
      end = lineEnd
      if (isFence) {
        inFence = false
        flush()
      }
      continue
    }
    if (isFence) {
      flush()
      start = lineStart
      end = lineEnd
      inFence = true
      continue
    }
    if (!trimmed) {
      flush()
      continue
    }
    const isHeading = /^#{1,6}\s/.test(trimmed)
    const isPlaceholder = PLACEHOLDER.test(trimmed)
    if (isHeading || isPlaceholder) {
      flush()
      start = lineStart
      end = lineEnd
      flush()
      continue
    }
    if (start < 0) start = lineStart
    end = lineEnd
  }
  flush()
  return result
}

function lcs(a: string[], b: string[]): [number, number][] {
  const n = a.length
  const m = b.length
  const dp: number[][] = Array.from({ length: n + 1 }, () =>
    new Array<number>(m + 1).fill(0),
  )
  for (let i = n - 1; i >= 0; i -= 1) {
    for (let j = m - 1; j >= 0; j -= 1) {
      dp[i][j] =
        a[i] === b[j]
          ? dp[i + 1][j + 1] + 1
          : Math.max(dp[i + 1][j], dp[i][j + 1])
    }
  }
  const pairs: [number, number][] = []
  let i = 0
  let j = 0
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      pairs.push([i, j])
      i += 1
      j += 1
    } else if (dp[i + 1][j] >= dp[i][j + 1]) i += 1
    else j += 1
  }
  return pairs
}

export function computeParagraphPatch(
  noteText: string,
  proposed: string,
): ParagraphPatch {
  const bodyStart = stripFrontmatterRange(noteText)
  const note = paragraphsOf(noteText.slice(bodyStart), bodyStart)
  const proposedBody = proposed.slice(stripFrontmatterRange(proposed))
  const chunks: Para[][] = [[]]
  for (const p of paragraphsOf(proposedBody)) {
    if (PLACEHOLDER.test(p.text)) {
      if (chunks[chunks.length - 1].length) chunks.push([])
      continue
    }
    chunks[chunks.length - 1].push(p)
  }
  const hunks: Hunk[] = []
  let matched = 0
  let noteCursor = 0 // note paragraphs before this index are already consumed
  const noteKeys = note.map((p) => p.key)

  for (const chunk of chunks) {
    if (chunk.length === 0) continue
    const pairs = lcs(
      noteKeys.slice(noteCursor),
      chunk.map((p) => p.key),
    ).map(([ni, ci]) => [ni + noteCursor, ci] as [number, number])
    matched += pairs.length
    if (pairs.length === 0) {
      // Nothing recognisable: append the whole chunk at the end of the note.
      const at = note.length ? note[note.length - 1].to : noteText.length
      hunks.push({
        from: at,
        to: at,
        insert: chunk.map((p) => p.text).join('\n\n'),
        kind: 'insert',
      })
      continue
    }
    let prevNote = -1
    let prevChunk = -1
    const segments: {
      noteFrom: number
      noteTo: number
      chunkFrom: number
      chunkTo: number
    }[] = []
    for (const [ni, ci] of pairs) {
      segments.push({
        noteFrom: prevNote + 1,
        noteTo: ni,
        chunkFrom: prevChunk + 1,
        chunkTo: ci,
      })
      prevNote = ni
      prevChunk = ci
    }
    segments.push({
      noteFrom: prevNote + 1,
      noteTo: prevNote + 1,
      chunkFrom: prevChunk + 1,
      chunkTo: chunk.length,
    })
    const firstMatchedNote = pairs[0][0]
    segments.forEach((seg, index) => {
      const insertParas = chunk.slice(seg.chunkFrom, seg.chunkTo)
      const isLeading = index === 0
      const isTrailing = index === segments.length - 1
      // Note paragraphs before the first match / after the last match of a
      // chunk belong to other chunks or unchanged regions: never delete them.
      const deleteFrom = isLeading || isTrailing ? -1 : seg.noteFrom
      const deleteTo = isLeading || isTrailing ? -1 : seg.noteTo
      const hasDelete = deleteFrom >= 0 && deleteTo > deleteFrom
      if (insertParas.length === 0 && !hasDelete) return
      const insert = insertParas.map((p) => p.text).join('\n\n')
      if (hasDelete) {
        hunks.push({
          from: note[deleteFrom].from,
          to: note[deleteTo - 1].to,
          insert,
          kind: insert ? 'replace' : 'delete',
        })
        return
      }
      // Pure insertion: after the previous matched paragraph, or before the first match.
      const anchorIndex = isLeading ? firstMatchedNote : seg.noteFrom - 1
      const at = isLeading ? note[anchorIndex].from : note[anchorIndex].to
      hunks.push({ from: at, to: at, insert, kind: 'insert' })
    })
    noteCursor = pairs[pairs.length - 1][0] + 1
  }
  hunks.sort((a, b) => a.from - b.from)
  return { hunks, matched, changed: hunks.length, total: note.length }
}

function pad(text: string, from: number, to: number, insert: string): string {
  if (!insert) {
    // Delete: also swallow one separating blank line.
    return ''
  }
  const before = text.slice(Math.max(0, from - 2), from)
  const after = text.slice(to, to + 2)
  const lead =
    from === 0 || before.endsWith('\n\n')
      ? ''
      : before.endsWith('\n')
        ? '\n'
        : '\n\n'
  const trail =
    to >= text.length || after.startsWith('\n\n')
      ? ''
      : after.startsWith('\n')
        ? '\n'
        : '\n\n'
  return `${lead}${insert}${trail}`
}

/** Applies hunks bottom-up; returns the new text and the concrete edits made. */
export function applyParagraphPatch(
  noteText: string,
  patch: ParagraphPatch,
): { text: string; edits: { from: number; to: number; insert: string }[] } {
  let text = noteText
  const edits: { from: number; to: number; insert: string }[] = []
  for (const hunk of [...patch.hunks].sort((a, b) => b.from - a.from)) {
    let from = hunk.from
    let to = hunk.to
    let insert = hunk.insert
    if (hunk.kind === 'delete') {
      const after = text.slice(to, to + 2)
      if (after === '\n\n') to += 2
      else {
        const before = text.slice(Math.max(0, from - 2), from)
        if (before === '\n\n') from -= 2
      }
      insert = ''
    } else {
      insert = pad(text, from, to, insert)
    }
    text = text.slice(0, from) + insert + text.slice(to)
    edits.push({ from, to, insert })
  }
  return { text, edits: edits.reverse() }
}
