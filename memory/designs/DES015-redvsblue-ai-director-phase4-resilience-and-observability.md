# DES015 — Red vs Blue AI Director (Phase 4: Rehydration, Summarization, Observability)

**Status:** Draft
**Date:** 2026-01-25

## Overview

Phase 4 hardens long-running matches and improves production readiness:

- Match-long sessions per channel with bounded rehydration
- Snapshot compaction + strategic summarization to prevent prompt bloat
- Logs/metrics/traces with correlation IDs

Reference architecture: `docs/agents/redvsblue/ARCHITECTURE.md`

## Requirements (EARS)

1. WHEN the backend restarts, THE SYSTEM SHALL recreate Copilot sessions and rehydrate them from a bounded rolling window of snapshots.  
   **Acceptance:** Simulate restart; verify the director continues without losing rules/config.

2. WHEN context size approaches the token budget, THE SYSTEM SHALL compact snapshots and/or refresh the strategic summary.  
   **Acceptance:** Force many snapshots; verify compaction occurs and token estimate stays under budget.

3. WHEN decisions are applied, THE SYSTEM SHALL ensure idempotency using `requestId` to prevent double-application.  
   **Acceptance:** Replay same requestId; verify no duplicate spawns.

4. WHEN errors occur (validation, model malformation, rate limits), THE SYSTEM SHALL degrade safely and record structured error telemetry.  
   **Acceptance:** Inject malformed JSON; verify safe no-op and error record.

## Rehydration bounds (recommended defaults)

- Snapshot count: 25
- Token safety factor: 0.7
- Decision tail: last 5 decisions
- Message tail: last 10 messages per channel

## Observability

- Correlation IDs: `matchId`, `sessionId`, `requestId`, `traceId`
- Key metrics: decision latency, rejection rate, token usage, snapshot size, compaction frequency

## Acceptance criteria (Phase 4)

- Restart-safe behavior confirmed in tests.
- Token budget enforced via compaction/summarization.
- Structured logs are queryable by match/session/request.
