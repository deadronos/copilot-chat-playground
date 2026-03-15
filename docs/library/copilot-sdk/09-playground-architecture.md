# 09 — Playground architecture (frontend / backend / copilot)

This repo is structured as:

- `src/frontend`: chat UI
- `src/backend`: HTTP API gateway that validates requests and streams `text/plain` chat responses to the UI
- `src/copilot`: Copilot SDK integration + Copilot CLI runtime

## Why split backend vs copilot?

Separation makes it easier to:

- keep `GH_TOKEN` in one place
- limit tool exposure
- restart Copilot runtime independently
- stream logs/events consistently

## Suggested data flow

1. Frontend sends `POST /api/chat` to backend with `{ prompt, mode, sessionId?, messages? }`
2. Backend validates the payload and, when history is present, converts it into a context-enriched prompt for the next turn
3. Backend forwards the request to the copilot service and streams plain-text chunks back to the frontend fetch reader
4. Copilot service:
   - creates a fresh Copilot SDK session for the request
   - subscribes to SDK events
   - emits text deltas/final output while logging normalized observability events internally
5. If the upstream streaming endpoint is unavailable, backend falls back to the buffered copilot endpoint and still returns plain text to the frontend

## Keep interfaces stable

One of the best learning tricks: define **your own stable event protocol** between frontend and backend.
Then you can swap implementations:

- Milestone C: spawn Copilot CLI and parse stdout
- Milestone F: switch to Copilot SDK events

…and the UI doesn’t need to change much.

In the current implementation, `/api/chat` remains stable in a backwards-compatible way: `prompt` + `mode` still work, and `sessionId` / `messages` were added as optional context fields for resumed conversations.

## Sources

- Copilot SDK getting started: <https://github.com/github/copilot-sdk/blob/main/docs/getting-started.md>
