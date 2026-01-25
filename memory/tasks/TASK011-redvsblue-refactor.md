# TASK011 - RedVsBlue Component Refactor

**Status:** Completed  
**Added:** 2026-01-24  
**Updated:** 2026-01-24

## Original Request
Refactor `RedVsBlue.tsx` into smaller components and containerize the `<canvas>` element as a subcomponent so offscreen toggling can remount a fresh canvas without reusing a transferred element.

## Thought Process
- Keep `useGame` wiring intact while extracting presentational UI and styles.
- Isolate the canvas element in its own component and key it by renderer mode to avoid OffscreenCanvas transfer reuse.
- Preserve existing query parameter behavior.

## Implementation Plan
- Extract styles, HUD, controls, and canvas into dedicated components.
- Update `RedVsBlue.tsx` to assemble the layout from the new components.
- Validate that `useGame` still receives stable refs and that telemetry continues to mount.
- Manually smoke-test renderer toggling and basic controls.

## Progress Tracking

**Overall Status:** Completed - 100%

### Subtasks

| ID  | Description                                                             | Status       | Updated    | Notes                                           |
| --- | ----------------------------------------------------------------------- | ------------ | ---------- | ----------------------------------------------- |
| 1.1 | Extract styles/HUD/controls into presentational components              | Complete     | 2026-01-24 | `RedVsBlueStyles/Hud/Controls`                  |
| 1.2 | Create canvas component with renderer-keyed remount strategy            | Complete     | 2026-01-24 | `RedVsBlueCanvas`                               |
| 1.3 | Update `RedVsBlue.tsx` to use new components and keep refs intact        | Complete     | 2026-01-24 | Layout preserved                                |
| 1.4 | Manual smoke-test renderer toggle, spawn/reset, UI overlay positioning   | Complete     | 2026-01-24 | Verified after offscreen fixes                  |
| 1.5 | Avoid OffscreenCanvas double-transfer in StrictMode re-mounts            | Complete     | 2026-01-24 | Preserve engine/offscreen across dev re-mounts  |

## Progress Log

### 2026-01-24
- Extracted `RedVsBlueCanvas`, `RedVsBlueHud`, `RedVsBlueControls`, and `RedVsBlueStyles`.
- Updated `RedVsBlue.tsx` to assemble layout with new components while keeping refs stable.
- Deferred manual smoke testing.

### 2026-01-24
- Manual testing surfaced OffscreenCanvas transfer errors in dev StrictMode.
- Adjusted useGame cleanup/setup to preserve OffscreenCanvas across dev effect re-mounts while still hard-resetting on setup changes.

### 2026-01-24
- Confirmed offscreen renderer works after fixes; completed manual smoke test.
