# DES029 — Observability Model Selection & Controls

**Status:** Implemented ✅
**Created:** 2026-03-16
**Updated:** 2026-03-16

## Overview

Add a real model-selection workflow to the chat playground so users can inspect available models, choose a model override from the observability panel, persist that choice locally, force-refresh the probed model list, clear backend observability events, and propagate the selected model through frontend, backend, and Copilot service layers.

## Requirements (EARS)

- WHEN the user opens the observability panel, THE SYSTEM SHALL display the current default model, the advertised model list, and a control for choosing a model override. [Acceptance: component test renders a model selector with a default option and probed models.]
- WHEN the user selects a model override, THE SYSTEM SHALL persist the selection in local storage and reuse it for subsequent chat requests. [Acceptance: component test verifies persisted selection; request-path tests verify `model` is forwarded.]
- WHEN the user clears the selected model, THE SYSTEM SHALL fall back to the runtime default model configured by the Copilot service. [Acceptance: selector supports a default option and request payload omits/clears override appropriately.]
- WHEN the user triggers force refresh, THE SYSTEM SHALL bypass the model-probe cache and refresh the advertised model list. [Acceptance: component test verifies `/models?refresh=true` is requested.]
- WHEN the user triggers clear events, THE SYSTEM SHALL delete stored backend observability events and refresh the summary display. [Acceptance: backend test covers `DELETE /api/observability/events`; component test verifies summary resets after clear.]
- WHEN a chat request includes a model override, THE SYSTEM SHALL forward it through frontend, backend, and Copilot SDK/CLI layers and request that concrete model. [Acceptance: unit tests verify forwarding and session creation/CLI invocation include the requested model.]

## Design

### Data flow

1. `ChatPlayground` owns `selectedModel` state and persists it in local storage.
2. `ObservabilityModelPanel` reads diagnostics and renders:
   - model selector
   - refresh diagnostics button
   - force refresh models button
   - clear events button
3. `useStreamingChat.submit()` includes `model` in the request body when a concrete override is selected.
4. Backend request schema and controller accept optional `model` and forward it to Copilot service helpers.
5. Backend service forwards `model` to Copilot service `/chat` and `/chat/stream`.
6. Copilot service request schema accepts optional `model`.
7. SDK path passes `model` to session creation; CLI path passes `--model <name>`.

### Storage

- Local storage key: `copilot-playground:selected-model`
- Stored payload: plain string model id; empty/absent means use runtime default.

### Error handling

| Operation | Failure mode | Behavior |
| --- | --- | --- |
| Load diagnostics | endpoint failure | show existing error banner and preserve current selector value |
| Force refresh models | probe failure | show error banner, preserve previously loaded model list |
| Clear events | delete failure | show error banner, do not mutate summary optimistically |
| Submit chat with model | invalid backend/service response | surface existing request error handling |

### Testing strategy

- Frontend component tests for selector rendering, persistence, force refresh, and clear events.
- Backend tests for `DELETE /api/observability/events` and chat schema/controller forwarding.
- Copilot unit tests for SDK session model selection and CLI `--model` propagation.

## Notes

- Default option should remain explicit to avoid confusing a persisted override with the service default.
- SDK and CLI paths should share the same request contract: `model?: string`.

## Implementation outcome

- Added an explicit model override control to `ObservabilityModelPanel` with default fallback semantics.
- Persisted the selected model locally via `modelSelectionStorage` and forwarded it through `useStreamingChat`, backend chat schema/controller/service plumbing, and Copilot SDK/CLI handlers.
- Added `DELETE /api/observability/events` and frontend controls for force-refreshing the model probe and clearing backend events.
- Validated with targeted frontend/backend/copilot tests and full repository validation (`pnpm lint && pnpm build && pnpm test`).
