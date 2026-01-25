# TASK020 - Refactor: Monolithic files — Phase 3 (Cleanup, docs & CI guardrails)

**Status:** In Progress  
**Added:** 2026-01-25  
**Updated:** 2026-01-25
**Design:** DES020-refactor-monoliths-phase-3.md

## Original Request
Finalize the refactor by documenting the new module layout, adding CI and coverage rules, and final cleanup.

## Requirements (EARS)
- WHEN refactor is complete, THE SYSTEM SHALL have design docs in `memory/designs/` describing module boundaries and rationale. [Acceptance: design docs added and referenced in PRs]
- WHEN adding CI checks, THE SYSTEM SHALL enforce coverage thresholds for modified packages and ensure routers stay thin. [Acceptance: CI passes and checks enforced]

## Implementation Plan (Checklist)
- [ ] Documentation & design
  - [x] Add design doc(s) in `memory/designs/` describing new module boundaries and rationale.
  - [x] Link design docs in task files and reference in PR descriptions.
- [ ] CI guardrails
  - [x] Add coverage thresholds for modified packages (frontend/backend/copilot).
  - [x] Add lint rule or script to warn on oversized files / router logic in `app.ts`.
  - [x] Ensure CI fails when thresholds are violated.
- [ ] Cleanup & polish
  - [x] Update README and relevant docs to reflect new module layout.
  - [x] Remove deprecated exports or unused files from the pre-refactor layout.
  - [ ] Verify no dead imports and run typecheck/tests.

## Acceptance Criteria
- Docs and CI changes merged and verified on main
- PR review approval by maintainer(s)

## GitHub Issue
https://github.com/deadronos/copilot-chat-playground/issues/61

## Progress Log
### 2026-01-25
- Task created and linked to Issue #61.
### 2026-01-25
- Added DES020 documenting module boundaries and guardrails.
- Added CI coverage thresholds and router thinness guard, plus workflow wiring.
- Updated README module layout notes and removed unused frontend example components.
