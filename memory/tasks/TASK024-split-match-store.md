# TASK024 - Split `match-store.ts` into focused RedVsBlue modules

**Status:** Completed  
**Added:** 2026-01-26  
**Updated:** 2026-01-26

## Original Request

The match-store file is currently handling persistence, serialization, rule enforcement, snapshot compaction, token budgeting, and session orchestration all in one place. Refactor it into smaller modules so each responsibility can be reasoned about and tested independently.

**Note:** `match-store.ts` has been removed; references below describe the original plan and are kept for historical context.

## Thought Process

- The file already imports helpers from shared config (clamp, estimateTokenCount, etc.), so we can split around the current thematic groupings: persistence/serialization vs. summary/token-budget vs. session orchestration.

- Maintaining the existing `matchStore` map and exported `createMatchSession`/`recordSnapshot` APIs will keep downstream dependents stable while we peel logic into `redvsblue/*` helpers.

- We should follow TDD: introduce failing tests scoped to each helper before implementing them, then update existing integration tests to prove behavior remains unchanged.

- Proposed helper modules: `persistence.ts`, `serialization.ts`, `rules.ts`, `summary.ts`, `tokenBudget.ts`, plus `session.ts` (the orchestrator that re-exports the public API).

## Requirements (EARS)

1. **WHEN** the backend persists/rehydrates a match, **THE SYSTEM SHALL** use dedicated I/O helpers so persistence logic can evolve independently of session management. [Acceptance: persistence tests mock the filesystem and assert `persistMatchSession` writes the expected JSON shape and that loader repopulates `matchStore` with deserialized sessions.]

2. **WHEN** rules or config inputs arrive, **THE SYSTEM SHALL** clamp them via a reusable rules helper before storing them on the session. [Acceptance: unit tests for `buildEffectiveRules` and `buildEffectiveConfig` cover the full range bounds defined in config and emit warning arrays when inputs exceed limits.]

3. **WHEN** snapshots overflow or token budgets tighten, **THE SYSTEM SHALL** delegate compaction/summary trimming and budget enforcement to their own helpers so the session manager only coordinates the calls. [Acceptance: tests assert `compactSessionSnapshots` and `enforceTokenBudget` mutate the session in predictable ways, without requiring the full store map.]

4. **WHEN** any helper is updated, **THE SYSTEM SHALL** include regression tests (TDD) directly targeting that helper before touching higher-level session logic. [Acceptance: every new helper module gets at least one failing test demonstrating the desired behavior (e.g., `summary` helper refuses to exceed `STRATEGIC_SUMMARY_MAX_CHARS`).]

## Implementation Plan

1. **Rules & Config helper extraction (Red)**: Write failing test for `buildEffectiveRules` and `buildEffectiveConfig` verifying clamp behavior + warnings. Extract those functions from `match-store.ts` into `redvsblue/rules.ts`, export the same signatures, and update `createMatchSession` to import them.

2. **Summary/token-budget helpers (Red)**: Add tests for `compactSessionSnapshots`, `trimSummary`, and `enforceTokenBudget` (e.g., budget overflow triggers compaction). Move constants (`STRATEGIC_SUMMARY_MAX_CHARS`, `TOKEN_BUDGET_SNAPSHOT_LIMIT`, etc.) to these modules as needed. Update `recordSnapshot`/`enforceTokenBudget` to call the helpers.

3. **Serialization/persistence helpers (Red)**: Create tests that serialize a fake session and ensure round-trip via `deserializeMatchSession`. Add tests that `persistMatchSession` writes to a temp directory and `loadPersistedSessions` rehydrates map entries. Move `serialize/deserialize`, `ensurePersistDir`, and `fs` usage into `redvsblue/serialization.ts` and `redvsblue/persistence.ts`.

4. **Session orchestration (Green)**: Refactor `match-store.ts` into `redvsblue/session.ts` that imports the new helpers, keeps the map, and handles `createMatchSession`, `recordSnapshot`, and `persist`/`load` entry points.

5. **Integration sanity tests (Refactor)**: Run the existing backend unit tests that exercise match creation, snapshot recording, and persisted session rotations to verify no regressions.

## Tests to Add

- `rules.test.ts`: clamp boundaries, warning emission, default values when inputs missing.

- `summary.test.ts`: `buildStrategicSummary` output formatting, `trimSummary` length guarantee, `compactSessionSnapshots` drop & summarization behavior.

- `tokenBudget.test.ts`: ensures `enforceTokenBudget` trims snapshots when token budget exceeded and respects `TOKEN_SAFETY_FACTOR`.

- `serialization.test.ts`: round-trip of `serializeMatchSession`/`deserializeMatchSession`, ensures applied decision IDs set is preserved.

- `persistence.test.ts`: mocking `fs.promises.writeFile`/`mkdirSync` ensures `persistMatchSession` emits the expected JSON and `removePersistedSession` suppresses `ENOENT` errors.

- `session.test.ts`: ensure `recordSnapshot` still updates `summaryUpdatedAt`, `snapshots`, and `decisionHistory` after helpers applied.

## Progress Log

### 2026-01-26

- Captured the new design doc (DES023) that maps responsibilities to extracted modules.

- Drafted this task to track the split and outline the required TDD steps.

### 2026-01-26

- Split match-store into redvsblue helper modules (rules, summary, tokenBudget, serialization, persistence, session) and updated backend imports.
- Added targeted unit tests for the new helpers and updated existing phase-4 tests to import from the new modules.
- Removed the legacy match-store implementation after updating app/session wiring.
- Ran `pnpm test` after fixing helper test setup (vitest mock hoist) and decision validation expectations; all workspace tests passed.

## Progress Tracking

**Overall Status:** Completed — 100%

### Subtasks

| ID  | Description                                    | Status   | Updated    | Notes |
| --- | ---------------------------------------------- | -------- | ---------- | ----- |
| 1.1 | Extract rules/config helpers + tests           | Complete | 2026-01-26 |       |
| 1.2 | Extract summary/token budget helpers + tests   | Complete | 2026-01-26 |       |
| 1.3 | Extract serialization/persistence helpers      | Complete | 2026-01-26 |       |
| 1.4 | Refactor session orchestration + update imports| Complete | 2026-01-26 |       |
| 1.5 | Update/extend backend tests                    | Complete | 2026-01-26 |       |
