# PR 003 — Renderer, useGame hook & Zustand stores

Date: 2026-01-24T13:14:01.578Z

Summary
-------
Introduce a pluggable `Renderer` implementation (CanvasRenderer), extract a `useGame` hook to orchestrate engine+renderer, and centralize game/UI state in two Zustand stores (`GameState` and `UIStore`).

Objectives
----------
- Keep engine pure and have it update the `GameState` store.
- Renderer subscribes to the `GameState` store and draws snapshots.
- `useGame` exposes easy-to-use controls for UI components and wires lifecycle.

Detailed tasks
--------------
1. Create stores:
   - `src/frontend/src/redvsblue/stores/gameState.ts` — Zustand store with `setSnapshot`, selectors for `redCount`/`blueCount`, and `clear()`.
   - `src/frontend/src/redvsblue/stores/uiStore.ts` — Zustand store for `running`, `selectedRenderer`, `fps`, `telemetryBuffer` (or separate telemetry store) and setter actions.
2. Implement Renderer:
   - `src/frontend/src/redvsblue/renderer/CanvasRenderer.ts` implementing `init(canvas)`, `render(state)`, and `destroy()`.
   - Ensure the renderer reads snapshots from `useGameState.getState()` or subscribes using `subscribe` to avoid React re-renders.
3. Implement `useGame`:
   - `src/frontend/src/redvsblue/useGame.ts` creates the engine (or worker in future), subscribes the engine to push snapshots into `gameState.setSnapshot`, and updates `uiStore.setRunning` on start/stop.
   - Expose controls: `start()`, `stop()`, `spawnShip(team)`, `reset()` plus selectors: `redCount`, `blueCount`, `running`.
4. Update `src/frontend/src/redvsblue/RedVsBlue.tsx` to replace inline game logic with `useGame` and use `useUIStore`/`useGameState` selectors for UI.
5. Tests:
   - Integration test that mounts `RedVsBlue`, simulates button clicks, and asserts counts update (mock `requestAnimationFrame` and canvas).

Files to create/modify
---------------------
- Create: `renderer/CanvasRenderer.ts`, `renderer/index.ts`
- Create: `useGame.ts`
- Create: `stores/gameState.ts`, `stores/uiStore.ts`
- Modify: `RedVsBlue.tsx` to use `useGame`

Tests & validation
------------------
- Integration tests pass and UI behavior identical.
- Confirm that the Renderer does not cause React re-renders on each tick (use store subscription checks).

Acceptance criteria
-------------------
- Visual parity with baseline demo.
- Renderer pulls state from Zustand and not via React re-renders.
- UI controls operate through `useGame` and update `UIStore`.

Estimated effort
----------------
- Medium: 6–12 hours.

Rollback
--------
- Revert RedVsBlue changes and keep engine/store branches separate until stable.
