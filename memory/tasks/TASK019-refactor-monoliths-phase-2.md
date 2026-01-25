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

## Implementation Plan
- Backend: Create `services/copilot.ts`, `services/match-store.ts`, `services/decision-referee.ts` and add unit tests
- Frontend: Extract `hooks/useApiProbe.ts`, `hooks/useStreamingChat.ts`, and presentational UI components
- Engine: Move entity classes to `engine/entities/` and `engine/core.ts`; add deterministic tests
- Add integration and E2E tests to validate snapshot loops and streaming behaviour

## Acceptance Criteria
- Modules have unit tests and are well-documented in `memory/designs/`
- No behavioural changes; integration & E2E tests pass

## GitHub Issue
https://github.com/deadronos/copilot-chat-playground/issues/60

## Progress Log
### 2026-01-25
- Task created and linked to Issue #60.
