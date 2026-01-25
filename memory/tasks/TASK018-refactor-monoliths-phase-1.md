# TASK018 - Refactor: Monolithic files — Phase 1 (Discovery & safe splits)

**Status:** Pending  
**Added:** 2026-01-25  
**Updated:** 2026-01-25

## Original Request
Create a low-risk first phase for refactoring monolithic files in `frontend/`, `backend/`, and `copilot/` into smaller modules: add tests for risky flows and extract small helpers.

## Requirements (EARS)
- WHEN engineers start the refactor, THE SYSTEM SHALL have unit tests for high-risk flows (backend decision validation, streaming fallback, engine deterministic updates) so regressions are caught. [Acceptance: CI passes all new tests]
- WHEN extracting helpers, THE SYSTEM SHALL not change behavior (no logic changes) and each helper shall have unit tests. [Acceptance: existing tests remain green; new helper tests pass]
- WHEN adding integration tests, THE SYSTEM SHALL cover critical flows (snapshot matching, /api/chat streaming fallback). [Acceptance: integration tests pass in CI]

## Implementation Plan
- Add unit tests for backend decision validation and streaming fallback.
- Add unit tests for `useStreamingChat` and `useApiProbe` (mock network/stream objects).
- Extract small, well-contained helpers (`clampNumber`, `estimateTokenCount`, `buildDecisionPrompt`, `applyCanvasSize`) into `src/shared/lib/` and add tests.
- Add integration tests for snapshot match flow and `/api/chat` fallback to ensure end-to-end behavior.
- Keep PRs small and test-first.

## Acceptance Criteria
- All new tests pass locally and in CI without modifying existing behavior.
- Tests are non-flaky and deterministic (seed RNG where appropriate).
- Changes are documented in the task file and referenced by PR(s).

## GitHub Issue
https://github.com/deadronos/copilot-chat-playground/issues/59

## Progress Log
### 2026-01-25
- Task created and linked to Issue #59.

