# DES010 - RedVsBlue Component Refactor

**Date:** 2026-01-24
**Status:** Draft

## Summary
Refactor `RedVsBlue.tsx` into smaller, focused components and isolate the `<canvas>` element into its own subcomponent so renderer/offscreen toggling can remount a fresh canvas without reusing an already-transferred element.

## Goals
- Split UI concerns (styles, HUD, controls) into presentational components.
- Isolate the canvas element in a dedicated component with a key that changes on renderer mode switches.
- Keep `useGame` wiring intact (stable `canvasRef`/`containerRef`).
- Preserve existing query param behavior (`rvbWorker`, `rvbRenderer`).

## Non-Goals
- Changing engine behavior, rendering logic, or telemetry semantics.
- Altering UI layout or visuals beyond component boundaries.

## Architecture
```
RedVsBlue (container)
├─ RedVsBlueStyles (global styles)
├─ RedVsBlueCanvas (owns <canvas> element + key)
├─ TelemetryConnectorReact
└─ UI Layer
   ├─ RedVsBlueHud (top bar counts)
   └─ RedVsBlueControls (spawn/reset buttons)
```

## Interfaces
- `RedVsBlueCanvas`
  - Props: `{ canvasRef: RefObject<HTMLCanvasElement | null>, rendererKey: string }`
- `RedVsBlueHud`
  - Props: `{ redCount: number, blueCount: number }`
- `RedVsBlueControls`
  - Props: `{ onSpawnRed: () => void, onSpawnBlue: () => void, onReset: () => void }`

## Data Flow
- `useGameState` selectors provide `redCount`/`blueCount` to `RedVsBlueHud`.
- `useGame` provides `spawnShip`/`reset` handlers to `RedVsBlueControls`.
- `selectedRenderer` from `useUIStore` is passed to `RedVsBlueCanvas` to change the `<canvas>` key on renderer switches.

## Risks & Mitigations
- OffscreenCanvas transfer can only occur once per canvas element.
  - Mitigation: remount the `<canvas>` when `rendererKey` changes.

## Validation
- Manual smoke test: toggle renderer, spawn/reset ships, verify UI overlay layout.
