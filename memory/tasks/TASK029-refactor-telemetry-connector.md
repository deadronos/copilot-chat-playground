# TASK029 - Refactor TelemetryConnector into smaller helpers

**Status:** Completed  
**Added:** 2026-01-26  
**Updated:** 2026-01-26

## Original Request
Split `TelemetryConnector.ts` into smaller, testable modules (backoff, queue, ws client, sendBeacon) and preserve current behavior while improving test coverage and observability.

## Requirements (EARS)
- WHEN the TelemetryConnector starts, THE SYSTEM SHALL attempt to connect to the telemetry WebSocket and drain queued telemetry at `drainIntervalMs`.  
  Acceptance: Unit tests assert connect + drain behavior and that batches are sent when socket is open.

- WHEN a WebSocket error or close occurs, THE SYSTEM SHALL schedule reconnects with exponential backoff and jitter.  
  Acceptance: Unit tests validate backoff scheduling including jitter and upper bound capping.

- WHEN the page is unloaded, THE SYSTEM SHALL attempt to flush telemetry using `navigator.sendBeacon` if available and requeue on failure.  
  Acceptance: Unit tests verify sendBeacon success, failure, and requeue semantics.

- WHEN send fails while socket is open, THE SYSTEM SHALL requeue events at the head of the buffer and attempt a reconnect.  
  Acceptance: Tests confirm requeue-on-failure behavior and that buffer order is preserved.

## Thought Process
`TelemetryConnectorCore` currently mixes connection management, backoff logic, buffer drain semantics, and unload behavior in a single class. Extracting small, pure helpers makes behaviors easier to test and reason about, reduces side effects, and enables reusing backoff/queue logic elsewhere.

## Implementation Plan

1. Write tests to codify current behaviors for draining, backoff, reconnect, sendBeacon, and requeue semantics (red -> failing tests where needed).  
2. Implement `telemetry/backoff.ts` with Backoff helper and unit tests.  
3. Implement `telemetry/queue.ts` to manage buffer/peek/drain/requeue and unit tests.  
4. Implement `telemetry/wsClient.ts` that wraps WebSocket lifecycle (open/close/error/send) with tests using a mock WebSocket.  
5. Implement `telemetry/sendBeacon.ts` single-purpose helper to encapsulate navigator/sendBeacon handling and tests.  
6. Refactor `TelemetryConnectorCore` to compose these helpers while preserving public API and side-effects.  
7. Add integration tests to verify the composed behavior and update existing TelemetryConnector tests.  
8. Create small, focused commits per step and open a PR with test evidence and a short migration/compatibility note.

## Progress Log

### 2026-01-26

- Implemented test-first changes and helpers: `Backoff`, `TelemetryQueue`, `WSClient`, and `trySendBeacon` with unit tests.
- Refactored `TelemetryConnectorCore` to compose new helpers, replacing direct store manipulation with the `TelemetryQueue` abstraction and `trySendBeacon` for unload flush.
- Added/updated unit tests covering all extracted helpers and the `TelemetryConnectorCore` behaviors (send on open, requeue on failure, reconnect/backoff, sendBeacon semantics). All frontend tests pass locally.
- Small follow-ups: added `_lastSentWs` with a `ws` getter to preserve test introspection expectations, fixed a race when client was cleared during onopen callback, and removed transient debug logging.
- Next: propose a small PR with the extraction commits split by helper and a final PR that updates `TelemetryConnectorCore` and tests (ready).
- PR opened: [#88](https://github.com/deadronos/copilot-chat-playground/pull/88)
