# TASK028 - RedVsBlue matchId path hardening

**Status:** Completed  
**Added:** 2026-01-26  
**Updated:** 2026-01-26

## Original Request

Security scan finding:

> Uncontrolled data used in path expression
>
> `req.params.matchId` flows into `removePersistedSession(matchId)` and ultimately into a filesystem path used by `fs.promises.unlink()`.

Please address these concerns.

## Requirements (EARS)

1. **WHEN** a match start request provides a `matchId` containing unsafe characters, **THE SYSTEM SHALL** reject the request with a validation error (HTTP 400).
2. **WHEN** persisting or removing a RedVsBlue session, **THE SYSTEM SHALL** refuse to touch the filesystem if the provided `matchId` is not filename-safe.
3. **WHEN** persisting or removing a RedVsBlue session, **THE SYSTEM SHALL** ensure the resolved session file path remains within `REDVSBLUE_PERSIST_DIR` (defense-in-depth against path traversal).

## Design Notes

Small, localized hardening change; no standalone design doc created.

- Constrain `matchId` at the API boundary (`MatchStartSchema`).
- Add a persistence-layer helper that validates `matchId` and verifies the final resolved file path stays under the persistence directory.

## Implementation Plan

- Tighten `MatchStartSchema.matchId` to a filename-safe token (`[A-Za-z0-9_-]{1,128}`).
- Centralize persisted session path construction in persistence helpers.
- Add/extend unit tests to cover unsafe `matchId` rejection and filesystem no-op behavior.

## Progress Tracking

**Overall Status:** Completed - 100%

### Subtasks

| ID  | Description                                   | Status   | Updated    | Notes |
| --- | --------------------------------------------- | -------- | ---------- | ----- |
| 1.1 | Add matchId validation to match start schema  | Complete | 2026-01-26 |       |
| 1.2 | Harden persistence file path resolution       | Complete | 2026-01-26 |       |
| 1.3 | Add unit tests and run full suite             | Complete | 2026-01-26 |       |

## Progress Log

### 2026-01-26

- Tightened `MatchStartSchema.matchId` to a filename-safe regex.
- Added persistence-layer path resolution helper to prevent path traversal and refuse unsafe ids.
- Validated `:matchId` route params in match endpoints (snapshot/ask/end) and normalized param typing to satisfy backend `tsc`.
- Added unit tests for schema rejection + persistence no-op behavior; ran `pnpm test` successfully.
