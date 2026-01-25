# Red vs Blue Orchestrator — Guide

## 🚀 Overview

**Purpose:** Describe the Red vs Blue game orchestration: how the frontend, backend, and Copilot service interact to provide an AI "Director" that can recommend and (optionally) trigger in‑game actions.

---

## 🧭 Architecture & Components

- **Frontend** (UI & game engine): `src/frontend/src/redvsblue/*`
  - Starts/ends matches, sends snapshots, receives decisions, applies validated decisions.
- **Backend** (API & decision pipeline): `src/backend/src/app.ts`
  - Endpoints: `POST /api/redvsblue/match/start`, `POST /api/redvsblue/match/:matchId/snapshot`, `POST /api/redvsblue/match/:matchId/ask`, `POST /api/redvsblue/match/:matchId/end`.
  - Decision flow: build prompt → call Copilot (`callCopilotService` / `callCopilotServiceStream`) → parse JSON (`parseDecisionProposal`) → referee (`validateDecision`) → persist + return validated decision.
- **Copilot service**: `src/copilot` (CLI wrapper or SDK). Backend uses `COPILOT_SERVICE_URL` (default `http://localhost:3210`).
- **Match Store & Persistence**: `src/backend/src/services/match-store.ts` — session registry, snapshot buffer, strategic summaries, token-budget enforcement, persisted to `REDVSBLUE_PERSIST_DIR` (default `/tmp/redvsblue-sessions`).
- **Telemetry**: Frontend includes `TelemetryConnector` to stream telemetry to backend WebSocket.

---

## 🔁 Match lifecycle (quick)

1. Frontend: `POST /api/redvsblue/match/start` → backend creates `MatchSession` and persists it.
2. Game loop: frontend sends frequent snapshots: `POST /api/redvsblue/match/:matchId/snapshot` (payload includes `requestDecision: true|false`).
3. If `requestDecision: true` → backend builds prompt and calls Copilot, then validates/filters the response before returning `validatedDecision` in the snapshot response.
4. Frontend applies `validatedDecision` (e.g., spawn ships) or surfaces rejection reasons as a toast.
5. Optional: user can call `POST /api/redvsblue/match/:matchId/ask` for commentary/status updates.
6. Frontend ends match via `POST /api/redvsblue/match/:matchId/end` which cleans up session and persisted file.

---

## 🛡️ Safety & Controls

- **Middleware Referee** enforces limits: per‑decision max spawn, per‑minute budget, cooldowns, duplicate request rejection. See `src/backend/src/services/decision-referee.ts` and constants in `DECISION_LIMITS`.
- **Auto-decisions** are opt‑in in the UI. Rejected or clamped proposals return structured reasons/warnings.
- **Token budget** & summary compaction: snapshots are compacted and summarized to keep prompts within a configured token budget.

---

## ⚙️ Configuration & Environment

- `COPILOT_SERVICE_URL` — where the backend sends prompts (default `http://localhost:3210` / in Docker `http://copilot:3210`).
- `REDVSBLUE_PERSIST_DIR` — directory for persisted match sessions (default `/tmp/redvsblue-sessions`).
- `REDVSBLUE_TOKEN_BUDGET` — token budget used for prompt rehydration (default in code if absent).
- `GH_TOKEN` / `GITHUB_TOKEN` — required for the copilot container (if using CLI/SDK with GitHub auth).
- Docker Compose: `docker-compose.yml` includes `copilot`, `backend`, and `frontend` services and wiring.

---

## 🧪 Tests & Validation

Relevant tests:

- Backend unit tests: `tests/backend/unit/redvsblue-director.test.ts`, `tests/backend/unit/decision-validation.test.ts`
- Backend integration: `tests/backend/integration/redvsblue-snapshot-flow.test.ts`
- Frontend stores & worker tests: `tests/frontend/unit/redvsblue/**/*`

Run tests (monorepo, pnpm):

- Install: `pnpm install`
- Run the backend tests: `pnpm -w -F @copilot-playground/backend test`
- Or run root test script if configured: `pnpm test`

---

## 📡 Observability & Troubleshooting

- Logs: backend prints structured events for decision accept/reject/errors (`logDecisionAudit`, `logStructuredEvent`). Watch backend logs for Copilot calls and rejection reasons.
- Copilot health: `GET http://<copilot-host>:3210/health` (service reports `tokenConfigured` and `mode`).
- Persisted sessions: check files in `REDVSBLUE_PERSIST_DIR` to inspect session state and decision history.
- Common issues:
  - "Copilot not configured" → ensure `GH_TOKEN` is set and Copilot container is healthy.
  - Streaming unavailable → backend falls back to non‑streaming calls and returns plain text errors.

---

## ✅ Operational checklist

- [ ] Ensure `copilot` service is running and healthy.
- [ ] Start `backend` and confirm it can reach `COPILOT_SERVICE_URL`.
- [ ] Open `RedVsBlue` UI, start match, enable `Auto-decisions` to validate end‑to‑end loop.
- [ ] Inspect `/tmp/redvsblue-sessions` and backend logs for decision audit records.

---

## 📚 References

- Design notes: `memory/designs/DES013-redvsblue-ai-director-phase2-decision-pipeline.md`
- Tasks: `memory/tasks/_index.md` (search TASK013–TASK017)
- Key source files: `src/backend/src/services/match-store.ts`, `src/backend/src/services/decision-referee.ts`, `src/backend/src/services/copilot.ts`, `src/frontend/src/redvsblue/RedVsBlue.tsx`.

---

If you'd like, I can add a brief **examples** section with request/response payload examples or a troubleshooting playbook. ✨
