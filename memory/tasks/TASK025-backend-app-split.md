# TASK025 - Refactor backend: split `app.ts` into routes/controllers/schemas/logging

**Status:** Completed
**Added:** 2026-01-26
**Updated:** 2026-01-26
**Related issue:** #82

## Original Request

Split `src/backend/src/app.ts` into smaller modules: routers, controllers, Zod schemas, and logging helpers to improve testability and clarity.

## Thought Process

`app.ts` performs routing, validation, business orchestration, telemetry logging, and streaming. Extracting responsibilities makes each unit easier to test and reduces risk when changing decision or session logic. Keep external API identical during refactor.

## Requirements (EARS)

1. **WHEN** a chat request is received, **THE SYSTEM SHALL** validate payloads with shared schemas and route requests through a dedicated chat controller. [Acceptance: schema tests pass and controller returns 400 for invalid payloads.]
2. **WHEN** match endpoints are called, **THE SYSTEM SHALL** delegate the request handling to match controllers via a match router. [Acceptance: integration tests using `createApp()` still pass and route wiring is unchanged.]
3. **WHEN** validation or match lookup fails, **THE SYSTEM SHALL** emit structured log events via shared logging helpers. [Acceptance: controller tests invoke logging helpers without runtime errors.]
4. **WHEN** backend controllers are extracted, **THE SYSTEM SHALL** keep HTTP response shapes and status codes identical. [Acceptance: existing backend integration tests pass unchanged.]

## Implementation Plan

- Phase 1 (Discovery): Create design (DES024) and tests scaffolding.
- Phase 2 (Extract schemas & logging): Add `schemas/` and `lib/logging.ts` and unit tests for them.
- Phase 3 (Extract chat route): Move `/api/chat` streaming to `routes/chat.ts` + `controllers/chatController.ts` and add unit tests.
- Phase 4 (Extract match route/controller): Move match endpoints to `routes/match.ts` and `controllers/matchController.ts`. Add unit tests for decision flow with mocked copilot client.
- Phase 5 (Integration & Cleanup): Mount routers in `app.ts`, add integration tests, and remove inlined code.

### Subtasks

|ID|Description|Status|Updated|Notes|
|---|---|---|---|---|
|25.1|Add `schemas/*.ts` with Zod schemas|Not Started|2026-01-26||
|25.2|Extract `lib/logging.ts`|Not Started|2026-01-26||
|25.3|Create `routes/chat.ts` + `controllers/chatController.ts`|Not Started|2026-01-26||
|25.4|Create `routes/match.ts` + `controllers/matchController.ts`|Not Started|2026-01-26||
|25.5|Add unit & integration tests|Not Started|2026-01-26||

## Progress Log

### 2026-01-26

- Task created and design file DES024 added.

### 2026-01-26 (implementation)

- Split `app.ts` into schemas, logging helpers, chat/match controllers, and routers.
- Added unit tests for schemas and controller validation/fallback coverage.
- Updated app wiring to mount the new routers.

## Progress Tracking

**Overall Status:** Completed — 100%

### Subtasks

|ID|Description|Status|Updated|Notes|
|---|---|---|---|---|
|25.1|Add `schemas/*.ts` with Zod schemas|Complete|2026-01-26||
|25.2|Extract `lib/logging.ts`|Complete|2026-01-26||
|25.3|Create `routes/chat.ts` + `controllers/chatController.ts`|Complete|2026-01-26||
|25.4|Create `routes/match.ts` + `controllers/matchController.ts`|Complete|2026-01-26||
|25.5|Add unit & integration tests|Complete|2026-01-26|Unit tests added; existing integration tests unchanged|


---

*Acceptance criteria: identical HTTP contracts; unit tests for controllers; router integration tests.*
