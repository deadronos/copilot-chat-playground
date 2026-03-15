# TASK032 - Chat session context hardening

**Status:** Completed  
**Added:** 2026-03-15  
**Updated:** 2026-03-15

## Original Request

Polish the conversation-history persistence PR by restoring observability tests, fixing the prompt/history race, hardening localStorage access, and updating the backend to consume `sessionId` and `messages`.

## Requirements (EARS)

- WHEN the frontend persists chat state, THE SYSTEM SHALL tolerate unavailable or blocked storage without throwing.  
  Acceptance: storage helper tests verify failed reads return `null` and failed writes return `false`.

- WHEN the user submits a prompt, THE SYSTEM SHALL include the current prompt in the conversation history payload sent to the backend.  
  Acceptance: frontend tests verify the built request messages include the latest prompt and preserve prior conversation.

- WHEN the backend receives `sessionId` and `messages`, THE SYSTEM SHALL validate and consume them to build a context-aware prompt.  
  Acceptance: schema/controller tests verify the payload is accepted and forwarded as contextualized prompt text.

- WHEN observability helpers change, THE SYSTEM SHALL retain unit coverage for event ordering, filtering, limits, and time windows.  
  Acceptance: restored backend tests cover `recordEvent`/`getEvents` behaviors.

## Thought Process

The current PR already stores chat history, but it has three polish gaps: it can over-trust browser storage, it misses the current user prompt because React state updates are async, and the backend currently ignores the new session payload. A small helper-driven refactor can fix all three issues while keeping controller/service boundaries readable and restoring the deleted observability tests.

## Implementation Plan

1. Harden client-side chat persistence helpers and add tests for blocked reads/writes.
2. Build submitted conversation messages from the existing timeline plus the in-flight prompt before state mutation.
3. Extend backend chat schema and controller flow to accept `sessionId`/`messages` and convert them into contextual prompt text.
4. Restore observability unit tests and run targeted frontend/backend validation.

## Progress Tracking

**Overall Status:** Completed - 100%

### Subtasks

| ID  | Description                                  | Status      | Updated    | Notes                        |
| --- | -------------------------------------------- | ----------- | ---------- | ---------------------------- |
| 1.1 | Harden frontend storage helpers              | Complete    | 2026-03-15 | Safe storage access          |
| 1.2 | Fix current-prompt conversation race         | Complete    | 2026-03-15 | Latest prompt included       |
| 1.3 | Consume session context in backend chat flow | Complete    | 2026-03-15 | Context prompt helper wired  |
| 1.4 | Restore/extend automated tests               | Complete    | 2026-03-15 | Lint, build, and tests green |

## Progress Log

### 2026-03-15

- Hardened `chatSessionStorage` so storage access failures are non-fatal and writes return a success flag.
- Fixed the submit path so request messages are built before React applies the timeline state update, ensuring the current prompt is included.
- Extended backend chat validation with `sessionId` and `messages` and added a prompt-context helper so the server consumes the new payload.
- Restored `tests/backend/unit/observability.test.ts` and added targeted schema/controller/frontend coverage.
- Validation complete: `pnpm lint` passed, backend/frontend package builds passed, targeted backend/frontend suites passed, and `pnpm test` exited 0 at repo root.
