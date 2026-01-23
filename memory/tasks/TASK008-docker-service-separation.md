# TASK008 — Docker service separation & caching

**Status:** Completed  
**Added:** 2026-01-23  
**Updated:** 2026-01-23

## Original Request

"please use separate docker file and adress this" — split docker build per service and improve layer caching for node_modules.

## Requirements (EARS)

- WHEN running `docker compose up --build`, THE SYSTEM SHALL build **separate images** for `frontend`, `backend`, and `copilot`.
- WHEN application source files change but dependency manifests do not, THE SYSTEM SHALL reuse cached Docker layers so `pnpm install` is not rerun unnecessarily.
- WHEN running the dev stack, THE SYSTEM SHALL not run `pnpm install` on every container start.

## Implementation Plan

1. Add `src/backend/Dockerfile` and `src/frontend/Dockerfile` using pnpm workspace + filtered installs.
2. Update `src/copilot/Dockerfile` to use filtered installs and pnpm store caching.
3. Update `docker-compose.yml` to build all 3 services, and use volumes for `/workspace/node_modules`.
4. Validate `docker compose build` and `docker compose up`.

## Progress Tracking

**Overall Status:** Completed — 100%

### Subtasks

| ID  | Description                      | Status      | Updated    | Notes                      |
| :-- | :------------------------------- | :---------- | :--------- | :------------------------- |
| 1.1 | Draft design + requirements      | Complete    | 2026-01-23 | DES008 + EARS requirements |
| 1.2 | Add backend/frontend Dockerfiles | Complete    | 2026-01-23 |                            |
| 1.3 | Update compose + validate        | Complete    | 2026-01-23 |                            |

## Progress Log

### 2026-01-23

- Documented design in `memory/designs/DES008-docker-service-separation.md`.
- Added separate Dockerfiles for `backend` and `frontend`, and refactored `copilot` Dockerfile for pnpm caching.
- Updated `.dockerignore` so nested pnpm `node_modules` are excluded from the build context.
- Updated `docker-compose.yml` to build images per service and fixed the `copilot` healthcheck.
- Fixed `src/copilot/entrypoint.sh` so it does not exit under Debian `dash`.
- Removed an accidentally committed secret from `src/copilot/.env`.
