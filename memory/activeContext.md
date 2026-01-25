# Active Context

**Current focus:**
- Finalize Milestone E: Workspace mount + secrets (completed 2026-01-24).  
- Continue Milestone F: switch to Copilot SDK (`TASK004`) — in progress.  
- Continue Milestone C: end-to-end streaming tests and integration (`TASK006`) — in progress.
- Begin monolith refactor Phase 1 (`TASK018`) — safe helper extraction + tests.
- Execute monolith refactor Phase 2 (`TASK019`) — backend/frontend/engine module splits + tests (completed 2026-01-25).
- Execute monolith refactor Phase 3 (`TASK020`) — cleanup, docs, CI guardrails (completed 2026-01-25).
- Defer Playwright E2E coverage to `TASK021` (pending).

**Recent changes:**
- 2026-01-23/24: Implemented workspace read-only mount, `WORKDIR /workspace`, Compose wiring, and dotenvx secrets-first documentation (see commits in repository history).
- 2026-01-25: Scoped monolith refactor candidates (backend `app.ts`, frontend `chat-playground.tsx`, RedVsBlue `useGame.ts`).
- 2026-01-25: Split backend services, ChatPlayground presentational components, and RedVsBlue engine core/entities; added deterministic and parity tests (TASK019).
 - 2026-01-25: Added CI coverage thresholds + router thinness guard and documented post-refactor module layout (TASK020); tests/builds passed.
- 2026-01-25: Added Copilot CLI model probing + `GET /models` endpoint with caching, metrics, and unit tests (TASK022).

**Monolith inventory (2026-01-25):**
- `src/backend/src/app.ts` (~36KB): API routes + decision validation + streaming fallback logic.
- `src/frontend/src/components/chat-playground.tsx` (~25KB): chat UI + streaming + backend probe.
- `src/frontend/src/redvsblue/useGame.ts` (~13KB): engine lifecycle + canvas sizing + telemetry wiring.

**Next steps:**
1. Add a small follow-up to codify secrets guidance and add automated checks (create `DES009` and `TASK009`).
2. Finish SDK migration work (complete `TASK004`) and add integration tests that exercise SDK mode in CI.
3. Add automated integration tests for workspace mount visibility and dotenvx key handling.
4. Clarify Playwright E2E timing (TASK019 acceptance vs docs/agents/testing).
5. Continue `TASK018`: finalize helper extraction/tests and document changes.
6. Plan next CI validation work for guardrails (coverage + router) in a PR.

**Active decisions:**
- Default to read-only workspace mounts and document opt-in for read/write in a future milestone.
- Follow a secrets-first pattern: provide decryption keys at runtime and avoid baking keys into images.
