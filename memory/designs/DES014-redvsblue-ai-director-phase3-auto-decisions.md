# DES014 — Red vs Blue AI Director (Phase 3: Periodic Snapshots + Auto-Decisions)

**Status:** Draft
**Date:** 2026-01-25

## Overview

Phase 3 adds periodic snapshot cadence (default 30s) and a user-visible toggle for auto-decisions.

Reference architecture: `docs/agents/redvsblue/ARCHITECTURE.md`

## Requirements (EARS)

1. WHEN auto-decisions are enabled, THE SYSTEM SHALL request decisions at a controlled cadence (rate limited) from recent snapshots.  
   **Acceptance:** Enable auto-decisions; verify decisions occur no faster than configured bounds.

2. WHEN auto-decisions are disabled, THE SYSTEM SHALL NOT request or apply gameplay mutations automatically.  
   **Acceptance:** Disable toggle; verify no decision calls are made.

3. WHEN the snapshot interval is configured by the frontend, THE SYSTEM SHALL validate and clamp it to server-enforced safe bounds.  
   **Acceptance:** Set 1s interval; verify server clamps/rejects.

## UI / UX

- Toggle: enable/disable auto-decisions
- Button: “Ask Copilot” (manual)
- Toast feed: commentary + decision rationale

## Acceptance criteria (Phase 3)

- Default periodic snapshots every 30s.
- Toggle reliably gates decision requests.
- Rate limits and cooldowns prevent runaway behavior.
