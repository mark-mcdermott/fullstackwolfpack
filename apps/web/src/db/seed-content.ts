import type { GitGoal } from '../core/git-sim'
import { GENERATED_BUILTIN_COURSES } from './seed-content.generated'

// Built-in starter course(s), seeded as shared courses (ownerUserId = null) so
// every user has real content to learn before generating their own. Pure +
// typed; ids are fixed so the seed runner (scripts/seed.ts) is idempotent.

export type SeedQuestion = {
  id: string
  type?: 'mcq' | 'short_answer' // defaults to mcq
  prompt: string
  options?: string[] // mcq only
  correctIndex?: number // mcq only
  expectedAnswer?: string // short_answer: the reference the AI grades against
  explanation: string
}

// A Phase 4 code exercise. `tests` match core/exercise.ts (evaluate `expression`
// against the learner's code and deep-compare to `expected`).
export type SeedJsExercise = {
  id: string
  kind?: 'js' // default; absent ⇒ 'js'
  prompt: string
  // Authoring language; the runner type-strips 'ts' to JS. Absent ⇒ 'js'.
  language?: 'js' | 'ts'
  starterCode: string
  tests: { name: string; expression: string; expected: unknown }[]
  solution: string
  hint: string
}

// A terminal/git exercise (core/git-sim.ts): the learner types shell commands,
// success is `goals` asserted against the final repo state, `solution` is the
// command sequence that satisfies them, `setup` pre-runs before the learner.
export type SeedGitExercise = {
  id: string
  kind: 'git'
  prompt: string
  setup?: string[]
  goals: GitGoal[]
  solution: string[]
  hint: string
}

export type SeedExercise = SeedJsExercise | SeedGitExercise

export type SeedSegment = {
  id: string
  type: 'reading' | 'code' | 'practice' | 'quiz'
  title: string
  markdown: string
  estMinutes: number
  questions: SeedQuestion[]
  exercise?: SeedExercise
}

export type SeedLesson = {
  id: string
  title: string
  estMinutes: number
  // Key terms the lesson introduces — linkified to further reading when the user
  // opts into "hyperlink key terms". Absent ⇒ no links (matches lessons.glossary).
  glossary?: string[]
  segments: SeedSegment[]
}

export type SeedCourse = {
  id: string
  topicSlug: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  lessons: SeedLesson[]
}

export const BUILTIN_COURSES: SeedCourse[] = [
  {
    id: 'builtin-git-github',
    topicSlug: 'git-github',
    difficulty: 'beginner',
    lessons: [
      {
        id: 'builtin-git-l1',
        title: 'Git Fundamentals',
        estMinutes: 6,
        segments: [
          {
            id: 'builtin-git-l1-s1',
            type: 'reading',
            title: 'What is Git?',
            estMinutes: 2,
            markdown:
              '**Git** is a distributed version-control system. It records **snapshots** of your project over time so you can review history, undo mistakes, and collaborate without overwriting each other.\n\nEach saved snapshot is a **commit** — a checkpoint you can always return to.',
            questions: [],
          },
          {
            id: 'builtin-git-l1-s2',
            type: 'code',
            title: 'Your first commit',
            estMinutes: 2,
            markdown:
              'Start tracking a project and save your first snapshot:\n\n```bash\ngit init          # start a repo\ngit add .         # stage your changes\ngit commit -m "First commit"\n```\n\n`add` moves changes into the **staging area**; `commit` records them as a snapshot.',
            questions: [],
          },
          {
            id: 'builtin-git-l1-s3',
            type: 'quiz',
            title: 'Check yourself',
            estMinutes: 2,
            markdown: 'A quick check before moving on.',
            questions: [
              {
                id: 'builtin-git-l1-q1',
                prompt: 'Which command stages a file for the next commit?',
                options: ['git commit', 'git add', 'git push', 'git log'],
                correctIndex: 1,
                explanation:
                  '`git add` stages changes; `git commit` then records the staged snapshot.',
              },
            ],
          },
          {
            id: 'builtin-git-l1-s4',
            type: 'practice',
            title: 'Make your first commit',
            estMinutes: 3,
            markdown:
              'Try it in the terminal below. Initialize a repository, create `hello.txt` with some content, stage it, and commit it.',
            questions: [],
            exercise: {
              id: 'builtin-git-l1-ex1',
              kind: 'git',
              prompt: 'Initialize a repo, then create and commit `hello.txt`.',
              goals: [
                { type: 'initialized' },
                { type: 'commitCountAtLeast', count: 1 },
                { type: 'fileTracked', path: 'hello.txt' },
                { type: 'workingTreeClean' },
              ],
              solution: [
                'git init',
                'echo "hello git" > hello.txt',
                'git add hello.txt',
                'git commit -m "Add hello.txt"',
              ],
              hint: 'git init → create the file with `echo … > hello.txt` → `git add hello.txt` → `git commit -m "message"`.',
            },
          },
        ],
      },
      {
        id: 'builtin-git-l2',
        title: 'Branching & Merging',
        estMinutes: 6,
        segments: [
          {
            id: 'builtin-git-l2-s1',
            type: 'reading',
            title: 'Why branches?',
            estMinutes: 2,
            markdown:
              'A **branch** is an independent line of work. You build a feature on its own branch, then **merge** it back into `main` when it’s ready — keeping `main` stable while you experiment.\n\n```bash\ngit switch -c feature   # create + switch to a branch\ngit merge feature       # fold it back into the current branch\n```',
            questions: [],
          },
          {
            id: 'builtin-git-l2-s2',
            type: 'quiz',
            title: 'Check yourself',
            estMinutes: 2,
            markdown: 'One more before you finish the lesson.',
            questions: [
              {
                id: 'builtin-git-l2-q1',
                prompt: 'What does `git merge feature` do on the main branch?',
                options: [
                  'Deletes the feature branch',
                  'Combines the feature branch’s commits into main',
                  'Uploads main to GitHub',
                  'Reverts the last commit',
                ],
                correctIndex: 1,
                explanation:
                  'Merging integrates the other branch’s history into your current branch.',
              },
            ],
          },
          {
            id: 'builtin-git-l2-s3',
            type: 'practice',
            title: 'Branch, commit, and merge',
            estMinutes: 4,
            markdown:
              'The repo below already has a first commit on `main`. Create a branch called `feature`, add a commit on it, switch back to `main`, and merge `feature` in.',
            questions: [],
            exercise: {
              id: 'builtin-git-l2-ex1',
              kind: 'git',
              prompt:
                'On a new `feature` branch, commit a change; then merge `feature` into `main`.',
              setup: [
                'git init',
                'echo "# Project" > README.md',
                'git add README.md',
                'git commit -m "Initial commit"',
              ],
              goals: [
                { type: 'branchExists', name: 'feature' },
                { type: 'currentBranch', name: 'main' },
                { type: 'mergedInto', branch: 'main', from: 'feature' },
                { type: 'commitCountAtLeast', count: 2 },
              ],
              solution: [
                'git switch -c feature',
                'echo "feature work" > feature.txt',
                'git add feature.txt',
                'git commit -m "Add feature"',
                'git switch main',
                'git merge feature',
              ],
              hint: 'git switch -c feature → make a commit → git switch main → git merge feature.',
            },
          },
        ],
      },
    ],
  },
  {
    id: 'builtin-js-essentials',
    topicSlug: 'javascript',
    difficulty: 'beginner',
    lessons: [
      {
        id: 'builtin-js-l1',
        title: 'Functions',
        estMinutes: 8,
        segments: [
          {
            id: 'builtin-js-l1-s1',
            type: 'reading',
            title: 'What is a function?',
            estMinutes: 2,
            markdown:
              'A **function** packages a piece of behaviour so you can reuse it. It takes **inputs** (parameters), does some work, and **returns** a result.\n\n```js\nfunction double(n) {\n  return n * 2\n}\ndouble(4) // 8\n```',
            questions: [],
          },
          {
            id: 'builtin-js-l1-s2',
            type: 'practice',
            title: 'Write a function',
            estMinutes: 4,
            markdown:
              'Implement `double(n)` so it returns `n` multiplied by two. Press **Run tests** to check your work.',
            questions: [],
            exercise: {
              id: 'builtin-js-l1-ex1',
              prompt: 'Return the given number, doubled.',
              starterCode: 'function double(n) {\n  // return n doubled\n}\n',
              tests: [
                { name: 'double(4) === 8', expression: 'double(4)', expected: 8 },
                { name: 'double(0) === 0', expression: 'double(0)', expected: 0 },
                { name: 'double(-3) === -6', expression: 'double(-3)', expected: -6 },
              ],
              solution: 'function double(n) {\n  return n * 2\n}\n',
              hint: 'Use the `*` operator to multiply n by 2.',
            },
          },
          {
            id: 'builtin-js-l1-s3',
            type: 'quiz',
            title: 'Check yourself',
            estMinutes: 2,
            markdown: 'A quick check before moving on.',
            questions: [
              {
                id: 'builtin-js-l1-q1',
                type: 'mcq',
                prompt: 'What keyword returns a value from a function?',
                options: ['break', 'return', 'yield', 'exit'],
                correctIndex: 1,
                explanation: '`return` hands a value back to the caller and ends the function.',
              },
              {
                id: 'builtin-js-l1-q2',
                type: 'short_answer',
                prompt: 'In your own words, what is a pure function?',
                expectedAnswer:
                  'A pure function always returns the same output for the same inputs and has no side effects (it does not change state outside itself).',
                explanation:
                  'Pure functions are deterministic and side-effect-free, which makes them easy to test and reason about.',
              },
            ],
          },
        ],
      },
      {
        id: 'builtin-js-l2',
        title: 'Working with arrays',
        estMinutes: 8,
        segments: [
          {
            id: 'builtin-js-l2-s1',
            type: 'reading',
            title: 'Reducing an array',
            estMinutes: 2,
            markdown:
              'Arrays hold ordered lists of values. To combine them into one value, loop or use `reduce`:\n\n```js\n[1, 2, 3].reduce((total, n) => total + n, 0) // 6\n```',
            questions: [],
          },
          {
            id: 'builtin-js-l2-s2',
            type: 'practice',
            title: 'Sum an array',
            estMinutes: 4,
            markdown:
              'Implement `sum(numbers)` so it returns the total of every number in the array. An empty array sums to `0`.',
            questions: [],
            exercise: {
              id: 'builtin-js-l2-ex1',
              prompt: 'Return the sum of all numbers in the array.',
              starterCode: 'function sum(numbers) {\n  // add up every number\n}\n',
              tests: [
                { name: 'sum([1,2,3]) === 6', expression: 'sum([1, 2, 3])', expected: 6 },
                { name: 'sum([]) === 0', expression: 'sum([])', expected: 0 },
                { name: 'sum([-1,1]) === 0', expression: 'sum([-1, 1])', expected: 0 },
              ],
              solution:
                'function sum(numbers) {\n  return numbers.reduce((total, n) => total + n, 0)\n}\n',
              hint: 'Start a running total at 0 and add each element, or use `reduce`.',
            },
          },
          {
            id: 'builtin-js-l2-s3',
            type: 'quiz',
            title: 'Check yourself',
            estMinutes: 2,
            markdown: 'One more before you finish.',
            questions: [
              {
                id: 'builtin-js-l2-q1',
                type: 'mcq',
                prompt: 'What does `[1, 2, 3].length` evaluate to?',
                options: ['2', '3', '4', 'undefined'],
                correctIndex: 1,
                explanation: '`length` is the number of elements in the array.',
              },
            ],
          },
        ],
      },
    ],
  },
  // Beginner "dive-in" starter courses for the remaining topics, produced by
  // `npm run gen:builtins` and committed after review (empty until generated).
  ...GENERATED_BUILTIN_COURSES,
]
