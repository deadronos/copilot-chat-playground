# Telemetry and Stores

Telemetry is collected from the engine and forwarded through a buffered store to a WebSocket connector.

## Telemetry flow
1) Engine emits telemetry events.
2) `useGame` listens to engine telemetry and pushes events into the telemetry store.
3) `TelemetryConnectorCore` drains telemetry in batches and sends them to the server.

## Telemetry store
`src/frontend/src/redvsblue/stores/telemetry.ts`:
- Buffers events (default max 5000).
- Ensures each event has `id` and `timestamp`.
- Supports `drainTelemetry`, `peek`, and `clearTelemetry`.

## Telemetry connector
`src/frontend/src/redvsblue/TelemetryConnector.ts`:
- Uses WebSocket to send batches.
- Applies exponential backoff on reconnect.
- Uses `sendBeacon` during page unload for best-effort flush.
- Obeys `useUIStore().telemetryEnabled`.
- Honours `VITE_ENABLE_TELEMETRY=false` (disables start).

## Env/config knobs
- `VITE_TELEMETRY_WS_URL`: WebSocket endpoint (defaults to `ws://localhost:3000/telemetry`).
- `VITE_ENABLE_TELEMETRY`: set to `false` to disable connector startup.

## Game state store
`src/frontend/src/redvsblue/stores/gameState.ts`:
- Stores the latest snapshot and derived `redCount`/`blueCount`.
- Snapshot updates are used for rendering and the HUD.
