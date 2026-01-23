# Copilot Service

This service wraps the GitHub Copilot CLI to provide an HTTP API for chat completions.

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

Or export it in your shell:

```bash
export GH_TOKEN=your_personal_access_token_here
```

**Note**: The service also accepts `GITHUB_TOKEN` as a fallback, but `GH_TOKEN` takes precedence.

## Running the Service

### Development Mode

```bash
pnpm --filter @copilot-playground/copilot dev
```

The service will start on `http://localhost:3210` by default.

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
  "tokenConfigured": true
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

- Uses Node.js `child_process.spawn()` to call the Copilot CLI
- Buffers stdout/stderr for non-streaming responses (Milestone B)
- Future: Will support streaming responses (Milestone C)
