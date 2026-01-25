# TASK019 - Refactor: Monolithic files — Phase 2 (Break into modules & add tests)

**Status:** Pending  
**Added:** 2026-01-25  
**Updated:** 2026-01-25

## Original Request
Split high-impact monoliths into modules and add comprehensive unit and integration tests.

## Requirements (EARS)
- WHEN extracting backend services, THE SYSTEM SHALL keep `app.ts` as a thin router and move logic to `services/*` so logic is testable and composable. [Acceptance: unit tests for services and unchanged API behaviour]
- WHEN extracting frontend hooks and components, THE SYSTEM SHALL make UI presentational and side-effects contained in hooks. [Acceptance: Playwright tests and unit tests for hooks]
- WHEN refactoring engine, THE SYSTEM SHALL maintain determinism for tests (seed RNG) and verify snapshot outputs. [Acceptance: deterministic engine tests pass]

## Implementation Plan (Checklist)
- [ ] Backend module split
  - [ ] Create `backend/src/services/copilot.ts` and move Copilot client wiring (no behavior change).
  - [ ] Create `backend/src/services/match-store.ts` for match persistence/lookup logic.
  - [ ] Create `backend/src/services/decision-referee.ts` for decision validation/selection.
  - [ ] Update `backend/src/app.ts` to thin routing only (no heavy logic).
  - [ ] Add unit tests per service (happy path + 1–2 edge cases).
- [ ] Frontend module split
  - [ ] Extract `frontend/src/hooks/useApiProbe.ts` and `frontend/src/hooks/useStreamingChat.ts` (side effects only).
  - [ ] Create presentational components for chat list, input, and status badges.
  - [ ] Wire container component to hooks + presentational components.
  - [ ] Add unit tests for hooks and light component rendering tests.
- [ ] Engine module split
  - [ ] Move entity classes into `copilot/src/engine/entities/` and export from index.
  - [ ] Extract core update loop into `copilot/src/engine/core.ts`.
  - [ ] Ensure deterministic seed is applied in tests and snapshot outputs match.
- [ ] Integration/E2E coverage
  - [ ] Add integration test for snapshot loop (seeded) across new engine modules.
  - [ ] Add `/api/chat` streaming behavior E2E to confirm response parity.

## Acceptance Criteria
- Modules have unit tests and are well-documented in `memory/designs/`
- No behavioural changes; integration & E2E tests pass

## GitHub Issue
https://github.com/deadronos/copilot-chat-playground/issues/60

## Progress Log
### 2026-01-25
- Task created and linked to Issue #60.
