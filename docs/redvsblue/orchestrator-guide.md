# Red vs Blue Orchestrator — Guide

**Contents:**

- [Overview](#overview)
- [Architecture and Components](#architecture-and-components)
- [Match lifecycle](#match-lifecycle-quick)
- [Safety and Controls](#safety-and-controls)
- [Configuration and Environment](#configuration-and-environment)
- [Tests and Validation](#tests-and-validation)
- [Observability and Troubleshooting](#observability-and-troubleshooting)
- [Operational checklist](#operational-checklist)
- [Examples](#examples)
- [Troubleshooting playbook](#troubleshooting-playbook)
- [References](#references)

## Overview

**Purpose:** Describe the Red vs Blue game orchestration: how the frontend, backend, and Copilot service interact to provide an AI "Director" that can recommend and (optionally) trigger in‑game actions.

---

## Architecture and Components

- **Frontend** (UI & game engine): `src/frontend/src/redvsblue/*`
  - Starts/ends matches, sends snapshots, receives decisions, applies validated decisions.
- **Backend** (API & decision pipeline): `src/backend/src/app.ts`
  - Endpoints: `POST /api/redvsblue/match/start`, `POST /api/redvsblue/match/:matchId/snapshot`, `POST /api/redvsblue/match/:matchId/ask`, `POST /api/redvsblue/match/:matchId/end`.
  - Decision flow: build prompt → call Copilot (`callCopilotService` / `callCopilotServiceStream`) → parse JSON (`parseDecisionProposal`) → referee (`validateDecision`) → persist + return validated decision.
- **Copilot service**: `src/copilot` (CLI wrapper or SDK). Backend uses `COPILOT_SERVICE_URL` (default `http://localhost:3210`).
- **Match Store & Persistence**: `src/backend/src/services/redvsblue/session.ts` — session registry and orchestration. Persistence/serialization live in `src/backend/src/services/redvsblue/persistence.ts` and `src/backend/src/services/redvsblue/serialization.ts`; summary + token-budget logic live in `src/backend/src/services/redvsblue/summary.ts` and `src/backend/src/services/redvsblue/tokenBudget.ts`. Sessions persist to `REDVSBLUE_PERSIST_DIR` (default `/tmp/redvsblue-sessions`).
- **Telemetry**: Frontend includes `TelemetryConnector` to stream telemetry to backend WebSocket.

---

## Match lifecycle (quick)

1. Frontend: `POST /api/redvsblue/match/start` → backend creates `MatchSession` and persists it.
2. Game loop: frontend sends frequent snapshots: `POST /api/redvsblue/match/:matchId/snapshot` (payload includes `requestDecision: true|false`).
3. If `requestDecision: true` → backend builds prompt and calls Copilot, then validates/filters the response before returning `validatedDecision` in the snapshot response.
4. Frontend applies `validatedDecision` (e.g., spawn ships) or surfaces rejection reasons as a toast.
5. Optional: user can call `POST /api/redvsblue/match/:matchId/ask` for commentary/status updates.
6. Frontend ends match via `POST /api/redvsblue/match/:matchId/end` which cleans up session and persisted file.

---

## Safety and Controls

- **Middleware Referee** enforces limits: per‑decision max spawn, per‑minute budget, cooldowns, duplicate request rejection. See `src/backend/src/services/decision-referee.ts` and constants in `DECISION_LIMITS`.
- **Auto-decisions** are opt‑in in the UI. Rejected or clamped proposals return structured reasons/warnings.
- **Token budget** & summary compaction: snapshots are compacted and summarized to keep prompts within a configured token budget.

---

## Configuration and Environment

- `COPILOT_SERVICE_URL` — where the backend sends prompts (default `http://localhost:3210` / in Docker `http://copilot:3210`).
- `REDVSBLUE_PERSIST_DIR` — directory for persisted match sessions (default `/tmp/redvsblue-sessions`).
- `REDVSBLUE_TOKEN_BUDGET` — token budget used for prompt rehydration (default in code if absent).
- `GH_TOKEN` / `GITHUB_TOKEN` — required for the copilot container (if using CLI/SDK with GitHub auth).
- Docker Compose: `docker-compose.yml` includes `copilot`, `backend`, and `frontend` services and wiring.

---

## Tests and Validation

Relevant tests:

- Backend unit tests: `tests/backend/unit/redvsblue-director.test.ts`, `tests/backend/unit/decision-validation.test.ts`
- Backend integration: `tests/backend/integration/redvsblue-snapshot-flow.test.ts`
- Frontend stores & worker tests: `tests/frontend/unit/redvsblue/**/*`

Run tests (monorepo, pnpm):

- Install: `pnpm install`
- Run the backend tests: `pnpm -w -F @copilot-playground/backend test`
- Or run root test script if configured: `pnpm test`

---

## Observability and Troubleshooting

- Logs: backend prints structured events for decision accept/reject/errors (`logDecisionAudit`, `logStructuredEvent`). Watch backend logs for Copilot calls and rejection reasons.
- Copilot health: `GET http://<copilot-host>:3210/health` (service reports `tokenConfigured` and `mode`).
- Persisted sessions: check files in `REDVSBLUE_PERSIST_DIR` to inspect session state and decision history.
- Common issues:
  - "Copilot not configured" → ensure `GH_TOKEN` is set and Copilot container is healthy.
  - Streaming unavailable → backend falls back to non‑streaming calls and returns plain text errors.

---

## Operational checklist

- [ ] Ensure `copilot` service is running and healthy.
- [ ] Start `backend` and confirm it can reach `COPILOT_SERVICE_URL`.
- [ ] Open `RedVsBlue` UI, start match, enable `Auto-decisions` to validate end‑to‑end loop.
- [ ] Inspect `/tmp/redvsblue-sessions` and backend logs for decision audit records.

---

## Examples


### Start match

Request:

```json
POST /api/redvsblue/match/start
Content-Type: application/json

{
  "matchId": "match-123",
  "rulesVersion": "v1",
  "proposedRules": {
    "shipSpeed": 5,
    "bulletSpeed": 8,
    "bulletDamage": 10,
    "shipMaxHealth": 30
  },
  "clientConfig": { "snapshotIntervalMs": 30000 }
}
```

Response (success):

```json
HTTP/1.1 200 OK
{
  "matchId": "match-123",
  "sessionId": "...",
  "effectiveRules": { "shipSpeed": 5, "bulletSpeed": 8, "bulletDamage": 10, "shipMaxHealth": 30 },
  "effectiveConfig": { "snapshotIntervalMs": 30000 },
  "warnings": [],
  "requestId": "...",
  "traceId": "..."
}
```


### Snapshot (no decision requested)

Request:

```json
POST /api/redvsblue/match/match-123/snapshot
Content-Type: application/json

{
  "timestamp": 1670000000000,
  "snapshotId": "snap-1",
  "gameSummary": { "redCount": 3, "blueCount": 5, "totalShips": 8 },
  "counts": { "red": 3, "blue": 5 },
  "recentMajorEvents": [],
  "requestDecision": false
}
```

Response:

```json
HTTP/1.1 200 OK
{
  "ok": true,
  "matchId": "match-123",
  "sessionId": "...",
  "storedSnapshots": 1,
  "requestId": "...",
  "traceId": "..."
}
```


### Snapshot (decision requested)

Request: same as above but `"requestDecision": true`.

Possible responses:

- Decision accepted (validated):

```json
{
  "ok": true,
  "notificationText": "AI Director suggests spawning 2 blue ships.",
  "validatedDecision": {
    "requestId": "...",
    "type": "spawnShips",
    "params": { "team": "blue", "count": 2 },
    "warnings": []
  }
}
```

- Decision rejected (e.g., token error / validation):

```json
{
  "ok": true,
  "decisionRejectedReason": "Decision request failed: Copilot unreachable"
}
```


### Ask (commentary)

```json
POST /api/redvsblue/match/match-123/ask
Content-Type: application/json

{ "question": "Status?" }
```

Response:

```json
{
  "matchId": "match-123",
  "sessionId": "...",
  "commentary": "Blue team leads by 2 ships.",
  "requestId": "...",
  "traceId": "..."
}
```

### End match

```json
POST /api/redvsblue/match/match-123/end
```

Response: `200 OK` (session cleaned up and persisted file removed).

---

## Troubleshooting playbook

1. Copilot service health

- Check service: `curl http://localhost:3210/health`
- Confirm `tokenConfigured: true` and `mode` (sdk|cli).

1. Streaming vs non-streaming

- If `/chat/stream` returns 404, backend falls back to buffered `/chat`. Look at `callCopilotServiceStream` logs and `callCopilotService` error fields.

1. Decisions are being rejected or clamped

- Review backend logs for structured decision audit events ( `decision accepted` / `decision rejected` / `decision invalid` ).
- Inspect persisted session file in `REDVSBLUE_PERSIST_DIR` to check `decisionHistory`, `decisionState`, and `strategicSummary`.

1. Token budget/summaries

- If prompts are trimmed, check `REDVSBLUE_TOKEN_BUDGET` and session `strategicSummary` / `snapshots` length. Consider raising budget or increasing compaction thresholds for long matches.

1. Frontend not applying validated decisions

- Ensure `Auto-decisions` is enabled (UI toggle) or that client code handles `validatedDecision` in snapshot response and calls `spawnShip`.

1. Missing persisted sessions

- Verify `REDVSBLUE_PERSIST_DIR` path and process permissions. Backend writes JSON files named `<matchId>.json`.

1. Quick local checks

- `docker compose ps` and `docker compose logs copilot backend` to view service status and errors.

---

## References

- Design notes: `memory/designs/DES013-redvsblue-ai-director-phase2-decision-pipeline.md`
- Tasks: `memory/tasks/_index.md` (search TASK013–TASK017)
- Key source files: `src/backend/src/services/redvsblue/session.ts`, `src/backend/src/services/redvsblue/persistence.ts`, `src/backend/src/services/redvsblue/serialization.ts`, `src/backend/src/services/decision-referee.ts`, `src/backend/src/services/copilot.ts`, `src/frontend/src/redvsblue/RedVsBlue.tsx`.

---

If you'd like, I can expand the examples with cURL commands and sample server logs, or add a short playbook for debugging Copilot token issues. ✨
