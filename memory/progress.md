# Progress

**What works:**
- Frontend, backend, and copilot services run locally in development.
- Milestone A–D implemented; Milestone E (workspace mount + secrets) implemented on 2026-01-24.

**What's left / Next:**
- Complete Milestone F: switch to Copilot SDK (`TASK004`) and validate with integration tests.
- Add automated tests for secrets handling and Compose startup (`TASK009`).
- Add CI validation steps for SDK and Compose integration.
- Execute monolith refactor Phase 1 (`TASK018`) and verify test coverage.
- Finish monolith refactor Phase 3 (`TASK020`) by running typecheck/tests and confirming CI guardrails.
- Plan Playwright E2E implementation (`TASK021`) when ready.

**Known issues:**
- Read/write workspace mounts are deferred and require explicit opt-in.
- CI coverage for Compose startup and secret handling is not yet implemented.

**Notes:** Update progress as tasks move between In Progress and Completed states in `/memory/tasks/_index.md`.
