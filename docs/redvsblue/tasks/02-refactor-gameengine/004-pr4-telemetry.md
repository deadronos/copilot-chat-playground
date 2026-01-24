# PR 004 — Telemetry & Event Emitter

Date: 2026-01-24T13:14:01.578Z

Summary
-------
Add the telemetry pipeline: engine emits structured TelemetryEvent objects which are buffered in the UI/Telemetry store and forwarded to a backend connector (WebSocket) for Copilot SDK consumption.

Objectives
----------
- Buffer telemetry in a store to decouple engine from network latency.
- Provide a reconnecting WebSocket connector that drains the buffer to the backend.

Detailed tasks
--------------
1. Implement telemetry storage:
   - Extend `uiStore.ts` with a `telemetryBuffer: TelemetryEvent[]`, and methods `pushTelemetry(event)` and `drainTelemetry(n?)`.
   - Optionally create `src/frontend/src/redvsblue/stores/telemetry.ts` with the same API.
2. Wire engine emissions to telemetry: in the Engine class, on each spawn/shoot/hit/death/roundStart/roundEnd emit a `TelemetryEvent` and call `telemetryStore.pushTelemetry(event)` via a safe callback provided by `useGame`.
3. Create connector component:
   - `src/frontend/src/redvsblue/TelemetryConnector.tsx` opens a WebSocket, authenticates (if needed), and periodically drains the buffer sending batched events.
   - Handle offline: keep buffering, exponential backoff reconnect.
4. Tests:
   - Unit tests for buffer push/drain semantics.
   - Integration test mocking WebSocket to ensure events are sent and cleared.

Files to create/modify
---------------------
- Modify: `stores/uiStore.ts` or create `stores/telemetry.ts`
- Create: `TelemetryConnector.tsx`
- Engine: ensure `engine.on('telemetry', cb)` wiring exists

Transport recommendation
------------------------
- WebSocket (bidirectional) is preferred for low-latency control and server-driven announcements; SSE is acceptable for server->client only flows.

Acceptance criteria
-------------------
- Telemetry events are buffered and forwardable; connector drains buffer reliably and reconnects on failure.

Estimated effort
----------------
- Small to Medium: 4–6 hours.

Rollback
--------
- Disable TelemetryConnector in UI and revert store changes if issues arise.
