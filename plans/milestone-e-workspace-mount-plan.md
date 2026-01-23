# Plan: Milestone E workspace mount + compose

Deliver a safe-by-default Docker Compose stack with a copilot container that mounts `./workspace` as read-only at `/workspace`, runs with `WORKDIR /workspace`, and documents dotenvx secrets handling. Includes minimal runtime checks and guardrails.

## Phases 1–3

1. **Phase 1: Container + Compose scaffolding**
   - **Objective:** Add a copilot Docker image and a full-stack Compose configuration.
   - **Files/Functions to Modify/Create:** root `docker-compose.yml`, `src/copilot/Dockerfile`, `src/copilot/entrypoint.*`
   - **Tests to Write:** N/A (config-only changes)
   - **Steps:**
     1. Add a copilot Dockerfile with `WORKDIR /workspace`.
     2. Add an entrypoint that injects dotenvx secrets from `/run/secrets/*` if present.
     3. Create Compose services for frontend/backend/copilot with correct ports and `COPILOT_SERVICE_URL`.

2. **Phase 2: Workspace mount + guardrails**
   - **Objective:** Ensure `/workspace` is mounted read-only and validate visibility at startup.
   - **Files/Functions to Modify/Create:** `src/copilot/src/*` (mount check helper + log), `docker-compose.yml`
   - **Tests to Write:** Unit test for mount-check helper (fs access + read-only behavior)
   - **Steps:**
     1. Add a small helper that detects `/workspace` readability and logs status.
     2. Write a unit test for the helper using fs mocks.
     3. Wire the helper into copilot startup.

3. **Phase 3: Documentation + ignores**
   - **Objective:** Document secrets-first dotenvx usage and protect `.env.keys`.
   - **Files/Functions to Modify/Create:** `README.md`, docs (new or existing), `.dockerignore`, `.gitignore`
   - **Tests to Write:** N/A (docs/ignore updates)
   - **Steps:**
     1. Add dotenvx secrets guidance (Docker secrets + runtime injection).
     2. Add Docker/Compose section for Milestone E.
     3. Update ignore rules for `.env.keys` and related files.

## Open Questions

1. Should Compose target dev-only or include a production-oriented variant?
2. Prefer dotenvx via `dotenvx run` or via exporting `DOTENV_PRIVATE_KEY_*` in entrypoint?
3. OK to add a lightweight runtime mount check log on copilot startup?
4. Should `./workspace` be optional (commented by default) or required in Compose?
