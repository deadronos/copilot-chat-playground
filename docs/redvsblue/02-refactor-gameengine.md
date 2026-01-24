# Refactor Plan: Extract Game Engine, Add Types, Decouple Rendering

Date: 2026-01-24T13:06:52.873Z

Goal
----
Extract the redvsblue game engine into a reusable TypeScript hook, add explicit TypeScript interfaces for game entities and telemetry, and decouple rendering from simulation/game logic (with an option to move the engine into a Web Worker later).

EARS-style Requirements
-----------------------
- WHEN the game runs, THEN rendering and simulation are decoupled so rendering can be swapped or moved to a worker without changing engine logic.
- WHEN a developer imports useGame, THEN they get a stable, well-documented API that exposes engine control (start/stop/spawn/reset), state snapshots, and telemetry hooks.
- WHEN telemetry events occur (spawn/shoot/hit/death/roundStart/roundEnd), THEN structured events are emitted to an EventEmitter for downstream consumers.
- WHEN refactor is complete, THEN behavior is functionally equivalent to current RedVsBlue demo and existing UI controls still work.

Design
------
Architecture Overview
- Engine (core simulation): pure TypeScript module responsible for state, AI, physics, and deterministic update ticks.
- Renderer: pluggable module with a Renderer interface that receives state snapshots and draws to a CanvasRenderingContext2D (main-thread renderer) or forwards to a worker-managed render pipeline.
- useGame hook: public React hook that creates/tears down engine and renderer, exposes control methods, and provides small reactive state (counts, engineRunning). Game state will instead live in a Zustand `GameState` store and UI state (running/resume/selectedRenderer/etc.) will live in a separate `UIStore` Zustand store.
- Telemetry: EventEmitter that emits structured TelemetryEvent objects; useGame wires engine events to emitter.

File Layout (new/modified)
- src/frontend/src/redvsblue/engine/
  - index.ts (engine factory and public API)
  - types.ts (Ship, Bullet, Particle, GameState, EngineConfig, TelemetryEvent)
  - engine.ts (Engine class: update loop, spawn/reset, collision handling)
- src/frontend/src/redvsblue/renderer/
  - index.ts (Renderer interface and factory)
  - CanvasRenderer.ts (main-thread canvas drawing implementation)
- src/frontend/src/redvsblue/useGame.ts (hook wrapping engine + renderer)
- src/frontend/src/redvsblue/RedVsBlue.tsx (update to use useGame)
- src/frontend/src/redvsblue/stores/
  - gameState.ts (Zustand store for GameState - ships, bullets, particles, tick)
  - uiStore.ts (Zustand store for UI state - running, selectedRenderer, fps, controls)


- src/frontend/src/redvsblue/engine/
  - index.ts (engine factory and public API)
  - types.ts (Ship, Bullet, Particle, GameState, EngineConfig, TelemetryEvent)
  - engine.ts (Engine class: update loop, spawn/reset, collision handling)
- src/frontend/src/redvsblue/renderer/
  - index.ts (Renderer interface and factory)
  - CanvasRenderer.ts (main-thread canvas drawing implementation)
- src/frontend/src/redvsblue/useGame.ts (hook wrapping engine + renderer)
- src/frontend/src/redvsblue/RedVsBlue.tsx (update to use useGame)

Interfaces / Type Snippets
- Ship
  - id: string
  - team: 'red' | 'blue'
  - x,y,vx,vy,angle,health,cooldown,radius
  - color: string
- Bullet
  - id: string
  - x,y,vx,vy,life,team,color,radius
- Particle
  - x,y,vx,vy,life,color
- GameState
  - ships: Ship[]; bullets: Bullet[]; particles: Particle[]; stars: Star[]; tick: number
- TelemetryEvent
  - type: 'spawn'|'shoot'|'hit'|'death'|'roundStart'|'roundEnd'
  - payload: any
  - ts: number
- Engine API (partial)
  - createEngine(config): Engine
  - Engine.start(), stop(), reset(), spawnShip(team), step(dt), on(event, cb)
- useGame signature
  - useGame(config?): { start, stop, spawnShip, reset, redCount, blueCount, running }

State management (Zustand stores)
- GameState store (`gameState.ts`): holds the authoritative mutable game state (ships, bullets, particles, stars, tick). Engine mutates or replaces snapshots into this store. Provides selectors for counts and snapshots for Renderer consumption. Example store API:

  ```ts
  type GameStateSlice = {
    ships: Ship[];
    bullets: Bullet[];
    particles: Particle[];
    stars: Star[];
    tick: number;
    setSnapshot: (s: GameState) => void;
    clear: () => void;
  }
  export const useGameState = create<GameStateSlice>((set) => ({ ships: [], bullets: [], particles: [], stars: [], tick: 0, setSnapshot: (s) => set(() => s), clear: () => set({ ships: [], bullets: [], particles: [], stars: [], tick: 0 }) }));
  ```

- UIStore (`uiStore.ts`): holds UI-level state like `running: boolean`, `selectedRenderer: 'canvas'|'webgl'`, `showTelemetry: boolean`, `fps`, and control flags (e.g., slowMo). `useGame` updates UIStore when starting/stopping and reads UI preferences for renderer selection. Example store API:

  ```ts
  type UIStateSlice = {
    running: boolean;
    selectedRenderer: 'canvas'|'webgl';
    showTelemetry: boolean;
    fps: number;
    setRunning: (v:boolean) => void;
    setRenderer: (r:'canvas'|'webgl') => void;
  }
  export const useUIStore = create<UIStateSlice>((set) => ({ running: false, selectedRenderer: 'canvas', showTelemetry: true, fps: 60, setRunning: (v) => set({ running: v }), setRenderer: (r) => set({ selectedRenderer: r }) }));
  ```

Guidance:
- Keep the Engine itself pure (no DOM access). At each tick the Engine should compute a new GameState snapshot and call `gameState.setSnapshot(snapshot)` so the Renderer and any telemetry listeners can read from the store.
- To avoid frequent re-renders in React, Renderer should subscribe directly to the Zustand store using `useGameState.subscribe` or the Renderer pulls snapshots from `useGameState.getState()` in its own RAF loop.
- UI components should use `useUIStore` hooks to read `running` and dispatch start/stop. `useGame` orchestrates engine lifecycle and wires engine output to `gameState` store and telemetry emitter.


- Renderer
  - interface Renderer { init(canvas: HTMLCanvasElement): void; render(state: GameState): void; destroy(): void }

Decoupling Rendering — Options & Recommendation
-----------------------------------------------
- Option A: Renderer on main thread (CanvasRenderer)
  - Pros: simplest, no message-passing overhead, immediate low friction.
  - Cons: potential frame drops if engine is heavy.
- Option B: Engine in Web Worker, main thread Renderer (recommended for later)
  - Pros: isolates CPU work; smoother rendering.
  - Cons: requires message-passing and state serialization.
- Option C: Renderer in Worker (OffscreenCanvas)
  - Pros: fully off-main rendering possible if OffscreenCanvas supported.
  - Cons: browser compatibility and added complexity.

Recommendation: Implement Renderer interface and CanvasRenderer first (Option A). Make Engine produce immutable state snapshots suitable for later worker transfer; add Worker integration as a follow-up PR.

Implementation Plan (Checklist)
-----------------------------
PR 1 — Types & Engine scaffold (Small)
- Create: `src/frontend/src/redvsblue/engine/types.ts` (define interfaces and constants)
- Create: `src/frontend/src/redvsblue/engine/index.ts` (export stubs)
- Modify: none
- Acceptance: Types compile; no behavior change; RedVsBlue.tsx still builds.

PR 2 — Extract Engine core (Medium)
- Create: `src/frontend/src/redvsblue/engine/engine.ts` (Engine class with update loop, spawn/reset, collision — ported logic but without render calls)
- Modify: `src/frontend/src/redvsblue/engine/index.ts` to export createEngine
- Modify: RedVsBlue.tsx minimal wiring to call engine.reset/spawn via new API (keep existing embedding until useGame is ready)
- Acceptance: Game behavior identical when running; engine exposes on('telemetry', cb)
- Tests: Unit test for collision and step determinism

PR 3 — Renderer & useGame hook (Medium)
- Create: `src/frontend/src/redvsblue/renderer/CanvasRenderer.ts`
- Create: `src/frontend/src/redvsblue/useGame.ts` (wrap engine + renderer, orchestrate Zustand stores, expose React-friendly controls/selectors)
- Create: `src/frontend/src/redvsblue/stores/gameState.ts` (Zustand GameState store)
- Create: `src/frontend/src/redvsblue/stores/uiStore.ts` (Zustand UI store)
- Modify: `src/frontend/src/redvsblue/RedVsBlue.tsx` to use `useGame` instead of inline logic
- Acceptance: Visual behavior unchanged; counts update via Zustand selectors; UI buttons call hook methods updating UIStore; Renderer reads snapshots from GameState store
- Tests: Integration test mounting RedVsBlue and asserting counts after spawn/reset via mocking requestAnimationFrame and mocking Zustand stores if needed

PR 4 — Telemetry & Event Emitter (Small)
- Create: wire engine.on('telemetry') to emit standardized TelemetryEvent objects and push them into a `telemetry` channel in the UIStore or a small separate Telemetry store if preferred
- Modify: useGame to accept telemetry callback prop or expose a telemetry emitter; backend/websocket connector can subscribe to the Telemetry store
- Acceptance: Events emit on spawn/shoot/hit/death and are available via a store selector; unit tests validate emitted events

Telemetry transport note:
- Since GameState and UIStore are central, a small Telemetry store (or a UIStore channel) can buffer events. A WebSocket connector component reads and drains the buffer to the server to avoid coupling engine lifecycle to network latency.

PR 5 — Worker proofing / snapshot immutability (Small)
- Modify: ensure GameState snapshots are plain serializable objects (no functions)
- Add: serialization test to confirm state can be cloned via structuredClone
- Acceptance: structuredClone(state) succeeds; no circular refs

PR 6 — Optional: Engine in Web Worker (Large)
- Create worker wrapper to host Engine and postMessage state snapshots at configurable tick rate
- Modify: useGame to initialize worker and listen to messages; Renderer renders received snapshots
- Acceptance: Behavior parity with non-worker mode; measured CPU offload on heavy ship counts

Testing Strategy
----------------
- Unit tests (Vitest)
  - engine/engine.spec.ts: step(), collision detection, spawn/reset deterministic
  - engine/types.spec.ts: validation of helper functions
- Integration tests
  - RedVsBlue.integration.tsx: mount component, simulate button clicks, assert DOM updates (counts)
- Mocking canvas
  - Use jsdom-canvas-mock or mock CanvasRenderingContext2D methods (fillRect, arc, beginPath) to avoid errors
  - For renderer tests, inject a fake canvas element with getContext returning mocked ctx

Telemetry Hooks
---------------
- Emit events at:
  - spawnShip(team): { type: 'spawn', payload: { team, id }, ts }
  - when Bullet created/shoot: { type: 'shoot', payload: { shooterId, bulletId, x,y, angle }, ts }
  - on hit: { type: 'hit', payload: { bulletId, targetId, damage, x,y }, ts }
  - on death: { type: 'death', payload: { shipId, team, killerId, ts }, ts }
  - round start/end: { type: 'roundStart'|'roundEnd', payload: { tick, shipCounts }, ts }
- Transport: WebSocket recommended for bidirectional low-latency (server can inject announcements). SSE is acceptable for unidirectional streaming.
- Backend hint: backend accepts WebSocket connections and forwards payloads to Copilot agent which maintains state per match and can return summarizations or TTS payloads.

Code Snippets
-------------
Types (example)

```ts
export type Team = 'red' | 'blue';
export interface Ship { id: string; team: Team; x:number; y:number; vx:number; vy:number; angle:number; health:number; cooldown:number; radius:number; color:string }
export interface Bullet { id:string; x:number; y:number; vx:number; vy:number; life:number; team:Team; color:string; radius:number }
export interface GameState { ships: Ship[]; bullets: Bullet[]; particles: Particle[]; tick: number }
export interface Engine {
  start(): void; stop(): void; reset(): void; spawnShip(team:Team): string; step(dt:number): GameState; on(event:string, cb:(e:any)=>void): void; }
```

useGame signature example

```ts
export function useGame(config?: EngineConfig) {
  return { start: () => void, stop: () => void, spawnShip: (team:Team)=>void, reset: ()=>void, redCount:number, blueCount:number, running:boolean };
}
```

Migration Plan / Rollout
------------------------
- Keep RedVsBlue.tsx working by progressively importing the new engine pieces. Use feature flags if necessary.
- Merge PRs in order (1 → 2 → 3 → 4 → 5 → 6). Each PR must include tests and a short demo script in README demonstrating that the UI still works.

First three recommended PRs (small, focused)
--------------------------------------------
1. PR #1 - Add types.ts and engine/index.ts stubs. (Small) Validate compilation.
2. PR #2 - Port engine core to engine/engine.ts and wire minimal exports; keep RedVsBlue using old code but call exported engine.reset() in parallel (Medium). Add unit tests for collisions.
3. PR #3 - Implement CanvasRenderer and useGame hook; update RedVsBlue to use hook (Medium). Add integration test.

Acceptance Criteria (Overall)
-----------------------------
- The refactored app runs with identical observable behavior (ship counts, movement, collisions) to original demo.
- Engine unit tests cover collision and step determinism.
- Telemetry events are emitted for spawn, shoot, hit, death, roundStart, roundEnd and are available through the Telemetry buffer in UIStore.
- Rendering is pluggable via the Renderer interface and consumes snapshots from the GameState store.

Risks & Mitigations
-------------------
- Risk: Behavioral divergence — Mitigate by running side-by-side comparisons and unit tests. Use the GameState snapshots to compare state progression before/after refactor.
- Risk: Worker race conditions — Defer worker until after engine deterministic tests pass and ensure state snapshots are serializable.
- Risk: Excessive React re-renders — Mitigate by having Renderer subscribe directly to `useGameState` and by keeping engine updates out of React render path.

Estimated Effort
----------------
- Total: 2–4 days for a single developer to implement PRs 1–3 and add tests, slightly more if Worker migration is added.

Checklist
---------
- [ ] PR 1: types.ts + index stubs
- [ ] PR 2: engine core extracted + unit tests
- [ ] PR 3: CanvasRenderer + useGame + GameState + UIStore + integration test
- [ ] PR 4: Telemetry emitter + tests
- [ ] PR 5: Snapshot immutability tests
- [ ] PR 6: Optional worker implementation

