# PR Summary — TASK031 / TASK029 / TASK030

**Title:** refactor(engine|telemetry): extract core helpers & telemetry modules + tests

**One-line goal:** Extract and test focused engine helpers (`collisions`, `particles`, `aiConfig`) and telemetry helpers (`Backoff`, `WSClient`, `TelemetryQueue`, `trySendBeacon`); refactor `TelemetryConnectorCore`, `useMatchSession`, and `engine/core` to compose these helpers.

**Key changes:**

- `src/frontend/src/redvsblue/engine/{collisions,particles,aiConfig}.ts`
- `src/frontend/src/redvsblue/telemetry/{backoff,wsClient,queue,sendBeacon}.ts`
- `src/frontend/src/redvsblue/TelemetryConnector.ts` (refactor to use helpers)
- `src/frontend/src/redvsblue/api/match.ts`, `src/frontend/src/redvsblue/snapshot/builder.ts`
- Tests added/updated under `tests/frontend/unit/redvsblue/*`

**Validation:**

- Run unit tests: `pnpm -F @copilot-playground/frontend test` (all frontend tests pass locally).
- Targeted tests: `pnpm -F @copilot-playground/frontend test tests/frontend/unit/redvsblue/{telemetry*,engine*}`

**Checklist before merge:**

- [x] Tests for helper modules exist and pass
- [x] Integration tests / engine tests pass
- [x] Docs added: `docs/redvsblue/engine-core-refactor.md`, `docs/redvsblue/telemetry-connector.md`
- [x] Memory bank updated (TASK files and `progress.md`)
- [x] Change log entry added

**Notes:** Consider a follow-up for particle pooling if profiling shows allocation pressure in high-particle scenarios.
