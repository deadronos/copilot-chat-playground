# [TASK007] - Milestone E: Workspace Mount + Compose + Secrets

**Status:** Completed ✅  
**Added:** 2026-01-23  
**Updated:** 2026-01-24

## Original Request

Plan and implement Milestone E: mount `./workspace` into the copilot container at `/workspace` (read-only), run with `WORKDIR /workspace`, provide full Docker Compose, and document safe dotenvx key handling.

## Thought Process

This milestone enables safe file access for prompts while keeping secrets and write access out of the container by default. The implementation should be minimal and safe-by-default, with an explicit follow-up for read/write access. Documentation must emphasize `.env.keys` privacy and runtime secret injection (Docker secrets / secret manager). Compose wiring should ensure backend points to the copilot service by name.

## Implementation Plan

- [ ] Draft full Docker Compose topology (frontend + backend + copilot).
- [ ] Add copilot container image/Dockerfile with `WORKDIR /workspace`.
- [ ] Mount `./workspace:/workspace:ro` in copilot service.
- [ ] Configure backend `COPILOT_SERVICE_URL` to `http://copilot:3210` in Compose.
- [ ] Document dotenvx secrets-first runtime key injection.
- [ ] Add `.dockerignore` updates if needed to avoid `.env.keys`.
- [ ] Verify local end-to-end flow (prompt reads mounted file).

## Progress Tracking

**Overall Status:** Completed - 100% ✅


### Subtasks (detailed)

- [ ] **Define Compose services & networking**
  - [ ] Create `docker-compose.yml` with `frontend`, `backend`, `copilot` services.
  - [ ] Ensure ports: `5173`, `3000`, `3210` are mapped correctly.
  - [ ] Use service DNS names for inter-service calls (backend → `http://copilot:3210`).

- [ ] **Copilot container image**
  - [ ] Add `Dockerfile` for `src/copilot` (Node base image, pnpm install, build/start).
  - [ ] Set `WORKDIR /workspace` and verify `process.cwd()` reflects it.
  - [ ] Ensure `@github/copilot` CLI availability if using CLI mode.

- [ ] **Workspace mount (read-only)**
  - [ ] Add Compose mount `./workspace:/workspace:ro` for copilot service.
  - [ ] Add a guardrail note that read/write is deferred.
  - [ ] Add a runtime check or log message to confirm mount visibility.

- [ ] **Secrets & dotenvx guidance**
  - [ ] Document encrypted `.env.production` usage and `.env.keys` privacy.
  - [ ] Add secrets-first pattern for `DOTENV_PRIVATE_KEY_*` via Docker secrets/mounted file.
  - [ ] Provide a local-dev fallback note for `environment:` only.

- [ ] **Documentation updates**
  - [ ] Update root `README.md` with link to dotenvx guidance.
  - [ ] Add a Docker/Compose section for Milestone E in repo docs.
  - [ ] Include explicit warning against `curl | sh` for production builds.

- [ ] **Testing & validation**
  - [ ] Manual test: start Compose and prompt against a file in `/workspace`.
  - [ ] Manual test: verify write to `/workspace` fails.
  - [ ] Manual test: backend reaches copilot by service name.
  - [ ] (Optional) Add integration test for workspace read access.

## Progress Log

### 2026-01-23

- Task created with detailed subtasks and safety focus.

### 2026-01-24

- Implemented workspace mount, `WORKDIR /workspace`, Compose wiring, and dotenvx secrets-first documentation.
- Commits: `886301f8`, `2a5c6a3`, `3cdb2ae`, `695bfe2`, `31a1063`, `e37b033` (see GitHub history).  
- Verified manual tests: copilot can read files in `/workspace`, write attempts fail, backend resolves `http://copilot:3210`.
- Updated root docs and design `DES007` to Completed.

