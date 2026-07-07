import { z } from 'zod'

// The AI-tutor seam (the `ai_tutor` Pro feature). Pure: interface, prompt builder,
// and the request/reply contract live here; the LLM-backed tutor is server/tutor.ts.
//
// The single biggest quality lever is GROUNDING — the tutor answers about the
// segment currently on screen, not as a general chatbot (docs/education-system.md
// §5.2). Scaffolding is Socratic-with-a-dial: `hint` nudges, `explain`/`example`
// clarify, `why_wrong` reviews a quiz answer, `chat` is open Q&A.

export const tutorModes = ['hint', 'explain', 'example', 'why_wrong', 'chat'] as const
export type TutorMode = (typeof tutorModes)[number]

// The lesson context the tutor is grounded in. `segmentMarkdown` is the body the
// learner is looking at; the rest situates it.
export const tutorContextSchema = z.object({
  topic: z.string(),
  lessonTitle: z.string(),
  segmentTitle: z.string(),
  segmentMarkdown: z.string(),
})
export type TutorContext = z.infer<typeof tutorContextSchema>

export const tutorMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1).max(4000),
})
export type TutorMessage = z.infer<typeof tutorMessageSchema>

// POST /api/me/tutor — grounded by segmentId (the server loads the context so the
// client can't spoof it), a conversation, and the requested scaffolding mode.
export const tutorRequestSchema = z.object({
  segmentId: z.string().min(1),
  mode: z.enum(tutorModes).default('chat'),
  messages: z.array(tutorMessageSchema).min(1).max(20),
})
export type TutorRequest = z.infer<typeof tutorRequestSchema>

export const tutorReplySchema = z.object({ reply: z.string() })
export type TutorReply = z.infer<typeof tutorReplySchema>

// The tutor (fake in tests, Claude/OpenAI in prod).
export interface Tutor {
  reply(context: TutorContext, messages: TutorMessage[], mode: TutorMode): Promise<string>
}

// Per-mode nudge appended to the grounded system prompt.
const MODE_GUIDANCE: Record<TutorMode, string> = {
  hint: 'The learner is stuck. Give ONE small hint that moves them forward. Do not reveal the full answer.',
  explain: 'Explain the current concept a different way — simpler, with a fresh analogy.',
  example: 'Give one concrete, minimal example that illustrates the current concept.',
  why_wrong:
    "The learner got a quiz question wrong. Explain WHY their answer is wrong and what the right idea is, kindly.",
  chat: 'Answer the learner\'s question about the current lesson.',
}

// The grounded system prompt: inject the on-screen segment, keep the tutor on-topic,
// stay brief, and prefer nudges over answer-dumps (with the mode dial on top).
export function buildTutorSystemPrompt(context: TutorContext, mode: TutorMode): string {
  return [
    `You are Akela, the friendly, concise guide of the Fullstack Wolfpack, helping a developer learn "${context.topic}". If asked your name, you're Akela; don't otherwise announce it.`,
    `They are on the lesson "${context.lessonTitle}", segment "${context.segmentTitle}".`,
    'Ground every answer in the lesson content below. If they ask about something',
    'outside it, answer briefly and steer them back to the lesson.',
    'Prefer guiding questions and small hints over giving the whole answer outright,',
    'but do not withhold help if they are clearly stuck. Keep replies short (a few',
    'sentences); use a fenced code block only when code genuinely helps.',
    `\nMode: ${MODE_GUIDANCE[mode]}`,
    `\n--- LESSON SEGMENT ---\n${context.segmentMarkdown}\n--- END SEGMENT ---`,
  ].join(' ')
}
