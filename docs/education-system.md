# The Education System — approach & exploration

> Status: exploration / design. Branch `feat/education-core`. Owner: education pane.
> Companion proof-of-concept in this branch: `src/core/review.ts` (+ tests).

This document answers three questions:

1. **What already exists** for the education system, so we don't rebuild it.
2. **What open-source pieces we could pull in** (more than one) and where each fits.
3. **How to approach the "AI tutorial" angle** — generation, tutoring, grading, adaptivity.

It closes with a phased plan and an explicit division of labour with the two other
panes working this repo in parallel.

---

## 0. TL;DR

- **This app is a gamified, AI-generated micro-learning platform for developers who
  "learn in short bursts between gaming sessions."** The `sessions` table interleaving
  `playMinutes`/`learnMinutes`, the sibling ROM-gallery feature, and the generation
  prompt ("…for a developer who learns in short bursts between gaming sessions") all
  point the same way: **learn-while-you-game.**
- **The data model and the AI *generation* pipeline already exist in scaffold form.**
  `courses → lessons → lessonSegments → quizQuestions + exercises`, a provider-seam
  `LessonGenerator`/`CourseStore`, an OpenAI generator, XP/levels/streaks/achievements,
  and per-user progress tables are all there.
- **What does *not* exist is the learning experience itself** — the part that makes it
  an "education system" rather than a content database:
  - No **lesson player** (no route, no page, no lesson-fetch endpoint).
  - No **learning loop** — nothing grades an answer, records the attempt, awards XP,
    advances progress, or updates the streak.
  - No **spaced repetition / review** (`smart_intervals` is sold as a Pro feature but
    unimplemented).
  - No **AI tutor** (`ai_tutor` is sold as a Pro feature but unimplemented).
  - No **AI grading** of free-text answers (the schema is built for it —
    `quizQuestions.expectedAnswer` is "the reference answer the AI grades against",
    `quizAttempts.aiFeedback` exists — but no code does it).
  - No **code execution** for `exercises` / `code` segments, and no **markdown
    rendering** for segment bodies.
- **Recommended split of "buy vs. build":**
  - **Pull in OSS** for the commodity, hard-to-get-right pieces: spaced-repetition
    scheduling (**ts-fsrs**), markdown + code highlighting (**react-markdown + Shiki**),
    and in-browser code exercises (**CodeMirror 6 + a Web-Worker test runner**; Sandpack
    and WebContainers are ruled out on mobile — see §4.3).
  - **Build ourselves** the thin, product-specific glue: the lesson player, the pure
    learning-loop math (grade → XP → progress → streak), and the AI seams (tutor,
    grader) layered on the generation output.
- **Own the AI provider seam.** Generation is currently OpenAI-only with fragile
  `json_object` + `JSON.parse`. Recommend a provider-agnostic generator and adding
  **Claude** with **structured outputs** (`output_config.format` / `messages.parse()`),
  **streaming**, and **prompt caching** for the tutor/grader. (Generation itself is the
  *main* pane's #2 workstream — this is a coordinate-not-collide item; see §8.)

---

## 1. What this app is

Reading the code makes the concept unambiguous even though the top-level README is still
the Vite starter template:

- `src/core/generation.ts` → `buildGenerationPrompt()` literally says: *"Create a
  {difficulty} course on '{topic}' for a developer who learns in short bursts between
  gaming sessions."*
- `src/db/schema/progress.ts` → `sessions` carries `playMinutes`, `learnMinutes`,
  `playIntervalMin`, `learnIntervalMin`, `focusMode`, `focusScore` — a **play↔learn
  session**, i.e. study between rounds of a game.
- Sibling pane is building a **ROM gallery** — the "game" half of the loop.
- `src/core/access.ts` → the paid tier gates `smart_intervals`, `unlimited_topics`,
  `ai_tutor`, `advanced_stats`.

So the product is: pick a dev topic → AI generates a bite-sized course → you study a
lesson in the gap between gaming sessions → quizzes + XP + streaks keep you coming back →
spaced repetition brings concepts back at the right time → an AI tutor helps when stuck.
The **education system is the core of the app**, not a side feature.

---

## 2. What already exists (inventory)

A surprising amount. Grouped by layer, with a note on **who is likely to own it** so we
avoid collisions (see §8).

### 2.1 Content model — `src/db/schema/content.ts` + `catalog.ts` (exists)

```
topics (catalog)
  └── courses            source: ai | builtin | imported · status: generating|ready|failed · model
        └── lessons                orderIndex, title, estMinutes
              └── lessonSegments   type: reading|code|practice|quiz · content jsonb {markdown} · estMinutes
                    ├── quizQuestions   type: mcq|short_answer · options · correctIndex · expectedAnswer · explanation
                    └── exercises       prompt · starterCode · tests jsonb · solution · hint
```

Notable foresight already baked into the schema:

- `courses.source` includes **`builtin`** and **`imported`** — the schema *already
  anticipates ingesting external/OSS curricula*, not only AI generation.
- `courses.model` — records which model generated a course (provider-agnostic-friendly).
- `quizQuestions.expectedAnswer` — commented "the reference answer **the AI grades
  against**".
- `quizAttempts.aiFeedback` — a column waiting for an AI grader's feedback.
- `exercises.tests` (jsonb) + `solution` + `hint` — a code-exercise runner is intended.

### 2.2 Generation pipeline — `src/core/generation.ts`, `src/server/*` (exists — **main pane #2**)

- **Pure, testable seam** (`core/generation.ts`): Zod schemas for the generated
  `Course → Lesson → Segment → Question` shape; `LessonGenerator` + `CourseStore`
  interfaces; `runGeneration()` orchestrator (create → fill → ready/failed);
  `buildGenerationPrompt()`.
- **Real generator** (`server/openai-generator.ts`): OpenAI chat-completions,
  `response_format: json_object`, `gpt-4o-mini`, `fetchImpl` injectable for tests.
- **Persistence** (`server/course-store.ts`): Drizzle-backed `CourseStore`.
- **End-to-end** (`server/enroll.ts`): decrypt the user's BYO key
  (`providerCredentials`, `server/crypto.ts`) → generate → persist.

This is solid and well-tested. **We should not rebuild it.** Our work consumes its
*output*. The one improvement we'd propose (provider-agnostic + Claude + structured
outputs) is a change *to this pipeline* and therefore a coordinate-with-main item.

### 2.3 Progress, gamification, DTOs (exists — **main pane #1 "real data"**)

- `src/db/schema/progress.ts`: `userTopics`, `userLessonProgress`, `quizAttempts`,
  `sessions`, `xpEvents` (an XP ledger), `dailyActivity` (streak grid),
  `userAchievements`, `userSkills`, plus `levels`/`achievements` catalogs.
- `src/core/progress.ts`: **pure** `levelProgress()`, `bucketAchievements()`,
  `relativeTime()` — unit-tested.
- `src/core/app-data.ts`: Zod DTOs for the dashboard/topics/stats/progress/achievements
  views.
- `src/server/app-data.ts`: Drizzle read queries that back `/api/me/*`.
- `src/api-client/api.ts`: `data.summary/dashboard/topics/stats/progress/achievements`.

Note these are **read** paths — they *display* progress. Nothing here *writes* progress
from a completed lesson; that write path is part of the missing learning loop (§3).

### 2.4 Access / tiers — `src/core/access.ts` (exists)

`free | pro`, `user | admin`, `FREE_TOPIC_LIMIT = 3`, `withinTopicLimit()`, and the
`ai_tutor` / `smart_intervals` Pro features. The tutor and review features have a
home in the tier model already; they just aren't implemented.

### 2.5 Pages & routing — `src/pages/app/*`, `src/App.tsx` (partial)

Pages exist for dashboard, topics, progress, stats, achievements, badges, sessions,
settings (currently rendering `sampleTopics` fixtures; main is wiring them to `/api/me/*`).
**There is no lesson/course/learn route and no lesson viewer page.** `App.tsx` stops at
list/overview screens.

### 2.6 The gap in one sentence

> Everything needed to *describe* and *score* learning exists; nothing needed to *do* a
> lesson exists.

---

## 3. Gap analysis — what an "education system" needs that isn't here

| # | Capability | State | Where it should live |
|---|------------|-------|----------------------|
| G1 | **Lesson player** — fetch a course/lesson, render segments, step through them | ❌ none | new `/app/learn/:lessonId` route + `/api/me/lesson/:id` + `data.lesson()` |
| G2 | **Learning loop** — grade answer → record `quizAttempt` → award `xpEvent` → advance `userLessonProgress`/`userTopics` → update `dailyActivity`/streak → evaluate achievements | ❌ none | pure `core/learning.ts` (math) + `server/learning.ts` (writes) + `/api/me/answer`, `/api/me/lesson/:id/complete` |
| G3 | **Spaced repetition / review** (`smart_intervals`) — schedule concept/question reviews, a review queue, a "due today" surface | ❌ none | pure `core/review.ts` (scheduler) + `reviews` table + `/api/me/review` |
| G4 | **AI tutor** (`ai_tutor`) — grounded chat/hint/"explain differently" tied to the current segment | ❌ none | `core/tutor.ts` seam + `server/tutor.ts` + `/api/me/tutor` (streamed) |
| G5 | **AI grading** of `short_answer` — LLM-as-judge vs `expectedAnswer` → `{correct, feedback}` → `quizAttempts.aiFeedback` | ❌ none | `core/grader.ts` seam + `server/grader.ts` |
| G6 | **Code exercises** — editor + run hidden `tests` against user code → pass/fail | ❌ none | `code`/`practice` segment components + a sandbox (OSS, §4) |
| G7 | **Markdown rendering** — segment bodies are markdown; nothing renders them | ❌ none | a renderer component (OSS, §4) |
| G8 | **Enrollment UX** — "generate me a course on X" wired to `enroll.ts`, with the `generating→ready` lifecycle surfaced | ⚠️ backend exists, no UI | topic detail page + `/api/me/enroll` + poll/stream status |

G1, G2, G3 are the spine of the learning experience and are the highest-value,
lowest-collision work for this pane. G4/G5 are the "AI tutorial" differentiators. G6/G7
are where we lean hardest on open source.

---

## 4. Open-source building blocks to pull in

The brief explicitly asks for open-source options ("more than one?"). Below, per need:
the realistic candidates, a recommendation, and licensing notes. All four subsections
were checked against live research; licenses/figures should still be re-verified at the
moment of ingestion/adoption (they drift).

### 4.1 Spaced repetition / review scheduling → **ts-fsrs** ✅ researched

- **ts-fsrs** (from the `open-spaced-repetition` org) — the modern **FSRS-6** (Free
  Spaced Repetition Scheduler) algorithm in TypeScript. **MIT, 0 runtime dependencies,**
  ~79k weekly downloads, actively maintained (v5.4.1, 2026), and its scheduler is a
  **pure deterministic function** — `scheduler.next(card, now, rating)` → `{card, log}`.
  Runs unchanged in browser / Capacitor / Tauri. FSRS is the algorithm **Anki adopted as
  default (v23.10)**; per the open-spaced-repetition benchmark it needs **~20–30% fewer
  reviews than SM-2** for the same retention. `scheduler.repeat(card, now)` also previews
  all four outcomes at once — perfect for "+3d / +9d" hints on the Again/Hard/Good/Easy
  buttons. Default FSRS-6 weights work out of the box; per-user weight *optimization*
  (using our `quiz_attempts` history) is a later, optional iteration.
- **supermemo** (SM-2) — MIT, 0 deps, ~13KB. The classic algorithm; simpler but leaves
  ~20–30% efficiency on the table. Keep it as the **drop-in fallback** behind the seam.
- `fsrs.js` is **deprecated** (its own maintainer redirects to ts-fsrs) — don't use it.
- **Recommendation:** adopt **ts-fsrs** behind a **thin pure seam** (`core/review.ts` +
  row↔Card mappers) so the algorithm stays unit-testable and swappable (ts-fsrs ⇆ SM-2).
  DB cost is a small **`review_cards`** state table (one row per user per reviewable) plus
  an optional append-only **`review_logs`**:

  ```ts
  // src/db/schema/reviews.ts  (mirrors quiz_attempts / xp_events conventions)
  reviewItemType = pgEnum('review_item_type', ['quiz_question','concept','lesson'])
  review_cards: id · userId · itemType · itemId
              · due · stability(double) · difficulty(double) · elapsedDays · scheduledDays
              · learningSteps · reps · lapses · state(smallint 0..3) · lastReview
              · unique(userId,itemType,itemId) · index(userId,due)   // "due today"
  review_logs: id · cardId · rating(1..4) · state · stability · difficulty · reviewedAt
  ```
- **Bridge to what exists:** a `quiz_attempts.isCorrect` maps straight to a rating
  (`false → 'again'`, `true → 'good'`, optionally `hard`/`easy` by response latency), so
  we can grade a review directly from the existing quiz flow — no separate capture step.
- **Note for the POC (§9):** the proof-of-concept in this branch implements the seam with
  a **pure SM-2** body so the branch stays **dependency-free** while the other panes are
  moving fast. It's the identical seam ts-fsrs slots into — production should use ts-fsrs.

### 4.2 Lesson rendering (markdown + code) → **react-markdown + remark-gfm + Shiki** ✅ researched

- **react-markdown** (MIT) + **remark-gfm** (MIT, tables/task-lists/strikethrough) —
  renders the segment `content.markdown` to React elements **with no
  `dangerouslySetInnerHTML`, so it's XSS-safe by default.** You only lose that safety if
  you add `rehype-raw` (to render embedded raw HTML) — **don't.** For hand-authored/DB
  content this is safe as-is; because some segment bodies are **AI-generated**, still
  treat them as semi-trusted: keep `rehype-raw` off and, if raw HTML ever becomes
  necessary, add **`rehype-sanitize`** *after* it plus a `urlTransform` that blocks
  `javascript:` URLs.
- **Code highlighting: Shiki** (MIT). It's VS Code-grade (TextMate grammars) and now
  ships a **WASM-free JS regex engine** (`shiki/engine/javascript`) + fine-grained
  `createHighlighterCore`, so we can bundle **only** the grammars we need (ts/js/json/
  bash) and **lazy-load** the highlighter to keep first paint light. Wire it via the
  official **`@shikijs/rehype`** or **`rehype-pretty-code`** (nicer line/word-highlight
  defaults). Prism (MIT, ~20KB, faster but lower fidelity) is the pragmatic fallback if
  we want to avoid all WASM/weight; highlight.js (BSD-3) is the least precise.
- **Recommendation:** `react-markdown + remark-gfm + Shiki` (fine-grained core + JS
  engine, lazy-loaded), no `rehype-raw`. One small `<LessonMarkdown>` component consumed
  by the reading/quiz/code segment renderers.

### 4.3 In-browser code exercises → **Web Worker + CodeMirror 6** (JS/TS first) ✅ researched

**Mobile constraint that decides this:** Capacitor iOS (WKWebView) **cannot set
COOP/COEP headers on locally-served files**, so anything requiring `SharedArrayBuffer` /
cross-origin isolation is effectively a non-starter on mobile. That rules out the
heavyweight options and points us at a Worker-based runner.

- **Editor: CodeMirror 6** (MIT) — modular (~50–200KB, tree-shakeable) with **first-class
  touch/mobile support.** Monaco (MIT) is 5MB+ and "unusable on mobile" — **avoid.**
- **Execution (recommended): a Web Worker test runner.** Our `exercises` rows already
  carry `{ starterCode, tests, solution, hint }`. Flow: learner edits starter in
  CodeMirror → on **Run**, transpile TS in-thread with **esbuild-wasm** or **sucrase**
  (no SAB) → post `userCode + hidden tests` into a Web Worker → a tiny `expect`/`assert`
  harness runs the tests and returns `{name, passed, message}[]` → guard infinite loops
  with a timeout → `worker.terminate()`. `solution` powers "Show solution" and can
  validate the tests in CI. ~0 payload, works in every webview.
- **Upgrade path for hard limits / untrusted code: QuickJS-emscripten** (MIT) — a true
  sandbox (`setMemoryLimit`, deadline `setInterruptHandler`), still WASM-free of
  `SharedArrayBuffer`, still webview-safe. Same architecture, swap the worker's `eval`.
- **Sandpack** (`@codesandbox/sandpack-react`, **Apache-2.0**) — great for rich
  React/component exercises and ships a `SandpackTests` Jest runner; but it's heavy
  (editor+bundler+iframe), CDN-dependent, and **maintenance has slowed.** Overkill for
  plain JS/TS grading — **defer** to when we want live component playgrounds.
- **Avoid: WebContainers** (StackBlitz) — **two independent blockers**: proprietary
  **commercial licensing** for production, and it **requires SharedArrayBuffer + COOP/COEP
  → blocked on Capacitor iOS.**
- **Defer: Pyodide** (MPL-2.0, multi-MB WASM) for when Python arrives; **Judge0**
  (GPL-3.0, a backend runner — exactly what we're avoiding) only for compiled/multi-
  language server grading.
- **Recommendation for v1:** **CodeMirror 6 + esbuild/sucrase transpile + Web Worker test
  runner**, upgrading to **QuickJS-emscripten** when we need hard resource limits. Every
  package here is permissive (MIT/Apache/BSD) and confirmed to run in a Capacitor/Tauri
  webview without cross-origin isolation. Defer Sandpack and Python.

### 4.4 Seed content — AI-generate vs import OSS curricula ✅ researched

The schema's `source: builtin|imported` invites importing existing curricula. For a
**commercial** app, license compatibility is the deciding factor — and the popular
assumptions are wrong in dangerous ways:

| Source | Content license | Commercial? | Verdict |
|--------|-----------------|-------------|---------|
| **freeCodeCamp** | code BSD-3; **curriculum content is all-rights-reserved** (the CC-BY-SA claim is *stale* — they silently relicensed) | ❌ content | **AVOID** content |
| **The Odin Project** | **CC-BY-NC-SA 4.0** (NonCommercial + ShareAlike) | ❌ | **AVOID** (double trap) |
| **Exercism — exercises** (track repos, `problem-specifications`) | **MIT** | ✅ | **IMPORT w/ attribution** — great for the practice/coding-drill bank |
| **Exercism — user solutions** | **CC-BY-NC-SA** (ToS) | ❌ | **AVOID** — never pull the solutions feed |
| **MDN — prose** | **CC-BY-SA 2.5+** (share-alike) | ✅ but copyleft | link/reference; don't relicense into paid lessons |
| **MDN — code samples** (post-2010) | **CC0** (public domain) | ✅ | **clean** — reuse freely |
| **Google web.dev / Chrome / developers.google.com** | prose **CC-BY 4.0**, code **Apache-2.0** | ✅ | **clean** — best single source for frontend/perf/PWA |
| **Kubernetes docs** (`kubernetes/website`) | **CC-BY 4.0** | ✅ | **clean** — devops/containers |
| **CNCF curricula** (`cncf/curriculum`) | **CC-BY 4.0** | ✅ | **clean** — cloud-native |
| **The Rust Book** & many official docs | **MIT/Apache-2.0** | ✅ | clean (verify each repo) |

Two traps to remember: **NonCommercial (NC)** anything is a hard no for paid tiers, and
**ShareAlike (SA / CC-BY-SA)** forces the *derivative lesson* to be relicensed copyleft —
it "bleeds" obligations across the catalog.

- **Recommendation:** **AI-generate the bulk of the catalog from scratch** — it sidesteps
  every attribution/NC/SA obligation, gives uniform schema + voice, and lets us own paid
  content outright (the schema's `source: 'ai'` is designed for exactly this). Use imports
  **surgically**:
  - Seed the **practice/coding-drill bank** from **Exercism exercises (MIT)** + CC0/CC-BY
    code samples, with attribution.
  - Use the **CC-BY sources (Google, Kubernetes, CNCF)** as **grounding material to
    RAG/anchor the AI generation** (keeps technical facts accurate) rather than pasting
    verbatim; if we do paste substantial CC-BY text, add the per-lesson attribution line.
  - **Operational guardrail:** store `license` + `attribution` on every `imported` lesson,
    add a publish-gate that **refuses NC/SA-encumbered text**, keep an allowlist of the
    ~5 clean sources, and snapshot each source's LICENSE at ingestion time (freeCodeCamp
    is the cautionary tale — licenses change).

### 4.5 What we deliberately *don't* pull in

- A full LMS (Open edX, Moodle, H5P) — enormously heavier than this product needs; we'd
  fight its data model instead of using our clean Drizzle one.
- A quiz engine library — our `quizQuestions` schema + a small renderer is simpler and
  fully ours.

---

## 5. The AI tutorial angle

Grounded in the current Anthropic API (verified via the `claude-api` reference). Four
distinct AI features; all should sit behind the existing **provider seam** so we can run
Claude or the user's BYO OpenAI key.

### 5.1 Course/lesson **generation** (exists — make it better & provider-agnostic)

Current: OpenAI only, `response_format: json_object`, `JSON.parse(content)` then Zod. It
works but is fragile (free-form JSON, one giant call, no streaming).

Recommended upgrades (coordinate with main, who owns generation):

1. **Native structured outputs instead of hand-parsed JSON.** With Claude, use
   `messages.parse()` / `output_config: { format: { type: 'json_schema', schema } }` so
   the model is *constrained* to our `generatedCourseSchema` shape — far fewer malformed
   generations than `json_object` + `JSON.parse`. (Supported on Opus 4.8, Sonnet 5,
   Haiku 4.5.) The existing Zod schema converts to JSON Schema directly. Bare "JSON mode"
   is *not* the same thing — it doesn't guarantee schema shape.
2. **Generate in stages with a *small* schema per call** (outline → lesson → segments →
   quiz), not one giant nested schema in one shot. Decomposition is the reliability
   lever: single-call generation of large/complex schemas frequently truncates or
   malforms, and it keeps us under provider complexity caps. Add per-stage retry/repair
   so one failed stage doesn't cascade.
3. **Stream for perceived speed, parse at completion.** Streaming cuts *perceived*
   latency 60–80% for multi-sentence output — but a partial structured-output stream is
   **not valid JSON**, so accumulate the full response before deserializing. Surface the
   `generating → ready` lifecycle the schema already models.
4. **Ground technical content and verify it.** Two failure modes structured outputs do
   **not** fix: (a) **schema-valid ≠ factually true** — add an app-level semantic pass;
   (b) LLMs invent nonexistent packages (~20% of code samples → "slopsquatting") —
   **validate every import/install line against the real registry**, and where a segment
   contains runnable code, **execute/compile it** (test execution is the strongest
   grounding signal — and we're already planning a code runner, §4.3). For reasoning-heavy
   steps, allow a free-text reasoning field *before* the constrained fields (strict JSON
   can otherwise dent reasoning quality).
5. **Handle the non-schema escape hatches.** A generation can end `stop_reason: "refusal"`
   or `"max_tokens"` (HTTP 200, billed, off-schema) — check these **before** parsing.
6. **Prompt-cache the stable prefix.** Put system prompt + rubric + schema preamble at the
   very front and the per-lesson variables last, so the many per-segment calls hit cache
   (Anthropic needs explicit `cache_control`; break-even ~2 hits).
7. **Model choice by cost:** course generation is bulk + structured → **Haiku 4.5**
   (`claude-haiku-4-5`, $1/$5 per M) or **Sonnet 5** (`claude-sonnet-5`, $3/$15, intro
   $2/$10) are the cost-appropriate tiers; reserve Opus for hard reasoning.
8. **Provider-agnostic generator:** the `LessonGenerator` interface already abstracts
   this — add an `anthropicGenerator` alongside `openAiGenerator`, pick per
   `courses.model` / env. BYO-key infra (`providerCredentials`) already exists; add an
   `anthropic` provider row. (Provider seam caveats in §5.6.)

### 5.2 AI **tutor** (`ai_tutor` Pro feature — net new, ours to build)

A chat assistant **grounded in the current lesson/segment**, not a general chatbot.

- **Grounding is the single biggest quality lever.** Inject the current segment's markdown
  (and lesson title/topic) as context; the tutor answers *about the thing on screen*. This
  is the cheapest form of "RAG" (no vector DB for v1 — the relevant context *is* the lesson
  the user is on); RAG the wider course only when the learner ranges beyond it. Khan
  re-architected Khanmigo to always fetch the human-authored exercise/hints/solutions
  *first*, and accuracy improved.
- **Socratic *with an adjustable scaffolding dial*, not a hard "never give the answer".**
  This is the key lesson from Khanmigo: pure answer-withholding *frustrated* learners and
  they bypassed it at no social cost (the bot has no authority), so Khan embedded the tutor
  in the specific problem and softened the rule. Expose a **hint → answer dial** and
  explicit actions: *Hint*, *Explain differently*, *Give me an example*,
  *Why is my answer wrong?* Duolingo's **"Explain My Answer"** — explain why a quiz answer
  was right/wrong, with follow-ups — is the pattern closest to our quiz use case.
- **Don't trust the model's arithmetic or code.** Khan built a *calculator tool* rather
  than trusting the model's math; for a dev tutor, route correctness-critical checks
  through the **code executor** (§4.3). Have the model compute its own answer first and
  hide that reasoning so the learner's wrong answer doesn't bias it.
- **Evaluate guardrails over *whole dialogues*, not single prompts.** Measured pedagogical
  harm (answer over-disclosure, misconception reinforcement, abandoning scaffolding) rose
  from ~18% single-turn to ~78% multi-turn — the real risk is pedagogical, not toxicity.
  Add a **flag-to-report** human loop and error-rate monitoring, as Khan and Duolingo both
  did (the model still hallucinates).
- **Prompt caching:** the lesson context is stable across many tutor turns — cache it as a
  prefix (`cache_control`) so follow-up turns are cheap. Big win for a chat feature.
- **Streaming** the reply for a responsive feel; rate-limit per tier; Pro-gated via
  `can(principal, 'feature.ai_tutor')`.
- **Model:** **Sonnet 5** is the sweet spot for interactive tutoring quality/latency.

### 5.3 AI **grading** of free-text (`short_answer` — net new, ours)

The schema is already built for it (`expectedAnswer`, `aiFeedback`). MCQ grading is
pure/trivial; short-answer needs an LLM-as-judge. Best practices (research-backed):

- **Reference answer + explicit rubric is the single biggest reliability lever.** In
  MT-Bench, reference-guided grading cut the judge's failure rate from ~70% to ~15%. We
  already store the reference (`expectedAnswer`) — always pass it plus a rubric, and grade
  against its *concepts*, not exact wording.
- **Reasoning/feedback *before* the verdict.** "Explanation first, then label" raised
  human-correlation dramatically in published evals (~0.57 → ~0.84). So generate
  `feedback` first, then the score.
- **Binary `correct` + low-granularity `score` (0–5), not 0–100.** LLMs are unreliable on
  continuous scales; a small integer scale retains precision and is easier to rubric. Emit
  it via **structured outputs** (`{ feedback, correct, score }` guaranteed-shaped). Store
  `feedback` in `quizAttempts.aiFeedback`.
- **Don't grade with the model that generated the answer/course** (self-preference bias),
  and **don't feed the learner's self-assessment** to the judge (sycophancy — it agrees
  with whatever the prompt endorses). Delimit the learner's input clearly and instruct the
  judge to grade content, not any instructions embedded in it (prompt-injection defense).
- **Temp ~0 is *not* deterministic.** For low-confidence/high-stakes items use
  **majority-vote / self-consistency** or route to a human. LLM graders are reliable for
  **formative feedback**; keep a human in the loop for anything **summative**. Validate the
  judge against a small human-labeled golden set (Cohen's/quadratic-weighted kappa), not
  raw accuracy.
- **Model:** **Haiku 4.5** is enough for most short-answer grading and keeps cost down.
- **Seam:** `core/grader.ts` defines `interface AnswerGrader { grade(...) }`; a fake in
  tests, Claude/OpenAI in prod — same pattern as `LessonGenerator`.

### 5.4 **Adaptive** difficulty (net new, lightweight)

Don't build full knowledge-tracing (Bayesian / Deep-KT) for v1. Use signals we already
compute — this feature is pure app logic over our own quiz data, **no LLM call needed**:

- **Target ~85% recent accuracy** as the difficulty setpoint. Wilson et al. proved fastest
  learning at an error rate of ~15.87% (~85% correct): above 85% → raise difficulty, below
  → lower it / insert a review or remedial segment. `GenerationInput` already carries
  `difficulty`.
- **Rate per-item difficulty with a running Elo update** from correctness alone —
  item-response-lite adaptivity, no pretesting, and it tracks a learner whose ability rises
  as they improve.
- **Gate next-lesson unlock on a mastery threshold (~80%) plus a short correct streak** —
  Khan-style mastery, Bloom's mastery learning. **Do not gate on streak/XP or
  lessons-completed** — that rewards easy-lesson grinding, not learning ("streak creep").
  Measure "time spent learning well," not activity.
- **Spaced-repetition scheduling** is the other half — ts-fsrs (§4.1). Note this reinforces
  the FSRS choice: SM-2's "ease hell" (lapses cut ease ~15% each until items stick at the
  1.3 floor and over-review) is exactly what FSRS avoids by reverting difficulty toward the
  mean. Regardless of algorithm, **cap daily reviews**, and seed cold-start difficulty
  priors so brand-new items/learners aren't mis-scheduled.

### 5.5 AI provider strategy summary

| Feature | Recommended model | Why | Key API technique |
|---------|-------------------|-----|-------------------|
| Course generation | Haiku 4.5 / Sonnet 5 | bulk, structured, cost-sensitive | structured outputs, staged, streamed |
| AI tutor | Sonnet 5 | interactive quality/latency | grounded context + **prompt caching** + streaming |
| Short-answer grading | Haiku 4.5 | cheap, high-volume | structured outputs (`{correct,score,feedback}`) |
| Adaptivity | n/a (rules) | no LLM needed | reuse quiz/review signals |

All behind the `LessonGenerator`-style seam; BYO-key today, platform-key + tier-gating
later.

### 5.6 Provider-agnostic seam — caveats

The seam is the right design, but "swap the provider" is leakier than it looks:

- **One canonical schema + per-provider adapters.** OpenAI (`response_format: json_schema`,
  requires `additionalProperties:false` + all-required), Anthropic (`output_config.format`
  + strict tools), and Gemini (`responseSchema`) each accept a *different JSON-Schema
  subset* — the adapter must rewrite our canonical schema per provider. Unified SDKs
  (Vercel AI SDK, LiteLLM, LangChain) cut plumbing but are leaky: the same prompt "can
  produce significantly different outputs across providers."
- **No caching or token-counting parity.** OpenAI auto-caches; Anthropic needs explicit
  `cache_control`; Gemini charges cache storage. Token counts aren't portable — don't reuse
  one cost estimate across providers. A routing layer that reorders the prefix silently
  forfeits the cache discount.
- **BYO-key: use the "virtual key" pattern.** We already store per-user provider keys
  (`providerCredentials`). As we scale, front them with a proxy that issues per-user,
  revocable keys carrying RPM/TPM limits, a model allowlist, and a USD budget (429 on
  overspend) — so a leaked key is revoked in seconds and a runaway can't drain a wallet.
- **Detect capability at runtime and degrade gracefully** — structured outputs, caching,
  and tool-calling support all vary by *model*, not just provider; validate-and-retry when
  native structured output is absent.

---

## 6. Recommended architecture (the learning-experience layer)

Layer strictly on top of what exists; keep new logic pure where possible.

```
src/core/
  review.ts      (NEW) pure spaced-repetition scheduler (SM-2 v1 → ts-fsrs)   ← POC in this branch
  learning.ts    (NEW) pure learning-loop math: grade mcq, xp for a result, progress %,
                       streak transition, "is lesson complete"
  tutor.ts       (NEW) Tutor seam (interface + prompt building), pure
  grader.ts      (NEW) AnswerGrader seam (interface + prompt building), pure
src/server/
  learning.ts    (NEW) Drizzle writes: record attempt, grant xp, advance progress, bump streak
  tutor.ts       (NEW) Claude/OpenAI-backed Tutor
  grader.ts      (NEW) Claude/OpenAI-backed AnswerGrader
  anthropic-generator.ts (NEW, coordinate w/ main) Claude LessonGenerator
api/me/
  lesson/[id].ts        (NEW) fetch a lesson tree for the player
  answer.ts             (NEW) submit an answer → grade → attempt + xp + feedback
  lesson/[id]/complete  (NEW) complete a lesson → progress + xp + achievements + reviews
  review.ts             (NEW) today's review queue + submit a review grade
  tutor.ts              (NEW) streamed tutor endpoint
  enroll.ts             (NEW) trigger generation (wraps server/enroll.ts)
src/pages/app/
  learn.tsx             (NEW) the lesson player (reading/quiz/code/practice segments)
src/components/learn/
  LessonMarkdown.tsx    (NEW) react-markdown + Shiki
  QuizSegment.tsx / CodeExercise.tsx / TutorPanel.tsx (NEW)
```

Everything in `core/*` is pure and unit-tested (matching the repo's strong TDD
convention). The server files are thin Drizzle glue. The seams keep the AI providers
swappable and the whole thing testable with fakes.

---

## 7. Phased plan

Ordered by value and by *lowest collision* with the other panes.

- **Phase 0 — this doc + a pure POC (in this branch).** `core/review.ts` (SM-2) with
  tests, to make the SR recommendation concrete and prove the seam approach. No new deps,
  no shared-file edits. (Done — see §9.)
- **Phase 1 — Lesson player + learning loop (G1, G2).** The spine. `core/learning.ts`
  (pure, TDD) + `server/learning.ts` + the `learn.tsx` page + markdown rendering
  (react-markdown + Shiki). MCQ grading only (no AI needed yet). This alone turns the app
  from "dashboards over fixtures" into "you can actually take a lesson."
- **Phase 2 — Review system (G3).** Promote `core/review.ts` from POC to wired feature:
  `reviews` table, `/api/me/review`, a "due today" surface. Optionally swap SM-2 → FSRS.
  Pro-gate `smart_intervals`.
- **Phase 3 — AI tutor + AI grading (G4, G5).** The differentiators. Tutor/grader seams
  + Claude implementations + structured outputs + prompt caching. Pro-gate `ai_tutor`.
- **Phase 4 — Code exercises (G6).** Sandpack / Web-Worker test runner for `code`/
  `practice` segments.
- **Cross-cutting (coordinate w/ main) — provider-agnostic generation + Claude (§5.1).**

---

## 8. Coordination with the parallel panes

Three panes are in this repo at once. This pane must not collide.

| Pane | Owns | Touches |
|------|------|---------|
| **Main** | #1 real data (wire pages → `/api/me/*`), #2 **AI generation**, #3 auth hardening | `core/generation.ts`, `server/openai-generator.ts`, `server/enroll.ts`, `core/app-data.ts`, `server/app-data.ts`, the existing pages |
| **Pane 2** | ROM gallery | its own new gallery files |
| **This pane (education-core)** | the **learning experience**: lesson player, learning loop, review/SR, tutor, grader, code exercises | **new** files in `core/`, `server/`, `api/me/`, `pages/app/learn.tsx`, `components/learn/*` |

Collision-avoidance rules for this pane:

- **Do not modify** `core/generation.ts` / `server/openai-generator.ts` / `enroll.ts` —
  main owns generation (#2). Our Claude/structured-outputs proposal (§5.1) is filed as a
  *recommendation to main*, not something we implement here unless asked.
- **Do not rewrite** the existing `/api/me/*` read endpoints or `core/app-data.ts` —
  main owns "real data" (#1). We **add new** endpoints (`/api/me/lesson`, `/answer`,
  `/review`, `/tutor`, `/enroll`) rather than editing existing ones.
- The learning loop **writes** the very tables main **reads** (`xpEvents`,
  `userLessonProgress`, `dailyActivity`, `quizAttempts`). That's complementary, not
  conflicting — but the write-shape (XP amounts, streak rules) should be agreed with main
  so the dashboards reflect it. This is the one real interface to sync on.
- Net-new files only; no edits to `App.tsx` routing until integration time (add the
  `/app/learn/:id` route in a small, reviewable change).

---

## 9. Proof of concept in this branch

To make the "pull in a spaced-repetition library / own a pure scheduler" recommendation
concrete, this branch includes a **pure, dependency-free SR scheduler** with tests:

- `src/core/review.ts` — an SM-2-style scheduler behind a small, swappable surface,
  matching the existing pure-`core/` TDD style. It's the exact seam we'd later back with
  **ts-fsrs**.
- `src/core/review.test.ts` — unit tests.

It touches no shared files and adds no dependencies, so it's safe alongside the other
panes. It demonstrates: (a) the seam approach, (b) that SR is a small, ownable piece for
v1, and (c) the `reviews`-table shape we'd need.

---

## 10. Open questions for you

1. **Spaced repetition:** adopt **ts-fsrs** now (research-recommended: MIT, 0 deps, pure,
   ~20–30% more efficient than SM-2), or ship the zero-dep SM-2 POC first and upgrade?
   (Recommendation: ts-fsrs in production behind the seam; the POC uses SM-2 only to keep
   this exploration branch dependency-free — see §4.1 / §9.)
2. **Provider:** add **Claude** as a first-class generator/tutor/grader now (recommended,
   given repo guidance to default to latest Claude models) or stay OpenAI-only?
3. **Content:** AI-generate all `builtin` courses (clean licensing) vs. import an OSS
   exercise bank (Exercism) for practice? (Recommendation: generate + selectively import
   permissive exercises.)
4. **Code exercises in v1?** Or defer to Phase 4 and ship reading+quiz first?
5. **Division of labour on generation:** do you want this pane to *propose* the
   provider-agnostic + structured-outputs change to main, or implement it here on a
   coordinated branch?
```
