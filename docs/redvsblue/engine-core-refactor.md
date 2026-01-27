# Engine Core Helpers — Refactor Summary 🔧

**Why:** The previous `core.ts` contained multiple responsibilities (AI config, collision handling, particle creation). Extracting focused helpers reduces complexity, improves testability, and makes incremental changes safer.

## What changed
- Extracted `engine/collisions.ts` — collision detection & resolution, telemetry emission, particle creation.
- Extracted `engine/particles.ts` — centralized particle factory (`createParticles`, `createDeathParticles`).
- Extracted `engine/aiConfig.ts` — deterministic per-ship AI config builder (`buildAiConfig`).
- `engine/core.ts` now delegates to these helpers and keeps the update loop focused on orchestration.

## Files added/modified
- Added: `src/frontend/src/redvsblue/engine/collisions.ts`
- Added: `src/frontend/src/redvsblue/engine/particles.ts`
- Added: `src/frontend/src/redvsblue/engine/aiConfig.ts`
- Modified: `src/frontend/src/redvsblue/engine/core.ts` (delegation)
- Modified: `src/frontend/src/redvsblue/engine/index.ts` (exports)

## Tests & Validation
- Unit tests added: `tests/frontend/unit/redvsblue/engine/collisions.test.ts`, `tests/frontend/unit/redvsblue/engine/particles.test.ts`, `tests/frontend/unit/redvsblue/engine/aiConfig.test.ts`.
- Run tests: `pnpm -F @copilot-playground/frontend test tests/frontend/unit/redvsblue/engine` (or full suite: `pnpm -F @copilot-playground/frontend test`).

## Acceptance Criteria
- Collision behavior (bullet_hit, ship_destroyed) unchanged (covered by tests).
- Particle counts/colors are produced consistently via factory (covered by tests).
- Engine integration tests pass locally.

## Follow-ups

- Consider performance benchmarks for particle allocation and GC.
- Add particle pooling if profiling shows alloc churn.
