// Release preflight: what else is in flight before a version is cut.
//
// 1.3.0 shipped while a contributor's integration PR (#41) sat open. It also
// reused research IDs that PR had already taken (R-044/R-045). This script
// catches both before tagging, from git and GitHub state alone (R-051).
//
//   node scripts/release-preflight.mjs                    # report, exit 1 on findings
//   node scripts/release-preflight.mjs --ack 41 --ack feat/x   # acknowledged items pass
//
// Checks:
//   1. Open pull requests against main (gh CLI).
//   2. Remote branches with commits that main does not have.
//   3. Research report IDs that two different files claim, across main and
//      every remote branch.
// Items passed with --ack are still printed but do not fail the run, so a
// deliberate "ship without #41" decision is written in the command line.
import { execFileSync } from 'node:child_process'

const args = process.argv.slice(2)
const acknowledged = new Set()
for (let index = 0; index < args.length; index += 1) {
  if (args[index] === '--ack' && args[index + 1]) {
    acknowledged.add(args[index + 1].replace(/^#/, ''))
    index += 1
  }
}

const run = (command, commandArgs) =>
  execFileSync(command, commandArgs, { encoding: 'utf8' }).trim()
const lines = (text) => (text ? text.split('\n').filter(Boolean) : [])

run('git', ['fetch', '--quiet', '--prune', 'origin'])
const currentBranch = run('git', ['rev-parse', '--abbrev-ref', 'HEAD'])
const findings = []
const report = (key, message) => {
  const ok = acknowledged.has(key)
  findings.push({ ok, message })
}

// 1. Open pull requests.
let pulls = []
try {
  pulls = JSON.parse(
    run('gh', [
      'pr',
      'list',
      '--state',
      'open',
      '--base',
      'main',
      '--json',
      'number,title,headRefName,author',
    ]),
  )
} catch (error) {
  findings.push({
    ok: false,
    message: `Could not list pull requests with gh: ${error.message.split('\n')[0]}`,
  })
}
for (const pull of pulls) {
  if (pull.headRefName === currentBranch) continue
  report(
    String(pull.number),
    `Open PR #${pull.number} (${pull.headRefName}, ${pull.author?.login ?? 'unknown'}): ${pull.title}`,
  )
}

// 2. Unmerged remote branches.
const remoteBranches = lines(
  run('git', ['for-each-ref', '--format=%(refname:short)', 'refs/remotes/origin']),
).filter((ref) => ref !== 'origin/main' && ref !== 'origin/HEAD' && ref !== 'origin')
for (const ref of remoteBranches) {
  const branch = ref.replace(/^origin\//, '')
  if (branch === currentBranch) continue
  const ahead = Number(run('git', ['rev-list', '--count', `origin/main..${ref}`]))
  if (ahead > 0) {
    report(branch, `Remote branch ${branch} has ${ahead} commit(s) not on main`)
  }
}

// 3. Research ID collisions.
const owners = new Map()
for (const ref of ['HEAD', 'origin/main', ...remoteBranches]) {
  const files = lines(
    run('git', ['ls-tree', '--name-only', ref, 'docs/research/']),
  )
  for (const file of files) {
    const match = /docs\/research\/(R-\d{3})-(.+)\.md$/.exec(file)
    if (!match) continue
    const [, id, slug] = match
    if (!owners.has(id)) owners.set(id, new Map())
    const slugs = owners.get(id)
    if (!slugs.has(slug)) slugs.set(slug, ref)
  }
}
for (const [id, slugs] of [...owners].sort()) {
  if (slugs.size < 2) continue
  const claims = [...slugs].map(([slug, ref]) => `${slug} (${ref})`).join(', ')
  report(id, `Research ID ${id} is claimed by different reports: ${claims}`)
}

const blocking = findings.filter((finding) => !finding.ok)
for (const finding of findings) {
  console.log(`${finding.ok ? 'ACK ' : 'FAIL'} ${finding.message}`)
}
if (findings.length === 0) {
  console.log('Release preflight clean: no open PRs, unmerged branches, or research ID collisions.')
}
if (blocking.length > 0) {
  console.error(
    `\n${blocking.length} item(s) need a decision before tagging. Merge or close them, ` +
      'or pass --ack <PR number | branch | R-###> to ship without them on purpose.',
  )
  process.exit(1)
}
