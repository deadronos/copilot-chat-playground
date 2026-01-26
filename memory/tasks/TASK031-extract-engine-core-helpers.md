# TASK031 - Extract engine core helpers (collisions, particles, AI config)

**Status:** In Progress  
**Added:** 2026-01-26  
**Updated:** 2026-01-26

## Original Request
Break `engine/core.ts` into focused helpers: collision detection/resolution, particle factory, and AI-config builder to improve testability and reduce cognitive complexity.

## Requirements (EARS)
- WHEN `updateEngineCore` runs, THE SYSTEM SHALL delegate collision detection and resolution to an isolated `collisions` module.  
  Acceptance: Unit tests validate bullet-hit, ship-death, and particle-generation cases.

- WHEN particles are created, THE SYSTEM SHALL use a centralized particle factory to ensure consistent properties (color, lifetime, size).  
  Acceptance: Unit tests assert particle count, colors, and lifetime computations.

- WHEN AI config is computed for each ship, THE SYSTEM SHALL use a deterministic, testable builder given tuning overrides.  
  Acceptance: Unit tests validate overrides and default merges.

## Thought Process
`core.ts` bundles several responsibilities that are naturally separable. Extracting these concerns reduces iteration cost and enables focused unit tests to protect game logic.

## Implementation Plan
1. Add unit tests that capture current collision and particle behaviors (red → tests covering hit, death, and particle counts).  
2. Implement `engine/collisions.ts` and tests to mirror existing `checkCollisions` behavior.  
3. Implement `engine/particles.ts` particle factory and tests that respect UI config merging.  
4. Implement `engine/aiConfig.ts` for building per-ship AI config and tests.  
5. Replace in `core.ts` with imports from new helpers and run tests.  
6. Add PR notes documenting why these extractions reduce risk and improve test coverage.

## Progress Log
### 2026-01-26
- Implemented `engine/collisions.ts` to isolate collision detection/resolution and added unit tests (hit, death, particle creation).
- Implemented `engine/aiConfig.ts` to build per-ship AI config and added unit tests.
- Next: extract `engine/particles.ts` particle factory and replace direct `new Particle(...)` usages; update docs and finalize refactor PR.
