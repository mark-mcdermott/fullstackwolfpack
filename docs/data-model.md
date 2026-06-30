# Data model — working draft

> Status: discussion draft. Captures the proposed tables from the 8 mockups + the product vision. Open decisions are flagged with **DECISION**; nothing here is final until we settle those.

## The product, in one paragraph

A user picks tech topics to learn. They play a game (v1: their own Steam/etc. game, paused manually; v2: a built-in ROM player the app pauses). At a chosen interval the game pauses and the app serves the **next prebuilt chunk** of a lesson — sometimes a quiz. They finish the chunk and go back to the game. Everything is gamified: XP, levels, streaks, focus score, achievements, badges, skill growth. v1 lessons are **AI-generated** from the user's own OpenAI key; later, users can point at a video series / text tutorial or pick from open-source curricula.

## Domains

1. **Auth & profile** — exists (`users`, `credentials`, `webauthn_challenges`); extend `users` with profile + cached gamification fields.
2. **Settings** — preferences, focus-mode config, blocked sites.
3. **Catalog** — global, app-owned: `topics`, `achievements`, `levels`.
4. **Content** — the lessons themselves: `courses` → `lessons` → `lesson_segments`, plus `quiz_questions` and `exercises`.
5. **Progress & gamification** — per-user: enrollment, lesson/quiz progress, sessions, the XP ledger, daily activity, earned achievements, skills.
6. **Deferred (v2+)** — games/ROMs, imported curricula, billing, notifications, blog.

---

## 1. Auth & profile

`users` (exists) — extend with:

| column | type | notes |
|---|---|---|
| username | text unique | mock: `markdev` |
| bio | text | mock: profile bio |
| avatarUrl | text | |
| timezone | text | mock: `(UTC-05:00) Central Time` |
| xp | integer | **cached** total; source of truth is `xp_events` |
| level | integer | derived from xp via `levels`, cached for cheap reads |
| currentStreak | integer | cached from `daily_activity` |
| bestStreak | integer | cached |

(Already present: `id`, `email`, `displayName`, `totpSecret`, `totpEnabled`, `createdAt`.)

## 2. Settings

`user_settings` (1:1 with user) — everything on the Settings → Preferences / Focus Mode panels:
`defaultSessionLength`, `defaultFocusMode`, `language`, `startPage`, `autoStartNextLesson`, `soundEffects`, `motivationalQuotes`, `compactMode`, `theme`, `distractionBlocking`, `fullscreen`, `breakReminderMinutes`, `dataRetention`, `shareAnalytics`, `enableRecommendations`.

`focus_blocked_sites` (many per user) — `userId`, `domain`. (Settings → Focus Mode → Blocked sites: youtube.com, twitter.com…)

## 3. Catalog (global, app-owned)

`topics` — the Topics page catalog (React, TypeScript, …).

| column | notes |
|---|---|
| id, slug, name | |
| category | enum: frontend / backend / devops / databases / tools / ai_data |
| icon | |
| description | |
| status | active / coming_soon (mock: "AND MORE — COMING SOON") |

Per-user difficulty + progress lives in `user_topics`, not here.

`achievements` — catalog of every badge/achievement.

| column | notes |
|---|---|
| id, slug, name, description | |
| category | |
| icon, tier | tier ~ bronze/silver/gold styling |
| criteria | jsonb rule (e.g. `{type:"streak", days:7}`) |
| xpReward | mock: "+500 XP" |
| progressTarget | e.g. 7 (for "5 / 7") |

`levels` — `level`, `xpRequired`, `rewards` (jsonb). Drives the level bar + "Level 13 Reward" preview. Could start as a constant and graduate to a table.

## 4. Content — **the crux**

The flexible spine that supports both v1 (AI-generated, per-user) and later (shared open-source curricula, imported video/text).

`courses` — a sequence of lessons for one topic, from one source.

| column | notes |
|---|---|
| id | |
| topicId → topics | |
| ownerUserId → users (nullable) | **null = global/shared**; set = this user's AI-generated track |
| source | enum: `ai` / `builtin` / `imported` |
| sourceUrl | for imported video/text |
| model | e.g. `gpt-4o` — provenance for AI courses |
| difficulty | beginner / intermediate / advanced |
| status | `generating` / `ready` / `failed` |

`lessons` — `id`, `courseId`, `order`, `title`, `estMinutes`, `status`. ("LESSON 03 OF 08")

`lesson_segments` — **the chunk served per pause.** `id`, `lessonId`, `order`, `type` (`reading` / `code` / `practice` / `quiz`), `content` (jsonb/markdown), `estMinutes`. (The session plan: "Intro to Generics · 2 min", "Generic Functions · 6 min", …)

`quiz_questions` — `id`, `segmentId` (or `lessonId`), `prompt`, `type` (v1: `mcq`), `options` (jsonb), `correctIndex`, `explanation`.

`exercises` — the in-session code practice. `id`, `segmentId`, `prompt`, `starterCode`, `tests` (jsonb), `solution`, `hint`. ("Update the function to use generics…", Hint, Check Answer.)

## 5. Progress & gamification (per-user)

`user_topics` — enrollment + progress. `userId`, `topicId`, `difficulty`, `lessonsCompleted`, `progressPct`, `lastViewedAt`. Drives Topics %, Current Focus, Topic Progress, Recently Viewed.

`user_lesson_progress` — `userId`, `lessonId`, `status` (not_started/in_progress/completed), `score` (quiz %), `resumePct`, `completedAt`. Drives Recent Lessons (85%/90%), Next Up (resume 65%), lessons-completed counts.

`quiz_attempts` — `userId`, `questionId`, `lessonId`, `selectedIndex`, `isCorrect`, `createdAt`. Drives avg quiz accuracy, quizzes taken, accuracy-over-time.

`sessions` — one play↔learn session. `userId`, `startedAt`, `endedAt`, `playMinutes`, `learnMinutes`, `focusScore`, `lessonsCompleted`, `playIntervalMin`, `learnIntervalMin`, `focusMode` (bool). Drives Session history, focus-score trend, sessions count, hours played vs hours learned, session goal (10 play // 10 learn).

`xp_events` — **the ledger; single source of truth for XP.** `userId`, `type` (lesson_completed / quiz / streak / achievement / …), `xp`, `refType`, `refId`, `description`, `createdAt`. Drives the Recent Activity feed (+80 XP), XP-over-time charts, and total XP (sum → cached on `users`).

`daily_activity` — one row per user per day (rollup). `userId`, `date`, `status` (completed/partial/missed), `xpEarned`, `minutesLearned`, `lessonsCompleted`. Makes the 7-day grid + streak calendar + current/best streak cheap.

`user_achievements` — `userId`, `achievementId`, `status` (locked/in_progress/earned), `progressCurrent`, `earnedAt`. Drives the Achievements page (earned / in-progress / locked, "5 / 7").

`user_skills` *(maybe — see DECISION)* — `userId`, `skillKey` (problem_solving / code_quality / speed / system_design / debugging / concepts), `score`, `baseline`. Drives the Skills radar + improvement. Could be derived instead of stored.

---

## Open decisions

**DECISION A — Lesson ownership (biggest one).** Are lessons global/shared or per-user AI-generated? → *Recommend:* model `courses.ownerUserId` nullable + `source` enum so both coexist. v1 only creates `source:'ai'` courses owned by the user; the shared-curriculum path slots in later with no schema change.

**DECISION B — OpenAI API key storage.** The user supplies their own key. → *Recommend (v1):* **don't persist it server-side.** Hold it client-side (secure storage) and proxy generation through the server without storing it. Avoids encrypting/owning a secret. If we later want server-side background generation, add an encrypted `provider_credentials` table then.

**DECISION C — Generation timing.** Your description says generate the whole set up front and serve prebuilt chunks. → *Implied:* AI output is persisted into `lessons`/`lesson_segments` at enroll time (`courses.status: generating → ready`). Content tables are needed regardless of the key decision.

**DECISION D — Quiz model (v1).** → *Recommend:* keep it to `mcq` only — `quiz_questions` + `quiz_attempts` as above. v2 adds free-text (AI-graded), code challenges, spaced repetition.

**DECISION E — Blog.** The blog mock is marketing content. → *Recommend (v1):* MDX / content-collection, **no DB tables**. Add `posts`/`categories`/`tags` only if you want a dynamic CMS.

**DECISION F — Skills radar.** → *Recommend:* derive from topic/quiz data for v1 (or seed), defer a dedicated `user_skills` table unless you want hand-tuned values.

**DECISION G — Games / "hours played".** v1 has no game integration (manual pause). → *Recommend:* track play time only via `sessions.playMinutes` for now; defer `roms`, `game_sessions`, `savestates`, `supported_games` to v2.

---

## Mockup → tables map

| Mock | Powered by |
|---|---|
| Dashboard | users (xp/level/streak), user_topics (current focus), user_lesson_progress (recent/next-up), daily_activity (7-day), xp_events (progress chart), user_achievements |
| Sessions | sessions, lessons + lesson_segments (plan), exercises, quiz_questions, user_lesson_progress |
| Progress | xp_events, user_topics, daily_activity, user_skills, recent activity (xp_events) |
| Stats | sessions, xp_events, quiz_attempts, user_topics (time by topic), daily_activity |
| Topics | topics, user_topics |
| Achievements | achievements, user_achievements, levels |
| Settings | users, user_settings, focus_blocked_sites |
| Blog | (MDX, not DB — proposed) |

## Suggested schema file split (`src/db/schema/`)

`auth.ts` (exists) · `profile.ts` · `settings.ts` · `catalog.ts` (topics, achievements, levels) · `content.ts` (courses, lessons, segments, quizzes, exercises) · `progress.ts` (user_topics, lesson progress, quiz attempts, sessions, xp_events, daily_activity, user_achievements, user_skills).
