# DES019 - Playwright E2E Deferral (Phase 2)

**Status:** Draft  
**Created:** 2026-01-25  
**Owner:** Copilot Agent

## Summary
Defer Playwright E2E coverage for ChatPlayground streaming to a future task, aligning with docs/agents/testing guidance that E2E is out of scope for now.

## Scope
- Record the decision to defer Playwright tooling and E2E tests.
- Outline future E2E coverage targets and prerequisites.

## Non-Goals
- Adding Playwright configuration or dependencies in Phase 2.
- Writing E2E tests in this phase.

## Rationale
- Agent testing guidance notes that E2E is intentionally deferred and should be handled later.
- Phase 2 already adds unit and integration coverage for module splits.

## Future Work
- Add Playwright config + base fixtures.
- Implement streaming UI E2E: prompt submission, streaming output, error states.
- Include /api/chat streaming parity coverage with mocked backend if needed.

## Acceptance
- A new task references this design and adds Playwright tooling + tests when approved.
