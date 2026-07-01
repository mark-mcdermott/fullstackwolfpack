// Built-in starter course(s), seeded as shared courses (ownerUserId = null) so
// every user has real content to learn before generating their own. Pure +
// typed; ids are fixed so the seed runner (scripts/seed.ts) is idempotent.

export type SeedQuestion = {
  id: string
  prompt: string
  options: string[]
  correctIndex: number
  explanation: string
}

export type SeedSegment = {
  id: string
  type: 'reading' | 'code' | 'quiz'
  title: string
  markdown: string
  estMinutes: number
  questions: SeedQuestion[]
}

export type SeedLesson = {
  id: string
  title: string
  estMinutes: number
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
        ],
      },
    ],
  },
]
