# DES006 — Milestone C: End-to-End Streaming

**Status:** Draft
**Created:** 2026-01-23
**Updated:** 2026-01-23

## Overview

Enable real-time streaming from the Copilot service through the backend and into the frontend. The backend should proxy streaming responses (chunked text) and support request cancellation. This design focuses on backend streaming and testability while keeping the existing `/api/chat` interface stable.

## Requirements (EARS)

1. **WHEN** a client sends `POST /api/chat` with a valid prompt, **THE SYSTEM SHALL** stream response bytes to the client as they arrive from the copilot service. **Acceptance:** response starts sending before the full completion is available.
2. **WHEN** the backend cannot reach the streaming endpoint on the copilot service, **THE SYSTEM SHALL** fall back to the buffered `/chat` response and return the output as plain text. **Acceptance:** same prompt returns a text response even if streaming is unavailable.
3. **WHEN** the client closes the connection mid-stream, **THE SYSTEM SHALL** abort the upstream copilot request to avoid wasting resources. **Acceptance:** backend aborts upstream fetch and ends response without hanging.
4. **WHEN** the copilot service returns an error, **THE SYSTEM SHALL** map error types to appropriate HTTP status codes and return a clear, plain-text error message. **Acceptance:** error messages match existing behavior and status codes.

## Architecture

```text
Browser (fetch stream)
   │
   ▼
Backend /api/chat (Express)
   │  (stream proxy)
   ▼
Copilot service /chat/stream (text/plain stream)
```

## Data Flow

1. Frontend sends `POST /api/chat` with JSON `{ prompt, mode }`.
2. Backend attempts `POST {COPILOT_SERVICE_URL}/chat/stream` and begins streaming response chunks to the client.
3. If streaming endpoint is unavailable (e.g., 404), backend falls back to buffered `/chat` and returns the output as plain text.
4. Client receives chunked text and appends in real-time.

## Interfaces

### Backend → Copilot (Streaming)

- **Request**: `POST /chat/stream`
- **Body**: `{ prompt: string, mode: "explain-only" | "project-helper" }`
- **Response**: `text/plain` streamed chunks

### Backend → Copilot (Fallback)

- **Request**: `POST /chat`
- **Body**: `{ prompt: string, mode: "explain-only" | "project-helper" }`
- **Response**: JSON `{ output: string }`

## Error Handling

| Scenario | Expected Behavior | Status Code |
| --- | --- | --- |
| Missing/invalid prompt | Reject request | 400 |
| Copilot token missing | Plain-text error | 503 |
| Copilot auth failed | Plain-text error | 401 |
| Copilot stream unavailable | Fallback to buffered | 200 |
| Copilot stream error | Plain-text error | 500 |
| Client aborts | Abort upstream fetch | n/a |

## Testing Strategy

- **Unit/Component Tests**
  - Backend streams response from a mock copilot streaming endpoint.
  - Backend falls back to `/chat` when `/chat/stream` is unavailable.
  - Backend aborts upstream fetch on client disconnect.

- **Integration Tests**
  - Optional: end-to-end streaming with the real copilot service (token required).

## Notes

- Streaming endpoint on copilot service is expected to emit `text/plain` chunks.
- Frontend already consumes streaming via `ReadableStream`.
- This design keeps `/api/chat` stable; no frontend API changes required.
