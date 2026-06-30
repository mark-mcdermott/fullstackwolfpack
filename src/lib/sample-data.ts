// Placeholder data so the logged-in screens look alive before real data is
// wired. Numbers mirror the mockups. Replace with API/db reads later.

export const sampleUser = {
  greetingName: 'MARK',
  level: 12,
  xp: 3240,
  xpToNext: 5000,
}

export const sampleStats = {
  streak: 7,
  bestStreak: 14,
  accuracy: 82,
  hoursLearned: 124,
  hoursPlayed: 301,
  lessonsCompleted: 37,
  sessions: 23,
  totalXp: 3240,
}

export type TopicProgress = {
  slug: string
  name: string
  difficulty: string
  pct: number
  lessons: string
  category: string
}

export const sampleTopics: TopicProgress[] = [
  { slug: 'react', name: 'React', difficulty: 'Intermediate', pct: 75, lessons: '24 / 32', category: 'frontend' },
  { slug: 'typescript', name: 'TypeScript', difficulty: 'Beginner', pct: 60, lessons: '18 / 30', category: 'frontend' },
  { slug: 'javascript', name: 'JavaScript', difficulty: 'Intermediate', pct: 85, lessons: '28 / 33', category: 'frontend' },
  { slug: 'nodejs', name: 'Node.js', difficulty: 'Intermediate', pct: 65, lessons: '20 / 31', category: 'backend' },
  { slug: 'postgresql', name: 'PostgreSQL', difficulty: 'Beginner', pct: 40, lessons: '12 / 30', category: 'databases' },
  { slug: 'git-github', name: 'Git & GitHub', difficulty: 'Beginner', pct: 70, lessons: '14 / 20', category: 'tools' },
  { slug: 'tailwind', name: 'Tailwind CSS', difficulty: 'Intermediate', pct: 80, lessons: '16 / 20', category: 'frontend' },
  { slug: 'docker', name: 'Docker', difficulty: 'Beginner', pct: 30, lessons: '9 / 30', category: 'devops' },
  { slug: 'aws', name: 'AWS Basics', difficulty: 'Beginner', pct: 20, lessons: '6 / 30', category: 'devops' },
  { slug: 'python', name: 'Python', difficulty: 'Beginner', pct: 50, lessons: '15 / 30', category: 'backend' },
  { slug: 'nextjs', name: 'Next.js', difficulty: 'Intermediate', pct: 35, lessons: '10 / 28', category: 'frontend' },
]

export const sampleFocus = sampleTopics.slice(0, 3)

export const sampleRecentLessons = [
  { title: 'Understanding useEffect', topic: 'React', minutes: 5, score: 85, status: 'done' },
  { title: 'TypeScript Generics', topic: 'TypeScript', minutes: 6, score: 90, status: 'done' },
  { title: 'Building AI Tools', topic: 'AI Agents', minutes: 8, score: 80, status: 'done' },
  { title: 'State vs Refs', topic: 'React', minutes: 6, score: null, status: 'in_progress' },
]

export const sampleActivity = [
  { title: 'Completed lesson "TypeScript Generics"', topic: 'TYPESCRIPT', when: '2 hours ago', xp: 80 },
  { title: 'Completed lesson "React State vs Refs"', topic: 'REACT', when: '1 day ago', xp: 60 },
  { title: '7 day streak! Keep it up!', topic: '', when: '1 day ago', xp: 50 },
  { title: 'Completed lesson "PostgreSQL Joins"', topic: 'POSTGRESQL', when: '2 days ago', xp: 70 },
  { title: 'Completed lesson "Docker Volumes"', topic: 'DOCKER', when: '3 days ago', xp: 60 },
]

export const sampleSkills = [
  { key: 'Problem Solving', value: 72 },
  { key: 'Concepts', value: 80 },
  { key: 'Code Quality', value: 65 },
  { key: 'Speed', value: 58 },
  { key: 'System Design', value: 40 },
  { key: 'Debugging', value: 68 },
]

export const sampleAchievements = {
  earned: [
    { name: 'Week Warrior', description: 'Complete 7 days in a row', date: 'May 20, 2025' },
    { name: 'Focus Mode', description: 'Complete 10 deep focus sessions', date: 'May 18, 2025' },
    { name: 'TypeScript Novice', description: 'Complete 15 TypeScript lessons', date: 'May 15, 2025' },
    { name: 'Hot Streak', description: 'Maintain a 7 day streak', date: 'May 13, 2025' },
  ],
  inProgress: [
    { name: 'Quiz Master', description: 'Maintain 90%+ accuracy for 7 days', current: 5, target: 7 },
    { name: 'Project Builder', description: 'Build and deploy 3 projects', current: 2, target: 3 },
    { name: 'AI Explorer', description: 'Complete 10 AI Agents lessons', current: 6, target: 10 },
  ],
  locked: [
    { name: 'Legend', description: 'Reach level 20', current: 12, target: 20 },
    { name: 'Mentor', description: 'Help 10 other learners', current: 0, target: 10 },
    { name: 'Perfectionist', description: 'Complete 50 lessons with 100% score', current: 12, target: 50 },
  ],
}

export const sampleSessionPlan = [
  { n: 1, title: 'Intro to Generics', minutes: 2, done: true, active: true },
  { n: 2, title: 'Generic Functions', minutes: 6, done: false },
  { n: 3, title: 'Generic Types', minutes: 6, done: false },
  { n: 4, title: 'Constraints', minutes: 6, done: false },
  { n: 5, title: 'Keyof & typeof', minutes: 6, done: false },
  { n: 6, title: 'Practical Exercise', minutes: 10, done: false },
  { n: 7, title: 'Challenge', minutes: 10, done: false },
  { n: 8, title: 'Wrap Up', minutes: 4, done: false },
]

export const sampleWeekActivity = [
  'done', 'done', 'done', 'done', 'done', 'done', 'done',
  'done', 'done', 'partial', 'none', 'none', 'done', 'none',
  'done', 'none', 'none', 'none', 'done', 'none', 'missed',
] as const
