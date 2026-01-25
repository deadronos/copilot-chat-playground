# TASK018 - Refactor: Monolithic files — Phase 1 (Discovery & safe splits)

**Status:** In Progress  
**Added:** 2026-01-25  
**Updated:** 2026-01-25

## Original Request
Create a low-risk first phase for refactoring monolithic files in `frontend/`, `backend/`, and `copilot/` into smaller modules: add tests for risky flows and extract small helpers.

## Design Link
- `memory/designs/DES017-refactor-monoliths-phase-1.md`

## Requirements (EARS)
- WHEN engineers start the refactor, THE SYSTEM SHALL have unit tests for high-risk flows (backend decision validation, streaming fallback, engine deterministic updates) so regressions are caught. [Acceptance: CI passes all new tests]
- WHEN extracting helpers, THE SYSTEM SHALL not change behavior (no logic changes) and each helper shall have unit tests. [Acceptance: existing tests remain green; new helper tests pass]
- WHEN adding integration tests, THE SYSTEM SHALL cover critical flows (snapshot matching, /api/chat streaming fallback). [Acceptance: integration tests pass in CI]

## Implementation Plan (Checklist)
- [ ] Inventory monolith candidates in `frontend/`, `backend/`, and `copilot/` and capture file sizes + responsibilities in `memory/activeContext.md`.
- [ ] Identify 2–3 highest-risk flows to protect first (backend decision validation, streaming fallback, deterministic engine update) and note test entry points.
- [ ] Add backend unit tests
  - [ ] Decision validation happy path + 1–2 error paths (invalid decision, missing fields).
  - [ ] Streaming fallback: simulate upstream stream failure and verify fallback response structure.
- [ ] Add frontend unit tests
  - [ ] `useStreamingChat`: mock stream reader, verify state transitions and error handling.
  - [ ] `useApiProbe`: mock fetch + timeouts, verify retry/health status logic.
- [ ] Extract 1–2 minimal, well-scoped helpers (no behavior changes) into `src/shared/lib/`
  - [ ] `clampNumber` + tests
  - [ ] `estimateTokenCount` + tests
- [ ] Add integration tests
  - [ ] Snapshot match flow (deterministic seed; stable outputs).
  - [ ] `/api/chat` streaming fallback path.
- [ ] Keep PRs small and test-first (split by area: backend tests, frontend tests, helpers, integration).

## Acceptance Criteria
- All new tests pass locally and in CI without modifying existing behavior.
- Tests are non-flaky and deterministic (seed RNG where appropriate).
- Changes are documented in the task file and referenced by PR(s).

## GitHub Issue
https://github.com/deadronos/copilot-chat-playground/issues/59

## Progress Tracking

**Overall Status:** In Progress - 80%

| ID  | Description | Status | Updated | Notes |
| --- | ----------- | ------ | ------- | ----- |
| 1.1 | Inventory monolith candidates in Memory Bank | Complete | 2026-01-25 | Added to `memory/activeContext.md`. |
| 1.2 | Backend unit tests: decision validation + streaming fallback | Complete | 2026-01-25 | Added decision validation + existing fallback coverage; added integration fallback. |
| 1.3 | Frontend unit tests: useStreamingChat + useApiProbe | Complete | 2026-01-25 | Added hook tests. |
| 1.4 | Extract helpers into `@copilot-playground/shared` | Complete | 2026-01-25 | clamp/estimate/prompt/canvas extracted. |
| 1.5 | Integration tests: snapshot flow + /api/chat fallback | Complete | 2026-01-25 | Added backend integration tests. |
| 1.6 | PR-ready cleanup and verification | Not Started | 2026-01-25 | Pending test run + docs checks. |

## Progress Log
### 2026-01-25
- Task created and linked to Issue #59.

### 2026-01-25
- Started Phase 1 execution; created shared helper modules and refactored backend/frontend usage.
- Added backend unit tests for decision validation and shared helpers.
- Added frontend hook tests + canvas sizing helper test.
- Added backend integration tests for RedVsBlue snapshot flow and chat fallback.
- Tests not run yet (pnpm filters pending).

