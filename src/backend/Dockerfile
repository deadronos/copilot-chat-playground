# syntax=docker/dockerfile:1.7

FROM node:20-bookworm-slim

WORKDIR /app

ARG PNPM_VERSION=10.28.1

# pnpm via Corepack (pinned for reproducibility)
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate

# 1) Copy only manifests first for better layer caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY src/backend/package.json ./src/backend/package.json

# Optional but harmless: keep workspace layout stable for pnpm
COPY src/shared/package.json ./src/shared/package.json

# 2) Install only what backend needs (and its workspace deps) with a cached pnpm store
RUN --mount=type=cache,target=/pnpm/store \
    pnpm config set store-dir /pnpm/store && \
    pnpm --filter @copilot-playground/backend... install --frozen-lockfile --prod=false

# 3) Copy actual source
COPY src/backend ./src/backend
COPY src/shared ./src/shared

ENV PORT=3000
EXPOSE 3000

CMD ["pnpm", "--filter", "@copilot-playground/backend", "dev"]
