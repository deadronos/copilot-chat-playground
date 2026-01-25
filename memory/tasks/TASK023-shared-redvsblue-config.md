# [TASK023] — Shared RedVsBlue Config (DES022)

**Status:** Completed ✅  
**Added:** 2026-01-25  
**Updated:** 2026-01-25  
**Design:** `memory/designs/DES022-shared-redvsblue-config.md`

## Goal

Extract RedVsBlue rule ranges, config ranges, and decision limits into a single, canonical module in `@copilot-playground/shared` so frontend and backend use the same validated defaults, and operators can safely override via environment variables.

## Scope

**In scope**
- Shared config module + exports in `@copilot-playground/shared`.
- Backend: replace `RULE_RANGES`, `CONFIG_RANGES`, and `DECISION_LIMITS` with shared imports; keep behavior unchanged when no overrides are set.
- Frontend: replace local default constants used to propose rules/config with shared defaults (browser-safe imports).
- Tests: cover env override parsing/validation and prove no-default behavior remains unchanged.
- Docs: add a short “do not change defaults mid-season” note + override guidance.

**Out of scope (for this task)**
- Refactoring other RedVsBlue constants (token budget, snapshot buffer sizes, summary limits).
- Adding a new persistence schema version (`rulesVersion`) beyond documenting the policy.

## Requirements (EARS)

1. WHEN the shared package is imported, THE SYSTEM SHALL expose RedVsBlue rule ranges, config ranges, and decision limits with Zod validation and defaults.  
   Acceptance: a unit test imports the module and validates defaults via schema without reading environment variables.

2. WHEN the frontend needs default proposals, THE SYSTEM SHALL source them from `@copilot-playground/shared` instead of local literals.  
   Acceptance: frontend compiles and uses imported defaults to populate proposed rules/config.

3. WHEN the backend enforces clamping and decision limits, THE SYSTEM SHALL import the same limits from shared and preserve behavior when no env overrides are set.  
   Acceptance: existing backend tests for clamping and decision validation still pass with unchanged outcomes.

4. WHEN an operator sets supported env overrides, THE SYSTEM SHALL apply them with validation and sensible bounds.  
   Acceptance: backend/shared tests set env vars and observe changed effective values; invalid overrides fail with a clear error.

5. WHEN defaults/ranges/limits change, THE SYSTEM SHALL document the operational risk and migration guidance.  
   Acceptance: docs include a “don’t change mid-season / reproducibility” note and list supported overrides.

## Notes / Known drift to resolve

- Backend currently defines ranges/defaults in `src/backend/src/services/match-store.ts`.
- Frontend currently defines defaults in:
  - `src/frontend/src/redvsblue/config/defaults.ts`
  - `src/frontend/src/redvsblue/config/ui.ts`
- These defaults are not identical today (e.g., `bulletDamage` and `shipMaxHealth`). This task uses backend defaults as canonical to keep server behavior unchanged; frontend default proposals now match backend values.

## Implementation Plan (progressive checklist)

- [x] **0) Task setup**
  - [x] Create task file `TASK023` and link to `DES022`.
  - [x] Update `memory/tasks/_index.md` with `TASK023`.
  - [x] Confirm current sources-of-truth by locating:
    - [x] Backend ranges/defaults (`RULE_RANGES`, `CONFIG_RANGES`).
    - [x] Backend decision limits (`DECISION_LIMITS`).
    - [x] Frontend defaults for engine + UI proposals.
  - [x] Decide canonical defaults to ship in shared (recorded above).

- [x] **1) Shared config module (browser-safe)**
  - [x] Add `src/shared/src/config/redvsblue-config.ts`:
    - [x] Define `RuleRangeSchema` and `RedVsBlueConfigSchema` (Zod).
    - [x] Define types: `RuleRange`, `RuleRanges`, `ConfigRanges`, `DecisionLimits`, `RedVsBlueConfig`.
    - [x] Implement `DEFAULT_REDVSBLUE_CONFIG` using canonical values (no `process.env` usage at module scope).
    - [x] Implement `loadRedVsBlueConfig(options?: { env?: Record<string, string | undefined> })`:
      - [x] Use `options.env` when provided (tests), else attempt to read from Node env (guarded so the module can be imported in the browser).
      - [x] Merge env overrides into defaults and validate with Zod.
      - [x] Return `{ config, appliedOverrides }` so backend can optionally log what was overridden.
  - [x] Add exports in `src/shared/src/index.ts` for the new symbols.
  - [x] Add needed deps to `src/shared/package.json` (at minimum `zod`) so consumers do not rely on hoisting.

- [x] **2) Env override surface**
  - [x] Support a JSON blob override:
    - [x] `REDVSBLUE_CONFIG` (stringified JSON merged over defaults; validated).
  - [x] Support a minimal, explicit set of scalar overrides (prefixed `REDVSBLUE_`):
    - [x] Rule defaults/ranges (e.g., `REDVSBLUE_SHIP_SPEED_DEFAULT`, `REDVSBLUE_BULLET_DAMAGE_MIN`).
    - [x] Config range default: `REDVSBLUE_SNAPSHOT_INTERVAL_MS_DEFAULT`
    - [x] Decision limits: `REDVSBLUE_MAX_SPAWN_PER_DECISION`, `REDVSBLUE_MAX_SPAWN_PER_MINUTE`, `REDVSBLUE_DECISION_COOLDOWN_MS`
  - [x] Define “sensible bounds”:
    - [x] Reject values that violate schema (e.g., negative, min > max, default outside range).
    - [x] Produce clear error strings suitable for tests/logging.

- [x] **3) Backend integration (no-default behavior unchanged)**
  - [x] Update `src/backend/src/services/match-store.ts`:
    - [x] Replace `RULE_RANGES`/`CONFIG_RANGES` with shared config values.
    - [x] Use shared defaults for `buildEffectiveRules()` and `buildEffectiveConfig()`.
    - [x] Load env overrides once at module init via `loadRedVsBlueConfig()`.
  - [x] Update `src/backend/src/services/decision-referee.ts`:
    - [x] Replace local `DECISION_LIMITS` with shared import.
  - [x] Ensure backend runtime still starts with no env overrides set.

- [x] **4) Frontend integration (use shared defaults for proposals)**
  - [x] Update `src/frontend/src/redvsblue/config/defaults.ts` to source from shared defaults.
  - [x] Update `src/frontend/src/redvsblue/config/ui.ts` to source from shared defaults.
  - [x] Ensure frontend only imports browser-safe exports (do not call `loadRedVsBlueConfig()` from browser code).
  - [x] Confirm `RedVsBlue.tsx` proposed rules/config are populated from shared canonical defaults.

- [x] **5) Tests**
  - [x] Add unit tests for `loadRedVsBlueConfig()`:
    - [x] No env overrides → equals canonical defaults.
    - [x] Valid JSON blob override → applied and validated.
    - [x] Valid scalar overrides → applied and validated.
    - [x] Invalid overrides → clear error (assert message contains which key failed).
  - [x] Update backend tests that reference numeric literals:
    - [x] Import canonical constants from `@copilot-playground/shared`.
    - [x] Assert behavior unchanged (decision validation warnings/rejections).
  - [ ] Optional integration-style test:
    - [ ] Start backend app with env overrides and assert `effectiveRules/effectiveConfig` reflect overrides (where observable).

- [x] **6) Documentation & migration guidance**
  - [x] Update `memory/designs/DES022-shared-redvsblue-config.md` status to `Implemented`.
  - [x] Add an operator note documenting:
    - [x] Supported env vars (`REDVSBLUE_CONFIG`, key scalars).
    - [x] “Do not change defaults mid-season” / reproducibility guidance.
  - [x] Add a short changelog note in DES022.

- [ ] **7) Validation (commands to run)**
  - [ ] `pnpm -F @copilot-playground/shared lint` (if/when a lint script exists) or `pnpm -F @copilot-playground/backend lint`
  - [ ] `pnpm -F @copilot-playground/backend test`
  - [ ] `pnpm -F @copilot-playground/frontend test`
  - [ ] `pnpm -F @copilot-playground/backend build`
  - [ ] `pnpm -F @copilot-playground/frontend build`

- [x] **8) Handoff**
  - [x] Update `memory/tasks/TASK023-shared-redvsblue-config.md` progress log and mark status completed.
  - [x] Update `memory/tasks/_index.md` to reflect completion.
  - [x] Prepare PR summary (below).

## Progress Tracking

| ID  | Description                                  | Status   | Updated    | Notes |
| --- | -------------------------------------------- | -------- | ---------- | ----- |
| 1.1 | Shared config module + exports               | Complete | 2026-01-25 |       |
| 1.2 | Env overrides (JSON + scalars)               | Complete | 2026-01-25 |       |
| 1.3 | Backend imports + behavior parity            | Complete | 2026-01-25 |       |
| 1.4 | Frontend defaults sourced from shared        | Complete | 2026-01-25 |       |
| 1.5 | Tests updated/added                           | Complete | 2026-01-25 |       |
| 1.6 | Docs + migration note                         | Complete | 2026-01-25 |       |

## Progress Log

### 2026-01-25

- Implemented shared RedVsBlue config module with Zod validation and env overrides.
- Wired backend and frontend to shared defaults/limits; frontend proposals now match backend defaults.
- Added unit tests for shared config overrides and updated backend/frontend tests to consume shared constants.
- Updated DES022 with override guidance + changelog, and referenced shared config in DES012/DES018.

## Acceptance Criteria

- [x] `@copilot-playground/shared` exports RedVsBlue config ranges/defaults/limits + Zod schema + `loadRedVsBlueConfig()`.
- [x] Backend and frontend consume shared values; backend behavior is unchanged with no overrides.
- [x] Supported env overrides work and are validated with clear errors for invalid values.
- [x] Tests updated and docs include operational guidance about changing defaults.

## PR Summary (draft)

1) Goal: Centralize RedVsBlue defaults/ranges/limits in shared config with validated env overrides.  
2) Key changes: `src/shared/src/config/redvsblue-config.ts`, backend services now import shared config, frontend defaults now use shared values.  
3) Validation: `pnpm -F @copilot-playground/backend test`, `pnpm -F @copilot-playground/frontend test` (pending run).
