# [TASK023] — Shared RedVsBlue Config (DES022)

**Status:** Pending  
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
- These defaults are not identical today (e.g., `bulletDamage` and `shipMaxHealth`). This task must pick a canonical set (recommended: preserve backend defaults as canonical to keep server behavior unchanged) and document the resulting UI change.

## Implementation Plan (progressive checklist)

- [ ] **0) Task setup**
  - [ ] Create task file `TASK023` and link to `DES022`.
  - [ ] Update `memory/tasks/_index.md` with `TASK023`.
  - [ ] Confirm current sources-of-truth by locating:
    - [ ] Backend ranges/defaults (`RULE_RANGES`, `CONFIG_RANGES`).
    - [ ] Backend decision limits (`DECISION_LIMITS`).
    - [ ] Frontend defaults for engine + UI proposals.
  - [ ] Decide canonical defaults to ship in shared (record decision in this task file).

- [ ] **1) Shared config module (browser-safe)**
  - [ ] Add `src/shared/src/config/redvsblue-config.ts`:
    - [ ] Define `RuleRangeSchema` and `RedVsBlueConfigSchema` (Zod).
    - [ ] Define types: `RuleRange`, `RuleRanges`, `ConfigRanges`, `DecisionLimits`, `RedVsBlueConfig`.
    - [ ] Implement `DEFAULT_REDVSBLUE_CONFIG` using canonical values (no `process.env` usage at module scope).
    - [ ] Implement `loadRedVsBlueConfig(options?: { env?: Record<string, string | undefined> })`:
      - [ ] Use `options.env` when provided (tests), else attempt to read from Node env (guarded so the module can be imported in the browser).
      - [ ] Merge env overrides into defaults and validate with Zod.
      - [ ] Return `{ config, appliedOverrides }` (or similar) so backend can optionally log what was overridden.
  - [ ] Add exports in `src/shared/src/index.ts` for the new symbols.
  - [ ] Add needed deps to `src/shared/package.json` (at minimum `zod`) so consumers do not rely on hoisting.

- [ ] **2) Env override surface**
  - [ ] Support a JSON blob override:
    - [ ] `REDVSBLUE_CONFIG` (stringified JSON merged over defaults; validated).
  - [ ] Support a minimal, explicit set of scalar overrides (prefixed `REDVSBLUE_`):
    - [ ] Rule defaults (example): `REDVSBLUE_SHIP_SPEED_DEFAULT`, `REDVSBLUE_BULLET_DAMAGE_DEFAULT`, etc.
    - [ ] Config default: `REDVSBLUE_SNAPSHOT_INTERVAL_MS_DEFAULT`
    - [ ] Decision limits: `REDVSBLUE_MAX_SPAWN_PER_DECISION`, `REDVSBLUE_MAX_SPAWN_PER_MINUTE`, `REDVSBLUE_DECISION_COOLDOWN_MS`
  - [ ] Define “sensible bounds”:
    - [ ] Reject values that violate schema (e.g., negative, min > max, default outside range).
    - [ ] Produce a clear error string suitable for tests/logging (do not throw raw Zod internals without context).

- [ ] **3) Backend integration (no-default behavior unchanged)**
  - [ ] Update `src/backend/src/services/match-store.ts`:
    - [ ] Replace `RULE_RANGES`/`CONFIG_RANGES` with imports from `@copilot-playground/shared`.
    - [ ] Use shared defaults for `buildEffectiveRules()` and `buildEffectiveConfig()`.
    - [ ] (Optional) Load env overrides once at process startup and pass into clamping logic, or call a cached `loadRedVsBlueConfig()` helper.
  - [ ] Update `src/backend/src/services/decision-referee.ts`:
    - [ ] Replace local `DECISION_LIMITS` with shared import.
  - [ ] Ensure backend runtime still starts with no env overrides set.

- [ ] **4) Frontend integration (use shared defaults for proposals)**
  - [ ] Update `src/frontend/src/redvsblue/config/defaults.ts` to source from shared defaults (or replace file usage by direct imports).
  - [ ] Update `src/frontend/src/redvsblue/config/ui.ts` to source from shared defaults/ranges.
  - [ ] Ensure frontend only imports browser-safe exports (do not call `loadRedVsBlueConfig()` from browser code).
  - [ ] Confirm `RedVsBlue.tsx` proposed rules/config are populated from shared canonical defaults.

- [ ] **5) Tests**
  - [ ] Add unit tests for `loadRedVsBlueConfig()`:
    - [ ] No env overrides → equals canonical defaults.
    - [ ] Valid JSON blob override → applied and validated.
    - [ ] Valid scalar overrides → applied and validated.
    - [ ] Invalid overrides → return/throw a clear error (assert message contains which key failed).
  - [ ] Update backend tests that reference numeric literals:
    - [ ] Prefer importing the canonical constants/ranges from `@copilot-playground/shared`.
    - [ ] Assert behavior unchanged (clamping outcomes and decision validation warnings/rejections).
  - [ ] Optional integration-style test:
    - [ ] Start backend app with env overrides and assert `effectiveRules/effectiveConfig` reflect overrides (where observable).

- [ ] **6) Documentation & migration guidance**
  - [ ] Update `memory/designs/DES022-shared-redvsblue-config.md` status to `Implemented` (or move to `COMPLETED`) once done.
  - [ ] Add an operator note documenting:
    - [ ] Supported env vars (`REDVSBLUE_CONFIG`, key scalars).
    - [ ] “Do not change defaults mid-season” / reproducibility guidance (and future `rulesVersion` bump policy).
  - [ ] Add a short changelog note (file/location used elsewhere in the repo, if applicable).

- [ ] **7) Validation (commands to run)**
  - [ ] `pnpm -F @copilot-playground/shared lint` (if/when a lint script exists) or `pnpm -F @copilot-playground/backend lint`
  - [ ] `pnpm -F @copilot-playground/backend test`
  - [ ] `pnpm -F @copilot-playground/frontend test`
  - [ ] `pnpm -F @copilot-playground/backend build`
  - [ ] `pnpm -F @copilot-playground/frontend build`

- [ ] **8) Handoff**
  - [ ] Update `memory/tasks/TASK023-shared-redvsblue-config.md` progress log and mark status completed.
  - [ ] Update `memory/tasks/_index.md` to reflect completion.
  - [ ] Prepare PR summary:
    - [ ] Goal, key changes, validation run.
    - [ ] Link `DES022` and call out the canonical defaults decision + any user-visible gameplay impact.

## Progress Tracking

| ID  | Description                                  | Status   | Updated    | Notes |
| --- | -------------------------------------------- | -------- | ---------- | ----- |
| 1.1 | Shared config module + exports               | Pending  | 2026-01-25 |       |
| 1.2 | Env overrides (JSON + scalars)               | Pending  | 2026-01-25 |       |
| 1.3 | Backend imports + behavior parity            | Pending  | 2026-01-25 |       |
| 1.4 | Frontend defaults sourced from shared        | Pending  | 2026-01-25 |       |
| 1.5 | Tests updated/added                           | Pending  | 2026-01-25 |       |
| 1.6 | Docs + migration note                         | Pending  | 2026-01-25 |       |

## Progress Log

### 2026-01-25

- Created TASK023 with a progressive implementation checklist for DES022.

## Acceptance Criteria

- [ ] `@copilot-playground/shared` exports RedVsBlue config ranges/defaults/limits + Zod schema + `loadRedVsBlueConfig()`.
- [ ] Backend and frontend consume shared values; backend behavior is unchanged with no overrides.
- [ ] Supported env overrides work and are validated with clear errors for invalid values.
- [ ] Tests pass and docs include operational guidance about changing defaults.

