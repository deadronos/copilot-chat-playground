# 10 — Observability & logging (for a learning playground)

## Goal

For a learning project, logs are a feature.
We want:

- live logs visible in the frontend
- optional export (NDJSON/JSON) per session
- correlation across frontend/backend/copilot

## Recommended approach

### 1) Standardize a log/event schema

In this repo we already started a `LogEvent` type in `src/shared`.
Extend it to cover:

- `timestamp` (ISO)
- `level` (`debug|info|warn|error`)
- `component` (`frontend|backend|copilot|...`)
- `request_id` (per HTTP request)
- `session_id` (per Copilot session)
- `event_type` (e.g., `assistant.message_delta`, `tool.execution_start`)
- `message`
- `meta` (structured extras)

### 2) Use an EventBus per process

- Frontend: in-memory event emitter to append to a log panel
- Backend: publish events from HTTP handlers, SSE publisher, and copilot proxy
- Copilot service: publish SDK events + tool events

### 3) Stream logs to the UI

- Use **SSE** first (simple, server → browser)
- Consider WebSocket later (bidirectional control)

### 4) Export

- NDJSON is ideal for streaming and later analysis.
- For convenience, also support “download JSON array for session”.

## Safety

- Scrub tokens and secrets
- Don’t log raw prompts/responses by default (make it opt-in)

## Sources

- Copilot SDK events/tool execution are designed to be observed and streamed:
  - Getting started: <https://github.com/github/copilot-sdk/blob/main/docs/getting-started.md>
  - Cookbook: <https://github.com/github/copilot-sdk/blob/main/cookbook/README.md>
