import { z } from 'zod'
import { exerciseTestSchema } from './exercise'
import { gitGoalSchema } from './git-sim'

// The AI lesson-generation pipeline, defined against two seams so the
// orchestration is testable with fakes:
//   LessonGenerator — produces course content (OpenAI in prod, fake in tests)
//   CourseStore     — persists it (Drizzle in prod, in-memory in tests)

export type Difficulty = 'beginner' | 'intermediate' | 'advanced'

// ---- Validated shape of whatever the LLM returns ----

// LLMs frequently capitalize or pad enum values ("Beginner", " MCQ"). Accept
// them case-insensitively so a well-formed course isn't rejected over casing.
const lenientEnum = <const T extends readonly [string, ...string[]]>(values: T) =>
  z.preprocess(
    (v) => (typeof v === 'string' ? v.trim().toLowerCase() : v),
    z.enum(values),
  )

export const generatedQuestionSchema = z.object({
  type: lenientEnum(['mcq', 'short_answer']),
  prompt: z.string(),
  options: z.array(z.string()).optional(),
  correctIndex: z.number().int().nonnegative().optional(),
  expectedAnswer: z.string().optional(),
  explanation: z.string().optional(),
})

// A runnable Phase-4 code exercise the model may attach to a "practice" segment.
// Mirrors SeedExercise (the mapper derives the id); `tests` reuse the engine's
// own schema — an `expression` evaluated in the learner's scope and deep-compared
// to `expected`. Requires >=1 test so a "runnable" exercise is actually runnable.
export const generatedJsExerciseSchema = z.object({
  kind: z.literal('js').optional(), // absent ⇒ js
  prompt: z.string(),
  starterCode: z.string(),
  // Authoring language: 'ts' is type-stripped to JS, 'python' runs on Pyodide.
  // Omit ⇒ 'js'.
  language: lenientEnum(['js', 'ts', 'python']).optional(),
  tests: z.array(exerciseTestSchema).min(1),
  solution: z.string().default(''),
  hint: z.string().default(''),
})

// A terminal/git exercise (core/git-sim.ts) for git/CLI topics: `goals` assert
// against the final repo state, `solution` is the command sequence that satisfies
// them, `setup` pre-runs. Requires >=1 goal and >=1 solution command.
export const generatedGitExerciseSchema = z.object({
  kind: z.literal('git'),
  prompt: z.string(),
  setup: z.array(z.string()).optional(),
  goals: z.array(gitGoalSchema).min(1),
  solution: z.array(z.string()).min(1),
  hint: z.string().default(''),
})

// Git branch first so `kind: 'git'` routes there; anything else (kind absent or
// 'js') falls through to the js branch.
export const generatedExerciseSchema = z.union([
  generatedGitExerciseSchema,
  generatedJsExerciseSchema,
])

export const generatedSegmentSchema = z.object({
  title: z.string(),
  type: lenientEnum(['reading', 'code', 'practice', 'quiz']),
  // A quiz segment usually has no prose body — the questions carry it. Coerce a
  // missing/null/non-string body to '' so one bodyless segment can't reject an
  // otherwise-valid (paid) course.
  body: z.preprocess((v) => (typeof v === 'string' ? v : ''), z.string()),
  // Fall back to a sane length on a missing/zero/fractional estMinutes instead
  // of failing the parse.
  estMinutes: z.number().int().positive().catch(2),
  questions: z.array(generatedQuestionSchema).default([]),
  // Optional runnable exercise. A malformed one (e.g. no tests) is dropped to
  // undefined so it never fails an otherwise-valid course; an absent one stays
  // undefined.
  exercise: generatedExerciseSchema.optional().catch(undefined),
})

export const generatedLessonSchema = z.object({
  title: z.string(),
  estMinutes: z.number().int().positive().catch(5),
  segments: z.array(generatedSegmentSchema).min(1),
  // Key terms introduced in the lesson (for further-reading links). Optional so
  // an older model/output that omits it doesn't fail a paid generation.
  glossary: z.array(z.string()).default([]),
})

export const generatedCourseSchema = z.object({
  // topic + difficulty are echoed by the LLM but never used — the pipeline
  // already knows them from the enroll input. Keep them tolerant (any string,
  // optional) so a stray value/casing can't reject an otherwise-valid course.
  topic: z.string().optional(),
  difficulty: z.string().optional(),
  lessons: z.array(generatedLessonSchema).min(1),
})

export type GeneratedCourse = z.infer<typeof generatedCourseSchema>
export type GeneratedLesson = z.infer<typeof generatedLessonSchema>

export function parseGeneratedCourse(raw: unknown): GeneratedCourse {
  return generatedCourseSchema.parse(raw)
}

// ---- Seams ----

export type GenerationInput = {
  topic: string
  difficulty: Difficulty
  // Free-text learner request threaded into the prompt (tailor feature).
  customization?: string
  // Present ⇒ extend an existing course: generate only NEW lessons, given the
  // titles already covered (tailor "append" mode).
  existingTitles?: readonly string[]
}
export type EnrollInput = GenerationInput & {
  topicId: string
  ownerUserId: string
}

export interface LessonGenerator {
  generate(input: GenerationInput): Promise<GeneratedCourse>
}

export interface CourseStore {
  createCourse(input: EnrollInput): Promise<string> // returns courseId
  addLesson(
    courseId: string,
    order: number,
    lesson: GeneratedLesson,
  ): Promise<void>
  markReady(courseId: string): Promise<void>
  markFailed(courseId: string): Promise<void>
}

// Target shape for a generated course. Kept in one place so the prompt (and any
// future validation) stay in sync, and course length is tunable here. These are
// *requests* to the model, not hard schema floors — the parse stays permissive
// (min 1) so an under-delivering model never fails a user's paid generation.
export const COURSE_TARGET = {
  minLessons: 6,
  maxLessons: 8,
  minSegments: 3,
  maxSegments: 5,
  minQuizPerLesson: 2,
} as const

// Fallback ETA for the Generate-course progress bar before any timings exist.
export const DEFAULT_GENERATION_ETA_MS = 20_000

// Running-average ETA from recorded generation durations (ms). Pure so the
// server read and the client both agree; falls back when there are no samples.
export function averageEtaMs(
  durations: number[],
  fallbackMs = DEFAULT_GENERATION_ETA_MS,
): number {
  if (durations.length === 0) return fallbackMs
  return Math.round(
    durations.reduce((sum, d) => sum + d, 0) / durations.length,
  )
}

// Shared quality bar for both a fresh course and an append. Kept in one place so
// tailored/appended lessons are held to the same depth as generated ones.
const DEPTH_GUIDANCE = [
  'Depth is the priority — this must NOT read like flash cards or a glossary:',
  '- Open each lesson with a short hook that motivates why the concept matters or what problem it solves — never a bare dictionary definition.',
  '- Every "reading" segment must actually teach: at least 120 words (2-4 substantial paragraphs) that explain the concept, include a concrete inline example (a short code snippet or a worked scenario), and note when/why you would use it plus a common pitfall. One- or two-sentence "X is a tool that does Y" segments are unacceptable.',
  '- "code" segments must include a real, runnable, commented snippet the learner can study and modify — not pseudocode.',
  '- "practice" segments pose an applied task tied to the reading.',
  '- Only when the topic naturally supports small, self-contained JavaScript function tasks (e.g. JavaScript, TypeScript, algorithms, data structures, functional programming), attach a runnable "exercise" to a "practice" segment (see the "exercise" shape below): a function the learner implements, with "starterCode", 2-4 "tests", a correct "solution" that passes every test, and a "hint". Prefer deterministic pure functions. Aim for at least two such exercises across the course. Git / command-line courses instead use terminal "git" exercises (guidance below). For remaining topics where neither fits (e.g. Docker, CSS, cloud consoles, SQL, prose), omit "exercise".',
  '- Exercise correctness is strict, because the tests are actually executed: the "solution" and "tests" must be plain, self-contained JavaScript with NO import/require/modules, no external libraries, no async/await/Promises, no DOM, no network, and no TypeScript-only syntax. The "solution" must define exactly the function name(s) the tests call; every test "expression" must call the learner-defined function and evaluate to a JSON value (number, string, boolean, array, or plain object). Before emitting an exercise, mentally run the "solution" against every "test" and confirm it produces "expected" — if it does not, fix it or omit the exercise.',
  '- "quiz" segments carry a lesson check-in; give each a short one-line body introducing it, plus its questions.',
  '- Assume the reader is a developer: use correct terminology, real commands/APIs, and realistic scenarios. Honor the difficulty — go deeper and skip hand-holding for intermediate/advanced.',
  '- Set each segment estMinutes to honestly reflect its length (a 3-minute reading is several substantial paragraphs, not one line).',
]

const GLOSSARY_GUIDANCE =
  'For each lesson also produce a "glossary": an array of 3-8 key technical terms it introduces (short, written exactly as they appear in the lesson) — used to link the learner to further reading.'

const LESSON_JSON_SHAPE = [
  '{ "topic", "difficulty", "lessons": [{ "title", "estMinutes", "glossary": ["term", ...], "segments": [{ "title", "type", "body", "estMinutes", "questions": [{ "type", "prompt", "options"?, "correctIndex"?, "expectedAnswer"?, "explanation"? }], "exercise"?: { "prompt", "starterCode", "language"?, "tests": [{ "name", "expression", "expected" }], "solution", "hint" } }] }] }',
  'segment.type is one of: reading | code | practice | quiz. question.type is one of: mcq | short_answer. "body" is markdown.',
  'An "exercise" is a runnable JavaScript task: "starterCode" is a function stub the learner completes; each test\'s "expression" is JavaScript evaluated in the learner\'s scope (it may call a function the learner defines) whose result is deep-compared to "expected" (a JSON value). "solution" must be a correct implementation that passes every test; "hint" nudges without giving it away.',
  'Set "language" to "ts" ONLY for a TypeScript course, where the "starterCode" and "solution" use TypeScript type annotations (the runner type-strips them to JS before running; the "tests" stay plain JS expressions). For every other topic omit "language" (defaults to "js").',
]

// Extra guidance pushed only for git / command-line courses, where an "exercise"
// is a terminal task ("kind": "git") run against a git simulator instead of a JS
// function. The solution is executed and every goal is asserted, so it must be
// correct — the same ship-gate discipline as JS exercises.
const GIT_EXERCISE_GUIDANCE = [
  'This is a git / command-line course. Attach a terminal "exercise" with "kind": "git" to most "practice" segments so the learner runs real git commands — do NOT emit JavaScript exercises here.',
  'A git exercise has: "prompt", optional "setup" (an array of commands pre-run to set the scene before the learner starts), "goals" (success criteria checked against the final repo state), "solution" (an array of commands that satisfies every goal), and "hint".',
  'Use ONLY these commands: git init | add <path|.> | commit -m "msg" | status | log [--oneline] | branch [name] | switch [-c] <name> | checkout [-b] <name> | restore --staged <path> | merge <name>; and shell: `echo TEXT > FILE`, `echo TEXT >> FILE`, cat FILE, touch FILE, rm FILE, ls, pwd, mkdir DIR. (echo writes exactly TEXT, no trailing newline.)',
  'Goal objects: {"type":"initialized"} · {"type":"commitCountAtLeast","count":N} · {"type":"branchExists","name":"..."} · {"type":"currentBranch","name":"..."} · {"type":"fileStaged","path":"..."} · {"type":"fileTracked","path":"..."} · {"type":"committedFileEquals","path":"...","content":"..."} · {"type":"commitMessageContains","text":"..."} · {"type":"workingTreeClean"} · {"type":"mergedInto","branch":"...","from":"..."}.',
  'The "solution" MUST satisfy every "goal" — mentally run it against the commands above first. Aim for at least two git exercises across the course, progressing from a first commit toward branching and merging.',
]

export function buildGenerationPrompt(input: GenerationInput): string {
  if (input.existingTitles && input.existingTitles.length > 0) {
    return buildAppendPrompt(input)
  }
  const t = COURSE_TARGET
  const lines = [
    `You are an expert developer-educator. Write a ${input.difficulty}-level course on "${input.topic}" for a working developer who learns in short, focused bursts between gaming sessions.`,
    `Produce ${t.minLessons}-${t.maxLessons} lessons — never fewer than ${t.minLessons} — that build on each other, progressing from fundamentals toward genuinely advanced, practical material, each with ${t.minSegments}-${t.maxSegments} segments.`,
    ...DEPTH_GUIDANCE,
    `Include at least ${t.minQuizPerLesson} quiz questions per lesson that test understanding (not recall of a single sentence), each with a brief explanation. Vary segment types across each lesson (reading, code, practice) so no lesson is all prose.`,
  ]
  if (/\btypescript\b/i.test(input.topic)) {
    lines.push(
      'This is a TypeScript course: every "exercise" MUST be TypeScript — set "language": "ts" and write genuinely typed TypeScript in "starterCode" and "solution" (explicit parameter and return type annotations, plus interfaces / generics / union types where they fit the task). Do NOT emit plain untyped JavaScript exercises.',
    )
  }
  if (/\bpython\b/i.test(input.topic)) {
    lines.push(
      'This is a Python course: every "exercise" MUST be Python — set "language": "python" and write idiomatic Python in "starterCode" and "solution" (the learner implements a function). Each test\'s "expression" is a Python expression that calls the function (e.g. "double(4)") whose result is deep-compared to "expected" (a JSON value: number, string, boolean, list, or dict). Use only the Python standard library; no input()/printing/file or network I/O. Do NOT emit JavaScript.',
    )
  }
  if (/\bgit\b/i.test(input.topic)) {
    lines.push(...GIT_EXERCISE_GUIDANCE)
  }
  const custom = input.customization?.trim()
  if (custom) {
    lines.push(
      `Additionally, honor this specific learner request throughout the course: "${custom}".`,
    )
  }
  lines.push(
    GLOSSARY_GUIDANCE,
    'Respond with JSON only, shaped as:',
    ...LESSON_JSON_SHAPE,
  )
  return lines.join('\n')
}

// Prompt for tailor "append": extend an existing course with NEW lessons only.
function buildAppendPrompt(input: GenerationInput): string {
  const t = COURSE_TARGET
  const titles = (input.existingTitles ?? []).map((x) => `- ${x}`).join('\n')
  const custom = input.customization?.trim()
  return [
    `You are an expert developer-educator EXTENDING an existing ${input.difficulty}-level course on "${input.topic}" for a working developer who studies in short, focused bursts.`,
    `The course already contains these lessons — do NOT repeat, restate, or lightly reword any of them:\n${titles}`,
    custom
      ? `Add new lessons that fulfil this learner request: "${custom}".`
      : 'Add new lessons that cover the next most valuable material beyond what already exists.',
    `Produce 1-4 NEW lessons only, each with ${t.minSegments}-${t.maxSegments} segments and at least ${t.minQuizPerLesson} quiz questions.`,
    ...DEPTH_GUIDANCE,
    GLOSSARY_GUIDANCE,
    'Respond with JSON only, shaped as:',
    ...LESSON_JSON_SHAPE,
  ].join('\n')
}

// Orchestrates generation: create (generating) → fill lessons → ready/failed.
export async function runGeneration(
  deps: { generator: LessonGenerator; store: CourseStore },
  input: EnrollInput,
): Promise<string> {
  const courseId = await deps.store.createCourse(input)
  try {
    const course = await deps.generator.generate({
      topic: input.topic,
      difficulty: input.difficulty,
      customization: input.customization,
    })
    let order = 0
    for (const lesson of course.lessons) {
      await deps.store.addLesson(courseId, order++, lesson)
    }
    await deps.store.markReady(courseId)
    return courseId
  } catch (err) {
    await deps.store.markFailed(courseId)
    throw err
  }
}

// Tailor "append": generate NEW lessons (input.existingTitles set) and add them
// to an existing course after its current last lesson. No createCourse/markReady
// — the course is already ready. Returns how many lessons were added.
export async function runAppend(
  deps: { generator: LessonGenerator; store: CourseStore },
  courseId: string,
  input: GenerationInput,
  startOrder: number,
): Promise<number> {
  const course = await deps.generator.generate(input)
  let order = startOrder
  for (const lesson of course.lessons) {
    await deps.store.addLesson(courseId, order++, lesson)
  }
  return course.lessons.length
}
