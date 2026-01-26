# DES023 — RedVsBlue Match Store Refactor

**Objective**: Split `match-store.ts` into cohesive modules so persistence, serialization, decision helpers, and snapshot management each own a small, testable surface. This makes it easier to reason about token-budget adjustments, strategic summaries, and persistence in isolation, while minimizing cognitive load when updating RedVsBlue orchestration logic.

---

## Requirements (EARS)

1. **WHEN** the backend needs to persist or load an ongoing RedVsBlue session, **THE SYSTEM SHALL** delegate persistence preparation and rehydration to a dedicated persistence/serialization module so match lifecycle logic remains focused on business rules. [Acceptance: backend unit tests verify serialization↔deserialization round-trip behaviors without touching rule enforcement helpers.]

2. **WHEN** snapshots overflow soft limits or trigger token-budget safety checks, **THE SYSTEM SHALL** use a summary/token-budget module to compact history and trim stored summaries, keeping `recordSnapshot` simple. [Acceptance: unit tests cover `compactSessionSnapshots` and `enforceTokenBudget` invariants without touching `MatchStore` global state.]

3. **WHEN** new sessions are created, **THE SYSTEM SHALL** build sanitized rule/config payloads through a rules helper so `createMatchSession` only orchestrates and does not duplicate clamp/validation logic. [Acceptance: tests assert `buildEffectiveRules` & `buildEffectiveConfig` respect configured ranges and collect warnings.]

4. **WHEN** any module accesses match state, **THE SYSTEM SHALL** expose narrowly typed interfaces (e.g., `MatchPersistence`, `MatchRules`, `TokenBudget`) so future tooling (e.g., telemetry or CLI tools) can reuse the helpers without importing the whole store. [Acceptance: downstream imports (redvsblue controller) source from new modules instead of the old monolith.]

5. **WHEN** decisions need context (strategic summary or budget), **THE SYSTEM SHALL** provide pure helpers that do not mutate the global store, making them easy to unit test. [Acceptance: each helper exports only the computed mutation result and does not touch `matchStore` map.]

---

## Architecture

- **Persistence Layer (`redvsblue/persistence.ts`)** — wraps `fs` usage for `persistMatchSession`, `removePersistedSession`, `loadPersistedSessions`, `getPersistDir`, and directory management. Keeps file-path logic in once place so future storage (e.g., S3) only touches this module.

- **Serialization Helpers (`redvsblue/serialization.ts`)** — contains `serializeMatchSession`, `deserializeMatchSession`, and `rebuildDecisionState`. Converts between in-memory structures (e.g., `Set`) and persisted shapes, so persistence, match creation, and tests can share the same clutch.

- **Rules Helpers (`redvsblue/rules.ts`)** — exports `buildEffectiveRules`, `buildEffectiveConfig`, `clampNumber` wrappers, and constant ranges pulled from `redvsblueConfig`. Rules module also exports the `RuleWarning` aggregation logic, isolating mutant guardrails.

- **Summary Helpers (`redvsblue/summary.ts`)** — exposes `buildStrategicSummary`, `mergeStrategicSummary`, `trimSummary`, and `compactSessionSnapshots`. By centralizing we can add instrumentation for compaction without touching `recordSnapshot`.

- **Token Budget (`redvsblue/tokenBudget.ts`)** — includes `getTokenBudget` (with ENV override fallback) and `enforceTokenBudget`, plus constants like `TOKEN_SAFETY_FACTOR` and `TOKEN_BUDGET_SNAPSHOT_LIMIT`. If budgets become dynamic, only this module changes.

- **Session Manager (`redvsblue/session.ts`)** — keeps the existing `matchStore` map, `createMatchSession`, `recordSnapshot`, and exported `MatchSession` helpers. The manager imports the helpers above and orchestrates set/add/mutate operations without embedding logic about file I/O, summary trimming, or range clamping.

## Data Flow

1. `createMatchSession` (session manager) calls `buildEffectiveRules` + `buildEffectiveConfig`, stores warnings, and seeds snapshot/decision state. All heavy-lifting happens in helper modules.

2. `persistMatchSession` → serialization module → persistence module ensures consistent JSON output.

3. `recordSnapshot` adds snapshot to session, then pipes through `compactSessionSnapshots` (summary module) and `enforceTokenBudget` (token-budget module) before updating timestamps.

4. `loadPersistedSessions` walks persisted files, deserializes using serialization helpers, and rebuilds in-memory state via match manager.

5. Tests talk directly to helper modules, never to the global `matchStore` map unless they’re verifying high-level orchestration.

## Interfaces

- `redvsblue/persistence.ts` exports `{ persistMatchSession, removePersistedSession, loadPersistedSessions }` plus `getPersistDir` (unexported outside module) and is imported only by the `redvsblue/session.ts` orchestrator.

- `redvsblue/serialization.ts` exports `serializeMatchSession(session: MatchSession): PersistedMatchSession` and `deserializeMatchSession(raw: PersistedMatchSession): MatchSession`, plus the internal `rebuildDecisionState` for tests.

- `redvsblue/rules.ts` exports `buildEffectiveRules(proposedRules): { effectiveRules, warnings }` and `buildEffectiveConfig(clientConfig, warnings)`, capturing `RuleWarning` side channel.

- `redvsblue/summary.ts` exports pure functions that accept snapshots/strings and return computed summaries, plus `compactSessionSnapshots(session)` which mutates passed session for clarity (documented).

- `redvsblue/tokenBudget.ts` exports `ensureTokenBudget(session, snapshot)` (renamed or consistent) and the underlying env-configured budget helper.

- `redvsblue/session.ts` re-exports `setMatchSession`, `getMatchSession`, `deleteMatchSession`, `matchStore`, ensuring consumers only import from a single module once we update references.

## Validation Strategy

- Each helper receives 1–3 targeted tests verifying boundary behaviors: clamping, trimming, TTL, etc.

- Integration-style tests ensure `recordSnapshot` still updates `strategicSummary`, `snapshots`, and `summaryUpdatedAt` as expected (existing tests moved with minimal adjustments).

- Persistence helper tests can run in a temp directory using `tmpdir`, mocking `fs.promises` to ensure no actual disk writes.

- Add `vitest` suite verifying serialization round-trips and that token-budget trimming triggers when budgets exceeded.

## Risk Mitigation

- Keep the exported API of each helper stable during refactor by re-exporting from `session.ts` gradually and adjusting imports via workspace-wide search.

- Run the existing copilot tests after refactor to ensure nothing regressed (already part of standard workflow).

- Avoid overlapping responsibilities between modules by checking that summary & token budget modules do not mutate the store (only accept snapshots/session copies as needed).
