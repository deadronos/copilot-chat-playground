# 08 — Errors, retries, and lifecycle

## Session lifecycle checklist

Per session:

- subscribe to events (`session.on`)
- send prompts
- on user cancel: `session.abort()`
- when finished: `session.destroy()`

Per process:

- on shutdown: `client.stop()`

## Common failure modes

- Copilot CLI not installed / not found
- Not authenticated (no login and no `GH_TOKEN`)
- Network / rate limits
- Tool failures (your code)
- MCP server unavailable

## Design recommendation for a playground

- Convert all internal errors to a structured error event sent to the UI log stream
- Keep sensitive details on the server

## Sources

- Cookbook (error handling recipe list): <https://github.com/github/copilot-sdk/blob/main/cookbook/README.md>
