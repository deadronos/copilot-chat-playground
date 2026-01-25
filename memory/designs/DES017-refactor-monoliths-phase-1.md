# DES017 - Refactor Monoliths Phase 1 (Safe Helpers + Tests)

**Status:** Draft  
**Created:** 2026-01-25  
**Owner:** Copilot Agent

## Summary
Introduce small, low-risk helper extractions into `@copilot-playground/shared` and add targeted tests around backend decision validation, streaming fallback, and RedVsBlue snapshot flow. Keep behavior unchanged.

## Scope
- Extract helpers: `clampNumber`, `estimateTokenCount`, `buildDecisionPrompt`, `applyCanvasSize`.
- Add frontend hooks for probing backend and streaming chat.
- Add unit/integration tests for:
  - Decision validation logic
  - Streaming fallback
  - RedVsBlue snapshot flow
  - Extracted helpers

## Non-Goals
- Full module splits of backend/frontend/copilot (Phase 2).
- Engine architecture changes beyond existing deterministic tests.

## Interfaces

### Shared helpers (`@copilot-playground/shared`)
- `clampNumber(value, range, warnings, field): number`
- `estimateTokenCount(text): number`
- `applyCanvasSize(canvas, width, height): void`
- `buildDecisionPrompt(session, snapshot, requestId, options?): string`

### Frontend hooks
- `useApiProbe(options): { apiUrl; backendProbeInfo }`
- `useStreamingChat(): { output; status; error; isBusy; submit; clear }`

## Data Flow
1. `ChatPlayground` calls `useApiProbe` to resolve backend URL.
2. `ChatPlayground` uses `useStreamingChat` to submit and stream responses.
3. Backend uses shared helpers for decision prompts and token estimation.

## Testing Strategy
- Backend unit tests for decision validation and shared helpers.
- Backend integration tests for snapshot flow + streaming fallback.
- Frontend unit tests for hooks and canvas sizing helper.

## Risks & Mitigations
- **Risk:** Helper extraction changes behavior.  
  **Mitigation:** Snapshot/decision tests cover regression, no logic changes.
