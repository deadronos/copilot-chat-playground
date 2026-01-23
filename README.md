# Copilot Chat Playground (local)

A local-only learning playground for experimenting with a small chat UI + backend + (eventually) Copilot integration.

This repo is a **pnpm workspace** with separate packages under `src/`.

## Packages

- `src/frontend` — Vite + React + shadcn/ui UI
- `src/backend` — Node.js API (streaming bridge; scaffold)
- `src/copilot` — **Copilot SDK** / Copilot CLI wrapper service (uses SDK by default)
- `src/shared` — shared types/utilities (LogEvent, EventBus, NDJSON helper)

### Copilot Service Modes

The copilot service supports two modes:

1. **SDK Mode** (default): Uses `@github/copilot-sdk` for structured streaming with full event support
2. **CLI Mode**: Direct CLI spawning for simpler use cases

Set `USE_COPILOT_SDK=false` in your environment to use CLI mode.

## Secrets & dotenvx

For Docker/Compose usage with encrypted `.env` files, see the repo guidance in [`docs/library/dotenvx/README.md`](docs/library/dotenvx/README.md). It documents safe-by-default key handling, recommended secret injection patterns, and install options.

**Tip:** Commit a `.env.example` or `.env.sample` (without secrets) that documents required environment variables and example shapes. Do not commit actual `.env` files or any real secrets — use `.env.example` solely as a reference for developers.

### Docker / Compose

For running containers (including Milestone E workspace mounts) prefer a **secrets-first** approach: keep `.env.keys` out of source control and inject private keys at runtime using Docker secrets or a secrets manager. Avoid baking private keys into images or embedding them in committed Compose files. See [`docs/milestone-e-workspace-mount.md`](docs/milestone-e-workspace-mount.md) for workspace-mount specific guidance and warnings. For an end-to-end quick start and troubleshooting steps, see the Docker setup guide: [`docs/docker-setup-guide.md`](docs/docker-setup-guide.md).

**Docker build tip:** When installing dependencies inside Docker, prefer deterministic installs by using a frozen lockfile. Example in a Dockerfile:

```dockerfile
RUN corepack enable && pnpm install --frozen-lockfile --prod
```

Keeping `pnpm-lock.yaml` available to Docker builds helps ensure reproducible images (do not add it to `.dockerignore` if you expect it to be used during image builds).

## Getting started

1. Enable pnpm via Corepack (recommended)

   - `corepack enable`

2. Install deps

   - `pnpm install`

3. Run everything in dev

   - `pnpm dev`

### Run just one service

- `pnpm dev:frontend`
- `pnpm dev:backend`
- `pnpm dev:copilot`
