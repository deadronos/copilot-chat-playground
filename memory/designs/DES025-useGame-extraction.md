# DES025 - Frontend: Extract engine & renderer responsibilities from `useGame`

**Status:** Proposed
**Related tasks:** TASK026
**Related issues:** #83

## Summary

`useGame` implements multiple responsibilities: engine lifecycle (main vs worker), worker wrapper management, renderer/offscreen transfer, resize handling and FPS/telemetry forwarding. This design extracts smaller modules to simplify testing and clarify responsibilities.

## Goals

- Make `useGame` a lightweight orchestrator that composes smaller managers.
- Provide clear, testable modules for engine and renderer behavior.
- Preserve runtime behavior and public API (start/stop/spawn/reset).

## Components

- `engineManager.ts` — create/init/reset/destroy engine, abstract over worker wrapper (start/stop/setCanvas/resize). Provide typed interface used by `useGame`.
- `rendererManager.ts` — initialize renderer, handle OffscreenCanvas transfer/resizing, and subscribe to snapshots to draw frames.
- `telemetryForwarder.ts` — manage telemetry handler registration and pipeline to store.
- `useFps.ts` — small hook to compute/publish FPS windows.

## Testing

- Unit tests for `engineManager` in worker and non-worker modes (mock worker wrapper). Ensure `.init/.reset/.start/.stop` semantics are preserved.
- Unit tests for `rendererManager` focusing on offscreen transfer success/failure, resize behavior, and subscription cleanup.
- Tests for `useFps` timing logic.

## Acceptance criteria

- `useGame` reduced to orchestration code (~<300 lines as soft target).
- Each new module has unit tests with edge cases covered.
- No regressions in worker vs main thread behavior.


---

*Created: 2026-01-26*
