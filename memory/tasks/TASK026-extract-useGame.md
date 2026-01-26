# TASK026 - Extract engine & renderer responsibilities from `useGame`

**Status:** Completed
**Added:** 2026-01-26
**Updated:** 2026-01-26
**Related issue:** #83

## Original Request

Decompose `useGame.ts` to move engine lifecycle, worker wrapper logic, renderer/offscreen transfer, resize handling, FPS and telemetry logic into smaller, testable modules.

## Thought Process

`useGame` mixes many concerns that are easier to unit test in isolation. An incremental extraction reduces risk: extract engine manager first (worker vs non-worker semantics), then renderer manager, then telemetry/fps helpers, and finally simplify the hook.

## Implementation Plan

- Add `engineManager.ts` and unit tests for worker/non-worker flows.
- Add `rendererManager.ts` with offscreen transfer and tests for failure/success paths.
- Add `telemetryForwarder.ts` and `useFps.ts` and test timing behavior.
- Simplify `useGame` to orchestrate those pieces and add integration tests.


### Subtasks

|ID|Description|Status|Updated|Notes|
|---|---|---|---|---|
|26.1|Add `engineManager.ts`|Completed|2026-01-26|Added unit tests.|
|26.2|Add `rendererManager.ts`|Completed|2026-01-26|Added offscreen/resize tests.|
|26.3|Add `telemetryForwarder.ts`|Completed|2026-01-26|Added gating/error tests.|
|26.4|Add `useFps.ts`|Completed|2026-01-26|Hook + harness tests.|
|26.5|Simplify `useGame` and tests|Completed|2026-01-26|Hook now orchestrates managers.|

## Progress Log

### 2026-01-26

- Task created and design file DES025 added.
- Added `engineManager`, `rendererManager`, `telemetryForwarder`, and `useFps` modules with unit coverage.
- Refactored `useGame` into a coordinator using the new managers.
- Ran frontend vitest suite (all tests passed; existing skips unchanged).


---

*Acceptance criteria: `useGame` is orchestration-only, each module has unit tests, no behavior regressions.*
