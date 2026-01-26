# TASK026 - Extract engine & renderer responsibilities from `useGame`

**Status:** Pending
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
| ID  | Description                     | Status      | Updated      | Notes |
| --- | ------------------------------- | ----------- | ------------ | ----- |
| 26.1 | Add `engineManager.ts`          | Not Started | 2026-01-26   |      |
| 26.2 | Add `rendererManager.ts`        | Not Started | 2026-01-26   |      |
| 26.3 | Add `telemetryForwarder.ts`     | Not Started | 2026-01-26   |      |
| 26.4 | Add `useFps.ts`                 | Not Started | 2026-01-26   |      |
| 26.5 | Simplify `useGame` and tests    | Not Started | 2026-01-26   |      |

## Progress Log
### 2026-01-26
- Task created and design file DES025 added.


---

*Acceptance criteria: `useGame` is orchestration-only, each module has unit tests, no behavior regressions.*
