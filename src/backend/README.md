# Backend

Node.js API gateway for the playground frontend. It validates chat payloads, proxies streaming requests to the copilot service, falls back to buffered responses when needed, and serves the RedVsBlue orchestration endpoints.

## Endpoints

- `GET /health` — basic service health
- `POST /api/chat` — streaming chat bridge with buffered fallback
- `POST /api/redvsblue/match/start` — create a RedVsBlue match session
- `POST /api/redvsblue/match/:matchId/snapshot` — publish a match snapshot / request a decision
- `POST /api/redvsblue/match/:matchId/ask` — ask commentary questions about a running match
- `POST /api/redvsblue/match/:matchId/end` — end a match and remove persisted state

## `POST /api/chat`

Request body:

```json
{
  "prompt": "Summarize the latest answer",
  "mode": "explain-only",
  "sessionId": "optional-client-session-id",
  "messages": [
    { "role": "user", "content": "Earlier question" },
    { "role": "assistant", "content": "Earlier answer" }
  ]
}
```

Notes:

- `mode` defaults to `"explain-only"`
- `sessionId` and `messages` are optional
- when `messages` are supplied, the backend builds a contextual prompt so the next Copilot turn can continue the existing conversation
- responses are streamed as `text/plain` when the upstream streaming endpoint is available; otherwise the backend falls back to the buffered copilot endpoint and still returns plain text to the client

## Implementation notes

- Chat request validation lives in `src/backend/src/schemas/chat.ts`
- Streaming/fallback behavior lives in `src/backend/src/controllers/chatController.ts`
- Context shaping for resumed chat sessions lives in `src/backend/src/services/chat-context.ts`
