# [TASK034] — Observability model selection & controls

**Status:** Completed ✅  
**Added:** 2026-03-16  
**Updated:** 2026-03-16

## Original Request

Open a new branch from `main` and actually implement the missing observability model-selection feature set: model picker, persistence, force-refresh probing, clear-events control, and end-to-end model override propagation.

## Thought Process

- The existing observability panel already exposes `/health`, `/models`, `/metrics`, and backend summary data, so it is the correct UI surface for controls.
- The current request path does not accept `model`, so the implementation must touch frontend state, backend schema/controller/service forwarding, and Copilot service handlers.
- The backend already exposes `clearEvents()`, which makes the delete endpoint a small, testable addition.
- The Copilot CLI probe design and local docs indicate `--model <name>` is supported, so CLI mode can participate in the same override contract as SDK mode.

## Implementation Plan

1. Add design/task records and create feature branch.
2. Extend chat request contracts to accept `model?: string` across frontend, backend, and Copilot service layers.
3. Update SDK and CLI implementations to use the requested model when provided.
4. Upgrade `ObservabilityModelPanel` with model selector, persistence hooks, force refresh, and clear events.
5. Add/extend unit and component tests for the new behaviors.
6. Run targeted tests, then broader validation as needed.
7. Update task index and summarize results.

## Progress Tracking

**Overall Status:** Completed - 100%

### Subtasks

| ID | Description | Status | Updated | Notes |
| --- | --- | --- | --- | --- |
| 1.1 | Reserve design/task IDs and branch | Complete | 2026-03-16 | Branch `feat/observability-model-selection` created |
| 1.2 | Implement request-path model override | Complete | 2026-03-16 | `model?: string` now flows through frontend, backend, SDK, and CLI paths |
| 1.3 | Implement observability panel controls | Complete | 2026-03-16 | Added model selector, force refresh, and clear events |
| 1.4 | Add tests and validate | Complete | 2026-03-16 | Targeted Vitest suites plus full repo validation passed |
| 1.5 | Update docs/memory records | Complete | 2026-03-16 | Updated design, task index, active context, and progress |

## Progress Log

### 2026-03-16

- Confirmed the feature was missing from both UI and request path.
- Created `DES029` and `TASK034` to track the implementation.
- Created branch `feat/observability-model-selection` from `main`.
- Began tracing the exact files needed for end-to-end model override support.

### 2026-03-16 — completion update

- Added `model?: string` to frontend submission state, backend request validation, backend forwarding, and Copilot service request handling.
- Updated the SDK session builder to honor explicit requested models and the CLI runner to pass `--model <name>` when provided.
- Added `DELETE /api/observability/events` plus frontend controls for model force refresh and clearing backend event history.
- Added `modelSelectionStorage` for local persistence and covered it with unit tests.
- Validation passed with:
  - targeted backend tests
  - targeted frontend tests
  - targeted Copilot package tests
  - full repo validation via `pnpm lint && pnpm build && pnpm test`
