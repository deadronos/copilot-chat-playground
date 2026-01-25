# Rendering and Workers

Rendering is handled by a canvas renderer on the main thread or by an OffscreenCanvas in a worker.

## Renderer modes
- `canvas`: main-thread rendering via `CanvasRenderer`.
- `offscreen`: worker rendering using `OffscreenCanvas` (only when worker mode is enabled).

The active renderer is stored in `useUIStore().selectedRenderer`. The default is `canvas`.

## Worker mode
Worker mode is controlled by the `rvbWorker=1` query param in `RedVsBlue.tsx`. When enabled:
- The engine runs in a worker via `EngineWorkerWrapper`.
- Snapshots are posted back to the main thread.

## OffscreenCanvas constraints
OffscreenCanvas can be transferred only once per canvas element. Because React StrictMode can re-run effects in development, `useGame` preserves the offscreen canvas across dev effect re-mounts as long as the setup has not changed.

Important rules:
- Switching to offscreen requires a fresh `<canvas>` element.
- The canvas is remounted when `selectedRenderer` changes (see `RedVsBlueCanvas` keying).

## Resize behavior
`useGame` observes the container element with `ResizeObserver` and re-initializes the engine on size changes, which resets the simulation.

## Debug helpers
In dev, `RedVsBlue` exposes `__rvbBench.runPerfBench` on `globalThis`.
