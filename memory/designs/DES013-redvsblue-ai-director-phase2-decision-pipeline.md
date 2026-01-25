# DES013 — Red vs Blue AI Director (Phase 2: Decision Pipeline + Middleware Referee)

**Status:** Draft
**Associated Issue:** [#48](https://github.com/deadronos/copilot-chat-playground/issues/48)
**Date:** 2026-01-25

## Overview

Phase 2 introduces **structured decisions** (request/response) using Pattern C.

The model suggests actions; the backend middleware referee validates and clamps them; the frontend applies only validated decisions.

Reference architecture: `docs/agents/redvsblue/ARCHITECTURE.md`

## Requirements (EARS)

1. WHEN the backend requests a decision, THE SYSTEM SHALL produce a model prompt that results in a strictly structured decision response.  
   **Acceptance:** Invalid JSON responses are rejected and logged; safe no-op returned.

2. WHEN a decision is received, THE SYSTEM SHALL validate and clamp it against server-enforced limits (caps, cooldowns, allowed actions).  
   **Acceptance:** Attempt to spawn > max-per-decision; verify clamp or rejection.

3. WHEN a decision is accepted, THE SYSTEM SHALL return both `notificationText` and `validatedDecision` to the frontend.  
   **Acceptance:** UI renders toast text and applies decision via `applyRemoteAction`.

4. WHEN a decision is rejected, THE SYSTEM SHALL provide a reason string and persist an audit record.  
   **Acceptance:** Audit log shows proposed vs effective decision with correlation IDs.

## Interfaces (high-level)

- Extend `POST /api/redvsblue/match/:matchId/snapshot` to optionally return a decision.
- Optionally add `POST /api/redvsblue/match/:matchId/decision/preview` for dry-run.

## Data contracts (outline)

- Decision proposal (from model)
  - `requestId`, `type`, `params`, `confidence?`, `reason?`
- Validated decision (from backend)
  - `requestId`, `type`, `params` (clamped), `warnings[]`

## Safety & validation

- Allowlist action types (e.g., `spawnShips`).
- Cap per decision, per minute, per match.
- Cooldowns to prevent oscillation.
- Idempotency: decisions keyed by `requestId`.

## Acceptance criteria (Phase 2)

- Decisions are strictly schema validated.
- Middleware referee clamps/rejects unsafe decisions.
- Frontend receives toast + validated decision.
- Audit logs include proposed vs effective.
