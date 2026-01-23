# 00 — Overview & mental model

## What the Copilot SDK is

The **GitHub Copilot SDK** provides language SDKs (Node.js, Python, Go, .NET) that talk to the **GitHub Copilot CLI** using **JSON-RPC**.

The most useful way to think about it:

- The **Copilot CLI** is the “agent runtime” (it knows how to talk to Copilot services, stream events, run tools, etc.)
- The **Copilot SDK** is a typed client around that runtime (spawn/manage the CLI process, expose `createSession`, events, tools, MCP servers, etc.)

> The Copilot CLI must be installed separately.

## Key concepts

### Client

A `CopilotClient` owns the connection to the Copilot CLI runtime (either via stdio to a spawned process, or by connecting to an existing CLI server).

### Session

A `session` is a conversation. You send messages, get events, and optionally let it call tools.

### Events

When `streaming: true`, you receive deltas (partial tokens) and “final” events.
Treat *deltas* as UI sugar and *final events* as the canonical transcript.

### Tools

Tools are functions your app provides (like `search_repo` or `read_file`) that the model can request.

### MCP servers

MCP servers are external tool providers (local stdio or remote HTTP/SSE) that Copilot can call.
The GitHub MCP Server is a common MCP server for repo + PR operations.

## Which language should you use?

For this repo, we’re doing **Node.js/TypeScript** in `src/copilot` because:

- our frontend and backend are TS
- Node has strong streaming primitives
- examples and cookbook coverage are very good

## Sources

- Copilot SDK repo: <https://github.com/github/copilot-sdk>
- Getting started: <https://github.com/github/copilot-sdk/blob/main/docs/getting-started.md>
