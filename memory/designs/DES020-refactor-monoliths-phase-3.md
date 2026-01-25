# DES020 - Refactor Monoliths Phase 3 (Cleanup, Docs & CI Guardrails)

**Status:** Draft  
**Created:** 2026-01-25  
**Owner:** Copilot Agent

## Summary
Document the new module boundaries from Phase 2, add CI guardrails for coverage thresholds and backend router size, and remove pre-refactor leftovers. This phase focuses on keeping the refactor durable and easy to understand rather than changing runtime behavior.

## Scope
- Documentation describing module boundaries for backend services, ChatPlayground UI, and RedVsBlue engine.
- CI coverage thresholds for backend/frontend/copilot packages.
- Router guardrails to keep `src/backend/src/app.ts` thin.
- Cleanup of unused pre-refactor files and stale exports.

## Non-Goals
- No changes to API payloads, streaming behavior, or UI layout.
- No new E2E/Playwright setup (tracked in TASK021).

## Architecture & Module Boundaries

### Backend
- `src/backend/src/app.ts`: route wiring + request validation only.
- `src/backend/src/services/*`: copilot calls, match/session store, decision validation.

### Frontend
- `src/frontend/src/components/chat-playground.tsx`: stateful container + hooks.
- `src/frontend/src/components/chat-playground/*`: presentational panels and header.

### RedVsBlue Engine
- `src/frontend/src/redvsblue/engine/*`: engine core, entities, serialization helpers.
- `src/frontend/src/redvsblue/*`: hooks, renderer, telemetry, and UI wiring.

## CI Guardrails
- **Coverage thresholds:** enforced in package-level vitest configs. Thresholds are intentionally modest but non-zero to prevent regressions.
- **Router thinness:** a simple line-count guard ensures `app.ts` does not grow beyond the agreed ceiling; additional logic should move into `services/*`.

## Error Handling
- Guardrail scripts fail CI with a clear message when thresholds are violated.

## Risks & Mitigations
- **Risk:** Coverage thresholds too aggressive for current suite.  
  **Mitigation:** Start with modest thresholds and adjust upward once baseline is confirmed in CI.
- **Risk:** Router guard blocks legitimate changes.  
  **Mitigation:** Encourage refactoring into services and adjust line cap only with owner approval.

## Open Questions
- Should coverage thresholds be raised once baseline metrics are published in CI?
