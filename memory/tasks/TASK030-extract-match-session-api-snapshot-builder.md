# TASK030 - Extract match session API + snapshot builder

**Status:** Completed  
**Added:** 2026-01-26  
**Updated:** 2026-01-26

## Original Request
Reduce complexity in `useMatchSession.ts` by extracting network calls and snapshot construction into small, testable modules.

## Requirements (EARS)
- WHEN a match snapshot is required, THE SYSTEM SHALL construct a `MatchSnapshotPayload` consistently from the current `GameState` and recent telemetry.  
  Acceptance: Unit tests validate snapshot fields and normalization of telemetry events.

- WHEN sending/starting/ending matches, THE SYSTEM SHALL use a single `match` API client that maps errors to friendly types/messages.  
  Acceptance: Unit tests for API client responses and error mapping.

- WHEN the hook is refactored, THE SYSTEM SHALL maintain the same public API for consumers and the same runtime behavior.  
  Acceptance: Hook integration tests and manual smoke test should match previous behavior.

## Thought Process
`useMatchSession` mixes timers, fetch calls, and payload assembly. Extracting the API and payload builder will make the hook leaner and its networking behavior easier to test.

## Implementation Plan

1. Add unit tests that capture current `handleAskCopilot` and snapshot sending behavior (red → tests).  
2. Implement `redvsblue/api/match.ts` with `startMatch`, `sendSnapshot`, `ask`, `endMatch` functions and tests to mock fetch behavior.  
3. Implement `redvsblue/snapshot/builder.ts` as a pure function to compose `MatchSnapshotPayload` and tests for telemetry normalization.  
4. Refactor `useMatchSession` to rely on the new client and builder; add hook tests.  
5. Update docs and add small PRs per step.

## Progress Log

### 2026-01-26

- Implemented `match` API client (`startMatch`, `sendSnapshot`, `ask`, `endMatch`) with unit tests.
- Implemented `snapshot/builder` pure function to compose `MatchSnapshotPayload` and tests covering telemetry normalization and flags.
- Refactored `useMatchSession` to use the new client and builder; updated tests to use mocked fetch and ensure behavior remains unchanged. All relevant frontend tests pass locally.
- Next: monitor for small integration tidy-ups and prepare PR with focused commits.
- PR opened: [#88](https://github.com/deadronos/copilot-chat-playground/pull/88)

### 2026-01-27

- **Added** structured error responses for `MATCH_NOT_FOUND` on `/match/:matchId/snapshot` and `/match/:matchId/ask` (backend).
- **Updated** `redvsblue/api/match.ts` to parse JSON error responses and surface `status` and `body` to callers.
- **Refactored** `useMatchSession` to detect `MATCH_NOT_FOUND` and attempt to re-start the match (with bounded retries and user-facing toasts).
- **Added** server & client unit tests to verify structured 404 error payloads and client parsing + hook restart behavior.
- All backend and frontend tests pass locally; this reduces silent snapshot failures when a session is gone and improves recovery UX.
