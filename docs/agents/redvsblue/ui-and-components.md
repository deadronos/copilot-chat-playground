# UI and Components

`RedVsBlue.tsx` composes the Red vs Blue UI and game wiring. Presentational pieces are split into small components for clarity.

## Component layout
- `RedVsBlue` (container)
  - `RedVsBlueStyles` (global styles for canvas + UI)
  - `RedVsBlueCanvas` (owns `<canvas>` element)
  - `TelemetryConnectorReact` (side-effect connector)
  - UI layer
    - `RedVsBlueHud` (ship counts)
    - `RedVsBlueControls` (spawn/reset buttons)

## Canvas ownership
`RedVsBlueCanvas` is the only place that renders the `<canvas>` element. Its key includes the selected renderer so switching renderer remounts a fresh canvas.

## UI store usage
`useUIStore` controls:
- `selectedRenderer` (canvas vs offscreen)
- `telemetryEnabled`
- `running` and `fps` (set by `useGame`)

## Styling
Styles are currently injected via `RedVsBlueStyles` using a `<style>` tag. The UI layer sits above the canvas using absolute positioning and pointer-events control.
