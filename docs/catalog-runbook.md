# Catalog & seeding runbook

Operational notes for the topic catalog and its built-in courses: where the content lives, how it reaches a database, how to take a topic off the menu without losing it, and which steps a deploy does **not** do for you.

This is a runbook, not a plan — it describes what to run and what to expect.

## Where built-in content lives

Built-in courses are read from the database at runtime, but the database is not the source of truth. Two committed files are:

| file | holds |
|---|---|
| `apps/site/src/app/db/seed-data.ts` → `SEED_TOPICS` | the topic rows (slug, name, category, icon, description) |
| `apps/site/src/app/db/seed-content.generated.ts` → `GENERATED_BUILTIN_COURSES` | ~557KB of generated lessons, segments, questions and exercises |

`seed-content.generated.ts` is written by `npm run gen:builtins` (an LLM call, needs a provider key) and committed after review. Course and lesson ids are **fixed** — `builtin-javascript`, `builtin-javascript-l1`, … — which is what makes seeding idempotent and means a re-seed restores content identically.

It currently carries courses for all twelve topics: `ai-agents`, `aws`, `docker`, `git-github`, `javascript`, `nextjs`, `nodejs`, `postgresql`, `python`, `react`, `tailwind`, `typescript`.

`scripts/seed.ts` walks both files and inserts into `topics`, `achievements`, `levels`, `courses`, `lessons`, `lesson_segments`, `quiz_questions` and `exercises`.

## The rule that surprises everyone

**`seed.ts` only ever inserts.** Every statement carries `onConflictDoNothing`, and nothing in it deletes.

Two consequences, and both have bitten:

1. **Commenting a topic out of `SEED_TOPICS` only affects a fresh seed.** A database seeded before the prune keeps every row. This is exactly why production listed twelve topics while a re-seeded dev database listed one — not drift, the seed working as designed. To change an already-seeded database, use [parking](#parking-topics).

2. **Regenerating content does not reach an existing database.** Re-running `gen:builtins` writes new ids, but a database that already holds the old course keeps serving it. Production ran for weeks on `builtin-js-essentials` — the superseded two-lesson hand-authored JavaScript course — because the nine-lesson `builtin-javascript` that replaced it in the repo was never seeded there. Invisible while eleven other topics shared the menu; the entire product once JavaScript was alone.

> **After every `gen:builtins`, re-seed each environment that should get the new content.** Nothing does it for you, and a deploy will not.

Where two built-in courses exist for one topic, the newest by `created_at` wins — both `getPublicCourseOutline` (guest) and `resolveActiveCourse` (signed-in) order that way. A superseded course left in place is dormant, not harmful.

## Seeding

```bash
npm run db:seed                                        # dev, from apps/site/.env
npx tsx --env-file=.env.prod scripts/seed.ts           # prod, from apps/site/
```

Safe to re-run: existing rows are skipped, missing ones are added. It never un-archives a topic and never deletes.

`--refresh-builtins` wipes every `source = 'builtin'` course first, then re-creates it from the current seed content. Use it when a course's *content* changed but its ids did not, and note that the wipe cascades to lessons, segments, questions, exercises **and any user progress recorded against them**. Owned AI-generated courses are untouched.

> **Check before running it on production.** The cascade is silent, and "fixing a typo" and "deleting everyone's progress on the built-in courses" are the same command. As of 2026-08-13 production carried 86 built-in lessons with **0 progress rows and 0 quiz attempts** against them, so the several reseeds that day cost nothing — but that was luck, not design. The moment real learners work through these lessons, every content edit destroys their progress.
>
> The query to run first (adjust for what you care about):
>
> ```sql
> select count(*) from user_lesson_progress p
>   join lessons l on l.id = p.lesson_id
>   join courses c on c.id = l.course_id
>  where c.owner_user_id is null;
> ```
>
> Review cards survive a refresh, but only by accident: `review_cards.item_id` is plain text rather than a foreign key, so nothing cascades to it. They keep working because seed ids are fixed — change a question id and they point at nothing.
>
> Making this safe is the subject of the open question in [`ROADMAP.md` → *Content source of truth*](ROADMAP.md).

## Parking topics

The non-destructive way to pare the menu back. `topics.status` takes `active`, `coming_soon` or `archived`; archiving keeps every row — the topic, its built-in course, and every learner's progress — and only removes it from the two galleries.

```bash
npm run db:park -- --list                   # catalog + status
npm run db:park -- --keep javascript        # archive everything else
npm run db:park -- --restore react docker   # bring topics back
npm run db:park -- --keep javascript --dry-run
```

Against production, run the script directly so it picks up the right env:

```bash
cd apps/site && npx tsx --env-file=.env.prod scripts/park-topics.ts --list
```

The script refuses unknown slugs, because `--keep javscript` would otherwise match no row and archive the entire catalog.

### What filters and what does not

| read | filtered on `status = 'active'` |
|---|---|
| `getPublicTopics` — the `/skill` gallery | **yes** |
| `getTopicsView` — the `/app/topics` gallery | **yes** |
| `getPublicCourseOutline`, `getCourseOutline`, the lesson player, adaptive, tailor, tracks | **no** — deliberately |

Only the browse card disappears. Deep links still resolve, enrolled courses keep working, and progress rows are untouched — which is the whole point of archiving rather than deleting.

**Un-parking is `--restore`, not a re-seed.** Because the seed is insert-only, uncommenting a topic in `SEED_TOPICS` and re-seeding leaves an existing archived row archived.

### Why not just delete?

Deleting a topic would be recoverable for *content* — it is committed, ids are fixed, a re-seed restores it byte for byte. But `topics.id` cascades to `user_topics`, and its lessons cascade to `user_lesson_progress`. Learner progress is not in git.

## Production

`apps/site/.env.prod` holds the production `DATABASE_URL` (Neon). It is not loaded automatically — npm aliases hardcode `.env` — so target prod by invoking `tsx` directly:

```bash
cd apps/site
npx tsx --env-file=.env.prod scripts/park-topics.ts --list
npx tsx --env-file=.env.prod scripts/seed.ts
```

**A deploy changes code only.** These do not happen on push:

- schema changes → `db:push` (or a targeted `ALTER`) against production
- regenerated course content → `db:seed` against production
- catalog visibility → `db:park` against production

Prefer a targeted statement over `drizzle-kit push` on production when the change is small — push diffs the entire schema, so any drift becomes part of what you apply. Adding the `archived` enum value was done as a single `ALTER TYPE topic_status ADD VALUE IF NOT EXISTS 'archived'` for that reason.

Order matters when a DB change and a code change ship together. Flipping topic status **before** the filtering code deployed was safe precisely because the running code read no status column — the database moved first and nothing changed until the deploy landed. Sequence writes so the intermediate state is harmless in whichever order they land.

## Verifying

The public endpoints are the fastest check, and they work against any environment:

```bash
curl -s https://fullstackwolfpack.com/api/me/public-topics
curl -s "https://fullstackwolfpack.com/api/me/public-course?topic=javascript"
```

These are uncached (`max-age=0, must-revalidate`), so there is no CDN layer to wait out — what they return is what the database holds. A parked topic should vanish from the first and still resolve in the second.

## Current state

Production, as of 2026-08-08: **JavaScript active, the other eleven archived**, serving `builtin-javascript` (9 lessons). The dormant `builtin-js-essentials` remains on the topic and is never selected.
