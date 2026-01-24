# Copilot Service

This service provides an HTTP API for GitHub Copilot chat completions using either:
- **Copilot SDK** (default) - Structured streaming with full event support
- **Copilot CLI** (fallback) - Direct CLI spawning for simpler use cases

## Architecture

The service uses the **@github/copilot-sdk** for structured event streaming and extensibility. The SDK communicates with the Copilot CLI via JSON-RPC, providing:

- Type-safe session management
- Structured event streaming (deltas, final messages, tool calls, etc.)
- Built-in error handling and retries
- Support for tools and MCP servers
- EventBus infrastructure for log aggregation and export

The CLI fallback mode is available by setting `USE_COPILOT_SDK=false` in the environment.

## Setup

### 1. Install Copilot CLI

The `@github/copilot` npm package is included as a dependency and will be installed automatically when you run `pnpm install`.

### 2. Configure Authentication

The service requires a GitHub Personal Access Token (PAT) with **Copilot Requests** permission.

#### Create a PAT

1. Go to [GitHub Settings > Personal Access Tokens](https://github.com/settings/personal-access-tokens/new)
2. Create a new **fine-grained** personal access token
3. Grant it the **Copilot Requests** permission
4. Copy the token

#### Set the Token

Create a `.env` file in the repository root with:

```bash
GH_TOKEN=your_personal_access_token_here
```

> Note: For local development the Copilot service will load `.env` automatically when started (it reads `.env` from the package directory). For containerized deployments, inject the token into the container environment at runtime.


Or export it in your shell:

```bash
export GH_TOKEN=your_personal_access_token_here
```

**Note**: The service also accepts `GITHUB_TOKEN` as a fallback, but `GH_TOKEN` takes precedence.

### Docker / Compose token injection (recommended)

This repo’s root `docker-compose.yml` passes `GH_TOKEN`/`GITHUB_TOKEN` through to the `copilot` container **if** they are set in your shell (or in the Compose `.env` file).

#### Option A: Compose `.env` (dev-friendly)

1. Create a repo-root `.env` (already gitignored):

```dotenv
GH_TOKEN=ghp_your_token_here
```

1. Start the stack:

```bash
docker compose up --build
```

#### Option B: Docker secrets (production-safe)

For a secrets-first path, mount the token as a Docker secret (file) and let the container entrypoint export it.

1. Create a local secret file (do **not** commit):

- `./secrets/GH_TOKEN` (file contents = your token)

1. Create a local compose override (do **not** commit):

```yaml
# docker-compose.override.yml
services:
  copilot:
    secrets:
      - GH_TOKEN

secrets:
  GH_TOKEN:
    file: ./secrets/GH_TOKEN
```

The container entrypoint reads `/run/secrets/GH_TOKEN` (and `/run/secrets/GITHUB_TOKEN` if provided) and exports them as environment variables before starting the service.

> Guardrail: avoid passing tokens on the CLI (e.g. `docker run -e GH_TOKEN=...`) except as a dev-only convenience.

### dotenvx keys in Docker (optional)

If you use `dotenvx` encrypted env files (e.g. committing encrypted `.env.production`), inject decryption keys at runtime via Docker secrets:

- Secret file name must match the env var name, e.g. `/run/secrets/DOTENV_PRIVATE_KEY_PRODUCTION`

The entrypoint will export any `/run/secrets/DOTENV_PRIVATE_KEY_*` files into `DOTENV_PRIVATE_KEY_*` env vars.

See repo guidance: `docs/library/dotenvx/README.md`.

## Running the Service

### Development Mode

```bash
pnpm --filter @copilot-playground/copilot dev
```

The service will start on `http://localhost:3210` by default.

#### Switching between SDK and CLI modes

By default, the service uses the Copilot SDK. To use CLI mode instead:

```bash
USE_COPILOT_SDK=false pnpm --filter @copilot-playground/copilot dev
```

### Production Mode

```bash
pnpm --filter @copilot-playground/copilot build
pnpm --filter @copilot-playground/copilot start
```

## API Endpoints

### Health Check

```bash
GET /health
```

Response:

```json
{
  "ok": true,
  "service": "copilot",
  "mode": "sdk",
  "tokenConfigured": true,
  "binaryAvailable": true,
  "candidates": [...]
}
```

### Chat Completion

```bash
POST /chat
Content-Type: application/json

{
  "prompt": "What is GitHub Copilot?"
}
```

**Success Response (200)**:

```json
{
  "output": "GitHub Copilot is an AI pair programmer..."
}
```

**Error Responses**:

- **400 Bad Request**: Invalid request body
- **401 Unauthorized**: Authentication failed (invalid token)
- **503 Service Unavailable**: Missing token configuration
- **500 Internal Server Error**: Copilot CLI spawn failure

## Error Handling

The service provides clear, actionable error messages:

### Missing Token

```json
{
  "error": "Missing GitHub token. Set GH_TOKEN or GITHUB_TOKEN environment variable with a PAT that has 'Copilot Requests' permission.",
  "errorType": "token_missing"
}
```

### Authentication Failure

```json
{
  "error": "Authentication failed...",
  "errorType": "auth"
}
```

## Security

- The token is **never** exposed to clients
- All token validation happens server-side
- The service only responds with sanitized error messages or the Copilot output

## Testing

Run unit tests:

```bash
pnpm --filter @copilot-playground/copilot test
```

Run integration tests (requires service to be running):

```bash
pnpm --filter @copilot-playground/copilot dev # in one terminal
pnpm --filter @copilot-playground/copilot test # in another terminal
```

## Implementation Details

### SDK Mode (default)

- Uses `@github/copilot-sdk` for structured event streaming
- Creates CopilotClient instances that communicate with the CLI via JSON-RPC
- Handles streaming events (deltas, final messages, tool calls, errors)
- Provides EventBus for structured logging and observability
- Automatically manages session lifecycle (create, send, wait, destroy)
- Supports extending with tools and MCP servers

### CLI Mode (fallback)

- Uses Node.js `child_process.spawn()` to call the Copilot CLI directly
- Buffers stdout/stderr for responses
- Falls back to `pnpm exec -- copilot` if binary not in PATH
- Simpler but less structured than SDK mode

### EventBus

The service includes a lightweight EventBus for structured event logging:

- Emits structured log events with `timestamp`, `level`, `component`, `request_id`, `session_id`, `event_type`, `message`, and `meta`
- Enables correlation across components via `request_id` and `session_id`
- Can be extended to support SSE/WebSocket streaming to frontend
- Supports export of logs as NDJSON or JSON
