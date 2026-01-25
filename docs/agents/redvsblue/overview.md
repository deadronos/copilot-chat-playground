# RedVsBlue Overview

This folder documents how the Red vs Blue demo is wired in the frontend. Use this as quick guidance when you need to change behavior, add UI, or debug rendering/telemetry.

## Key entry points
- UI shell: `src/frontend/src/redvsblue/RedVsBlue.tsx`
- Game hook: `src/frontend/src/redvsblue/useGame.ts`
- Engine (simulation): `src/frontend/src/redvsblue/engine/engine.ts`
- Renderers: `src/frontend/src/redvsblue/renderer/CanvasRenderer.ts`
- Worker wrapper: `src/frontend/src/redvsblue/worker/engineWorkerWrapper.ts`
- Telemetry: `src/frontend/src/redvsblue/TelemetryConnector.ts` and `src/frontend/src/redvsblue/stores/telemetry.ts`

## High-level data flow
1) `RedVsBlue` creates refs for the canvas and container.
2) `useGame` owns engine lifecycle, rendering, telemetry wiring, and resize handling.
3) Engine updates generate snapshots and telemetry events.
4) Renderer draws snapshots to the canvas.
5) Telemetry events flow into the telemetry store and are drained by the connector when enabled.

## Common toggles
- Query params:
  - `rvbWorker=1` enables worker mode.
  - `rvbRenderer=offscreen` selects offscreen rendering (requires worker mode + OffscreenCanvas support).
- UI store:
  - `useUIStore().selectedRenderer` controls canvas vs offscreen renderer choice.
  - `useUIStore().telemetryEnabled` gates outgoing telemetry.
