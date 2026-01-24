## Phase 4 Complete: TelemetryConnector (WebSocket)

TL;DR: Implemented a reconnecting `TelemetryConnectorCore` with batching, drain loop, exponential backoff + jitter, requeue on send failure, and unit tests that mock `WebSocket` behavior.

**Files created/changed:**

- `src/frontend/src/redvsblue/TelemetryConnector.ts` (new core + React mount component)
- `tests/frontend/unit/redvsblue/telemetryConnector.test.ts` (new tests)
- `src/frontend/src/redvsblue/RedVsBlue.tsx` (mount connector)

**Behavior implemented:**

- Connects to `VITE_TELEMETRY_WS_URL` (fallback to `ws://localhost:3000/telemetry`).
- Periodically drains telemetry buffer and sends batched events (default batch=50, interval=1000ms).
- On send failure, requeues events at head and triggers reconnect.
- Exponential backoff with jitter and configurable caps.
- Respects `useUIStore.telemetryEnabled` and `VITE_ENABLE_TELEMETRY` env flag.

**Tests added:**

- `sends batched events on open and clears buffer`
- `requeues events on send failure`
- `reconnects on failure and drains after reconnect`

**Review Status:** APPROVED (tests pass locally).

**Git Commit Message:**
```
feat: add TelemetryConnector core + tests

- Add core connector with WS lifecycle, batching & backoff
- Add unit tests mocking WebSocket open/close/send failure
- Mount connector in `RedVsBlue` UI
```

All tests pass locally (frontend suite: 82 tests passing). No blockers remain for Phase 4.
