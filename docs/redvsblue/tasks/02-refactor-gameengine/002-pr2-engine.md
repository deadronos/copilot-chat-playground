# PR 002 — Engine core extraction

Date: 2026-01-24T13:14:01.578Z

Summary
-------
Port the simulation logic out of the React component into a pure `Engine` class (no DOM) that provides a deterministic `step()` API, control methods, and telemetry hooks.

Objectives
----------
- Implement `Engine` with update loop, spawn/reset, collision detection, and event emission.
- Keep behavior identical to the existing demo.

Detailed tasks
--------------
1. Create `src/frontend/src/redvsblue/engine/engine.ts` implementing:
   - `class Engine` with internal arrays for ships/bullets/particles/stars and a `tick` counter.
   - Methods: `start()`, `stop()`, `step(dt?:number)`, `reset()`, `spawnShip(team)`, and `on(event, cb)` for telemetry and lifecycle events.
   - Emit telemetry using a lightweight emitter: `telemetry` events for spawn/shoot/hit/death/roundStart/roundEnd.
2. Update `engine/index.ts` to export `createEngine(config?:EngineConfig)` which returns a new `Engine` instance.
3. Port Ship/Bullet/Particle logic from the original component into internal engine helpers; ensure math and constants match the original.
4. Add unit tests: `engine/engine.spec.ts` verifying step determinism, spawn behavior, and a collision death scenario.
5. Minimal wiring: do not replace RedVsBlue rendering yet; optionally add a short-lived call in RedVsBlue to createEngine() (no behavior change) to validate module integration.

Files to create/modify
---------------------
- Create: `src/frontend/src/redvsblue/engine/engine.ts`
- Modify: `src/frontend/src/redvsblue/engine/index.ts` to export `createEngine`
- Tests: `src/frontend/tests/engine/engine.spec.ts`

Tests & validation
------------------
- Unit tests pass (Vitest)
- Sanity run of the demo shows behavior identical to baseline

Acceptance criteria
-------------------
- Engine API is available and deterministic tests pass.
- No perceptible change to demo behavior.

Estimated effort
----------------
- Medium: 4–8 hours (depending on porting details).

Rollback
--------
- Revert the engine code and keep the original component until the next PR merges.
