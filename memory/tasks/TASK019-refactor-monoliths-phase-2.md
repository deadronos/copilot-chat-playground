# TASK019 - Refactor: Monolithic files — Phase 2 (Break into modules & add tests)

**Status:** In Progress  
**Added:** 2026-01-25  
**Updated:** 2026-01-25

## Original Request
Split high-impact monoliths into modules and add comprehensive unit and integration tests.

## Requirements (EARS)
- WHEN extracting backend services, THE SYSTEM SHALL keep `app.ts` as a thin router and move logic to `services/*` so logic is testable and composable. [Acceptance: unit tests for services and unchanged API behaviour]
- WHEN extracting frontend hooks and components, THE SYSTEM SHALL make UI presentational and side-effects contained in hooks. [Acceptance: Playwright tests and unit tests for hooks]
- WHEN refactoring engine, THE SYSTEM SHALL maintain determinism for tests (seed RNG) and verify snapshot outputs. [Acceptance: deterministic engine tests pass]

## Implementation Plan (Checklist)
- [x] Backend module split
  - [x] Create `backend/src/services/copilot.ts` and move Copilot client wiring (no behavior change).
  - [x] Create `backend/src/services/match-store.ts` for match persistence/lookup logic.
  - [x] Create `backend/src/services/decision-referee.ts` for decision validation/selection.
  - [x] Update `backend/src/app.ts` to thin routing only (no heavy logic).
  - [x] Add unit tests per service (happy path + 1–2 edge cases).
- [x] Frontend module split
  - [x] Extract `frontend/src/hooks/useApiProbe.ts` and `frontend/src/hooks/useStreamingChat.ts` (side effects only).
  - [x] Create presentational components for chat list, input, and status badges.
  - [x] Wire container component to hooks + presentational components.
  - [x] Add unit tests for hooks and light component rendering tests.
- [x] Engine module split
  - [x] Move entity classes into `copilot/src/engine/entities/` and export from index.
  - [x] Extract core update loop into `copilot/src/engine/core.ts`.
  - [x] Ensure deterministic seed is applied in tests and snapshot outputs match.
- [x] Integration/E2E coverage
  - [x] Add integration test for snapshot loop (seeded) across new engine modules.
  - [x] Add `/api/chat` streaming behavior E2E to confirm response parity.

## Acceptance Criteria
- Modules have unit tests and are well-documented in `memory/designs/`
- No behavioural changes; integration & E2E tests pass

## GitHub Issue
https://github.com/deadronos/copilot-chat-playground/issues/60

## Progress Log
### 2026-01-25
- Task created and linked to Issue #60.
### 2026-01-25
- Added DES018 design doc for Phase 2 module split.
- Split backend logic into services and updated backend tests to target services.
- Refactored ChatPlayground into presentational components + container; added output actions hook and component tests.
- Split RedVsBlue engine entities/core update loop and added deterministic snapshot parity test.
- Added /api/chat streaming parity integration test.
- Open question: whether to add Playwright E2E suite now (docs/agents/testing notes E2E deferred).
### 2026-01-25
- Added DES019 to defer Playwright E2E coverage to a future task.
- Ran backend tests: `pnpm -F @copilot-playground/backend test` (pass; 1 skipped).
- Ran frontend tests: `pnpm -F @copilot-playground/frontend test` (pass; 1 skipped).
