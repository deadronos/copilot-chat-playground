# 05 — MCP servers (Model Context Protocol)

MCP servers are external tool providers.
You can attach them per session using `mcpServers`.

## Local vs remote MCP

### Local (stdio)

- You run a command locally (or in Docker) that speaks MCP over stdio.
- Great for filesystem, git, local DB, etc.

### Remote (HTTP / SSE)

- You connect to an MCP server hosted elsewhere.
- Great for “shared services” like the **remote GitHub MCP server**.

## GitHub MCP Server

Two main choices:

- Remote GitHub MCP: `https://api.githubcopilot.com/mcp/`
- Local GitHub MCP (Docker image `ghcr.io/github/github-mcp-server`)

The repo has extensive configuration guidance including read-only mode and tool allowlists.

Source: <https://github.com/github/github-mcp-server>

## Safety recommendations

- Start with **read-only** toolsets.
- Enable the minimum toolsets/tools you need.
- Add a permission handler in your app and require explicit user approval for write actions.

## Sources

- Copilot SDK getting started (GitHub MCP example): <https://github.com/github/copilot-sdk/blob/main/docs/getting-started.md>
- GitHub MCP Server docs: <https://github.com/github/github-mcp-server>
- MCP servers directory: <https://github.com/modelcontextprotocol/servers>
