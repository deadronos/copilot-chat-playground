# 09 — Playground architecture (frontend / backend / copilot)

This repo is structured as:

- `src/frontend`: chat UI
- `src/backend`: HTTP API gateway + SSE/WebSocket streaming to UI
- `src/copilot`: Copilot SDK integration + Copilot CLI runtime

## Why split backend vs copilot?

Separation makes it easier to:

- keep `GH_TOKEN` in one place
- limit tool exposure
- restart Copilot runtime independently
- stream logs/events consistently

## Suggested data flow

1. Frontend sends `POST /api/chat` to backend with `{ prompt, session_id? }`
2. Backend forwards to copilot service and opens an SSE stream back to frontend
3. Copilot service:
   - creates/resumes a Copilot session
   - subscribes to SDK events
   - emits normalized events to backend
4. Backend forwards those events to frontend and persists them (optional)

## Keep interfaces stable

One of the best learning tricks: define **your own stable event protocol** between frontend and backend.
Then you can swap implementations:

- Milestone C: spawn Copilot CLI and parse stdout
- Milestone F: switch to Copilot SDK events

…and the UI doesn’t need to change much.

## Sources

- Copilot SDK getting started: <https://github.com/github/copilot-sdk/blob/main/docs/getting-started.md>
