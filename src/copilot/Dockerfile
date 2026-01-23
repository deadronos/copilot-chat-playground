# syntax=docker/dockerfile:1.7

# Dev-oriented Dockerfile for the copilot service.
#
# Notes:
# - We intentionally run `tsx watch` (the `dev` script) so workspace-local TS packages
#   like `@copilot-playground/shared` work without needing a separate build step.
# - Compose mounts a sandbox workspace at `/workspace`; the app itself lives in `/app`.

FROM node:20-bookworm-slim

WORKDIR /app

ARG PNPM_VERSION=10.28.1

RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate

# 1) Copy only manifests first for better layer caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY src/copilot/package.json ./src/copilot/package.json
COPY src/shared/package.json ./src/shared/package.json

# 2) Install only what copilot needs (and its workspace deps) with a cached pnpm store
RUN --mount=type=cache,target=/pnpm/store \
	pnpm config set store-dir /pnpm/store && \
	pnpm --filter @copilot-playground/copilot... install --frozen-lockfile --prod=false

# 3) Copy source
COPY src/copilot ./src/copilot
COPY src/shared ./src/shared

# Entrypoint exports DOTENV_PRIVATE_KEY_* from /run/secrets if present
RUN chmod +x /app/src/copilot/entrypoint.sh

ENV PORT=3210
EXPOSE 3210

ENTRYPOINT ["/app/src/copilot/entrypoint.sh"]
CMD ["pnpm", "--filter", "@copilot-playground/copilot", "dev"]
