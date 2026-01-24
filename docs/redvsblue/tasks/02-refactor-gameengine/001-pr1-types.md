# PR 001 — Types & Engine scaffold

Date: 2026-01-24T13:14:01.578Z

Summary
-------
Create strict TypeScript interfaces and a minimal engine export scaffold so later PRs can implement the engine while keeping the app buildable.

Objective
---------
Add `types.ts` with all core game types and an `engine/index.ts` that re-exports types and provides a `createEngine` stub.

Detailed tasks
--------------
1. Create `src/frontend/src/redvsblue/engine/types.ts` with definitions for:
   - Team, Ship, Bullet, Particle, Star, GameState, EngineConfig, TelemetryEvent, Engine public interface.
   - Include JSDoc comments for fields used by renderer and telemetry.
2. Create `src/frontend/src/redvsblue/engine/index.ts` which re-exports the types and exports a `createEngine(config?: EngineConfig): Engine` stub (no runtime behavior yet).
3. Add a tiny smoke test that imports the types and the createEngine symbol to ensure the module resolves at build time.

Files to create
---------------
- src/frontend/src/redvsblue/engine/types.ts
- src/frontend/src/redvsblue/engine/index.ts

Tests & validation
------------------
- Run TypeScript compile (project build) to ensure no errors.
- Verify `pnpm run dev` or the frontend build still starts (no runtime changes expected).

Acceptance criteria
-------------------
- Project compiles with the new files.
- No behavior change in the running demo.

Estimated effort
----------------
- Small: 1–2 hours.

Rollback
--------
- Revert commit if compilation errors or unexpected CI failures appear.
