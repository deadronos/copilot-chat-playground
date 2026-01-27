# Progress

**What works:**

- Frontend, backend, and copilot services run locally in development.
- Milestone A–D implemented; Milestone E (workspace mount + secrets) implemented on 2026-01-24.
- Copilot service exposes `GET /models` with cached Copilot CLI advertised models (TASK022, 2026-01-25).
- RedVsBlue match-store helpers are now split into focused modules with unit coverage (TASK024, 2026-01-26).
- `useGame` responsibilities extracted into engine/renderer/telemetry/fps managers with tests (TASK026, 2026-01-26).
- Telemetry connector refactor: extracted `Backoff`, `WSClient`, `TelemetryQueue`, and `trySendBeacon` helpers; refactored `TelemetryConnectorCore` to compose these helpers and added unit tests (TASK029, Completed 2026-01-26).
- Match session refactor: introduced `redvsblue/api/match` client and `redvsblue/snapshot/builder` pure builder; refactored `useMatchSession` and added tests (TASK030, Completed 2026-01-26).
- Engine core helpers: extracted `engine/collisions`, `engine/particles`, and `engine/aiConfig` with focused unit tests; updated `core.ts` to delegate to these helpers (TASK031, Completed 2026-01-27).
- RedVsBlue UI logic decomposed into match/session, AI director, and toast hooks with tests (TASK027, 2026-01-26).
- Full workspace test suite (`pnpm test`) passes after TASK024 updates (2026-01-26).

**What's left / Next:**

- Complete Milestone F: switch to Copilot SDK (`TASK004`) and validate with integration tests.
- Add automated tests for secrets handling and Compose startup (`TASK009`).
- Add CI validation steps for SDK and Compose integration.
- Execute monolith refactor Phase 1 (`TASK018`) and verify test coverage.
- Monolith refactor Phase 3 (`TASK020`) completed with docs, CI guardrails, and validation runs.
- Plan Playwright E2E implementation (`TASK021`) when ready.

**Known issues:**

- Read/write workspace mounts are deferred and require explicit opt-in.
- CI coverage for Compose startup and secret handling is not yet implemented.

**Notes:** Update progress as tasks move between In Progress and Completed states in `/memory/tasks/_index.md`.
