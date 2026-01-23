# DES002 - Vitest Config & Test Layout

## Analyze
- Goal: separate Vitest configs per package while storing tests in a shared `/tests` tree.
- Scope: frontend/backend/copilot test discovery, folder scaffolding, and scripts.
- Constraints: keep tests under `/tests/<package>/{unit,component,integration}`; no e2e yet.

## EARS Requirements
- When running frontend tests, the runner shall only discover files under `/tests/frontend/**`.
- When running backend tests, the runner shall only discover files under `/tests/backend/**`.
- When running copilot tests, the runner shall only discover files under `/tests/copilot/**`.
- Test folders shall include `unit`, `component`, and `integration` subdirectories for each package.

## Design
- Add `vitest.config.ts` inside each package.
- Use absolute include patterns pointing at the shared `/tests` folders.
- Frontend uses `jsdom` environment; backend/copilot use `node`.

## Implement
- Create folders and keep them tracked with `.gitkeep`.
- Add per-package `vitest.config.ts` files.

## Validate
- Manual: run `pnpm --filter @copilot-playground/frontend test` and confirm only frontend tests run.
- Manual: repeat for backend/copilot.
