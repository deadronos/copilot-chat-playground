# DES026 - Frontend: Decompose `RedVsBlue.tsx` into hooks/controllers

**Status:** Implemented
**Related tasks:** TASK027
**Related issues:** #84

## Summary

`RedVsBlue.tsx` currently contains UI rendering and imperative business logic: match startup, snapshot polling, network calls (start/snapshot/ask), toast and timer management, and applying AI decisions. This design extracts those behaviors into discrete hooks to produce a cleaner UI component and testable logic.

## Goals

- Move business & network logic into hooks/controllers so UI is declarative and testable.
- Centralize toast behavior and AI decision application for consistent UX.

## Components

- `useMatchSession.ts` — handles match start/end, snapshot scheduling/publishing, and Ask flows. Exposes session state and helper functions: `startMatch`, `endMatch`, `pushSnapshot`, `askCopilot`.
- `useAiDirector.ts`/`aiDirector.ts` — contains logic for applying validated decisions, clamping warnings, and exposing events for UI feedback (toasts/overrides).
- `useToast.ts` — simple hook to show toasts with timeout management.

## Testing

- Unit tests for `useMatchSession` to confirm that snapshots are sent at configured intervals, requestDecision flows trigger the decision pipeline, and session start/end calls persist and load state correctly (use a mocked fetch).
- Unit tests for `useAiDirector` ensuring overrides and warnings are surfaced properly and time-limited UI messages behave as expected.
- Component tests for `RedVsBlue.tsx` ensuring it renders with hooks mocked.

## Acceptance criteria

- `RedVsBlue.tsx` reduced to markup + hook wiring (no imperative networking logic).
- Hook logic covered by unit tests and consistent UX preserved.


---

Created: 2026-01-26
