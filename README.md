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
