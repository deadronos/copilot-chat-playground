# TASK020 - Refactor: Monolithic files — Phase 3 (Cleanup, docs & CI guardrails)

**Status:** Pending  
**Added:** 2026-01-25  
**Updated:** 2026-01-25

## Original Request
Finalize the refactor by documenting the new module layout, adding CI and coverage rules, and final cleanup.

## Requirements (EARS)
- WHEN refactor is complete, THE SYSTEM SHALL have design docs in `memory/designs/` describing module boundaries and rationale. [Acceptance: design docs added and referenced in PRs]
- WHEN adding CI checks, THE SYSTEM SHALL enforce coverage thresholds for modified packages and ensure routers stay thin. [Acceptance: CI passes and checks enforced]

## Implementation Plan
- Add design doc(s) to `memory/designs/DES***-refactor-*` and link to RFC
- Configure CI to enforce coverage and add lint rules for file sizes or router responsibilities
- Update README and docs, remove legacy artifacts

## Acceptance Criteria
- Docs and CI changes merged and verified on main
- PR review approval by maintainer(s)

## GitHub Issue
https://github.com/deadronos/copilot-chat-playground/issues/61

## Progress Log
### 2026-01-25
- Task created and linked to Issue #61.
