# Cleanroom v2 — roadmap & thesis

> A reminder to self, written mid-2026 while building Fullstack Wolfpack.
> Cross-posted in the app repo and in `cleanroom-proj/`.

## What changed

**Cleanroom v1** = "app scaffolder + mildly-tweaked shadcn components." In the
age of AI that's **dead on arrival** — an LLM generates that in one prompt, and
generic Tailwind/shadcn kits are free and infinite. Nobody pays premium for
generic components anymore. (This was the right instinct to pause it.)

## What did NOT get commoditized

Two things — and they're the actual strengths:

1. **Taste / a cohesive point of view.** LLMs are *bad* at distinctive
   aesthetics; left alone they regress to safe, generic "another rounded-card
   SaaS dashboard." A strong, opinionated design *language* — the whole system
   (type, spacing rhythm, motifs, restraint), not individual components — is hard
   to get from a model and is exactly what makes an AI-built app not look
   AI-built.
2. **The AI-context layer.** The product shape that didn't exist pre-AI: ship a
   design system **so an agent builds on-brand automatically** — tokens +
   components + an `llms.txt`/`AGENTS.md` that teaches the aesthetic and rules.
   "A spine that keeps your AI from producing generic slop" is a pitch people pay
   for *because* everyone builds with agents now.

## The reframe

**Cleanroom v2 = a small catalog of genuinely distinctive, dogfooded, AI-native
design systems — distributed copy-in (shadcn registry model) with the
agent-context baked in.** Not a scaffolder.

## The SKUs (raw material already exists)

- **FW-01 "tactical / swiss"** (from Fullstack Wolfpack) — mono/uppercase, corner
  brackets, red accent, barcode motifs, wolf art. A real POV. Niche-premium
  audience: indie devs, AI/devtools/crypto/gaming brands who *want* to look
  non-generic. On-trend as a reaction to the sea of samey AI apps. **This is the
  one that could pay.**
- **"Meme UI"** (from hoobie) — playful/meme aesthetic, rarer as a kit. More a
  **marketing magnet / attention driver** than a revenue line. Great as the thing
  that gets you noticed; tactical is the thing that sells.

## The moat

It isn't the CSS — it's that these are **dogfooded**: extracted from real,
shipped, distinctive apps. Speculative kits die; kits you actually use stay
maintained and carry credibility. That's the edge over the penny-a-dozen crowd.

## Hard truths

- The kit is **~20% of the work; distribution + marketing is ~80%.** The concept
  is sound; whether it *sells* is a validation question, not a build question.
- Maintaining a kit is a tax on app velocity **unless** it's genuinely extracted
  from apps you're already building (which is the whole model here).
- Two aesthetics is a fine starting catalog — don't over-invest before demand.

## Principles

- **Dogfood → extract → publish. One direction only.** Real apps own their copy
  of the design system; cleanroom *reads from* them to publish. **Never
  live-link an app to cleanroom** (don't couple app uptime/versioning to a side
  project). Copy-in, like shadcn.
- **Registry distribution.** Publish as a shadcn-compatible registry so
  `npx shadcn add <url>` pulls the components. That's the model that won.
- **Validate before rebuilding the platform.** Don't rebuild the scaffolder.

## Phased plan

- **Phase 0 — extract, registry-ready (nearly free).** When Fullstack Wolfpack
  splits into a workspace monorepo (see `docs/astro-migration-plan.md`), pull the
  FW-01 system into `packages/ui` with **tokens separated from components** and a
  **shadcn-registry-compatible layout**. This is the same work either way — do it
  once, correctly, and cleanroom-publish becomes a `git subtree`/registry step.
- **Phase 1 — validate cheap.** Publish FW-01 as a registry + a one-page site
  (or even Gumroad). Add the `llms.txt` agent-context layer. See if anyone
  installs/buys. Minimal spend.
- **Phase 2 — only if Phase 1 bites.** Rebuild cleanroom as the *catalog*
  (tactical + meme as two SKUs), lean into the "AI-native design systems that
  keep your agent on-brand" positioning, and invest in marketing (the 80%).

## Related

- `docs/astro-migration-plan.md` in the Fullstack Wolfpack repo — the monorepo /
  `packages/ui` extraction that makes Phase 0 free.
- Source aesthetics: FW-01 (fullstack-wolfpack), meme UI (hoobie).
