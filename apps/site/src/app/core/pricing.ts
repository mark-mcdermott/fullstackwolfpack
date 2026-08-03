import { FREE_TOPIC_LIMIT, type Tier } from './access'

export type TierPlan = {
  tier: Tier
  name: string
  priceMonthly: number
  tagline: string
  features: string[]
  cta: string
  featured?: boolean
}

export const PLANS: TierPlan[] = [
  {
    tier: 'free',
    name: 'Recruit',
    priceMonthly: 0,
    tagline: 'Start turning screen time into skills.',
    features: [
      `Up to ${FREE_TOPIC_LIMIT} active topics`,
      'AI-generated lessons (your OpenAI key)',
      'Multiple-choice quizzes',
      'Streaks, XP & achievements',
    ],
    cta: 'Start free',
  },
  {
    tier: 'pro',
    name: 'Wolf',
    priceMonthly: 9,
    tagline: 'Unlimited learning, on autopilot.',
    features: [
      'Unlimited topics',
      'Smart pause intervals',
      'AI tutor + short-answer grading',
      'Advanced stats & skill insights',
      'Priority lesson generation',
    ],
    cta: 'Go Pro',
    featured: true,
  },
]

export function planFor(tier: Tier): TierPlan {
  const plan = PLANS.find((p) => p.tier === tier)
  if (!plan) throw new Error(`No plan for tier: ${tier}`)
  return plan
}
