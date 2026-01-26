# TASK027 - Decompose `RedVsBlue.tsx` into match/session, AI director, and toast hooks

**Status:** Completed
**Added:** 2026-01-26
**Updated:** 2026-01-26
**Related issue:** #84

## Original Request

Extract match/session management, AI decision application, and toast management from `RedVsBlue.tsx` into small hooks (`useMatchSession`, `useAiDirector`, `useToast`).

## Thought Process

`RedVsBlue.tsx` contains imperative networking and timing logic that is better tested in hooks. Extracting this allows unit testing of decision application and snapshot scheduling without rendering the full component.

## Implementation Plan

- Implement `useMatchSession` handling match lifecycle and snapshot push/ask flows.
- Implement `useAiDirector` to parse and apply validated decisions and provide UI callbacks/warnings.
- Implement `useToast` for toast lifecycle and timing.
- Replace logic in `RedVsBlue.tsx` with hook wiring and add component tests for critical flows.

### Subtasks

| ID   | Description                          | Status   | Updated    | Notes |
| ---- | ------------------------------------ | -------- | ---------- | ----- |
| 27.1 | Add `useMatchSession`                | Complete | 2026-01-26 |       |
| 27.2 | Add `useAiDirector`                  | Complete | 2026-01-26 |       |
| 27.3 | Add `useToast`                       | Complete | 2026-01-26 |       |
| 27.4 | Update `RedVsBlue.tsx` to use hooks  | Complete | 2026-01-26 |       |

## Progress Log

### 2026-01-26

- Task created and design file DES026 added.
- Implemented `useMatchSession`, `useAiDirector`, and `useToast` hooks and rewired `RedVsBlue.tsx` to use them.
- Added unit tests for hooks plus a component smoke test for toast/AI override wiring.


---

*Acceptance criteria: `RedVsBlue.tsx` consists of pure markup + hook wiring and hooks are covered by unit tests.*
