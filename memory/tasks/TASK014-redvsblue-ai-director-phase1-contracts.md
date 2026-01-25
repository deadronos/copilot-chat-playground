# TASK014 - RedVsBlue AI Director Phase 1 (Contracts + Commentary)

**Status:** Completed  
**Added:** 2026-01-25  
**Updated:** 2026-01-25

## Original Request

Write a detailed implementation plan for `memory/designs/DES012-redvsblue-ai-director-phase1-contracts-and-commentary.md` into the memory/tasks folder with actionable subtasks and checkboxes, then execute that task.

## Thought Process

Phase 1 requires server-side match lifecycle endpoints with rules normalization and snapshot buffering, plus a frontend hook to request commentary and show a toast. We should build a minimal in-memory backend store, validate requests with Zod, log correlation IDs, and add lightweight UI wiring to start/end sessions, post snapshots, and ask for commentary. Tests should cover the backend contract behaviors called out in the design acceptance criteria.

## Implementation Plan

- [x] **Task setup & documentation**
  - [x] Create `TASK014` file linked to DES012 with EARS requirements and acceptance references.
  - [x] Update `memory/tasks/_index.md` with the new task and status.

- [x] **Backend: Phase 1 API contracts**
  - [x] Add schemas for match start rules/config, snapshots, and ask payloads.
  - [x] Implement in-memory match store with session IDs and bounded snapshot buffer.
  - [x] Build rules/config normalization + warning generation logic.
  - [x] Add lifecycle endpoints (`/match/start`, `/match/:matchId/snapshot`, `/match/:matchId/ask`, `/match/:matchId/end`).
  - [x] Add structured validation errors and correlation ID logging.

- [x] **Frontend: commentary MVP + match lifecycle**
  - [x] Start a match on mount, store `sessionId`, and end on unmount.
  - [x] Post snapshots at the configured interval using the latest game state.
  - [x] Add an “Ask Copilot” control and display commentary as a toast notification.

- [x] **Tests & validation**
  - [x] Add backend unit tests covering clamping/warnings, snapshot validation, and ask commentary.
  - [x] Run targeted backend tests.

- [x] **Wrap-up**
  - [x] Update task progress, mark completed, and refresh `_index.md`.
  - [x] Capture a UI screenshot of the RedVsBlue toast interaction.

## Progress Tracking

**Overall Status:** Completed - 100%

### Subtasks

| ID  | Description                                       | Status       | Updated    | Notes |
| --- | ------------------------------------------------- | ------------ | ---------- | ----- |
| 1.1 | Add Phase 1 backend contracts + in-memory store   | Complete     | 2026-01-25 |       |
| 1.2 | Wire frontend lifecycle + Ask Copilot toast       | Complete     | 2026-01-25 |       |
| 1.3 | Add backend tests for Phase 1 endpoints           | Complete     | 2026-01-25 |       |
| 1.4 | Update docs, index, and capture screenshot        | Complete     | 2026-01-25 |       |

## Progress Log

### 2026-01-25

- Created TASK014 with detailed implementation plan for DES012 Phase 1.
- Implemented Phase 1 backend endpoints with validation, clamping, and snapshot buffering.
- Added RedVsBlue frontend lifecycle wiring, Ask Copilot toast, and snapshot posting.
- Added backend unit tests for Phase 1 API behaviors and ran targeted test suite.
- Updated task index and prepared UI screenshot.
