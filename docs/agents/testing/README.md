# Testing Guidance for Agents

This folder documents how agents should reason about and structure tests in this repo.
Tests are organized under `/tests` and mapped to packages.

## Where tests live

- Frontend: `/tests/frontend`
- Backend: `/tests/backend`
- Copilot: `/tests/copilot`

Each package has `unit`, `component`, and `integration` subfolders. Keep test scope
aligned with the subfolder name to avoid slow or brittle runs.

## Suggested test scopes

- **Unit**: pure logic, helpers, small functions, schema validation.
- **Component**: UI behavior, DOM interactions, local component state.
- **Integration**: multiple modules, API handlers with in-memory dependencies, or
  service wiring.

## Notes

- End-to-end tests are intentionally out of scope here and will be handled later (Playwright).
- Keep tests close to the package boundary they validate.
- Prefer stable, deterministic inputs and avoid network calls.
