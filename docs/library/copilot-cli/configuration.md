# Configuration — GitHub Copilot CLI ⚙️

Location & purpose

- User-level configuration: `~/.copilot/mcp-config.json`.
- The config specifies MCP servers, their commands, arguments, and environment variables used by the CLI to connect to custom MCP servers.

Example `mcp-config.json`

```json
{
  "mcpServers": {
    "my-server": {
      "command": "my-mcp-server",
      "args": ["--port", "3000"],
      "env": {
        "GITHUB_ACCESS_TOKEN": "${GITHUB_TOKEN}",
        "API_KEY": "${MY_API_KEY}"
      }
    }
  }
}
```

Environment variables

- `GH_TOKEN` (preferred) and `GITHUB_TOKEN` — Personal Access Token for authentication.
- Tools installed by the shell script may require PATH adjustments (e.g., `~/.local/bin`).

Notes

- When configuring MCP servers, avoid placing secrets in plaintext in version-controlled files — use environment variables or secret managers and reference them in the JSON config.
- The CLI uses configured MCP servers to support extended functionality and custom agents.

Source: Official docs.
