# Copilot Chat Playground (local)

A local-only learning playground for experimenting with a small chat UI + backend + (eventually) Copilot integration.

This repo is a **pnpm workspace** with separate packages under `src/`.

## Packages

- `src/frontend` — Vite + React + shadcn/ui UI
- `src/backend` — Node.js API (streaming bridge; scaffold)
- `src/copilot` — Copilot CLI / Copilot SDK wrapper service (scaffold)
- `src/shared` — shared types/utilities (currently: `LogEvent` + NDJSON helper)

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
