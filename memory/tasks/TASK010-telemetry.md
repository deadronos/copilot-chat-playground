# [TASK010] - Telemetry & Event Emitter (PR 004)

**Status:** In Progress  
**Added:** 2026-01-24  
**Updated:** 2026-01-24

## Original Request
Add a telemetry pipeline so the engine emits structured TelemetryEvent objects which are buffered in the UI/Telemetry store and forwarded to a backend connector (WebSocket) for Copilot SDK consumption. See `docs/redvsblue/tasks/02-refactor-gameengine/004-pr4-telemetry.md` for details.

## Requirements (EARS-style)
- WHEN the engine emits a telemetry event (spawn/shoot/hit/death/roundStart/roundEnd), THE SYSTEM SHALL append a `TelemetryEvent` to an in-memory telemetry buffer [Acceptance: events appear in `telemetryStore` and `getBufferLength()` increments].
- WHEN the `TelemetryConnector` has an open WebSocket connection, THE SYSTEM SHALL drain the buffer in batches and send them to the backend [Acceptance: backend mock receives batched payloads, buffer shrinks].
- WHEN the WebSocket connection fails, THE SYSTEM SHALL retry with exponential backoff + jitter and continue buffering new events during downtime [Acceptance: connector reconnect attempts are observed and buffered events are preserved].

## Thought Process
- Keep telemetry store small and isolated (`telemetry.ts`) to avoid coupling to UI state.
- Use a feature flag/env var to control connector activation for safe rollout.
- Keep buffer in-memory only by default (no persistent disk) unless required.

## Implementation Plan (high-level)
- Phase 1: Types & env variables (add `TelemetryEvent` type, `.env.example` entries).
- Phase 2: Implement `telemetry` store (push, drain, peek, capacity policy).
- Phase 3: Wire engine emissions to store via `useGame` (safe registration/unregistration, feature flag gating).
- Phase 4: Implement `TelemetryConnector` with WebSocket, batching, backoff, and tests.
- Phase 5: Integration tests and validation.
- Phase 6: Docs, feature flag rollout, and handoff notes.

## Progress Log
### 2026-01-24
- Task created and plan written. Phase 1 (Analyze & Types) starting.

### 2026-01-24
- Phase 1 complete: added `TelemetryEvent` type and `ensureTelemetryEvent` helper, documented env vars. Tests added and passing. ✅

### 2026-01-24
- Phase 2: Implement telemetry store — added `src/frontend/src/redvsblue/stores/telemetry.ts` and `tests/frontend/unit/redvsblue/telemetryStore.test.ts`. Unit tests passed locally. ✅

### 2026-01-24
- Phase 3: Wire engine telemetry emits — added UI toggle (`uiStore.telemetryEnabled`) and wiring in `useGame` to forward engine `telemetry` events to the telemetry store. Added `engine-telemetry-wiring.test.ts`. ✅

### 2026-01-24
- Phase 4: Implement TelemetryConnector — added `TelemetryConnector` core, React mount, and tests (`telemetryConnector.test.ts`). Connector supports batching, reconnect with backoff, requeue on failure, and respects UI & env toggles. Unit tests pass locally. ✅

### 2026-01-24 (Implementation)
- Added `TelemetryEvent` type with optional `id`, `data`, `sessionId`, `seq`, and `version` fields.
- Implemented `ensureTelemetryEvent(partial)` helper in `src/frontend/src/redvsblue/telemetry.ts` which assigns `id` and `timestamp` when missing.
- Documented `VITE_TELEMETRY_WS_URL` and `VITE_ENABLE_TELEMETRY` in `.env.example`.
- Added unit test `tests/frontend/unit/redvsblue/telemetry.test.ts` and updated existing type tests; all tests pass locally.

---

