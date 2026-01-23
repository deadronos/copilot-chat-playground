# DES008 — Docker service separation & pnpm build caching

**Status:** Implemented  
**Added:** 2026-01-23  

## Context

Current `docker-compose.yml` builds only the `copilot` service and runs `backend`/`frontend` from a plain `node:20` image with a bind mount, running `pnpm install` on every container start.

This causes:

- slow startup and repeated dependency installs
- inconsistent runtime environments between services
- limited Docker layer caching benefits

## Goals

- Provide **separate Dockerfiles** for `frontend`, `backend`, and `copilot`.
- Optimize dependency install layers for pnpm workspace to maximize caching.
- Keep `docker compose up --build` working as a dev-friendly workflow.

## Non-goals

- Production-grade deployment hardening (K8s, non-root everywhere, image scanning).
- Converting the dev workflow to full production builds (we keep Vite/tsx watch).

## Design

### Build contexts

All services use the **repo root** as build context so pnpm workspaces can resolve shared packages and the root lockfile.

Each service selects its own Dockerfile:

- `src/backend/Dockerfile`
- `src/frontend/Dockerfile`
- `src/copilot/Dockerfile` (updated)

### Dependency layer caching

Dockerfiles use a two-step copy strategy:

1) Copy only `package.json` / lockfiles and package manifests needed for the service.
2) Run `pnpm install` (filtered) so the layer can be reused when app source changes.

Where supported (BuildKit), we use cache mounts for the pnpm store:

- `RUN --mount=type=cache,target=/pnpm/store ... pnpm install ...`

### Dev runtime

Containers run service dev commands:

- backend: `pnpm --filter @copilot-playground/backend dev`
- frontend: `pnpm --filter @copilot-playground/frontend dev -- --host 0.0.0.0`
- copilot: existing entrypoint + dev/start depending on service intent

`docker-compose.yml` uses named volumes for `/workspace/node_modules` to prevent bind mounts from hiding installed deps.

## Risks / Mitigations

- **Risk:** pnpm filtered install misses transitive workspace deps.
  - **Mitigation:** use `--filter <pkg>...` (include dependencies) and copy required workspace manifests (e.g., `src/shared/package.json`).
- **Risk:** Bind mounting `./:/workspace` can shadow `node_modules`.
  - **Mitigation:** mount `node_modules` as a volume at `/workspace/node_modules`.
