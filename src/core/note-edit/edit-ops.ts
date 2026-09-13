/**
 * Deterministic note edits (R-041). The model emits operations anchored to
 * text that already exists in the note; applying them is pure string work.
 * No model call happens on Apply.
 */
export type EditOpKind =
  | 'replace'
  | 'insert-after'
  | 'insert-before'
  | 'append-section'

export type EditOp = {
  op: EditOpKind
  /** Text copied verbatim from the note (replace / insert-*). */
  anchor?: string
  /** For replace: last text of the range when it spans more than the anchor. */
  until?: string
  /** For append-section: heading text or `## Heading` line. */
  heading?: string
  content: string
}

export type AnchorMatch = {
  from: number
  to: number
  method: 'exact' | 'normalized' | 'fuzzy'
  score: number
}

export type LocateResult =
  | { status: 'found'; match: AnchorMatch }
  | { status: 'ambiguous'; candidates: AnchorMatch[] }
  | { status: 'not-found' }

export type ApplyResult =
  | {
      status: 'applied'
      text: string
      from: number
      to: number
      insertedLength: number
    }
  | { status: 'failed'; reason: string; candidates?: AnchorMatch[] }

const FUZZY_THRESHOLD = 0.75
const FUZZY_MARGIN = 0.08

/** Collapse whitespace and unify curly quotes; keep an index map back to the source. */
export function normalizeForMatch(text: string): {
  value: string
  map: number[]
} {
  const out: string[] = []
  const map: number[] = []
  let lastSpace = true
  for (let i = 0; i < text.length; i += 1) {
    let ch = text[i]
    if (ch === '​' || ch === '﻿') continue
    if (/\s/.test(ch)) {
      if (lastSpace) continue
      ch = ' '
      lastSpace = true
    } else {
      lastSpace = false
    }
    if ('“”„″'.includes(ch)) ch = '"'
    else if ('‘’‚′'.includes(ch)) ch = "'"
    out.push(ch)
    map.push(i)
  }
  while (out.length && out[out.length - 1] === ' ') {
    out.pop()
    map.pop()
  }
  return { value: out.join(''), map }
}

function allIndexes(haystack: string, needle: string): number[] {
  const result: number[] = []
  if (!needle) return result
  let index = haystack.indexOf(needle)
  while (index !== -1) {
    result.push(index)
    index = haystack.indexOf(needle, index + 1)
  }
  return result
}

function bigrams(value: string): Map<string, number> {
  const grams = new Map<string, number>()
  const compact = value.replace(/\s+/g, '')
  for (let i = 0; i < compact.length - 1; i += 1) {
    const gram = compact.slice(i, i + 2)
    grams.set(gram, (grams.get(gram) ?? 0) + 1)
  }
  return grams
}

function levenshteinSimilarity(a: string, b: string): number {
  const x = a.replace(/\s+/g, '')
  const y = b.replace(/\s+/g, '')
  if (!x.length && !y.length) return 1
  if (!x.length || !y.length) return 0
  let prev = Array.from({ length: y.length + 1 }, (_, i) => i)
  for (let i = 1; i <= x.length; i += 1) {
    const cur = [i]
    for (let j = 1; j <= y.length; j += 1) {
      cur[j] = Math.min(
        prev[j] + 1,
        cur[j - 1] + 1,
        prev[j - 1] + (x[i - 1] === y[j - 1] ? 0 : 1),
      )
    }
    prev = cur
  }
  return 1 - prev[y.length] / Math.max(x.length, y.length)
}

/** Bigram Dice with a Levenshtein floor, so short CJK sentences are not punished. */
export function similarity(a: string, b: string): number {
  return Math.max(diceSimilarity(a, b), levenshteinSimilarity(a, b))
}

export function diceSimilarity(a: string, b: string): number {
  const ga = bigrams(a)
  const gb = bigrams(b)
  if (ga.size === 0 || gb.size === 0) return a === b ? 1 : 0
  let overlap = 0
  for (const [gram, count] of ga) {
    overlap += Math.min(count, gb.get(gram) ?? 0)
  }
  const total =
    [...ga.values()].reduce((s, n) => s + n, 0) +
    [...gb.values()].reduce((s, n) => s + n, 0)
  return (2 * overlap) / total
}

/** Sentence-ish segments with their source offsets, used for fuzzy matching. */
function segments(text: string): { from: number; to: number; value: string }[] {
  const result: { from: number; to: number; value: string }[] = []
  const re = /[^\n.!?。]+[.!?。]?\s*/g
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    const raw = m[0]
    const lead = raw.length - raw.trimStart().length
    const trail = raw.length - raw.trimEnd().length
    if (raw.trim().length === 0) continue
    result.push({
      from: m.index + lead,
      to: m.index + raw.length - trail,
      value: raw.trim(),
    })
  }
  return result
}

export function locateAnchor(text: string, anchor: string): LocateResult {
  const needle = anchor.trim()
  if (!needle) return { status: 'not-found' }

  const exact = allIndexes(text, needle)
  if (exact.length === 1) {
    return {
      status: 'found',
      match: {
        from: exact[0],
        to: exact[0] + needle.length,
        method: 'exact',
        score: 1,
      },
    }
  }
  if (exact.length > 1) {
    return {
      status: 'ambiguous',
      candidates: exact.map((from) => ({
        from,
        to: from + needle.length,
        method: 'exact',
        score: 1,
      })),
    }
  }

  const normText = normalizeForMatch(text)
  const normNeedle = normalizeForMatch(needle).value
  const normHits = allIndexes(normText.value, normNeedle)
  if (normHits.length >= 1) {
    const candidates: AnchorMatch[] = normHits.map((i) => ({
      from: normText.map[i],
      to: normText.map[i + normNeedle.length - 1] + 1,
      method: 'normalized',
      score: 0.98,
    }))
    return normHits.length === 1
      ? { status: 'found', match: candidates[0] }
      : { status: 'ambiguous', candidates }
  }

  // Fuzzy: compare against sentence segments and pairs of adjacent segments.
  const segs = segments(text)
  const scored: AnchorMatch[] = []
  for (let i = 0; i < segs.length; i += 1) {
    const single = segs[i]
    scored.push({
      from: single.from,
      to: single.to,
      method: 'fuzzy',
      score: similarity(normNeedle, normalizeForMatch(single.value).value),
    })
    if (i + 1 < segs.length) {
      const pair = text.slice(single.from, segs[i + 1].to)
      scored.push({
        from: single.from,
        to: segs[i + 1].to,
        method: 'fuzzy',
        score: similarity(normNeedle, normalizeForMatch(pair).value),
      })
    }
  }
  scored.sort((a, b) => b.score - a.score)
  const best = scored[0]
  if (!best || best.score < FUZZY_THRESHOLD) return { status: 'not-found' }
  const runnerUp = scored.find(
    (c) => c !== best && (c.from >= best.to || c.to <= best.from),
  )
  if (runnerUp && best.score - runnerUp.score < FUZZY_MARGIN) {
    return { status: 'ambiguous', candidates: scored.slice(0, 5) }
  }
  return { status: 'found', match: best }
}

type Heading = { level: number; title: string; from: number; lineEnd: number }

function headings(text: string): Heading[] {
  const result: Heading[] = []
  const re = /^(#{1,6})[ \t]+(.+?)[ \t]*#*[ \t]*$/gm
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    result.push({
      level: m[1].length,
      title: m[2].trim(),
      from: m.index,
      lineEnd: m.index + m[0].length,
    })
  }
  return result
}

/** `## Title`, `Title`, or `A > B` (last segment wins). Returns the section body range. */
export function findSection(
  text: string,
  headingSpec: string,
): { headingFrom: number; bodyFrom: number; bodyTo: number } | null {
  const spec = headingSpec.trim().split('>').pop()?.trim() ?? ''
  const wanted = normalizeForMatch(
    spec.replace(/^#{1,6}\s*/, ''),
  ).value.toLowerCase()
  if (!wanted) return null
  const all = headings(text)
  const index = all.findIndex(
    (h) => normalizeForMatch(h.title).value.toLowerCase() === wanted,
  )
  if (index === -1) return null
  const heading = all[index]
  const next = all.slice(index + 1).find((h) => h.level <= heading.level)
  return {
    headingFrom: heading.from,
    bodyFrom: heading.lineEnd,
    bodyTo: next ? next.from : text.length,
  }
}

function paragraphEnd(text: string, offset: number): number {
  const blank = text.indexOf('\n\n', offset)
  const end = blank === -1 ? text.length : blank
  return end
}

function paragraphStart(text: string, offset: number): number {
  const blank = text.lastIndexOf('\n\n', Math.max(0, offset - 1))
  return blank === -1 ? 0 : blank + 2
}

function blockify(content: string): string {
  return `\n\n${content.trim()}\n\n`
}

function splice(
  text: string,
  from: number,
  to: number,
  insert: string,
): ApplyResult {
  const next = text.slice(0, from) + insert + text.slice(to)
  return {
    status: 'applied',
    text: next,
    from,
    to,
    insertedLength: insert.length,
  }
}

function collapseBlankRuns(text: string, around: number): string {
  // Keep at most one blank line where we inserted block content.
  const start = Math.max(0, around - 4)
  const head = text.slice(0, start)
  const tail = text.slice(start).replace(/\n{3,}/g, '\n\n')
  return head + tail
}

export function applyEditOp(text: string, op: EditOp): ApplyResult {
  const content = op.content.replace(/\r\n/g, '\n')
  if (op.op === 'append-section') {
    if (!op.heading)
      return { status: 'failed', reason: 'append-section needs a heading.' }
    const section = findSection(text, op.heading)
    if (!section)
      return { status: 'failed', reason: `Heading "${op.heading}" not found.` }
    const bodyTrimmedEnd = text
      .slice(0, section.bodyTo)
      .replace(/\s+$/, '').length
    const result = splice(
      text,
      bodyTrimmedEnd,
      section.bodyTo,
      blockify(content) + (section.bodyTo === text.length ? '' : ''),
    )
    if (result.status === 'applied')
      result.text = collapseBlankRuns(result.text, bodyTrimmedEnd)
    return result
  }
  if (!op.anchor)
    return { status: 'failed', reason: `${op.op} needs an anchor.` }
  const located = locateAnchor(text, op.anchor)
  if (located.status === 'not-found') {
    return {
      status: 'failed',
      reason: 'Anchor text was not found in the note.',
    }
  }
  if (located.status === 'ambiguous') {
    return {
      status: 'failed',
      reason: `Anchor text appears ${located.candidates.length} times; pick the spot manually.`,
      candidates: located.candidates,
    }
  }
  const { from, to } = located.match
  if (op.op === 'replace') {
    let end = to
    if (op.until) {
      const untilLocated = locateAnchor(text.slice(to), op.until)
      if (untilLocated.status !== 'found') {
        return {
          status: 'failed',
          reason: 'The "until" text was not found after the anchor.',
        }
      }
      end = to + untilLocated.match.to
    }
    return splice(text, from, end, content.trim())
  }
  if (op.op === 'insert-after') {
    const at = paragraphEnd(text, to)
    const result = splice(text, at, at, blockify(content))
    if (result.status === 'applied')
      result.text = collapseBlankRuns(result.text, at)
    return result
  }
  const at = paragraphStart(text, from)
  const result = splice(text, at, at, `${content.trim()}\n\n`)
  return result
}
