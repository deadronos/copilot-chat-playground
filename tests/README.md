# Tests Overview

This workspace stores all package tests under `/tests` so discovery stays consistent across
frontend, backend, and copilot packages.

## Folder layout

```
tests/
  frontend/
    unit/
    component/
    integration/
  backend/
    unit/
    component/
    integration/
  copilot/
    unit/
    component/
    integration/
```

## Where to place tests

- Frontend tests live in `tests/frontend/**` and should focus on React components, hooks,
  UI utilities, and DOM behavior.
- Backend tests live in `tests/backend/**` and should cover API handlers, validation, and
  service logic.
- Copilot tests live in `tests/copilot/**` and should cover wrapper logic and SDK/CLI
  integration helpers.

## Test type guidance

- `unit/`: fast, isolated tests for functions and small modules.
- `component/`: component-level UI tests (frontend) or module composition tests.
- `integration/`: cross-module or HTTP-level tests that still run in Vitest.

## Naming & discovery

Vitest configs for each package only discover tests under their folder. Use
`*.test.ts`, `*.test.tsx`, `*.spec.ts`, or `*.spec.tsx` file names.

## Running tests

From the repo root:

```
pnpm --filter @copilot-playground/frontend test
pnpm --filter @copilot-playground/backend test
pnpm --filter @copilot-playground/copilot test
```
