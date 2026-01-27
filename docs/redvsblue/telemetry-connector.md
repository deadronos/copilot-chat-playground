# Telemetry Connector — Design & Usage 📡

This document explains the architecture introduced during the telemetry refactor (TASK029).

## Components
- `TelemetryConnectorCore` — orchestrator that manages connection, drain loop, and unload flush.
- `Backoff` — exponential backoff with jitter used for reconnection scheduling.
- `WSClient` — small wrapper around a `WebSocket` to centralize lifecycle handling.
- `TelemetryQueue` — abstraction over the telemetry store for draining/peeking/requeuing.
- `trySendBeacon` — helper to perform best-effort synchronous flush on `beforeunload`.

## Config options (defaults)
- `url` (env: `VITE_TELEMETRY_WS_URL`, default `ws://localhost:3000/telemetry`)
- `batchSize` (default `50`)
- `drainIntervalMs` (default `1000`)
- `backoffBaseMs` (default `1000`)
- `backoffMaxMs` (default `30000`)

## Usage
- The React entrypoint `TelemetryConnectorReact` wires the connector to the UI store and starts/stops it automatically.
- For advanced usage, instantiate `TelemetryConnectorCore` and call `.start()` and `.stop()`.

## Testing
- Unit tests: `tests/frontend/unit/redvsblue/telemetryConnector.test.ts` and helpers tests for `backoff`, `wsClient`, `queue`, `sendBeacon`.
- Run: `pnpm -F @copilot-playground/frontend test tests/frontend/unit/redvsblue/telemetry*`.

## Notes

- `trySendBeacon` falls back to re-queuing if `sendBeacon` is absent or returns `false`.
- The `Backoff` implementation uses a jitter formula `0.75 + rng()*0.5` and caps at `backoffMaxMs`.
