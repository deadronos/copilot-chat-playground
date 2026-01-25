# TASK021 - Playwright E2E Coverage (Deferred from Phase 2)

**Status:** Pending  
**Added:** 2026-01-25  
**Updated:** 2026-01-25

## Original Request
Defer Playwright E2E coverage for ChatPlayground streaming and capture it as a future task.

## Requirements (EARS)
- WHEN Playwright tooling is added, THE SYSTEM SHALL provide a base config, fixtures, and a smoke E2E test for ChatPlayground streaming. [Acceptance: Playwright tests run in CI locally]
- WHEN streaming UI is exercised, THE SYSTEM SHALL verify streaming output, error states, and copy/export actions. [Acceptance: E2E test assertions pass]

## Implementation Plan (Checklist)
- [ ] Add Playwright dependencies and config for the monorepo.
- [ ] Add fixtures/utilities for backend mocking or local service wiring.
- [ ] Implement ChatPlayground E2E spec covering streaming, errors, and actions.
- [ ] Wire Playwright to CI and document usage.

## Acceptance Criteria
- Playwright tests pass locally and in CI.
- Documentation updated with E2E instructions.

## References
- Design: `memory/designs/DES019-playwright-e2e-deferral.md`

## Progress Log
### 2026-01-25
- Task created based on Playwright deferral decision.
