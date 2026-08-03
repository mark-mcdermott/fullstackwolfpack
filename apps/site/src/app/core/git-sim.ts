import { z } from 'zod'

// A tiny, deterministic git + shell simulator for the terminal/git exercise lane
// (docs/terminal-lane-plan.md). Pure and self-contained: no Date/Math.random, no
// I/O — so it runs identically in the browser, in tests, and in the gen:builtins
// ship gate, and success is checked by asserting against model state. It models a
// curated teaching subset of git (the real three-tree model: working dir, index,
// commits/branches), not a faithful reimplementation.

export type Tree = Record<string, string> // path -> file content

export type GitCommit = {
  id: string
  message: string
  parent: string | null
  parent2?: string | null // second parent for a merge commit
  tree: Tree
}

export type GitState = {
  initialized: boolean
  work: Tree // working directory
  index: Tree // staging area
  head: string // current branch name
  branches: Record<string, string | null> // name -> commit id (null = unborn)
  commits: Record<string, GitCommit>
  seq: number // deterministic commit-id counter
}

export function initialState(): GitState {
  return {
    initialized: false,
    work: {},
    index: {},
    head: 'main',
    branches: {},
    commits: {},
    seq: 1,
  }
}

const clone = (s: GitState): GitState =>
  JSON.parse(JSON.stringify(s)) as GitState

const treeEqual = (a: Tree, b: Tree): boolean => {
  const ak = Object.keys(a)
  const bk = Object.keys(b)
  return ak.length === bk.length && ak.every((k) => a[k] === b[k])
}

function headCommitId(s: GitState): string | null {
  return s.branches[s.head] ?? null
}

function treeOf(s: GitState, commitId: string | null): Tree {
  return commitId ? { ...s.commits[commitId].tree } : {}
}

function headTree(s: GitState): Tree {
  return treeOf(s, headCommitId(s))
}

// Commit ids reachable from a starting commit, following both parents.
function ancestors(s: GitState, start: string | null): Set<string> {
  const seen = new Set<string>()
  const stack = start ? [start] : []
  while (stack.length) {
    const id = stack.pop()!
    if (seen.has(id)) continue
    seen.add(id)
    const c = s.commits[id]
    if (c?.parent) stack.push(c.parent)
    if (c?.parent2) stack.push(c.parent2)
  }
  return seen
}

// ---- Shell + git command tokenizer ----

// Splits a command line into tokens, honoring single/double quotes and treating
// `>`/`>>` redirection operators as their own tokens.
function tokenize(line: string): string[] {
  const tokens: string[] = []
  let cur = ''
  let quote: string | null = null
  const flush = () => {
    if (cur) {
      tokens.push(cur)
      cur = ''
    }
  }
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (quote) {
      if (ch === quote) quote = null
      else cur += ch
    } else if (ch === '"' || ch === "'") {
      quote = ch
    } else if (ch === ' ' || ch === '\t') {
      flush()
    } else if (ch === '>') {
      flush()
      if (line[i + 1] === '>') {
        tokens.push('>>')
        i++
      } else {
        tokens.push('>')
      }
    } else {
      cur += ch
    }
  }
  flush()
  return tokens
}

export type CommandResult = { state: GitState; output: string; error?: boolean }

const ok = (state: GitState, output = ''): CommandResult => ({ state, output })
const fail = (state: GitState, output: string): CommandResult => ({
  state,
  output,
  error: true,
})

// ---- Individual commands ----

function cmdEcho(state: GitState, args: string[]): CommandResult {
  const redir = args.findIndex((a) => a === '>' || a === '>>')
  const text = (redir === -1 ? args : args.slice(0, redir)).join(' ')
  if (redir === -1) return ok(state, text)
  const file = args[redir + 1]
  if (!file) return fail(state, 'echo: syntax error near redirection')
  const s = clone(state)
  // Simulator liberty: write exactly the text (no trailing newline) so
  // content-equality goals are intuitive to author.
  s.work[file] = args[redir] === '>>' ? (s.work[file] ?? '') + text : text
  return ok(s)
}

function cmdCat(state: GitState, args: string[]): CommandResult {
  const file = args[0]
  if (file === undefined || !(file in state.work)) {
    return fail(state, `cat: ${file ?? ''}: No such file`)
  }
  return ok(state, state.work[file])
}

function cmdTouch(state: GitState, args: string[]): CommandResult {
  if (!args.length) return fail(state, 'touch: missing file operand')
  const s = clone(state)
  for (const f of args) s.work[f] = s.work[f] ?? ''
  return ok(s)
}

function cmdRm(state: GitState, args: string[]): CommandResult {
  const files = args.filter((a) => a !== '-f' && !a.startsWith('-'))
  const s = clone(state)
  for (const f of files) delete s.work[f]
  return ok(s)
}

function cmdLs(state: GitState): CommandResult {
  return ok(state, Object.keys(state.work).sort().join('\n'))
}

function gitInit(state: GitState): CommandResult {
  if (state.initialized) {
    return ok(state, 'Reinitialized existing Git repository')
  }
  const s = clone(state)
  s.initialized = true
  s.head = 'main'
  s.branches = { main: null }
  return ok(s, 'Initialized empty Git repository')
}

function gitAdd(state: GitState, args: string[]): CommandResult {
  const s = clone(state)
  const targets = args.includes('.') || args.includes('-A')
    ? Object.keys(s.work)
    : args
  const head = headTree(s)
  for (const p of targets) {
    if (p in s.work) s.index[p] = s.work[p]
    else if (p in head) delete s.index[p] // stage a deletion
  }
  return ok(s)
}

function gitRestoreStaged(state: GitState, args: string[]): CommandResult {
  const s = clone(state)
  const head = headTree(s)
  for (const p of args) {
    if (p in head) s.index[p] = head[p]
    else delete s.index[p]
  }
  return ok(s)
}

function gitCommit(state: GitState, args: string[]): CommandResult {
  const mi = args.findIndex((a) => a === '-m')
  const message = mi !== -1 ? args[mi + 1] : undefined
  if (!message) return fail(state, 'commit: missing -m "message"')
  const parent = headCommitId(state)
  if (parent && treeEqual(state.index, treeOf(state, parent))) {
    return fail(state, 'nothing to commit, working tree clean')
  }
  if (!parent && Object.keys(state.index).length === 0) {
    return fail(state, 'nothing to commit')
  }
  const s = clone(state)
  const id = `c${s.seq++}`
  s.commits[id] = { id, message, parent, tree: { ...s.index } }
  s.branches[s.head] = id
  return ok(s, `[${s.head} ${id}] ${message}`)
}

function statusText(s: GitState): string {
  const head = headTree(s)
  const staged: string[] = []
  const unstaged: string[] = []
  const untracked: string[] = []
  const paths = new Set([
    ...Object.keys(head),
    ...Object.keys(s.index),
    ...Object.keys(s.work),
  ])
  for (const p of [...paths].sort()) {
    const inHead = p in head
    const inIndex = p in s.index
    const inWork = p in s.work
    if (inIndex && (!inHead || s.index[p] !== head[p])) staged.push(p)
    if (inHead && !inIndex) staged.push(`deleted: ${p}`)
    if (inWork && inIndex && s.work[p] !== s.index[p]) unstaged.push(p)
    if (inWork && !inIndex) untracked.push(p)
  }
  const lines = [`On branch ${s.head}`]
  if (staged.length) lines.push('Changes to be committed:', ...staged.map((p) => `\t${p}`))
  if (unstaged.length) lines.push('Changes not staged for commit:', ...unstaged.map((p) => `\t${p}`))
  if (untracked.length) lines.push('Untracked files:', ...untracked.map((p) => `\t${p}`))
  if (!staged.length && !unstaged.length && !untracked.length) {
    lines.push('nothing to commit, working tree clean')
  }
  return lines.join('\n')
}

function gitLog(state: GitState, args: string[]): CommandResult {
  const oneline = args.includes('--oneline')
  const out: string[] = []
  let id = headCommitId(state)
  while (id) {
    const c = state.commits[id]
    out.push(oneline ? `${c.id} ${c.message}` : `commit ${c.id}\n\n    ${c.message}\n`)
    id = c.parent
  }
  return ok(state, out.join('\n'))
}

function gitBranch(state: GitState, args: string[]): CommandResult {
  const names = args.filter((a) => !a.startsWith('-'))
  if (!names.length) {
    const list = Object.keys(state.branches)
      .sort()
      .map((b) => (b === state.head ? `* ${b}` : `  ${b}`))
    return ok(state, list.join('\n'))
  }
  const s = clone(state)
  for (const name of names) s.branches[name] = headCommitId(s)
  return ok(s)
}

function switchTo(state: GitState, name: string, create: boolean): CommandResult {
  const s = clone(state)
  if (create) {
    if (name in s.branches) return fail(state, `branch '${name}' already exists`)
    s.branches[name] = headCommitId(s)
  } else if (!(name in s.branches)) {
    return fail(state, `pathspec '${name}' did not match`)
  }
  s.head = name
  const tree = treeOf(s, s.branches[name])
  s.index = { ...tree }
  s.work = { ...tree }
  return ok(s, create ? `Switched to a new branch '${name}'` : `Switched to branch '${name}'`)
}

function gitMerge(state: GitState, args: string[]): CommandResult {
  const name = args.find((a) => !a.startsWith('-'))
  if (!name || !(name in state.branches)) {
    return fail(state, `merge: '${name ?? ''}' - not something we can merge`)
  }
  const target = state.branches[name]
  const current = headCommitId(state)
  if (!target) return fail(state, `merge: '${name}' has no commits`)
  if (current === target) return ok(state, 'Already up to date.')
  const s = clone(state)
  // Fast-forward when the current tip is an ancestor of the target.
  if (!current || ancestors(s, target).has(current)) {
    s.branches[s.head] = target
    const tree = treeOf(s, target)
    s.index = { ...tree }
    s.work = { ...tree }
    return ok(s, `Fast-forward to ${target}`)
  }
  // Otherwise a merge commit — target's files win on overlap (no conflict model).
  const merged = { ...treeOf(s, current), ...treeOf(s, target) }
  const id = `c${s.seq++}`
  s.commits[id] = { id, message: `Merge branch '${name}'`, parent: current, parent2: target, tree: merged }
  s.branches[s.head] = id
  s.index = { ...merged }
  s.work = { ...merged }
  return ok(s, `Merge made by the 'recursive' strategy. [${id}]`)
}

function runGit(state: GitState, args: string[]): CommandResult {
  const [sub, ...rest] = args
  if (sub !== 'init' && !state.initialized) {
    return fail(state, 'fatal: not a git repository (run `git init`)')
  }
  switch (sub) {
    case 'init':
      return gitInit(state)
    case 'add':
      return gitAdd(state, rest)
    case 'restore':
      return rest[0] === '--staged'
        ? gitRestoreStaged(state, rest.slice(1))
        : fail(state, 'restore: only `--staged` is supported')
    case 'commit':
      return gitCommit(state, rest)
    case 'status':
      return ok(state, statusText(state))
    case 'log':
      return gitLog(state, rest)
    case 'branch':
      return gitBranch(state, rest)
    case 'switch': {
      const create = rest[0] === '-c'
      const name = create ? rest[1] : rest[0]
      return name ? switchTo(state, name, create) : fail(state, 'switch: missing branch')
    }
    case 'checkout': {
      const create = rest[0] === '-b'
      const name = create ? rest[1] : rest[0]
      return name ? switchTo(state, name, create) : fail(state, 'checkout: missing branch')
    }
    case 'merge':
      return gitMerge(state, rest)
    default:
      return fail(state, `git: '${sub ?? ''}' is not a supported command`)
  }
}

// Apply one command line to the state, returning the new state + terminal output.
// Never throws — unknown/invalid commands return an error result.
export function applyCommand(state: GitState, line: string): CommandResult {
  const args = tokenize(line.trim())
  if (!args.length) return ok(state)
  const [cmd, ...rest] = args
  switch (cmd) {
    case 'git':
      return runGit(state, rest)
    case 'echo':
      return cmdEcho(state, rest)
    case 'cat':
      return cmdCat(state, rest)
    case 'touch':
      return cmdTouch(state, rest)
    case 'rm':
      return cmdRm(state, rest)
    case 'ls':
      return cmdLs(state)
    case 'pwd':
      return ok(state, '/repo')
    case 'mkdir':
      return ok(state) // dirs are implicit in the flat file model
    case 'clear':
      return ok(state)
    default:
      return fail(state, `${cmd}: command not found`)
  }
}

export type TranscriptEntry = { command: string; output: string; error?: boolean }

// Run a sequence of command lines from a starting state.
export function runSession(
  state: GitState,
  lines: string[],
): { state: GitState; transcript: TranscriptEntry[] } {
  let cur = state
  const transcript: TranscriptEntry[] = []
  for (const line of lines) {
    if (!line.trim()) continue
    const res = applyCommand(cur, line)
    cur = res.state
    transcript.push({ command: line, output: res.output, error: res.error })
  }
  return { state: cur, transcript }
}

// ---- Goals (success criteria) ----

// Zod is the single source of truth so the same shape validates the seeded
// exercise config and the client lesson-view. `GitGoal` is inferred from it.
export const gitGoalSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('initialized') }),
  z.object({ type: z.literal('commitCountAtLeast'), count: z.number().int() }),
  z.object({ type: z.literal('branchExists'), name: z.string() }),
  z.object({ type: z.literal('currentBranch'), name: z.string() }),
  z.object({ type: z.literal('fileStaged'), path: z.string() }),
  z.object({ type: z.literal('fileTracked'), path: z.string() }),
  z.object({
    type: z.literal('committedFileEquals'),
    path: z.string(),
    content: z.string(),
  }),
  z.object({ type: z.literal('commitMessageContains'), text: z.string() }),
  z.object({ type: z.literal('workingTreeClean') }),
  z.object({ type: z.literal('mergedInto'), branch: z.string(), from: z.string() }),
])
export type GitGoal = z.infer<typeof gitGoalSchema>

export type GoalOutcome = { met: boolean; label: string }

function evalGoal(s: GitState, g: GitGoal): GoalOutcome {
  const head = headTree(s)
  switch (g.type) {
    case 'initialized':
      return { met: s.initialized, label: 'Repository is initialized' }
    case 'commitCountAtLeast': {
      const n = ancestors(s, headCommitId(s)).size
      return { met: n >= g.count, label: `At least ${g.count} commit(s)` }
    }
    case 'branchExists':
      return { met: g.name in s.branches, label: `Branch "${g.name}" exists` }
    case 'currentBranch':
      return { met: s.head === g.name, label: `On branch "${g.name}"` }
    case 'fileStaged': {
      const staged = g.path in s.index && s.index[g.path] !== head[g.path]
      return { met: staged, label: `"${g.path}" is staged` }
    }
    case 'fileTracked':
      return { met: g.path in head, label: `"${g.path}" is committed` }
    case 'committedFileEquals':
      return {
        met: head[g.path] === g.content,
        label: `"${g.path}" has the expected contents`,
      }
    case 'commitMessageContains': {
      const hit = Object.values(s.commits).some((c) => c.message.includes(g.text))
      return { met: hit, label: `A commit message contains "${g.text}"` }
    }
    case 'workingTreeClean':
      return {
        met: treeEqual(s.work, s.index) && treeEqual(s.index, head),
        label: 'Working tree is clean',
      }
    case 'mergedInto': {
      const tip = s.branches[g.branch]
      const from = s.branches[g.from]
      const met = !!tip && !!from && ancestors(s, tip).has(from)
      return { met, label: `"${g.from}" is merged into "${g.branch}"` }
    }
  }
}

// Evaluate every goal against a final state.
export function checkGoals(state: GitState, goals: GitGoal[]): GoalOutcome[] {
  return goals.map((g) => evalGoal(state, g))
}

// Ship gate: run optional setup commands, then the solution, and confirm every
// goal is met. Mirrors solutionPassesTests for JS exercises — used at build time
// (gen:builtins) and in the seed-content test to keep broken git exercises from
// shipping.
export function gitSolutionSatisfiesGoals(
  setup: string[] | undefined,
  solution: string[],
  goals: GitGoal[],
): boolean {
  const afterSetup = runSession(initialState(), setup ?? []).state
  const final = runSession(afterSetup, solution).state
  return goals.length > 0 && checkGoals(final, goals).every((o) => o.met)
}
