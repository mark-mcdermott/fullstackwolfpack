// Catalog seed data. Pure + typed so it can be unit-tested; the runner
// (scripts/seed.ts) inserts it idempotently.

export const TOPIC_CATEGORIES = [
  'frontend',
  'backend',
  'devops',
  'databases',
  'tools',
  'ai_data',
] as const
export type TopicCategory = (typeof TOPIC_CATEGORIES)[number]

export type SeedTopic = {
  slug: string
  name: string
  category: TopicCategory
  icon: string
  description: string
}

export const SEED_TOPICS: SeedTopic[] = [
  { slug: 'react', name: 'React', category: 'frontend', icon: 'react', description: 'Build component-driven UIs.' },
  { slug: 'typescript', name: 'TypeScript', category: 'frontend', icon: 'typescript', description: 'Type-safe JavaScript at scale.' },
  { slug: 'javascript', name: 'JavaScript', category: 'frontend', icon: 'javascript', description: 'The language of the web.' },
  { slug: 'nodejs', name: 'Node.js', category: 'backend', icon: 'nodejs', description: 'JavaScript on the server.' },
  { slug: 'postgresql', name: 'PostgreSQL', category: 'databases', icon: 'postgresql', description: 'Relational data done right.' },
  { slug: 'git-github', name: 'Git & GitHub', category: 'tools', icon: 'git', description: 'Version control and collaboration.' },
  { slug: 'tailwind', name: 'Tailwind CSS', category: 'frontend', icon: 'tailwind', description: 'Utility-first styling.' },
  { slug: 'docker', name: 'Docker', category: 'devops', icon: 'docker', description: 'Containerize anything.' },
  { slug: 'aws', name: 'AWS Basics', category: 'devops', icon: 'aws', description: 'Cloud fundamentals.' },
  { slug: 'python', name: 'Python', category: 'backend', icon: 'python', description: 'Readable, batteries-included.' },
  { slug: 'nextjs', name: 'Next.js', category: 'frontend', icon: 'nextjs', description: 'The React framework.' },
  { slug: 'ai-agents', name: 'AI Agents', category: 'ai_data', icon: 'ai', description: 'Build with LLMs and tools.' },
]

export type SeedAchievement = {
  slug: string
  name: string
  description: string
  category: string
  tier: string
  progressTarget: number
  xpReward: number
  criteria: Record<string, unknown>
}

export const SEED_ACHIEVEMENTS: SeedAchievement[] = [
  { slug: 'week-warrior', name: 'Week Warrior', description: 'Complete 7 days in a row', category: 'streak', tier: 'silver', progressTarget: 7, xpReward: 200, criteria: { type: 'streak', days: 7 } },
  { slug: 'focus-mode', name: 'Focus Mode', description: 'Complete 10 deep focus sessions', category: 'sessions', tier: 'silver', progressTarget: 10, xpReward: 200, criteria: { type: 'focus_sessions', count: 10 } },
  { slug: 'typescript-novice', name: 'TypeScript Novice', description: 'Complete 15 TypeScript lessons', category: 'topic', tier: 'bronze', progressTarget: 15, xpReward: 150, criteria: { type: 'topic_lessons', topic: 'typescript', count: 15 } },
  { slug: 'hot-streak', name: 'Hot Streak', description: 'Maintain a 7 day streak', category: 'streak', tier: 'bronze', progressTarget: 7, xpReward: 150, criteria: { type: 'streak', days: 7 } },
  { slug: 'learning-machine', name: 'Learning Machine', description: 'Learn for 100 hours total', category: 'time', tier: 'gold', progressTarget: 100, xpReward: 500, criteria: { type: 'hours_learned', hours: 100 } },
  { slug: 'bug-hunter', name: 'Bug Hunter', description: 'Score 90%+ on 10 quizzes', category: 'quiz', tier: 'silver', progressTarget: 10, xpReward: 250, criteria: { type: 'quiz_high_score', pct: 90, count: 10 } },
  { slug: 'cli-commander', name: 'CLI Commander', description: 'Complete all terminal basics lessons', category: 'topic', tier: 'bronze', progressTarget: 1, xpReward: 150, criteria: { type: 'complete_topic', topic: 'git-github' } },
  { slug: 'early-bird', name: 'Early Bird', description: 'Complete a session before 9AM', category: 'sessions', tier: 'bronze', progressTarget: 1, xpReward: 100, criteria: { type: 'session_before', hour: 9 } },
  { slug: 'quiz-master', name: 'Quiz Master', description: 'Maintain 90%+ accuracy for 7 days', category: 'quiz', tier: 'gold', progressTarget: 7, xpReward: 300, criteria: { type: 'accuracy_streak', pct: 90, days: 7 } },
  { slug: 'legend', name: 'Legend', description: 'Reach level 20', category: 'level', tier: 'gold', progressTarget: 20, xpReward: 1000, criteria: { type: 'reach_level', level: 20 } },
  { slug: 'perfectionist', name: 'Perfectionist', description: 'Complete 50 lessons with 100% score', category: 'quiz', tier: 'gold', progressTarget: 50, xpReward: 500, criteria: { type: 'perfect_lessons', count: 50 } },
  { slug: 'master-wolf', name: 'Master Wolf', description: 'Earn all achievements', category: 'meta', tier: 'gold', progressTarget: 1, xpReward: 1000, criteria: { type: 'all_achievements' } },
]

export type SeedLevel = {
  level: number
  xpRequired: number
  rewards: string[]
}

const LEVEL_REWARDS: Record<number, string[]> = {
  5: ['Focus Mode theme: Ember'],
  10: ['+1 Daily Focus Session'],
  13: ['Focus Mode theme: Crimson', '+1 Daily Focus Session', 'Exclusive Wallpaper Pack'],
  20: ['Title: Legend', 'Exclusive Master Wolf badge'],
}

function buildLevels(max: number): SeedLevel[] {
  const levels: SeedLevel[] = []
  let cumulative = 0
  for (let level = 1; level <= max; level++) {
    levels.push({ level, xpRequired: cumulative, rewards: LEVEL_REWARDS[level] ?? [] })
    cumulative += 400 + (level - 1) * 40
  }
  return levels
}

export const SEED_LEVELS: SeedLevel[] = buildLevels(20)
