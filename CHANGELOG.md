# Changelog

## Unreleased

- Refactor: Telemetry connector extracted into helper modules (`Backoff`, `WSClient`, `TelemetryQueue`, `trySendBeacon`) and `TelemetryConnectorCore` refactored to compose them (TASK029). Tests added/updated. ✅
- Refactor: `useMatchSession` network logic extracted to `redvsblue/api/match` and `snapshot` builder introduced (`snapshot/builder`) (TASK030). Tests added/updated. ✅
- Refactor: Engine core helpers extracted — `collisions`, `particles`, `aiConfig` — with focused unit tests; `core.ts` delegates to these helpers (TASK031). Tests added/updated. ✅

All frontend unit tests pass locally (163 passed, 2 skipped).
