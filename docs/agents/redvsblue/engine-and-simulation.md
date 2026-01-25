# Engine and Simulation

The game simulation is defined in `src/frontend/src/redvsblue/engine/engine.ts`. It owns all entity state and publishes snapshots for rendering and telemetry for observability.

## Core responsibilities
- Maintain entities: ships, bullets, particles, stars.
- Advance simulation on each tick.
- Spawn and reset ships.
- Emit telemetry events for key actions.

## Key mechanics
- Ships use simple AI to seek targets within `visionDist`, turn, thrust, and fire.
- Bullets and ships wrap around world edges.
- Particles are short-lived visuals spawned from thrust and impacts.

## Configuration (EngineConfig)
Provided by `useGame` on init. Notable fields:
- `canvasWidth`, `canvasHeight`: derived from canvas/container size.
- `shipSpeed`, `bulletSpeed`, `bulletDamage`, `shipMaxHealth`.
- `enableTelemetry`: gates event emission at the engine level.
- `seed`: optional; when set, uses a deterministic RNG.

## Telemetry events emitted
The engine emits telemetry events on:
- `roundStart` (with config)
- `ship_spawned`
- `bullet_fired`
- `bullet_hit`
- `ship_destroyed`

These events are forwarded into the telemetry store by `useGame`.

## Snapshot generation
`getState()` returns a serialized snapshot of all entities for rendering and worker transfer. The snapshot is kept strictly serializable for worker messaging.
