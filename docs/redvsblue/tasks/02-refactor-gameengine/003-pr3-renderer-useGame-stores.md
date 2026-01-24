# PR 003 — Renderer, useGame hook & Zustand stores

Date: 2026-01-24T13:14:01.578Z

Summary
-------
Introduce a pluggable `Renderer` implementation (`CanvasRenderer`), extract a `useGame` hook to orchestrate engine + renderer, and centralize game/UI state in two Zustand stores (`gameState` and `uiStore`).

Objectives
----------
- Keep the engine DOM-free and pure (it only simulates + returns snapshots).
- Renderer subscribes to Zustand and draws snapshots without driving React re-renders.
- `useGame` exposes simple controls for UI components and owns lifecycle/cleanup.

Non-goals (explicitly out of scope for PR 003)
----------------------------------------------
- No WebSocket/SSE telemetry transport (handled in PR 004).
- No Worker migration (handled in PR 005/006).
- No large engine API redesign (only small additions if absolutely required for resize).

Detailed subtasks (checkbox-driven)
----------------------------------
### 0) Pre-flight decisions (do these first)
- [ ] Confirm the current engine API in `src/frontend/src/redvsblue/engine`:
  - [ ] `createEngine()` exists and returns an object with `init`, `update(dtMs)`, `getState()`, `spawnShip(team)`, `reset()`, `destroy()`.
  - [ ] `getState()` returns the `GameState` type from `src/frontend/src/redvsblue/types.ts`.
- [ ] Decide how canvas resizing is handled in this PR:
  - [ ] Option A (simplest): set size once on mount; ignore future resizes.
  - [ ] Option B: recreate engine+renderer on resize (and call `reset()`).
  - [ ] Option C (preferred long-term): add an engine `resize(width,height)` API (only choose if it’s a small, safe change).
- [ ] Decide whether to include a telemetry buffer placeholder in `uiStore` now:
  - [ ] If PR 004 needs clean separation, skip it here and add later.
  - [ ] If PR 004 wants it ready, add `telemetryBuffer` + actions but don’t ship network code.

### 1) Zustand store: `gameState` (render + UI reads)
- [ ] Create `src/frontend/src/redvsblue/stores/gameState.ts`.
- [ ] Decide whether you need selector-based subscriptions from non-React code:
  - [ ] If yes, wrap the store with `subscribeWithSelector` (Zustand middleware) so `store.subscribe(selector, listener)` works.
  - [ ] If no, use plain `store.subscribe((state) => ...)` and derive `snapshot` inside the listener.
- [ ] Store state shape:
  - [ ] `snapshot: GameState | null`
- [ ] Store actions:
  - [ ] `setSnapshot(snapshot: GameState): void`
  - [ ] `clear(): void` (sets `snapshot` to `null`)
- [ ] Export selectors (functions, not hooks):
  - [ ] `selectSnapshot(state): GameState | null`
  - [ ] `selectRedCount(state): number` (derived from `snapshot?.ships`)
  - [ ] `selectBlueCount(state): number`
- [ ] Confirm non-React consumers can use the store:
  - [ ] `useGameState.getState()` is used by the renderer integration (if needed).
  - [ ] `useGameState.subscribe(...)` is usable without causing component re-renders (and matches the subscription style chosen above).

### 2) Zustand store: `uiStore` (runtime controls + lightweight metrics)
- [ ] Create `src/frontend/src/redvsblue/stores/uiStore.ts`.
- [ ] Store state shape (minimum):
  - [ ] `running: boolean`
  - [ ] `selectedRenderer: "canvas"` (string union that can expand later)
  - [ ] `fps: number | null` (`null` when stopped)
- [ ] Store actions (minimum):
  - [ ] `setRunning(running: boolean): void`
  - [ ] `setSelectedRenderer(renderer: "canvas"): void`
  - [ ] `setFps(fps: number | null): void`
- [ ] Optional (coordinate with PR 004): telemetry buffer placeholder
  - [ ] `telemetryBuffer: TelemetryEvent[]`
  - [ ] `pushTelemetry(event: TelemetryEvent): void`
  - [ ] `drainTelemetry(n?: number): TelemetryEvent[]`

### 3) Renderer contract (pluggable and React-independent)
- [ ] Create `src/frontend/src/redvsblue/renderer/types.ts` (or `renderer/index.ts`) defining:
  - [ ] `Renderer` interface: `init(canvas)`, `render(snapshot)`, `destroy()`.
  - [ ] Choose whether `render` accepts `GameState | null` or always a `GameState` (if always, `gameState.snapshot` must never be `null` after init).
- [ ] Create `src/frontend/src/redvsblue/renderer/CanvasRenderer.ts` implementing `Renderer`.
- [ ] Implement minimum drawing behaviors in `CanvasRenderer.render(...)`:
  - [ ] Clear + background fill (match baseline colors).
  - [ ] Stars from `snapshot.stars`.
  - [ ] Ships from `snapshot.ships` (color by team).
  - [ ] Bullets from `snapshot.bullets` (color by team).
  - [ ] Particles from `snapshot.particles` (alpha by age/lifetime if desired).
- [ ] Add `src/frontend/src/redvsblue/renderer/index.ts` exporting `CanvasRenderer` and the `Renderer` type.
- [ ] Ensure renderer does not rely on React:
  - [ ] No `useEffect`, no `useState`, no component rendering.
  - [ ] No per-frame state stored in React.

### 4) Store-driven rendering (no per-tick React updates)
- [ ] Decide how drawing is triggered (pick exactly one):
  - [ ] Strategy A (preferred): subscribe renderer to store snapshots:
    - [ ] If using `subscribeWithSelector`: `useGameState.subscribe(selectSnapshot, (snapshot) => renderer.render(snapshot))`
    - [ ] If not using `subscribeWithSelector`: `useGameState.subscribe((state) => renderer.render(selectSnapshot(state)))`
    - [ ] Unsubscribe on cleanup.
  - [ ] Strategy B: call `renderer.render(snapshot)` inside the RAF loop (still OK, but keep React out of the loop).
- [ ] Confirm React isn’t re-rendering every frame:
  - [ ] Make sure `RedVsBlue.tsx` only selects small derived values (counts, running) and not the whole snapshot.
  - [ ] Update FPS in `uiStore` at low frequency (e.g., 2–4 times/sec), not every tick.

### 5) `useGame` hook (engine lifecycle + RAF loop + wiring)
- [ ] Create `src/frontend/src/redvsblue/useGame.ts`.
- [ ] Define hook inputs:
  - [ ] Accept `canvasRef` (or `canvas`) and an optional config override object.
- [ ] Engine lifecycle:
  - [ ] Create engine via `createEngine()`.
  - [ ] Compute `canvasWidth`/`canvasHeight` and call `engine.init(config)`.
  - [ ] Call `engine.reset()` to seed the baseline 2 red + 2 blue ships.
  - [ ] On unmount: stop RAF, unsubscribe store listeners, call `engine.destroy()`.
- [ ] RAF loop:
  - [ ] On each frame: compute `dtMs`, call `engine.update(dtMs)`, then `gameState.setSnapshot(engine.getState())`.
  - [ ] Keep RAF id in a ref; ensure `stop()` cancels it.
  - [ ] Compute FPS and call `uiStore.setFps(...)` at low frequency.
- [ ] Renderer lifecycle:
  - [ ] Create `CanvasRenderer` instance.
  - [ ] Call `renderer.init(canvas)` once the canvas exists.
  - [ ] Ensure `renderer.destroy()` runs on cleanup.
- [ ] Hook return API (for UI):
  - [ ] `start(): void`
  - [ ] `stop(): void`
  - [ ] `spawnShip(team: Team): void`
  - [ ] `reset(): void`

### 6) Refactor `RedVsBlue.tsx` to use `useGame` + selectors
- [ ] Update `src/frontend/src/redvsblue/RedVsBlue.tsx`:
  - [ ] Remove in-component simulation logic (no Ship/Bullet/Particle classes inside React).
  - [ ] Keep `<canvas ref={canvasRef} />` and current styling/markup intact.
  - [ ] Replace local `useState` counts with store selectors:
    - [ ] `const redCount = useGameState(selectRedCount)`
    - [ ] `const blueCount = useGameState(selectBlueCount)`
  - [ ] Replace `spawnShipRef`/`resetSimulationRef` with `useGame()` controls.
  - [ ] Ensure controls still work: `+1 RED`, `+1 BLUE`, `RESET`.

### 7) Tests & validation (make merging safe)
- [ ] Add store unit tests (Vitest):
  - [ ] `tests/frontend/unit/redvsblue/gameState.test.ts` covers `setSnapshot`, `clear`, and count selectors.
  - [ ] `tests/frontend/unit/redvsblue/uiStore.test.ts` covers defaults + setters.
- [ ] Add a minimal `useGame` smoke test **only if** it can be done without new dependencies:
  - [ ] Stub `requestAnimationFrame` and use `document.createElement("canvas")`.
  - [ ] Assert that starting the loop eventually updates `gameState.snapshot` from `null` to non-null.
- [ ] Decide whether to add component test dependencies:
  - [ ] If yes, add `@testing-library/react` + `@testing-library/user-event` and create `tests/frontend/component/redvsblue/RedVsBlue.test.tsx` for button clicks.
  - [ ] If no, rely on manual verification.
- [ ] Manual verification checklist:
  - [ ] Run `pnpm -F @copilot-playground/frontend dev` and open the Red vs Blue demo.
  - [ ] Visual parity: ships move, shoot, particles appear, stars render, world wrap works.
  - [ ] Counts update immediately on spawn/reset.
  - [ ] Confirm renderer isn’t forcing React to re-render every tick (use React DevTools Profiler).

Files to create/modify
---------------------
- [ ] Create: `src/frontend/src/redvsblue/stores/gameState.ts`
- [ ] Create: `src/frontend/src/redvsblue/stores/uiStore.ts`
- [ ] Create: `src/frontend/src/redvsblue/renderer/types.ts`
- [ ] Create: `src/frontend/src/redvsblue/renderer/CanvasRenderer.ts`
- [ ] Create: `src/frontend/src/redvsblue/renderer/index.ts`
- [ ] Create: `src/frontend/src/redvsblue/useGame.ts`
- [ ] Modify: `src/frontend/src/redvsblue/RedVsBlue.tsx`
- [ ] Tests: `tests/frontend/unit/redvsblue/gameState.test.ts`, `tests/frontend/unit/redvsblue/uiStore.test.ts` (optional: component test)

Tests & validation
------------------
- [ ] `pnpm -F @copilot-playground/frontend test`
- [ ] `pnpm -F @copilot-playground/frontend build`
- [ ] Confirm renderer draws from Zustand snapshots and not from React per-frame re-renders.

Acceptance criteria
-------------------
- Visual parity with baseline demo.
- Renderer pulls state from Zustand and not via React re-renders.
- UI controls operate through `useGame` and update `uiStore`.

Estimated effort
----------------
- Medium: 6–12 hours.

Rollback
--------
- Revert RedVsBlue changes and keep engine/store branches separate until stable.
