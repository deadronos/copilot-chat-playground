# RedVsBlue Refactor Plan

Date: 2026-01-24

Goal
- Refactor `RedVsBlue.tsx` into smaller components and isolate the `<canvas>` element inside its own subcomponent so renderer/offscreen toggling can be handled by remounting a single-purpose canvas wrapper.

Subtasks
- [x] Review `RedVsBlue.tsx` and note the current concerns to split (query param init, canvas wiring, telemetry, HUD, controls, inline styles).
- [x] Define the new component boundaries and props (e.g., `RedVsBlueLayout`, `GameCanvasContainer`, `HudTopBar`, `GameControls`, `GameStyles`).
- [x] Implement a `GameCanvasContainer` (or `GameCanvas`) component that owns the `<canvas>` element and its keying/remount strategy; ensure the canvas remounts only when the renderer mode changes.
- [x] Move HUD and control blocks into their own presentational components and keep state wiring in `RedVsBlue` (or a new container component).
- [x] Verify `useGame` still receives stable `canvasRef`/`containerRef` and that telemetry connector continues to mount correctly.
- [x] Manually smoke-test renderer toggling, ship spawn/reset, and UI overlay positioning.

Notes
- Keep the offscreen renderer switch path compatible with React StrictMode by forcing a fresh canvas element per renderer change.
- Preserve existing query param behavior (`rvbWorker`, `rvbRenderer`) while refactoring.
