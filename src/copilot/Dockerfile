# Multi-stage Dockerfile for copilot service
FROM node:20 AS base
WORKDIR /workspace
# Ensure Corepack (pnpm) is available
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy lockfile and package manifests to install dependencies (leverages caching)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY src/copilot/package.json ./src/copilot/package.json
COPY src/backend/package.json ./src/backend/package.json
COPY src/frontend/package.json ./src/frontend/package.json

# Install ALL dependencies including devDependencies (needed for TypeScript build)
RUN pnpm install --frozen-lockfile

# Copy source
COPY . .

# Build the TypeScript output for production
RUN pnpm -w build

# Final runtime image
FROM node:20-slim AS runtime
WORKDIR /workspace
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy minimal manifests for installing production dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY src/copilot/package.json ./src/copilot/package.json

# Install only production dependencies in the runtime image
RUN pnpm install --frozen-lockfile --prod

# Copy built artifacts from the builder (keep dist and src available)
COPY --from=base /workspace/dist ./dist
COPY --from=base /workspace/src ./src

# Copy entrypoint and make executable
COPY --from=base /workspace/src/copilot/entrypoint.sh /workspace/src/copilot/entrypoint.sh
RUN chmod +x /workspace/src/copilot/entrypoint.sh

# Ensure files are owned by the non-root node user and switch to it
RUN chown -R node:node /workspace
USER node

ENV PORT=3210
EXPOSE 3210

ENTRYPOINT ["/workspace/src/copilot/entrypoint.sh"]
CMD ["pnpm", "--filter", "@copilot-playground/copilot", "start"]
