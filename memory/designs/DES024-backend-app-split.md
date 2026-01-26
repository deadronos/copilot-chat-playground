# DES024 - Backend: split `app.ts` into routes, controllers, schemas, and logging

**Status:** Proposed
**Related tasks:** TASK025
**Related issues:** #82

## Summary

`src/backend/src/app.ts` is a large file that mixes routing, request validation, Copilot decision orchestration, session persistence, and streaming HTTP logic. This design proposes a safe, incremental decomposition into focused modules to improve testability, readability, and maintainability.

## Goals

- Move business logic out of Express route handlers into testable controllers.
- Keep HTTP contracts identical and minimize behavioral changes during refactor.
- Add unit/integration tests for new modules.

## High-level design

Components:
- `routes/match.ts` — Express Router with `/api/redvsblue/match/*` endpoints. Delegates to `controllers/matchController`.
- `controllers/matchController.ts` — Implements handler logic (start, snapshot, ask, end) using `session`, `decision-referee`, and `copilot` services.
- `routes/chat.ts` & `controllers/chatController.ts` — Stream-based `/api/chat` logic moved to controller.
- `schemas/*.ts` — Zod schemas for request shapes (MatchStart, Snapshot, Ask, Chat).
- `lib/logging.ts` — Centralized logging helpers (logStructuredEvent, logValidationFailure, logMatchFailure, logDecisionAudit wrapper).
- `app.ts` — reduced to wiring middleware and mounting routers.

## Data flow

Requests -> router -> controller -> services (session, decision-referee, copilot) -> persistence/logging -> response

## Testing & validation

- Unit tests for controllers covering success, validation errors, decision flows (accepted/rejected/invalid), and persistence interactions (use in-memory mock for persistence).
- Router integration tests that spin up an Express instance and exercise start/snapshot/ask/end flows without external Copilot calls (mock Copilot client).

## Acceptance criteria

- No change to external HTTP contract (status codes and response shapes).
- Unit tests covering controller behaviors with high confidence (>80% for new modules).
- Integration tests for router flows.

## Rollout strategy

1. Add new modules and unit tests behind feature branch.
2. Swap `app.ts` to import and mount the new routers.
3. Run tests and smoke tests locally.
4. Iterate until parity is achieved, then remove old inline logic in `app.ts`.


---

*Created: 2026-01-26*
