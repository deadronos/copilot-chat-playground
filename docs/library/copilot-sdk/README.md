# GitHub Copilot SDK — Local Notes (Playground)

These notes are a **learning-focused** guide for using the GitHub Copilot SDK in this repository.
They are written for the project layout in this repo:

- `src/frontend` (Vite/React)
- `src/backend` (API gateway / streaming bridge)
- `src/copilot` (Copilot SDK + Copilot CLI adapter)
- `src/shared` (shared types, including our `LogEvent`)

> The upstream Copilot SDK is a *technical preview* and can change. Always cross-check the official docs linked below.

## Start here

1. **Overview & mental model** → [`00-overview.md`](./00-overview.md)
2. **Install + authenticate (Copilot CLI + GH_TOKEN)** → [`01-installation-auth.md`](./01-installation-auth.md)
3. **Node.js quickstart (sessions + sendAndWait)** → [`02-nodejs-quickstart.md`](./02-nodejs-quickstart.md)

## Core topics

- Streaming & events → [`03-streaming-events.md`](./03-streaming-events.md)
- Tools (defineTool + ToolResultObject) → [`04-tools.md`](./04-tools.md)
- MCP servers (local stdio vs remote http/sse) → [`05-mcp.md`](./05-mcp.md)
- System message & guardrails → [`06-system-message-and-guardrails.md`](./06-system-message-and-guardrails.md)
- Provider/BYOK config → [`07-provider-byok.md`](./07-provider-byok.md)
- Lifecycle, abort, shutdown, errors → [`08-errors-retries-lifecycle.md`](./08-errors-retries-lifecycle.md)

## For *this* repo

- Suggested 3-service architecture (frontend/backend/copilot) → [`09-playground-architecture.md`](./09-playground-architecture.md)
- Logging + exporting logs in the UI → [`10-observability-logging.md`](./10-observability-logging.md)

## Primary references

- Copilot SDK repo: <https://github.com/github/copilot-sdk>
- Getting started: <https://github.com/github/copilot-sdk/blob/main/docs/getting-started.md>
- Node SDK README: <https://github.com/github/copilot-sdk/blob/main/nodejs/README.md>
- Cookbook: <https://github.com/github/copilot-sdk/blob/main/cookbook/README.md>
- Copilot CLI install/auth: <https://docs.github.com/en/copilot/how-tos/set-up/install-copilot-cli>
- GitHub MCP Server: <https://github.com/github/github-mcp-server>
- MCP servers directory: <https://github.com/modelcontextprotocol/servers>
