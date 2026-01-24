## Plan: Telemetry & Event Emitter (PR 004)

TL;DR: Add a typed telemetry pipeline — a small in-memory FIFO buffer (new `telemetry` store), wire Engine emissions into it, and implement a reconnecting `TelemetryConnector` (WebSocket) that batches and sends events. Tests and a feature flag are included for safe rollout.

**Phases 6**

1. **Phase 1: Analyze & Types**
   - **Objective:** Define `TelemetryEvent` types and config variables; decide payload format and defaults.
   - **Files/Functions to Modify/Create:** `src/frontend/src/redvsblue/types.ts` (add/extend `TelemetryEvent`), `.env.example` (document `VITE_TELEMETRY_WS_URL`, `VITE_ENABLE_TELEMETRY`).
   - **Tests to Write:** Type validation tests and small utility tests where applicable.
   - **Steps:**
     1. Add `TelemetryEvent` shape and document env vars.
     2. Run types/tests to validate.

2. **Phase 2: Telemetry Store**
   - **Objective:** Implement a FIFO buffer store with push/drain semantics and a capacity policy.
   - **Files/Functions to Modify/Create:** `src/frontend/src/redvsblue/stores/telemetry.ts` (new store), optional shim in `uiStore.ts`.
   - **Tests to Write:** `telemetryStore.test.ts` (push, drain, overflow policy, id/timestamp assignment).
   - **Steps:**
     1. Write failing tests (TDD).
     2. Implement minimal code to pass tests.

3. **Phase 3: Engine Wiring & Hook**
   - **Objective:** Wire Engine `telemetry` emissions to the telemetry store via `useGame` safely.
   - **Files/Functions to Modify/Create:** `src/frontend/src/redvsblue/useGame.ts` (register/unregister handler), engine event emit checks.
   - **Tests to Write:** Engine->store wiring test asserting `pushTelemetry` is called on emits.
   - **Steps:**
     1. Add failing test, implement safe registration with feature flag gating.

4. **Phase 4: TelemetryConnector**
   - **Objective:** Implement a reconnecting WebSocket connector that drains buffer in batches, with exponential backoff + jitter.
   - **Files/Functions to Modify/Create:** `src/frontend/src/redvsblue/TelemetryConnector.tsx`, `src/frontend/src/utils/backoff.ts`.
   - **Tests to Write:** `telemetryConnector.test.ts` (mock `WebSocket`, fake timers, verify sends, reconnection backoff, requeue on failure).
   - **Steps:**
     1. Add failing integration tests.
     2. Implement connector to send JSON array batches, handle reconnect/backoff, and respect network offline state.

5. **Phase 5: Validate & Integration**
   - **Objective:** Add integration tests and run full test suite to verify behavior under flaps and capacity.
   - **Files/Functions to Modify/Create:** Integration test files under `tests/frontend/integration/redvsblue/`.
   - **Tests to Write:** End-to-end flow tests (engine emit -> buffer -> connector -> WebSocket receives payload).
   - **Steps:**
     1. Run tests, adjust as needed, and document behavior for staging.

6. **Phase 6: Rollout & Docs**
   - **Objective:** Add docs and rollout guidance; ensure safe defaults and a feature flag.
   - **Files/Functions to Modify/Create:** `docs/redvsblue/tasks/004-pr4-telemetry.md` (update), `.env.example`, optional UI toggle in `uiStore`.
   - **Steps:**
     1. Merge behind `VITE_ENABLE_TELEMETRY` and verify in staging.

**Open Questions**

1. What is the telemetry WS URL and auth method? (env var needed)
2. Does backend expect JSON array or NDJSON? (default to JSON array)
3. Should buffer be persisted to disk/localStorage? (default: memory only)
4. Batch size and drain interval preferences? (defaults: batch=50, interval=1000ms)

**Acceptance Criteria**

- Telemetry events are buffered (FIFO) and can be drained in batches.
- `TelemetryConnector` sends batches to backend and reconnects on failure with exponential backoff + jitter.
- Unit and integration tests cover buffer and connector behavior.

**Open for implementation:** proceed with Phase 1 when ready.