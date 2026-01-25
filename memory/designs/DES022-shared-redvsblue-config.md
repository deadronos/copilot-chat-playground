# DES022 — Shared RedVsBlue Config

**Status:** Draft
**Date:** 2026-01-25
**Related:** DES012 (AI Director contracts), DES018 (monolith refactor)

## Overview

Extract the hard-coded rule ranges, config ranges, and decision limits used by RedVsBlue into a canonical, shared configuration package so both frontend and backend import the same values. Provide validation (Zod schema), sensible defaults, and environment-variable overrides for operator tuning.

This reduces drift (UI vs server), centralizes change, and makes testing and runtime tuning safer and explicit.

---

## Requirements (EARS)

1. WHEN the system initializes, THE SHARED CONFIG PACKAGE SHALL expose rule ranges, config ranges, and decision limits with Zod validation and defaults.  
   Acceptance: import values in a small script and run schema validation; defaults are used when env overrides are absent.

2. WHEN the frontend needs defaults (e.g., UI default proposal), THE FRONTEND SHALL import canonical defaults from `@copilot-playground/shared`.  
   Acceptance: replace local UI constants with imports and run UI tests.

3. WHEN the backend enforces limits (clamping / decision referee), THE BACKEND SHALL import limits from shared and keep behavior unchanged.  
   Acceptance: existing tests referencing numeric limits continue to pass without modification in behavior (tests updated to import constants where necessary).

4. WHEN an operator sets an env override, THE SHARED PACKAGE SHALL accept those values and prioritize them (with Zod validation + sensible bounds).  
   Acceptance: set env vars in test environment and observe new effective values applied at runtime.

5. WHEN the config changes, THE SYSTEM SHALL have tests and migration notes documenting the change and effects on persisted sessions.  
   Acceptance: design doc and a changelog entry are present; migration risk/DON'T-DO list included.

---

## Design

### Location
- New module in shared package: `packages/shared/src/config/redvsblue-config.ts` (or `src/redvsblue-config.ts` depending on monorepo layout). Export a typed `RedVsBlueConfig` and individual constants.
- Export both runtime getters and a `loadConfig()` helper that reads env overrides and returns the validated config.

### API (example)

```ts
// packages/shared/src/config/redvsblue-config.ts
import { z } from "zod";

export const RuleRangeSchema = z.object({
  min: z.number().finite(),
  max: z.number().finite(),
  default: z.number().finite(),
});

export const RedVsBlueConfigSchema = z.object({
  ruleRanges: z.object({
    shipSpeed: RuleRangeSchema,
    bulletSpeed: RuleRangeSchema,
    bulletDamage: RuleRangeSchema,
    shipMaxHealth: RuleRangeSchema,
  }),
  configRanges: z.object({
    snapshotIntervalMs: RuleRangeSchema,
  }),
  decisionLimits: z.object({
    maxSpawnPerDecision: z.number().int().positive(),
    maxSpawnPerMinute: z.number().int().positive(),
    cooldownMs: z.number().int().positive(),
  }),
});

export type RedVsBlueConfig = z.infer<typeof RedVsBlueConfigSchema>;

export const DEFAULT_REDVSBUE_CONFIG: RedVsBlueConfig = { /* defaults copied from current code */ };

export function loadConfig(): RedVsBlueConfig { /* read env, merge into defaults, validate with Zod */ }
```

### Runtime usage
- Backend `match-store.ts` & `decision-referee.ts` import `loadConfig()` or direct constants from `@copilot-playground/shared` and use values for clamping and validation.
- Frontend `RedVsBlue.tsx` and UI defaults import values to populate proposed rules and UI ranges.

### Env overrides
- Support env vars prefixed with `REDVSBLUE_` (e.g., `REDVSBLUE_SHIP_SPEED_DEFAULT`, `REDVSBLUE_SNAPSHOT_INTERVAL_MS_MIN`) or a single `REDVSBLUE_CONFIG` JSON blob for advanced use.
- Document recommended overrides and operational guidance.

---

## Migration & Compatibility

- No migration required for persisted sessions — sessions store `effectiveRules` and `effectiveConfig`. However, changing defaults may alter the `effectiveRules` returned for new matches.
- Add a migration/decision note: "Do not change defaults mid-season; treat changes as breaking for match reproducibility. Consider adding `rulesVersion` bump when changing defaults."

---

## Tests & Validation

- Unit tests for `loadConfig()` (env present/absent/invalid) with mocked env.
- Replace numeric literals used in tests with imported constants where appropriate. Add tests that assert behavior unchanged after extraction (e.g., clamping tests still pass).
- Integration test: start server with env overrides and assert `effectiveRules` reflect overrides and Zod validation rejects out-of-bounds env values.

---

## Tasks (implementation plan)

1. Create `packages/shared/src/config/redvsblue-config.ts` with schema, defaults, `loadConfig()`.
2. Add exports to `packages/shared/src/index.ts` (or equivalent) so backend and frontend can import.
3. Update backend files:
   - Replace `RULE_RANGES`, `CONFIG_RANGES`, and `DEFAULT_TOKEN_BUDGET` references with imports.
   - Keep behavior identical; add tests to import constants.
4. Update `decision-referee.ts` to import `DECISION_LIMITS` from shared.
5. Update frontend `RedVsBlue.tsx` to import defaults for proposed rules and `DEFAULT_UI_CONFIG` if relevant.
6. Add unit & integration tests for `loadConfig()` and updated imports. Update existing tests to use constants instead of hard-coded numbers.
7. Update docs: `memory/designs/DES012`, `memory/designs/DES018`, and changelog entry.
8. Open PR with changes and link to this design doc.

---

## Acceptance Criteria

- [ ] `packages/shared` exposes a `redvsblue` config module with Zod schema and `loadConfig()`.
- [ ] Backend and frontend import and use shared config values; tests updated and passing.
- [ ] Env overrides work and are validated; invalid overrides return clear errors in tests.
- [ ] Design docs updated and PR includes changelog + decision note about default changes.

---

## Risks & Notes

- Changing defaults affects new matches; document `rulesVersion` bump policy.
- Keep defaults conservative to avoid surprising gameplay changes.

---

## Next steps
- After design approval, implement extraction as a small series of commits (one-per-area) using TDD and update tests.
- Consider adding a runtime warning when an env override is applied in production to aid operational visibility.
