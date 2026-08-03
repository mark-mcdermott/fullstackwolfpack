import { describe, expect, it } from 'vitest'
import {
  applyCommand,
  checkGoals,
  gitSolutionSatisfiesGoals,
  initialState,
  runSession,
  type GitGoal,
} from './git-sim'

const run = (lines: string[]) => runSession(initialState(), lines).state

describe('git-sim — shell + init', () => {
  it('requires git init before other git commands', () => {
    const res = applyCommand(initialState(), 'git status')
    expect(res.error).toBe(true)
    expect(res.output).toMatch(/not a git repository/i)
  })

  it('echo > writes a working-tree file; cat reads it; ls lists it', () => {
    const s = run(['echo hello > a.txt'])
    expect(s.work['a.txt']).toBe('hello')
    expect(applyCommand(s, 'cat a.txt').output).toBe('hello')
    expect(applyCommand(s, 'ls').output).toBe('a.txt')
  })

  it('echo >> appends; quoted text is one argument', () => {
    const s = run(['echo "first line" > log', 'echo more >> log'])
    expect(s.work['log']).toBe('first linemore')
  })

  it('cat on a missing file errors without throwing', () => {
    const res = applyCommand(run(['git init']), 'cat nope')
    expect(res.error).toBe(true)
  })
})

describe('git-sim — the add/commit three-tree model', () => {
  it('touch → add → commit tracks the file and records the message', () => {
    const s = run([
      'git init',
      'touch readme.md',
      'echo hi > readme.md',
      'git add readme.md',
      'git commit -m "first commit"',
    ])
    expect(Object.keys(s.commits)).toHaveLength(1)
    const head = s.commits[s.branches.main!]
    expect(head.message).toBe('first commit')
    expect(head.tree['readme.md']).toBe('hi')
  })

  it('status distinguishes untracked, staged, and unstaged', () => {
    const base = run(['git init', 'echo v1 > f', 'git add f', 'git commit -m c1'])
    // new untracked file
    expect(applyCommand(base, 'git status').output).toMatch(/working tree clean/)
    const s1 = run([
      'git init',
      'echo v1 > f',
      'git add f',
      'git commit -m c1',
      'echo v2 > f', // modified, unstaged
      'echo x > new', // untracked
    ])
    const status = applyCommand(s1, 'git status').output
    expect(status).toMatch(/Changes not staged for commit/)
    expect(status).toMatch(/Untracked files/)
    expect(status).toContain('new')
  })

  it('commit with no -m, or nothing staged, is rejected', () => {
    const s = run(['git init', 'echo a > f', 'git add f'])
    expect(applyCommand(s, 'git commit').error).toBe(true)
    const committed = run(['git init', 'echo a > f', 'git add f', 'git commit -m c1'])
    expect(applyCommand(committed, 'git commit -m again').error).toBe(true)
  })

  it('git restore --staged unstages a file', () => {
    const s = run(['git init', 'echo a > f', 'git add f', 'git restore --staged f'])
    expect('f' in s.index).toBe(false)
  })

  it('git log --oneline lists commits newest-first', () => {
    const s = run([
      'git init',
      'echo 1 > f',
      'git add .',
      'git commit -m one',
      'echo 2 > f',
      'git add .',
      'git commit -m two',
    ])
    const lines = applyCommand(s, 'git log --oneline').output.split('\n')
    expect(lines[0]).toMatch(/two$/)
    expect(lines[1]).toMatch(/one$/)
  })
})

describe('git-sim — branching and merging', () => {
  const withMain = [
    'git init',
    'echo base > base.txt',
    'git add .',
    'git commit -m base',
  ]

  it('switch -c creates a branch and commits land on it', () => {
    const s = run([
      ...withMain,
      'git switch -c feature',
      'echo feat > feat.txt',
      'git add .',
      'git commit -m feat',
    ])
    expect('feature' in s.branches).toBe(true)
    expect(s.head).toBe('feature')
    expect(s.branches.feature).not.toBe(s.branches.main) // diverged
  })

  it('switching branches swaps the working tree', () => {
    const s = run([
      ...withMain,
      'git switch -c feature',
      'echo feat > feat.txt',
      'git add .',
      'git commit -m feat',
      'git switch main',
    ])
    expect('feat.txt' in s.work).toBe(false) // not on main
    expect(s.work['base.txt']).toBe('base')
  })

  it('fast-forward merge advances main to the feature tip', () => {
    const s = run([
      ...withMain,
      'git switch -c feature',
      'echo feat > feat.txt',
      'git add .',
      'git commit -m feat',
      'git switch main',
      'git merge feature',
    ])
    expect(s.branches.main).toBe(s.branches.feature)
    expect(s.work['feat.txt']).toBe('feat')
  })

  it('divergent branches produce a merge commit with two parents', () => {
    const s = run([
      ...withMain,
      'git switch -c feature',
      'echo feat > feat.txt',
      'git add .',
      'git commit -m feat',
      'git switch main',
      'echo mainwork > main.txt', // main diverges
      'git add .',
      'git commit -m mainwork',
      'git merge feature',
    ])
    const mergeCommit = s.commits[s.branches.main!]
    expect(mergeCommit.parent2).toBeTruthy()
    expect(s.work['feat.txt']).toBe('feat')
    expect(s.work['main.txt']).toBe('mainwork')
  })
})

describe('git-sim — goals', () => {
  const solved = run([
    'git init',
    'echo hi > a.txt',
    'git add a.txt',
    'git commit -m "add a"',
  ])

  const met = (goals: GitGoal[]) => checkGoals(solved, goals).map((o) => o.met)

  it('evaluates each goal type against final state', () => {
    expect(
      met([
        { type: 'initialized' },
        { type: 'commitCountAtLeast', count: 1 },
        { type: 'currentBranch', name: 'main' },
        { type: 'fileTracked', path: 'a.txt' },
        { type: 'committedFileEquals', path: 'a.txt', content: 'hi' },
        { type: 'commitMessageContains', text: 'add a' },
        { type: 'workingTreeClean' },
      ]),
    ).toEqual([true, true, true, true, true, true, true])
  })

  it('reports unmet goals', () => {
    expect(
      met([
        { type: 'commitCountAtLeast', count: 2 },
        { type: 'branchExists', name: 'feature' },
        { type: 'committedFileEquals', path: 'a.txt', content: 'wrong' },
      ]),
    ).toEqual([false, false, false])
  })

  it('fileStaged is true only for a staged-not-committed change', () => {
    const staged = run(['git init', 'echo x > f', 'git add f'])
    expect(checkGoals(staged, [{ type: 'fileStaged', path: 'f' }])[0].met).toBe(true)
    // after commit it is tracked, not "staged"
    const committed = applyCommand(staged, 'git commit -m c').state
    expect(checkGoals(committed, [{ type: 'fileStaged', path: 'f' }])[0].met).toBe(false)
  })

  it('mergedInto detects a branch folded into another', () => {
    const s = run([
      'git init',
      'echo b > base',
      'git add .',
      'git commit -m base',
      'git switch -c feature',
      'echo f > feat',
      'git add .',
      'git commit -m feat',
      'git switch main',
      'git merge feature',
    ])
    expect(checkGoals(s, [{ type: 'mergedInto', branch: 'main', from: 'feature' }])[0].met).toBe(true)
  })
})

describe('git-sim — solution ship gate', () => {
  it('passes when the solution satisfies every goal', () => {
    expect(
      gitSolutionSatisfiesGoals(
        undefined,
        ['git init', 'echo hi > a.txt', 'git add a.txt', 'git commit -m "first"'],
        [
          { type: 'commitCountAtLeast', count: 1 },
          { type: 'fileTracked', path: 'a.txt' },
        ],
      ),
    ).toBe(true)
  })

  it('fails when the solution does not (e.g. forgot to commit)', () => {
    expect(
      gitSolutionSatisfiesGoals(
        undefined,
        ['git init', 'echo hi > a.txt', 'git add a.txt'],
        [{ type: 'commitCountAtLeast', count: 1 }],
      ),
    ).toBe(false)
  })

  it('runs setup commands before the solution', () => {
    expect(
      gitSolutionSatisfiesGoals(
        ['git init', 'echo base > base', 'git add .', 'git commit -m base'],
        ['git switch -c feature'],
        [{ type: 'branchExists', name: 'feature' }, { type: 'currentBranch', name: 'feature' }],
      ),
    ).toBe(true)
  })

  it('is deterministic (same commands → same result)', () => {
    const lines = ['git init', 'echo a > f', 'git add .', 'git commit -m c']
    expect(JSON.stringify(run(lines))).toBe(JSON.stringify(run(lines)))
  })
})
