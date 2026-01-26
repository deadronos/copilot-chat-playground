# TASK027 - Decompose `RedVsBlue.tsx` into match/session, AI director, and toast hooks

**Status:** Pending
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
| ID  | Description                     | Status      | Updated      | Notes |
| --- | ------------------------------- | ----------- | ------------ | ----- |
| 27.1 | Add `useMatchSession`           | Not Started | 2026-01-26   |      |
| 27.2 | Add `useAiDirector`             | Not Started | 2026-01-26   |      |
| 27.3 | Add `useToast`                  | Not Started | 2026-01-26   |      |
| 27.4 | Update `RedVsBlue.tsx` to use hooks | Not Started | 2026-01-26   |      |

## Progress Log
### 2026-01-26
- Task created and design file DES026 added.


---

*Acceptance criteria: `RedVsBlue.tsx` consists of pure markup + hook wiring and hooks are covered by unit tests.*
