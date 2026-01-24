# Tech Context

**Languages & frameworks:**
- Node.js (TypeScript), Vite, pnpm, Vitest for unit tests.

**Infrastructure & tooling:**
- Docker & Docker Compose for local stack orchestration.
- `dotenvx` for encrypted environment files (secrets-first pattern).
- `pnpm` workspace for multi-package management (frontend, backend, copilot, shared).

**CI & tests:**
- Vitest configs in each package; integration tests live in `tests/` and `copilot/` test folders.
- Recommended: add CI checks for secrets handling and Compose startup for integration tests (see `TASK009`).

**Constraints & compatibility:**
- Docker development targets local devs on Windows/macOS/Linux; docs describe platform caveats.
- Avoid committing encrypted key material; follow repository guidance for `dotenvx` encrypted `.env` and `DOTENV_PRIVATE_KEY_*` usage.
