# Terminal / Git Lane — Implementation Plan

> Roadmap item: _Learning / education → "More languages + a terminal/git lane"_.
> **Status:** planned (approach chosen 2026-07-06). Not started.
> **Build order:** TS-exercise warm-up → git-lane Phase 0 → 1 → 2. (Python is a separate, later track.)

## Goal

Today an exercise is _"implement a JS function; hidden tests call it and deep-compare
return values"_ (`core/exercise.ts` → `new Function` in a Web Worker). That's great for
language topics but can't teach **git / the CLI by doing** — the app's signature promise.
This adds a **terminal/git exercise kind** where the learner types shell commands, state
mutates (files, repo), and success is checked against the resulting state.

The roadmap bullet also mentions **TS** and **Python** execution — those are extensions of
the _existing_ function-runner and are tracked here as adjacent, separable items.

## Decision: simulated git, not real git

| | **A. Scripted git simulator** ✅ chosen | **B. Real git via WASM** (WebContainers / v86 / isomorphic-git) |
|---|---|---|
| What | A pure JS model of a repo + filesystem supporting a curated command subset | Actual git/shell running in-browser |
| Fits our architecture | ✅ a `core/git-sim.ts` pure engine, exactly like `core/exercise.ts` | ✗ heavy WASM bundle + worker plumbing |
| Auto-grading | ✅ deterministic — assert against model state (same reason the solution-passes-tests ship gate matters) | ⚠️ hard to assert cleanly |
| Cost / licensing | ✅ small, no deps, no network | ✗ WebContainers is licensed; v86/WASM-linux is megabytes |
| Teaching fit | ✅ curated subset ⇒ focused lessons + clear feedback | overkill for "learn git basics" |

**Chose A.** It mirrors how the JS engine is a curated deterministic thing (not a full Node
runtime), stays in the pure-core/worker pattern, and gives reliable auto-grading — which we
learned (PRs #85/#86) is the crux of shippable generated exercises.

## Where it plugs into the existing exercise seam

The exercise seam is JS-only today. The lane adds a **discriminated exercise kind**:

- **`core/exercise.ts`** — the JS engine (`runTestCases`, `solutionPassesTests`). Unchanged.
- **`db/seed-content.ts`** `SeedExercise` gains **`kind?: 'js' | 'git'`** (default `'js'`, back-compat).
  A `git` exercise carries `setup` + `goals[]` + `solution: string[]` instead of `starterCode`/`tests`.
- **`db/schema/content.ts`** `exercises` table — add a `kind` column + a `config` jsonb for git setup/goals.
- **`core/lesson-view.ts`** `exerciseViewSchema` + **`server/learning.ts`** `getLessonView` — carry `kind`/config.
- **`pages/app/learn.tsx`** — branch: `exercise.kind === 'git' ? <TerminalExercise> : <CodeExercise>`.
- **`db/generated-to-seed.ts`** + **`server/course-store.ts`** — thread the new fields through both write paths.

## Phases (multi-PR, like the topic-settings feature)

### Phase 0 — `core/git-sim.ts` engine + data model _(no UI)_
- Pure engine: filesystem + repo model. `applyCommand(state, line) → {state, output}`, `runSession`, `checkGoals`.
  - **Command subset:** file ops (`pwd`/`ls`/`cat`/`echo >`/`touch`/`mkdir`/`rm`) + git
    (`init`/`status`/`add`/`restore`/`commit`/`log`/`branch`/`switch`/`checkout`/`merge`).
  - **Goal types:** `branchExists`, `branchIsCurrent`, `commitCountAtLeast`, `fileStaged`,
    `fileTracked`, `fileContentEquals`, `commitMessageMatches`, `workingTreeClean`, `mergedInto`.
- Heavily unit-tested — this deterministic engine is the heart of the lane.
- Extend the exercise data model (`kind` + `config`) through seed model, `exercises` table, lesson-view,
  and `learning.ts`; `npm run db:push`.
- **`gitSolutionSatisfiesGoals()`** helper — run `solution` commands, assert every goal — the ship gate,
  analogous to `solutionPassesTests`.

### Phase 1 — terminal UI + player wiring + hand-authored exercises
- **`components/learn/terminal-exercise.tsx`** — transcript + single-line input, runs each command through
  the sim, a **live goal checklist**, hint / "show solution" (replays the solution commands).
- Wire `learn.tsx` to branch on `kind`.
- Hand-author **2–3 git exercises** into the **git-github** built-in (first commit → branch → merge) to prove
  the lane end-to-end; extend `db/seed-content.test.ts` to also validate git-goal solutions.

### Phase 2 — AI generation of git exercises
- Extend `generatedExerciseSchema` + `buildGenerationPrompt` so the generator emits git exercises for git/CLI
  topics (invert the current JS-topic gate: git topics → git exercises).
- The `gen:builtins` ship gate validates git solutions (drop-invalid, exactly like JS — Claude is good at this).
- Regenerate `git-github` (and any CLI-shaped topic) with real git exercises.

## Adjacent (same roadmap bullet, but separable & cheaper)

- **TS exercises _(the warm-up — do first)_** — add **`language?: 'js' | 'ts'`** to the _existing_ engine;
  transpile TS→JS (via **`sucrase`**, small, worker-safe) before `new Function`. Threads the same
  "add a discriminator field through the whole stack" plumbing the git lane needs, but tiny — a good
  de-risking step, and directly valuable for the `typescript` topic. (Do NOT pull in the full `typescript`
  package — it's a build-time devDep and would bloat the client bundle.)
- **Python exercises** — Pyodide (WASM, ~6 MB) in a worker, parallel to `core/exercise.ts`. Bigger lift;
  its own later track. Lazy-load Pyodide only when a Python exercise runs.

## Recommended sequence

1. **TS-exercise warm-up** — proves the multi-kind plumbing cheaply.
2. **Git lane Phase 0** (engine + data model), then **Phase 1** (UI + hand-authored), then **Phase 2** (generation).
3. **Python** whenever a Python-heavy topic justifies the Pyodide bundle.
