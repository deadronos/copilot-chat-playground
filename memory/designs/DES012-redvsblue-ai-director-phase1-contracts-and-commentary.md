# DES012 — Red vs Blue AI Director (Phase 1: Contracts + Commentary)

**Status:** Draft
**Associated Issue:** [#47](https://github.com/deadronos/copilot-chat-playground/issues/47)
**Date:** 2026-01-25

## Overview

Phase 1 establishes the “AI Director” integration surface without allowing the model to mutate gameplay.

Deliverables:

- Match lifecycle endpoints (start/end)
- Rules negotiation (frontend proposes; backend normalizes/clamps)
- Snapshot ingestion (validated, stored in rolling buffer)
- Commentary MVP (toast text; optional SSE later)

Reference architecture: `docs/agents/redvsblue/ARCHITECTURE.md`

## Requirements (EARS)

1. WHEN a match starts, THE SYSTEM SHALL accept a proposed rules/config payload and return an effective (normalized/clamped) rules/config plus a `sessionId`.  
   **Acceptance:** Start match with out-of-range values; verify server clamps and returns warnings.

2. WHEN the frontend posts a snapshot, THE SYSTEM SHALL validate the snapshot schema and store it in a rolling buffer keyed by `matchId`.  
   **Acceptance:** Post an oversized snapshot; verify server rejects with a structured error.

3. WHEN the user clicks “Ask Copilot”, THE SYSTEM SHALL return commentary text suitable for a notification toast.  
   **Acceptance:** Manual ask returns a string; UI displays it as a toast.

4. WHEN invalid rules or snapshots are received, THE SYSTEM SHALL reject with actionable validation errors and log the failure with correlation IDs.  
   **Acceptance:** Observe logs include `matchId`, `sessionId`, and `requestId`.

## Non-goals

- No gameplay mutations from Copilot in Phase 1.
- No auto-decisions.
- No WebSockets.

## Interfaces (high-level)

- `POST /api/redvsblue/match/start`
- `POST /api/redvsblue/match/:matchId/snapshot`
- `POST /api/redvsblue/match/:matchId/ask`
- `POST /api/redvsblue/match/:matchId/end`

## Data contracts (outline)

- Proposed rules/config
  - `matchId`, `rulesVersion`, `proposedRules`, `clientConfig` (e.g., snapshot interval)
- Effective rules/config
  - `effectiveRules`, `warnings[]`, `effectiveConfig`
- Snapshot
  - `timestamp`, `snapshotId`, `gameSummary` (lossy), `counts`, `recentMajorEvents[]`

## Best practices for design/spec documents

This section is a checklist we will repeat in each phase design doc.

- Clearly state scope, non-goals, and dependencies.
- Provide 2–5 EARS-style requirements with explicit acceptance tests.
- Define data contracts and versioning strategy.
- Define validation rules and failure modes.
- Include observability requirements (logs/metrics/traces).
- Include security posture (auth, rate limits, abuse controls).
- Document rollout/feature flag strategy.

## Acceptance criteria (Phase 1)

- Endpoints exist and respond with the expected shapes.
- Rules are normalized/clamped and returned as `effectiveRules`.
- Snapshots are validated and stored with bounded retention.
- Manual ask returns toast commentary.
