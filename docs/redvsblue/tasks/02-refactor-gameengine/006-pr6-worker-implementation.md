# PR 006 — Engine in Web Worker (optional)

Date: 2026-01-24T13:14:01.578Z

Summary
-------
Move the Engine into a Web Worker to offload CPU-bound simulation from the main thread and improve render smoothness on heavier simulations.

Objectives
----------
- Implement a Worker-based Engine host and a main-thread wrapper that forwards control messages and receives state snapshots.
- Keep the Renderer on the main thread (CanvasRenderer) or use OffscreenCanvas if available.

Detailed tasks
--------------
1. Implement worker script:
   - `src/frontend/src/redvsblue/worker/engine.worker.ts` (or `.ts`) that imports the Engine implementation and listens for control messages (`start`, `stop`, `step`, `spawn`, `reset`).
   - Worker posts serialized snapshots back to main thread at a configurable tick/broadcast rate.
2. Implement main-thread wrapper:
   - Add `src/frontend/src/redvsblue/worker/engineWorkerWrapper.ts` which exposes the same Engine-like API but uses `postMessage`/`onmessage` to communicate with the worker.
3. Modify `useGame` to accept a `worker: boolean` config; when true instantiate the wrapper instead of the in-process Engine.
4. OffscreenCanvas (optional): if `selectedRenderer === 'offscreen'` and browser supports OffscreenCanvas transfer it to the worker for rendering; otherwise keep CanvasRenderer on main thread.
5. Tests:
   - Integration tests running worker mode in CI (requires Vite worker bundling support); verify parity between worker vs in-process engine by comparing snapshots for N ticks.
6. Performance validation:
   - Benchmark CPU usage and FPS for heavy ship counts and ensure reduced main-thread load.

Files to create/modify
---------------------
- Create: `worker/engine.worker.ts`, `worker/engineWorkerWrapper.ts`
- Modify: `useGame.ts` to support `worker` config
- Tests & bench scripts

Acceptance criteria
-------------------
- Behavior parity with non-worker mode.
- Worker mode reduces main-thread CPU usage during heavy simulations.

Risks & mitigations
-------------------
- Bundler / Worker compatibility: use Vite worker patterns (`new Worker(new URL(...), { type: 'module' })`).
- Complexity: keep worker mode behind a feature flag and test extensively before enabling by default.

Estimated effort
----------------
- Large: 1–2 days (implementation + testing + bundler adjustments).

Rollback
--------
- Add a runtime toggle to disable worker mode and quickly revert to in-process Engine.
