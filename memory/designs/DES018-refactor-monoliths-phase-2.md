# DES018 - Refactor Monoliths Phase 2 (Modules + Tests)

**Status:** Draft  
**Created:** 2026-01-25  
**Owner:** Copilot Agent

## Summary
Split backend, frontend, and engine monoliths into testable modules while preserving behavior. Keep backend routes thin, move RedVsBlue session and decision logic into services, and separate engine entities/core loop. Add focused unit/component/integration tests, keeping determinism and snapshots stable.

## Scope
- Backend: extract copilot call handling, match persistence/session logic, and decision validation into `src/backend/src/services/*`.
- Frontend: split ChatPlayground into container + presentational components; keep side-effects in hooks.
- Engine: move entity classes to `redvsblue/engine/entities`, extract update loop into `redvsblue/engine/core`.
- Tests: update existing backend tests to target services; add frontend component tests; add seeded engine snapshot test; add /api/chat streaming parity integration test.

## Non-Goals
- Change backend API behavior or response formats.
- Redesign UI/UX or alter existing styles.
- Replace vitest with Playwright (E2E currently out of scope per docs/agents/testing).

## Architecture
### Backend
- `services/copilot.ts`: copilot service URL, buffered/streamed calls, error mapping helper.
- `services/match-store.ts`: session types, persistence, rule/config clamping, snapshot compaction, token budget enforcement.
- `services/decision-referee.ts`: decision proposal parsing, validation limits, audit logging helpers.
- `app.ts`: route wiring, request validation, and orchestration only.

### Frontend
- `ChatPlaygroundContainer`: manages state, hooks, and handlers.
- Presentational components: `ChatHeader`, `PromptPanel`, `StreamOutputPanel`, `RedVsBluePanel` (pure props).

### Engine
- `engine/entities/*`: `Ship`, `Bullet`, `Particle` classes.
- `engine/core.ts`: update loop steps (ships, bullets, particles, collisions) as pure-ish helpers called by `Engine`.

## Data Flow
1. Client POST /api/redvsblue/match/start -> `match-store` builds session and persists.
2. Client POST /api/redvsblue/match/:id/snapshot -> `match-store` updates snapshots and token budget.
3. If decision requested -> `copilot` service call -> `decision-referee` parse/validate -> audit record -> response payload.
4. Frontend container uses `useApiProbe` + `useStreamingChat`, renders presentational components with derived props.
5. Engine core updates state deterministically when `seed` is set.

## Interfaces (selected)
- `services/copilot.ts`
  - `callCopilotService(prompt, mode): Promise<CopilotCallResult>`
  - `callCopilotServiceStream(prompt, mode, signal): Promise<CopilotStreamResult>`
  - `sendPlainTextError(res, errorType, errorMessage): void`
- `services/match-store.ts`
  - `createMatchSession(...)`, `getMatchSession(matchId)`, `persistMatchSession(session)`
  - `compactSessionSnapshots(session)`, `enforceTokenBudget(session, snapshot)`
- `services/decision-referee.ts`
  - `parseDecisionProposal(output)`
  - `validateDecision(session, proposal, now)`

## Testing Strategy
- Backend: move unit tests to target services (decision validation, summary/compaction, serialization).
- Frontend: component tests for presentational components; keep hook tests for side-effects.
- Engine: deterministic update test with seeded RNG + snapshot assertion.
- Integration: /api/chat streaming parity test (stream vs buffered output match).

## Error Handling
- Preserve existing error mapping for token/auth/connection in `sendPlainTextError`.
- Maintain decision audit logging with clear status/reason fields.

## Risks & Mitigations
- **Risk:** Type cycles between services.  
  **Mitigation:** use shared types module or type-only imports.
- **Risk:** Engine refactor breaks determinism.  
  **Mitigation:** seed-based snapshot tests and existing deterministic checks.
- **Risk:** Playwright requirement conflicts with testing guidance.  
  **Mitigation:** implement component tests now; ask owner about adding Playwright suite.

## Note
- RedVsBlue rule/config defaults and decision limits now live in `@copilot-playground/shared` (DES022) to avoid frontend/backend drift.

## Open Questions
- Should we introduce Playwright tooling now or defer to Phase 3 per testing playbook?
